import React, { useState, useEffect, useCallback } from 'react';
import { GlassContainer } from './GlassContainer';
import { Board } from './Board';
import { Player, GameState, UserProfile, ChallengeRequest } from '../types';
import { ArrowLeft, Globe, Zap, Swords, Radio, Loader2, Wifi, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import {
  collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc,
  serverTimestamp, query, where, orderBy, limit, increment
} from 'firebase/firestore';

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// Generate stars for the background
const stars = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  delay: Math.random() * 3,
  duration: Math.random() * 2 + 2,
}));

// Generate latitude/longitude line positions
const latLines = [20, 35, 50, 65, 80];
const lngLines = [0, 30, 60, 90, 120, 150];

function timeAgo(timestamp: any): string {
  if (!timestamp?.toDate) return 'just now';
  const seconds = Math.floor((Date.now() - timestamp.toDate().getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function LiveArena({ onBack, userProfile }: { onBack: () => void; userProfile: UserProfile }) {
  const [challenges, setChallenges] = useState<ChallengeRequest[]>([]);
  const [myChallenge, setMyChallenge] = useState<ChallengeRequest | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string>('');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [timeNow, setTimeNow] = useState(Date.now());

  const userId = auth.currentUser?.uid;

  // Update time display every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => setTimeNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen to open challenges
  useEffect(() => {
    const q = query(
      collection(db, 'challenges'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: ChallengeRequest[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ChallengeRequest);
      });
      setChallenges(list);

      // Check if my challenge was accepted
      const mine = list.find((c) => c.hostId === userId);
      if (mine) {
        setMyChallenge(mine);
      }
    });

    return () => unsub();
  }, [userId]);

  // Listen for my challenge being accepted (status changes)
  useEffect(() => {
    if (!myChallenge?.id) return;

    const unsub = onSnapshot(doc(db, 'challenges', myChallenge.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ChallengeRequest;
        if (data.status === 'accepted' && data.acceptedBy) {
          // Someone accepted! Start the game
          setGameId(data.gameId);
          setIsBroadcasting(false);
        }
      }
    });

    return () => unsub();
  }, [myChallenge?.id]);

  // Listen to game state when in a game
  useEffect(() => {
    if (!gameId) return;
    const unsub = onSnapshot(doc(db, 'games', gameId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GameState;
        setGameState(data);

        const isHost = userId === data.hostId;
        const mySymbol = isHost ? 'X' : 'O';
        setIsMyTurn(data.turn === mySymbol && data.status === 'playing' && !data.winner);
      }
    });
    return () => unsub();
  }, [gameId, userId]);

  // Update stats on game finish
  useEffect(() => {
    if (gameState?.status === 'finished' && gameState.winner && userId) {
      const hasUpdated = localStorage.getItem(`game_${gameId}_stats_updated`);
      if (!hasUpdated) {
        const userRef = doc(db, 'users', userId);
        if (gameState.winner === 'draw') {
          updateDoc(userRef, { draws: increment(1), score: increment(10) });
        } else if (gameState.winner === userId) {
          updateDoc(userRef, { wins: increment(1), score: increment(50) });
        } else {
          updateDoc(userRef, { losses: increment(1) });
        }
        localStorage.setItem(`game_${gameId}_stats_updated`, 'true');
      }
    }
  }, [gameState?.status, gameState?.winner, gameId, userId]);

  const sendChallenge = async () => {
    if (!userId || isBroadcasting) return;
    setIsBroadcasting(true);

    const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const challengeId = Math.random().toString(36).substring(2, 10);

    // Create the game
    const newGame: GameState = {
      hostId: userId,
      guestId: null,
      hostNickname: userProfile.nickname,
      guestNickname: null,
      board: Array(9).fill(null),
      turn: 'X',
      status: 'waiting',
      winner: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Create the challenge
    const newChallenge: ChallengeRequest = {
      hostId: userId,
      hostNickname: userProfile.nickname,
      gameId: newGameId,
      status: 'open',
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'games', newGameId), newGame);
      await setDoc(doc(db, 'challenges', challengeId), newChallenge);
      setMyChallenge({ ...newChallenge, id: challengeId });
    } catch (err) {
      console.error('Failed to send challenge:', err);
      setIsBroadcasting(false);
    }
  };

  const cancelChallenge = async () => {
    if (!myChallenge?.id) return;
    try {
      await updateDoc(doc(db, 'challenges', myChallenge.id), { status: 'expired' });
      setMyChallenge(null);
      setIsBroadcasting(false);
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  const acceptChallenge = async (challenge: ChallengeRequest) => {
    if (!userId || !challenge.id) return;

    try {
      // Update challenge
      await updateDoc(doc(db, 'challenges', challenge.id), {
        status: 'accepted',
        acceptedBy: userId,
        acceptedByNickname: userProfile.nickname,
      });

      // Join the game
      await updateDoc(doc(db, 'games', challenge.gameId), {
        guestId: userId,
        guestNickname: userProfile.nickname,
        status: 'playing',
        updatedAt: serverTimestamp(),
      });

      setGameId(challenge.gameId);
    } catch (err) {
      console.error('Failed to accept challenge:', err);
    }
  };

  const checkWinner = (squares: Player[]) => {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    if (!squares.includes(null)) return 'draw';
    return null;
  };

  const handleMove = async (index: number) => {
    if (!gameState || !userId || gameState.status !== 'playing' || gameState.winner) return;

    const isHost = userId === gameState.hostId;
    const isGuest = userId === gameState.guestId;

    if ((isHost && gameState.turn !== 'X') || (isGuest && gameState.turn !== 'O')) return;
    if (gameState.board[index]) return;

    const newBoard = [...gameState.board];
    newBoard[index] = gameState.turn;

    const win = checkWinner(newBoard);
    const nextTurn = gameState.turn === 'X' ? 'O' : 'X';

    const updates: Partial<GameState> = {
      board: newBoard,
      turn: nextTurn,
      updatedAt: serverTimestamp(),
    };

    if (win) {
      updates.status = 'finished';
      updates.winner = win === 'draw' ? 'draw' : userId;
    }

    await updateDoc(doc(db, 'games', gameId), updates);
  };

  const leaveGame = () => {
    setGameState(null);
    setGameId('');
    setMyChallenge(null);
    setIsBroadcasting(false);
  };

  // ─── GAME BOARD VIEW ─────────────────────────────────────────────
  if (gameState && gameState.status !== 'waiting') {
    const isHost = userId === gameState.hostId;
    const mySymbol = isHost ? 'X' : 'O';
    const opponentSymbol = isHost ? 'O' : 'X';
    const myTurn = gameState.turn === mySymbol;
    const getPlayerColor = (s: string) => (s === 'X' ? 'text-emerald-400' : 'text-rose-400');
    const getRingColor = (s: string) =>
      s === 'X'
        ? 'ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
        : 'ring-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.3)]';

    return (
      <div className="w-full max-w-md mx-auto">
        <button onClick={leaveGame} className="mb-6 flex items-center text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Leave Game
        </button>
        <GlassContainer>
          <div className="flex justify-between items-center mb-8 gap-4">
            <div className={`flex-1 text-center p-4 rounded-2xl transition-all duration-300 ${myTurn && !gameState.winner ? `bg-white/10 ring-2 ${getRingColor(mySymbol)}` : 'bg-black/20 opacity-60'}`}>
              <div className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-1 truncate">
                {isHost ? gameState.hostNickname : gameState.guestNickname} (You)
              </div>
              <div className={`text-3xl font-bold ${getPlayerColor(mySymbol)}`}>{mySymbol}</div>
              {myTurn && !gameState.winner && (
                <div className={`text-xs mt-2 font-bold animate-pulse ${getPlayerColor(mySymbol)}`}>YOUR TURN</div>
              )}
            </div>

            <div className="text-center px-2 flex-shrink-0">
              <div className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-1">Status</div>
              <div className="text-sm font-medium text-white whitespace-nowrap">
                {gameState.winner
                  ? gameState.winner === 'draw'
                    ? 'Draw!'
                    : gameState.winner === userId
                    ? '🏆 You Win!'
                    : 'You Lose!'
                  : 'Playing'}
              </div>
            </div>

            <div className={`flex-1 text-center p-4 rounded-2xl transition-all duration-300 ${!myTurn && !gameState.winner ? `bg-white/10 ring-2 ${getRingColor(opponentSymbol)}` : 'bg-black/20 opacity-60'}`}>
              <div className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-1 truncate">
                {isHost ? gameState.guestNickname : gameState.hostNickname}
              </div>
              <div className={`text-3xl font-bold ${getPlayerColor(opponentSymbol)}`}>{opponentSymbol}</div>
              {!myTurn && !gameState.winner && (
                <div className={`text-xs mt-2 font-bold animate-pulse ${getPlayerColor(opponentSymbol)}`}>THINKING...</div>
              )}
            </div>
          </div>

          <Board
            board={gameState.board}
            onClick={handleMove}
            disabled={!myTurn || gameState.status !== 'playing' || gameState.winner !== null}
          />

          {gameState.winner && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={leaveGame}
              className="w-full mt-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-xl font-semibold transition-all border border-cyan-500/30"
            >
              Back to Live Arena
            </motion.button>
          )}
        </GlassContainer>
      </div>
    );
  }

  // ─── LIVE ARENA VIEW ──────────────────────────────────────────────
  const otherChallenges = challenges.filter((c) => c.hostId !== userId);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <button onClick={onBack} className="mb-6 flex items-center text-white/70 hover:text-white transition-colors z-20 relative">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Menu
      </button>

      {/* Player Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-3 mb-6"
      >
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 arena-pulse-dot" />
          <span className="text-white font-bold text-lg">{userProfile.nickname}</span>
          <span className="text-white/40 text-sm">•</span>
          <span className="text-emerald-400 text-sm font-medium">Online</span>
        </div>
      </motion.div>

      {/* Globe Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative flex items-center justify-center mb-8"
      >
        {/* Starfield */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full bg-white arena-twinkle"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`,
              }}
            />
          ))}
        </div>

        {/* Globe Container */}
        <div className="relative w-64 h-64 md:w-80 md:h-80">
          {/* Outer glow */}
          <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-3xl arena-glow-pulse" />

          {/* Globe sphere */}
          <div className="absolute inset-2 rounded-full overflow-hidden arena-globe-sphere">
            {/* Gradient surface */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/30 via-blue-600/20 to-indigo-900/40 border border-cyan-400/20" />

            {/* Atmosphere glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-transparent to-cyan-300/10" />

            {/* Latitude lines */}
            {latLines.map((top, i) => (
              <div
                key={`lat-${i}`}
                className="absolute left-1/2 -translate-x-1/2 border-t border-cyan-400/15 arena-lat-line"
                style={{
                  top: `${top}%`,
                  width: `${Math.sin((top / 100) * Math.PI) * 100}%`,
                }}
              />
            ))}

            {/* Longitude lines */}
            {lngLines.map((deg, i) => (
              <div
                key={`lng-${i}`}
                className="absolute top-0 left-1/2 h-full border-l border-cyan-400/10 arena-rotate-globe"
                style={{
                  transform: `translateX(-50%) rotateY(${deg}deg)`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}

            {/* Surface shimmer */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent arena-shimmer" />
          </div>

          {/* Orbital rings */}
          <div className="absolute inset-[-20px] rounded-full border border-cyan-400/10 arena-orbit" style={{ animationDuration: '20s' }} />
          <div className="absolute inset-[-35px] rounded-full border border-dashed border-blue-400/8 arena-orbit-reverse" style={{ animationDuration: '30s' }} />

          {/* Floating dots on orbit */}
          <div className="absolute inset-[-20px] arena-orbit" style={{ animationDuration: '20s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          </div>
          <div className="absolute inset-[-35px] arena-orbit-reverse" style={{ animationDuration: '30s' }}>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
          </div>

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <Globe className="w-12 h-12 text-cyan-300/60" />
              {isBroadcasting && (
                <>
                  <div className="absolute inset-0 arena-radar-ring" style={{ animationDelay: '0s' }} />
                  <div className="absolute inset-0 arena-radar-ring" style={{ animationDelay: '0.7s' }} />
                  <div className="absolute inset-0 arena-radar-ring" style={{ animationDelay: '1.4s' }} />
                </>
              )}
            </div>
          </div>

          {/* Challenge blips on globe */}
          {otherChallenges.slice(0, 5).map((ch, i) => {
            const angle = (i / Math.max(otherChallenges.length, 1)) * 360;
            const radius = 35;
            const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
            const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
            return (
              <motion.div
                key={ch.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] arena-pulse-dot"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Action Section */}
      <div className="space-y-4">
        {/* Send / Cancel Challenge */}
        {!isBroadcasting ? (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={sendChallenge}
            className="w-full py-5 rounded-2xl font-bold text-lg transition-all relative overflow-hidden group
                       bg-gradient-to-r from-cyan-500/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-600
                       text-white shadow-[0_0_30px_rgba(34,211,238,0.3)] border border-cyan-400/30"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <Zap className="w-6 h-6" />
              Send Challenge
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-white/10 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            <div className="w-full py-5 rounded-2xl font-bold text-lg text-center relative overflow-hidden
                            bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400/30
                            text-cyan-300"
            >
              <span className="flex items-center justify-center gap-3">
                <Radio className="w-5 h-5 animate-pulse" />
                Broadcasting Challenge...
                <Loader2 className="w-5 h-5 animate-spin" />
              </span>
            </div>
            <button
              onClick={cancelChallenge}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white
                         bg-white/5 hover:bg-red-500/20 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Live Challenges List */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="w-4 h-4 text-cyan-400" />
            <span className="text-white/60 text-sm uppercase tracking-widest font-semibold">
              Live Challenges
            </span>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
              {otherChallenges.length}
            </span>
          </div>

          {otherChallenges.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-white/30"
            >
              <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No challenges yet — be the first to send one!</p>
            </motion.div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto arena-scrollbar pr-1">
              <AnimatePresence mode="popLayout">
                {otherChallenges.map((ch, i) => (
                  <motion.div
                    key={ch.id}
                    initial={{ opacity: 0, x: -30, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 30, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10
                               hover:border-cyan-400/30 rounded-2xl p-4 flex items-center justify-between
                               transition-all duration-300 cursor-pointer"
                    onClick={() => acceptChallenge(ch)}
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-all duration-300" />

                    <div className="relative z-10 flex items-center gap-4">
                      {/* Avatar pulse */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-600/30
                                        flex items-center justify-center border border-amber-400/20">
                          <Swords className="w-6 h-6 text-amber-400" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 arena-pulse-dot" />
                      </div>

                      <div>
                        <div className="text-white font-bold text-base">{ch.hostNickname}</div>
                        <div className="text-white/40 text-xs">{timeAgo(ch.createdAt)}</div>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <div className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                                      bg-cyan-500/20 text-cyan-300 border border-cyan-400/20
                                      group-hover:bg-cyan-500/40 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                        ACCEPT
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

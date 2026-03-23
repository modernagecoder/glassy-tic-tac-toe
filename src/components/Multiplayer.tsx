import React, { useState, useEffect } from 'react';
import { GlassContainer } from './GlassContainer';
import { Board } from './Board';
import { Player, GameState, UserProfile } from '../types';
import { ArrowLeft, Copy, Check, Users, Loader2, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, onSnapshot, updateDoc, serverTimestamp, increment } from 'firebase/firestore';

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export function Multiplayer({ onBack, userProfile }: { onBack: () => void, userProfile: UserProfile }) {
  const [gameId, setGameId] = useState<string>('');
  const [joinId, setJoinId] = useState<string>('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!gameId) return;
    const unsub = onSnapshot(doc(db, 'games', gameId), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as GameState;
        setGameState(data);
      } else {
        setError('Game not found');
        setGameState(null);
      }
    });
    return () => unsub();
  }, [gameId]);

  const createGame = async () => {
    if (!userId) return;
    const newGameId = String(Math.floor(100000 + Math.random() * 900000));
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
      updatedAt: serverTimestamp()
    };
    
    try {
      await setDoc(doc(db, 'games', newGameId), newGame);
      setGameId(newGameId);
    } catch (err) {
      console.error(err);
      setError('Failed to create game');
    }
  };

  const joinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !joinId) return;
    
    try {
      const gameRef = doc(db, 'games', joinId.trim());
      await updateDoc(gameRef, {
        guestId: userId,
        guestNickname: userProfile.nickname,
        status: 'playing',
        updatedAt: serverTimestamp()
      });
      setGameId(joinId.trim());
    } catch (err) {
      console.error(err);
      setError('Failed to join game. It might be full or not exist.');
    }
  };

  const playAgain = async () => {
    if (!userId || !gameState) return;
    const newGameId = String(Math.floor(100000 + Math.random() * 900000));
    const isHost = userId === gameState.hostId;
    const opponentId = isHost ? gameState.guestId : gameState.hostId;
    const opponentNickname = isHost ? gameState.guestNickname : gameState.hostNickname;

    const newGame: GameState = {
      hostId: userId,
      guestId: opponentId,
      hostNickname: userProfile.nickname,
      guestNickname: opponentNickname,
      board: Array(9).fill(null),
      turn: 'X',
      status: 'playing',
      winner: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'games', newGameId), newGame);
      setGameId(newGameId);
    } catch (err) {
      console.error(err);
      setError('Failed to start rematch');
    }
  };

  const checkWinner = (squares: Player[]) => {
    for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
      const [a, b, c] = WINNING_COMBINATIONS[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
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
      updatedAt: serverTimestamp()
    };

    if (win) {
      updates.status = 'finished';
      updates.winner = win === 'draw' ? 'draw' : userId;
    }

    await updateDoc(doc(db, 'games', gameId), updates);
  };

  useEffect(() => {
    if (gameState?.status === 'finished' && gameState.winner) {
      // Only update once per game finish
      const hasUpdatedStats = localStorage.getItem(`game_${gameId}_stats_updated`);
      if (!hasUpdatedStats && userId) {
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

  const copyToClipboard = () => {
    const inviteMessage = `Play TACK with me! 🎮\nGo to https://tack.modernagecoders.com\nClick "Multiplayer" and use code: ${gameId}`;
    navigator.clipboard.writeText(inviteMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!gameState) {
    return (
      <div className="w-full max-w-md mx-auto">
        <button onClick={onBack} className="mb-6 flex items-center text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Menu
        </button>
        
        <GlassContainer>
          <div className="text-center mb-8">
            <Users className="w-12 h-12 mx-auto text-white/80 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Multiplayer</h2>
            <p className="text-white/60">Play with friends online</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">{error}</div>}

          <div className="space-y-6">
            <button
              onClick={createGame}
              className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all border border-white/10"
            >
              Create New Game
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-white/40 text-sm">OR</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <form onSubmit={joinGame} className="flex gap-2">
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Enter 6-digit code"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 text-center text-lg tracking-widest font-mono"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={joinId.length !== 6}
                className="px-6 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </form>
          </div>
        </GlassContainer>
      </div>
    );
  }

  const isHost = userId === gameState.hostId;
  const mySymbol = isHost ? 'X' : 'O';
  const opponentSymbol = isHost ? 'O' : 'X';
  const myTurn = gameState.turn === mySymbol;

  const getPlayerColor = (symbol: string) => symbol === 'X' ? 'text-emerald-400' : 'text-rose-400';
  const getRingColor = (symbol: string) => symbol === 'X' ? 'ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'ring-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.3)]';

  return (
    <div className="w-full max-w-md mx-auto">
      <button onClick={() => setGameState(null)} className="mb-6 flex items-center text-white/70 hover:text-white transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Leave Game
      </button>

      <GlassContainer>
        {gameState.status === 'waiting' ? (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 mx-auto text-white/50 animate-spin mb-6" />
            <h3 className="text-xl font-semibold text-white mb-2">Waiting for opponent...</h3>
            <p className="text-white/60 mb-6">Share this code with your friend</p>
            
            <div className="flex items-center justify-center gap-3 bg-black/20 p-4 rounded-2xl border border-white/10">
              <span className="text-3xl font-mono font-bold tracking-widest text-white">{gameId}</span>
              <button
                onClick={copyToClipboard}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                title="Copy Code"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8 gap-4">
              <div className={`flex-1 text-center p-4 rounded-2xl transition-all duration-300 ${myTurn && !gameState.winner ? `bg-white/10 ring-2 ${getRingColor(mySymbol)}` : 'bg-black/20 opacity-60'}`}>
                <div className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-1 truncate">
                  {isHost ? gameState.hostNickname : gameState.guestNickname} (You)
                </div>
                <div className={`text-3xl font-bold ${getPlayerColor(mySymbol)}`}>
                  {mySymbol}
                </div>
                {myTurn && !gameState.winner && (
                  <div className={`text-xs mt-2 font-bold animate-pulse ${getPlayerColor(mySymbol)}`}>YOUR TURN</div>
                )}
              </div>
              
              <div className="text-center px-2 flex-shrink-0">
                <div className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-1">Status</div>
                <div className="text-sm font-medium text-white whitespace-nowrap">
                  {gameState.winner ? (
                    gameState.winner === 'draw' ? 'Draw!' : gameState.winner === userId ? '🏆 You Win!' : 'You Lose!'
                  ) : (
                    'Playing'
                  )}
                </div>
              </div>

              <div className={`flex-1 text-center p-4 rounded-2xl transition-all duration-300 ${!myTurn && !gameState.winner ? `bg-white/10 ring-2 ${getRingColor(opponentSymbol)}` : 'bg-black/20 opacity-60'}`}>
                <div className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-1 truncate">
                  {isHost ? gameState.guestNickname : gameState.hostNickname}
                </div>
                <div className={`text-3xl font-bold ${getPlayerColor(opponentSymbol)}`}>
                  {opponentSymbol}
                </div>
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
              <div className="flex gap-3 mt-6">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={playAgain}
                  className="flex-1 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl font-semibold transition-all border border-emerald-500/30 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => setGameState(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl font-semibold transition-all border border-white/10"
                >
                  Leave Game
                </motion.button>
              </div>
            )}
          </>
        )}
      </GlassContainer>
    </div>
  );
}

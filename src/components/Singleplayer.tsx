import { useState, useEffect, useMemo } from 'react';
import { GlassContainer } from './GlassContainer';
import { Board } from './Board';
import { Player, UserProfile, BoardSize, BOARD_CONFIGS, generateWinCombinations } from '../types';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { db, auth } from '../firebase';
import { doc, updateDoc, increment, setDoc, serverTimestamp } from 'firebase/firestore';

export function Singleplayer({ onBack, userProfile }: { onBack: () => void, userProfile: UserProfile }) {
  const [boardSize, setBoardSize] = useState<BoardSize | null>(null);
  const [board, setBoard] = useState<Player[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<Player | 'draw'>(null);

  const config = boardSize ? BOARD_CONFIGS[boardSize] : null;
  const winCombos = useMemo(() => boardSize ? generateWinCombinations(boardSize) : [], [boardSize]);

  const checkWinner = (squares: Player[]) => {
    for (const combo of winCombos) {
      const first = squares[combo[0]];
      if (first && combo.every(i => squares[i] === first)) return first;
    }
    if (!squares.includes(null)) return 'draw';
    return null;
  };

  const handleWin = async (win: Player | 'draw') => {
    setWinner(win);
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    if (win === 'draw') {
      updateDoc(userRef, { draws: increment(1), score: increment(5) }).catch(console.error);
    } else if (win === 'X') {
      updateDoc(userRef, { wins: increment(1), score: increment(20) }).catch(console.error);
    } else if (win === 'O') {
      updateDoc(userRef, { losses: increment(1) }).catch(console.error);
    }

    const newGameId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const gameLog = {
      hostId: userId, guestId: 'AI',
      hostNickname: userProfile.nickname, guestNickname: 'Computer AI',
      board, turn: 'O', status: 'finished',
      winner: win === 'draw' ? 'draw' : win === 'X' ? userId : 'AI',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    };
    try { await setDoc(doc(db, 'games', newGameId), gameLog); } catch (err) { console.error(err); }
  };

  const handleMove = (index: number) => {
    if (board[index] || winner || !isPlayerTurn) return;
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsPlayerTurn(false);
    const win = checkWinner(newBoard);
    if (win) handleWin(win);
  };

  // AI logic — minimax for 3x3, heuristic for larger boards
  const getAiMove = (squares: Player[]): number => {
    if (!boardSize) return -1;

    if (boardSize === 3) {
      // Full minimax for 3x3
      let bestScore = -Infinity;
      let move = -1;
      for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) {
          squares[i] = 'O';
          const score = minimax(squares, 0, false, -Infinity, Infinity);
          squares[i] = null;
          if (score > bestScore) { bestScore = score; move = i; }
        }
      }
      return move;
    }

    // For 4x4 and 5x5: smart heuristic AI
    // 1. Win if possible
    for (let i = 0; i < squares.length; i++) {
      if (squares[i] === null) {
        squares[i] = 'O';
        if (checkWinner(squares) === 'O') { squares[i] = null; return i; }
        squares[i] = null;
      }
    }
    // 2. Block opponent win
    for (let i = 0; i < squares.length; i++) {
      if (squares[i] === null) {
        squares[i] = 'X';
        if (checkWinner(squares) === 'X') { squares[i] = null; return i; }
        squares[i] = null;
      }
    }
    // 3. Evaluate best position by scoring combos
    const scores = new Array(squares.length).fill(0);
    for (const combo of winCombos) {
      const cells = combo.map(i => squares[i]);
      const oCount = cells.filter(c => c === 'O').length;
      const xCount = cells.filter(c => c === 'X').length;
      const empty = cells.filter(c => c === null).length;

      if (xCount === 0 && empty > 0) {
        // AI can still win this line
        for (const i of combo) {
          if (squares[i] === null) scores[i] += (oCount + 1) * 10;
        }
      }
      if (oCount === 0 && empty > 0) {
        // Block opponent lines
        for (const i of combo) {
          if (squares[i] === null) scores[i] += (xCount + 1) * 8;
        }
      }
    }
    // Bias toward center
    const center = Math.floor(boardSize / 2);
    const centerIdx = center * boardSize + center;
    if (squares[centerIdx] === null) scores[centerIdx] += 15;

    let bestIdx = -1;
    let bestScore = -1;
    for (let i = 0; i < squares.length; i++) {
      if (squares[i] === null && scores[i] > bestScore) {
        bestScore = scores[i];
        bestIdx = i;
      }
    }
    // Fallback: random empty cell
    if (bestIdx === -1) {
      const emptyCells = squares.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    return bestIdx;
  };

  const minimax = (squares: Player[], depth: number, isMax: boolean, alpha: number, beta: number): number => {
    const result = checkWinner(squares);
    if (result === 'O') return 10 - depth;
    if (result === 'X') return depth - 10;
    if (result === 'draw') return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) {
          squares[i] = 'O';
          best = Math.max(best, minimax(squares, depth + 1, false, alpha, beta));
          squares[i] = null;
          alpha = Math.max(alpha, best);
          if (beta <= alpha) break;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) {
          squares[i] = 'X';
          best = Math.min(best, minimax(squares, depth + 1, true, alpha, beta));
          squares[i] = null;
          beta = Math.min(beta, best);
          if (beta <= alpha) break;
        }
      }
      return best;
    }
  };

  useEffect(() => {
    if (!isPlayerTurn && !winner && boardSize) {
      const timeout = setTimeout(() => {
        const newBoard = [...board];
        const move = getAiMove(newBoard);
        if (move !== -1) {
          newBoard[move] = 'O';
          setBoard(newBoard);
          const win = checkWinner(newBoard);
          if (win) handleWin(win);
          setIsPlayerTurn(true);
        }
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [isPlayerTurn, board, winner, boardSize]);

  const startGame = (size: BoardSize) => {
    setBoardSize(size);
    setBoard(Array(BOARD_CONFIGS[size].cells).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
  };

  const resetGame = () => {
    if (!boardSize) return;
    setBoard(Array(BOARD_CONFIGS[boardSize].cells).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
  };

  // ─── DIFFICULTY SELECTION ─────────────────────────────────────────
  if (!boardSize) {
    return (
      <div className="w-full max-w-md mx-auto">
        <button onClick={onBack} className="mb-6 flex items-center text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Menu
        </button>

        <GlassContainer>
          <div className="text-center mb-8">
            <Trophy className="w-12 h-12 mx-auto text-white/80 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Choose Difficulty</h2>
            <p className="text-white/60">Select your challenge level</p>
          </div>

          <div className="space-y-3">
            {([3, 4, 5] as BoardSize[]).map((size) => {
              const cfg = BOARD_CONFIGS[size];
              const colors: Record<string, string> = {
                emerald: 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-400',
                amber: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-400',
                rose: 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/30 text-rose-400',
              };
              return (
                <motion.button
                  key={size}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startGame(size)}
                  className={`w-full p-5 rounded-2xl border transition-all text-left ${colors[cfg.color]}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold">{cfg.emoji} {cfg.label}</div>
                      <div className="text-white/50 text-sm mt-0.5">{cfg.rules}</div>
                    </div>
                    <div className="text-2xl font-bold opacity-40">{size}×{size}</div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </GlassContainer>
      </div>
    );
  }

  // ─── GAME VIEW ─────────────────────────────────────────────
  return (
    <div className="w-full max-w-md mx-auto">
      <button
        onClick={() => setBoardSize(null)}
        className="mb-6 flex items-center text-white/70 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Change Difficulty
      </button>

      <GlassContainer>
        {/* Mode badge */}
        <div className="text-center mb-2">
          <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
            config!.color === 'emerald' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
            config!.color === 'amber' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
            'text-rose-400 bg-rose-500/10 border-rose-500/20'
          }`}>
            {config!.emoji} {config!.label} · {config!.rules}
          </span>
        </div>

        <div className="flex justify-between items-center mb-6 mt-4">
          <div className="text-center">
            <div className="text-sm text-white/50 uppercase tracking-widest font-semibold mb-1">You</div>
            <div className="text-2xl font-bold text-emerald-400">X</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-white/50 uppercase tracking-widest font-semibold mb-1">Status</div>
            <div className="text-lg font-medium text-white">
              {winner ? (
                winner === 'draw' ? 'Draw!' : winner === 'X' ? 'You Win!' : 'AI Wins!'
              ) : (
                isPlayerTurn ? 'Your Turn' : 'AI Thinking...'
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-white/50 uppercase tracking-widest font-semibold mb-1">AI</div>
            <div className="text-2xl font-bold text-rose-400">O</div>
          </div>
        </div>

        <Board board={board} onClick={handleMove} disabled={!isPlayerTurn || winner !== null} size={boardSize} />

        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-center gap-3"
          >
            <button
              onClick={resetGame}
              className="flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-all"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Play Again
            </button>
            <button
              onClick={() => setBoardSize(null)}
              className="flex items-center px-6 py-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-full font-medium transition-all"
            >
              Change Mode
            </button>
          </motion.div>
        )}
      </GlassContainer>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { GlassContainer } from './GlassContainer';
import { Board } from './Board';
import { Player, UserProfile } from '../types';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { db, auth } from '../firebase';
import { doc, updateDoc, increment, setDoc, serverTimestamp } from 'firebase/firestore';

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export function Singleplayer({ onBack, userProfile }: { onBack: () => void, userProfile: UserProfile }) {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<Player | 'draw'>(null);

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
      hostId: userId,
      guestId: 'AI',
      hostNickname: userProfile.nickname,
      guestNickname: 'Computer AI',
      board: board,
      turn: 'O',
      status: 'finished',
      winner: win === 'draw' ? 'draw' : win === 'X' ? userId : 'AI',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    try {
      await setDoc(doc(db, 'games', newGameId), gameLog);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMove = (index: number) => {
    if (board[index] || winner || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsPlayerTurn(false);

    const win = checkWinner(newBoard);
    if (win) {
      handleWin(win);
    }
  };

  const getBestMove = (squares: Player[]): number => {
    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (squares[i] === null) {
        squares[i] = 'O';
        let score = minimax(squares, 0, false);
        squares[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  };

  const minimax = (squares: Player[], depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(squares);
    if (result === 'O') return 10 - depth;
    if (result === 'X') return depth - 10;
    if (result === 'draw') return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = 'O';
          let score = minimax(squares, depth + 1, false);
          squares[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = 'X';
          let score = minimax(squares, depth + 1, true);
          squares[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const timeout = setTimeout(() => {
        const newBoard = [...board];
        const bestMove = getBestMove(newBoard);
        if (bestMove !== -1) {
          newBoard[bestMove] = 'O';
          setBoard(newBoard);
          
          const win = checkWinner(newBoard);
          if (win) {
            handleWin(win);
          }
          setIsPlayerTurn(true);
        }
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [isPlayerTurn, board, winner]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-white/70 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Menu
      </button>

      <GlassContainer>
        <div className="flex justify-between items-center mb-8">
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

        <Board board={board} onClick={handleMove} disabled={!isPlayerTurn || winner !== null} />

        {winner && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={resetGame}
              className="flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-all"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Play Again
            </button>
          </motion.div>
        )}
      </GlassContainer>
    </div>
  );
}

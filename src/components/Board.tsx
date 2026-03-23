import { motion } from 'motion/react';
import { Player, BoardSize } from '../types';

interface BoardProps {
  board: Player[];
  onClick: (index: number) => void;
  disabled?: boolean;
  size?: BoardSize;
}

export function Board({ board, onClick, disabled = false, size = 3 }: BoardProps) {
  const textSize = size === 3 ? 'text-5xl' : size === 4 ? 'text-3xl' : 'text-2xl';

  return (
    <div
      className={`grid gap-2 w-full max-w-sm mx-auto p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner`}
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
    >
      {board.map((cell, index) => (
        <motion.button
          key={index}
          whileHover={!disabled && !cell ? { scale: 1.05 } : {}}
          whileTap={!disabled && !cell ? { scale: 0.95 } : {}}
          onClick={() => !disabled && !cell && onClick(index)}
          className={`aspect-square rounded-xl flex items-center justify-center ${textSize} font-bold transition-all touch-none ${
            !cell && !disabled ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default'
          } ${
            cell === 'X' ? 'text-emerald-400' : cell === 'O' ? 'text-rose-400' : 'bg-white/5'
          }`}
          disabled={disabled || cell !== null}
        >
          {cell && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {cell}
            </motion.span>
          )}
        </motion.button>
      ))}
    </div>
  );
}

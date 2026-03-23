import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function GlassContainer({ children, className, delay = 0 }: GlassContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={cn(
        "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-6",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

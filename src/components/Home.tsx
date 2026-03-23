import { GlassContainer } from './GlassContainer';
import { UserProfile } from '../types';
import { User, Users, Trophy, Play } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  userProfile: UserProfile;
  onSelectMode: (mode: 'single' | 'multi' | 'leaderboard') => void;
}

export function Home({ userProfile, onSelectMode }: HomeProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <GlassContainer className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/50 uppercase tracking-widest font-semibold mb-1">Player</div>
            <div className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              {userProfile.nickname}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/50 uppercase tracking-widest font-semibold mb-1">Score</div>
            <div className="text-2xl font-bold text-emerald-400">{userProfile.score}</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm text-white/70">
          <span>Wins: <strong className="text-white">{userProfile.wins}</strong></span>
          <span>Losses: <strong className="text-white">{userProfile.losses}</strong></span>
          <span>Draws: <strong className="text-white">{userProfile.draws}</strong></span>
        </div>
      </GlassContainer>

      <div className="space-y-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectMode('single')}
          className="w-full p-6 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-3xl flex items-center gap-6 transition-all group"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
            <Play className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-white mb-1">Single Player</h3>
            <p className="text-white/60 text-sm">Play against the computer</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectMode('multi')}
          className="w-full p-6 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-3xl flex items-center gap-6 transition-all group"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/30 transition-colors">
            <Users className="w-8 h-8 text-rose-400" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-white mb-1">Multiplayer</h3>
            <p className="text-white/60 text-sm">Play with friends online</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectMode('leaderboard')}
          className="w-full p-6 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-3xl flex items-center gap-6 transition-all group"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-white mb-1">Leaderboard</h3>
            <p className="text-white/60 text-sm">View top players globally</p>
          </div>
        </motion.button>
      </div>
    </div>
  );
}

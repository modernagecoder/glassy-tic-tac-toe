import { useState } from 'react';
import { GlassContainer } from './GlassContainer';
import { UserProfile } from '../types';
import { User, Users, Trophy, Play, Edit2, Check, X, Loader2, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface HomeProps {
  userProfile: UserProfile;
  onSelectMode: (mode: 'single' | 'multi' | 'arena' | 'leaderboard') => void;
}

export function Home({ userProfile, onSelectMode }: HomeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState(userProfile.nickname);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = newNickname.trim();
    if (!trimmed || trimmed === userProfile.nickname || trimmed.length > 20) {
      setIsEditing(false);
      setNewNickname(userProfile.nickname);
      return;
    }
    
    setIsSaving(true);
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        await updateDoc(doc(db, 'users', userId), { nickname: trimmed });
      }
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <GlassContainer className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/50 uppercase tracking-widest font-semibold mb-1">Player</div>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  maxLength={20}
                  className="bg-black/20 border border-white/20 rounded-lg px-3 py-1 text-white text-lg focus:outline-none focus:border-emerald-500 w-40"
                  autoFocus
                />
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 rounded-lg transition-colors"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setNewNickname(userProfile.nickname);
                  }}
                  disabled={isSaving}
                  className="p-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                <span className="truncate max-w-[150px]">{userProfile.nickname}</span>
                <button 
                  onClick={() => {
                    setNewNickname(userProfile.nickname);
                    setIsEditing(true);
                  }}
                  className="p-1 text-white/40 hover:text-white transition-colors ml-1"
                  title="Edit Nickname"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
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
          onClick={() => onSelectMode('arena')}
          className="w-full p-6 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:from-cyan-500/20 hover:to-blue-600/20 backdrop-blur-md border border-cyan-400/30 hover:border-cyan-400/50 rounded-3xl flex items-center gap-6 transition-all group relative overflow-hidden"
        >
          {/* NEW badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
            </span>
            <span className="text-[10px] font-extrabold tracking-widest text-cyan-400 uppercase bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/30">NEW</span>
          </div>
          {/* LIVE indicator */}
          <div className="absolute bottom-3 right-3">
            <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE
            </span>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors relative">
            <Globe className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-white mb-1">Live Arena</h3>
            <p className="text-white/60 text-sm">Challenge anyone worldwide in real-time</p>
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

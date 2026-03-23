import { useState, useEffect } from 'react';
import { GlassContainer } from './GlassContainer';
import { UserProfile } from '../types';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export function Leaderboard({ onBack }: { onBack: () => void }) {
  const [leaders, setLeaders] = useState<(UserProfile & { id: string })[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('score', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile & { id: string }));
      setLeaders(data);
    });
    return () => unsub();
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <button onClick={onBack} className="mb-6 flex items-center text-white/70 hover:text-white transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Menu
      </button>

      <GlassContainer>
        <div className="text-center mb-8">
          <Trophy className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Global Leaderboard</h2>
          <p className="text-white/60">Top 10 Players</p>
        </div>

        <div className="space-y-3">
          {leaders.map((user, index) => (
            <div 
              key={user.id} 
              className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-slate-300 text-slate-800' :
                  index === 2 ? 'bg-amber-600 text-amber-100' :
                  'bg-white/10 text-white/60'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-semibold text-white">{user.nickname}</div>
                  <div className="text-xs text-white/50">
                    {user.wins}W - {user.losses}L - {user.draws}D
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-emerald-400">{user.score}</div>
                <div className="text-xs text-white/50 uppercase tracking-wider">PTS</div>
              </div>
            </div>
          ))}
          
          {leaders.length === 0 && (
            <div className="text-center text-white/50 py-8">
              No players yet. Be the first!
            </div>
          )}
        </div>
      </GlassContainer>
    </div>
  );
}

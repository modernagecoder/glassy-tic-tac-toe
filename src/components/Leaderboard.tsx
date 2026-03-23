import { useState, useEffect } from 'react';
import { GlassContainer } from './GlassContainer';
import { UserProfile, GameState } from '../types';
import { ArrowLeft, Trophy, History, Bot, Users } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export function Leaderboard({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'pvp' | 'pve'>('pvp');
  const [leaders, setLeaders] = useState<(UserProfile & { id: string })[]>([]);
  const [pvpMatches, setPvpMatches] = useState<(GameState & { id: string })[]>([]);
  const [pveMatches, setPveMatches] = useState<(GameState & { id: string })[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('score', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile & { id: string }));
      setLeaders(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'games'), orderBy('updatedAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameState & { id: string }));
      const finished = data.filter(g => g.status === 'finished');
      // PvP: games where guestId is NOT 'AI' and guestId exists (real player)
      setPvpMatches(finished.filter(g => g.guestId && g.guestId !== 'AI').slice(0, 5));
      // PvE: games where guestId IS 'AI'
      setPveMatches(finished.filter(g => g.guestId === 'AI').slice(0, 5));
    });
    return () => unsub();
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <button onClick={onBack} className="mb-6 flex items-center text-white/70 hover:text-white transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Menu
      </button>

      <GlassContainer>
        <div className="flex border-b border-white/10 mb-8">
          <button 
            className={`flex-1 py-4 text-center font-bold transition-all ${activeTab === 'pvp' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-white/50 hover:text-white'}`}
            onClick={() => setActiveTab('pvp')}
          >
            Player vs Player
          </button>
          <button 
            className={`flex-1 py-4 text-center font-bold transition-all ${activeTab === 'pve' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/50 hover:text-white'}`}
            onClick={() => setActiveTab('pve')}
          >
            Player vs AI
          </button>
        </div>

        {activeTab === 'pvp' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <Trophy className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Global Rankings</h2>
              <p className="text-white/60">All Players</p>
            </div>

            <div className="space-y-3 mb-10">
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

            <div className="text-center mb-6 border-t border-white/10 pt-8">
              <Users className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
              <h2 className="text-xl font-bold text-white mb-1">Recent PvP Matches</h2>
            </div>
            <div className="space-y-3">
              {pvpMatches.map((match) => {
                let resultText = '';
                if (match.winner === 'draw') resultText = 'Draw';
                else if (match.winner === match.hostId) resultText = `${match.hostNickname} Wins`;
                else resultText = `${match.guestNickname} Wins`;
                return (
                  <div key={match.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-sm font-semibold text-white truncate max-w-[70%]">
                      <span className={match.winner === match.hostId ? 'text-emerald-400' : 'text-white'}>{match.hostNickname}</span>
                      <span className="text-white/40 mx-3">vs</span>
                      <span className={match.winner === match.guestId ? 'text-rose-400' : 'text-white'}>{match.guestNickname}</span>
                    </div>
                    <div className="text-xs font-bold px-3 py-1 bg-white/10 rounded-full text-white/80 whitespace-nowrap">
                      {resultText}
                    </div>
                  </div>
                );
              })}
              {pvpMatches.length === 0 && <div className="text-center text-white/50 py-8">No recent PvP matches found.</div>}
            </div>
          </div>
        )}

        {activeTab === 'pve' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <Trophy className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">AI Rankings</h2>
              <p className="text-white/60">Top 10 Players</p>
            </div>

            <div className="space-y-3 mb-10">
              {leaders.slice(0, 10).map((user, index) => (
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

            <div className="text-center mb-6 border-t border-white/10 pt-8">
              <Bot className="w-8 h-8 mx-auto text-indigo-400 mb-2" />
              <h2 className="text-xl font-bold text-white mb-1">Recent AI Matches</h2>
            </div>
            <div className="space-y-3">
              {pveMatches.map((match) => {
                let resultText = '';
                if (match.winner === 'draw') resultText = 'Draw';
                else if (match.winner === match.hostId) resultText = `${match.hostNickname} Wins`;
                else resultText = 'AI Wins';
                return (
                  <div key={match.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-sm font-semibold text-white truncate max-w-[70%]">
                      <span className={match.winner === match.hostId ? 'text-emerald-400' : 'text-white'}>{match.hostNickname}</span>
                      <span className="text-white/40 mx-3">vs</span>
                      <span className={match.winner !== match.hostId && match.winner !== 'draw' ? 'text-rose-400' : 'text-white'}>AI</span>
                    </div>
                    <div className="text-xs font-bold px-3 py-1 bg-white/10 rounded-full text-white/80 whitespace-nowrap">
                      {resultText}
                    </div>
                  </div>
                );
              })}
              {pveMatches.length === 0 && <div className="text-center text-white/50 py-8">No recent AI matches found.</div>}
            </div>
          </div>
        )}
      </GlassContainer>
    </div>
  );
}

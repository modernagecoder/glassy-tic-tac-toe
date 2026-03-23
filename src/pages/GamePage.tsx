import React, { useState, useEffect } from 'react';
import { auth, db, signIn } from '../firebase';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Home } from '../components/Home';
import { Singleplayer } from '../components/Singleplayer';
import { Multiplayer } from '../components/Multiplayer';
import { Leaderboard } from '../components/Leaderboard';
import { LiveArena } from '../components/LiveArena';
import { GlassContainer } from '../components/GlassContainer';
import { Loader2, Gamepad2 } from 'lucide-react';

export function Game() {
  const [user, setUser] = useState(auth.currentUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [mode, setMode] = useState<'home' | 'single' | 'multi' | 'arena' | 'leaderboard'>('home');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (!user) {
        signIn().catch((err) => {
          console.error(err);
          setError("Anonymous Authentication is not enabled. Please enable it in the Firebase Console.");
          setLoading(false);
        });
      } else {
        const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.error(err);
          setError("Failed to read user profile. Please check Firebase rules.");
          setLoading(false);
        });
        return () => unsubProfile();
      }
    });
    return () => unsubscribe();
  }, []);

  const createProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !nicknameInput.trim() || nicknameInput.length > 20) return;
    
    setLoading(true);
    const newProfile: UserProfile = {
      nickname: nicknameInput.trim(),
      score: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      createdAt: serverTimestamp()
    };
    
    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-4 relative z-10">
        <div className="bg-red-500/20 border border-red-500/50 p-6 rounded-2xl max-w-md text-center">
          <h2 className="text-xl font-bold text-white mb-2">Setup Required</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <div className="text-white/80 text-sm text-left bg-black/20 p-4 rounded-xl">
            <p className="font-semibold mb-2">To fix this:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to the Firebase Console</li>
              <li>Select your project</li>
              <li>Go to <strong>Authentication</strong> &gt; <strong>Sign-in method</strong></li>
              <li>Enable <strong>Anonymous</strong> and save</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center relative z-10">
        <Loader2 className="w-12 h-12 text-white/50 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-4 relative z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 -z-10"></div>
        <div className="w-full max-w-md">
          <GlassContainer>
            <div className="text-center mb-8">
              <Gamepad2 className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-3 block">Welcome to TACK</h1>
              <p className="text-white/60 font-medium">Enter a nickname to start playing</p>
            </div>
            
            <form onSubmit={createProfile} className="space-y-4">
              <input
                type="text"
                placeholder="Your Nickname"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                maxLength={20}
                required
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-5 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors text-center text-lg md:text-xl font-medium"
              />
              <button
                type="submit"
                disabled={!nicknameInput.trim()}
                className="w-full py-5 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg md:text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Playing
              </button>
            </form>
          </GlassContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] p-4 md:p-8 flex flex-col items-center justify-center relative z-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 -z-10"></div>
      <div className="w-full max-w-4xl mx-auto">
        {mode === 'home' && <Home userProfile={profile} onSelectMode={setMode} />}
        {mode === 'single' && <Singleplayer onBack={() => setMode('home')} userProfile={profile} />}
        {mode === 'multi' && <Multiplayer onBack={() => setMode('home')} userProfile={profile} />}
        {mode === 'arena' && <LiveArena onBack={() => setMode('home')} userProfile={profile} />}
        {mode === 'leaderboard' && <Leaderboard onBack={() => setMode('home')} />}
      </div>
    </div>
  );
}

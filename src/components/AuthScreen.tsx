import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Activity, Mail, Lock } from 'lucide-react';


export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
      setError('');
      setGoogleLoading(true);
      const provider = new GoogleAuthProvider();
      try {
          await signInWithPopup(auth, provider);
      } catch (err: any) {
          setError(err.message || 'Google Authentication failed');
      } finally {
          setGoogleLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[12px] font-bold tracking-[0.2em] text-neutral-800 uppercase flex items-center justify-center gap-3 mb-4">
            Cost <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full"></span> Living
          </h1>
          <p className="text-neutral-500 text-sm">Offline-first tracking, everywhere you go.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
            <button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full py-3 bg-white border border-neutral-200 text-neutral-700 rounded-2xl font-semibold flex justify-center items-center gap-3 hover:bg-neutral-50 active:scale-[0.98] transition-all disabled:opacity-50 mb-6 relative overflow-hidden group"
            >
                {googleLoading ? <Activity size={18} className="animate-spin text-neutral-500" /> : (
                    <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </>
                )}
            </button>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-100"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-neutral-400 uppercase tracking-widest font-semibold">Or email</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider pl-1">Email</label>
                <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                    placeholder="doctor@example.com"
                />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider pl-1">Password</label>
                <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                    placeholder="••••••••"
                />
                </div>
            </div>

            {error && (
                <div className="text-red-500 text-xs text-center font-medium bg-red-50 p-2 rounded-xl">
                {error}
                </div>
            )}

            <button 
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3.5 mt-2 bg-neutral-900 text-white rounded-2xl font-semibold flex justify-center items-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50"
            >
                {loading ? <Activity size={18} className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
            </form>
        </div>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-neutral-500 hover:text-neutral-900 text-sm font-medium transition-colors cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

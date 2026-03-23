import React, { useState } from 'react';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  AuthError 
} from 'firebase/auth';
import { motion } from 'motion/react';
import { Shield, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      const authError = err as AuthError;
      if (isLogin) {
        setError("Email or password is incorrect.");
      } else {
        if (authError.code === 'auth/email-already-in-use') {
          setError("User already exists. Please sign in.");
        } else {
          setError(authError.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-accent/10 text-accent mb-4 border border-accent/20 accent-glow">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter">
            Break<span className="text-accent">Loop</span>
          </h1>
          <p className="text-white/40 text-sm">
            {isLogin ? "Welcome back, warrior." : "Start your journey to freedom."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="warrior@breakloop.app"
                className="w-full bg-card border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-card border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-fire text-xs font-medium text-center bg-fire/5 py-3 rounded-xl border border-fire/10"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-accent text-bg rounded-2xl font-bold text-sm shadow-lg shadow-accent/20 flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already a member? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

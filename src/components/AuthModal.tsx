import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Shield, Key, Mail, User as UserIcon, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  onAuthSuccess: (user: User, token: string) => void;
}

export default function AuthModal({ onAuthSuccess }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }
    if (isRegister && !name) {
      setError('Please provide your name.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const url = isRegister ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Authentication failed');

      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loginAsPreset = async (presetEmail: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: presetEmail })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>

        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="p-3 bg-zinc-800 border border-zinc-700 text-blue-400 rounded-xl">
            <Shield size={28} />
          </div>
          <h2 className="text-xl font-bold text-white font-sans tracking-tight">
            DevAI Portal Gateway
          </h2>
          <p className="text-zinc-400 text-xs font-mono">
            SECURE DEVELOPER WORKSPACE AUTHORIZATION
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-sans leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-zinc-400 text-xs font-mono block">DEVELOPER NAME</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Linus Torvalds"
                  className="w-full bg-zinc-950 text-white border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-700 font-sans"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-zinc-400 text-xs font-mono block">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@devai.com"
                className="w-full bg-zinc-950 text-white border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-700 font-sans"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 text-xs font-mono block">PASSWORD (OPTIONAL)</label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 text-white border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-700 font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-zinc-950 hover:bg-zinc-100 font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-colors duration-150 shadow-md mt-6"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Profile' : 'Authenticate Credentials'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="text-center mt-4">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-zinc-400 hover:text-white transition-colors underline"
          >
            {isRegister ? 'Already have credentials? Login' : 'First-time terminal setup? Register profile'}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900 px-3 text-zinc-500 font-mono">Bypass / Quick Authorization</span>
          </div>
        </div>

        {/* Preset Identity Selectors */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => loginAsPreset('admin@devai.com')}
            className="p-3 bg-zinc-950 hover:bg-zinc-900/50 border border-zinc-800 rounded-xl text-left space-y-1 transition-colors group"
          >
            <span className="text-xs font-bold text-blue-400 font-mono group-hover:text-blue-300">Lead Architect</span>
            <span className="text-[10px] text-zinc-500 block truncate">admin@devai.com</span>
          </button>
          
          <button
            onClick={() => loginAsPreset('developer@devai.com')}
            className="p-3 bg-zinc-950 hover:bg-zinc-900/50 border border-zinc-800 rounded-xl text-left space-y-1 transition-colors group"
          >
            <span className="text-xs font-bold text-purple-400 font-mono group-hover:text-purple-300">Junior Dev</span>
            <span className="text-[10px] text-zinc-500 block truncate">developer@devai.com</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

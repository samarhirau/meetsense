// src/pages/AuthPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User as UserIcon, AudioLines } from 'lucide-react';

interface AuthPageProps {
  defaultIsLogin?: boolean;
}

const AuthPage: React.FC<AuthPageProps> = ({ defaultIsLogin = true }) => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(defaultIsLogin);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  React.useEffect(() => {
    setIsLogin(defaultIsLogin);
    setError('');
  }, [defaultIsLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Premium ambient background glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#6366F1]/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#6366F1]/3 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 space-y-8 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-gradient-to-tr from-brand-accent to-brand-accent/80 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-brand-accent/15">
            <AudioLines className="w-6 h-6 text-brand-bg" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-display text-brand-text-primary">
            MeetSense
          </h1>
          <p className="text-brand-text-muted text-[10px] font-mono tracking-widest uppercase mt-2.5">
            Meetings happen. MeetSense remembers.
          </p>
        </div>

        {/* Card container */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-8 shadow-2xl relative">
          
          {/* Tabs */}
          <div className="flex bg-[#05070A]/60 p-1 rounded-lg mb-8 border border-brand-border">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md transition-all duration-200 cursor-pointer ${
                isLogin
                  ? 'bg-brand-surface text-brand-text-primary border border-brand-border shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md transition-all duration-200 cursor-pointer ${
                !isLogin
                  ? 'bg-brand-surface text-brand-text-primary border border-brand-border shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text-primary'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-950/20 border border-red-500/25 text-red-200 text-xs px-4 py-3 rounded-lg mb-6 font-mono leading-relaxed">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold font-mono uppercase tracking-widest text-brand-text-muted">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-2.5 bg-[#05070A] border border-brand-border focus:border-brand-accent focus:ring-1 focus:ring-brand-accent rounded-lg outline-none text-xs font-body tracking-wide transition-all placeholder-[#475569] disabled:opacity-50 text-brand-text-primary"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-bold font-mono uppercase tracking-widest text-brand-text-muted">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#05070A] border border-brand-border focus:border-brand-accent focus:ring-1 focus:ring-brand-accent rounded-lg outline-none text-xs font-body tracking-wide transition-all placeholder-[#475569] disabled:opacity-50 text-brand-text-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold font-mono uppercase tracking-widest text-[#94A3B8]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#05070A] border border-brand-border focus:border-brand-accent focus:ring-1 focus:ring-brand-accent rounded-lg outline-none text-xs font-body tracking-wide transition-all placeholder-[#475569] disabled:opacity-50 text-brand-text-primary"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-accent hover:bg-brand-accent/95 text-brand-bg font-bold rounded-lg text-xs font-mono uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-6 cursor-pointer shadow-lg shadow-brand-accent/10 hover:shadow-brand-accent/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] font-mono tracking-wider text-brand-text-muted leading-relaxed uppercase">
          English &bull; Hindi &bull; Hinglish Speech Resolution
        </p>
      </div>
    </div>
  );
};

export default AuthPage;

import React, { useState } from 'react';
import { Shield, KeyRound, UserCheck, AlertCircle, Lock } from 'lucide-react';
import { api } from '../api/client';

interface AuthPageProps {
  onSuccess: (user: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('analyst@shelfsignal.local');
  const [password, setPassword] = useState('AnalystSecure2026!');
  const [role, setRole] = useState<'analyst' | 'admin'>('analyst');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login({ email, password });
        onSuccess(res.user);
      } else {
        await api.register({ email, password, role });
        // Auto-login after registration
        const res = await api.login({ email, password });
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (type: 'analyst' | 'admin') => {
    if (type === 'analyst') {
      setEmail('analyst@shelfsignal.local');
      setPassword('AnalystSecure2026!');
      setRole('analyst');
    } else {
      setEmail('admin@shelfsignal.local');
      setPassword('AdminSecure2026!');
      setRole('admin');
    }
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-paper-dark flex flex-col justify-center items-center p-6 selection:bg-accent/20">
      <div className="w-full max-w-md">
        {/* Masthead Header */}
        <div className="text-center mb-8 border-b border-paper-border dark:border-paper-dark-border pb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold">
              Authenticated Workstation
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink dark:text-ink-dark">
            SHELF SIGNAL
          </h1>
          <p className="font-serif italic text-sm text-ink-muted dark:text-ink-dark-muted mt-1">
            Retail Pricing & Promotional Demand Intelligence
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-paper-card dark:bg-paper-dark-card border border-paper-border dark:border-paper-dark-border rounded p-6 shadow-xs">
          <div className="flex border-b border-paper-border dark:border-paper-dark-border mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 pb-2.5 text-xs font-mono font-medium border-b-2 transition-colors ${
                isLogin
                  ? 'border-accent text-accent'
                  : 'border-transparent text-ink-muted hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 pb-2.5 text-xs font-mono font-medium border-b-2 transition-colors ${
                !isLogin
                  ? 'border-accent text-accent'
                  : 'border-transparent text-ink-muted hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              Register Analyst
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-semantic-down-bg text-semantic-down border border-semantic-down/20 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-ink-muted dark:text-ink-dark-muted mb-1 uppercase tracking-wider">
                Corporate Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@retailer.com"
                className="w-full px-3 py-2 text-xs font-mono bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-dark-border rounded text-ink dark:text-ink-dark focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-ink-muted dark:text-ink-dark-muted mb-1 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 text-xs font-mono bg-paper dark:bg-paper-dark border border-paper-border dark:border-paper-dark-border rounded text-ink dark:text-ink-dark focus:border-accent"
              />
              {!isLogin && (
                <p className="text-[10px] text-ink-faint mt-1 font-mono">
                  Min 8 chars, letters & numbers. Argon2id hashed.
                </p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-mono text-ink-muted dark:text-ink-dark-muted mb-1 uppercase tracking-wider">
                  Assigned Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('analyst')}
                    className={`py-1.5 px-3 text-xs font-mono rounded border ${
                      role === 'analyst'
                        ? 'border-accent bg-accent/10 text-accent font-semibold'
                        : 'border-paper-border dark:border-paper-dark-border text-ink-muted'
                    }`}
                  >
                    Analyst
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-1.5 px-3 text-xs font-mono rounded border ${
                      role === 'admin'
                        ? 'border-accent bg-accent/10 text-accent font-semibold'
                        : 'border-paper-border dark:border-paper-dark-border text-ink-muted'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-mono uppercase tracking-wider font-semibold rounded transition-colors disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? 'Validating Credentials...' : isLogin ? 'Access Workstation' : 'Create Account'}
            </button>
          </form>

          {/* Quick Demo Credentials Pill */}
          <div className="mt-6 pt-4 border-t border-paper-border dark:border-paper-dark-border">
            <span className="block text-[10px] font-mono uppercase text-ink-faint mb-2">
              Preset Demo Accounts:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('analyst')}
                className="flex-1 py-1 px-2 text-[10px] font-mono border border-paper-border dark:border-paper-dark-border rounded hover:bg-paper-subtle dark:hover:bg-paper-dark-subtle text-ink-muted"
              >
                Analyst Demo
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="flex-1 py-1 px-2 text-[10px] font-mono border border-paper-border dark:border-paper-dark-border rounded hover:bg-paper-subtle dark:hover:bg-paper-dark-subtle text-ink-muted"
              >
                Admin Demo
              </button>
            </div>
          </div>
        </div>

        {/* Security Disclaimers */}
        <div className="mt-6 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-ink-faint">
            <Lock className="w-3 h-3 text-teal" />
            <span>Argon2id · HttpOnly SameSite=Strict · CSRF Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

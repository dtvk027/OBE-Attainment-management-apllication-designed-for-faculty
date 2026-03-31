'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
            <GraduationCap size={20} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">OBE System</span>
        </div>

        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to your faculty account</p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-2">
          <div className="form-group">
            <label htmlFor="email">College Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@college.edu"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center">
              <label htmlFor="password">Password</label>
              <Link href="/forgot-password" size="sm" className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-wider">
                Forgot?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-4" disabled={loading}>
            {loading ? 'Authenticating...' : <span className="flex items-center gap-2">Sign In <ArrowRight size={14} /></span>}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-zinc-100 text-center">
          <p className="text-sm text-zinc-500 font-medium">
            New to the portal? <Link href="/signup" className="text-zinc-900 font-bold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

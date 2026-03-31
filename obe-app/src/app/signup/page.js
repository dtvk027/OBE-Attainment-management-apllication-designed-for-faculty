'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    department: '',
  });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      router.push('/login?message=Account created successfully. Please sign in.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

        <h1>Join the Portal</h1>
        <p className="subtitle">Create your academic faculty account</p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Dr. Amanat"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">College Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="faculty@college.edu"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                placeholder="Computer Science, EEE, etc."
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full mt-4" disabled={loading}>
            {loading ? 'Creating Account...' : <span className="flex items-center gap-2">Create Account <ArrowRight size={14} /></span>}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-zinc-100 text-center">
          <p className="text-sm text-zinc-500 font-medium">
            Already have an account? <Link href="/login" className="text-zinc-900 font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

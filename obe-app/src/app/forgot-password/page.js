'use client';

import React from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request recovery code');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Recover Account</h1>
        <p className="subtitle">Enter your college email to receive a recovery code.</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && (
          <div className="alert alert-success">
            A recovery code has been sent. <br/>
            <Link href={`/reset-password?email=${encodeURIComponent(email)}`} style={{fontWeight: 600}}>
              Click here to proceed.
            </Link>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">College Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty@college.edu"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending Code...' : 'Send Recovery Code'}
            </button>
          </form>
        )}

        <div className="text-center mt-4">
          <Link href="/login" className="text-sm">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

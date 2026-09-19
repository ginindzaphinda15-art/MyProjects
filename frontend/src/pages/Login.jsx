import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'vendor' ? '/vendor' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not log in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <div className="mb-6"><Logo /></div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-accent-red text-sm">{error}</p>}
        <div>
          <label className="block text-xs text-ink/60 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-ink/60 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-gradient text-white py-2 rounded-sm text-sm font-medium disabled:opacity-50"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="text-xs text-ink/60 mt-4">
        No account yet? <Link to="/register" className="underline">Sign up</Link>
      </p>
    </div>
  );
}

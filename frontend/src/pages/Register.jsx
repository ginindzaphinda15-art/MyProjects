import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(user.role === 'vendor' ? '/vendor/profile' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <div className="mb-6"><Logo /></div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-accent-red text-sm">{error}</p>}

        <div className="flex gap-2">
          {['customer', 'vendor'].map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => update('role', r)}
              className={`flex-1 py-2 rounded-sm text-sm border ${
                form.role === r ? 'bg-brand-gradient text-white border-transparent' : 'border-ink/20 text-ink/70'
              }`}
            >
              {r === 'customer' ? "I'm a customer" : "I'm a business"}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs text-ink/60 mb-1">Full name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-ink/60 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-ink/60 mb-1">Phone</label>
          <input
            type="text"
            placeholder="76123456"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-ink/60 mb-1">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            className="w-full border border-ink/20 rounded-sm px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-gradient text-white py-2 rounded-sm text-sm font-medium disabled:opacity-50"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-xs text-ink/60 mt-4">
        Already have an account? <Link to="/login" className="underline">Log in</Link>
      </p>
    </div>
  );
}

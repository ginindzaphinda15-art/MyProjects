import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="bg-rail text-paper border-b border-brand-green/30">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link to="/" 
        className="bg-brand-gradient text-white px-3 py-1.5 rounded-sm font-medium hover:opacity-90"
            >
              Browse
          </Link>
          {!user && (
            <>
              <Link to="/login" 
             className="bg-brand-gradient text-white px-3 py-1.5 rounded-sm font-medium hover:opacity-90"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-brand-gradient text-white px-3 py-1.5 rounded-sm font-medium hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
          {user && user.role === 'customer' && (
            <Link to="/dashboard" 
            className="bg-brand-gradient text-white px-3 py-1.5 rounded-sm font-medium hover:opacity-90"
              >My bookings &amp; orders
            </Link>
          )}
          {user && user.role === 'vendor' && (
            <Link to="/vendor" 
            className="bg-brand-gradient text-white px-3 py-1.5 rounded-sm font-medium hover:opacity-90"
              >Vendor dashboard
            </Link>
          )}
          {user && (
            <button onClick={handleLogout} 
            className="bg-brand-gradient text-white px-3 py-1.5 rounded-sm font-medium hover:opacity-90">
              Log out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

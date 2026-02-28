import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useUser, UserButton, SignInButton } from '@clerk/clerk-react';
import { MapPin } from 'lucide-react';

export function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      console.log(`🔐 [Navbar] Auth state loaded | isSignedIn: ${isSignedIn} | user: ${user?.primaryEmailAddress?.emailAddress ?? 'none'}`);
    }
  }, [isLoaded, isSignedIn, user]);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  return (
    <nav className="fixed w-full z-10 transition-colors duration-300 border-b" style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--border-color)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-dark dark:bg-brand-green flex items-center justify-center">
              <MapPin size={16} className="text-brand-frost dark:text-brand-dark" />
            </div>
            <span className="text-xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
              Renti<span className="text-brand-teal dark:text-brand-green">GO</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <Link to="/browse" className="hover:opacity-70 transition-opacity">Browse</Link>
            {isSignedIn && (
              <Link to="/dashboard" className="hover:opacity-70 transition-opacity">Dashboard</Link>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full font-bold transition-all text-sm"
              style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Clerk auth buttons — show skeleton while loading */}
            {!isLoaded ? (
              <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
            ) : isSignedIn ? (
              /* Signed in → show Clerk's UserButton (avatar + dropdown) */
              <UserButton afterSignOutUrl="/" />
            ) : (
              /* Signed out → show Sign In button */
              <SignInButton mode="modal">
                <button
                  className="px-4 py-2 rounded-lg font-bold transition-transform hover:scale-105 text-sm"
                  style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                  onClick={() => console.log('🔐 [Navbar] Sign In clicked')}
                >
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;

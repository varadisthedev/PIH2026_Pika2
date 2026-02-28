import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, MapPin, LayoutDashboard, Package } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth, useUser, UserButton, SignInButton } from '@clerk/clerk-react';

const PUBLIC_NAV = [
    { label: 'Browse', to: '/browse', icon: Package },
];
const AUTH_NAV = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
];

export default function Navbar() {
    const { isDark, toggleTheme } = useTheme();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const { isSignedIn, isLoaded } = useAuth();
    const { user } = useUser();

    // Log auth state whenever it changes
    useEffect(() => {
        if (isLoaded) {
            console.log(`🔐 [Navbar] isSignedIn: ${isSignedIn} | user: ${user?.primaryEmailAddress?.emailAddress ?? 'guest'}`);
        }
    }, [isLoaded, isSignedIn, user]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    const isActive = (to) => location.pathname === to;

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-nav shadow-sm py-2' : 'bg-transparent py-4'}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-2.5 group"
                        aria-label="RentiGO Home"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-brand-dark dark:bg-brand-green flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <MapPin size={20} className="text-brand-frost dark:text-brand-dark" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-brand-dark dark:text-brand-frost">
                            Renti<span className="text-brand-teal dark:text-brand-green">GO</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-2">
                        {[...PUBLIC_NAV, ...(isSignedIn ? AUTH_NAV : [])].map(({ label, to, icon: Icon }) => (
                            <Link
                                key={to}
                                to={to}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isActive(to)
                                    ? 'bg-brand-dark/5 text-brand-dark dark:bg-brand-green/10 dark:text-brand-green'
                                    : 'text-[#3d6b50]/80 hover:bg-brand-teal/10 hover:text-brand-dark dark:text-brand-aqua/70 dark:hover:bg-brand-aqua/10 dark:hover:text-brand-frost'
                                    }`}
                            >
                                <Icon size={16} />
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-2xl text-brand-teal hover:bg-brand-teal/10 dark:text-brand-aqua dark:hover:bg-brand-aqua/10 transition-all duration-300"
                            aria-label="Toggle dark mode"
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* Auth – desktop only */}
                        <div className="hidden md:flex items-center">
                            {!isLoaded ? (
                                <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
                            ) : isSignedIn ? (
                                <UserButton afterSignOutUrl="/" />
                            ) : (
                                <SignInButton mode="modal">
                                    <button
                                        className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold bg-brand-dark text-brand-frost dark:bg-brand-green dark:text-brand-dark hover:scale-105 transition-transform"
                                        onClick={() => console.log('🔐 [Navbar] Sign In clicked')}
                                    >
                                        Sign In
                                    </button>
                                </SignInButton>
                            )}
                        </div>

                        {/* Mobile menu toggle */}
                        <button
                            onClick={() => setMobileOpen(prev => !prev)}
                            className="md:hidden p-2.5 rounded-2xl text-brand-teal hover:bg-brand-teal/10 dark:text-brand-aqua transition-all"
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden glass-nav border-t border-[#99d19c]/20 dark:border-[#79c7c5]/10 px-4 pb-4 pt-2 animate-fade-up">
                    <nav className="flex flex-col gap-1">
                        {[...PUBLIC_NAV, ...(isSignedIn ? AUTH_NAV : [])].map(({ label, to, icon: Icon }) => (
                            <Link
                                key={to}
                                to={to}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive(to)
                                    ? 'bg-[#000501]/8 text-[#000501] dark:bg-[#99d19c]/15 dark:text-[#99d19c]'
                                    : 'text-[#3d6b50] hover:bg-[#73ab84]/10 dark:text-[#79c7c5] dark:hover:bg-[#79c7c5]/10'
                                    }`}
                            >
                                <Icon size={16} /> {label}
                            </Link>
                        ))}
                        <div className="mt-2 flex justify-center">
                            {!isLoaded ? (
                                <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
                            ) : isSignedIn ? (
                                <UserButton afterSignOutUrl="/" />
                            ) : (
                                <SignInButton mode="modal">
                                    <button
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold bg-brand-dark text-brand-frost dark:bg-brand-green dark:text-brand-dark"
                                        onClick={() => console.log('🔐 [Navbar Mobile] Sign In clicked')}
                                    >
                                        Sign In
                                    </button>
                                </SignInButton>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}

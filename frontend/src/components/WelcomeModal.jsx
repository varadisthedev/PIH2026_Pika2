import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { withToken } from '../api/axios.js';
import { X, Gift } from 'lucide-react';

export default function WelcomeModal() {
    const { getToken, isSignedIn, isLoaded } = useAuth();
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;

        const check = async () => {
            try {
                const token = await getToken();
                const res = await api.get('/users/me', withToken(token));
                const user = res.data.user;
                if (user && !user.hasSeenWelcome) {
                    setShow(true);
                }
            } catch (err) {
                console.warn('[WelcomeModal] Could not fetch user:', err.message);
            }
        };
        check();
    }, [isLoaded, isSignedIn, getToken]);

    const handleClose = async () => {
        setShow(false);
        try {
            const token = await getToken();
            await api.post('/users/welcome', {}, withToken(token));
        } catch (err) {
            console.warn('[WelcomeModal] Failed to mark welcome seen:', err.message);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-[#00171F] rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-fade-up border border-brand-green/20 relative">
                {/* Close */}
                <button
                    onClick={handleClose}
                    className="absolute top-5 right-5 p-2 rounded-xl hover:bg-brand-teal/10 text-brand-teal transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-brand-green/15 flex items-center justify-center mb-6">
                    <Gift size={30} className="text-brand-green" />
                </div>

                <h2 className="text-2xl font-black text-brand-dark dark:text-brand-frost tracking-tighter mb-2">
                    Hey 👋 Welcome to RentiGO
                </h2>
                <p className="text-xs font-bold text-brand-teal/60 uppercase tracking-widest mb-6">
                    Your community rental marketplace
                </p>

                <div className="space-y-4 text-sm font-semibold text-brand-dark/80 dark:text-brand-frost/70 leading-relaxed">
                    <p>
                        We built RentiGO to make renting <strong>simple and local</strong>. So many useful items sit unused at home, while someone nearby needs the same thing short-term.
                    </p>

                    <div className="p-4 rounded-2xl bg-brand-teal/5 border border-brand-teal/10 space-y-2">
                        <p className="font-black text-brand-dark dark:text-brand-frost text-xs uppercase tracking-widest">How it works</p>
                        <p>🔹 <strong>Need something?</strong> Search, request, pick up, return.</p>
                        <p>🔹 <strong>Own something?</strong> List it, accept requests, earn money.</p>
                    </div>

                    <div className="space-y-1.5">
                        <p className="font-black text-brand-dark dark:text-brand-frost text-xs uppercase tracking-widest">Our goal</p>
                        <p>• Help people <strong>save money</strong></p>
                        <p>• Create <strong>earning opportunities</strong></p>
                        <p>• Reduce waste and over-buying</p>
                        <p>• Support a smarter, <strong>sharing economy</strong></p>
                    </div>

                    <p className="text-brand-green font-black text-center text-xs uppercase tracking-widest mt-2">
                        Access over ownership. Simple. Safe. Community-driven.
                    </p>
                </div>

                <button
                    onClick={handleClose}
                    className="mt-8 w-full py-4 rounded-2xl bg-brand-green text-white font-black text-sm uppercase tracking-widest hover:bg-brand-green/90 transition-all shadow-xl shadow-brand-green/20"
                >
                    Let's Get Started 🚀
                </button>
            </div>
        </div>
    );
}

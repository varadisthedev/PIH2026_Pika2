import React from 'react';
import { MapPin, Navigation, Shield, X } from 'lucide-react';
import { useLocation } from '../context/LocationContext.jsx';

export default function LocationModal() {
    const { showModal, requestLocation, dismissModal, status } = useLocation();

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-sm glass-card rounded-3xl shadow-2xl p-8 animate-fade-up text-center relative">

                {/* Dismiss */}
                <button onClick={dismissModal}
                    className="absolute top-4 right-4 p-2 rounded-xl text-[#3C474B] hover:bg-[#3C474B]/10 transition-colors">
                    <X size={18} />
                </button>

                {/* Icon */}
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-green/30 to-brand-teal/20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <MapPin size={36} className="text-brand-teal dark:text-brand-green" />
                </div>

                <h2 className="text-2xl font-black text-brand-dark dark:text-brand-frost mb-2 tracking-tight">
                    Find nearby items
                </h2>
                <p className="text-sm text-[#3C474B] dark:text-[#9EEFE5] leading-relaxed mb-6">
                    RentiGO uses your location to show you rental items closest to you — saving you time and travel costs.
                    Your location is never stored on our servers.
                </p>

                {/* Why we need it */}
                <div className="space-y-2 mb-8 text-left">
                    {[
                        { icon: Navigation, text: 'Sort listings from nearest to farthest' },
                        { icon: MapPin,    text: 'Show item locations on the map' },
                        { icon: Shield,   text: 'Only used locally — never sent to any server' },
                    ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#4f7CAC]/10 dark:bg-[#9EEFE5]/5">
                            <Icon size={15} className="text-brand-teal dark:text-brand-green shrink-0" />
                            <span className="text-xs font-semibold text-[#3d6b50] dark:text-[#9EEFE5]">{text}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => requestLocation(false)}
                    disabled={status === 'requesting'}
                    className="w-full py-4 rounded-2xl font-black text-sm bg-brand-dark text-brand-frost dark:bg-brand-green dark:text-brand-dark hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2 mb-3">
                    {status === 'requesting'
                        ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Detecting location…</>
                        : <><Navigation size={16} /> Allow Location Access</>}
                </button>

                <button onClick={dismissModal}
                    className="w-full py-3 rounded-2xl text-sm font-semibold text-[#3C474B] dark:text-[#9EEFE5] hover:bg-[#3C474B]/10 transition-colors">
                    Skip for now
                </button>
            </div>
        </div>
    );
}

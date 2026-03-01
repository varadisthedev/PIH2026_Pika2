import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Modal with glassmorphism backdrop
 * Traps focus, closes on Escape and backdrop click
 */
export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'max-w-lg',
    showClose = true,
}) {
    const overlayRef = useRef(null);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20 animate-fade-in"
            style={{ backgroundColor: 'rgba(22, 37, 33, 0.65)', backdropFilter: 'blur(6px)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className={`w-full ${maxWidth} animate-scale-in glass-card rounded-2xl shadow-2xl flex flex-col max-h-[80vh]`}
                style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.3), 0 8px 24px rgba(22,37,33,0.15)' }}
            >
                {/* Header — always visible, never scrolls away */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-brand-teal/10 dark:border-brand-frost/10 shrink-0">
                    {title && (
                        <h2
                            id="modal-title"
                            className="text-base font-black text-brand-dark dark:text-white tracking-tight"
                        >
                            {title}
                        </h2>
                    )}
                    {showClose && (
                        <button
                            onClick={onClose}
                            className="ml-auto p-1.5 rounded-xl text-brand-teal hover:bg-brand-teal/10 dark:text-brand-frost/60 dark:hover:bg-brand-frost/10 transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Content — scrollable when content overflows */}
                <div className="overflow-y-auto px-5 py-4 flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
            style={{ backgroundColor: 'rgba(22, 37, 33, 0.65)', backdropFilter: 'blur(6px)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className={`w-full ${maxWidth} animate-scale-in glass-card rounded-2xl shadow-2xl p-6`}
                style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.3), 0 8px 24px rgba(22,37,33,0.15)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    {title && (
                        <h2
                            id="modal-title"
                            className="text-xl font-bold text-[#162521] dark:text-[#C0E0D2]"
                        >
                            {title}
                        </h2>
                    )}
                    {showClose && (
                        <button
                            onClick={onClose}
                            className="ml-auto p-2 rounded-xl text-[#3C474B] hover:bg-[#3C474B]/10 dark:text-[#9EEFE5] dark:hover:bg-[#9EEFE5]/10 transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div>{children}</div>
            </div>
        </div>
    );
}

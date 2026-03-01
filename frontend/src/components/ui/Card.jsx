import React from 'react';

/**
 * Card component – glassmorphism by default
 * variants: 'glass' | 'solid' | 'outline'
 */
export default function Card({
    children,
    variant = 'glass',
    className = '',
    hover = false,
    onClick,
    ...props
}) {
    const base = 'rounded-2xl overflow-hidden transition-all duration-250';

    const variants = {
        glass: 'glass-card',
        solid:
            'bg-white dark:bg-[#0a1a10] border border-[#4f7CAC]/30 dark:border-[#9EEFE5]/15 shadow-sm',
        outline:
            'border-2 border-[#4f7CAC]/50 dark:border-[#9EEFE5]/25 bg-transparent',
    };

    const hoverClass = hover ? 'card-hover cursor-pointer' : '';

    return (
        <div
            className={`${base} ${variants[variant]} ${hoverClass} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
}

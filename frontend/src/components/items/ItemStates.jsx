import React from 'react';

/* Skeleton shimmer for a single card */
function SkeletonCard() {
    return (
        <div className="glass-card rounded-2xl overflow-hidden animate-pulse border border-brand-teal/5">
            <div className="h-48 bg-brand-teal/5 dark:bg-brand-teal/10" />
            <div className="p-4 space-y-4">
                <div className="h-4 bg-brand-teal/10 dark:bg-brand-teal/20 rounded-lg w-3/4" />
                <div className="h-3 bg-brand-teal/5 dark:bg-brand-teal/10 rounded-lg w-1/2" />
                <div className="flex justify-between items-center pt-2">
                    <div className="h-8 bg-brand-teal/10 dark:bg-brand-teal/20 rounded-xl w-24" />
                    <div className="h-4 bg-brand-teal/5 dark:bg-brand-teal/10 rounded-full w-16" />
                </div>
            </div>
        </div>
    );
}

/** Loading skeleton grid */
export function LoadingGrid({ count = 8 }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}
        </div>
    );
}

/** Empty state */
export function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4 animate-fade-in">
            {Icon && (
                <div className="w-20 h-20 rounded-[2.5rem] bg-brand-teal/5 dark:bg-brand-teal/10 flex items-center justify-center mb-8 border border-brand-teal/10 shadow-inner">
                    <Icon size={32} className="text-brand-teal" />
                </div>
            )}
            <h3 className="text-2xl font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter mb-3">{title}</h3>
            {description && (
                <p className="text-text-secondary text-[11px] font-black uppercase tracking-widest max-w-sm leading-relaxed mb-8">{description}</p>
            )}
            {action && <div className="animate-fade-up">{action}</div>}
        </div>
    );
}

/** Error state */
export function ErrorState({ message, onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-black text-brand-dark dark:text-brand-frost uppercase tracking-tighter mb-2">Something went wrong</h3>
            <p className="text-xs font-bold text-text-secondary mb-8 max-w-xs uppercase tracking-tight">{message || 'Failed to load data. Please check your connection and try again.'}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-8 py-3 bg-brand-dark dark:bg-brand-green text-brand-frost dark:text-brand-dark text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-xl"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}

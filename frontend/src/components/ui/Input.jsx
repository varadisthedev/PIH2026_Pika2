import React from 'react';

/**
 * Input component
 * Supports: label, error, hint, prefix icon, and all standard input props
 */
export default function Input({
    label,
    error,
    hint,
    icon: Icon,
    className = '',
    containerClassName = '',
    id,
    ...props
}) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-semibold text-[#162521] dark:text-[#C0E0D2] select-none"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3C474B] dark:text-[#9EEFE5] pointer-events-none">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    id={inputId}
                    className={`
            w-full rounded-xl border px-4 py-3 text-sm font-bold
            bg-white/50 dark:bg-brand-dark/50
            text-brand-dark dark:text-brand-frost
            placeholder:text-brand-teal/40 dark:placeholder:text-brand-aqua/30
            border-brand-teal/20 dark:border-brand-aqua/10
            backdrop-blur-md
            transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal/50
            dark:focus:ring-brand-aqua/20 dark:focus:border-brand-aqua/40
            ${error ? 'border-red-400 focus:ring-red-300' : ''}
            ${Icon ? 'pl-11' : ''}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            {hint && !error && <p className="text-xs text-[#3C474B] dark:text-[#9EEFE5]">{hint}</p>}
        </div>
    );
}

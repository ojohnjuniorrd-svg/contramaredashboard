interface BadgeProps {
    variant: 'success' | 'warning' | 'error' | 'neutral';
    children: React.ReactNode;
    pulse?: boolean;
}

export function Badge({ variant, children, pulse = false }: BadgeProps) {
    const variants = {
        success: 'bg-emerald-500 text-white border-transparent', // Solid green with white text
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900',
        error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900',
        neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    };

    const dotColors = {
        success: 'bg-white', // White dot for visibility on green bg
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
        neutral: 'bg-slate-400',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]}`}>
            {pulse && (
                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} mr-1.5 animate-pulse`} />
            )}
            {children}
        </span>
    );
}

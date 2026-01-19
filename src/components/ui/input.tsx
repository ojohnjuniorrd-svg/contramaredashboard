import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    prefix?: string;
    suffix?: string;
    icon?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, prefix, suffix, icon, className = '', ...props }, ref) => {
        return (
            <div className="space-y-2">
                {label && (
                    <label className="block text-sm font-medium text-[var(--text-primary)]">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="material-symbols-outlined text-[var(--text-muted)] text-[20px]">{icon}</span>
                        </div>
                    )}
                    {prefix && !icon && (
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-[var(--text-muted)] text-sm">{prefix}</span>
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
              w-full rounded-lg border bg-[var(--background-card)] px-4 py-2.5 text-sm text-[var(--text-primary)]
              placeholder:text-[var(--text-muted)] transition-all
              ${icon ? 'pl-10' : prefix ? 'pl-9' : ''}
              ${suffix ? 'pr-12' : ''}
              ${error
                                ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-2 focus:ring-[var(--error-bg)]'
                                : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]'
                            }
              focus:outline-none
              ${className}
            `}
                        {...props}
                    />
                    {suffix && (
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-[var(--text-muted)] text-sm">{suffix}</span>
                        </div>
                    )}
                </div>
                {hint && !error && (
                    <p className="text-xs text-[var(--text-secondary)]">{hint}</p>
                )}
                {error && (
                    <p className="text-xs text-[var(--error)]">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

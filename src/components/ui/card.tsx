import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    padding?: 'sm' | 'md' | 'lg' | 'none';
    hover?: boolean;
}

export function Card({ children, className = '', padding = 'md', hover = false }: CardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            className={`
        bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm
        ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
        >
            {children}
        </div>
    );
}

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: string;
    iconBgColor: string;
    iconColor: string;
    trend?: {
        value: number;
        label: string;
        isPositive?: boolean;
    };
}

export function KpiCard({ title, value, icon, iconBgColor, iconColor, trend }: KpiCardProps) {
    return (
        <Card className="flex flex-col justify-between gap-4">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[var(--text-secondary)] text-sm font-medium">{title}</p>
                    <h3 className="text-[var(--text-primary)] text-2xl font-bold mt-1">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg ${iconBgColor}`}>
                    <span className={`material-symbols-outlined ${iconColor} text-[20px]`}>{icon}</span>
                </div>
            </div>
            {trend && (
                <div className="flex items-center gap-1">
                    <span className={`material-symbols-outlined text-[16px] ${trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                        {trend.isPositive ? 'trending_up' : 'trending_down'}
                    </span>
                    <span className={`text-sm font-medium ${trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                        {trend.value > 0 ? '+' : ''}{trend.value}%
                    </span>
                    <span className="text-[var(--text-secondary)] text-sm">{trend.label}</span>
                </div>
            )}
        </Card>
    );
}

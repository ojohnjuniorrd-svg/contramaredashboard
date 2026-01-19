'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Campaign, DailyMetric, parseDateString, formatDateBR } from '@/types/database';
import { Badge } from '@/components/ui/badge';

interface CampaignCardProps {
    campaign: Campaign;
    metrics?: DailyMetric[];
    onEdit?: () => void;
    onDelete?: () => void;
}

// Sparkline component using real data
function Sparkline({ data, color = '#2b6cee' }: { data: number[]; color?: string }) {
    if (data.length === 0) {
        return (
            <svg className="w-full h-16" viewBox="0 0 100 40" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="100" y2="20" stroke={color} strokeWidth="2" strokeOpacity="0.3" />
            </svg>
        );
    }

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const height = 40;
    const width = 100;

    const points = data.map((value, i) => {
        const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * (height * 0.8) - height * 0.1;
        return `${x},${y}`;
    }).join(' ');

    const areaPath = `M0,${height} L${points} L${width},${height} Z`;

    return (
        <svg className="w-full h-16" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
                <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#gradient-${color.replace('#', '')})`} />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

// Dropdown menu component
function DropdownMenu({ onEdit, onDelete, onClose }: { onEdit?: () => void; onDelete?: () => void; onClose: () => void }) {
    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />
            {/* Menu */}
            <div className="absolute right-0 top-8 z-50 bg-[var(--background-card)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[140px]">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit?.();
                        onClose();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--background-hover)] transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Editar
                </button>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete?.();
                        onClose();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Excluir
                </button>
            </div>
        </>
    );
}

export function CampaignCard({ campaign, metrics = [], onEdit, onDelete }: CampaignCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Calculate real totals from metrics
    const totalLeads = metrics.reduce((sum, m) => sum + m.entradas, 0);

    // Calculate trend (compare last 3 days vs previous 3 days)
    const sortedMetrics = [...metrics].sort((a, b) =>
        parseDateString(b.date).getTime() - parseDateString(a.date).getTime()
    );

    const recent = sortedMetrics.slice(0, 3).reduce((sum, m) => sum + m.entradas, 0);
    const previous = sortedMetrics.slice(3, 6).reduce((sum, m) => sum + m.entradas, 0);
    const trend = previous > 0 ? Math.round(((recent - previous) / previous) * 100) : 0;

    // Sparkline data (entries per day, chronological order)
    const sparklineData = [...metrics]
        .sort((a, b) => parseDateString(a.date).getTime() - parseDateString(b.date).getTime())
        .map(m => m.entradas);

    // Determine if active based on recent activity
    const hasRecentActivity = metrics.length > 0;

    // Format last update time
    const lastMetric = sortedMetrics[0];
    const lastUpdated = lastMetric
        ? `Atualizado em ${formatDateBR(lastMetric.date)}`
        : 'Sem dados ainda';

    return (
        <Link href={`/campaign/${campaign.id}`} className="block">
            <div className="group bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
                <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                                {campaign.name}
                            </h3>
                            <div className="mt-1">
                                <Badge variant={hasRecentActivity ? 'success' : 'neutral'} pulse={hasRecentActivity}>
                                    {hasRecentActivity ? 'Ativo' : 'Sem dados'}
                                </Badge>
                            </div>
                        </div>
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsMenuOpen(!isMenuOpen);
                                }}
                                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--background-hover)] rounded transition-colors"
                            >
                                <span className="material-symbols-outlined">more_horiz</span>
                            </button>
                            {isMenuOpen && (
                                <DropdownMenu
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onClose={() => setIsMenuOpen(false)}
                                />
                            )}
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex items-end justify-between mb-2">
                            <div>
                                <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Total Leads</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{totalLeads.toLocaleString('pt-BR')}</p>
                            </div>
                            {metrics.length >= 6 && trend !== 0 && (
                                <div className={`flex items-center text-xs font-medium px-2 py-1 rounded ${trend >= 0
                                    ? 'text-[var(--success)] bg-[var(--success-bg)]'
                                    : 'text-[var(--error)] bg-[var(--error-bg)]'
                                    }`}>
                                    <span className="material-symbols-outlined text-[14px] mr-0.5">
                                        {trend >= 0 ? 'trending_up' : 'trending_down'}
                                    </span>
                                    {trend > 0 ? '+' : ''}{trend}%
                                </div>
                            )}
                        </div>

                        {/* Sparkline with real data */}
                        <div className="sparkline-container">
                            <Sparkline data={sparklineData} />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--background)] px-5 py-3 border-t border-[var(--border-light)] flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">
                        {lastUpdated}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onEdit?.();
                            }}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-md transition-colors"
                            title="Editar metas"
                        >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDelete?.();
                            }}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] rounded-md transition-colors"
                            title="Excluir campanha"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export function CreateCampaignCard({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="group border-2 border-dashed border-[var(--border)] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--background-hover)] transition-all min-h-[280px]"
        >
            <div className="h-12 w-12 rounded-full bg-[var(--background-hover)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[var(--text-muted)] group-hover:text-[var(--primary)]">add</span>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                Novo Dashboard
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-[200px]">
                Crie um novo dashboard para acompanhar sua campanha.
            </p>
        </button>
    );
}

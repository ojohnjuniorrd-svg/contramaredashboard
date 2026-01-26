'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Campaign, DailyMetric } from '@/types/database';
import { DashboardView } from '@/components/dashboard-view';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';

// Simple Theme Toggle Component for Share Page
function SharePageThemeToggle() {
    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };

    return (
        <Button variant="ghost" className="w-9 h-9 p-0" onClick={toggleTheme} title="Alternar tema">
            <span className="material-symbols-outlined text-[20px]">contrast</span>
        </Button>
    );
}

interface SharePageProps {
    params: Promise<{ share_id: string }>;
}

export default function SharePage({ params }: SharePageProps) {
    const { share_id } = use(params);
    const [isLoading, setIsLoading] = useState(true);
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [metrics, setMetrics] = useState<DailyMetric[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Date Range State
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: subDays(new Date(), 30),
        end: new Date(),
    });
    const [dateRangeOption, setDateRangeOption] = useState('last_30_days');

    const supabase = createClient();

    useEffect(() => {
        const fetchSharedData = async () => {
            setIsLoading(true);
            const { data, error } = await supabase.rpc('get_shared_campaign_data', {
                p_share_id: share_id,
            } as any);

            if (error) {
                console.error('Error fetching shared data:', error);
                setError('Dashboard não encontrado ou link inválido.');
            } else if (data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const result = data as any;
                setCampaign(result.campaign);
                setMetrics(result.metrics);

                // Set default dates if metrics exist
                if (result.metrics && result.metrics.length > 0) {
                    // logic to set dates could go here similar to main dash
                }
            } else {
                setError('Dashboard não encontrado.');
            }
            setIsLoading(false);
        };

        fetchSharedData();
    }, [share_id]);

    const handleDateRangeChange = (option: string) => {
        setDateRangeOption(option);
        const today = new Date();
        switch (option) {
            case 'today':
                setDateRange({ start: today, end: today });
                break;
            case 'yesterday':
                setDateRange({ start: subDays(today, 1), end: subDays(today, 1) });
                break;
            case 'last_7_days':
                setDateRange({ start: subDays(today, 7), end: today });
                break;
            case 'last_30_days':
                setDateRange({ start: subDays(today, 30), end: today });
                break;
            case 'this_month':
                setDateRange({ start: startOfMonth(today), end: endOfMonth(today) });
                break;
            case 'last_month':
                const lastMonth = subDays(startOfMonth(today), 1);
                setDateRange({ start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) });
                break;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
            </div>
        );
    }

    if (error || !campaign) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4">
                <span className="material-symbols-outlined text-6xl text-[var(--text-muted)] mb-4">link_off</span>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Link Inválido ou Expirado</h1>
                <p className="text-[var(--text-secondary)] text-center">{error || 'Não foi possível carregar o dashboard.'}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
            {/* Header */}
            <header className="border-b border-[var(--border)] bg-[var(--background-card)] sticky top-0 z-10 px-6 py-4">
                <div className="container mx-auto max-w-[1200px] flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-[var(--text-primary)]">{campaign.name}</h1>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Visualização Pública</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Date Filter (Simplified) */}
                        <select
                            value={dateRangeOption}
                            onChange={(e) => handleDateRangeChange(e.target.value)}
                            className="bg-[var(--background)] border border-[var(--border)] rounded-md text-sm px-3 py-1.5 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                        >
                            <option value="today">Hoje</option>
                            <option value="yesterday">Ontem</option>
                            <option value="last_7_days">Últimos 7 dias</option>
                            <option value="last_30_days">Últimos 30 dias</option>
                            <option value="this_month">Este Mês</option>
                            <option value="last_month">Mês Passado</option>
                        </select>
                        <SharePageThemeToggle />
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto max-w-[1200px] p-6">
                    <DashboardView
                        campaign={campaign}
                        metrics={metrics}
                        dateRange={dateRange}
                        readOnly={true}
                    />
                </div>
            </div>

            {/* Footer Brand */}
            <footer className="py-6 text-center border-t border-[var(--border)] bg-[var(--background)]">
                <p className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-1">
                    Powered by <span className="font-bold text-[var(--text-secondary)]">Fluxo Mídia</span>
                </p>
            </footer>
        </div>
    );
}

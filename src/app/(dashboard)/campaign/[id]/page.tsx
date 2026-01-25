'use client';

import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Campaign, DailyMetric, parseDateString, formatDateBR } from '@/types/database';
import { KpiCard, Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DailyMetricsTable } from '@/components/daily-metrics-table';
import { LeadsChart } from '@/components/leads-chart';
import { CampaignSettingsDrawer } from '@/components/campaign-settings-drawer';
import { EditableInvestmentCard } from '@/components/editable-investment-card';
import { GoogleSheetSyncButton } from '@/components/google-sheet-sync-button';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface CampaignPageProps {
    params: Promise<{ id: string }>;
}

type DateRangeOption = 'last7' | 'last30' | 'thisMonth' | 'all' | 'custom';

export default function CampaignPage({ params }: CampaignPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const supabase = createClient();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [metrics, setMetrics] = useState<DailyMetric[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Date filtering state
    const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('last7');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    const fetchData = async () => {
        setIsLoading(true);

        // Fetch campaign
        const { data: campaignData, error: campaignError } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .single();

        if (campaignError || !campaignData) {
            console.error('Campaign not found:', campaignError);
            router.push('/');
            return;
        }

        setCampaign(campaignData);

        // Fetch ALL metrics (limit 365 days for safety, but effectively all for now)
        const { data: metricsData, error: metricsError } = await supabase
            .from('daily_metrics')
            .select('*')
            .eq('campaign_id', id)
            .order('date', { ascending: false })
            .limit(365);

        if (!metricsError && metricsData) {
            setMetrics(metricsData as unknown as DailyMetric[]); // Cast to fix type inference

            // Set default custom dates based on available data
            if (metricsData.length > 0) {
                // metricsData is sorted desc, so first is newest, last is oldest
                const newest = (metricsData[0] as DailyMetric).date;
                const oldest = (metricsData[metricsData.length - 1] as DailyMetric).date;
                setCustomStartDate(oldest);
                setCustomEndDate(newest);
            }
        }

        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    // Calculate Data Boundaries
    const dataBoundaries = useMemo(() => {
        if (metrics.length === 0) return { min: '', max: '' };
        // Metrics sorted desc
        const max = metrics[0].date;
        const min = metrics[metrics.length - 1].date;
        return { min, max };
    }, [metrics]);

    // Calculate Date Range based on option
    const dateRange = useMemo(() => {
        const today = new Date();
        // Normalize today to avoid time issues
        today.setHours(0, 0, 0, 0);

        let start: Date;
        let end: Date = today;

        if (dateRangeOption === 'custom') {
            // Parse custom dates safely
            start = customStartDate ? parseDateString(customStartDate) : new Date(0);
            end = customEndDate ? parseDateString(customEndDate) : today;
            return { start, end };
        }

        switch (dateRangeOption) {
            case 'last7':
                start = subDays(today, 6); // Today + previous 6 days
                break;
            case 'last30':
                start = subDays(today, 29);
                break;
            case 'thisMonth':
                start = startOfMonth(today);
                end = endOfMonth(today);
                break;
            case 'all':
                start = new Date(0); // Beginning of time
                break;
            default:
                start = subDays(today, 6);
        }

        return { start, end };
    }, [dateRangeOption, customStartDate, customEndDate]);

    // Filter Metrics
    const filteredMetrics = useMemo(() => {
        if (dateRangeOption === 'all') return metrics;

        return metrics.filter(m => {
            const metricDate = parseDateString(m.date);
            return isWithinInterval(metricDate, {
                start: dateRange.start,
                end: dateRange.end
            });
        });
    }, [metrics, dateRange, dateRangeOption]);

    // --- Calculated Metrics ---

    // 1. Leads Totais (Full History)


    // 2. Metrics for Selected Period
    // 2. Metrics for Selected Period
    const filteredEntradas = filteredMetrics.reduce((sum, m) => sum + m.entradas, 0);
    const filteredLeads = filteredMetrics.reduce((sum, m) => sum + m.leads, 0);
    const filteredInvestment = filteredMetrics.reduce((sum, m) => sum + m.investimento, 0);
    const filteredExits = filteredMetrics.reduce((sum, m) => sum + m.saidas, 0);

    // 3. Efficiency Metrics (Period)
    // CPL (Meta Ads) = Investimento / Leads (Meta)
    const avgCPL = filteredLeads > 0 ? filteredInvestment / filteredLeads : 0;

    // CPL Real (Médio) = Investimento / Entradas
    const avgRealCPL = filteredEntradas > 0 ? filteredInvestment / filteredEntradas : 0;

    // Taxa de entrada = Entradas / Leads (Meta)
    const avgEntryRate = filteredLeads > 0 ? (filteredEntradas / filteredLeads) * 100 : 0;

    // Taxa de saída = Saídas / Entradas
    const avgExitRate = filteredEntradas > 0 ? (filteredExits / filteredEntradas) * 100 : 0;

    // Helper formatter
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const handleMetricUpdate = (updatedMetric: DailyMetric) => {
        setMetrics(metrics.map(m => m.id === updatedMetric.id ? updatedMetric : m));
    };

    const handleCampaignUpdate = (updatedCampaign: Campaign) => {
        setCampaign(updatedCampaign);
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
            </div>
        );
    }

    if (!campaign) {
        return null;
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--background)]">
            {/* Header */}
            <header className="bg-[var(--background-card)] border-b border-[var(--border)] px-8 py-4 flex flex-col gap-4">
                {/* ... Breadcrumbs and Title (unchanged) ... */}
                <div className="flex flex-wrap gap-2 items-center">
                    <Link href="/" className="text-[var(--text-secondary)] text-sm font-medium hover:text-[var(--primary)] transition-colors">
                        Dashboards
                    </Link>
                    <span className="text-[var(--text-muted)] text-sm">/</span>
                    <span className="text-[var(--text-primary)] text-sm font-semibold">{campaign.name}</span>
                </div>

                {/* Title & Actions */}
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-[var(--text-primary)] tracking-tight text-3xl font-bold leading-tight">
                            {campaign.name}
                        </h2>
                        <p className="text-[var(--text-secondary)] text-sm font-normal">
                            Visão analítica de performance e conversão
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Date Filter Buttons */}
                        <div className="flex items-center gap-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg p-1">
                            {['last7', 'last30', 'thisMonth', 'all'].map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setDateRangeOption(opt as any)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRangeOption === opt
                                        ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                >
                                    {opt === 'last7' ? '7D' : opt === 'last30' ? '30D' : opt === 'thisMonth' ? 'Mês' : 'Tudo'}
                                </button>
                            ))}
                            <div className="h-4 w-px bg-[var(--border)] mx-1" />
                            <button
                                onClick={() => setDateRangeOption('custom')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRangeOption === 'custom'
                                    ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                Personalizado
                            </button>
                        </div>
                        {/* ... Custom Date Inputs ... */}
                        {dateRangeOption === 'custom' && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="relative flex items-center bg-[var(--background-card)] border border-[var(--border)] rounded-lg px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-[var(--primary)] transition-all">
                                    <span className="material-symbols-outlined text-[18px] text-[var(--text-secondary)] mr-2 pointer-events-none">event</span>
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        min={dataBoundaries.min}
                                        max={customEndDate || dataBoundaries.max}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        onClick={(e) => e.currentTarget.showPicker()}
                                        className="text-sm border-none bg-transparent focus:outline-none text-[var(--text-primary)] w-[110px] cursor-pointer"
                                        title="Data Início"
                                    />
                                    <span className="text-[var(--text-muted)] mx-1">-</span>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        min={customStartDate || dataBoundaries.min}
                                        max={dataBoundaries.max}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        onClick={(e) => e.currentTarget.showPicker()}
                                        className="text-sm border-none bg-transparent focus:outline-none text-[var(--text-primary)] w-[110px] cursor-pointer"
                                        title="Data Fim"
                                    />
                                </div>
                            </div>
                        )}

                        <GoogleSheetSyncButton
                            campaignId={campaign.id}
                            spreadsheetLink={campaign.spreadsheet_link}
                            onSyncComplete={fetchData}
                        />

                        <Button onClick={() => setIsSettingsOpen(true)} variant="secondary">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                            <span>Editar</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Dashboard Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-[1400px] mx-auto flex flex-col gap-6">

                    {/* KPI Grid - Row 1: Totals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {/* 1. Leads (Meta Ads) */}
                        <KpiCard
                            title="Leads (Meta Ads)"
                            value={filteredLeads.toLocaleString('pt-BR')}
                            icon="groups"
                            iconBgColor="bg-indigo-50 dark:bg-indigo-900/20"
                            iconColor="text-indigo-600 dark:text-indigo-400"
                        />

                        {/* 2. Entradas Reais (Total) */}
                        <KpiCard
                            title="Entradas Reais (Total)"
                            value={filteredEntradas.toLocaleString('pt-BR')}
                            icon="login"
                            iconBgColor="bg-blue-50 dark:bg-blue-900/20"
                            iconColor="text-blue-600 dark:text-blue-400"
                        />

                        {/* 3. Saídas Reais (Total) */}
                        <KpiCard
                            title="Saídas Reais (Total)"
                            value={filteredExits.toLocaleString('pt-BR')}
                            icon="logout"
                            iconBgColor="bg-red-50 dark:bg-red-900/20"
                            iconColor="text-red-600 dark:text-red-400"
                        />

                        {/* 4. Investimento Total */}
                        <EditableInvestmentCard
                            totalInvestment={filteredInvestment}
                            metrics={filteredMetrics}
                            onUpdate={handleMetricUpdate}
                        />
                    </div>

                    {/* KPI Grid - Row 2: Rates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {/* 1. CPL (Meta Ads) */}
                        <KpiCard
                            title="CPL (Meta Ads)"
                            value={formatCurrency(avgCPL)}
                            icon="flag"
                            iconBgColor="bg-gray-50 dark:bg-gray-800"
                            iconColor="text-gray-600 dark:text-gray-400"
                            trend={{
                                value: 0,
                                label: 'Meta', // Context help
                                isPositive: true, // simplified
                            }}
                        />

                        {/* 2. CPL Real (Médio) */}
                        <KpiCard
                            title="CPL Real (Médio)"
                            value={formatCurrency(avgRealCPL)}
                            icon="monetization_on"
                            iconBgColor="bg-green-50 dark:bg-green-900/20"
                            iconColor="text-green-600 dark:text-green-400"
                        />

                        {/* 3. Taxa de entrada */}
                        <KpiCard
                            title="Taxa de entrada"
                            value={`${avgEntryRate.toFixed(1)}%`}
                            icon="percent"
                            iconBgColor="bg-orange-50 dark:bg-orange-900/20"
                            iconColor="text-orange-600 dark:text-orange-400"
                            trend={{
                                value: 0,
                                label: 'Entradas / Leads (Meta)',
                                isPositive: true,
                            }}
                        />

                        {/* 4. Taxa de saída */}
                        <KpiCard
                            title="Taxa de saída"
                            value={`${avgExitRate.toFixed(1)}%`}
                            icon="trending_down"
                            iconBgColor="bg-rose-50 dark:bg-rose-900/20"
                            iconColor="text-rose-600 dark:text-rose-400"
                            trend={{
                                value: 0,
                                label: 'Saídas / Entradas',
                                isPositive: false,
                            }}
                        />
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 gap-6">
                        {/* Main Chart */}
                        <Card padding="lg">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-[var(--text-primary)] text-lg font-bold">Aquisição Diária de Leads</h3>
                                    <p className="text-[var(--text-secondary)] text-sm">
                                        Desempenho no período selecionado
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={fetchData}
                                        className="p-1.5 hover:bg-[var(--background-hover)] rounded text-[var(--text-secondary)]"
                                    >
                                        <span className="material-symbols-outlined">refresh</span>
                                    </button>
                                </div>
                            </div>
                            <LeadsChart metrics={filteredMetrics} />
                        </Card>
                    </div>

                    {/* Daily Metrics Table */}
                    <Card padding="none">
                        <div className="px-6 py-4 border-b border-[var(--border-light)]">
                            <h3 className="text-[var(--text-primary)] text-lg font-bold">Métricas Diárias</h3>
                            <p className="text-[var(--text-secondary)] text-sm">
                                Dados detalhados do período selecionado
                            </p>
                        </div>
                        <DailyMetricsTable
                            metrics={filteredMetrics}
                            campaign={campaign}
                            onMetricUpdate={handleMetricUpdate}
                        />
                    </Card>
                </div>
            </div>

            {/* Settings Drawer */}
            <CampaignSettingsDrawer
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                campaign={campaign}
                onUpdate={handleCampaignUpdate}
            />
        </div>
    );
}
// Refactored: Dashboard & Spreadsheet Sync

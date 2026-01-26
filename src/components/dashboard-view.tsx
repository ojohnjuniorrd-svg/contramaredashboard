'use client';

import { DailyMetric, Campaign, DateRange } from '@/types/database';
import { KpiCard } from '@/components/ui/card';
import { Card } from '@/components/ui/card';
import { LeadsChart } from '@/components/leads-chart';
import { EditableInvestmentCard } from '@/components/editable-investment-card';
import { DailyMetricsTable } from '@/components/daily-metrics-table';

interface DashboardViewProps {
    campaign: Campaign;
    metrics: DailyMetric[];
    dateRange: DateRange;
    readOnly?: boolean;
}

export function DashboardView({ campaign, metrics, dateRange, readOnly = false }: DashboardViewProps) {

    // --- Metrics Calculation Logic (Duplicated for now, or extracted to helper?) ---
    // Extracting to simple logic within render to avoid heavy refactor of helper functions right now
    // Ideally this logic should be in a hook useCampaignMetrics

    // Filter metrics by date range
    const filteredMetrics = metrics.filter(m => {
        const d = new Date(m.date + 'T00:00:00'); // simple parse
        return d >= dateRange.start && d <= dateRange.end;
    });

    // Garantir conversão de string para number (dados vindos de JSONB podem ser strings)
    const filteredEntradas = filteredMetrics.reduce((sum, m) => sum + Number(m.entradas || 0), 0);
    const filteredLeads = filteredMetrics.reduce((sum, m) => sum + Number(m.leads || 0), 0);
    const filteredInvestment = filteredMetrics.reduce((sum, m) => sum + Number(m.investimento || 0), 0);
    const filteredExits = filteredMetrics.reduce((sum, m) => sum + Number(m.saidas || 0), 0);

    // Calculated
    const avgCPL = filteredLeads > 0 ? filteredInvestment / filteredLeads : 0;
    const avgRealCPL = filteredEntradas > 0 ? filteredInvestment / filteredEntradas : 0;
    const avgEntryRate = filteredLeads > 0 ? (filteredEntradas / filteredLeads) * 100 : 0;
    const avgExitRate = filteredEntradas > 0 ? (filteredExits / filteredEntradas) * 100 : 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* KPI Grid - Row 1: Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* 1. Leads (Meta Ads) */}
                <KpiCard
                    title="Leads (Meta Ads)"
                    value={filteredLeads.toLocaleString('pt-BR')}
                    icon="group"
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
                    iconBgColor="bg-rose-50 dark:bg-rose-900/20"
                    iconColor="text-rose-600 dark:text-rose-400"
                />

                {/* 4. Investimento Total */}
                <EditableInvestmentCard
                    totalInvestment={filteredInvestment}
                    metrics={filteredMetrics}
                    readOnly={readOnly}
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
                />

                {/* 4. Taxa de saída */}
                <KpiCard
                    title="Taxa de saída"
                    value={`${avgExitRate.toFixed(1)}%`}
                    icon="trending_down"
                    iconBgColor="bg-rose-50 dark:bg-rose-900/20"
                    iconColor="text-rose-600 dark:text-rose-400"
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
                    </div>
                    <div className="h-[350px] w-full">
                        <LeadsChart metrics={filteredMetrics} />
                    </div>
                </Card>
            </div>

            {/* Metrics Table */}
            <DailyMetricsTable metrics={filteredMetrics} campaign={campaign} readOnly={readOnly} />
        </div>
    );
}

'use client';

import { useState } from 'react';
import { DailyMetric, calculateMetrics, Campaign, parseDateString } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DailyMetricsTableProps {
    metrics: DailyMetric[];
    campaign: Campaign;
    onMetricUpdate: (updatedMetric: DailyMetric) => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function DailyMetricsTable({ metrics, campaign, onMetricUpdate }: DailyMetricsTableProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
    const supabase = createClient();

    const handleEditStart = (metric: DailyMetric) => {
        setEditingId(metric.id);
        setEditValue(metric.investimento.toString());
    };

    const handleEditSave = async (metric: DailyMetric) => {
        const newValue = parseFloat(editValue) || 0;

        // Don't save if value hasn't changed
        if (newValue === metric.investimento) {
            setEditingId(null);
            setEditValue('');
            return;
        }

        // Set saving status
        setSaveStatus(prev => ({ ...prev, [metric.id]: 'saving' }));
        setEditingId(null);
        setEditValue('');

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase
                .from('daily_metrics') as any)
                .update({ investimento: newValue })
                .eq('id', metric.id)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                onMetricUpdate(data as DailyMetric);
            }

            // Show saved status
            setSaveStatus(prev => ({ ...prev, [metric.id]: 'saved' }));

            // Clear saved status after 2 seconds
            setTimeout(() => {
                setSaveStatus(prev => ({ ...prev, [metric.id]: 'idle' }));
            }, 2000);
        } catch (error) {
            console.error('Error saving investment:', error);
            setSaveStatus(prev => ({ ...prev, [metric.id]: 'error' }));

            // Clear error status after 3 seconds
            setTimeout(() => {
                setSaveStatus(prev => ({ ...prev, [metric.id]: 'idle' }));
            }, 3000);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, metric: DailyMetric) => {
        if (e.key === 'Enter') {
            handleEditSave(metric);
        } else if (e.key === 'Escape') {
            setEditingId(null);
            setEditValue('');
        }
    };

    const getComparisonClass = (value: number, target: number, isLowerBetter: boolean) => {
        if (isLowerBetter) {
            return value <= target ? 'text-[var(--success)]' : 'text-[var(--error)]';
        }
        return value >= target ? 'text-[var(--success)]' : 'text-[var(--error)]';
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatPercent = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    const renderSaveStatus = (metricId: string) => {
        const status = saveStatus[metricId];

        if (status === 'saving') {
            return (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--primary)] animate-pulse">
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Salvando...
                </span>
            );
        }

        if (status === 'saved') {
            return (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--success)]">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Salvo
                </span>
            );
        }

        if (status === 'error') {
            return (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--error)]">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    Erro
                </span>
            );
        }

        return null;
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="table-header">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            Data
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            Clicks
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            Entradas
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            Saídas
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            Investimento
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            CPL Real
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            Taxa Entrada
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            Taxa Saída
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {metrics.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="py-8 text-center text-[var(--text-secondary)]">
                                Nenhuma métrica registrada ainda.
                            </td>
                        </tr>
                    ) : (
                        metrics.map((metric) => {
                            const calculated = calculateMetrics(metric);
                            const status = saveStatus[metric.id];

                            return (
                                <tr key={metric.id} className="table-row">
                                    <td className="py-3 px-4 text-sm text-[var(--text-primary)] font-medium">
                                        {format(parseDateString(metric.date), "dd 'de' MMM", { locale: ptBR })}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-[var(--text-primary)] text-right">
                                        {metric.clicks.toLocaleString('pt-BR')}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-[var(--text-primary)] text-right">
                                        {metric.entradas.toLocaleString('pt-BR')}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-[var(--text-primary)] text-right">
                                        {metric.saidas.toLocaleString('pt-BR')}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right">
                                        {editingId === metric.id ? (
                                            <div className="flex items-center justify-end gap-1">
                                                <span className="text-[var(--text-muted)]">R$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleEditSave(metric)}
                                                    onKeyDown={(e) => handleKeyDown(e, metric)}
                                                    className="w-24 px-2 py-1 text-right border border-[var(--primary)] rounded bg-[var(--background-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)]"
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2">
                                                {renderSaveStatus(metric.id)}
                                                {status !== 'saving' && (
                                                    <button
                                                        onClick={() => handleEditStart(metric)}
                                                        className="inline-flex items-center gap-1 text-[var(--text-primary)] hover:text-[var(--primary)] group"
                                                    >
                                                        {formatCurrency(metric.investimento)}
                                                        <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">
                                                            edit
                                                        </span>
                                                    </button>
                                                )}
                                                {status === 'saving' && (
                                                    <span className="text-[var(--text-primary)]">
                                                        {formatCurrency(metric.investimento)}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className={`py-3 px-4 text-sm text-right font-medium ${getComparisonClass(calculated.cplReal, campaign.cpl_meta, true)}`}>
                                        {formatCurrency(calculated.cplReal)}
                                    </td>
                                    <td className={`py-3 px-4 text-sm text-right font-medium ${getComparisonClass(calculated.taxaEntrada, campaign.taxa_entrada_min, false)}`}>
                                        {formatPercent(calculated.taxaEntrada)}
                                    </td>
                                    <td className={`py-3 px-4 text-sm text-right font-medium ${getComparisonClass(calculated.taxaSaida, campaign.taxa_saida_max, true)}`}>
                                        {formatPercent(calculated.taxaSaida)}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}

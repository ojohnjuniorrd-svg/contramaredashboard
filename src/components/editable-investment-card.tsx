'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { DailyMetric, formatDateBR } from '@/types/database';

interface EditableInvestmentCardProps {
    totalInvestment: number;
    metrics: DailyMetric[];
    onUpdate?: (updatedMetric: DailyMetric) => void;
    readOnly?: boolean;
}

export function EditableInvestmentCard({ totalInvestment, metrics, onUpdate, readOnly = false }: EditableInvestmentCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const supabase = createClient();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const handleStartEdit = () => {
        // Default to today's metric or most recent
        const today = new Date().toISOString().split('T')[0];
        const todayMetric = metrics.find(m => m.date === today);
        const targetMetric = todayMetric || metrics[0];

        if (targetMetric) {
            setSelectedDate(targetMetric.date);
            setEditValue(targetMetric.investimento.toString());
            setIsEditing(true);
        }
    };

    const handleSave = async () => {
        const metric = metrics.find(m => m.date === selectedDate);
        if (!metric) return;

        setIsSaving(true);
        const newValue = parseFloat(editValue) || 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase
            .from('daily_metrics') as any)
            .update({ investimento: newValue })
            .eq('id', metric.id)
            .select()
            .single();

        if (!error && data) {
            onUpdate?.(data as DailyMetric);
        }

        setIsSaving(false);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') setIsEditing(false);
    };

    return (
        <Card className="flex flex-col justify-between gap-4">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[var(--text-secondary)] text-sm font-medium">Investimento Total</p>
                    {isEditing ? (
                        <div className="mt-1 space-y-2">
                            <select
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    const m = metrics.find(m => m.date === e.target.value);
                                    if (m) setEditValue(m.investimento.toString());
                                }}
                                className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background-card)] text-[var(--text-primary)]"
                            >
                                {metrics.map(m => (
                                    <option key={m.id} value={m.date}>
                                        {formatDateBR(m.date)}
                                    </option>
                                ))}
                            </select>
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--text-muted)]">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-24 px-2 py-1 text-lg font-bold border border-[var(--primary)] rounded bg-[var(--background-card)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)]"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="p-1 text-[var(--success)] hover:bg-[var(--success-bg)] rounded"
                                >
                                    <span className="material-symbols-outlined text-[20px]">check</span>
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="p-1 text-[var(--text-muted)] hover:bg-[var(--background-hover)] rounded"
                                >
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="group flex items-center gap-2 mt-1">
                            {readOnly ? (
                                <h3 className="text-[var(--text-primary)] text-2xl font-bold">
                                    {formatCurrency(totalInvestment)}
                                </h3>
                            ) : (
                                <button
                                    onClick={handleStartEdit}
                                    className="flex items-center gap-2 group-hover:text-[var(--primary)] transition-colors"
                                    disabled={metrics.length === 0}
                                >
                                    <h3 className="text-[var(--text-primary)] text-2xl font-bold">
                                        {formatCurrency(totalInvestment)}
                                    </h3>
                                    {metrics.length > 0 && (
                                        <span className="material-symbols-outlined text-[18px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                                            edit
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-[20px]">payments</span>
                </div>
            </div>
            {!isEditing && !readOnly && metrics.length > 0 && (
                <p className="text-xs text-[var(--text-muted)]">
                    Clique para editar por dia
                </p>
            )}
            {metrics.length === 0 && (
                <p className="text-xs text-[var(--text-muted)]">
                    Sem métricas para editar
                </p>
            )}
        </Card>
    );
}

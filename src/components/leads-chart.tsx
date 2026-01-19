'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DailyMetric, parseDateString } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadsChartProps {
    metrics: DailyMetric[];
}

export function LeadsChart({ metrics }: LeadsChartProps) {
    // Sort by date ascending for chart
    const chartData = [...metrics]
        .sort((a, b) => parseDateString(a.date).getTime() - parseDateString(b.date).getTime())
        .map((metric) => ({
            date: format(parseDateString(metric.date), 'dd/MM', { locale: ptBR }),
            fullDate: format(parseDateString(metric.date), "dd 'de' MMMM", { locale: ptBR }),
            leads: metric.entradas,
            clicks: metric.clicks,
            saidas: metric.saidas,
        }));

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
        if (active && payload && payload.length) {
            const data = chartData.find(d => d.date === label);
            return (
                <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-lg shadow-lg p-3">
                    <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{data?.fullDate}</p>
                    <div className="space-y-1">
                        <p className="text-sm text-[var(--text-secondary)]">
                            <span className="inline-block w-3 h-3 rounded bg-[#2b6cee] mr-2" />
                            Entradas: <span className="font-medium text-[var(--text-primary)]">{payload[0]?.value}</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (metrics.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-[var(--text-secondary)]">
                Nenhum dado disponível para exibir o gráfico.
            </div>
        );
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2b6cee" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2b6cee" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        dx={-10}
                        tickFormatter={(value) => value.toLocaleString('pt-BR')}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="leads"
                        stroke="#2b6cee"
                        strokeWidth={2}
                        fill="url(#leadsGradient)"
                        activeDot={{ r: 6, fill: '#2b6cee', stroke: 'white', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

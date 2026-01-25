'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface GoogleSheetSyncButtonProps {
    campaignId: string;
    spreadsheetLink?: string;
    onSyncComplete: () => void;
}

export function GoogleSheetSyncButton({ campaignId, spreadsheetLink, onSyncComplete }: GoogleSheetSyncButtonProps) {
    const [isSyncing, setIsSyncing] = useState(false);
    const supabase = createClient();

    // Proper CSV parser that handles quoted fields (e.g., "254,14")
    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    // Parse Brazilian number format: "254,14" or "1.234,56"
    const cleanNumber = (val: string): number => {
        if (!val) return 0;
        let cleaned = val.replace(/"/g, '').replace('R$', '').replace(/\s/g, '').trim();

        // Brazilian format: comma as decimal, dot as thousands
        if (cleaned.includes(',')) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        }

        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    };

    const handleSync = async () => {
        if (!spreadsheetLink) {
            toast.error('Nenhum link de planilha configurado');
            return;
        }

        setIsSyncing(true);
        try {
            // Convert to CSV export URL if it's a standard edit link
            let csvUrl = spreadsheetLink;
            if (spreadsheetLink.includes('/edit')) {
                csvUrl = spreadsheetLink.replace(/\/edit.*$/, '/export?format=csv');
            }

            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error('Falha ao baixar planilha. Verifique se é pública.');

            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim());

            if (lines.length < 2) throw new Error('Planilha vazia ou formato inválido');

            console.log('Raw first line:', lines[0]);
            console.log('Raw data line:', lines[1]);

            const rows = lines.map(row => parseCSVLine(row));

            console.log('Parsed headers:', rows[0]);
            console.log('Parsed data sample:', rows[1]);

            // Find Header Index
            const headerRowIndex = rows.findIndex(row =>
                row.some(cell => cell.toLowerCase().includes('day') || cell.toLowerCase().includes('amount'))
            );

            if (headerRowIndex === -1) throw new Error('Colunas não encontradas (Day, Amount Spent, Leads)');

            const headers = rows[headerRowIndex].map(h => h.trim().toLowerCase());
            const dayIdx = headers.findIndex(h => h.includes('day'));
            const spentIdx = headers.findIndex(h => h.includes('amount') || h.includes('spent'));
            const leadsIdx = headers.findIndex(h => h.includes('leads'));

            console.log('Column indices:', { dayIdx, spentIdx, leadsIdx });

            if (dayIdx === -1 || spentIdx === -1) throw new Error('Colunas obrigatórias faltando: Day, Amount Spent');

            const metricsToUpsert = [];

            for (let i = headerRowIndex + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row[dayIdx] || row[dayIdx].trim() === '') continue;

                const date = row[dayIdx].trim();
                const investimento = cleanNumber(row[spentIdx]);
                const leads = leadsIdx !== -1 ? Math.round(cleanNumber(row[leadsIdx])) : 0;

                console.log(`Row ${i}: date=${date}, investimento=${investimento}, leads=${leads}`);

                if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    metricsToUpsert.push({
                        campaign_id: campaignId,
                        date: date,
                        investimento: investimento,
                        leads: leads,
                    });
                }
            }

            console.log('Total metrics to upsert:', metricsToUpsert.length);

            if (metricsToUpsert.length === 0) {
                toast.warning('Nenhum dado válido encontrado.');
                return;
            }

            // Fetch existing metrics to preserve entradas/saidas/clicks
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: existingMetrics } = await (supabase
                .from('daily_metrics')
                .select('*')
                .eq('campaign_id', campaignId) as any);

            const updates = metricsToUpsert.map(newMetric => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const existing = existingMetrics?.find((m: any) => m.date === newMetric.date);
                return {
                    campaign_id: campaignId,
                    date: newMetric.date,
                    investimento: newMetric.investimento,
                    leads: newMetric.leads,
                    clicks: existing?.clicks || 0,
                    entradas: existing?.entradas || 0,
                    saidas: existing?.saidas || 0,
                };
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase
                .from('daily_metrics')
                .upsert(updates as any, { onConflict: 'campaign_id,date' }) as any);

            if (error) throw error;

            toast.success(`${updates.length} dias sincronizados com sucesso!`);
            onSyncComplete();

        } catch (error) {
            console.error('Sync error:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao sincronizar');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <Button
            onClick={handleSync}
            variant="secondary"
            disabled={isSyncing || !spreadsheetLink}
            className="gap-2"
        >
            <span className={`material-symbols-outlined ${isSyncing ? 'animate-spin' : ''}`}>
                {isSyncing ? 'sync' : 'cloud_sync'}
            </span>
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Planilha'}
        </Button>
    );
}

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
            } else if (!spreadsheetLink.includes('output=csv') && !spreadsheetLink.includes('format=csv')) {
                // Try appending if likely a simple ID link, though regex replace above handles most Google Sheets cases
                // For now assume user provides a valid link or standard browser link
                // If it ends in / it might need export... safest is regex replace
            }

            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error('Falha ao baixar planilha. Verifique se é pública.');

            const text = await response.text();
            const rows = text.split('\n').map(row => row.split(','));

            // Find Header Index
            const headerRowIndex = rows.findIndex(row =>
                row.some(cell => cell.toLowerCase().includes('day') || cell.toLowerCase().includes('amount spent'))
            );

            if (headerRowIndex === -1) throw new Error('Colunas não encontradas (Day, Amount Spent, Leads)');

            const headers = rows[headerRowIndex].map(h => h.trim().toLowerCase());
            const dayIdx = headers.findIndex(h => h === 'day');
            const spentIdx = headers.findIndex(h => h === 'amount spent');
            const leadsIdx = headers.findIndex(h => h === 'leads');

            if (dayIdx === -1 || spentIdx === -1) throw new Error('Colunas obrigatórias faltando: Day, Amount Spent');

            const metricsToUpsert = [];

            // Parse valid rows
            for (let i = headerRowIndex + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row[dayIdx]) continue;

                const date = row[dayIdx].trim();
                // Parse "254,14" -> 254.14
                // Handle different CSV number formats if enclosed in quotes "1.234,56"
                const cleanNumber = (val: string) => {
                    if (!val) return 0;
                    return parseFloat(val.replace(/"/g, '').replace('R$', '').replace('.', '').replace(',', '.').trim());
                };

                const investimento = cleanNumber(row[spentIdx]);
                const leads = leadsIdx !== -1 ? cleanNumber(row[leadsIdx]) : 0;

                if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    metricsToUpsert.push({
                        campaign_id: campaignId,
                        date: date,
                        investimento: investimento,
                        leads: leads,
                        // We preserve existing values for these if possible, but upsert overwrites.
                        // Ideally we fetch existing to merge, or we just rely on updating these specific fields.
                        // Supabase upsert matches on (campaign_id, date) if unique constraint exists.
                        // Assuming unique constraint on (campaign_id, date).
                    });
                }
            }

            if (metricsToUpsert.length === 0) {
                toast.warning('Nenhum dado válido encontrado.');
                return;
            }

            // Perform upsert
            // Note: Upsert needs to know which columns to resolve conflicts on.
            // If we only insert (investimento, leads), other cols like clicks/entradas might be nullified if we don't merge.
            // Strategy: We should probably use a specialized upsert or fetch-then-update logic if we want to preserve 'entradas'.
            // However, straightforward upsert in Supabase overwrites checks primary keys. 
            // If we only send {investimento, leads}, Supabase might default others if it's a new row, OR update only those if 'ignoreDuplicates' is false?
            // "onConflict" strategy.
            // Let's safe-guard: We will UPSERT, but if we want to keep `entradas`/`clicks` we need to know them.
            // BETTER APPROACH for partial updates:
            // Since we can't easily do partial upsert for BULK without custom SQL function, 
            // and we assume this spreadsheet is the SOURCE OF TRUTH for Investment/Leads,
            // We can loop and upsert. Or better:
            // 1. Fetch existing metrics for this campaign.
            // 2. Merge in memory.
            // 3. Upsert formatted rows.

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: existingMetrics } = await (supabase
                .from('daily_metrics')
                .select('*')
                .eq('campaign_id', campaignId) as any);

            const updates = metricsToUpsert.map(newMetric => {
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
                .upsert(updates, { onConflict: 'campaign_id,date' }) as any);

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

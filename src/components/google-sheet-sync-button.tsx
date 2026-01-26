'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { syncSpreadsheetData } from '@/lib/sync-helpers';

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
            const count = await syncSpreadsheetData(supabase, campaignId, spreadsheetLink);
            toast.success(`${count} dias sincronizados com sucesso!`);
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

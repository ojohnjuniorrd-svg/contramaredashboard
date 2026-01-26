import { SupabaseClient } from '@supabase/supabase-js';

export async function syncSpreadsheetData(
    supabase: SupabaseClient,
    campaignId: string,
    spreadsheetLink: string
) {
    // 1. Prepare URL
    let csvUrl = spreadsheetLink;
    if (spreadsheetLink.includes('/edit')) {
        csvUrl = spreadsheetLink.replace(/\/edit.*$/, '/export?format=csv');
    }

    // 2. Fetch CSV
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error('Falha ao baixar planilha. Verifique se é pública.');

    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) throw new Error('Planilha vazia ou formato inválido');

    // 3. Define Parser
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

    // 4. Parse Rows
    const rows = lines.map(row => parseCSVLine(row));

    // 5. Find Headers
    const headerRowIndex = rows.findIndex(row =>
        row.some(cell => cell.toLowerCase().includes('day') || cell.toLowerCase().includes('amount'))
    );

    if (headerRowIndex === -1) throw new Error('Colunas não encontradas (Day, Amount Spent, Leads)');

    const headers = rows[headerRowIndex].map(h => h.trim().toLowerCase());
    const dayIdx = headers.findIndex(h => h.includes('day'));
    const spentIdx = headers.findIndex(h => h.includes('amount') || h.includes('spent'));
    const leadsIdx = headers.findIndex(h => h.includes('leads'));

    // Check for Entradas/Saídas columns (pt-BR or English)
    const entriesIdx = headers.findIndex(h => h.includes('entradas') || h.includes('entries') || h.includes('entrada'));
    const exitsIdx = headers.findIndex(h => h.includes('saidas') || h.includes('exits') || h.includes('saídas') || h.includes('saida'));

    if (dayIdx === -1 || spentIdx === -1) throw new Error('Colunas obrigatórias faltando: Day, Amount Spent');

    // 6. Clean Number Helper
    const cleanNumber = (val: string): number => {
        if (!val) return 0;
        let cleaned = val.replace(/"/g, '').replace('R$', '').replace(/\s/g, '').trim();
        if (cleaned.includes(',') && !cleaned.includes('.')) {
            // 1000,00 -> 1000.00
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else if (cleaned.includes(',') && cleaned.includes('.')) {
            // 1.000,00 -> 1000.00 (Brazilian format)
            // Remove dots, replce comma
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        }

        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    };

    // 7. Extract Metrics
    const metricsToUpsert = [];
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[dayIdx] || row[dayIdx].trim() === '') continue;

        const date = row[dayIdx].trim();
        const investimento = cleanNumber(row[spentIdx]);
        const leads = leadsIdx !== -1 ? Math.round(cleanNumber(row[leadsIdx])) : 0;
        const entradas = entriesIdx !== -1 ? Math.round(cleanNumber(row[entriesIdx])) : 0;
        const saidas = exitsIdx !== -1 ? Math.round(cleanNumber(row[exitsIdx])) : 0;

        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            metricsToUpsert.push({
                campaign_id: campaignId,
                date: date,
                investimento: investimento,
                leads: leads,
                entradas: entradas,
                saidas: saidas,
            });
        }
    }

    if (metricsToUpsert.length === 0) {
        throw new Error('Nenhum dado válido encontrado na planilha.');
    }

    // 8. Fetch Existing & Merge
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingMetrics } = await (supabase
        .from('daily_metrics')
        .select('*')
        .eq('campaign_id', campaignId) as any);

    const updates = metricsToUpsert.map(newMetric => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = existingMetrics?.find((m: any) => m.date === newMetric.date);

        // If csv has 0 for entries/exits, check if we should keep existing db value?
        // Usually sync means overwrite. But if column didn't exist in CSV, we set it to 0 in parser above.
        // Let's rely on parser: if column was NOT found, entriesIdx is -1, so parser returns 0.
        // We might want to preserve DB value if CSV didn't have the column at all.
        // But here we are iterating `metricsToUpsert` which has 0s.

        // Improved logic: If column was missing in CSV, we might want to keep existing.
        // But for simplicity and clean sync, let's trust the parsed object.
        // Actually, if we want to support partial updates (e.g. n8n fills entries, CSV fills investment), 
        // we need to be careful. 
        // The user asked to sync "from spreadsheet". It implies spreadsheet is master for what it contains.

        return {
            campaign_id: campaignId,
            date: newMetric.date,
            investimento: newMetric.investimento,
            leads: newMetric.leads,
            clicks: existing?.clicks || 0,
            entradas: newMetric.entradas > 0 ? newMetric.entradas : (existing?.entradas || 0), // Prefer CSV if > 0, else keep existing
            saidas: newMetric.saidas > 0 ? newMetric.saidas : (existing?.saidas || 0),       // Prefer CSV if > 0, else keep existing
        };
    });

    // 9. Upsert to DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
        .from('daily_metrics')
        .upsert(updates as any, { onConflict: 'campaign_id,date' }) as any);

    if (error) throw error;

    // 10. Update Campaign Total Leads (leads_meta)
    // Calculate total from the UPSERTED metrics (since this is the source of truth for leads)
    const totalLeads = updates.reduce((sum, m) => sum + (m.leads || 0), 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase
        .from('campaigns') as any)
        .update({ leads_meta: totalLeads })
        .eq('id', campaignId);

    return updates.length;
}

export interface Campaign {
  id: string;
  name: string;
  leads_meta: number;
  cpl_meta: number;
  taxa_entrada_min: number;
  taxa_saida_max: number;
  spreadsheet_link?: string;
  created_at: string;
}

export interface DailyMetric {
  id: string;
  campaign_id: string;
  date: string;
  clicks: number;
  entradas: number;
  saidas: number;
  investimento: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, 'created_at'>;
        Update: Partial<Omit<Campaign, 'id' | 'created_at'>>;
      };
      daily_metrics: {
        Row: DailyMetric;
        Insert: Omit<DailyMetric, 'id' | 'created_at'>;
        Update: Partial<Omit<DailyMetric, 'id' | 'campaign_id' | 'created_at'>>;
      };
    };
  };
}

// Calculated metrics types
export interface CalculatedMetrics {
  cplReal: number;
  taxaEntrada: number;
  taxaSaida: number;
}

export interface DailyMetricWithCalculations extends DailyMetric, CalculatedMetrics { }

export function calculateMetrics(metric: DailyMetric): CalculatedMetrics {
  const cplReal = metric.entradas > 0 ? metric.investimento / metric.entradas : 0;
  const taxaEntrada = metric.clicks > 0 ? (metric.entradas / metric.clicks) * 100 : 0;
  const taxaSaida = metric.entradas > 0 ? (metric.saidas / metric.entradas) * 100 : 0;

  return { cplReal, taxaEntrada, taxaSaida };
}

/**
 * Parse date string (YYYY-MM-DD) without timezone shift
 * JavaScript's new Date("2024-01-18") interprets as UTC midnight,
 * which shifts to previous day in negative UTC offsets (like Brazil UTC-3)
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format date for display in Brazilian format
 */
export function formatDateBR(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString('pt-BR');
}

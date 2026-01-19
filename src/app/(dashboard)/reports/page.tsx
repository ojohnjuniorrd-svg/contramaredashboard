'use client';

import { Card } from '@/components/ui/card';

export default function ReportsPage() {
    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1200px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                        Relatórios
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        Exporte e visualize relatórios detalhados das suas campanhas.
                    </p>
                </div>

                <Card padding="lg">
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--background-hover)] mb-4">
                            <span className="material-symbols-outlined text-3xl text-[var(--text-muted)]">
                                bar_chart
                            </span>
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                            Em breve
                        </h3>
                        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
                            A funcionalidade de relatórios está em desenvolvimento.
                            Em breve você poderá exportar dados em CSV/PDF e visualizar análises avançadas.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

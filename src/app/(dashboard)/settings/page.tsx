'use client';

import { Card } from '@/components/ui/card';

export default function SettingsPage() {
    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[800px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                        Configurações
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        Gerencie as configurações da sua conta e preferências.
                    </p>
                </div>

                <div className="space-y-6">
                    <Card padding="lg">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                            Perfil
                        </h3>
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-4xl text-[var(--text-muted)] mb-2">
                                person
                            </span>
                            <p className="text-[var(--text-secondary)]">
                                Configurações de perfil em breve.
                            </p>
                        </div>
                    </Card>

                    <Card padding="lg">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                            Integrações
                        </h3>
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-4xl text-[var(--text-muted)] mb-2">
                                extension
                            </span>
                            <p className="text-[var(--text-secondary)]">
                                Configurações de integrações com SendFlow e n8n em breve.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

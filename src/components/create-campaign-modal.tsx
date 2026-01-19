'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Campaign } from '@/types/database';

interface CreateCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (campaign: Campaign) => void;
}

export function CreateCampaignModal({ isOpen, onClose, onSuccess }: CreateCampaignModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        sendflow_id: '',
        name: '',
        leads_meta: '',
        cpl_meta: '',
        taxa_entrada_min: '',
        taxa_saida_max: '',
    });
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Use o SendFlow ID se fornecido, senão gera um automático
            const campaignId = formData.sendflow_id.trim() || `camp_${Date.now()}`;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error: insertError } = await (supabase
                .from('campaigns') as any)
                .insert({
                    id: campaignId,
                    name: formData.name,
                    leads_meta: parseInt(formData.leads_meta) || 0,
                    cpl_meta: parseFloat(formData.cpl_meta) || 0,
                    taxa_entrada_min: parseFloat(formData.taxa_entrada_min) || 0,
                    taxa_saida_max: parseFloat(formData.taxa_saida_max) || 0,
                })
                .select()
                .single();

            if (insertError) {
                if (insertError.code === '23505') {
                    setError('Já existe uma campanha com esse ID.');
                } else {
                    throw insertError;
                }
                return;
            }

            onSuccess(data);
            onClose();
            setFormData({
                sendflow_id: '',
                name: '',
                leads_meta: '',
                cpl_meta: '',
                taxa_entrada_min: '',
                taxa_saida_max: '',
            });
        } catch (err) {
            console.error('Error creating campaign:', err);
            setError('Erro ao criar campanha. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Novo Dashboard"
            description="Configure os dados básicos do seu lançamento."
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} isLoading={isLoading}>
                        Criar Dashboard
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Nome de Referência"
                    placeholder="Ex: Lançamento Q3 - Produto X"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />

                <Input
                    label="ID do SendFlow (Release ID)"
                    placeholder="Ex: MOBHjV06fLMKIRJSKyTI"
                    value={formData.sendflow_id}
                    onChange={(e) => setFormData({ ...formData, sendflow_id: e.target.value })}
                    icon="key"
                    hint="O mesmo ID usado pelo n8n para enviar métricas. Se vazio, será gerado automaticamente."
                />

                {error && (
                    <p className="text-sm text-[var(--error)] bg-[var(--error-bg)] px-3 py-2 rounded-lg">
                        {error}
                    </p>
                )}

                <div className="h-px bg-[var(--border-light)] my-2" />

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Metas e Limites</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Meta de Leads"
                            placeholder="5000"
                            type="number"
                            value={formData.leads_meta}
                            onChange={(e) => setFormData({ ...formData, leads_meta: e.target.value })}
                            icon="flag"
                        />
                        <Input
                            label="CPL Meta (R$)"
                            placeholder="5.00"
                            type="number"
                            step="0.01"
                            value={formData.cpl_meta}
                            onChange={(e) => setFormData({ ...formData, cpl_meta: e.target.value })}
                            prefix="R$"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Taxa Entrada Mín (%)"
                            placeholder="30"
                            type="number"
                            step="0.1"
                            value={formData.taxa_entrada_min}
                            onChange={(e) => setFormData({ ...formData, taxa_entrada_min: e.target.value })}
                            suffix="%"
                            hint="Mínimo esperado de entradas/clicks"
                        />
                        <Input
                            label="Taxa Saída Máx (%)"
                            placeholder="20"
                            type="number"
                            step="0.1"
                            value={formData.taxa_saida_max}
                            onChange={(e) => setFormData({ ...formData, taxa_saida_max: e.target.value })}
                            suffix="%"
                            hint="Máximo tolerado de saídas/entradas"
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
}

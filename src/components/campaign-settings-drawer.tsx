'use client';

import { useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Campaign } from '@/types/database';

interface CampaignSettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    campaign: Campaign;
    onUpdate: (campaign: Campaign) => void;
}

export function CampaignSettingsDrawer({ isOpen, onClose, campaign, onUpdate }: CampaignSettingsDrawerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        leads_meta: campaign.leads_meta.toString(),
        cpl_meta: campaign.cpl_meta.toString(),
        taxa_entrada_min: campaign.taxa_entrada_min.toString(),
        taxa_saida_max: campaign.taxa_saida_max.toString(),
    });
    const supabase = createClient();

    const handleSubmit = async () => {
        setIsLoading(true);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase
                .from('campaigns') as any)
                .update({
                    leads_meta: parseInt(formData.leads_meta) || 0,
                    cpl_meta: parseFloat(formData.cpl_meta) || 0,
                    taxa_entrada_min: parseFloat(formData.taxa_entrada_min) || 0,
                    taxa_saida_max: parseFloat(formData.taxa_saida_max) || 0,
                })
                .eq('id', campaign.id)
                .select()
                .single();

            if (error) throw error;

            onUpdate(data as Campaign);
            onClose();
        } catch (error) {
            console.error('Error updating campaign:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Metas"
            description="Configure os parâmetros de meta do lançamento."
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} isLoading={isLoading}>
                        Salvar Alterações
                    </Button>
                </>
            }
        >
            <form className="space-y-6">
                <Input
                    label="Meta de Leads"
                    type="number"
                    value={formData.leads_meta}
                    onChange={(e) => setFormData({ ...formData, leads_meta: e.target.value })}
                    icon="flag"
                    hint="Total de leads esperados para o período."
                />

                <Input
                    label="CPL Meta (R$)"
                    type="number"
                    step="0.01"
                    value={formData.cpl_meta}
                    onChange={(e) => setFormData({ ...formData, cpl_meta: e.target.value })}
                    prefix="R$"
                    suffix="BRL"
                    hint="Custo por lead máximo aceitável."
                />

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[var(--border-light)]" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-[var(--background-card)] px-2 text-sm text-[var(--text-muted)]">Taxas Limite</span>
                    </div>
                </div>

                <Input
                    label="Taxa de Entrada Mínima (%)"
                    type="number"
                    step="0.1"
                    value={formData.taxa_entrada_min}
                    onChange={(e) => setFormData({ ...formData, taxa_entrada_min: e.target.value })}
                    suffix="%"
                    hint="Mínimo esperado de (entradas/clicks)."
                />

                <Input
                    label="Taxa de Saída Máxima (%)"
                    type="number"
                    step="0.1"
                    value={formData.taxa_saida_max}
                    onChange={(e) => setFormData({ ...formData, taxa_saida_max: e.target.value })}
                    suffix="%"
                    hint="Máximo tolerado de (saídas/entradas)."
                />
            </form>
        </Drawer>
    );
}

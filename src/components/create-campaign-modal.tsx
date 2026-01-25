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
        spreadsheet_link: '',
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
                    spreadsheet_link: formData.spreadsheet_link,
                    leads_meta: 0,
                    cpl_meta: 0,
                    taxa_entrada_min: 70, // Default value
                    taxa_saida_max: 20, // Default value
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
                spreadsheet_link: '',
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
                    label="Link da Planilha"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={formData.spreadsheet_link}
                    onChange={(e) => setFormData({ ...formData, spreadsheet_link: e.target.value })}
                    icon="table_view"
                    hint="Link público ou compartilhado da planilha de dados"
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
            </form>
        </Modal>
    );
}
// Refactored: Dashboard & Spreadsheet Sync

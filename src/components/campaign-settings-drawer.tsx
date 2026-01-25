'use client';

import { useState, useEffect } from 'react';
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
        name: '',
        spreadsheet_link: '',
        sendflow_id: '',
    });
    const supabase = createClient();

    // Reset/Initialize form data when campaign changes or drawer opens
    useEffect(() => {
        if (isOpen && campaign) {
            setFormData({
                name: campaign.name,
                spreadsheet_link: campaign.spreadsheet_link || '',
                sendflow_id: campaign.sendflow_id || '',
            });
        }
    }, [isOpen, campaign]);

    const handleSubmit = async () => {
        setIsLoading(true);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase
                .from('campaigns') as any)
                .update({
                    name: formData.name,
                    spreadsheet_link: formData.spreadsheet_link,
                    sendflow_id: formData.sendflow_id,
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
            title="Editar Campanha"
            description="Atualize as informações principais da campanha."
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
                    label="Nome da Campanha"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Lançamento Janeiro 2026"
                />

                <Input
                    label="Link da Planilha (Dados)"
                    value={formData.spreadsheet_link}
                    onChange={(e) => setFormData({ ...formData, spreadsheet_link: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/..."
                    icon="link"
                />

                <Input
                    label="ID do SendFlow"
                    value={formData.sendflow_id}
                    onChange={(e) => setFormData({ ...formData, sendflow_id: e.target.value })}
                    placeholder="Ex: sf_12345"
                    icon="code"
                    hint="Identificador único no sistema SendFlow."
                />
            </form>
        </Drawer>
    );
}
// Refactored: Dashboard & Spreadsheet Sync

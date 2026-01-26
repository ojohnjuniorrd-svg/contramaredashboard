'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Campaign } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ShareCampaignButtonProps {
    campaign: Campaign;
    onUpdate: (updatedCampaign: Campaign) => void;
}

export function ShareCampaignButton({ campaign, onUpdate }: ShareCampaignButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const generateLink = async () => {
        setIsLoading(true);
        const newShareId = crypto.randomUUID();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase
            .from('campaigns') as any)
            .update({ share_id: newShareId })
            .eq('id', campaign.id)
            .select()
            .single();

        if (error) {
            console.error('Error generating link:', error);
            toast.error('Erro ao gerar link de compartilhamento');
        } else if (data) {
            onUpdate(data as Campaign);
            toast.success('Link de compartilhamento gerado!');
        }
        setIsLoading(false);
    };

    const revokeLink = async () => {
        setIsLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase
            .from('campaigns') as any)
            .update({ share_id: null })
            .eq('id', campaign.id)
            .select()
            .single();

        if (error) {
            console.error('Error revoking link:', error);
            toast.error('Erro ao revogar link');
        } else if (data) {
            onUpdate(data as Campaign);
            toast.success('Link revogado com sucesso.');
        }
        setIsLoading(false);
    };

    const copyToClipboard = () => {
        if (!campaign.share_id) return;

        // Construct URL based on current origin
        const url = `${window.location.origin}/share/${campaign.share_id}`;

        navigator.clipboard.writeText(url).then(() => {
            toast.success('Link copiado para a área de transferência!');
        });
    };

    const shareUrl = campaign.share_id
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${campaign.share_id}`
        : '';

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="secondary" className="gap-2">
                    <span className="material-symbols-outlined text-[20px]">share</span>
                    <span className="hidden sm:inline">Compartilhar</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Compartilhar Dashboard</h4>
                        <p className="text-sm text-[var(--text-muted)]">
                            Gere um link público para visualização (somente leitura).
                        </p>
                    </div>

                    {campaign.share_id ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    readOnly
                                    value={shareUrl}
                                    className="flex-1 h-9 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                                />
                                <Button variant="secondary" className="w-9 h-9 p-0 shrink-0" onClick={copyToClipboard}>
                                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                </Button>
                            </div>
                            <Button
                                variant="danger"
                                className="w-full text-xs h-8"
                                onClick={revokeLink}
                                isLoading={isLoading}
                            >
                                Revogar Link (Tornar Privado)
                            </Button>
                        </div>
                    ) : (
                        <Button
                            className="w-full"
                            onClick={generateLink}
                            isLoading={isLoading}
                        >
                            Gerar Link Compartilhável
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

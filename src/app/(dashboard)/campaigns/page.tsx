'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Campaign, DailyMetric } from '@/types/database';
import { CampaignCard, CreateCampaignCard } from '@/components/campaign-card';
import { CreateCampaignModal } from '@/components/create-campaign-modal';
import { CampaignSettingsDrawer } from '@/components/campaign-settings-drawer';
import { Button } from '@/components/ui/button';

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [metrics, setMetrics] = useState<Record<string, DailyMetric[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const supabase = createClient();

    const fetchCampaigns = async () => {
        setIsLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase
            .from('campaigns') as any)
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setCampaigns(data as Campaign[]);

            // Fetch metrics for all campaigns
            const metricsMap: Record<string, DailyMetric[]> = {};
            for (const campaign of data as Campaign[]) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: metricsData } = await (supabase
                    .from('daily_metrics') as any)
                    .select('*')
                    .eq('campaign_id', campaign.id)
                    .order('date', { ascending: false })
                    .limit(7);

                if (metricsData) {
                    metricsMap[campaign.id] = metricsData as DailyMetric[];
                }
            }
            setMetrics(metricsMap);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleCampaignCreated = (campaign: Campaign) => {
        setCampaigns([campaign, ...campaigns]);
    };

    const handleCampaignUpdated = (updatedCampaign: Campaign) => {
        setCampaigns(campaigns.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
        setEditingCampaign(null);
    };

    const handleDeleteCampaign = async (campaignId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;

        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', campaignId);

        if (!error) {
            setCampaigns(campaigns.filter(c => c.id !== campaignId));
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1200px] mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                            Campanhas
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-1">
                            Todas as campanhas cadastradas no sistema.
                        </p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Nova Campanha
                    </Button>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-5 animate-pulse h-[280px]" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {campaigns.map((campaign) => (
                            <CampaignCard
                                key={campaign.id}
                                campaign={campaign}
                                metrics={metrics[campaign.id] || []}
                                onEdit={() => setEditingCampaign(campaign)}
                                onDelete={() => handleDeleteCampaign(campaign.id)}
                            />
                        ))}
                        <CreateCampaignCard onClick={() => setIsModalOpen(true)} />
                    </div>
                )}
            </div>

            <CreateCampaignModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCampaignCreated}
            />

            {editingCampaign && (
                <CampaignSettingsDrawer
                    isOpen={!!editingCampaign}
                    onClose={() => setEditingCampaign(null)}
                    campaign={editingCampaign}
                    onUpdate={handleCampaignUpdated}
                />
            )}
        </div>
    );
}

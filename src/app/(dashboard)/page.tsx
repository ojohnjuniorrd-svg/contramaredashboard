'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Campaign, DailyMetric } from '@/types/database';
import { CampaignCard, CreateCampaignCard } from '@/components/campaign-card';
import { CreateCampaignModal } from '@/components/create-campaign-modal';
import { CampaignSettingsDrawer } from '@/components/campaign-settings-drawer';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [metrics, setMetrics] = useState<Record<string, DailyMetric[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const supabase = createClient();

    const fetchCampaigns = async () => {
        setIsLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: campaignsData, error: campaignsError } = await (supabase
            .from('campaigns') as any)
            .select('*')
            .order('created_at', { ascending: false });

        if (campaignsError) {
            console.error('Error fetching campaigns:', campaignsError);
        } else if (campaignsData) {
            setCampaigns(campaignsData as Campaign[]);

            // Fetch metrics for all campaigns
            const metricsMap: Record<string, DailyMetric[]> = {};
            for (const campaign of campaignsData as Campaign[]) {
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
        if (!confirm('Tem certeza que deseja excluir esta campanha? Todos os dados serão perdidos.')) return;

        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', campaignId);

        if (!error) {
            setCampaigns(campaigns.filter(c => c.id !== campaignId));
        }
    };

    const handleEditCampaign = (campaign: Campaign) => {
        setEditingCampaign(campaign);
    };

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto max-w-[1200px] p-6 md:p-10">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm mb-6">
                    <span className="text-[var(--text-secondary)] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">home</span>
                        Home
                    </span>
                    <span className="text-[var(--text-muted)]">/</span>
                    <span className="text-[var(--text-primary)] font-medium">Dashboards</span>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                            Meus Dashboards
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-1 text-sm">
                            Gerencie todos os dashboards de lançamentos e campanhas.
                        </p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Novo Dashboard
                    </Button>
                </div>

                {/* Campaign Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-5 animate-pulse">
                                <div className="h-6 bg-[var(--background-hover)] rounded w-2/3 mb-4" />
                                <div className="h-4 bg-[var(--background-hover)] rounded w-1/4 mb-6" />
                                <div className="h-16 bg-[var(--background-hover)] rounded mb-4" />
                                <div className="h-16 bg-[var(--background-hover)] rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {campaigns.map((campaign) => (
                            <CampaignCard
                                key={campaign.id}
                                campaign={campaign}
                                metrics={metrics[campaign.id] || []}
                                onEdit={() => handleEditCampaign(campaign)}
                                onDelete={() => handleDeleteCampaign(campaign.id)}
                            />
                        ))}
                        <CreateCampaignCard onClick={() => setIsModalOpen(true)} />
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && campaigns.length === 0 && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--background-hover)] mb-4">
                            <span className="material-symbols-outlined text-3xl text-[var(--text-muted)]">dashboard</span>
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                            Nenhum dashboard ainda
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
                            Crie seu primeiro dashboard para começar a acompanhar as métricas do seu lançamento.
                        </p>
                        <Button onClick={() => setIsModalOpen(true)}>
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Criar Primeiro Dashboard
                        </Button>
                    </div>
                )}
            </div>

            {/* Create Campaign Modal */}
            <CreateCampaignModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCampaignCreated}
            />

            {/* Edit Campaign Settings Drawer */}
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

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Campaign {
  id: string;
  organization_id: string;
  store_id: string | null;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'archived';
  daily_promotion_count: number;
  random_order: boolean;
  canva_template_url: string | null;
  created_at: string;
  promotions?: Array<{
    id: string;
    title: string;
    image_url: string | null;
  }>;
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Fetch promotions for each campaign
      const campaignsWithPromos = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { data: promotions } = await supabase
            .from('promotions')
            .select('id, title, image_url')
            .eq('campaign_id', campaign.id)
            .limit(6);

          return {
            ...campaign,
            promotions: promotions || [],
          };
        })
      );

      setCampaigns(campaignsWithPromos);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les campagnes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const duplicateCampaign = async (campaignId: string) => {
    try {
      // Fetch the original campaign
      const { data: originalCampaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (fetchError) throw fetchError;

      // Create new campaign with duplicated data (without promotions)
      const { data: newCampaign, error: createError } = await supabase
        .from('campaigns')
        .insert({
          organization_id: originalCampaign.organization_id,
          store_id: originalCampaign.store_id,
          name: `${originalCampaign.name} (copie)`,
          description: originalCampaign.description,
          start_date: originalCampaign.start_date,
          end_date: originalCampaign.end_date,
          status: 'draft', // Set to draft by default
          daily_promotion_count: originalCampaign.daily_promotion_count,
          random_order: originalCampaign.random_order,
          canva_template_url: originalCampaign.canva_template_url,
        })
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: "Campagne dupliquée",
        description: `"${originalCampaign.name}" a été dupliquée. Ajoutez des promotions pour l'activer.`,
      });

      await fetchCampaigns();
      return newCampaign;
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      toast({
        title: "Erreur",
        description: "Impossible de dupliquer la campagne",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      // First, unlink promotions from this campaign
      const { error: unlinkError } = await supabase
        .from('promotions')
        .update({ campaign_id: null })
        .eq('campaign_id', campaignId);

      if (unlinkError) throw unlinkError;

      // Then delete the campaign
      const { error: deleteError } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (deleteError) throw deleteError;

      toast({
        title: "Campagne supprimée",
        description: "La campagne a été supprimée avec succès",
      });

      await fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la campagne",
        variant: "destructive",
      });
      throw error;
    }
  };

  return { 
    campaigns, 
    loading, 
    refetch: fetchCampaigns,
    duplicateCampaign,
    deleteCampaign,
  };
}

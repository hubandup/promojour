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

  return { campaigns, loading, refetch: fetchCampaigns };
}

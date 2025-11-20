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
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
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

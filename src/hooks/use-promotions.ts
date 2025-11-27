import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Promotion {
  id: string;
  organization_id: string;
  store_id: string | null;
  campaign_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  video_url: string | null;
  start_date: string;
  end_date: string;
  status: 'draft' | 'scheduled' | 'active' | 'expired' | 'archived';
  is_mandatory: boolean;
  can_be_modified_by_stores: boolean;
  attributes: any;
  views_count: number;
  clicks_count: number;
  created_at: string;
}

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Promotions fetched:', data); // Debug: vérifier les données
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les promotions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const activePromotions = promotions.filter(p => p.status === 'active');
  const scheduledPromotions = promotions.filter(p => p.status === 'scheduled');
  const topPromotions = [...promotions]
    .sort((a, b) => b.views_count - a.views_count)
    .slice(0, 5);

  const deletePromotion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Promotion supprimée avec succès",
      });
      
      await fetchPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la promotion",
        variant: "destructive",
      });
    }
  };

  return {
    promotions,
    activePromotions,
    scheduledPromotions,
    topPromotions,
    loading,
    refetch: fetchPromotions,
    deletePromotion,
  };
}

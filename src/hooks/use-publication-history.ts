import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePublicationHistory(promotionId: string | undefined) {
  return useQuery({
    queryKey: ['publication-history', promotionId],
    queryFn: async () => {
      if (!promotionId) return [];
      
      const { data, error } = await supabase
        .from('publication_history')
        .select('*')
        .eq('promotion_id', promotionId)
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!promotionId,
  });
}

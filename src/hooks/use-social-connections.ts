import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SocialConnection {
  id: string;
  store_id: string;
  platform: 'facebook' | 'instagram' | 'google_business';
  account_id: string | null;
  account_name: string | null;
  followers_count: number;
  is_connected: boolean;
  last_synced_at: string | null;
  access_token: string | null;
}

export function useSocialConnections(storeId?: string) {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (storeId) {
      fetchConnections();
    }
  }, [storeId]);

  const fetchConnections = async () => {
    if (!storeId) return;

    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select('*')
        .eq('store_id', storeId);

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching social connections:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les connexions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getConnection = (platform: 'facebook' | 'instagram' | 'google_business') => {
    return connections.find(c => c.platform === platform);
  };

  const connectedCount = connections.filter(c => c.is_connected).length;

  return {
    connections: connections || [],
    loading,
    getConnection,
    connectedCount,
    refetch: fetchConnections,
  };
}

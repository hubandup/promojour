import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Store {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  google_maps_url: string | null;
  opening_hours: any;
  qr_code_url: string | null;
  is_active: boolean;
  created_at: string;
}

export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les magasins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { stores, loading, refetch: fetchStores };
}

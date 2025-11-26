import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Store } from "./use-stores";

export function useStoreManagerStore() {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStore(null);
        setLoading(false);
        return;
      }

      // Get store_manager's assigned store
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('store_id')
        .eq('user_id', user.id)
        .eq('role', 'store_manager')
        .maybeSingle();

      if (!userRole?.store_id) {
        setStore(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', userRole.store_id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setStore(data);
    } catch (error) {
      console.error('Error fetching store:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le magasin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { store, loading, refetch: fetchStore };
}

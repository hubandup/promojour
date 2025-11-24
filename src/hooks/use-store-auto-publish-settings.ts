import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AutoPublishSettings {
  auto_publish_facebook: boolean;
  auto_publish_instagram: boolean;
}

export function useStoreAutoPublishSettings(storeId: string) {
  const [settings, setSettings] = useState<AutoPublishSettings>({
    auto_publish_facebook: false,
    auto_publish_instagram: false,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (storeId) {
      fetchSettings();
    }
  }, [storeId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('auto_publish_facebook, auto_publish_instagram')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          auto_publish_facebook: data.auto_publish_facebook || false,
          auto_publish_instagram: data.auto_publish_instagram || false,
        });
      }
    } catch (error) {
      console.error('Error fetching auto-publish settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres de publication automatique",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AutoPublishSettings>) => {
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          store_id: storeId,
          ...newSettings,
        }, {
          onConflict: 'store_id',
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...newSettings }));

      toast({
        title: "Paramètres mis à jour",
        description: "Les préférences de publication automatique ont été enregistrées",
      });

      return true;
    } catch (error) {
      console.error('Error updating auto-publish settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les paramètres",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings,
  };
}

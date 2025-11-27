import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GoogleMerchantAccount {
  id: string;
  store_id: string;
  google_merchant_account_id: string;
  google_business_profile_location_id: string | null;
  google_email: string | null;
  is_connected: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useGoogleMerchant(storeId: string | null) {
  const [account, setAccount] = useState<GoogleMerchantAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (storeId) {
      fetchAccount();
    } else {
      setLoading(false);
    }
  }, [storeId]);

  const fetchAccount = async () => {
    if (!storeId) return;

    try {
      const { data, error } = await supabase
        .from('google_merchant_accounts')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;
      setAccount(data);
    } catch (error) {
      console.error('Error fetching Google Merchant account:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiateOAuth = async () => {
    if (!storeId) {
      toast({
        title: "Erreur",
        description: "ID du magasin manquant",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-merchant-oauth-init', {
        body: { storeId },
      });

      if (error) throw error;

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        data.authUrl,
        'Google OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth result
      const handleMessage = (event: MessageEvent) => {
        if (event.data.success) {
          toast({
            title: "Succès",
            description: "Connecté à Google Merchant Center",
          });
          fetchAccount();
        } else if (event.data.error) {
          toast({
            title: "Erreur",
            description: "Échec de la connexion à Google",
            variant: "destructive",
          });
        }
        window.removeEventListener('message', handleMessage);
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was blocked
      if (!popup || popup.closed) {
        toast({
          title: "Erreur",
          description: "Veuillez autoriser les pop-ups pour ce site",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'initier la connexion",
        variant: "destructive",
      });
    }
  };

  const updateMerchantAccountId = async (merchantAccountId: string) => {
    if (!storeId) return;

    try {
      const { error } = await supabase
        .from('google_merchant_accounts')
        .update({ google_merchant_account_id: merchantAccountId })
        .eq('store_id', storeId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "ID Merchant Center enregistré",
      });

      fetchAccount();
    } catch (error) {
      console.error('Error updating merchant account ID:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'ID",
        variant: "destructive",
      });
    }
  };

  const disconnect = async () => {
    if (!storeId || !account) return;

    try {
      const { error } = await supabase
        .from('google_merchant_accounts')
        .delete()
        .eq('store_id', storeId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Déconnecté de Google Merchant Center",
      });

      setAccount(null);
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    }
  };

  const syncToGoogle = async () => {
    if (!storeId) return;

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-merchant', {
        body: { storeId },
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: data.message || "Synchronisation réussie",
      });

      fetchAccount();
    } catch (error) {
      console.error('Error syncing to Google:', error);
      toast({
        title: "Erreur",
        description: "Échec de la synchronisation",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return {
    account,
    loading,
    syncing,
    initiateOAuth,
    updateMerchantAccountId,
    disconnect,
    syncToGoogle,
    refetch: fetchAccount,
  };
}

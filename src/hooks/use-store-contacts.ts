import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StoreContact {
  id: string;
  name: string;
  city: string | null;
  email: string | null;
  phone: string | null;
}

export function useStoreContacts() {
  const [contacts, setContacts] = useState<StoreContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke('get-store-contacts');

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setContacts(data?.stores || []);
    } catch (err: any) {
      const message = err.message || "Impossible de récupérer les contacts";
      setError(message);
      console.error('Error fetching store contacts:', err);
      
      // Ne pas afficher de toast pour les erreurs 403 (accès refusé)
      if (!message.includes('Accès refusé')) {
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return { contacts, loading, error, refetch: fetchContacts };
}

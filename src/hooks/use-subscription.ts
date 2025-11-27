import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Product IDs from Stripe
const SUBSCRIPTION_TIERS = {
  magasin_pro: {
    product_id: "prod_TV7KeCZNLIdJE1",
    price_id: "price_1SY75QGDOvS4sk4KTCLHOYao",
    name: "Magasin Pro",
    price: 39,
  },
  centrale: {
    product_id: "prod_TV7KAoiegIpbXx",
    price_id: "price_1SY75RGDOvS4sk4KA3XQpZPg",
    name: "Centrale",
    price: 180,
  },
} as const;

export interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
  tier: "free" | "magasin_pro" | "centrale";
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    product_id: null,
    subscription_end: null,
    tier: "free",
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubscription({
          subscribed: false,
          product_id: null,
          subscription_end: null,
          tier: "free",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) throw error;

      let tier: "free" | "magasin_pro" | "centrale" = "free";
      if (data.subscribed && data.product_id) {
        if (data.product_id === SUBSCRIPTION_TIERS.magasin_pro.product_id) {
          tier = "magasin_pro";
        } else if (data.product_id === SUBSCRIPTION_TIERS.centrale.product_id) {
          tier = "centrale";
        }
      }

      setSubscription({
        subscribed: data.subscribed,
        product_id: data.product_id,
        subscription_end: data.subscription_end,
        tier,
      });
    } catch (error) {
      console.error("Error checking subscription:", error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier votre abonnement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (priceId: string, quantity: number = 1) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, quantity },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la session de paiement",
        variant: "destructive",
      });
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le portail de gestion",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    checkSubscription();

    // Subscribe to auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    // Refresh subscription status every minute
    const interval = setInterval(checkSubscription, 60000);

    return () => {
      authSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    subscription,
    loading,
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
    tiers: SUBSCRIPTION_TIERS,
  };
};

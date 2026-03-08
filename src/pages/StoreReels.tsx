import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ReelViewer } from "@/components/ReelViewer";
import { Skeleton } from "@/components/ui/skeleton";
import { Store } from "@/hooks/use-stores";
import { Promotion } from "@/hooks/use-promotions";
import { Helmet } from "react-helmet";

export default function StoreReels() {
  const { storeId, promotionId } = useParams<{ storeId: string; promotionId?: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    const fetchData = async () => {
      try {
        console.log('Fetching store with ID:', storeId);
        
        // Use SECURITY DEFINER function to bypass RLS for anonymous users
        const { data: storeRows, error: storeError } = await supabase
          .rpc("get_public_store_data", { store_id: storeId });

        console.log('Store query result:', { storeRows, storeError });

        if (storeError) throw storeError;
        if (!storeRows || storeRows.length === 0) throw new Error('Store not found');
        
        const storeData = storeRows[0];
        setStore({ ...storeData, phone: null, email: null, organization_id: storeData.id } as any);

        // We need the organization_id - fetch it via a separate approach
        // Since get_public_store_data doesn't return org_id, query stores_public as fallback
        // But first let's get promotions using the store's org
        const { data: storePublicData } = await supabase
          .from("stores_public")
          .select("organization_id")
          .eq("id", storeId)
          .single();
        
        const orgId = storePublicData?.organization_id;
        if (!orgId) throw new Error('Organization not found');

        // Update store with correct org_id
        setStore({ ...storeData, phone: null, email: null, organization_id: orgId } as any);

        // Use SECURITY DEFINER function to fetch active promotions
        console.log('Fetching promotions for organization:', orgId);
        
        const { data: promoData, error: promoError } = await supabase
          .rpc("get_public_promotions_by_org", { org_id: orgId });

        console.log('Promotions query result:', { promoData, promoError, count: promoData?.length });

        if (promoError) throw promoError;
        
        // If a specific promotionId is provided, reorder to show it first
        let orderedPromos = promoData || [];
        if (promotionId && orderedPromos.length > 0) {
          const targetIndex = orderedPromos.findIndex(p => p.id === promotionId);
          if (targetIndex > 0) {
            const [target] = orderedPromos.splice(targetIndex, 1);
            orderedPromos = [target, ...orderedPromos];
          }
        }
        setPromotions(orderedPromos);
      } catch (error) {
        console.error("Error fetching store reels data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId, promotionId]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!store || promotions.length === 0) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Aucune promotion disponible</h1>
          <p className="text-muted-foreground">
            Ce magasin n'a pas de promotions actives pour le moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{store.name} - Promotions | PromoJour</title>
        <meta
          name="description"
          content={`Découvrez les promotions actuelles de ${store.name}. ${promotions.length} offres disponibles.`}
        />
        <meta property="og:title" content={`${store.name} - Promotions`} />
        <meta
          property="og:description"
          content={`Découvrez les promotions actuelles de ${store.name}`}
        />
        {promotions[0]?.image_url && (
          <meta property="og:image" content={promotions[0].image_url} />
        )}
        <meta property="og:type" content="website" />
      </Helmet>
      <ReelViewer store={store} promotions={promotions} />
    </>
  );
}

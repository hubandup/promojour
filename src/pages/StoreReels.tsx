import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ReelViewer } from "@/components/ReelViewer";
import { Skeleton } from "@/components/ui/skeleton";
import { Store } from "@/hooks/use-stores";
import { Promotion } from "@/hooks/use-promotions";
import { Helmet } from "react-helmet";

export default function StoreReels() {
  const { storeId } = useParams<{ storeId: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    const fetchData = async () => {
      try {
        // Fetch store info
        const { data: storeData, error: storeError } = await supabase
          .from("stores")
          .select("*")
          .eq("id", storeId)
          .eq("is_active", true)
          .single();

        if (storeError) throw storeError;
        setStore(storeData);

        // Fetch active promotions for this store
        // Include both store-specific promotions and central promotions (store_id = null)
        const { data: promoData, error: promoError } = await supabase
          .from("promotions")
          .select("*")
          .eq("status", "active")
          .or(`store_id.eq.${storeId},and(store_id.is.null,organization_id.eq.${storeData.organization_id})`)
          .order("created_at", { ascending: false });

        if (promoError) throw promoError;
        setPromotions(promoData || []);
      } catch (error) {
        console.error("Error fetching store reels data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId]);

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

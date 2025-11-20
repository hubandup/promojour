import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Store } from "@/hooks/use-stores";
import { Helmet } from "react-helmet";
import { MapPin, Phone, Clock, ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoreFrontend() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [orgLogo, setOrgLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    const fetchStore = async () => {
      try {
        const { data: storeData, error: storeError } = await supabase
          .from("stores")
          .select("*")
          .eq("id", storeId)
          .eq("is_active", true)
          .single();

        if (storeError) throw storeError;
        setStore(storeData);

        // Fetch organization logo
        if (storeData.organization_id) {
          const { data: orgData } = await supabase
            .from("organizations")
            .select("logo_url")
            .eq("id", storeData.organization_id)
            .single();
          
          if (orgData?.logo_url) {
            setOrgLogo(orgData.logo_url);
          }
        }
      } catch (error) {
        console.error("Error fetching store data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeId]);

  const formatOpeningHours = (hours: any) => {
    if (!hours) return null;
    
    const daysOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const daysLabels: { [key: string]: string } = {
      lundi: 'Lundi',
      mardi: 'Mardi',
      mercredi: 'Mercredi',
      jeudi: 'Jeudi',
      vendredi: 'Vendredi',
      samedi: 'Samedi',
      dimanche: 'Dimanche'
    };

    return daysOrder.map(day => {
      const dayData = hours[day];
      if (!dayData) return null;

      return (
        <div key={day} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
          <span className="font-medium text-foreground">{daysLabels[day]}</span>
          <span className="text-muted-foreground">
            {dayData.closed ? 'Fermé' : `${dayData.open || ''} - ${dayData.close || ''}`}
          </span>
        </div>
      );
    });
  };

  const handleBackToReels = () => {
    const currentPath = window.location.pathname;
    const reelsPath = currentPath.replace(/\/magasin$/, '');
    navigate(reelsPath);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Magasin introuvable</h1>
          <p className="text-muted-foreground">
            Ce magasin n'existe pas ou n'est plus actif.
          </p>
        </div>
      </div>
    );
  }

  const fullAddress = [
    store.address_line1,
    store.address_line2,
    `${store.postal_code || ''} ${store.city || ''}`.trim(),
    store.country
  ].filter(Boolean).join(', ');

  return (
    <>
      <Helmet>
        <title>{store.name} - Informations | PromoJour</title>
        <meta
          name="description"
          content={`Informations de contact et horaires d'ouverture de ${store.name}.`}
        />
        <meta property="og:title" content={`${store.name} - Informations`} />
        <meta
          property="og:description"
          content={`Découvrez ${store.name} : adresse, horaires et contact.`}
        />
        {store.cover_image_url && (
          <meta property="og:image" content={store.cover_image_url} />
        )}
        <meta property="og:type" content="business.business" />
      </Helmet>

      <div className="min-h-screen w-full bg-background">
        {/* Back button */}
        <div className="fixed top-4 left-4 z-50">
          <Button
            onClick={handleBackToReels}
            variant="secondary"
            size="icon"
            className="glass-card hover:bg-background/80"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Cover Image */}
        {store.cover_image_url && (
          <div className="w-full h-64 md:h-96 relative overflow-hidden">
            <img
              src={store.cover_image_url}
              alt={`Couverture ${store.name}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}

        {/* Store Info */}
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            {orgLogo ? (
              <img
                src={orgLogo}
                alt={`Logo ${store.name}`}
                className="w-20 h-20 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center border border-border">
                <span className="text-2xl font-bold text-primary">{store.name.substring(0, 2).toUpperCase()}</span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{store.name}</h1>
              {store.description && (
                <p className="text-muted-foreground mb-4">{store.description}</p>
              )}
              <Button
                onClick={handleBackToReels}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir nos promotions
              </Button>
            </div>
          </div>

          {/* Contact Info Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Address */}
            {fullAddress && (
              <div className="glass-card p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Adresse</h2>
                </div>
                <p className="text-muted-foreground pl-13">{fullAddress}</p>
                {store.google_maps_url && (
                  <a
                    href={store.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-primary hover:underline pl-13"
                  >
                    Voir sur Google Maps →
                  </a>
                )}
              </div>
            )}

            {/* Phone */}
            {store.phone && (
              <div className="glass-card p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Téléphone</h2>
                </div>
                <a
                  href={`tel:${store.phone}`}
                  className="text-muted-foreground hover:text-primary pl-13 block"
                >
                  {store.phone}
                </a>
              </div>
            )}
          </div>

          {/* Opening Hours */}
          {store.opening_hours && (
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Horaires d'ouverture</h2>
              </div>
              <div className="pl-13 space-y-1">
                {formatOpeningHours(store.opening_hours)}
              </div>
            </div>
          )}

          {/* Website Link */}
          {store.website_url && (
            <div className="text-center pt-4">
              <a
                href={store.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                Visiter notre site web →
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

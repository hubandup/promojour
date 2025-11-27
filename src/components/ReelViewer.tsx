import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Store } from "@/hooks/use-stores";
import { Promotion } from "@/hooks/use-promotions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import { BarcodeDialog } from "@/components/BarcodeDialog";

interface ReelViewerProps {
  store: Store;
  promotions: Promotion[];
  previewMode?: boolean;
}

export function ReelViewer({ store, promotions, previewMode = false }: ReelViewerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewTracked, setViewTracked] = useState<Set<string>>(new Set());
  const [orgLogo, setOrgLogo] = useState<string | null>(null);
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  const currentPromo = promotions[currentIndex];

  // Fetch organization logo
  useEffect(() => {
    const fetchOrgLogo = async () => {
      if (!store.organization_id) return;
      
      const { data: orgData } = await supabase
        .from("organizations")
        .select("logo_url")
        .eq("id", store.organization_id)
        .single();
      
      if (orgData?.logo_url) {
        setOrgLogo(orgData.logo_url);
      }
    };

    fetchOrgLogo();
  }, [store.organization_id]);

  const handleLogoClick = () => {
    if (previewMode) return;
    navigate(`${location.pathname}/magasin`);
  };

  // Track view for current promotion
  const trackView = useCallback(async (promoId: string) => {
    if (previewMode || viewTracked.has(promoId)) return; // Skip in preview mode or if already tracked

    try {
      const { data: promo } = await supabase
        .from("promotions")
        .select("views_count")
        .eq("id", promoId)
        .single();

      if (promo) {
        await supabase
          .from("promotions")
          .update({ views_count: (promo.views_count || 0) + 1 })
          .eq("id", promoId);
      }
      setViewTracked((prev) => new Set(prev).add(promoId));
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  }, [viewTracked, previewMode]);

  // Track click on CTA
  const trackClick = async () => {
    if (previewMode) return; // Skip in preview mode
    
    try {
      const { data: promo } = await supabase
        .from("promotions")
        .select("clicks_count")
        .eq("id", currentPromo.id)
        .single();

      if (promo) {
        await supabase
          .from("promotions")
          .update({ clicks_count: (promo.clicks_count || 0) + 1 })
          .eq("id", currentPromo.id);
      }
    } catch (error) {
      console.error("Error tracking click:", error);
    }
  };

  const handleCtaClick = async () => {
    console.log('[ReelViewer] === CTA CLICKED ===');
    console.log('[ReelViewer] Current promo:', currentPromo);
    console.log('[ReelViewer] Attributes:', currentPromo.attributes);
    
    await trackClick();
    
    const ctaActionType = currentPromo.attributes?.ctaActionType || "url";
    const eanCode = currentPromo.attributes?.eanCode;
    const ctaUrl = currentPromo.attributes?.ctaUrl;
    
    console.log('[ReelViewer] CTA Action Type:', ctaActionType);
    console.log('[ReelViewer] EAN Code:', eanCode);
    console.log('[ReelViewer] CTA URL:', ctaUrl);
    
    if (ctaActionType === "ean") {
      if (eanCode) {
        console.log('[ReelViewer] Opening barcode dialog with code:', eanCode);
        setBarcodeDialogOpen(true);
      } else {
        console.error('[ReelViewer] No EAN code found!');
      }
    } else {
      if (ctaUrl) {
        console.log('[ReelViewer] Opening URL:', ctaUrl);
        window.open(ctaUrl, "_blank");
      } else {
        console.log('[ReelViewer] No URL configured');
      }
    }
  };

  // Handle video autoplay
  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.play().catch(console.error);
    }

    // Pause other videos
    videoRefs.current.forEach((video, idx) => {
      if (video && idx !== currentIndex) {
        video.pause();
        video.currentTime = 0;
      }
    });

    // Track view
    if (currentPromo) {
      trackView(currentPromo.id);
    }
  }, [currentIndex, currentPromo, trackView]);

  // Handle swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < promotions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    }
  };

  // Handle wheel scroll
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0 && currentIndex < promotions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [currentIndex, promotions.length]);

  const goToNext = () => {
    if (currentIndex < promotions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {promotions.map((promo, index) => (
        <div
          key={promo.id}
          className={`absolute inset-0 transition-transform duration-500 ${
            index === currentIndex
              ? "translate-y-0"
              : index < currentIndex
              ? "-translate-y-full"
              : "translate-y-full"
          }`}
        >
          {/* Media (Image or Video) */}
          {promo.video_url ? (
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={promo.video_url}
              className="absolute inset-0 w-full h-full object-cover"
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={promo.image_url || "/placeholder.svg"}
              alt={promo.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Top gradient with store info */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-4 pt-safe z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogoClick}
                className={`${!previewMode ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                disabled={previewMode}
              >
                <Avatar className="h-12 w-12 border-2 border-white">
                  <AvatarImage src={orgLogo || store.logo_url || ""} alt={store.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {store.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1">
                <h2 className="font-semibold text-white text-lg leading-tight">
                  {store.name}
                </h2>
                {store.city && (
                  <p className="text-white/80 text-sm">{store.city}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom gradient with promo info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pb-safe z-10">
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {promo.title}
                </h1>
                {promo.description && (
                  <p className="text-white/90 text-sm line-clamp-3 mb-3">
                    {promo.description}
                  </p>
                )}
                {promo.category && (
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium mb-3">
                    {promo.category}
                  </span>
                )}
              </div>

              {/* Pricing */}
              {promo.attributes && (
                <div className="flex items-baseline gap-3">
                  {promo.attributes.originalPrice && (
                    <span className="text-white/60 text-lg line-through">
                      {parseFloat(promo.attributes.originalPrice).toFixed(2)}€
                    </span>
                  )}
                  {promo.attributes.discountedPrice && (
                    <span className="text-white text-3xl font-bold">
                      {parseFloat(promo.attributes.discountedPrice).toFixed(2)}€
                    </span>
                  )}
                  {promo.attributes.discountPercentage && (
                    <span className="px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-sm font-bold">
                      -{promo.attributes.discountPercentage}%
                    </span>
                  )}
                </div>
              )}

              {/* CTA Button */}
              <Button
                size="lg"
                className="w-full bg-white text-black hover:bg-white/90 font-semibold shadow-lg"
                onClick={handleCtaClick}
              >
                {currentPromo.attributes?.ctaText || "J'en Profite"}
              </Button>
            </div>
          </div>

          {/* Navigation arrows */}
          {index === currentIndex && (
            <>
              {currentIndex > 0 && (
                <button
                  onClick={goToPrev}
                  className="absolute top-1/2 right-4 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                  aria-label="Promotion précédente"
                >
                  <ChevronUp className="h-6 w-6" />
                </button>
              )}
              {currentIndex < promotions.length - 1 && (
                <button
                  onClick={goToNext}
                  className="absolute bottom-32 right-4 z-20 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                  aria-label="Promotion suivante"
                >
                  <ChevronDown className="h-6 w-6" />
                </button>
              )}
            </>
          )}

          {/* Progress indicator */}
          {index === currentIndex && promotions.length > 1 && (
            <div className="absolute top-20 right-4 z-20 flex flex-col gap-2">
              {promotions.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1 h-8 rounded-full transition-colors ${
                    idx === currentIndex
                      ? "bg-white"
                      : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Barcode Dialog */}
      {currentPromo?.attributes?.eanCode && (
        <BarcodeDialog
          open={barcodeDialogOpen}
          onOpenChange={setBarcodeDialogOpen}
          eanCode={currentPromo.attributes.eanCode}
          promotionTitle={currentPromo.title}
        />
      )}
    </div>
  );
}

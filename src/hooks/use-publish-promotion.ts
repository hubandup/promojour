import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PublishResult {
  success: boolean;
  platforms: string[];
  error?: string;
}

export function usePublishPromotion() {
  const [publishing, setPublishing] = useState(false);

  const publishPromotion = async (
    promotionId: string,
    storeId: string,
    platforms: string[] = ['facebook']
  ): Promise<PublishResult> => {
    setPublishing(true);
    try {
      // Fetch promotion to determine media type
      const { data: promotion, error: promoError } = await supabase
        .from('promotions')
        .select('video_url, image_url')
        .eq('id', promotionId)
        .single();

      if (promoError) {
        console.error('Error fetching promotion for publish:', promoError);
        toast.error("Impossible de récupérer la promotion");
        return { success: false, platforms: [] };
      }

      const hasVideo = !!promotion?.video_url;
      const hasImage = !!promotion?.image_url;

      if (!hasVideo && !hasImage) {
        toast.error("Cette promotion n'a pas de média à publier");
        return { success: false, platforms: [] };
      }

      const edgeFunction = hasVideo ? 'publish-social-reel' : 'publish-social-post';
      console.log(`Publishing via ${edgeFunction} to: ${platforms.join(', ')}`);

      const { data, error } = await supabase.functions.invoke(edgeFunction, {
        body: {
          promotionId,
          storeId,
          platforms,
        },
      });

      if (error) {
        console.error('Publish edge function error:', error);
        toast.error("Échec de la publication sur les réseaux sociaux");
        return { success: false, platforms: [], error: error.message };
      }

      const successPlatforms = data?.results
        ?.filter((r: any) => r.success)
        .map((r: any) => r.platform) || [];

      const failedPlatforms = data?.results
        ?.filter((r: any) => !r.success) || [];

      if (successPlatforms.length > 0) {
        toast.success(`Publié sur ${successPlatforms.join(' et ')}`);
      }

      if (failedPlatforms.length > 0) {
        const errorMsg = failedPlatforms.map((r: any) => r.error).join(', ');
        console.error('Publish failures:', failedPlatforms);
        if (successPlatforms.length === 0) {
          toast.error(errorMsg || "Échec de la publication");
        }
      }

      return { success: successPlatforms.length > 0, platforms: successPlatforms };
    } catch (error) {
      console.error('Error publishing promotion:', error);
      toast.error("Erreur lors de la publication");
      return { success: false, platforms: [], error: String(error) };
    } finally {
      setPublishing(false);
    }
  };

  return { publishPromotion, publishing };
}

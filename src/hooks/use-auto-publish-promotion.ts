import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAutoPublishPromotion() {
  const { toast } = useToast();

  const tryAutoPublish = async (promotionId: string, storeId: string) => {
    try {
      // Récupérer les paramètres de publication automatique
      const { data: settings, error: settingsError } = await supabase
        .from('store_settings')
        .select('auto_publish_facebook, auto_publish_instagram')
        .eq('store_id', storeId)
        .maybeSingle();

      if (settingsError) {
        console.error('Error fetching auto-publish settings:', settingsError);
        return;
      }

      if (!settings?.auto_publish_facebook && !settings?.auto_publish_instagram) {
        return;
      }

      // Récupérer la promotion pour vérifier le type de média
      const { data: promotion, error: promoError } = await supabase
        .from('promotions')
        .select('video_url, image_url')
        .eq('id', promotionId)
        .single();

      if (promoError) {
        console.error('Error fetching promotion:', promoError);
        return;
      }

      // Déterminer quelle Edge Function appeler selon le type de média
      const hasVideo = !!promotion?.video_url;
      const hasImage = !!promotion?.image_url;

      // Si ni vidéo ni image, on ne peut pas publier
      if (!hasVideo && !hasImage) {
        console.log('Promotion has no media, skipping auto-publish');
        return;
      }

      // Vérifier les connexions sociales actives
      const { data: connections, error: connError } = await supabase
        .from('social_connections')
        .select('platform, is_connected')
        .eq('store_id', storeId)
        .eq('is_connected', true);

      if (connError) {
        console.error('Error fetching social connections:', connError);
        return;
      }

      const platforms = [];
      const hasActiveFacebook = connections?.some(c => c.platform === 'facebook');
      const hasActiveInstagram = connections?.some(c => c.platform === 'instagram');

      if (settings.auto_publish_facebook && hasActiveFacebook) {
        platforms.push('facebook');
      }
      if (settings.auto_publish_instagram && hasActiveInstagram) {
        platforms.push('instagram');
      }

      if (platforms.length === 0) {
        console.log('No active social connections for auto-publish');
        return;
      }

      // Appeler la bonne Edge Function selon le type de média
      const edgeFunction = hasVideo ? 'publish-social-reel' : 'publish-social-post';
      console.log(`Auto-publishing via ${edgeFunction} to: ${platforms.join(', ')}`);
      
      const { data, error } = await supabase.functions.invoke(edgeFunction, {
        body: { 
          promotionId, 
          storeId,
          platforms 
        }
      });

      if (error) {
        console.error('Auto-publish error:', error);
        toast({
          title: "Publication automatique échouée",
          description: "La promotion a été activée mais n'a pas pu être publiée sur les réseaux sociaux",
          variant: "destructive",
        });
        return;
      }

      const successPlatforms = data?.results
        ?.filter((r: any) => r.success)
        .map((r: any) => r.platform) || [];

      if (successPlatforms.length > 0) {
        toast({
          title: "Publication automatique réussie",
          description: `La promotion a été publiée sur ${successPlatforms.join(' et ')}`,
        });
      }

    } catch (error) {
      console.error('Error in auto-publish:', error);
    }
  };

  return { tryAutoPublish };
}

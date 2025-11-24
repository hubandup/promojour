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

      // Si aucune publication automatique n'est activée, on arrête
      if (!settings?.auto_publish_facebook && !settings?.auto_publish_instagram) {
        return;
      }

      // Récupérer la promotion pour vérifier qu'elle a une vidéo
      const { data: promotion, error: promoError } = await supabase
        .from('promotions')
        .select('video_url')
        .eq('id', promotionId)
        .single();

      if (promoError) {
        console.error('Error fetching promotion:', promoError);
        return;
      }

      // Si pas de vidéo, on ne peut pas publier
      if (!promotion?.video_url) {
        console.log('Promotion has no video, skipping auto-publish');
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

      // Construire la liste des plateformes à publier
      const platforms = [];
      const hasActiveFacebook = connections?.some(c => c.platform === 'facebook');
      const hasActiveInstagram = connections?.some(c => c.platform === 'instagram');

      if (settings.auto_publish_facebook && hasActiveFacebook) {
        platforms.push('facebook');
      }
      if (settings.auto_publish_instagram && hasActiveInstagram) {
        platforms.push('instagram');
      }

      // Si aucune plateforme disponible, on arrête
      if (platforms.length === 0) {
        console.log('No active social connections for auto-publish');
        return;
      }

      // Appeler la fonction de publication
      console.log(`Auto-publishing to: ${platforms.join(', ')}`);
      
      const { data, error } = await supabase.functions.invoke('publish-social-reel', {
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

      // Afficher un toast de succès avec les résultats
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
      // On ne bloque pas l'activation de la promotion si la publication échoue
    }
  };

  return { tryAutoPublish };
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSocialConnections } from "@/hooks/use-social-connections";
import { Send, Loader2, Image as ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface ManualPublishTestProps {
  storeId: string;
}

export function ManualPublishTest({ storeId }: ManualPublishTestProps) {
  const [selectedPromoId, setSelectedPromoId] = useState<string>("");
  const [publishing, setPublishing] = useState(false);
  const [publishingPost, setPublishingPost] = useState(false);
  const { toast } = useToast();
  const { connections } = useSocialConnections(storeId);

  const facebookConnected = connections.some(
    c => c.platform === 'facebook' && c.is_connected
  );

  // Récupérer les promotions actives avec vidéo (centrales + spécifiques au magasin)
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions-with-video', storeId],
    queryFn: async () => {
      // Récupérer l'organization_id du store
      const { data: store } = await supabase
        .from('stores')
        .select('organization_id')
        .eq('id', storeId)
        .single();

      if (!store) throw new Error('Store not found');

      // Récupérer toutes les promotions actives et programmées (centrales ou du magasin)
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('organization_id', store.organization_id)
        .in('status', ['active', 'scheduled'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
  });

  const handlePublish = async () => {
    console.log('[ManualPublishTest] handlePublish called');
    console.log('[ManualPublishTest] selectedPromoId:', selectedPromoId);
    console.log('[ManualPublishTest] storeId:', storeId);
    
    if (!selectedPromoId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une promotion",
        variant: "destructive",
      });
      return;
    }

    const selectedPromo = promotions?.find(p => p.id === selectedPromoId);
    console.log('[ManualPublishTest] selectedPromo:', selectedPromo);
    
    if (!selectedPromo?.video_url) {
      toast({
        title: "Vidéo requise",
        description: "Seules les promotions avec vidéo peuvent être publiées en Reel sur Facebook",
        variant: "destructive",
      });
      return;
    }

    setPublishing(true);

    try {
      console.log('[ManualPublishTest] Calling publish-social-reel...');
      const { data, error } = await supabase.functions.invoke('publish-social-reel', {
        body: {
          promotionId: selectedPromoId,
          storeId: storeId,
          platforms: ['facebook'],
        },
      });

      console.log('[ManualPublishTest] Response data:', data);
      console.log('[ManualPublishTest] Response error:', error);

      if (error) throw error;

      if (data?.success) {
        const fbResult = data.results.find((r: any) => r.platform === 'facebook');
        
        if (fbResult?.success) {
          toast({
            title: "Publication réussie !",
            description: "La promotion a été publiée sur Facebook",
          });
        } else {
          toast({
            title: "Erreur de publication",
            description: fbResult?.error || "La publication a échoué",
            variant: "destructive",
          });
        }
      } else {
        console.log('[ManualPublishTest] data.success is falsy:', data);
        toast({
          title: "Erreur",
          description: data?.message || "La publication a échoué",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[ManualPublishTest] Error publishing:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de publier la promotion",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishPost = async () => {
    console.log('[ManualPublishTest] handlePublishPost called');
    console.log('[ManualPublishTest] selectedPromoId:', selectedPromoId);
    console.log('[ManualPublishTest] storeId:', storeId);
    
    if (!selectedPromoId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une promotion",
        variant: "destructive",
      });
      return;
    }

    const selectedPromo = promotions?.find(p => p.id === selectedPromoId);
    console.log('[ManualPublishTest] selectedPromo:', selectedPromo);
    
    if (!selectedPromo?.image_url) {
      toast({
        title: "Image requise",
        description: "La promotion doit contenir une image pour être publiée en post",
        variant: "destructive",
      });
      return;
    }

    setPublishingPost(true);

    try {
      console.log('[ManualPublishTest] Calling publish-social-post...');
      const { data, error } = await supabase.functions.invoke('publish-social-post', {
        body: {
          promotionId: selectedPromoId,
          storeId: storeId,
          platforms: ['facebook'],
        },
      });

      console.log('[ManualPublishTest] Response data:', data);
      console.log('[ManualPublishTest] Response error:', error);

      if (error) throw error;

      if (data?.success) {
        const fbResult = data.results.find((r: any) => r.platform === 'facebook');
        
        if (fbResult?.success) {
          toast({
            title: "Publication réussie !",
            description: "La promotion a été publiée sur Facebook en tant que post image",
          });
        } else {
          toast({
            title: "Erreur de publication",
            description: fbResult?.error || "La publication a échoué",
            variant: "destructive",
          });
        }
      } else {
        console.log('[ManualPublishTest] data.success is falsy:', data);
        toast({
          title: "Erreur",
          description: data?.message || "La publication a échoué",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[ManualPublishTest] Error publishing post:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de publier la promotion",
        variant: "destructive",
      });
    } finally {
      setPublishingPost(false);
    }
  };

  if (!facebookConnected) {
    return null;
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Send className="h-5 w-5" />
          Test de publication manuelle
        </CardTitle>
        <CardDescription>
          Publiez une promotion manuellement sur Facebook : Reel (vidéo) ou Post classique (image)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sélectionnez une promotion</label>
          <Select value={selectedPromoId} onValueChange={setSelectedPromoId}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir une promotion..." />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading" disabled>Chargement...</SelectItem>
              ) : promotions && promotions.length > 0 ? (
                promotions.map((promo) => (
                  <SelectItem key={promo.id} value={promo.id}>
                    <div className="flex items-center gap-2">
                      <span>{promo.title}</span>
                      {promo.video_url && (
                        <Badge variant="outline" className="text-xs">
                          Vidéo
                        </Badge>
                      )}
                      {!promo.video_url && promo.image_url && (
                        <Badge variant="secondary" className="text-xs">
                          Image
                        </Badge>
                      )}
                      {!promo.video_url && !promo.image_url && (
                        <Badge variant="secondary" className="text-xs opacity-50">
                          Pas de média
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  Aucune promotion disponible
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handlePublish}
            disabled={
              !selectedPromoId || 
              publishing || 
              publishingPost ||
              isLoading || 
              !promotions?.find(p => p.id === selectedPromoId)?.video_url
            }
            variant="default"
          >
            {publishing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reel...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Reel (vidéo)
              </>
            )}
          </Button>

          <Button
            onClick={handlePublishPost}
            disabled={
              !selectedPromoId || 
              publishing || 
              publishingPost ||
              isLoading || 
              !promotions?.find(p => p.id === selectedPromoId)?.image_url
            }
            variant="secondary"
          >
            {publishingPost ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Post...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Post (image)
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          {selectedPromoId && !promotions?.find(p => p.id === selectedPromoId)?.video_url && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2">
              <p className="text-xs text-yellow-600 dark:text-yellow-500">
                ⚠️ Pas de vidéo : utilisez le bouton "Post (image)" pour publier cette promotion
              </p>
            </div>
          )}
          
          {selectedPromoId && !promotions?.find(p => p.id === selectedPromoId)?.image_url && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2">
              <p className="text-xs text-yellow-600 dark:text-yellow-500">
                ⚠️ Pas d'image : ajoutez une image ou une vidéo pour publier cette promotion
              </p>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            💡 <strong>Reel (vidéo)</strong> : publie la vidéo en format Reel • <strong>Post (image)</strong> : publie l'image en post classique
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

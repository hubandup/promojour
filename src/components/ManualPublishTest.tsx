import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSocialConnections } from "@/hooks/use-social-connections";
import { Send, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface ManualPublishTestProps {
  storeId: string;
}

export function ManualPublishTest({ storeId }: ManualPublishTestProps) {
  const [selectedPromoId, setSelectedPromoId] = useState<string>("");
  const [publishing, setPublishing] = useState(false);
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

      // Récupérer les promotions actives avec vidéo (centrales ou du magasin)
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('organization_id', store.organization_id)
        .eq('status', 'active')
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
  });

  const handlePublish = async () => {
    if (!selectedPromoId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une promotion",
        variant: "destructive",
      });
      return;
    }

    setPublishing(true);

    try {
      const { data, error } = await supabase.functions.invoke('publish-social-reel', {
        body: {
          promotionId: selectedPromoId,
          storeId: storeId,
          platforms: ['facebook'],
        },
      });

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
      }
    } catch (error) {
      console.error('Error publishing:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de publier la promotion",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
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
          Publiez une promotion manuellement sur Facebook pour tester la connexion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sélectionnez une promotion</label>
          <Select value={selectedPromoId} onValueChange={setSelectedPromoId}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir une promotion avec vidéo..." />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading" disabled>Chargement...</SelectItem>
              ) : promotions && promotions.length > 0 ? (
                promotions.map((promo) => (
                  <SelectItem key={promo.id} value={promo.id}>
                    <div className="flex items-center gap-2">
                      <span>{promo.title}</span>
                      <Badge variant="outline" className="text-xs">
                        Vidéo
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  Aucune promotion avec vidéo disponible
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handlePublish}
          disabled={!selectedPromoId || publishing || isLoading}
          className="w-full"
        >
          {publishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publication en cours...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Publier sur Facebook
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          💡 Cette action publiera immédiatement la promotion sélectionnée sur votre page Facebook en tant que Reel.
        </p>
      </CardContent>
    </Card>
  );
}

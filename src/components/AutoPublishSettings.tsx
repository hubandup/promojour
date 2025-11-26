import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Facebook, Instagram, Zap } from "lucide-react";
import { useStoreAutoPublishSettings } from "@/hooks/use-store-auto-publish-settings";
import { useSocialConnections } from "@/hooks/use-social-connections";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AutoPublishSettingsProps {
  storeId: string;
}

export function AutoPublishSettings({ storeId }: AutoPublishSettingsProps) {
  const { settings, loading, updateSettings } = useStoreAutoPublishSettings(storeId);
  const { connections, loading: connectionsLoading } = useSocialConnections(storeId);

  const facebookConnected = connections.some(c => c.platform === 'facebook' && c.is_connected);
  const instagramConnected = connections.some(c => c.platform === 'instagram' && c.is_connected);

  if (loading || connectionsLoading || !settings) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[hsl(var(--primary))]" />
          Publication automatique
        </CardTitle>
        <CardDescription>
          Publiez automatiquement vos promotions vidéo sur les réseaux sociaux lors de leur activation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!facebookConnected && !instagramConnected && (
          <Alert>
            <AlertDescription>
              Connectez d'abord vos comptes Facebook et/ou Instagram dans la section "Réseaux Sociaux" pour activer la publication automatique.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Facebook className="h-5 w-5 text-[hsl(var(--primary))]" />
              <div className="flex-1">
                <Label htmlFor="auto-facebook" className="text-base font-medium">
                  Facebook
                </Label>
                <p className="text-sm text-muted-foreground">
                  Publier automatiquement les promotions vidéo sur votre page Facebook
                </p>
              </div>
            </div>
            <Switch
              id="auto-facebook"
              checked={settings?.auto_publish_facebook ?? false}
              disabled={!facebookConnected}
              onCheckedChange={(checked) => 
                updateSettings({ auto_publish_facebook: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Instagram className="h-5 w-5 text-[hsl(var(--primary))]" />
              <div className="flex-1">
                <Label htmlFor="auto-instagram" className="text-base font-medium">
                  Instagram
                </Label>
                <p className="text-sm text-muted-foreground">
                  Publier automatiquement les promotions vidéo en Reels sur Instagram
                </p>
              </div>
            </div>
            <Switch
              id="auto-instagram"
              checked={settings?.auto_publish_instagram ?? false}
              disabled={!instagramConnected}
              onCheckedChange={(checked) => 
                updateSettings({ auto_publish_instagram: checked })
              }
            />
          </div>
        </div>

        <Alert>
          <AlertDescription>
            💡 Seules les promotions avec une vidéo seront publiées automatiquement. Les promotions sans vidéo seront ignorées.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

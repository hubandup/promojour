import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSocialConnections } from "@/hooks/use-social-connections";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Instagram, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SocialConnectionsManagerProps {
  storeId: string;
}

export function SocialConnectionsManager({ storeId }: SocialConnectionsManagerProps) {
  const { connections, loading, refetch } = useSocialConnections(storeId);
  const { toast } = useToast();

  const handleConnectFacebook = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('facebook-oauth-init', {
        body: { storeId }
      });

      if (error) throw error;

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error initiating Facebook OAuth:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'initier la connexion Facebook",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (platform: 'facebook' | 'instagram' | 'google_business') => {
    try {
      const { error } = await supabase
        .from('social_connections')
        .update({ 
          is_connected: false,
          access_token: null,
          refresh_token: null,
        })
        .eq('store_id', storeId)
        .eq('platform', platform);

      if (error) throw error;

      toast({
        title: "Déconnexion réussie",
        description: `Le compte ${platform} a été déconnecté`,
      });

      refetch();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter le compte",
        variant: "destructive",
      });
    }
  };

  // Vérifier si la connexion est vraiment active (is_connected ET access_token présent)
  const isReallyConnected = (connection: any) => {
    return connection?.is_connected && connection?.access_token;
  };

  const facebookConnection = connections.find(c => c.platform === 'facebook');
  const instagramConnection = connections.find(c => c.platform === 'instagram');
  const gmbConnection = connections.find(c => c.platform === 'google_business');

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-[hsl(var(--primary))]" />
            Facebook
          </CardTitle>
          <CardDescription>
            Publiez vos promotions sur votre page Facebook
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isReallyConnected(facebookConnection) ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default">Connecté</Badge>
                {facebookConnection.account_name && (
                  <span className="text-sm text-muted-foreground">
                    {facebookConnection.account_name}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => handleDisconnect('facebook')}
              >
                Déconnecter
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnectFacebook}>
              <Facebook className="mr-2 h-4 w-4" />
              Connecter Facebook
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-[hsl(var(--primary))]" />
            Instagram
          </CardTitle>
          <CardDescription>
            Publiez vos promotions en Reels sur Instagram
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isReallyConnected(instagramConnection) ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default">Connecté</Badge>
                {instagramConnection.account_name && (
                  <span className="text-sm text-muted-foreground">
                    @{instagramConnection.account_name}
                  </span>
                )}
                {instagramConnection.followers_count > 0 && (
                  <span className="text-sm text-muted-foreground">
                    • {instagramConnection.followers_count} abonnés
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => handleDisconnect('instagram')}
              >
                Déconnecter
              </Button>
            </div>
          ) : (
            <div>
              {isReallyConnected(facebookConnection) ? (
                <p className="text-sm text-muted-foreground">
                  Instagram se connecte automatiquement avec Facebook.
                  {!instagramConnection && " Aucun compte Instagram Business trouvé sur cette page Facebook."}
                </p>
              ) : (
                <Button onClick={handleConnectFacebook}>
                  <Facebook className="mr-2 h-4 w-4" />
                  Connecter via Facebook
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[hsl(var(--primary))]" />
            Google My Business
          </CardTitle>
          <CardDescription>
            Publiez vos promotions sur votre fiche Google Business
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isReallyConnected(gmbConnection) ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default">Connecté</Badge>
                {gmbConnection.account_name && (
                  <span className="text-sm text-muted-foreground">
                    {gmbConnection.account_name}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => handleDisconnect('google_business')}
              >
                Déconnecter
              </Button>
            </div>
          ) : (
            <Button variant="outline" disabled>
              <MapPin className="mr-2 h-4 w-4" />
              Bientôt disponible
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

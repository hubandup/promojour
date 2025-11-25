import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSocialConnections } from "@/hooks/use-social-connections";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Instagram, MapPin, AlertCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";

interface SocialConnectionsManagerProps {
  storeId: string;
}

export function SocialConnectionsManager({ storeId }: SocialConnectionsManagerProps) {
  const { connections, loading, refetch } = useSocialConnections(storeId);
  const { toast } = useToast();
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  
  const redirectUri = "https://rrcrfwhblesarezabsfo.supabase.co/functions/v1/facebook-oauth-callback";

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
      {showConfigGuide && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration requise - Meta Developer Console</AlertTitle>
          <AlertDescription className="space-y-3 mt-2">
            <p className="text-sm">
              Pour connecter Facebook, configurez votre application dans la{" "}
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Console Meta Developer
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            
            <div className="space-y-2 text-sm">
              <div>
                <strong>1. Facebook Login → Settings :</strong>
                <div className="ml-4 mt-1 p-2 bg-muted rounded-md font-mono text-xs break-all">
                  Valid OAuth Redirect URIs: {redirectUri}
                </div>
              </div>
              
              <div>
                <strong>2. Settings → Basic :</strong>
                <div className="ml-4 mt-1">
                  <div className="p-2 bg-muted rounded-md font-mono text-xs">
                    App Domains: supabase.co
                  </div>
                  <div className="p-2 bg-muted rounded-md font-mono text-xs mt-1">
                    App Domains: lovableproject.com
                  </div>
                </div>
              </div>
              
              <div>
                <strong>3. Mode de l'application :</strong>
                <div className="ml-4 mt-1 text-muted-foreground">
                  • Si en mode <strong>Development</strong> : ajoutez-vous comme testeur<br />
                  • Ou passez l'app en mode <strong>Live</strong>
                </div>
              </div>
              
              <div>
                <strong>4. App Review → Permissions :</strong>
                <div className="ml-4 mt-1 text-muted-foreground">
                  Activez : pages_show_list, pages_read_engagement, instagram_basic, instagram_content_publish, business_management
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setShowConfigGuide(false)}
            >
              J'ai configuré mon application
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
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

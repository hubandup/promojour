import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSocialConnections } from "@/hooks/use-social-connections";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Instagram, MapPin, AlertCircle, ExternalLink, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";

interface SocialConnectionsManagerProps {
  storeId: string;
  platforms?: ('facebook' | 'instagram' | 'google_business')[];
}

export function SocialConnectionsManager({ storeId, platforms = ['facebook', 'instagram', 'google_business'] }: SocialConnectionsManagerProps) {
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
        // Ouvrir OAuth dans une popup pour éviter ERR_BLOCKED_BY_RESPONSE
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.authUrl,
          'facebook_oauth',
          `width=${width},height=${height},left=${left},top=${top},popup=yes`
        );

        if (!popup) {
          toast({
            title: "Erreur",
            description: "Veuillez autoriser les popups pour ce site",
            variant: "destructive",
          });
          return;
        }

        // Écouter les messages de la popup
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'oauth_success') {
            window.removeEventListener('message', handleMessage);
            toast({
              title: "Connexion réussie",
              description: "Votre compte Facebook a été connecté",
            });
            refetch();
          } else if (event.data.type === 'oauth_error') {
            window.removeEventListener('message', handleMessage);
            toast({
              title: "Erreur",
              description: event.data.error === 'oauth_denied' 
                ? "Vous avez annulé la connexion Facebook"
                : "Une erreur s'est produite lors de la connexion",
              variant: "destructive",
            });
          }
        };

        window.addEventListener('message', handleMessage);

        // Nettoyer l'écouteur si la popup est fermée manuellement
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
          }
        }, 500);
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
      
      {platforms.includes('facebook') && (
        <div>
          {isReallyConnected(facebookConnection) ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connecté
                </Badge>
                {facebookConnection.account_name && (
                  <span className="text-sm text-muted-foreground">
                    {facebookConnection.account_name}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
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
        </div>
      )}

      {platforms.includes('instagram') && (
        <div>
          {isReallyConnected(instagramConnection) ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connecté
                </Badge>
                {instagramConnection?.account_name && (
                  <span className="text-sm text-muted-foreground">
                    @{instagramConnection.account_name}
                  </span>
                )}
                {instagramConnection?.followers_count && instagramConnection.followers_count > 0 && (
                  <span className="text-sm text-muted-foreground">
                    • {instagramConnection.followers_count} abonnés
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
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
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Connectez d'abord votre page Facebook pour accéder à Instagram
                  </p>
                  <Button onClick={handleConnectFacebook} variant="outline">
                    <Facebook className="mr-2 h-4 w-4" />
                    Connecter via Facebook
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {platforms.includes('google_business') && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#4285F4]/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-[#4285F4]" />
              </div>
              Google My Business
            </CardTitle>
            <CardDescription>
              Synchronisez votre fiche d'établissement avec Google
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
      )}
    </div>
  );
}

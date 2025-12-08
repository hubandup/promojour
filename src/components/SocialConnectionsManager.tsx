import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSocialConnections } from "@/hooks/use-social-connections";
import { useSocialConnectionLimits } from "@/hooks/use-social-connection-limits";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Instagram, MapPin, AlertCircle, ExternalLink, CheckCircle2, Lock, Music2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";

interface SocialConnectionsManagerProps {
  storeId: string;
  platforms?: ('facebook' | 'instagram' | 'google_business')[];
}

export function SocialConnectionsManager({ storeId, platforms = ['facebook', 'instagram', 'google_business'] }: SocialConnectionsManagerProps) {
  const { connections, loading, refetch } = useSocialConnections(storeId);
  const { canAddSocialConnection, maxSocialNetworksPerStore, isFreeOrg } = useSocialConnectionLimits(storeId);
  const { toast } = useToast();
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [connectionLimitReached, setConnectionLimitReached] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [platformToDisconnect, setPlatformToDisconnect] = useState<'facebook' | 'instagram' | 'google_business' | null>(null);
  
  const redirectUri = "https://rrcrfwhblesarezabsfo.supabase.co/functions/v1/facebook-oauth-callback";

  // Check connection limits when component mounts or connections change
  useEffect(() => {
    const checkLimits = async () => {
      const { allowed, reason } = await canAddSocialConnection();
      setConnectionLimitReached(!allowed);
      setLimitMessage(allowed ? null : reason || null);
    };
    checkLimits();
  }, [connections, canAddSocialConnection]);

  const handleConnect = async (platform: 'facebook' | 'instagram' | 'both') => {
    // Check if adding a new connection is allowed
    const { allowed, reason } = await canAddSocialConnection();
    if (!allowed) {
      toast({
        title: "Limite atteinte",
        description: reason,
        variant: "destructive",
      });
      return;
    }

    // Build the OAuth init URL with store_id and platform as query params
    const SUPABASE_URL = 'https://rrcrfwhblesarezabsfo.supabase.co';
    const oauthInitUrl = `${SUPABASE_URL}/functions/v1/facebook-oauth-init?store_id=${storeId}&platform=${platform}`;
    
    // Check if we're in an iframe (e.g., Lovable preview)
    // If so, open in a new tab because Facebook blocks iframe OAuth
    if (window.self !== window.top) {
      window.open(oauthInitUrl, '_blank');
    } else {
      // Full page redirect to Facebook OAuth
      window.location.href = oauthInitUrl;
    }
  };

  const handleConnectFacebook = () => handleConnect('facebook');
  const handleConnectInstagram = () => handleConnect('instagram');

  const openDisconnectDialog = (platform: 'facebook' | 'instagram' | 'google_business') => {
    setPlatformToDisconnect(platform);
    setDisconnectDialogOpen(true);
  };

  const handleDisconnect = async () => {
    if (!platformToDisconnect) return;
    
    try {
      const { error } = await supabase
        .from('social_connections')
        .update({ 
          is_connected: false,
          access_token: null,
          refresh_token: null,
        })
        .eq('store_id', storeId)
        .eq('platform', platformToDisconnect);

      if (error) throw error;

      const platformNames = {
        facebook: 'Facebook',
        instagram: 'Instagram',
        google_business: 'Google My Business'
      };

      toast({
        title: "Déconnexion réussie",
        description: `Le compte ${platformNames[platformToDisconnect]} a été déconnecté`,
      });

      refetch();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter le compte",
        variant: "destructive",
      });
    } finally {
      setDisconnectDialogOpen(false);
      setPlatformToDisconnect(null);
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
      {/* Free tier limit warning */}
      {connectionLimitReached && isFreeOrg && (
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Limite du forfait Free atteinte</AlertTitle>
          <AlertDescription>
            {limitMessage || `Votre forfait Free est limité à ${maxSocialNetworksPerStore} réseau social par magasin. Passez au forfait Pro pour connecter plus de réseaux.`}
          </AlertDescription>
        </Alert>
      )}
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
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="w-10 h-10 rounded-lg bg-[#1877F2]/10 flex items-center justify-center">
                <Facebook className="h-6 w-6 text-[#1877F2]" />
              </div>
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
                  className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => openDisconnectDialog('facebook')}
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
      )}

      {platforms.includes('instagram') && (
        <Card className="glass-card border-border/50 opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#F77737]/10 flex items-center justify-center">
                <Instagram className="h-6 w-6 text-[#E4405F]" />
              </div>
              Instagram
              <Badge variant="secondary" className="ml-2">Prochainement</Badge>
            </CardTitle>
            <CardDescription>
              Publiez vos promotions en Reels sur Instagram
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              <Instagram className="mr-2 h-4 w-4" />
              Prochainement
            </Button>
          </CardContent>
        </Card>
      )}

      {platforms.includes('google_business') && (
        <Card className="glass-card border-border/50 opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#4285F4]/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-[#4285F4]" />
              </div>
              Google My Business
              <Badge variant="secondary" className="ml-2">Prochainement</Badge>
            </CardTitle>
            <CardDescription>
              Synchronisez votre fiche d'établissement avec Google
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              <MapPin className="mr-2 h-4 w-4" />
              Prochainement
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TikTok - Coming Soon */}
      <Card className="glass-card border-border/50 opacity-60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="w-10 h-10 rounded-lg bg-black/10 flex items-center justify-center">
              <Music2 className="h-6 w-6 text-black" />
            </div>
            TikTok
            <Badge variant="secondary" className="ml-2">Prochainement</Badge>
          </CardTitle>
          <CardDescription>
            Publiez vos promotions en vidéos courtes sur TikTok
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            <Music2 className="mr-2 h-4 w-4" />
            Prochainement
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir déconnecter ce compte ? Vous devrez vous reconnecter pour publier à nouveau sur cette plateforme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

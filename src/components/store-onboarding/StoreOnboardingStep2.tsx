import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Facebook, Check, ArrowRight, Globe } from "lucide-react";

interface Props {
  storeId: string;
  onComplete: () => void;
}

export function StoreOnboardingStep2({ storeId, onComplete }: Props) {
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [facebookPageName, setFacebookPageName] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkFacebookConnection();
  }, [storeId]);

  const checkFacebookConnection = async () => {
    const { data } = await supabase
      .from("social_connections")
      .select("id, account_name")
      .eq("store_id", storeId)
      .eq("platform", "facebook")
      .eq("is_connected", true)
      .maybeSingle();

    if (data) {
      setFacebookConnected(true);
      setFacebookPageName(data.account_name);
    }
  };

  const handleFacebookConnect = async () => {
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Vous devez être connecté"); return; }

      // Use the GET endpoint directly to avoid CORS/iframe issues with functions.invoke
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const authUrl = `${supabaseUrl}/functions/v1/facebook-oauth-init?store_id=${encodeURIComponent(storeId)}&platform=facebook`;

      // Open in new tab and poll for connection
      window.open(authUrl, "_blank");
      toast.info("Connectez-vous à Facebook dans le nouvel onglet");
      
      const interval = setInterval(async () => {
        const { data: conn } = await supabase
          .from("social_connections")
          .select("id, account_name")
          .eq("store_id", storeId)
          .eq("platform", "facebook")
          .eq("is_connected", true)
          .maybeSingle();
        if (conn) {
          clearInterval(interval);
          setFacebookConnected(true);
          setFacebookPageName(conn.account_name);
          toast.success("Facebook connecté avec succès !");
        }
      }, 3000);
      setTimeout(() => clearInterval(interval), 120000);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la connexion Facebook");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Connectez votre page Facebook</h1>
        </div>
        <p className="text-muted-foreground">
          PromoJour publiera vos promotions automatiquement sur votre page
        </p>
      </div>

      {/* Explainer */}
      <div className="bg-muted/50 rounded-xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
          <span className="text-sm text-foreground">Publier vos promotions sur votre page Facebook</span>
        </div>
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
          <span className="text-sm text-foreground">Mesurer les performances de vos publications</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="w-5 h-5 text-red-400 mt-0.5 shrink-0 text-center font-bold">✗</span>
          <span className="text-sm text-foreground">Nous ne modifierons jamais vos posts existants</span>
        </div>
      </div>

      {/* Facebook connection */}
      {facebookConnected ? (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/5">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="font-medium text-foreground">Page connectée</p>
            {facebookPageName && (
              <p className="text-sm text-muted-foreground">{facebookPageName}</p>
            )}
          </div>
        </div>
      ) : (
        <Button
          onClick={handleFacebookConnect}
          disabled={connecting}
          className="w-full h-12 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
          size="lg"
        >
          <Facebook className="mr-2 h-5 w-5" />
          {connecting ? "Connexion en cours..." : "Connecter ma page Facebook"}
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Vous pourrez déconnecter votre page à tout moment depuis les réglages
      </p>

      <Button
        onClick={onComplete}
        disabled={!facebookConnected}
        className="w-full h-12"
        size="lg"
      >
        Continuer
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

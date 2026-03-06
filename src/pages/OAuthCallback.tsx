import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const storeId = searchParams.get("storeId");
    const onboardingInProgress = localStorage.getItem("onboarding_in_progress") === "true";

    // PRIORITY: If onboarding is in progress, always go back to wizard
    if (onboardingInProgress) {
      localStorage.removeItem("onboarding_in_progress");

      // If opened as popup/tab, notify parent and close
      if (window.opener) {
        try {
          window.opener.postMessage(
            {
              type: success === "social_connected" ? "oauth_success" : "oauth_error",
              platform: "facebook",
              error: error || undefined,
            },
            window.location.origin
          );
        } catch (e) {
          // opener may be cross-origin, ignore
        }
        setTimeout(() => window.close(), 1500);
      } else {
        // Full-page redirect: go back to wizard
        setTimeout(() => navigate("/store-onboarding", { replace: true }), 1500);
      }
      return;
    }

    // Non-onboarding popup flow
    if (window.opener) {
      if (success === "social_connected") {
        window.opener.postMessage(
          { type: "oauth_success", platform: "facebook" },
          window.location.origin
        );
      } else if (error) {
        window.opener.postMessage(
          { type: "oauth_error", error: error },
          window.location.origin
        );
      }
      setTimeout(() => window.close(), 1500);
      return;
    }

    // Default: check onboarding status then redirect
    const checkAndRedirect = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

          if (profile?.organization_id) {
            const { data: org } = await supabase
              .from("organizations")
              .select("onboarding_completed")
              .eq("id", profile.organization_id)
              .single();

            if (org && !org.onboarding_completed) {
              setTimeout(() => navigate("/store-onboarding", { replace: true }), 1500);
              return;
            }
          }
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err);
      }

      if (storeId) {
        setTimeout(() => navigate(`/stores/${storeId}`, { replace: true }), 1500);
      } else {
        navigate("/stores", { replace: true });
      }
    };

    checkAndRedirect();
  }, [searchParams, navigate]);

  const success = searchParams.get("success") === "social_connected";
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {success ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">Connexion réussie !</h1>
            <p className="text-muted-foreground">
              Votre compte Facebook a été connecté avec succès.
            </p>
          </>
        ) : error ? (
          <>
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Erreur de connexion</h1>
            <p className="text-muted-foreground">
              {error === "oauth_denied"
                ? "Vous avez annulé la connexion Facebook."
                : "Une erreur s'est produite lors de la connexion."}
            </p>
          </>
        ) : (
          <>
            <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
            <h1 className="text-2xl font-bold">Traitement en cours...</h1>
            <p className="text-muted-foreground">
              Veuillez patienter pendant la connexion de votre compte.
            </p>
          </>
        )}
        <p className="text-sm text-muted-foreground">
          {window.opener ? "Cette fenêtre va se fermer automatiquement..." : "Redirection en cours..."}
        </p>
      </div>
    </div>
  );
}

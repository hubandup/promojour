import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const storeId = searchParams.get("storeId");

    // Si c'est une popup, envoyer le message au parent et fermer
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
      
      // Fermer la popup après un court délai pour que l'utilisateur voie le message
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      // Si ce n'est pas une popup, rediriger vers la page du store
      if (storeId) {
        setTimeout(() => {
          navigate(`/stores/${storeId}`);
        }, 1500);
      } else {
        navigate("/stores");
      }
    }
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

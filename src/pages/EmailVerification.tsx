import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logoPromojour from "@/assets/logo-promojour.svg";

const EmailVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error("Adresse email manquante.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/choose-account-type`,
        },
      });
      if (error) throw error;
      toast.success("Email de vérification renvoyé !");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du renvoi de l'email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="w-full max-w-md text-center space-y-8">
        <img
          src={logoPromojour}
          alt="PromoJour"
          className="h-16 mx-auto cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
        />

        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">
            Vérifiez votre adresse email
          </h1>
          <p className="text-muted-foreground">
            Nous avons envoyé un email à{" "}
            <span className="font-semibold text-foreground">{email}</span>.
            Cliquez sur le lien dans cet email pour activer votre compte.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas reçu l'email ? Vérifiez vos spams ou
          </p>
          <Button
            variant="link"
            onClick={handleResend}
            disabled={resending}
            className="text-primary font-medium"
          >
            {resending ? "Envoi en cours..." : "Renvoyer l'email de vérification"}
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={() => navigate("/auth")}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la connexion
        </Button>
      </div>
    </div>
  );
};

export default EmailVerification;

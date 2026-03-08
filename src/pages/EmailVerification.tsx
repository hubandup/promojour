import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logoPromojour from "@/assets/logo-promojour.svg";

const COOLDOWN_SECONDS = 60;

const EmailVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (!email) {
      toast.error("Adresse email manquante.");
      return;
    }
    if (cooldown > 0) return;

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          // TEMP: disabled for Meta — redirect to /auth instead of /choose-account-type
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) throw error;
      toast.success("Email de vérification renvoyé !");
      setCooldown(COOLDOWN_SECONDS);
    } catch (error: any) {
      if (error.message?.includes("rate limit")) {
        toast.error("Trop de tentatives. Veuillez patienter quelques minutes.");
        setCooldown(COOLDOWN_SECONDS);
      } else {
        toast.error(error.message || "Erreur lors du renvoi de l'email");
      }
    } finally {
      setResending(false);
    }
  }, [email, cooldown]);

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

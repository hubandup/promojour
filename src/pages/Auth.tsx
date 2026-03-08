import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoPromojour from "@/assets/logo-promojour.svg";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Check, CheckCircle } from "lucide-react";
import { useSendEmail } from "@/hooks/use-send-email";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [processingVerificationReturn, setProcessingVerificationReturn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const { sendWelcomeEmail } = useSendEmail();

  const [emailVerified, setEmailVerified] = useState(false);

  const decodeEmailFromToken = (token: string | null) => {
    if (!token) return null;
    try {
      const payload = token.split(".")[1];
      if (!payload) return null;
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      const json = JSON.parse(atob(padded));
      return typeof json?.email === "string" ? json.email : null;
    } catch {
      return null;
    }
  };

  const redirectAfterLogin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("account_type, onboarding_completed")
      .eq("id", profile.organization_id)
      .single();

    // TEMP: disabled for Meta — force onboarding flow for store/free orgs not completed
    if ((org?.account_type === "store" || org?.account_type === "free") && !org?.onboarding_completed) {
      navigate("/store-onboarding", { replace: true });
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  useEffect(() => {
    const handleVerificationReturn = async () => {
      const tab = searchParams.get("tab");
      if (tab === "signup") setActiveTab("signup");

      const rawHash = window.location.hash.replace(/^#/, "");
      const hashParams = new URLSearchParams(rawHash);
      const queryAccessToken = searchParams.get("access_token");
      const queryRefreshToken = searchParams.get("refresh_token");
      const hashAccessToken = hashParams.get("access_token");
      const hashRefreshToken = hashParams.get("refresh_token");
      const typeParam = hashParams.get("type") ?? searchParams.get("type");

      const hasVerificationContext =
        typeParam === "signup" ||
        typeParam === "email_change" ||
        Boolean(queryAccessToken || hashAccessToken || rawHash.includes("type=signup"));

      const resolvedEmail =
        searchParams.get("email") ||
        hashParams.get("email") ||
        decodeEmailFromToken(queryAccessToken || hashAccessToken);

      if (resolvedEmail) setEmail(resolvedEmail);

      if (!hasVerificationContext) {
        setProcessingVerificationReturn(false);
        return;
      }

      setEmailVerified(true);
      setActiveTab("signin");

      const access_token = queryAccessToken || hashAccessToken;
      const refresh_token = queryRefreshToken || hashRefreshToken;

      if (access_token && refresh_token) {
        // TEMP: disabled for Meta — prioritize silent auto-login after email verification
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (!error) {
          await redirectAfterLogin();
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await redirectAfterLogin();
        return;
      }

      setProcessingVerificationReturn(false);
    };

    handleVerificationReturn();
  }, [searchParams]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // TEMP: disabled for Meta — redirect to auth page after email verification instead of choose-account-type
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            name: `${firstName} ${lastName}`.trim(),
            first_name: firstName,
            last_name: lastName,
            company_name: "Mon Organisation",
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("User already registered")) {
          toast.error("Cet email est déjà utilisé. Veuillez vous connecter.", {
            action: {
              label: "Se connecter",
              onClick: () => setActiveTab("signin")
            }
          });
          return;
        }
        throw error;
      }

      if (data.user) {
        // Email confirmation required - redirect to verification screen
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        // User already exists (Supabase returns empty user/session for security)
        toast.error("Cet email est déjà utilisé. Veuillez vous connecter.", {
          action: {
            label: "Se connecter",
            onClick: () => setActiveTab("signin")
          }
        });
      }
    } catch (error: any) {
      const message = error.message?.includes("already") 
        ? "Cet email est déjà utilisé. Veuillez vous connecter."
        : error.message || "Erreur lors de l'inscription";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          navigate(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        throw error;
      }

      toast.success("Connexion réussie !");
      await redirectAfterLogin();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Email de réinitialisation envoyé ! Vérifiez votre boîte mail.");
      setForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi de l'email");
    } finally {
      setLoading(false);
    }
  };

  if (processingVerificationReturn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="py-10 text-center text-muted-foreground">
            Finalisation de la vérification en cours...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <img 
            src={logoPromojour} 
            alt="PromoJour Logo" 
            className="h-16 mx-auto mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          />
          <CardDescription>Gérez vos promotions efficacement</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              {emailVerified && (
                <div className="mb-4 p-4 rounded-lg border border-green-500/30 bg-green-500/5 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">✅ Votre adresse email a été vérifiée avec succès ! Connectez-vous pour continuer la configuration de votre magasin.</p>
                  </div>
                </div>
              )}
              {forgotPassword ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full gradient-primary text-white shadow-glow" 
                    disabled={loading}
                  >
                    {loading ? "Envoi..." : "Envoyer l'email de réinitialisation"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full"
                    onClick={() => setForgotPassword(false)}
                  >
                    ← Retour à la connexion
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
                      onClick={() => setForgotPassword(true)}
                    >
                      Mot de passe oublié ?
                    </Button>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full gradient-primary text-white shadow-glow" 
                    disabled={loading}
                  >
                    {loading ? "Connexion..." : "Se connecter"}
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Votre prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Votre nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-foreground text-background hover:bg-foreground/90" 
                  disabled={loading}
                >
                  {loading ? "Création..." : "Créer mon compte"}
                </Button>
                
                {/* Trust indicators */}
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" /> Sans engagement
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" /> 15 jours gratuits
                  </span>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => navigate("/")} className="text-muted-foreground">
              ← Retour à l'accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

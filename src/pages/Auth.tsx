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
import { Store, Check } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  
  // Plan from URL params
  const plan = searchParams.get("plan") || "free";

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signup") {
      setActiveTab("signup");
    }
  }, [searchParams]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine redirect based on plan
      let redirectPath = "/onboarding";
      if (plan === "pro" || plan === "centrale") {
        redirectPath = `/checkout?plan=${plan}&storeName=${encodeURIComponent(storeName)}`;
      } else if (storeName) {
        redirectPath = `/onboarding?storeName=${encodeURIComponent(storeName)}`;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectPath}`,
          data: {
            name: name,
            company_name: storeName || "Mon Organisation",
          }
        }
      });

      if (error) {
        // Handle specific error for existing user
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

      // Check if user was actually created (not just a fake signup for existing user)
      if (data.user && data.session) {
        toast.success("Compte créé avec succès !");
        
        // Navigate based on plan
        if (plan === "pro" || plan === "centrale") {
          navigate(`/checkout?plan=${plan}&storeName=${encodeURIComponent(storeName)}`);
        } else {
          navigate(`/onboarding${storeName ? `?storeName=${encodeURIComponent(storeName)}` : ""}`);
        }
      } else if (data.user && !data.session) {
        // User created but needs email confirmation
        toast.success("Compte créé ! Vérifiez votre email pour confirmer.", {
          duration: 5000
        });
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

      if (error) throw error;

      toast.success("Connexion réussie !");
      navigate("/dashboard");
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
                {/* Plan badge */}
                {plan !== "free" && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Plan {plan === "pro" ? "Magasin Pro" : "Centrale"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {plan === "pro" ? "39€/mois" : "180€/mois + 19€/magasin"}
                      </p>
                    </div>
                    <Check className="ml-auto h-5 w-5 text-primary" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Votre nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeName">Nom du magasin</Label>
                  <Input
                    id="storeName"
                    type="text"
                    placeholder="Ma Boulangerie"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
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

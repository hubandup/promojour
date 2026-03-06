import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoPromojour from "@/assets/logo-promojour.svg";
import { Store, Building2, Network } from "lucide-react";

interface AccountOption {
  type: "store" | "central";
  icon: React.ElementType;
  title: string;
  description: string;
  tag: string;
  redirectTo: string;
}

const options: AccountOption[] = [
  {
    type: "store",
    icon: Store,
    title: "Magasin",
    description: "Je suis gérant ou franchisé et je gère un seul magasin",
    tag: "Gratuit 15 jours puis 39€/mois",
    redirectTo: "/store-onboarding",
  },
  {
    type: "store",
    icon: Building2,
    title: "Multi-magasins",
    description: "Je suis gérant ou franchisé et je gère plusieurs magasins",
    tag: "Gratuit 15 jours puis 39€/mois par magasin",
    redirectTo: "/store-onboarding",
  },
  {
    type: "central",
    icon: Network,
    title: "Centrale",
    description:
      "Je suis une enseigne, une marque ou une centrale d'achat avec un réseau de points de vente à animer",
    tag: "À partir de 180€/mois",
    redirectTo: "/dashboard",
  },
];

export default function ChooseAccountType() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const handleChoice = async (option: AccountOption) => {
    setLoading(option.title);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) {
        toast.error("Erreur : aucune organisation trouvée");
        return;
      }

      localStorage.setItem("pending_account_type", option.type);

      const { data: updatedOrg, error } = await supabase
        .from("organizations")
        .update({ account_type: option.type } as any)
        .eq("id", profile.organization_id)
        .select("id")
        .single();

      if (error || !updatedOrg) throw error || new Error("Mise à jour impossible");

      if (option.type === "central") {
        await supabase
          .from("organizations")
          .update({ onboarding_completed: true } as any)
          .eq("id", profile.organization_id);
      }

      // Show transitioning screen before navigating
      setTransitioning(true);
      setTimeout(() => {
        navigate(option.redirectTo, { replace: true });
      }, 1500);
    } catch (error: any) {
      localStorage.removeItem("pending_account_type");
      toast.error(error.message || "Une erreur est survenue");
      setLoading(null);
    }
  };

  if (transitioning) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <img src={logoPromojour} alt="PromoJour" className="h-10 animate-pulse" />
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-lg font-medium text-foreground">Configuration de votre compte...</p>
          <p className="text-sm text-muted-foreground">Nous préparons votre espace</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <img src={logoPromojour} alt="PromoJour" className="h-9" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-10 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Comment allez-vous utiliser PromoJour ?
            </h1>
            <p className="text-muted-foreground">
              Vous pourrez modifier ce choix plus tard
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {options.map((option) => {
              const Icon = option.icon;
              const isLoading = loading === option.title;
              return (
                <button
                  key={option.title}
                  onClick={() => handleChoice(option)}
                  disabled={!!loading}
                  className="group relative flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>

                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    {option.title}
                  </h2>

                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                    {option.description}
                  </p>

                  <span className="mt-auto inline-block text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                    {option.tag}
                  </span>

                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-2xl">
                      <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

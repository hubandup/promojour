import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "@/hooks/use-user-data";
import { 
  Check, 
  Circle, 
  Store, 
  Globe, 
  Sparkles, 
  ArrowRight,
  X
} from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  action: () => void;
  actionLabel: string;
}

export const OnboardingChecklist = () => {
  const navigate = useNavigate();
  const { profile, organization } = useUserData();
  const [dismissed, setDismissed] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [hasSocialConnection, setHasSocialConnection] = useState(false);
  const [hasPromotion, setHasPromotion] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.organization_id) {
      checkOnboardingStatus();
    }
  }, [profile?.organization_id]);

  const checkOnboardingStatus = async () => {
    if (!profile?.organization_id) return;

    try {
      // Check for stores
      const { data: stores } = await supabase
        .from("stores")
        .select("id")
        .eq("organization_id", profile.organization_id)
        .limit(1);
      setHasStore((stores?.length || 0) > 0);

      // Check for social connections
      if (stores && stores.length > 0) {
        const { data: connections } = await supabase
          .from("social_connections")
          .select("id")
          .eq("store_id", stores[0].id)
          .eq("is_connected", true)
          .limit(1);
        setHasSocialConnection((connections?.length || 0) > 0);
      }

      // Check for promotions
      const { data: promotions } = await supabase
        .from("promotions")
        .select("id")
        .eq("organization_id", profile.organization_id)
        .limit(1);
      setHasPromotion((promotions?.length || 0) > 0);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if dismissed in localStorage
  useEffect(() => {
    const isDismissed = localStorage.getItem("onboarding_checklist_dismissed");
    if (isDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("onboarding_checklist_dismissed", "true");
    setDismissed(true);
  };

  const items: ChecklistItem[] = [
    {
      id: "store",
      title: "Configurer votre magasin",
      description: "Ajoutez les informations de votre commerce",
      icon: Store,
      completed: hasStore,
      action: () => navigate("/mon-magasin"),
      actionLabel: "Configurer",
    },
    {
      id: "social",
      title: "Connecter vos réseaux",
      description: "Facebook, Instagram, Google Business",
      icon: Globe,
      completed: hasSocialConnection,
      action: () => navigate("/mon-magasin"),
      actionLabel: "Connecter",
    },
    {
      id: "promotion",
      title: "Créer votre première promo",
      description: "Lancez votre première promotion",
      icon: Sparkles,
      completed: hasPromotion,
      action: () => navigate("/promotions"),
      actionLabel: "Créer",
    },
  ];

  const completedCount = items.filter(item => item.completed).length;
  const progress = (completedCount / items.length) * 100;
  const allCompleted = completedCount === items.length;

  // Don't show if dismissed or all completed
  if (dismissed || allCompleted || loading) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Vos premières étapes
            </CardTitle>
            <CardDescription>
              Complétez ces étapes pour tirer le meilleur de PromoJour
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="pt-2">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">{completedCount} sur {items.length} complétées</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
              item.completed 
                ? "bg-primary/5 opacity-60" 
                : "bg-background border border-border hover:border-primary/30"
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              item.completed 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground"
            }`}>
              {item.completed ? (
                <Check className="h-5 w-5" />
              ) : (
                <item.icon className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-medium text-sm ${item.completed ? "line-through" : ""}`}>
                {item.title}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {item.description}
              </div>
            </div>
            {!item.completed && (
              <Button
                size="sm"
                variant="outline"
                onClick={item.action}
                className="flex-shrink-0"
              >
                {item.actionLabel}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

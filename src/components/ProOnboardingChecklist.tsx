import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "@/hooks/use-user-data";
import {
  Check,
  Store,
  Globe,
  Sparkles,
  ArrowRight,
  X,
  Image,
  MapPin,
  Clock,
  Share2,
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

interface ProOnboardingChecklistProps {
  store?: {
    id: string;
    organization_id: string;
    name: string;
    cover_image_url: string | null;
    address_line1: string | null;
    phone: string | null;
    opening_hours: any;
  } | null;
  onNavigateTab?: (tab: string) => void;
}

export const ProOnboardingChecklist = ({ store, onNavigateTab }: ProOnboardingChecklistProps) => {
  const navigate = useNavigate();
  const { profile } = useUserData();
  const [dismissed, setDismissed] = useState(false);
  const [hasSocialConnection, setHasSocialConnection] = useState(false);
  const [hasPromotion, setHasPromotion] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDismissed = localStorage.getItem("pro_onboarding_dismissed");
    if (isDismissed === "true") setDismissed(true);
  }, []);

  useEffect(() => {
    if (store?.id && profile?.organization_id) {
      checkStatus();
    }
  }, [store?.id, profile?.organization_id]);

  const checkStatus = async () => {
    if (!store?.id || !profile?.organization_id) return;
    try {
      const [{ data: connections }, { data: promotions }] = await Promise.all([
        supabase
          .from("social_connections")
          .select("id")
          .eq("store_id", store.id)
          .eq("is_connected", true)
          .limit(1),
        supabase
          .from("promotions")
          .select("id")
          .eq("organization_id", profile.organization_id)
          .limit(1),
      ]);
      setHasSocialConnection((connections?.length || 0) > 0);
      setHasPromotion((promotions?.length || 0) > 0);
    } catch (error) {
      console.error("Error checking onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pro_onboarding_dismissed", "true");
    setDismissed(true);
  };

  const hasCover = !!store?.cover_image_url;
  const hasAddress = !!store?.address_line1;
  const hasPhone = !!store?.phone;
  const hasHours = store?.opening_hours && Object.values(store.opening_hours).some((h: any) => !h.closed);

  const items: ChecklistItem[] = [
    {
      id: "cover",
      title: "Ajouter une image de couverture",
      description: "Rendez votre magasin attrayant",
      icon: Image,
      completed: hasCover,
      action: () => onNavigateTab?.("info"),
      actionLabel: "Ajouter",
    },
    {
      id: "address",
      title: "Renseigner votre adresse",
      description: "Aidez vos clients à vous trouver",
      icon: MapPin,
      completed: hasAddress,
      action: () => onNavigateTab?.("info"),
      actionLabel: "Compléter",
    },
    {
      id: "hours",
      title: "Définir vos horaires",
      description: "Indiquez quand vous êtes ouvert",
      icon: Clock,
      completed: hasHours,
      action: () => onNavigateTab?.("hours"),
      actionLabel: "Définir",
    },
    {
      id: "social",
      title: "Connecter vos réseaux sociaux",
      description: "Facebook, Instagram, Google Business",
      icon: Share2,
      completed: hasSocialConnection,
      action: () => onNavigateTab?.("social"),
      actionLabel: "Connecter",
    },
    {
      id: "promotion",
      title: "Créer votre première promotion",
      description: "Lancez votre première offre",
      icon: Sparkles,
      completed: hasPromotion,
      action: () => navigate("/promotions"),
      actionLabel: "Créer",
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const progress = (completedCount / items.length) * 100;
  const allCompleted = completedCount === items.length;

  if (dismissed || allCompleted || loading) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-background overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Configurez votre magasin Pro</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {completedCount}/{items.length} étapes complétées
              </p>
            </div>
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
        <Progress value={progress} className="h-2 mt-3" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.completed ? undefined : item.action}
                disabled={item.completed}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all ${
                  item.completed
                    ? "bg-primary/5 opacity-60"
                    : "bg-background border border-border hover:border-primary/30 hover:shadow-sm cursor-pointer"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    item.completed
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.completed ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`text-xs font-medium leading-tight ${item.completed ? "line-through" : ""}`}>
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

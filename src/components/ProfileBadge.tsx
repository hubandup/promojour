import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useUserData } from "@/hooks/use-user-data";
import { usePromotionLimits } from "@/hooks/use-promotion-limits";
import { Sparkles, Building2, Store, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileBadgeProps {
  variant?: "compact" | "detailed";
  className?: string;
}

export const ProfileBadge = ({ variant = "compact", className }: ProfileBadgeProps) => {
  const { organization, isFree, isStore, isCentral } = useUserData();
  const { limits, loading } = usePromotionLimits();

  const getProfileConfig = () => {
    if (isFree) {
      return {
        name: "Free",
        icon: Sparkles,
        color: "bg-gradient-to-r from-slate-500 to-slate-600",
        badgeVariant: "secondary" as const,
      };
    }
    if (isStore) {
      return {
        name: "Magasin Pro",
        icon: Store,
        color: "bg-gradient-to-r from-primary to-accent",
        badgeVariant: "default" as const,
      };
    }
    if (isCentral) {
      return {
        name: "Centrale",
        icon: Building2,
        color: "bg-gradient-to-r from-accent to-secondary",
        badgeVariant: "default" as const,
      };
    }
    return {
      name: "Free",
      icon: Sparkles,
      color: "bg-gradient-to-r from-slate-500 to-slate-600",
      badgeVariant: "secondary" as const,
    };
  };

  const config = getProfileConfig();
  const Icon = config.icon;

  if (variant === "compact") {
    return (
      <Badge variant={config.badgeVariant} className={cn("gap-1.5", className)}>
        <Icon className="w-3 h-3" />
        {config.name}
      </Badge>
    );
  }

  return (
    <Card className={cn("p-4 space-y-3 glass-card border-border/50", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shadow-md", config.color)}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">Profil actuel</p>
            <p className="text-xs text-muted-foreground">{organization?.name}</p>
          </div>
        </div>
        <Badge variant={config.badgeVariant} className="gap-1.5">
          <Icon className="w-3 h-3" />
          {config.name}
        </Badge>
      </div>

      {isFree && !loading && limits.remainingPromotions !== null && (
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Promotions cette semaine</span>
            <span className={cn(
              "font-semibold",
              limits.canCreatePromotion ? "text-primary" : "text-destructive"
            )}>
              {limits.remainingPromotions} / 7 restantes
            </span>
          </div>
          
          {!limits.canCreatePromotion && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-xs text-destructive">
                Limite atteinte. Passez à Magasin Pro pour des promotions illimitées.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2">
            <div>
              <p>Planification max</p>
              <p className="font-medium text-foreground">{limits.maxPlanningDays} jours</p>
            </div>
            <div>
              <p>Validité max</p>
              <p className="font-medium text-foreground">{limits.maxValidityDays} jours</p>
            </div>
          </div>
        </div>
      )}

      {(isStore || isCentral) && (
        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex-1">
              <p className="text-muted-foreground">Magasins</p>
              <p className="font-semibold">
                {isStore ? `${organization?.max_stores || 5} max` : "Illimité"}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground">Promotions</p>
              <p className="font-semibold">Illimitées</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserData } from "@/hooks/use-user-data";
import { usePromotionLimits } from "@/hooks/use-promotion-limits";
import { Sparkles, Building2, Store, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileBadgeProps {
  variant?: "compact" | "detailed";
  className?: string;
}

export const ProfileBadge = ({ variant = "compact", className }: ProfileBadgeProps) => {
  const { organization, isFree, isStore, isCentral, isSuperAdmin, userRole, refetch } = useUserData();
  const { limits, loading } = usePromotionLimits();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [switchingProfile, setSwitchingProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string>("");

  // Profils prédéfinis
  const profiles = [
    {
      id: 'super_admin',
      label: 'Super Admin',
      orgId: 'e1234567-89ab-cdef-0123-456789abcdef', // Chausselandia comme org de base
      role: 'super_admin' as const,
      storeId: null,
    },
    {
      id: 'central_admin',
      label: 'Responsable de Central',
      orgId: 'e1234567-89ab-cdef-0123-456789abcdef', // Chausselandia
      role: 'admin' as const,
      storeId: null,
    },
    {
      id: 'store_manager_central',
      label: 'Responsable de magasin Central',
      orgId: 'e1234567-89ab-cdef-0123-456789abcdef', // Chausselandia
      role: 'store_manager' as const,
      storeId: '82c4c2bd-a0e8-41ee-a9fd-b35f6a34c692', // Chausselandia Paris 1er
    },
    {
      id: 'store_manager_free',
      label: 'Responsable de magasin Free',
      orgId: '00000000-0000-0000-0000-000000000001', // Demo Free
      role: 'store_manager' as const,
      storeId: '00000000-0000-0000-0000-000000000011', // Magasin Demo Free
    },
  ];

  const handleSwitchProfile = async () => {
    if (!selectedProfile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un profil.",
        variant: "destructive",
      });
      return;
    }

    const profile = profiles.find(p => p.id === selectedProfile);
    if (!profile) return;

    setSwitchingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Mettre à jour le profil avec la nouvelle organisation
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ organization_id: profile.orgId })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Vérifier si l'utilisateur a déjà un rôle dans cette organisation
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .eq("organization_id", profile.orgId)
        .maybeSingle();

      if (existingRole) {
        // Mettre à jour le rôle existant
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({ 
            role: profile.role,
            store_id: profile.storeId 
          })
          .eq("user_id", user.id)
          .eq("organization_id", profile.orgId);

        if (roleError) throw roleError;
      } else {
        // Créer un nouveau rôle
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: user.id,
            organization_id: profile.orgId,
            role: profile.role,
            store_id: profile.storeId,
          });

        if (roleError) throw roleError;
      }

      toast({
        title: "Profil changé",
        description: `Vous êtes maintenant : ${profile.label}`,
      });

      // Rafraîchir les données
      await refetch();
      
      // Fermer le popover
      setOpen(false);
      
      // Rafraîchir la page pour recharger toutes les données
      window.location.reload();
    } catch (error) {
      console.error("Error switching profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de changer de profil.",
        variant: "destructive",
      });
    } finally {
      setSwitchingProfile(false);
    }
  };

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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Badge 
            variant={config.badgeVariant} 
            className={cn("gap-1.5 cursor-pointer hover:opacity-80 transition-opacity", className)}
          >
            <Icon className="w-3 h-3" />
            {config.name}
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold leading-none flex items-center gap-2">
                <Icon className="w-4 h-4" />
                Profil actuel
              </h4>
              <p className="text-sm text-muted-foreground">
                {organization?.name}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline">
                  {userRole?.role === 'super_admin' && 'Super Admin'}
                  {userRole?.role === 'admin' && 'Admin'}
                  {userRole?.role === 'editor' && 'Éditeur'}
                  {userRole?.role === 'viewer' && 'Lecteur'}
                  {userRole?.role === 'store_manager' && 'Responsable Magasin'}
                </Badge>
              </div>
            </div>

            {isSuperAdmin && (
              <>
                <div className="border-t pt-4 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Changer de profil
                  </h4>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Profil de démonstration</Label>
                    <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Sélectionner un profil" />
                      </SelectTrigger>
                      <SelectContent className="z-[150]">
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    size="sm"
                    className="w-full"
                    onClick={handleSwitchProfile}
                    disabled={switchingProfile || !selectedProfile}
                  >
                    {switchingProfile ? "Changement..." : "Changer"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Card className={cn("p-4 space-y-3 glass-card border-border/50 cursor-pointer hover:bg-accent/50 transition-colors", className)}>
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
      </PopoverTrigger>
      <PopoverContent className="w-80 z-[100]" align="start" side="top">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold leading-none flex items-center gap-2">
              <Icon className="w-4 h-4" />
              Profil actuel
            </h4>
            <p className="text-sm text-muted-foreground">
              {organization?.name}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline">
                {userRole?.role === 'super_admin' && 'Super Admin'}
                {userRole?.role === 'admin' && 'Admin'}
                {userRole?.role === 'editor' && 'Éditeur'}
                {userRole?.role === 'viewer' && 'Lecteur'}
                {userRole?.role === 'store_manager' && 'Responsable Magasin'}
              </Badge>
            </div>
          </div>

          {isSuperAdmin && (
            <>
              <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Changer de profil
                </h4>
                
                <div className="space-y-2">
                  <Label className="text-xs">Profil de démonstration</Label>
                  <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Sélectionner un profil" />
                    </SelectTrigger>
                    <SelectContent className="z-[150]">
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  size="sm"
                  className="w-full"
                  onClick={handleSwitchProfile}
                  disabled={switchingProfile || !selectedProfile}
                >
                  {switchingProfile ? "Changement..." : "Changer"}
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

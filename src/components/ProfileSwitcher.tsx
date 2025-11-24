import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserData } from "@/hooks/use-user-data";
import { Loader2 } from "lucide-react";

const profiles = [
  {
    id: 'super_admin',
    label: 'Super Admin',
    orgId: 'e1234567-89ab-cdef-0123-456789abcdef',
    role: 'super_admin' as const,
    storeId: null,
  },
  {
    id: 'central_admin',
    label: 'Responsable de Central',
    orgId: 'e1234567-89ab-cdef-0123-456789abcdef',
    role: 'admin' as const,
    storeId: null,
  },
  {
    id: 'store_manager_central',
    label: 'Responsable de magasin Central',
    orgId: 'e1234567-89ab-cdef-0123-456789abcdef',
    role: 'store_manager' as const,
    storeId: '82c4c2bd-a0e8-41ee-a9fd-b35f6a34c692',
  },
  {
    id: 'store_manager_free',
    label: 'Responsable de magasin Free',
    orgId: '00000000-0000-0000-0000-000000000001',
    role: 'store_manager' as const,
    storeId: '00000000-0000-0000-0000-000000000011',
  },
];

export const ProfileSwitcher = () => {
  const { isSuperAdmin, userRole, organization } = useUserData();
  const { toast } = useToast();
  const [switching, setSwitching] = useState(false);

  // Déterminer le profil actuel
  const getCurrentProfileId = () => {
    if (!userRole || !organization) return undefined;
    
    const currentProfile = profiles.find(p => 
      p.orgId === organization.id && 
      p.role === userRole.role &&
      p.storeId === userRole.store_id
    );
    
    return currentProfile?.id;
  };

  const handleSwitchProfile = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    setSwitching(true);
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

      // Rafraîchir la page
      window.location.reload();
    } catch (error) {
      console.error("Error switching profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de changer de profil.",
        variant: "destructive",
      });
    } finally {
      setSwitching(false);
    }
  };

  if (!isSuperAdmin) return null;

  return (
    <Select 
      value={getCurrentProfileId()} 
      onValueChange={handleSwitchProfile}
      disabled={switching}
    >
      <SelectTrigger className="w-[280px]">
        {switching ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Changement...</span>
          </div>
        ) : (
          <SelectValue placeholder="Sélectionner un profil" />
        )}
      </SelectTrigger>
      <SelectContent>
        {profiles.map((profile) => (
          <SelectItem key={profile.id} value={profile.id}>
            {profile.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PromotionalMechanic {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
  }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePromotionalMechanics = () => {
  const queryClient = useQueryClient();

  const { data: mechanics = [], isLoading } = useQuery({
    queryKey: ["promotional-mechanics"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from("promotional_mechanics")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as PromotionalMechanic[];
    },
  });

  const createMechanic = useMutation({
    mutationFn: async (mechanic: Omit<PromotionalMechanic, "id" | "organization_id" | "created_at" | "updated_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.organization_id) throw new Error("Organisation non trouvée");

      const { error } = await supabase
        .from("promotional_mechanics")
        .insert({
          ...mechanic,
          organization_id: profile.organization_id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotional-mechanics"] });
      toast.success("Mécanique créée avec succès");
    },
    onError: (error) => {
      console.error("Erreur création mécanique:", error);
      toast.error("Erreur lors de la création");
    },
  });

  const updateMechanic = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PromotionalMechanic> & { id: string }) => {
      const { error } = await supabase
        .from("promotional_mechanics")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotional-mechanics"] });
      toast.success("Mécanique mise à jour");
    },
    onError: (error) => {
      console.error("Erreur modification mécanique:", error);
      toast.error("Erreur lors de la modification");
    },
  });

  const deleteMechanic = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("promotional_mechanics")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotional-mechanics"] });
      toast.success("Mécanique supprimée");
    },
    onError: (error) => {
      console.error("Erreur suppression mécanique:", error);
      toast.error("Erreur lors de la suppression");
    },
  });

  return {
    mechanics,
    isLoading,
    createMechanic: createMechanic.mutate,
    updateMechanic: updateMechanic.mutate,
    deleteMechanic: deleteMechanic.mutate,
  };
};

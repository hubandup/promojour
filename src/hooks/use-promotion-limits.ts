import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "./use-user-data";

export interface PromotionLimits {
  canCreatePromotion: boolean;
  remainingPromotions: number | null;
  maxPlanningDays: number | null;
  maxValidityDays: number | null;
  reason?: string;
}

export function usePromotionLimits() {
  const { organization, isFree } = useUserData();
  const [limits, setLimits] = useState<PromotionLimits>({
    canCreatePromotion: true,
    remainingPromotions: null,
    maxPlanningDays: null,
    maxValidityDays: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLimits();
  }, [organization]);

  const checkLimits = async () => {
    if (!organization) {
      setLoading(false);
      return;
    }

    try {
      if (isFree) {
        // Pour Free : vérifier le nombre de promos créées dans les 7 derniers jours
        const { count, error } = await supabase
          .from('promotions')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (error) throw error;

        const maxPromotions = organization.max_promotions || 7;
        const remaining = Math.max(0, maxPromotions - (count || 0));

        setLimits({
          canCreatePromotion: remaining > 0,
          remainingPromotions: remaining,
          maxPlanningDays: 15,
          maxValidityDays: 15,
          reason: remaining === 0 ? "Limite de 7 promotions par semaine atteinte" : undefined,
        });
      } else {
        // Pour Store et Central : pas de limites
        setLimits({
          canCreatePromotion: true,
          remainingPromotions: null,
          maxPlanningDays: null,
          maxValidityDays: null,
        });
      }
    } catch (error) {
      console.error('Error checking promotion limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const validatePromotionDates = (startDate: Date, endDate: Date): { valid: boolean; error?: string } => {
    if (!isFree) {
      return { valid: true };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxPlanningDate = new Date(today);
    maxPlanningDate.setDate(maxPlanningDate.getDate() + 15);

    // Vérifier que start_date <= aujourd'hui + 15 jours
    if (startDate > maxPlanningDate) {
      return {
        valid: false,
        error: "Pour le profil Free, les promotions ne peuvent pas être planifiées à plus de 15 jours.",
      };
    }

    // Vérifier que end_date - start_date <= 15 jours
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 15) {
      return {
        valid: false,
        error: "Pour le profil Free, la période de validité ne peut pas dépasser 15 jours.",
      };
    }

    return { valid: true };
  };

  return {
    limits,
    loading,
    checkLimits,
    validatePromotionDates,
  };
}

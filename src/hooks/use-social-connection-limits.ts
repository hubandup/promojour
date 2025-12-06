import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "@/hooks/use-user-data";
import { usePermissions } from "@/hooks/use-permissions";

/**
 * Hook to manage social connection limits based on organization tier
 * 
 * Business Rules:
 * - Free tier: Maximum 1 social connection per store
 * - Pro tier: Unlimited social connections per store
 * - Centrale: Social connections are ONLY at store level (not org level)
 *   - Each franchised store can connect its own social networks
 *   - Centrale org itself NEVER has social connections
 */
export function useSocialConnectionLimits(storeId?: string) {
  const [loading, setLoading] = useState(false);
  const { organization, isFree, isCentral } = useUserData();
  const { limits } = usePermissions();

  /**
   * Check if adding a new social connection is allowed for this store
   * @returns { allowed: boolean, reason?: string, currentCount: number, maxAllowed: number | null }
   */
  const canAddSocialConnection = useCallback(async () => {
    if (!storeId) {
      return { allowed: false, reason: "Store ID requis", currentCount: 0, maxAllowed: 0 };
    }

    setLoading(true);
    try {
      // Count current active social connections for this store
      const { data: connections, error } = await supabase
        .from('social_connections')
        .select('id, platform, is_connected')
        .eq('store_id', storeId)
        .eq('is_connected', true);

      if (error) throw error;

      const currentCount = connections?.length || 0;
      const maxAllowed = limits.maxSocialNetworksPerStore;

      // If unlimited (Pro/Centrale store), always allow
      if (maxAllowed === null) {
        return { allowed: true, currentCount, maxAllowed: null };
      }

      // Check against limit (Free tier = 1)
      if (currentCount >= maxAllowed) {
        return {
          allowed: false,
          reason: `Limite de ${maxAllowed} réseau${maxAllowed > 1 ? 'x' : ''} social${maxAllowed > 1 ? 'x' : ''} atteinte. Passez à un forfait supérieur pour connecter plus de réseaux.`,
          currentCount,
          maxAllowed,
        };
      }

      return { allowed: true, currentCount, maxAllowed };
    } catch (error) {
      console.error('Error checking social connection limits:', error);
      return { allowed: false, reason: "Erreur lors de la vérification des limites", currentCount: 0, maxAllowed: 0 };
    } finally {
      setLoading(false);
    }
  }, [storeId, limits.maxSocialNetworksPerStore]);

  /**
   * Get the current social connection status for this store
   */
  const getSocialConnectionStatus = useCallback(async () => {
    if (!storeId) {
      return { currentCount: 0, maxAllowed: limits.maxSocialNetworksPerStore, platforms: [] };
    }

    try {
      const { data: connections, error } = await supabase
        .from('social_connections')
        .select('platform, is_connected')
        .eq('store_id', storeId)
        .eq('is_connected', true);

      if (error) throw error;

      const platforms = connections?.map(c => c.platform) || [];
      const currentCount = platforms.length;
      const maxAllowed = limits.maxSocialNetworksPerStore;

      return { currentCount, maxAllowed, platforms };
    } catch (error) {
      console.error('Error fetching social connection status:', error);
      return { currentCount: 0, maxAllowed: limits.maxSocialNetworksPerStore, platforms: [] };
    }
  }, [storeId, limits.maxSocialNetworksPerStore]);

  return {
    loading,
    canAddSocialConnection,
    getSocialConnectionStatus,
    isFreeOrg: isFree,
    isCentralOrg: isCentral,
    maxSocialNetworksPerStore: limits.maxSocialNetworksPerStore,
  };
}

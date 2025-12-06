import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to handle automatic promotion archival
 * 
 * Business Rules:
 * - After end_date passes, promotions automatically transition to "archived" status
 * - Archived promotions are read-only (cannot be edited, only duplicated)
 * - This runs on app initialization and periodically
 */
export function usePromotionArchival() {
  /**
   * Archive all expired promotions for the current user's organization
   */
  const archiveExpiredPromotions = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      
      // Update all promotions where end_date has passed and status is not already archived
      const { data, error } = await supabase
        .from('promotions')
        .update({ status: 'archived' })
        .lt('end_date', now)
        .neq('status', 'archived')
        .select('id, title');

      if (error) {
        console.error('[PromotionArchival] Error archiving promotions:', error);
        return { success: false, archivedCount: 0 };
      }

      const archivedCount = data?.length || 0;
      if (archivedCount > 0) {
        console.log(`[PromotionArchival] Archived ${archivedCount} expired promotion(s):`, data?.map(p => p.title));
      }

      return { success: true, archivedCount };
    } catch (error) {
      console.error('[PromotionArchival] Error:', error);
      return { success: false, archivedCount: 0 };
    }
  }, []);

  /**
   * Check if a promotion is editable (not archived)
   * @param status The current status of the promotion
   * @param endDate The end date of the promotion
   * @returns boolean indicating if the promotion can be edited
   */
  const isPromotionEditable = useCallback((status: string, endDate?: string | Date): boolean => {
    // Archived promotions are never editable
    if (status === 'archived') {
      return false;
    }

    // Check if end_date has passed (should be auto-archived, but double-check)
    if (endDate) {
      const end = new Date(endDate);
      const now = new Date();
      if (end < now) {
        return false;
      }
    }

    return true;
  }, []);

  /**
   * Get a user-friendly message for why a promotion is not editable
   */
  const getNotEditableReason = useCallback((status: string, endDate?: string | Date): string | null => {
    if (status === 'archived') {
      return "Cette promotion est archivée et ne peut plus être modifiée. Vous pouvez la dupliquer pour créer une nouvelle version.";
    }

    if (endDate) {
      const end = new Date(endDate);
      const now = new Date();
      if (end < now) {
        return "Cette promotion a expiré et ne peut plus être modifiée. Vous pouvez la dupliquer pour créer une nouvelle version.";
      }
    }

    return null;
  }, []);

  // Run archival on mount
  useEffect(() => {
    archiveExpiredPromotions();

    // Set up periodic check (every 5 minutes)
    const interval = setInterval(() => {
      archiveExpiredPromotions();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [archiveExpiredPromotions]);

  return {
    archiveExpiredPromotions,
    isPromotionEditable,
    getNotEditableReason,
  };
}

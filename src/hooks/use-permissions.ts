import { useMemo } from "react";
import { useUserData } from "@/hooks/use-user-data";

/**
 * RBAC Permission System for PromoJour
 * 
 * ORGANIZATION TYPES:
 * - free: 1 store max, 7 promos max simultaneous, 15 days horizon, 1 social network max, no user management
 * - store (Pro): Up to 5 stores, unlimited promos, 5 users max, multiple social networks
 * - central (Centrale): Unlimited stores/promos/users, promotions inherited by stores, NO social connections at org level
 * 
 * USER ROLES:
 * - super_admin: Multi-org access, full CRUD everywhere
 * - admin: Full org management, user management (within plan limits), CRUD on promos/stores/campaigns/social
 * - editor: CRUD on promotions and campaigns only, no org settings, no user management
 * - store_manager: CRUD on assigned store only, CRUD on own promos, can connect social for own store only
 * - viewer: Read-only everywhere
 * 
 * INHERITANCE RULES:
 * - Centrale promotions automatically appear in attached stores
 * - Stores can add their own promos (not visible to other stores)
 * - Distribution happens on store frontend + store social networks
 * - Centrale NEVER publishes on its own social networks
 */

export interface PermissionLimits {
  maxStores: number | null; // null = unlimited
  maxSimultaneousPromos: number | null; // null = unlimited
  maxPlanningDays: number | null; // null = unlimited
  maxValidityDays: number | null; // null = unlimited, for Free tier max 15 days
  maxSocialNetworksPerStore: number | null; // null = unlimited, Free = 1
  maxUsers: number | null; // null = unlimited
  canManageUsers: boolean;
  canConnectSocialAtOrgLevel: boolean;
}

export interface Permissions {
  // Promotions
  canViewPromotions: boolean;
  canCreatePromotions: boolean;
  canEditPromotions: boolean;
  canDeletePromotions: boolean;
  canEditOwnPromotionsOnly: boolean; // store_manager: only promos for their store
  canEditArchivedPromotions: boolean; // Archived promos are read-only (always false)
  
  // Stores
  canViewStores: boolean;
  canViewAllStores: boolean; // false for store_manager
  canCreateStores: boolean;
  canEditStores: boolean;
  canDeleteStores: boolean;
  canEditOwnStoreOnly: boolean; // store_manager: only their assigned store
  
  // Campaigns
  canViewCampaigns: boolean;
  canCreateCampaigns: boolean;
  canEditCampaigns: boolean;
  canDeleteCampaigns: boolean;
  
  // Social Connections
  canViewSocialConnections: boolean;
  canManageSocialConnections: boolean;
  canManageOwnStoreSocialOnly: boolean; // store_manager
  canConnectSocialAtOrgLevel: boolean; // Always false - social is ALWAYS at store level
  
  // QR Codes
  canViewQRCodes: boolean;
  canDownloadQRCodes: boolean;
  
  // Organization Settings
  canViewOrgSettings: boolean;
  canEditOrgSettings: boolean;
  
  // User Management
  canViewUsers: boolean;
  canManageUsers: boolean;
  
  // Promotional Mechanics
  canViewMechanics: boolean;
  canManageMechanics: boolean;
  
  // Tier Limits
  limits: PermissionLimits;
}

const FREE_LIMITS: PermissionLimits = {
  maxStores: 1,
  maxSimultaneousPromos: 7,
  maxPlanningDays: 15,
  maxValidityDays: 15,
  maxSocialNetworksPerStore: 1, // Free = max 1 social connection per store
  maxUsers: null, // No user management
  canManageUsers: false,
  canConnectSocialAtOrgLevel: false, // Social is ALWAYS at store level
};

const PRO_LIMITS: PermissionLimits = {
  maxStores: 5,
  maxSimultaneousPromos: null, // Unlimited
  maxPlanningDays: null, // Unlimited
  maxValidityDays: null, // Unlimited
  maxSocialNetworksPerStore: null, // Unlimited social connections per store
  maxUsers: 5,
  canManageUsers: true,
  canConnectSocialAtOrgLevel: false, // Social is ALWAYS at store level
};

const CENTRAL_LIMITS: PermissionLimits = {
  maxStores: null, // Unlimited
  maxSimultaneousPromos: null, // Unlimited
  maxPlanningDays: null, // Unlimited
  maxValidityDays: null, // Unlimited
  maxSocialNetworksPerStore: null, // Unlimited - stores connect their own social
  maxUsers: null, // Unlimited
  canManageUsers: true,
  canConnectSocialAtOrgLevel: false, // Centrale does NOT connect social networks - ONLY via stores
};

function getLimitsForAccountType(accountType: 'free' | 'store' | 'central'): PermissionLimits {
  switch (accountType) {
    case 'free':
      return FREE_LIMITS;
    case 'store':
      return PRO_LIMITS;
    case 'central':
      return CENTRAL_LIMITS;
    default:
      return FREE_LIMITS;
  }
}

export function usePermissions(): Permissions & { loading: boolean } {
  const { 
    userRole, 
    organization, 
    isSuperAdmin, 
    isAdmin, 
    isEditor, 
    isStoreManager,
    isFree,
    isStore,
    isCentral,
    loading 
  } = useUserData();

  const permissions = useMemo((): Permissions => {
    const role = userRole?.role || 'viewer';
    const accountType = organization?.account_type || 'free';
    const limits = getLimitsForAccountType(accountType);

    // Viewer role - read only everywhere
    if (role === 'viewer') {
      return {
        // All view permissions, no edit
        canViewPromotions: true,
        canCreatePromotions: false,
        canEditPromotions: false,
        canDeletePromotions: false,
        canEditOwnPromotionsOnly: false,
        canEditArchivedPromotions: false, // Archived promos are always read-only
        
        canViewStores: true,
        canViewAllStores: true,
        canCreateStores: false,
        canEditStores: false,
        canDeleteStores: false,
        canEditOwnStoreOnly: false,
        
        canViewCampaigns: accountType !== 'free',
        canCreateCampaigns: false,
        canEditCampaigns: false,
        canDeleteCampaigns: false,
        
        canViewSocialConnections: true,
        canManageSocialConnections: false,
        canManageOwnStoreSocialOnly: false,
        canConnectSocialAtOrgLevel: false, // Always false - social at store level only
        
        canViewQRCodes: accountType !== 'free',
        canDownloadQRCodes: false,
        
        canViewOrgSettings: false,
        canEditOrgSettings: false,
        
        canViewUsers: false,
        canManageUsers: false,
        
        canViewMechanics: true,
        canManageMechanics: false,
        
        limits,
      };
    }

    // Store Manager role - CRUD on own store/promos only (franchisee pattern)
    // Franchised stores: inherit central promos, can add own promos, connect own social
    if (role === 'store_manager') {
      return {
        canViewPromotions: true, // Can view all org promos (central inheritance)
        canCreatePromotions: true, // Can create for own store (not visible to others)
        canEditPromotions: true, // Only own store promos
        canDeletePromotions: true, // Only own store promos
        canEditOwnPromotionsOnly: true,
        canEditArchivedPromotions: false, // Archived promos are always read-only
        
        canViewStores: true,
        canViewAllStores: false, // Only sees their assigned store
        canCreateStores: false,
        canEditStores: true, // Only own store
        canDeleteStores: false,
        canEditOwnStoreOnly: true,
        
        canViewCampaigns: false, // No access to global campaigns
        canCreateCampaigns: false,
        canEditCampaigns: false,
        canDeleteCampaigns: false,
        
        canViewSocialConnections: true,
        canManageSocialConnections: true, // Can connect own store's social networks
        canManageOwnStoreSocialOnly: true,
        canConnectSocialAtOrgLevel: false, // Social is always at store level
        
        canViewQRCodes: true,
        canDownloadQRCodes: true,
        
        canViewOrgSettings: false,
        canEditOrgSettings: false,
        
        canViewUsers: false,
        canManageUsers: false,
        
        canViewMechanics: true,
        canManageMechanics: false,
        
        limits,
      };
    }

    // Editor role - CRUD on promotions and campaigns only
    if (role === 'editor') {
      return {
        canViewPromotions: true,
        canCreatePromotions: true,
        canEditPromotions: true,
        canDeletePromotions: true,
        canEditOwnPromotionsOnly: false,
        canEditArchivedPromotions: false, // Archived promos are always read-only
        
        canViewStores: true,
        canViewAllStores: true,
        canCreateStores: false,
        canEditStores: false,
        canDeleteStores: false,
        canEditOwnStoreOnly: false,
        
        canViewCampaigns: accountType !== 'free',
        canCreateCampaigns: accountType !== 'free',
        canEditCampaigns: accountType !== 'free',
        canDeleteCampaigns: accountType !== 'free',
        
        canViewSocialConnections: true,
        canManageSocialConnections: true,
        canManageOwnStoreSocialOnly: false,
        canConnectSocialAtOrgLevel: false, // Always at store level
        
        canViewQRCodes: accountType !== 'free',
        canDownloadQRCodes: accountType !== 'free',
        
        canViewOrgSettings: false,
        canEditOrgSettings: false,
        
        canViewUsers: false,
        canManageUsers: false,
        
        canViewMechanics: true,
        canManageMechanics: false,
        
        limits,
      };
    }

    // Admin role - Full org management
    if (role === 'admin' || role === 'super_admin') {
      return {
        canViewPromotions: true,
        canCreatePromotions: true,
        canEditPromotions: true,
        canDeletePromotions: true,
        canEditOwnPromotionsOnly: false,
        canEditArchivedPromotions: false, // Archived promos are always read-only (can duplicate only)
        
        canViewStores: true,
        canViewAllStores: true,
        canCreateStores: true,
        canEditStores: true,
        canDeleteStores: true,
        canEditOwnStoreOnly: false,
        
        canViewCampaigns: accountType !== 'free',
        canCreateCampaigns: accountType !== 'free',
        canEditCampaigns: accountType !== 'free',
        canDeleteCampaigns: accountType !== 'free',
        
        canViewSocialConnections: true,
        canManageSocialConnections: true,
        canManageOwnStoreSocialOnly: false,
        canConnectSocialAtOrgLevel: false, // Always at store level, NEVER at org level
        
        canViewQRCodes: accountType !== 'free',
        canDownloadQRCodes: accountType !== 'free',
        
        canViewOrgSettings: true,
        canEditOrgSettings: true,
        
        canViewUsers: limits.canManageUsers,
        canManageUsers: limits.canManageUsers,
        
        canViewMechanics: true,
        canManageMechanics: true,
        
        limits,
      };
    }

    // Default fallback - viewer permissions
    return {
      canViewPromotions: true,
      canCreatePromotions: false,
      canEditPromotions: false,
      canDeletePromotions: false,
      canEditOwnPromotionsOnly: false,
      canEditArchivedPromotions: false,
      
      canViewStores: true,
      canViewAllStores: true,
      canCreateStores: false,
      canEditStores: false,
      canDeleteStores: false,
      canEditOwnStoreOnly: false,
      
      canViewCampaigns: false,
      canCreateCampaigns: false,
      canEditCampaigns: false,
      canDeleteCampaigns: false,
      
      canViewSocialConnections: true,
      canManageSocialConnections: false,
      canManageOwnStoreSocialOnly: false,
      canConnectSocialAtOrgLevel: false,
      
      canViewQRCodes: false,
      canDownloadQRCodes: false,
      
      canViewOrgSettings: false,
      canEditOrgSettings: false,
      
      canViewUsers: false,
      canManageUsers: false,
      
      canViewMechanics: true,
      canManageMechanics: false,
      
      limits: FREE_LIMITS,
    };
  }, [userRole, organization]);

  return { ...permissions, loading };
}

// Export limits for external use
export { FREE_LIMITS, PRO_LIMITS, CENTRAL_LIMITS };

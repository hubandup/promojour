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
  maxStores: number;
  maxSimultaneousPromos: number | null; // null = unlimited
  maxPlanningDays: number | null; // null = unlimited
  maxSocialNetworks: number | null; // null = unlimited
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
  canConnectSocialAtOrgLevel: boolean; // Centrale = false
  
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
  maxSocialNetworks: 1,
  maxUsers: null, // No user management
  canManageUsers: false,
  canConnectSocialAtOrgLevel: false, // Social is at store level
};

const PRO_LIMITS: PermissionLimits = {
  maxStores: 5,
  maxSimultaneousPromos: null, // Unlimited
  maxPlanningDays: null, // Unlimited
  maxSocialNetworks: null, // Unlimited
  maxUsers: 5,
  canManageUsers: true,
  canConnectSocialAtOrgLevel: false, // Social is at store level
};

const CENTRAL_LIMITS: PermissionLimits = {
  maxStores: null, // Unlimited
  maxSimultaneousPromos: null, // Unlimited
  maxPlanningDays: null, // Unlimited
  maxSocialNetworks: null, // Stores connect their own social
  maxUsers: null, // Unlimited
  canManageUsers: true,
  canConnectSocialAtOrgLevel: false, // Centrale does NOT connect social networks
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
        canConnectSocialAtOrgLevel: false,
        
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

    // Store Manager role - CRUD on own store/promos only
    if (role === 'store_manager') {
      return {
        canViewPromotions: true, // Can view all org promos (inheritance)
        canCreatePromotions: true, // Can create for own store
        canEditPromotions: true, // Only own store promos
        canDeletePromotions: true, // Only own store promos
        canEditOwnPromotionsOnly: true,
        
        canViewStores: true,
        canViewAllStores: false, // Only sees their store
        canCreateStores: false,
        canEditStores: true, // Only own store
        canDeleteStores: false,
        canEditOwnStoreOnly: true,
        
        canViewCampaigns: false, // No access to global campaigns
        canCreateCampaigns: false,
        canEditCampaigns: false,
        canDeleteCampaigns: false,
        
        canViewSocialConnections: true,
        canManageSocialConnections: true, // Only for own store
        canManageOwnStoreSocialOnly: true,
        canConnectSocialAtOrgLevel: false,
        
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
        canConnectSocialAtOrgLevel: false, // Always at store level, never at org level
        
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

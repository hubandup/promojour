import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserProfile {
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  account_type: 'free' | 'store' | 'central';
  max_stores: number;
  max_users: number;
  max_promotions: number | null;
}

export interface UserRole {
  role: 'admin' | 'editor' | 'viewer';
  organization_id: string;
}

export function useUserData() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch organization
      if (profileData?.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .single();

        if (orgError) throw orgError;
        setOrganization(orgData);

        // Fetch user role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role, organization_id')
          .eq('user_id', user.id)
          .eq('organization_id', profileData.organization_id)
          .single();

        if (roleError) throw roleError;
        setUserRole(roleData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userRole?.role === 'admin';
  const isEditor = userRole?.role === 'editor' || isAdmin;
  const isCentral = organization?.account_type === 'central';
  const isStore = organization?.account_type === 'store';
  const isFree = organization?.account_type === 'free';

  return {
    profile,
    organization,
    userRole,
    loading,
    isAdmin,
    isEditor,
    isCentral,
    isStore,
    isFree,
    refetch: fetchUserData,
  };
}

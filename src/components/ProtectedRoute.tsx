import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isStore, setIsStore] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOnboarding(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      await checkOnboarding(session.user.id);
    }
    setLoading(false);
  };

  const checkOnboarding = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single();

      if (!profile?.organization_id) {
        setNeedsOnboarding(false);
        setIsStore(false);
        return;
      }

      const { data: org } = await supabase
        .from("organizations")
        .select("account_type, onboarding_completed")
        .eq("id", profile.organization_id)
        .single();

      const storeType = org?.account_type === "store";
      setIsStore(storeType);

      // Only store-type organizations need onboarding check
      if (storeType && !org?.onboarding_completed) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
      }
    } catch {
      setNeedsOnboarding(false);
      setIsStore(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect store users who haven't completed onboarding
  if (needsOnboarding && location.pathname !== "/store-onboarding") {
    return <Navigate to="/store-onboarding" replace />;
  }

  // Redirect store users from /dashboard to /my-store
  if (isStore && location.pathname === "/dashboard") {
    return <Navigate to="/my-store" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

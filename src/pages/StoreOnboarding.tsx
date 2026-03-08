import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";
import logoPromojour from "@/assets/logo-promojour.svg";
import { StoreOnboardingStep1 } from "@/components/store-onboarding/StoreOnboardingStep1";
import { StoreOnboardingStep2 } from "@/components/store-onboarding/StoreOnboardingStep2";
import { StoreOnboardingStep3 } from "@/components/store-onboarding/StoreOnboardingStep3";

const stepLabels = ["Mon Magasin", "Mes Réseaux", "Ma première promo"];

const StoreOnboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) { navigate("/auth"); return; }
      setOrganizationId(profile.organization_id);

      // Load persisted step
      const { data: org } = await supabase
        .from("organizations")
        .select("onboarding_completed, onboarding_step")
        .eq("id", profile.organization_id)
        .single();

      if (org?.onboarding_completed) {
        navigate("/my-store", { replace: true });
        return;
      }

      if (org?.onboarding_step) {
        setStep(org.onboarding_step);
      }

      // Check if store already exists
      const { data: stores } = await supabase
        .from("stores")
        .select("id")
        .eq("organization_id", profile.organization_id)
        .limit(1);

      if (stores && stores.length > 0) {
        setStoreId(stores[0].id);
      }
    } catch (error) {
      console.error("Error loading onboarding state:", error);
    } finally {
      setLoading(false);
    }
  };

  const persistStep = async (newStep: number) => {
    if (!organizationId) return;
    await supabase
      .from("organizations")
      .update({ onboarding_step: newStep } as any)
      .eq("id", organizationId);
  };

  const goToStep = (newStep: number) => {
    setStep(newStep);
    persistStep(newStep);
  };

  const handleComplete = async () => {
    if (!organizationId) return;
    await supabase
      .from("organizations")
      .update({ onboarding_completed: true, onboarding_step: 3 } as any)
      .eq("id", organizationId);
    navigate("/my-store", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with logo */}
      <div className="px-6 pt-6 pb-2">
        <Link to="/"><img src={logoPromojour} alt="PromoJour" className="h-9" /></Link>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4 pb-8 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-1">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isDone = stepNum < step;
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-center">
                  <div
                    className={`h-1.5 w-full rounded-full transition-colors ${
                      isDone || isActive ? "bg-primary" : "bg-muted"
                    }`}
                  />
                </div>
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold ${
                    isDone
                      ? "bg-green-600 border-green-600 text-white"
                      : isActive
                      ? "border-primary text-primary"
                      : "border-muted-foreground/40 text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 sm:px-6 pb-12">
        <div className="w-full max-w-xl">
          {step === 1 && (
            <StoreOnboardingStep1
              organizationId={organizationId!}
              existingStoreId={storeId}
              initialStoreName={searchParams.get("storeName") || undefined}
              onComplete={(newStoreId) => {
                setStoreId(newStoreId);
                goToStep(2);
              }}
            />
          )}
          {step === 2 && (
            <StoreOnboardingStep2
              storeId={storeId!}
              onComplete={() => goToStep(3)}
            />
          )}
          {step === 3 && (
            <StoreOnboardingStep3
              organizationId={organizationId!}
              storeId={storeId!}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreOnboarding;

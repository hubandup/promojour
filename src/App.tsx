import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import OAuthCallback from "./pages/OAuthCallback";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import Onboarding from "./pages/Onboarding";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import Promotions from "./pages/Promotions";
import PromotionDetail from "./pages/PromotionDetail";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import Stats from "./pages/Stats";
import Store from "./pages/Store";
import Stores from "./pages/Stores";
import StoreDetail from "./pages/StoreDetail";
import MyStore from "./pages/MyStore";
import MyStoreFree from "./pages/MyStoreFree";
import StoreReels from "./pages/StoreReels";
import StoreFrontend from "./pages/StoreFrontend";
import Settings from "./pages/Settings";
import Account from "./pages/Account";
import SuperAdmin from "./pages/SuperAdmin";
import LegalNotice from "./pages/LegalNotice";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/checkout" element={<Checkout />} />
            {/* Legal pages */}
            <Route path="/mentions-legales" element={<LegalNotice />} />
            <Route path="/politique-de-confidentialite" element={<PrivacyPolicy />} />
            <Route path="/conditions-generales" element={<TermsOfService />} />
            {/* Public store frontend routes */}
            <Route path="/store/:storeId/reels" element={<StoreReels />} />
            <Route path="/enseigne/magasin/:storeId" element={<StoreReels />} />
            <Route path="/magasin/:storeId" element={<StoreReels />} />
            <Route path="/enseigne/magasin/:storeId/magasin" element={<StoreFrontend />} />
            <Route path="/magasin/:storeId/magasin" element={<StoreFrontend />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          <Route
            path="/promotions"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Promotions />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/promotions/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PromotionDetail />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Campaigns />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CampaignDetail />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stats"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Stats />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/store"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Store />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stores"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Stores />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stores/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <StoreDetail />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mon-magasin"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MyStore />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mon-magasin-free"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MyStoreFree />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Account />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SuperAdmin />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

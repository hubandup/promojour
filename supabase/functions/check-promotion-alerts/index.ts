import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const BREVO_ALERT_TEMPLATE_ID = 53;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StoreAlert {
  storeId: string;
  storeName: string;
  organizationId: string;
  activeCount: number;
  upcomingCount: number;
  minActive: number;
  minUpcoming: number;
  alertEmail: string;
}

const sendAlertEmail = async (alert: StoreAlert) => {
  console.log(`[ALERT] Sending alert email for store: ${alert.storeName}`);
  
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY!
    },
    body: JSON.stringify({
      sender: {
        name: "PromoJour",
        email: "noreply@promojour.com"
      },
      to: [{ email: alert.alertEmail }],
      templateId: BREVO_ALERT_TEMPLATE_ID,
      params: {
        MAGASIN: alert.storeName,
        NOMBRE_ACTIVES: String(alert.activeCount),
        MINIMUM_ACTIVES: String(alert.minActive),
        NOMBRE_A_VENIR: String(alert.upcomingCount),
        MINIMUM_A_VENIR: String(alert.minUpcoming),
        TYPE: "alerte_promotions",
        MESSAGE: `Votre magasin "${alert.storeName}" a ${alert.activeCount} promotion(s) active(s) (minimum recommandé: ${alert.minActive}) et ${alert.upcomingCount} promotion(s) à venir (minimum recommandé: ${alert.minUpcoming}).`
      }
    })
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.error(`[ALERT] Failed to send email:`, result);
    throw new Error(result.message || "Failed to send alert email");
  }
  
  console.log(`[ALERT] Email sent successfully:`, result.messageId);
  return result;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("[CHECK-PROMOTION-ALERTS] Function started");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all stores with their settings where alert_email_enabled is true
    const { data: storeSettings, error: settingsError } = await supabase
      .from('store_settings')
      .select(`
        store_id,
        min_active_promotions,
        min_upcoming_promotions,
        alert_email_enabled
      `)
      .eq('alert_email_enabled', true);

    if (settingsError) {
      console.error("[CHECK-PROMOTION-ALERTS] Error fetching store settings:", settingsError);
      throw settingsError;
    }

    console.log(`[CHECK-PROMOTION-ALERTS] Found ${storeSettings?.length || 0} stores with alerts enabled`);

    const alerts: StoreAlert[] = [];
    const now = new Date().toISOString();

    for (const setting of storeSettings || []) {
      // Get store info with admin email
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, name, organization_id, email')
        .eq('id', setting.store_id)
        .single();

      if (storeError || !store) {
        console.error(`[CHECK-PROMOTION-ALERTS] Error fetching store ${setting.store_id}:`, storeError);
        continue;
      }

      // Get admin email from organization's admin user
      const { data: adminRole, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('organization_id', store.organization_id)
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (adminError || !adminRole) {
        console.log(`[CHECK-PROMOTION-ALERTS] No admin found for org ${store.organization_id}`);
        continue;
      }

      // Get admin email from auth.users via profile or direct
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', adminRole.user_id)
        .single();

      // Get user email from auth
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(adminRole.user_id);
      
      if (userError || !user?.email) {
        console.log(`[CHECK-PROMOTION-ALERTS] No email found for admin ${adminRole.user_id}`);
        continue;
      }

      // Count active promotions for this store's organization
      const { count: activeCount, error: activeError } = await supabase
        .from('promotions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', store.organization_id)
        .eq('status', 'active');

      if (activeError) {
        console.error(`[CHECK-PROMOTION-ALERTS] Error counting active promotions:`, activeError);
        continue;
      }

      // Count upcoming (scheduled) promotions
      const { count: upcomingCount, error: upcomingError } = await supabase
        .from('promotions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', store.organization_id)
        .eq('status', 'scheduled');

      if (upcomingError) {
        console.error(`[CHECK-PROMOTION-ALERTS] Error counting upcoming promotions:`, upcomingError);
        continue;
      }

      const minActive = setting.min_active_promotions || 3;
      const minUpcoming = setting.min_upcoming_promotions || 5;

      // Check if alerts should be triggered
      const shouldAlert = (activeCount || 0) < minActive || (upcomingCount || 0) < minUpcoming;

      if (shouldAlert) {
        console.log(`[CHECK-PROMOTION-ALERTS] Alert triggered for store ${store.name}: active=${activeCount}/${minActive}, upcoming=${upcomingCount}/${minUpcoming}`);
        
        alerts.push({
          storeId: store.id,
          storeName: store.name,
          organizationId: store.organization_id,
          activeCount: activeCount || 0,
          upcomingCount: upcomingCount || 0,
          minActive,
          minUpcoming,
          alertEmail: user.email
        });
      }
    }

    console.log(`[CHECK-PROMOTION-ALERTS] Sending ${alerts.length} alert emails`);

    // Send all alert emails
    const results = [];
    for (const alert of alerts) {
      try {
        const result = await sendAlertEmail(alert);
        results.push({ store: alert.storeName, success: true, messageId: result.messageId });
      } catch (error) {
        console.error(`[CHECK-PROMOTION-ALERTS] Failed to send alert for ${alert.storeName}:`, error);
        results.push({ store: alert.storeName, success: false, error: String(error) });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      alertsSent: results.filter(r => r.success).length,
      alertsFailed: results.filter(r => !r.success).length,
      details: results
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[CHECK-PROMOTION-ALERTS] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

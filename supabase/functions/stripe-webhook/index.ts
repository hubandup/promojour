import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  
  let event: Stripe.Event;

  try {
    // For production, you should verify the webhook signature
    // const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    // event = stripe.webhooks.constructEvent(body, signature!, webhookSecret!);
    
    // For now, parse the event directly
    event = JSON.parse(body);
    logStep("Event received", { type: event.type });
  } catch (err) {
    logStep("Error parsing event", { error: err });
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { 
          sessionId: session.id,
          customerId: session.customer,
          customerEmail: session.customer_email
        });

        // Get customer email
        const customerEmail = session.customer_email || session.customer_details?.email;
        if (!customerEmail) {
          logStep("No customer email found");
          break;
        }

        // Find user by email
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        if (userError) {
          logStep("Error listing users", { error: userError });
          break;
        }

        const user = userData.users.find(u => u.email === customerEmail);
        if (!user) {
          logStep("User not found for email", { email: customerEmail });
          break;
        }

        // Get user's organization
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.organization_id) {
          logStep("Profile or organization not found", { error: profileError });
          break;
        }

        // Determine plan type from session metadata or line items
        const metadata = session.metadata || {};
        const planType = metadata.plan || "store";
        const numberOfStores = parseInt(metadata.number_of_stores || "1");

        // Update organization with subscription info
        const { error: updateError } = await supabaseAdmin
          .from("organizations")
          .update({
            account_type: planType === "centrale" ? "central" : "store",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_status: "active",
            max_stores: planType === "centrale" ? numberOfStores : Math.min(numberOfStores, 3),
            max_users: planType === "centrale" ? 999 : 5,
          })
          .eq("id", profile.organization_id);

        if (updateError) {
          logStep("Error updating organization", { error: updateError });
        } else {
          logStep("Organization updated successfully", { 
            orgId: profile.organization_id,
            planType,
            numberOfStores 
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        // Find organization by subscription ID
        const { data: org, error: orgError } = await supabaseAdmin
          .from("organizations")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (orgError || !org) {
          logStep("Organization not found for subscription", { subscriptionId: subscription.id });
          break;
        }

        // Downgrade to free
        const { error: updateError } = await supabaseAdmin
          .from("organizations")
          .update({
            account_type: "free",
            subscription_status: "canceled",
            max_stores: 1,
            max_users: 1,
          })
          .eq("id", org.id);

        if (updateError) {
          logStep("Error downgrading organization", { error: updateError });
        } else {
          logStep("Organization downgraded to free", { orgId: org.id });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { 
          invoiceId: invoice.id,
          customerId: invoice.customer 
        });

        // Find organization by customer ID
        const { data: org, error: orgError } = await supabaseAdmin
          .from("organizations")
          .select("id")
          .eq("stripe_customer_id", invoice.customer as string)
          .single();

        if (orgError || !org) {
          logStep("Organization not found for customer", { customerId: invoice.customer });
          break;
        }

        // Set grace period status
        const { error: updateError } = await supabaseAdmin
          .from("organizations")
          .update({
            subscription_status: "past_due",
          })
          .eq("id", org.id);

        if (updateError) {
          logStep("Error updating organization status", { error: updateError });
        } else {
          logStep("Organization marked as past_due", { orgId: org.id });
        }

        // TODO: Send warning email to user
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { 
          subscriptionId: subscription.id,
          status: subscription.status 
        });

        // Find organization by subscription ID
        const { data: org, error: orgError } = await supabaseAdmin
          .from("organizations")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (orgError || !org) {
          logStep("Organization not found", { subscriptionId: subscription.id });
          break;
        }

        // Update subscription status
        const { error: updateError } = await supabaseAdmin
          .from("organizations")
          .update({
            subscription_status: subscription.status,
          })
          .eq("id", org.id);

        if (updateError) {
          logStep("Error updating subscription status", { error: updateError });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("Error processing webhook", { error });
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, string>;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[SEND-EMAIL] Function started");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!BREVO_API_KEY) {
      console.error("[SEND-EMAIL] BREVO_API_KEY not configured");
      throw new Error("BREVO_API_KEY not configured");
    }

    const { to, toName, subject, htmlContent, textContent, templateId, params }: EmailRequest = await req.json();

    console.log("[SEND-EMAIL] Sending email to:", to);

    // Build email payload
    const emailPayload: Record<string, unknown> = {
      sender: {
        name: "PromoJour",
        email: "noreply@promojour.com"
      },
      to: [
        {
          email: to,
          name: toName || to
        }
      ],
      subject: subject
    };

    // Use template or custom content
    if (templateId) {
      emailPayload.templateId = templateId;
      if (params) {
        emailPayload.params = params;
      }
    } else {
      emailPayload.htmlContent = htmlContent;
      if (textContent) {
        emailPayload.textContent = textContent;
      }
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY
      },
      body: JSON.stringify(emailPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[SEND-EMAIL] Brevo API error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log("[SEND-EMAIL] Email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, messageId: result.messageId }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[SEND-EMAIL] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

interface SendTemplateEmailParams {
  to: string;
  toName?: string;
  subject: string;
  templateId: number;
  params?: Record<string, string>;
}

export const useSendEmail = () => {
  const sendEmail = async ({ to, toName, subject, htmlContent, textContent }: SendEmailParams) => {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { to, toName, subject, htmlContent, textContent }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const sendTemplateEmail = async ({ to, toName, subject, templateId, params }: SendTemplateEmailParams) => {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { to, toName, subject, templateId, params }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  // Template ID Brevo par défaut
  const BREVO_TEMPLATE_ID = 52;

  // Pre-built email templates using Brevo template 52
  const sendWelcomeEmail = async (to: string, firstName: string) => {
    return sendTemplateEmail({
      to,
      toName: firstName,
      subject: "Bienvenue sur PromoJour !",
      templateId: BREVO_TEMPLATE_ID,
      params: {
        PRENOM: firstName,
        TYPE: "bienvenue",
        MESSAGE: "Nous sommes ravis de vous accueillir sur PromoJour, la plateforme de gestion de vos promotions."
      }
    });
  };

  const sendPromotionPublishedEmail = async (
    to: string, 
    promotionTitle: string, 
    storeName: string,
    platforms: string[]
  ) => {
    return sendTemplateEmail({
      to,
      subject: `Promotion "${promotionTitle}" publiée avec succès !`,
      templateId: BREVO_TEMPLATE_ID,
      params: {
        TYPE: "publication",
        PROMOTION: promotionTitle,
        MAGASIN: storeName,
        PLATEFORMES: platforms.join(', '),
        MESSAGE: `Votre promotion a été publiée sur ${platforms.join(', ')}.`
      }
    });
  };

  const sendAlertLowPromotionsEmail = async (
    to: string,
    storeName: string,
    currentCount: number,
    minRequired: number
  ) => {
    return sendTemplateEmail({
      to,
      subject: `⚠️ Alerte : Peu de promotions actives pour ${storeName}`,
      templateId: BREVO_TEMPLATE_ID,
      params: {
        TYPE: "alerte",
        MAGASIN: storeName,
        NOMBRE_ACTUEL: String(currentCount),
        NOMBRE_MINIMUM: String(minRequired),
        MESSAGE: `Votre magasin n'a que ${currentCount} promotion(s) active(s). Nous recommandons au moins ${minRequired}.`
      }
    });
  };

  const sendSubscriptionConfirmationEmail = async (
    to: string,
    planName: string,
    endDate: string
  ) => {
    return sendTemplateEmail({
      to,
      subject: `Confirmation d'abonnement PromoJour - ${planName}`,
      templateId: BREVO_TEMPLATE_ID,
      params: {
        TYPE: "abonnement",
        PLAN: planName,
        DATE_FIN: endDate,
        MESSAGE: `Votre abonnement ${planName} a été activé. Prochain renouvellement : ${endDate}.`
      }
    });
  };

  return {
    sendEmail,
    sendTemplateEmail,
    sendWelcomeEmail,
    sendPromotionPublishedEmail,
    sendAlertLowPromotionsEmail,
    sendSubscriptionConfirmationEmail,
    BREVO_TEMPLATE_ID
  };
};

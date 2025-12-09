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

  // Pre-built email templates
  const sendWelcomeEmail = async (to: string, firstName: string) => {
    return sendEmail({
      to,
      toName: firstName,
      subject: "Bienvenue sur PromoJour !",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Bienvenue sur PromoJour, ${firstName} !</h1>
          <p>Nous sommes ravis de vous accueillir sur PromoJour, la plateforme de gestion de vos promotions.</p>
          <p>Voici les prochaines étapes pour démarrer :</p>
          <ol>
            <li>Configurez votre magasin</li>
            <li>Ajoutez vos premières promotions</li>
            <li>Connectez vos réseaux sociaux</li>
          </ol>
          <p>Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:support@promojour.com">support@promojour.com</a></p>
          <p>À bientôt,<br>L'équipe PromoJour</p>
        </div>
      `
    });
  };

  const sendPromotionPublishedEmail = async (
    to: string, 
    promotionTitle: string, 
    storeName: string,
    platforms: string[]
  ) => {
    return sendEmail({
      to,
      subject: `Promotion "${promotionTitle}" publiée avec succès !`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Promotion publiée !</h1>
          <p>Votre promotion <strong>"${promotionTitle}"</strong> a été publiée avec succès sur :</p>
          <ul>
            ${platforms.map(p => `<li>${p}</li>`).join('')}
          </ul>
          <p>Magasin : <strong>${storeName}</strong></p>
          <p>Connectez-vous à votre tableau de bord pour suivre les performances.</p>
          <p>L'équipe PromoJour</p>
        </div>
      `
    });
  };

  const sendAlertLowPromotionsEmail = async (
    to: string,
    storeName: string,
    currentCount: number,
    minRequired: number
  ) => {
    return sendEmail({
      to,
      subject: `⚠️ Alerte : Peu de promotions actives pour ${storeName}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b;">⚠️ Alerte promotions</h1>
          <p>Votre magasin <strong>${storeName}</strong> n'a que <strong>${currentCount}</strong> promotion(s) active(s).</p>
          <p>Nous vous recommandons d'avoir au moins <strong>${minRequired}</strong> promotions actives pour maintenir l'engagement de vos clients.</p>
          <a href="https://promojour.com/promotions" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Ajouter des promotions
          </a>
          <p style="margin-top: 24px;">L'équipe PromoJour</p>
        </div>
      `
    });
  };

  const sendSubscriptionConfirmationEmail = async (
    to: string,
    planName: string,
    endDate: string
  ) => {
    return sendEmail({
      to,
      subject: `Confirmation d'abonnement PromoJour - ${planName}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Abonnement activé !</h1>
          <p>Votre abonnement <strong>${planName}</strong> a été activé avec succès.</p>
          <p>Votre prochain renouvellement est prévu le <strong>${endDate}</strong>.</p>
          <p>Vous avez maintenant accès à toutes les fonctionnalités de votre plan.</p>
          <a href="https://promojour.com/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Accéder au Dashboard
          </a>
          <p style="margin-top: 24px;">L'équipe PromoJour</p>
        </div>
      `
    });
  };

  return {
    sendEmail,
    sendTemplateEmail,
    sendWelcomeEmail,
    sendPromotionPublishedEmail,
    sendAlertLowPromotionsEmail,
    sendSubscriptionConfirmationEmail
  };
};

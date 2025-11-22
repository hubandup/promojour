export default function LegalNotice() {
  return (
    <div className="min-h-screen bg-background py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Mentions Légales</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <p>
            Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance en l'économie numérique, 
            il est précisé aux utilisateurs du Site l'identité des différents intervenants dans le cadre de sa réalisation 
            et de son suivi.
          </p>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Édition du site</h2>
            <p>
              Le site PromoJour.com est édité par la société PromoJour S.A.S., au capital social de 1 000 € (euros), 
              immatriculée au Registre du commerce et des sociétés de Lyon sous le n° 753 892 926 et dont le siège social 
              est situé 330 allée des Hêtres – Hall A – F-69760 Limonest (Siret n° 753 892 926 00035 et TVA 
              intracommunautaire n° FR18753892926).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Responsable de publication</h2>
            <p>
              Monsieur Charles Baulu, Président de CLABA EURL, elle-même Présidente de PromoJour SAS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Hébergeur</h2>
            <p>
              Le site PromoJour.com est hébergé par la société OVH (Siège social : 2 rue Kellermann – 59100 Roubaix – France). 
              Cet hébergeur possède à ce jour les éléments d'identification personnelle concernant l'éditeur de ce site, 
              qui est édité à titre professionnel. Le stockage des données personnelles des utilisateurs est exclusivement 
              réalisé sur les centres de données (« clusters ») de la société OVH, dont le siège social est situé 
              2 rue Kellermann – 59100 Roubaix – France. Tous les clusters OVH sur lesquels les données du Site sont stockées 
              sont localisés dans des États membres de l'Union Européenne.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Nous contacter</h2>
            <ul className="list-none space-y-2">
              <li>Par téléphone : +33 (0)4 82 54 00 33</li>
              <li>Par email : contact@promojour.com</li>
              <li>Par courrier : PromoJour SAS, 330 allée des Hêtres – Hall A – F-69760 Limonest</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Votre vie privée</h2>
            <p>
              Le traitement de vos données à caractère personnel est régi par notre Charte du respect de la vie privée 
              conformément au Règlement Général sur la Protection des Données 2016/679 du 27 avril 2016 (« RGPD »). 
              PromoJour SAS a désigné un Délégué à la Protection des Données (DPO) auprès de la CNIL 
              (Désignation N° DPO-1777). Les coordonnées de notre Délégué à la Protection des Données sont les suivantes:
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4">
              <p className="font-semibold">PROMOJOUR SAS</p>
              <p>Adresse : 330 allée des Hêtres – Hall A – F-69760 Limonest</p>
              <p>Tél : +33 (0)4 82 54 00 33</p>
              <p>Email : contact@promojour.com</p>
            </div>
            <p className="mt-4">
              Pour toute question concernant vos données personnelles ou si vous souhaitez supprimer votre Compte, 
              merci de nous contacter à l'adresse suivante: PromoJour SAS, 330 allée des Hêtres – Hall A – F-69760 Limonest 
              (en indiquant « Vie Privée – Protection des Données ») ou par email à privacy@promojour.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

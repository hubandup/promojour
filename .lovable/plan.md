
# Plan d'amelioration globale de PromoJour

Ce plan couvre les 5 axes identifies pour parfaire l'application. Ils sont presentes par ordre de priorite.

---

## 1. Statistiques avec donnees reelles (remplacer les donnees statiques)

La page Stats affiche actuellement des donnees en dur. Une table `promotion_stats` existe deja en base avec les colonnes `views`, `clicks`, `unique_visitors`, `platform`, `date`.

**Ce qui sera fait :**
- Creer un hook `use-stats.ts` qui interroge `promotion_stats` et `promotions` pour agreger les metriques reelles (impressions totales, clics, taux de clic, portee)
- Calculer le top 5 des promotions par vues/clics depuis la table `promotions`
- Agreger les stats par plateforme (instagram, facebook, google) depuis `promotion_stats`
- Remplacer toutes les donnees statiques de `Stats.tsx` par les donnees du hook
- Afficher les variations mensuelles (comparaison mois en cours vs mois precedent)

---

## 2. Graphiques Recharts dans le Dashboard

Recharts est installe mais jamais utilise. Le Dashboard sera enrichi avec des visualisations.

**Ce qui sera fait :**
- Ajouter un graphique en courbe (LineChart) montrant l'evolution des vues sur les 30 derniers jours, en interrogeant `promotion_stats` groupe par date
- Ajouter un histogramme (BarChart) affichant la repartition des promotions par statut (actif, programme, expire, brouillon)
- Integrer ces graphiques dans la grille existante du Dashboard, sous les cartes de stats
- Creer un hook `use-dashboard-charts.ts` pour preparer les donnees des graphiques

---

## 3. Systeme de notifications in-app

Actuellement, aucun systeme de notification interne n'existe.

**Ce qui sera fait :**
- Creer une table `notifications` en base (id, user_id, title, message, type, read, created_at)
- Politiques RLS : chaque utilisateur ne voit que ses propres notifications
- Ajouter une icone cloche dans le header (`AppLayout.tsx`) avec un badge compteur de notifications non lues
- Creer un composant `NotificationCenter` (dropdown/popover) listant les notifications recentes avec possibilite de marquer comme lues
- Creer un hook `use-notifications.ts` pour charger/gerer les notifications
- Generer des notifications automatiques via triggers en base pour : promotion expiree, seuil d'alerte atteint, nouvelle promotion assignee au magasin
- Activer le realtime sur la table `notifications` pour mise a jour instantanee

---

## 4. Persistance des reglages Settings

Trois fonctions de sauvegarde contiennent des `TODO` : branding, notifications, integrations.

**Ce qui sera fait :**
- Ajouter des colonnes a la table `organizations` : `branding_color` (text), `use_custom_logo` (boolean), `use_brand_colors` (boolean)
- Ajouter des colonnes a `store_settings` ou `profiles` : `email_notifications` (boolean), `performance_alerts` (boolean), `tips_enabled` (boolean)
- Implementer `handleSaveBranding` pour sauvegarder la couleur et les toggles dans `organizations`
- Implementer `handleSaveNotifications` pour sauvegarder les preferences dans la base
- Charger les valeurs sauvegardees au montage du composant pour pre-remplir les formulaires
- Supprimer tous les commentaires `// TODO`

---

## 5. Cron job pour les alertes promotions

La fonction `check-promotion-alerts` existe mais ne s'execute jamais automatiquement.

**Ce qui sera fait :**
- Activer les extensions `pg_cron` et `pg_net` via migration SQL
- Creer un cron job qui execute `check-promotion-alerts` chaque jour a 9h du matin (heure Paris)
- Le job fera un appel HTTP POST vers la fonction backend avec les headers d'authentification necessaires

---

## Details techniques

### Migrations de base de donnees

1. Table `notifications` :
```text
id (uuid PK), user_id (uuid), title (text), message (text),
type (text), read (boolean default false), created_at (timestamptz)
+ RLS policies + realtime
```

2. Colonnes sur `organizations` :
```text
branding_color (text default '#8B5CF6')
use_custom_logo (boolean default false)
use_brand_colors (boolean default false)
```

3. Colonnes sur `profiles` ou nouvelle table `user_preferences` :
```text
email_notifications (boolean default true)
performance_alerts (boolean default true)
tips_enabled (boolean default false)
```

4. Triggers pour notifications automatiques (promotion expiree, seuil alerte)

5. Cron job via `pg_cron` + `pg_net`

### Nouveaux fichiers
- `src/hooks/use-stats.ts` - Donnees reelles pour la page Stats
- `src/hooks/use-dashboard-charts.ts` - Donnees pour les graphiques Recharts
- `src/hooks/use-notifications.ts` - Gestion des notifications
- `src/components/NotificationCenter.tsx` - UI du centre de notifications

### Fichiers modifies
- `src/pages/Stats.tsx` - Remplacement donnees statiques
- `src/pages/Dashboard.tsx` - Ajout graphiques Recharts
- `src/components/AppLayout.tsx` - Ajout icone cloche + NotificationCenter
- `src/pages/Settings.tsx` - Persistance reelle des reglages


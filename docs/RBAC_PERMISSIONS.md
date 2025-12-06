# PromoJour - Système RBAC et Permissions

## 1. Types d'Organisation

| Type | Stores | Promotions | Horizon | Réseaux sociaux | Utilisateurs |
|------|--------|------------|---------|-----------------|--------------|
| **Free** | 1 max | 7 simultanées max | 15 jours max | 1 max par magasin | ❌ Pas de gestion |
| **Pro** | 5 max | ♾️ Illimitées | ♾️ Illimité | ♾️ Illimités par magasin | 5 max |
| **Centrale** | ♾️ Illimités | ♾️ Illimitées | ♾️ Illimité | *Via magasins uniquement* | ♾️ Illimités |

### Règles spéciales pour Centrale

- **Héritage des promotions** : Les promotions créées par la Centrale apparaissent automatiquement dans tous les magasins rattachés
- **Pas de connexions sociales au niveau org** : La Centrale ne connecte JAMAIS ses propres réseaux sociaux
- **Diffusion via magasins** : Les promotions sont publiées sur les réseaux sociaux de chaque magasin, pas de la Centrale
- **Magasins autonomes** : Chaque magasin peut ajouter ses propres promotions (non visibles par les autres magasins)
- **store_id obligatoire** : Toutes les connexions sociales DOIVENT être attachées à un `store_id` (jamais à l'organisation seule)

---

## 2. Magasins Franchisés

Un **magasin franchisé** est un magasin rattaché à une organisation de type Centrale.

### Caractéristiques des magasins franchisés

| Fonctionnalité | Description |
|----------------|-------------|
| **Héritage des promos** | Voit automatiquement toutes les promotions créées par la Centrale (lecture seule) |
| **Promos propres** | Peut créer ses propres promotions, non visibles par les autres magasins du réseau |
| **Réseaux sociaux** | Peut connecter ses propres comptes Facebook, Instagram, Google Business |
| **Autonomie** | Gère ses horaires, description, coordonnées de façon indépendante |
| **Publication** | Les promotions (centrales et propres) sont publiées sur SES réseaux sociaux |

### Flow de distribution Centrale → Magasins Franchisés

```
┌─────────────────┐
│    CENTRALE     │
│  Crée promo     │
│  (pas de social)│
└────────┬────────┘
         │
         ▼ Héritage automatique
┌────────────────────────────────┐
│     MAGASINS FRANCHISÉS        │
│  ┌─────────┐  ┌─────────┐     │
│  │Magasin 1│  │Magasin 2│ ... │
│  │(social) │  │(social) │     │
│  └────┬────┘  └────┬────┘     │
│       │            │          │
│       ▼            ▼          │
│   Frontend     Frontend       │
│   + FB/IG      + FB/IG        │
└────────────────────────────────┘
```

---

## 3. Limites des Réseaux Sociaux

| Type d'org | Limite réseaux sociaux | Niveau |
|------------|------------------------|--------|
| **Free** | 1 réseau social max par magasin | Magasin |
| **Pro** | Illimité par magasin | Magasin |
| **Centrale** | Illimité par magasin (pas au niveau org) | Magasin uniquement |

### Règle critique : `store_id` obligatoire

```sql
-- Les connexions sociales DOIVENT avoir un store_id
social_connections.store_id IS NOT NULL -- Toujours vrai
```

- Une connexion sociale sans `store_id` est **invalide**
- Les centrales n'ont **jamais** de connexions sociales au niveau organisation
- Chaque magasin franchisé gère ses propres connexions

---

## 4. Rôles Utilisateurs

### super_admin
- Accès multi-organisation
- Full CRUD sur toutes les entités
- Réservé aux administrateurs PromoJour

### admin
- Gestion complète de l'organisation
- Gestion des utilisateurs (dans les limites du plan)
- CRUD sur : promotions, magasins, campagnes, connexions sociales
- Accès aux paramètres d'organisation

### editor
- CRUD sur promotions et campagnes uniquement
- ❌ Pas d'accès aux paramètres d'organisation
- ❌ Pas de gestion des utilisateurs
- ❌ Pas de création/suppression de magasins

### store_manager (Franchisé)
- CRUD uniquement sur son magasin assigné
- CRUD sur ses propres promotions
- Peut connecter les réseaux sociaux de son magasin
- ❌ Ne voit pas les autres magasins
- ❌ Pas d'accès aux campagnes globales
- ✅ Voit les promotions héritées de la Centrale (lecture seule)

### viewer
- Lecture seule partout
- Aucune modification possible

---

## 5. Matrice des Permissions Détaillée

### Promotions

| Permission | super_admin | admin | editor | store_manager | viewer |
|------------|-------------|-------|--------|---------------|--------|
| Voir | ✅ | ✅ | ✅ | ✅ (toutes org) | ✅ |
| Créer | ✅ | ✅ | ✅ | ✅ (son magasin) | ❌ |
| Modifier | ✅ | ✅ | ✅ | ✅ (ses promos) | ❌ |
| Supprimer | ✅ | ✅ | ✅ | ✅ (ses promos) | ❌ |
| Modifier archivée | ❌ | ❌ | ❌ | ❌ | ❌ |

### Magasins

| Permission | super_admin | admin | editor | store_manager | viewer |
|------------|-------------|-------|--------|---------------|--------|
| Voir tous | ✅ | ✅ | ✅ | ❌ | ✅ |
| Voir le sien | ✅ | ✅ | ✅ | ✅ | ✅ |
| Créer | ✅ | ✅ | ❌ | ❌ | ❌ |
| Modifier | ✅ | ✅ | ❌ | ✅ (le sien) | ❌ |
| Supprimer | ✅ | ✅ | ❌ | ❌ | ❌ |

### Campagnes

| Permission | super_admin | admin (Free) | admin (Pro/Central) | editor | store_manager | viewer |
|------------|-------------|--------------|---------------------|--------|---------------|--------|
| Voir | ✅ | ❌ | ✅ | ✅* | ❌ | ✅* |
| Créer | ✅ | ❌ | ✅ | ✅* | ❌ | ❌ |
| Modifier | ✅ | ❌ | ✅ | ✅* | ❌ | ❌ |
| Supprimer | ✅ | ❌ | ✅ | ✅* | ❌ | ❌ |

*\* Seulement si type d'org = Pro ou Centrale*

### Connexions Sociales

| Permission | super_admin | admin | editor | store_manager | viewer |
|------------|-------------|-------|--------|---------------|--------|
| Voir | ✅ | ✅ | ✅ | ✅ (son magasin) | ✅ |
| Gérer | ✅ | ✅ | ✅ | ✅ (son magasin) | ❌ |
| Niveau org | ❌ | ❌ | ❌ | ❌ | ❌ |

**Note importante** : Les connexions sociales sont TOUJOURS au niveau du magasin, jamais au niveau de l'organisation. La Centrale ne connecte pas de réseaux sociaux directement.

### Limites par type d'organisation

| Limite | Free | Pro | Centrale |
|--------|------|-----|----------|
| Max réseaux par magasin | 1 | ♾️ | ♾️ |
| Connexion au niveau org | ❌ | ❌ | ❌ |

### QR Codes

| Permission | Free | Pro/Centrale |
|------------|------|--------------|
| Voir | ❌ | ✅ |
| Télécharger | ❌ | ✅ |

### Paramètres Organisation

| Permission | super_admin | admin | editor | store_manager | viewer |
|------------|-------------|-------|--------|---------------|--------|
| Voir | ✅ | ✅ | ❌ | ❌ | ❌ |
| Modifier | ✅ | ✅ | ❌ | ❌ | ❌ |

### Gestion Utilisateurs

| Permission | Free | Pro | Centrale |
|------------|------|-----|----------|
| Disponible | ❌ | ✅ (5 max) | ✅ (illimité) |
| Rôles disponibles | - | admin, editor, viewer | admin, editor, viewer, store_manager |

### Mécaniques Promotionnelles

| Permission | Free | Pro/Centrale |
|------------|------|--------------|
| Types disponibles | 2 (% et €) | Tous |
| Gérer | ❌ | ✅ (admin only) |

---

## 6. Archivage des Promotions

### Règles d'archivage automatique

| Condition | Action |
|-----------|--------|
| `end_date` < `now()` | Statut → `archived` automatiquement |
| Statut = `archived` | Promotion en lecture seule |

### Permissions sur les promotions archivées

| Action | Autorisée |
|--------|-----------|
| Voir | ✅ |
| Modifier | ❌ |
| Supprimer | ✅ (admin/super_admin) |
| Dupliquer | ✅ |

### Implémentation

```typescript
import { usePromotionArchival } from "@/hooks/use-promotion-archival";

function MyComponent() {
  const { isPromotionEditable, getNotEditableReason } = usePromotionArchival();
  
  // Vérifier si une promo est modifiable
  if (!isPromotionEditable(promo.status, promo.end_date)) {
    const reason = getNotEditableReason(promo.status, promo.end_date);
    toast.error(reason);
    return;
  }
}
```

---

## 7. Implémentation Technique

### Hook de permissions

```typescript
import { usePermissions } from "@/hooks/use-permissions";

function MyComponent() {
  const { 
    canCreatePromotions,
    canEditStores,
    canViewCampaigns,
    canEditArchivedPromotions, // Toujours false
    limits 
  } = usePermissions();

  if (!canCreatePromotions) {
    return <AccessDenied />;
  }

  return <CreatePromotionForm />;
}
```

### Vérification des limites réseaux sociaux

```typescript
import { useSocialConnectionLimits } from "@/hooks/use-social-connection-limits";

function SocialManager({ storeId }) {
  const { canAddSocialConnection, maxSocialNetworksPerStore } = useSocialConnectionLimits(storeId);
  
  const handleConnect = async () => {
    const { allowed, reason, currentCount, maxAllowed } = await canAddSocialConnection();
    
    if (!allowed) {
      toast.error(reason);
      return;
    }
    
    // Procéder à la connexion...
  };
}
```

### Vérification des limites générales

```typescript
const { limits } = usePermissions();

// Vérifier le nombre max de magasins
if (limits.maxStores !== null && currentStoreCount >= limits.maxStores) {
  toast.error("Limite de magasins atteinte");
}

// Vérifier les promotions simultanées
if (limits.maxSimultaneousPromos !== null && activePromoCount >= limits.maxSimultaneousPromos) {
  toast.error("Limite de promotions simultanées atteinte");
}

// Vérifier les réseaux sociaux par magasin
if (limits.maxSocialNetworksPerStore !== null && connectedCount >= limits.maxSocialNetworksPerStore) {
  toast.error("Limite de réseaux sociaux atteinte pour ce magasin");
}
```

---

## 8. Changelog

- **v1.3** : Ajout des limites réseaux sociaux par type d'org (Free = 1, Pro/Central = illimité)
- **v1.2** : Ajout de la notion de "Magasin franchisé" et des règles d'archivage automatique
- **v1.1** : Clarification : store_id obligatoire pour toutes les connexions sociales
- **v1.0** : Implémentation initiale du système RBAC

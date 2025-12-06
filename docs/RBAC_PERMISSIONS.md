# PromoJour - Système RBAC et Permissions

## 1. Types d'Organisation

| Type | Stores | Promotions | Horizon | Réseaux sociaux | Utilisateurs |
|------|--------|------------|---------|-----------------|--------------|
| **Free** | 1 max | 7 simultanées max | 15 jours max | 1 max | ❌ Pas de gestion |
| **Pro** | 5 max | ♾️ Illimitées | ♾️ Illimité | ♾️ Multiples | 5 max |
| **Centrale** | ♾️ Illimités | ♾️ Illimitées | ♾️ Illimité | *Via magasins* | ♾️ Illimités |

### Règles spéciales pour Centrale

- **Héritage des promotions** : Les promotions créées par la Centrale apparaissent automatiquement dans tous les magasins rattachés
- **Pas de connexions sociales** : La Centrale ne connecte JAMAIS ses propres réseaux sociaux
- **Diffusion via magasins** : Les promotions sont publiées sur les réseaux sociaux de chaque magasin, pas de la Centrale
- **Magasins autonomes** : Chaque magasin peut ajouter ses propres promotions (non visibles par les autres magasins)

---

## 2. Rôles Utilisateurs

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

### store_manager
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

## 3. Matrice des Permissions Détaillée

### Promotions

| Permission | super_admin | admin | editor | store_manager | viewer |
|------------|-------------|-------|--------|---------------|--------|
| Voir | ✅ | ✅ | ✅ | ✅ (toutes org) | ✅ |
| Créer | ✅ | ✅ | ✅ | ✅ (son magasin) | ❌ |
| Modifier | ✅ | ✅ | ✅ | ✅ (ses promos) | ❌ |
| Supprimer | ✅ | ✅ | ✅ | ✅ (ses promos) | ❌ |

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

**Note importante** : Les connexions sociales sont TOUJOURS au niveau du magasin, jamais au niveau de l'organisation. La Centrale ne connecte pas de réseaux sociaux.

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

## 4. Règles de Diffusion

### Flow de diffusion Centrale → Magasins

```
┌─────────────────┐
│    CENTRALE     │
│  Crée promo     │
└────────┬────────┘
         │
         ▼ Héritage automatique
┌────────────────────────────────┐
│         MAGASINS               │
│  ┌─────────┐  ┌─────────┐     │
│  │Magasin 1│  │Magasin 2│ ... │
│  └────┬────┘  └────┬────┘     │
│       │            │          │
│       ▼            ▼          │
│   Frontend     Frontend       │
│   + Social     + Social       │
└────────────────────────────────┘
```

### Points clés

1. **Promotions Centrale** → Apparaissent sur TOUS les magasins
2. **Promotions Magasin** → Visibles uniquement sur CE magasin
3. **Publication sociale** → Utilise les connexions DU MAGASIN
4. **Centrale** → Ne publie JAMAIS directement sur les réseaux

---

## 5. Implémentation Technique

### Hook de permissions

```typescript
import { usePermissions } from "@/hooks/use-permissions";

function MyComponent() {
  const { 
    canCreatePromotions,
    canEditStores,
    canViewCampaigns,
    limits 
  } = usePermissions();

  if (!canCreatePromotions) {
    return <AccessDenied />;
  }

  return <CreatePromotionForm />;
}
```

### Vérification des limites

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
```

---

## 6. Changelog

- **v1.0** : Implémentation initiale du système RBAC
- Clarification : Centrale ne connecte pas de réseaux sociaux
- Clarification : store_manager n'a pas accès aux campagnes
- Clarification : Limites utilisateurs dépendent du type d'org, pas du rôle

# 🎯 PROMPT POUR BOLT - Interface Admin Fashop

## 📋 CONTEXTE DU PROJET

Tu dois créer une **interface d'administration complète** pour le site e-commerce **Fashop**. Le frontend public est déjà créé en React + TypeScript, et maintenant il faut créer l'interface admin pour gérer tous les aspects du site.

**Technologies à utiliser :**
- React 18 + TypeScript
- Tailwind CSS (déjà configuré)
- Framer Motion (pour les animations)
- TanStack Query (React Query) - déjà utilisé dans le projet
- Wouter (pour le routing) - déjà utilisé
- Composants shadcn/ui (déjà présents dans `client/src/components/ui/`)
- Zustand (pour le state management si nécessaire)

**Structure du projet :**
- Frontend : `client/src/`
- Code partagé : `shared/`
- Schémas de données : `shared/schema.ts`
- Routes API : `shared/routes.ts`

---

## 🎯 OBJECTIF PRINCIPAL

Créer une interface d'administration moderne, professionnelle et complète permettant de :
1. Gérer les produits (CRUD)
2. Gérer les catégories (CRUD)
3. Gérer les commandes (voir, modifier statut)
4. Gérer les témoignages (CRUD)
5. Configurer les paramètres (réseaux sociaux, bannière)
6. Voir les statistiques et analytics
7. Dashboard avec métriques

---

## 📁 STRUCTURE À CRÉER

Créer les fichiers suivants dans `client/src/pages/admin/` :

```
admin/
├── AdminLayout.tsx          # Layout principal avec Sidebar
├── Dashboard.tsx            # Page d'accueil admin
├── Products/
│   ├── ProductsList.tsx    # Liste des produits
│   ├── ProductForm.tsx     # Formulaire création/édition
│   └── ProductDetail.tsx   # Détails d'un produit
├── Categories/
│   ├── CategoriesList.tsx  # Liste des catégories
│   └── CategoryForm.tsx    # Formulaire création/édition
├── Orders/
│   ├── OrdersList.tsx      # Liste des commandes
│   └── OrderDetail.tsx    # Détails d'une commande
├── Testimonials/
│   ├── TestimonialsList.tsx # Liste des témoignages
│   └── TestimonialForm.tsx  # Formulaire création/édition
├── Settings/
│   ├── SocialSettings.tsx   # Paramètres réseaux sociaux
│   └── BannerSettings.tsx   # Paramètres bannière
├── Analytics.tsx            # Page statistiques
└── Login.tsx               # Page de connexion
```

Créer les hooks dans `client/src/hooks/admin/` :

```
admin/
├── use-admin-products.ts
├── use-admin-categories.ts
├── use-admin-orders.ts
├── use-admin-testimonials.ts
├── use-admin-settings.ts
└── use-admin-analytics.ts
```

---

## 🎨 DESIGN ET UI

### Layout Admin

**Structure :**
```
┌─────────────────────────────────────┐
│  Header (Logo + Menu utilisateur)  │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │   Contenu principal      │
│ (Menu)   │   (Pages)                │
│          │                          │
└──────────┴──────────────────────────┘
```

**Sidebar Menu :**
- 🏠 Dashboard
- 📦 Produits
- 🏷️ Catégories
- 🛒 Commandes
- ⭐ Témoignages
- ⚙️ Paramètres
  - Réseaux sociaux
  - Bannière publicitaire
- 📊 Statistiques

**Couleurs :**
- Primary : Orange (#FF6B35 ou variable `primary` Tailwind)
- Sidebar : Gris foncé (#1F2937)
- Background : Blanc (#FFFFFF)
- Success : Vert (#10B981)
- Warning : Jaune (#F59E0B)
- Danger : Rouge (#EF4444)

### Responsive
- Sidebar collapsible sur mobile
- Tables scrollables horizontalement sur mobile
- Menu hamburger sur mobile

---

## 📄 PAGES À CRÉER

### 1. Login (`/admin/login`)

**Formulaire simple :**
- Email (input)
- Mot de passe (input type="password")
- Bouton "Se connecter"
- Design centré, carte blanche avec ombre

**Après connexion :** Rediriger vers `/admin/dashboard`

**Note :** Pour l'instant, simuler l'authentification (pas de vrai backend). Stocker un token dans localStorage.

---

### 2. AdminLayout

**Composant wrapper avec :**
- Sidebar fixe à gauche
- Header en haut
- Zone de contenu principale
- Protection des routes (rediriger vers login si non connecté)

**Sidebar :**
- Logo "Fashop Admin" en haut
- Menu de navigation avec icônes
- Indicateur de page active
- Menu utilisateur en bas (déconnexion)

**Header :**
- Titre de la page actuelle
- Breadcrumbs (optionnel)
- Menu utilisateur (nom, avatar, déconnexion)

---

### 3. Dashboard (`/admin/dashboard`)

**4 Cards de métriques en haut :**
1. Total des commandes (nombre + variation %)
2. Chiffre d'affaires (montant FCFA + variation %)
3. Produits actifs (nombre)
4. Commandes en attente (nombre)

**Graphiques (utiliser Recharts - déjà dans package.json) :**
1. Ventes sur 30 jours (Line Chart)
2. Ventes par catégorie (Pie Chart)
3. Top 5 produits (Bar Chart)

**Tableau :** 5 dernières commandes

**Note :** Utiliser des données mockées pour l'instant (créer `client/src/data/mockAdminData.ts`)

---

### 4. ProductsList (`/admin/products`)

**Tableau avec colonnes :**
- Image (miniature)
- Nom (lien vers édition)
- Catégorie (badge)
- Prix
- Prix réduit (si réduction)
- Statut (badge Actif/Inactif)
- Actions (Modifier, Dupliquer, Supprimer)

**Filtres en haut :**
- Recherche par nom
- Filtre par catégorie
- Filtre par statut
- Bouton "+ Ajouter un produit"

**Pagination :** 20 produits par page

**Utiliser :** Composant `Table` de shadcn/ui

---

### 5. ProductForm (`/admin/products/new` et `/admin/products/:id/edit`)

**Formulaire en 2 colonnes :**

**Colonne gauche :**
- Nom * (input)
- Description (textarea)
- Catégorie * (select)
- Prix * (input number, suffixe "FCFA")
- Réduction % (input number, 0-100)
- Afficher prix réduit calculé si réduction

**Colonne droite :**
- Upload image (drag & drop ou bouton)
- Aperçu image
- Statut (toggle Actif/Inactif)
- Boutons : Enregistrer, Annuler, Prévisualiser

**Validation :**
- Champs requis marqués *
- Messages d'erreur sous chaque champ
- Empêcher soumission si erreurs

---

### 6. CategoriesList (`/admin/categories`)

**Tableau :**
- Nom
- Slug
- Nombre de produits (badge)
- Actions (Modifier, Supprimer)

**Bouton :** "+ Ajouter une catégorie"

---

### 7. CategoryForm

**Formulaire simple :**
- Nom * (input)
- Slug (input, auto-généré depuis nom mais modifiable)
- Boutons : Enregistrer, Annuler

**Validation :** Nom unique

---

### 8. OrdersList (`/admin/orders`)

**Tableau avec colonnes :**
- ID (lien vers détails)
- Client (nom)
- Téléphone
- Produits (liste avec quantités)
- Montant total (gras, orange)
- Statut (badge coloré)
- Date
- Actions (Voir détails, Modifier statut)

**Filtres :**
- Par statut (select)
- Par date (select)
- Recherche (nom ou téléphone)

**Badges de statut :**
- En attente : jaune
- En cours : bleu
- Livrée : vert
- Annulée : rouge

---

### 9. OrderDetail (`/admin/orders/:id`)

**3 sections :**

**1. Informations client :**
- Nom
- Téléphone (lien cliquable)
- Localisation
- Type de livraison
- Date de livraison prévue

**2. Produits commandés :**
- Tableau avec : Image, Nom, Quantité, Prix unitaire, Total
- Total général en bas

**3. Actions :**
- Modifier statut (select)
- Bouton "Imprimer"
- Bouton "Exporter PDF"

---

### 10. TestimonialsList (`/admin/testimonials`)

**Tableau :**
- Nom
- Localisation
- Note (5 étoiles)
- Extrait texte
- Statut
- Actions

**Bouton :** "+ Ajouter un témoignage"

---

### 11. TestimonialForm

**Formulaire :**
- Nom du client *
- Localisation *
- Note (1-5, slider ou select)
- Texte * (textarea)
- Initiales avatar (auto-généré, modifiable)
- Statut (Actif/Inactif)

---

### 12. SocialSettings (`/admin/settings/social`)

**Formulaire :**
- Lien WhatsApp (input URL)
- Lien TikTok (input URL)
- Lien Facebook (input URL)
- Bouton "Tester les liens"
- Bouton "Enregistrer"

**Note :** Ces liens sont utilisés dans la Navbar publique

---

### 13. BannerSettings (`/admin/settings/banner`)

**Formulaire :**
- Texte principal (input)
- Texte secondaire (input)
- Pourcentage réduction (0-100)
- Activer/Désactiver (toggle)
- Lien bouton CTA (input URL)

**Prévisualisation :**
- Aperçu de la bannière (fond orange, texte blanc)

---

### 14. Analytics (`/admin/analytics`)

**Filtres en haut :**
- Période (select : 7 jours, 30 jours, 3 mois, etc.)
- Date début / Date fin (date pickers)

**Graphiques (Recharts) :**
1. Évolution des ventes (Line Chart)
2. Ventes par catégorie (Pie Chart)
3. Top 10 produits (Bar Chart horizontal)
4. Commandes par statut (Donut Chart)

**Boutons export :**
- "Exporter en CSV"
- "Exporter en PDF"

---

## 🔌 HOOKS À CRÉER

### use-admin-products.ts

```typescript
// Fonctions à créer :
- useAdminProducts() // Liste avec filtres
- useAdminProduct(id) // Détails
- useCreateProduct() // Créer
- useUpdateProduct() // Modifier
- useDeleteProduct() // Supprimer
```

**Utiliser TanStack Query** comme dans `use-products.ts` existant.

**Pour l'instant :** Utiliser les données mockées de `mockProducts.ts` et simuler les appels API.

---

### use-admin-categories.ts

```typescript
- useAdminCategories()
- useCreateCategory()
- useUpdateCategory()
- useDeleteCategory()
```

---

### use-admin-orders.ts

```typescript
- useAdminOrders(filters)
- useAdminOrder(id)
- useUpdateOrderStatus(id, status)
```

---

### use-admin-testimonials.ts

```typescript
- useAdminTestimonials()
- useCreateTestimonial()
- useUpdateTestimonial()
- useDeleteTestimonial()
```

---

### use-admin-settings.ts

```typescript
- useAdminSettings()
- useUpdateSetting(key, value)
```

---

### use-admin-analytics.ts

```typescript
- useDashboardStats()
- useSalesData(period)
- useCategorySales()
- useTopProducts()
```

---

## 📊 DONNÉES MOCKÉES

Créer `client/src/data/mockAdminData.ts` avec :

- Données pour le dashboard (métriques, graphiques)
- Données pour les commandes (liste de commandes)
- Données pour les témoignages
- Données pour les statistiques

**Utiliser les données existantes :**
- Produits : `mockProducts.ts`
- Catégories : `mockCategories` dans `mockProducts.ts`

---

## 🛣️ ROUTES À AJOUTER

Dans `client/src/App.tsx`, ajouter :

```typescript
// Routes Admin
<Route path="/admin/login" component={AdminLogin} />
<Route path="/admin/*" component={AdminLayout}>
  <Route path="/admin/dashboard" component={Dashboard} />
  <Route path="/admin/products" component={ProductsList} />
  <Route path="/admin/products/new" component={ProductForm} />
  <Route path="/admin/products/:id/edit" component={ProductForm} />
  <Route path="/admin/categories" component={CategoriesList} />
  <Route path="/admin/categories/new" component={CategoryForm} />
  <Route path="/admin/categories/:id/edit" component={CategoryForm} />
  <Route path="/admin/orders" component={OrdersList} />
  <Route path="/admin/orders/:id" component={OrderDetail} />
  <Route path="/admin/testimonials" component={TestimonialsList} />
  <Route path="/admin/testimonials/new" component={TestimonialForm} />
  <Route path="/admin/testimonials/:id/edit" component={TestimonialForm} />
  <Route path="/admin/settings/social" component={SocialSettings} />
  <Route path="/admin/settings/banner" component={BannerSettings} />
  <Route path="/admin/analytics" component={Analytics} />
</Route>
```

---

## ✅ FONCTIONNALITÉS IMPORTANTES

### Protection des routes
- Vérifier si l'utilisateur est connecté
- Rediriger vers `/admin/login` si non connecté
- Stocker le token dans localStorage

### Gestion des erreurs
- Afficher des toasts pour les erreurs
- Messages d'erreur clairs
- Gestion des erreurs réseau

### Loading states
- Afficher des spinners pendant les chargements
- Skeleton loaders pour les tableaux

### Confirmations
- Modals de confirmation avant suppressions
- Messages clairs ("Êtes-vous sûr ?")

### Notifications
- Toasts de succès après actions
- Toasts d'erreur si problème

---

## 🎯 PRIORITÉS

**Phase 1 (Essentiel) :**
1. AdminLayout avec Sidebar
2. Login
3. Dashboard avec métriques
4. ProductsList et ProductForm
5. CategoriesList et CategoryForm

**Phase 2 (Important) :**
6. OrdersList et OrderDetail
7. TestimonialsList et TestimonialForm
8. Settings (social + banner)

**Phase 3 (Bonus) :**
9. Analytics avec graphiques
10. Exports CSV/PDF

---

## 📝 NOTES IMPORTANTES

1. **Utiliser les composants existants** : Tous les composants shadcn/ui sont déjà dans `client/src/components/ui/`

2. **Respecter le design** : Utiliser les mêmes couleurs, typographie que le site public

3. **Responsive** : Tout doit fonctionner sur mobile, tablette et desktop

4. **Données mockées** : Pour l'instant, utiliser des données mockées. Les appels API réels seront ajoutés plus tard quand le backend Laravel sera prêt.

5. **Code propre** : 
   - Composants réutilisables
   - Hooks bien organisés
   - Types TypeScript corrects
   - Commentaires si nécessaire

6. **Animations** : Utiliser Framer Motion pour des transitions fluides (comme dans le site public)

---

## 🔍 RÉFÉRENCES

**Fichiers à examiner :**
- `shared/schema.ts` : Structure des données
- `shared/routes.ts` : Routes API définies
- `client/src/hooks/use-products.ts` : Exemple de hooks
- `client/src/data/mockProducts.ts` : Exemple de données
- `client/src/pages/Home.tsx` : Exemple de page
- `client/src/components/ProductCard.tsx` : Exemple de composant

**Documentation :**
- `DOCUMENTATION_ADMIN.md` : Documentation complète
- `SPECIFICATIONS_ADMIN.md` : Spécifications détaillées

---

## 🚀 COMMENCER PAR

1. Créer `AdminLayout.tsx` avec Sidebar
2. Créer `Login.tsx`
3. Créer `Dashboard.tsx` avec métriques
4. Créer `ProductsList.tsx` et `ProductForm.tsx`
5. Tester chaque page au fur et à mesure

---

## ✅ CHECKLIST FINALE

- [ ] Toutes les pages créées
- [ ] Tous les hooks créés
- [ ] Routes configurées
- [ ] Protection des routes
- [ ] Design responsive
- [ ] Animations fluides
- [ ] Gestion des erreurs
- [ ] Loading states
- [ ] Confirmations
- [ ] Notifications
- [ ] Code propre et commenté
- [ ] Types TypeScript corrects

---

**IMPORTANT :** Créer tout le code en français (commentaires, messages, etc.). Le site est en français.

**Bonne chance ! 🚀**


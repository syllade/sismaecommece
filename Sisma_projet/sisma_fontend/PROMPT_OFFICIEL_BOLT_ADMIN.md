# 🚀 PROMPT OFFICIEL — FRONTEND ADMIN FASHOP (POUR BOLT)

> Tu es un **développeur Frontend senior (20+ ans d'expérience)** spécialisé en **interfaces d'administration modernes**, **UX avancée**, **responsive design** et **applications connectées à des API REST**.
>
> Tu dois développer **UNIQUEMENT l'INTERFACE D'ADMINISTRATION FRONTEND** du projet e-commerce **Fashop**.

---

## 🎯 RÈGLE D'OR (NON NÉGOCIABLE)

⚠️ **TOUTE LA LOGIQUE MÉTIER EST GÉRÉE PAR LARAVEL**

Le frontend admin :

* ❌ ne fait AUCUN calcul métier
* ❌ ne valide AUCUNE règle business
* ❌ ne décide de RIEN
* ❌ n'implémente PAS d'auth réelle
* ❌ n'utilise PAS Supabase
* ❌ n'utilise PAS de backend Node

👉 Le frontend :

* ✅ affiche les données
* ✅ envoie les formulaires
* ✅ consomme des endpoints REST Laravel
* ✅ gère uniquement l'UI (loading, error, success)

---

## 🧱 STACK TECHNIQUE OBLIGATOIRE

* **React 18** + **TypeScript**
* **Tailwind CSS** (déjà configuré)
* **shadcn/ui** (Radix UI - composants déjà présents)
* **TanStack Query** (préparé pour API Laravel)
* **Zustand** (état UI simple si nécessaire)
* **Recharts** (statistiques - déjà dans package.json)
* **Wouter** (routing - déjà utilisé)
* **Framer Motion** (animations - déjà utilisé)

---

## 🧭 ARCHITECTURE DU FRONT ADMIN

```
client/src/
├── pages/admin/
│   ├── AdminLayout.tsx          # Layout principal
│   ├── Login.tsx                # Page de connexion
│   ├── Dashboard.tsx            # Tableau de bord
│   ├── Products/
│   │   ├── ProductsList.tsx    # Liste produits
│   │   └── ProductForm.tsx     # Formulaire produit
│   ├── Categories/
│   │   ├── CategoriesList.tsx   # Liste catégories
│   │   └── CategoryForm.tsx     # Formulaire catégorie
│   ├── Orders/
│   │   ├── OrdersList.tsx      # Liste commandes
│   │   └── OrderDetail.tsx     # Détail commande
│   ├── Testimonials/
│   │   ├── TestimonialsList.tsx # Liste témoignages
│   │   └── TestimonialForm.tsx  # Formulaire témoignage
│   ├── Settings/
│   │   ├── SocialSettings.tsx   # Paramètres réseaux sociaux
│   │   └── BannerSettings.tsx   # Paramètres bannière
│   └── Analytics.tsx            # Statistiques
├── hooks/admin/
│   ├── use-admin-products.ts
│   ├── use-admin-categories.ts
│   ├── use-admin-orders.ts
│   ├── use-admin-testimonials.ts
│   ├── use-admin-settings.ts
│   └── use-admin-analytics.ts
├── components/admin/
│   ├── Sidebar.tsx              # Sidebar navigation
│   ├── Header.tsx               # Header admin
│   └── ... (composants réutilisables)
└── data/
    └── mockAdminData.ts         # Données mockées pour développement
```

**Tous les hooks doivent être PRÊTS à consommer une API Laravel REST.**

---

## 🧩 FONCTIONNALITÉS À IMPLÉMENTER

### 1️⃣ Dashboard (`/admin/dashboard`)

**Cards statistiques :**
* Total commandes (nombre + variation %)
* Chiffre d'affaires (montant FCFA + variation %)
* Commandes en attente (nombre)
* Produits actifs (nombre)

**Graphiques (Recharts) :**
* Ventes par période (Line Chart - 30 derniers jours)
* Ventes par catégorie (Pie Chart)
* Top 5 produits (Bar Chart horizontal)

**Tableau :**
* 5 dernières commandes (ID, Client, Montant, Statut, Date)
* Lien "Voir toutes" vers `/admin/orders`

**UI :** Claire, lisible, moderne, responsive

---

### 2️⃣ Gestion des Produits (`/admin/products`)

#### Liste (`/admin/products`)

**Tableau avec colonnes :**
* Image (miniature 50x50px)
* Nom (lien vers édition)
* Catégorie (badge coloré)
* Prix (FCFA)
* Prix réduit (si réduction, sinon "-")
* Statut (badge "Actif" vert / "Inactif" gris)
* Actions (Modifier, Dupliquer, Supprimer)

**Filtres en haut :**
* Recherche par nom (input)
* Filtre par catégorie (select)
* Filtre par statut (select : Tous, Actifs, Inactifs)
* Bouton "Réinitialiser"

**Actions :**
* Bouton "+ Ajouter un produit" (en haut à droite)
* Pagination (20 produits par page)

#### Formulaire (`/admin/products/new` et `/admin/products/:id/edit`)

**Formulaire en 2 colonnes :**

**Colonne gauche :**
* Nom * (input, validation min 3 caractères)
* Description (textarea, max 1000 caractères)
* Catégorie * (select avec toutes les catégories)
* Prix * (input number, suffixe "FCFA", min 1)
* Réduction % (input number, 0-100)
  * Si rempli, afficher prix réduit calculé en dessous

**Colonne droite :**
* Image du produit
  * Zone drag & drop OU bouton "Choisir un fichier"
  * Aperçu de l'image
  * Option "Supprimer l'image"
  * Accepte : JPG, PNG, WebP (max 5MB)
* Statut (Toggle switch : Actif/Inactif)
* Boutons :
  * "Enregistrer" (primary, orange)
  * "Annuler" (secondary)
  * "Prévisualiser" (lien vers page produit publique)

**Validation UI :**
* Champs requis marqués *
* Messages d'erreur sous chaque champ
* Empêcher soumission si erreurs

⚠️ **Aucune validation métier côté front** (Laravel s'en charge)

#### Suppression

**Modal de confirmation :**
* Message : "Êtes-vous sûr de vouloir supprimer ce produit ?"
* Avertissement si produit dans des commandes
* Options :
  * "Supprimer définitivement"
  * "Désactiver seulement" (recommandé)
  * "Annuler"

---

### 3️⃣ Gestion des Catégories (`/admin/categories`)

#### Liste

**Tableau :**
* Nom
* Slug (gris, plus petit)
* Nombre de produits (badge)
* Actions (Modifier, Supprimer)

**Bouton :** "+ Ajouter une catégorie"

#### Formulaire (`/admin/categories/new` et `/admin/categories/:id/edit`)

**Champs :**
* Nom * (input, validation : unique, min 2 caractères)
* Slug (input, auto-généré depuis nom mais modifiable)
  * Validation : unique, format URL-friendly

**Boutons :** Enregistrer, Annuler

---

### 4️⃣ Gestion des Commandes (`/admin/orders`)

#### Liste

**Tableau avec colonnes :**
* ID (lien vers détails)
* Client (nom)
* Téléphone
* Produits (liste avec quantités, tooltip pour voir tout)
* Montant total (en gras, orange)
* Statut (badge coloré) :
  * En attente : jaune
  * En cours : bleu
  * Livrée : vert
  * Annulée : rouge
* Date (format : DD/MM/YYYY HH:mm)
* Actions (Voir détails, Modifier statut)

**Filtres :**
* Par statut (select)
* Par date (select : Aujourd'hui, Cette semaine, Ce mois, Personnalisé)
* Recherche (nom client ou téléphone)

**Tri :**
* Par date (plus récent en premier par défaut)
* Par montant
* Par statut

#### Détails (`/admin/orders/:id`)

**Section Informations client :**
* Nom
* Téléphone (lien cliquable pour appeler)
* Localisation
* Type de livraison
* Date de livraison prévue (si programmée)

**Section Produits commandés :**
* Tableau :
  * Image
  * Nom
  * Quantité
  * Prix unitaire
  * Total
* Total général en bas

**Section Actions :**
* Modifier le statut (select dropdown)
* Bouton "Imprimer" (UI only)
* Bouton "Exporter PDF" (UI only)
* Bouton "Envoyer SMS" (UI only, si intégration future)

---

### 5️⃣ Témoignages (`/admin/testimonials`)

#### Liste

**Tableau :**
* Nom
* Localisation
* Note (5 étoiles)
* Extrait texte (50 premiers caractères)
* Statut (Actif/Inactif)
* Actions (Modifier, Supprimer)

**Bouton :** "+ Ajouter un témoignage"

#### Formulaire (`/admin/testimonials/new` et `/admin/testimonials/:id/edit`)

**Champs :**
* Nom du client * (input)
* Localisation * (input)
* Note (1-5 étoiles, slider ou select)
* Texte du témoignage * (textarea)
* Initiales pour avatar (auto-généré depuis nom, modifiable)
* Statut (Toggle : Actif/Inactif)

---

### 6️⃣ Paramètres du site (`/admin/settings`)

#### Réseaux sociaux (`/admin/settings/social`)

**Formulaire :**
* Lien WhatsApp (input URL)
* Lien TikTok (input URL)
* Lien Facebook (input URL)
* Bouton "Tester les liens" (ouvre dans nouvel onglet)
* Bouton "Enregistrer"

**Note :** Ces liens sont utilisés dans la Navbar publique et les boutons de partage

#### Bannière publicitaire (`/admin/settings/banner`)

**Formulaire :**
* Texte principal (input, ex: "Jusqu'à 30% de réduction")
* Texte secondaire (input, ex: "Offre limitée")
* Pourcentage de réduction (input number, 0-100)
* Activer/Désactiver (toggle)
* Lien du bouton CTA (input URL)

**Prévisualisation :**
* Aperçu de la bannière telle qu'elle apparaîtra
* Fond orange, texte blanc
* Bouton blanc

---

### 7️⃣ Statistiques (`/admin/analytics`)

**Filtres en haut :**
* Période (select : 7 jours, 30 jours, 3 mois, 6 mois, 1 an, Personnalisé)
* Date de début / Date de fin (date pickers)

**Graphiques (Recharts) :**
* Évolution des ventes (Line Chart)
  * Ligne bleue
  * Points interactifs
* Ventes par catégorie (Pie Chart)
  * Couleurs distinctes
  * Légende avec pourcentages
* Top 10 produits (Bar Chart horizontal)
  * Nom du produit
  * Quantité vendue
* Commandes par statut (Donut Chart)
  * 4 segments colorés

**Export :**
* Bouton "Exporter en CSV" (UI only)
* Bouton "Exporter en PDF" (UI only)

---

## 🎨 DESIGN & UX

### Layout

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
* 🏠 Dashboard
* 📦 Produits
* 🏷️ Catégories
* 🛒 Commandes
* ⭐ Témoignages
* ⚙️ Paramètres
  * Réseaux sociaux
  * Bannière publicitaire
* 📊 Statistiques

**Couleurs :**
* Primary : Orange (#FF6B35 ou variable `primary` Tailwind)
* Sidebar : Gris foncé (#1F2937)
* Background : Blanc (#FFFFFF)
* Success : Vert (#10B981)
* Warning : Jaune (#F59E0B)
* Danger : Rouge (#EF4444)

**Responsive :**
* Sidebar collapsible sur mobile
* Tables scrollables horizontalement sur mobile
* Menu hamburger sur mobile

### Composants UI

**Utiliser les composants shadcn/ui existants :**
* `Button`
* `Input`
* `Select`
* `Table`
* `Dialog` (modals)
* `Toast` (notifications)
* `Card`
* `Badge`
* `Tabs`
* `Switch`

**Tous dans :** `client/src/components/ui/`

---

## 🔐 AUTH (FRONT READY UNIQUEMENT)

### Page Login (`/admin/login`)

**Formulaire simple :**
* Email (input type="email")
* Mot de passe (input type="password")
* Bouton "Se connecter"
* Option "Se souvenir de moi" (checkbox)

**Après connexion :**
* Rediriger vers `/admin/dashboard`
* Stocker un token dans localStorage (mock)
* Protection de toutes les routes `/admin/*`

⚠️ **Pas d'auth réelle** - juste la structure UI prête pour JWT/session Laravel

---

## 🧪 DONNÉES

### Données mockées

**Créer `client/src/data/mockAdminData.ts` avec :**

* Données pour le dashboard (métriques, graphiques)
* Données pour les commandes (liste de commandes)
* Données pour les témoignages
* Données pour les statistiques

**Utiliser les données existantes :**
* Produits : `mockProducts.ts`
* Catégories : `mockCategories` dans `mockProducts.ts`

### Simulation API

**Dans les hooks :**
* Simuler des appels API avec `setTimeout`
* Simuler loading states
* Simuler erreurs (optionnel)
* **AUCUNE règle métier inventée côté frontend**

**Exemple :**
```typescript
export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      // Simulation délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      // Retourner données mockées
      return mockProducts;
    },
  });
}
```

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

**Protection :** Vérifier si connecté, sinon rediriger vers `/admin/login`

---

## 🔄 HOOKS À CRÉER

### use-admin-products.ts

```typescript
// Fonctions à créer :
- useAdminProducts(filters) // Liste avec filtres
- useAdminProduct(id) // Détails
- useCreateProduct() // Créer (mutation)
- useUpdateProduct() // Modifier (mutation)
- useDeleteProduct() // Supprimer (mutation)
```

**Utiliser TanStack Query** comme dans `use-products.ts` existant.

**Pour l'instant :** Utiliser données mockées et simuler les appels API.

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

## ✅ FONCTIONNALITÉS IMPORTANTES

### Protection des routes
* Vérifier si utilisateur connecté (localStorage token)
* Rediriger vers `/admin/login` si non connecté
* Wrapper `ProtectedRoute` ou vérification dans `AdminLayout`

### Gestion des erreurs
* Afficher toasts pour les erreurs
* Messages d'erreur clairs
* Gestion des erreurs réseau
* Fallback UI si erreur

### Loading states
* Afficher spinners pendant chargements
* Skeleton loaders pour tableaux
* Disable boutons pendant soumission

### Confirmations
* Modals de confirmation avant suppressions
* Messages clairs ("Êtes-vous sûr ?")
* Options alternatives (désactiver au lieu de supprimer)

### Notifications
* Toasts de succès après actions
* Toasts d'erreur si problème
* Utiliser le composant `Toast` existant

---

## 🎯 PRIORITÉS

### Phase 1 (Essentiel)
1. ✅ AdminLayout avec Sidebar
2. ✅ Login (mock)
3. ✅ Dashboard avec métriques
4. ✅ ProductsList et ProductForm
5. ✅ CategoriesList et CategoryForm

### Phase 2 (Important)
6. ✅ OrdersList et OrderDetail
7. ✅ TestimonialsList et TestimonialForm
8. ✅ Settings (social + banner)

### Phase 3 (Bonus)
9. ✅ Analytics avec graphiques
10. ✅ Exports CSV/PDF (UI only)

---

## 📝 NOTES IMPORTANTES

1. **Utiliser les composants existants** : Tous les composants shadcn/ui sont déjà dans `client/src/components/ui/`

2. **Respecter le design** : Utiliser les mêmes couleurs, typographie que le site public

3. **Responsive** : Tout doit fonctionner sur mobile, tablette et desktop

4. **Données mockées** : Pour l'instant, utiliser des données mockées. Les appels API réels seront ajoutés plus tard quand le backend Laravel sera prêt.

5. **Code propre** :
   * Composants réutilisables
   * Hooks bien organisés
   * Types TypeScript corrects
   * Commentaires si nécessaire

6. **Animations** : Utiliser Framer Motion pour des transitions fluides (comme dans le site public)

7. **Pas de logique métier** : Le frontend ne fait QUE de l'affichage et de l'envoi de données. Laravel gère tout le reste.

---

## 🔍 RÉFÉRENCES

**Fichiers à examiner :**
* `shared/schema.ts` : Structure des données
* `shared/routes.ts` : Routes API définies
* `client/src/hooks/use-products.ts` : Exemple de hooks
* `client/src/data/mockProducts.ts` : Exemple de données
* `client/src/pages/Home.tsx` : Exemple de page
* `client/src/components/ProductCard.tsx` : Exemple de composant

**Documentation :**
* `DOCUMENTATION_ADMIN.md` : Documentation complète
* `SPECIFICATIONS_ADMIN.md` : Spécifications détaillées
* `PROMPT_BOLT_ADMIN.md` : Prompt détaillé

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
- [ ] Données mockées fonctionnelles
- [ ] Prêt pour intégration API Laravel

---

## 🧠 NOTE FINALE

**Le frontend est le visage.**
**Laravel est le cerveau.**
**Ne mélange jamais les deux.**

Le frontend admin doit être :
* ✅ **Moderne** et **professionnel**
* ✅ **Intuitif** et **facile à utiliser**
* ✅ **Rapide** et **fluide**
* ✅ **Responsive** et **accessible**
* ✅ **Prêt** pour l'intégration API Laravel

---

**IMPORTANT :** Créer tout le code en **français** (commentaires, messages, etc.). Le site est en français.

**Bonne chance ! 🚀**


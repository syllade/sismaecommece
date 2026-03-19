# 📚 Documentation - Interface d'Administration Fashop

## 🎯 Vue d'ensemble

Cette documentation décrit l'architecture et les fonctionnalités nécessaires pour créer une interface d'administration complète pour le site e-commerce **Fashop**. L'admin doit permettre de gérer tous les aspects du site depuis un seul endroit.

---

## 📋 Table des matières

1. [Architecture du projet](#architecture-du-projet)
2. [Structure des données](#structure-des-données)
3. [Fonctionnalités existantes](#fonctionnalités-existantes)
4. [Fonctionnalités Admin à implémenter](#fonctionnalités-admin-à-implémenter)
5. [API Endpoints nécessaires](#api-endpoints-nécessaires)
6. [Interface Admin - Spécifications](#interface-admin---spécifications)
7. [Guide d'implémentation](#guide-dimplémentation)

---

## 🏗️ Architecture du projet

### Structure des dossiers

```
Fashop-E-commerce/
├── client/                 # Frontend React + TypeScript
│   └── src/
│       ├── pages/         # Pages publiques (Home, Products, Cart, etc.)
│       ├── components/    # Composants réutilisables
│       ├── hooks/         # Hooks React (use-products, use-cart, etc.)
│       └── data/          # Données mockées (mockProducts.ts)
├── shared/                # Code partagé
│   ├── schema.ts         # Schémas de base de données (Drizzle ORM)
│   └── routes.ts         # Routes API
└── server/               # Backend (à créer pour Laravel)
```

### Technologies utilisées

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Routing**: Wouter
- **State Management**: Zustand (panier)
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: Radix UI (shadcn/ui)
- **Backend prévu**: Laravel (API REST)

---

## 💾 Structure des données

### Tables de base de données

#### 1. **Categories** (Catégories)
```typescript
{
  id: number (serial, primary key)
  name: string (ex: "Vêtements", "Chaussures")
  slug: string (unique, ex: "vetements")
}
```

#### 2. **Products** (Produits)
```typescript
{
  id: number (serial, primary key)
  categoryId: number (foreign key -> categories.id)
  name: string
  description: string (nullable)
  price: number (en FCFA, integer)
  image: string (nullable, URL ou chemin)
  isActive: boolean (default: true)
  discountPercentage: number (nullable, 0-100)
  createdAt: timestamp
}
```

#### 3. **Orders** (Commandes)
```typescript
{
  id: number (serial, primary key)
  customerName: string
  customerPhone: string
  customerLocation: string
  deliveryType: "immediate" | "programmed"
  deliveryDate: timestamp (nullable, si programmed)
  status: "pending" | "in_progress" | "delivered" | "cancelled"
  totalAmount: number (en FCFA)
  createdAt: timestamp
}
```

#### 4. **OrderItems** (Articles de commande)
```typescript
{
  id: number (serial, primary key)
  orderId: number (foreign key -> orders.id)
  productId: number (foreign key -> products.id)
  quantity: number
  price: number (prix au moment de la commande)
}
```

#### 5. **SiteSettings** (Paramètres du site)
```typescript
{
  id: number (serial, primary key)
  key: string (unique, ex: "whatsapp_link", "facebook_link", "tiktok_link")
  value: string (nullable)
  isActive: boolean (default: true)
}
```

---

## ✨ Fonctionnalités existantes

### Frontend (Client)

1. **Page d'accueil** (`/`)
   - Bannière publicitaire avec promotion
   - Affichage des produits en grille
   - Section témoignages défilants
   - Design responsive

2. **Page produits** (`/products`)
   - Liste de tous les produits
   - Filtrage par catégorie
   - Recherche par nom/description
   - Cartes produits avec images

3. **Page détail produit** (`/product/:id`)
   - Affichage détaillé du produit
   - Sélecteur de quantité
   - Bouton "Ajouter au panier"
   - Partage sur réseaux sociaux
   - Produits similaires

4. **Panier** (`/cart`)
   - Affichage des articles
   - Modification des quantités
   - Calcul du total
   - Suppression d'articles

5. **Checkout** (`/checkout`)
   - Formulaire de commande
   - Informations client
   - Type de livraison

6. **Contact** (`/contact`)
   - Informations de contact
   - Liens vers réseaux sociaux

### Fonctionnalités techniques

- **Gestion du panier**: Zustand store
- **Données mockées**: Fichier `mockProducts.ts` avec 10 produits
- **Partage social**: WhatsApp, Facebook, TikTok
- **Réductions**: Système de pourcentage de réduction
- **Responsive**: Mobile-first design

---

## 🎛️ Fonctionnalités Admin à implémenter

### 1. **Dashboard (Tableau de bord)**

**Page principale** (`/admin` ou `/admin/dashboard`)

**Métriques à afficher :**
- Nombre total de commandes
- Chiffre d'affaires (total, mensuel, hebdomadaire)
- Nombre de produits actifs/inactifs
- Commandes en attente
- Commandes en cours de traitement
- Commandes livrées
- Graphiques de ventes (par jour/semaine/mois)
- Top 5 produits les plus vendus
- Catégories les plus populaires

**Design :**
- Cards avec icônes
- Graphiques (Chart.js ou Recharts)
- Statistiques en temps réel

---

### 2. **Gestion des Produits** (`/admin/products`)

#### Liste des produits
- Tableau avec colonnes :
  - Image (miniature)
  - Nom
  - Catégorie
  - Prix
  - Prix réduit (si réduction)
  - Statut (Actif/Inactif)
  - Actions (Modifier, Supprimer, Dupliquer)

- Fonctionnalités :
  - Recherche par nom
  - Filtrage par catégorie
  - Filtrage par statut
  - Tri (prix, nom, date)
  - Pagination
  - Bouton "Ajouter un produit"

#### Création/Modification de produit
**Formulaire avec champs :**
- Nom du produit (requis)
- Description (textarea)
- Catégorie (select/dropdown)
- Prix (number, en FCFA)
- Image (upload ou URL)
- Réduction en % (0-100, optionnel)
- Statut (Actif/Inactif) - toggle

**Validation :**
- Nom requis (min 3 caractères)
- Prix requis (min 1 FCFA)
- Catégorie requise
- Réduction entre 0 et 100 si renseignée

**Actions :**
- Bouton "Enregistrer"
- Bouton "Annuler"
- Prévisualisation de l'image

#### Suppression de produit
- Confirmation avant suppression
- Vérifier si le produit est dans des commandes
- Option de désactiver au lieu de supprimer

---

### 3. **Gestion des Catégories** (`/admin/categories`)

#### Liste des catégories
- Tableau avec :
  - Nom
  - Slug
  - Nombre de produits
  - Actions (Modifier, Supprimer)

#### Création/Modification
**Formulaire :**
- Nom (requis, unique)
- Slug (auto-généré depuis le nom, modifiable)

**Validation :**
- Nom unique
- Slug unique et URL-friendly

---

### 4. **Gestion des Commandes** (`/admin/orders`)

#### Liste des commandes
- Tableau avec colonnes :
  - ID / Référence
  - Client (nom)
  - Téléphone
  - Produits (liste avec quantités)
  - Montant total
  - Statut (badge coloré)
  - Date de commande
  - Type de livraison
  - Actions (Voir détails, Modifier statut)

- Filtres :
  - Par statut (tous, pending, in_progress, delivered, cancelled)
  - Par date (aujourd'hui, cette semaine, ce mois)
  - Recherche par nom client ou téléphone

#### Détails d'une commande
**Affichage complet :**
- Informations client (nom, téléphone, localisation)
- Liste des produits commandés (nom, quantité, prix unitaire, total)
- Montant total de la commande
- Statut actuel
- Date de commande
- Type de livraison
- Date de livraison prévue (si programmée)

**Actions possibles :**
- Modifier le statut (dropdown)
- Imprimer la commande
- Exporter en PDF
- Envoyer un SMS/WhatsApp au client

#### Modification de statut
- Dropdown avec options :
  - En attente (pending)
  - En cours de traitement (in_progress)
  - Livrée (delivered)
  - Annulée (cancelled)

- Notification automatique au client lors du changement

---

### 5. **Gestion des Fournisseurs & Facturation** (`/admin/suppliers`, `/admin/invoices`)

#### Fournisseurs (Commission & Fréquence)
**Champs à gérer :**
- Commission (%) par fournisseur
- Fréquence de facturation (quotidienne / hebdomadaire)

**Actions :**
- Modifier les infos du fournisseur
- Définir le taux de commission
- Définir la périodicité de facturation

#### Factures
**Liste des factures :**
- Fournisseur
- Période couverte
- Montant total
- Commission
- Statut (en attente / payée / annulée)
- Téléchargement PDF (si disponible)

**Actions :**
- Filtrer par fournisseur / période / statut
- Marquer le statut (payée, annulée)

---

### 6. **Gestion des Réseaux Sociaux** (`/admin/settings/social`)

**Formulaire pour configurer :**
- Lien WhatsApp (ex: https://wa.me/237XXXXXXXXX)
- Lien TikTok (ex: https://www.tiktok.com/@fashop)
- Lien Facebook (ex: https://www.facebook.com/fashop)

**Affichage :**
- Champs texte pour chaque réseau
- Bouton "Tester le lien"
- Bouton "Enregistrer"

**Utilisation :**
- Ces liens sont utilisés dans la Navbar et les boutons de partage

---

### 7. **Gestion de la Bannière Publicitaire** (`/admin/settings/banner`)

**Configuration :**
- Texte principal (ex: "Jusqu'à 30% de réduction")
- Texte secondaire (ex: "Offre limitée")
- Pourcentage de réduction affiché
- Activer/Désactiver la bannière (toggle)
- Lien du bouton CTA

**Prévisualisation :**
- Aperçu de la bannière telle qu'elle apparaîtra sur le site

---

### 8. **Gestion des Témoignages** (`/admin/testimonials`)

#### Liste des témoignages
- Tableau avec :
  - Nom du client
  - Localisation
  - Note (étoiles)
  - Extrait du texte
  - Statut (Actif/Inactif)
  - Actions (Modifier, Supprimer)

#### Création/Modification
**Formulaire :**
- Nom du client (requis)
- Localisation (requis)
- Note (1-5 étoiles, slider ou select)
- Texte du témoignage (textarea, requis)
- Initiales pour l'avatar (2 lettres, auto-généré)
- Statut (Actif/Inactif)

---

### 9. **Statistiques et Rapports** (`/admin/analytics`)

**Graphiques à afficher :**
- Ventes par période (jour/semaine/mois)
- Ventes par catégorie (pie chart)
- Top 10 produits les plus vendus
- Évolution du chiffre d'affaires
- Nombre de commandes par statut

**Filtres :**
- Période (7 derniers jours, 30 derniers jours, 3 mois, 6 mois, 1 an)
- Date de début / Date de fin (date picker)

**Export :**
- Bouton "Exporter en CSV"
- Bouton "Exporter en PDF"

---

## 🔌 API Endpoints nécessaires

### Produits

```
GET    /api/products              # Liste tous les produits
GET    /api/products/:id          # Détails d'un produit
POST   /api/products              # Créer un produit
PUT    /api/products/:id         # Modifier un produit
DELETE /api/products/:id         # Supprimer un produit
```

**Body pour POST/PUT :**
```json
{
  "name": "Nom du produit",
  "description": "Description",
  "categoryId": 1,
  "price": 25000,
  "image": "https://...",
  "discountPercentage": 15,
  "isActive": true
}
```

### Catégories

```
GET    /api/categories            # Liste toutes les catégories
GET    /api/categories/:id        # Détails d'une catégorie
POST   /api/categories            # Créer une catégorie
PUT    /api/categories/:id       # Modifier une catégorie
DELETE /api/categories/:id       # Supprimer une catégorie
```

**Body pour POST/PUT :**
```json
{
  "name": "Vêtements",
  "slug": "vetements"
}
```

### Commandes

```
GET    /api/orders                # Liste toutes les commandes
GET    /api/orders/:id            # Détails d'une commande
PUT    /api/orders/:id/status     # Modifier le statut
GET    /api/orders/stats          # Statistiques des commandes
```

**Body pour PUT status :**
```json
{
  "status": "in_progress"
}
```

### Fournisseurs

```
GET    /api/admin/suppliers              # Liste fournisseurs
POST   /api/admin/suppliers              # Créer fournisseur
PUT    /api/admin/suppliers/:id          # Modifier fournisseur
DELETE /api/admin/suppliers/:id          # Supprimer fournisseur
```

**Body (exemple) :**
```json
{
  "name": "Fournisseur A",
  "phone": "0700000000",
  "email": "fournisseur@mail.com",
  "commission_rate": 12.5,
  "invoice_frequency": "weekly",
  "is_active": true
}
```

### Factures

```
GET    /api/admin/invoices               # Liste factures
GET    /api/admin/invoices/:id           # Détails facture
PUT    /api/admin/invoices/:id/status    # Modifier statut
```

### Paramètres du site

```
GET    /api/settings              # Récupérer tous les paramètres
PUT    /api/settings              # Mettre à jour les paramètres
GET    /api/settings/:key         # Récupérer un paramètre spécifique
```

**Body pour PUT :**
```json
{
  "whatsapp_link": "https://wa.me/237XXXXXXXXX",
  "facebook_link": "https://www.facebook.com/fashop",
  "tiktok_link": "https://www.tiktok.com/@fashop",
  "banner_text": "Jusqu'à 30% de réduction",
  "banner_subtext": "Offre limitée",
  "banner_discount": 30,
  "banner_active": true
}
```

### Témoignages

```
GET    /api/testimonials          # Liste tous les témoignages
POST   /api/testimonials          # Créer un témoignage
PUT    /api/testimonials/:id     # Modifier un témoignage
DELETE /api/testimonials/:id     # Supprimer un témoignage
```

**Body pour POST/PUT :**
```json
{
  "name": "Marie Kouassi",
  "location": "Abidjan",
  "rating": 5,
  "text": "Excellent service !",
  "isActive": true
}
```

### Statistiques

```
GET    /api/analytics/dashboard   # Données du dashboard
GET    /api/analytics/sales       # Données de ventes (avec filtres)
GET    /api/analytics/products    # Top produits
```

---

## 🎨 Interface Admin - Spécifications

### Layout général

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

### Design System

**Couleurs :**
- Primary: Orange (#FF6B35 ou similaire)
- Success: Vert
- Warning: Jaune
- Danger: Rouge
- Background: Blanc/Gris clair

**Composants UI :**
- Utiliser les composants shadcn/ui existants
- Tables avec pagination
- Formulaires avec validation
- Modals pour confirmations
- Toasts pour notifications

### Responsive

- Sidebar collapsible sur mobile
- Tables scrollables horizontalement sur mobile
- Formulaires adaptés mobile

---

## 🚀 Guide d'implémentation

### Étape 1 : Créer les routes Admin

Dans `client/src/App.tsx`, ajouter :
```typescript
<Route path="/admin/*" component={AdminLayout} />
```

### Étape 2 : Créer le layout Admin

Créer `client/src/pages/admin/AdminLayout.tsx` :
- Sidebar avec navigation
- Header avec logo et menu utilisateur
- Zone de contenu pour les pages

### Étape 3 : Créer les pages Admin

Pour chaque section :
1. Page de liste (tableau)
2. Page de création/édition (formulaire)
3. Hooks pour les appels API

### Étape 4 : Créer les hooks Admin

Créer dans `client/src/hooks/` :
- `use-admin-products.ts`
- `use-admin-categories.ts`
- `use-admin-orders.ts`
- `use-admin-settings.ts`
- `use-admin-testimonials.ts`
- `use-admin-analytics.ts`

### Étape 5 : Backend Laravel

**Créer les contrôleurs :**
- `ProductController`
- `CategoryController`
- `OrderController`
- `SettingController`
- `TestimonialController`
- `AnalyticsController`

**Créer les modèles :**
- `Product`
- `Category`
- `Order`
- `OrderItem`
- `Setting`
- `Testimonial`

**Créer les migrations :**
- Vérifier que toutes les tables correspondent au schema.ts

**Créer les routes API :**
- Dans `routes/api.php`
- Protéger avec middleware d'authentification

### Étape 6 : Authentification Admin

**Options :**
- Système de login simple (email/password)
- JWT tokens
- Sessions Laravel

**Pages nécessaires :**
- `/admin/login`
- Protection des routes admin

---

## 📝 Notes importantes

1. **Sécurité :**
   - Toutes les routes admin doivent être protégées
   - Validation côté serveur obligatoire
   - Sanitization des inputs

2. **Performance :**
   - Pagination pour les listes longues
   - Lazy loading des images
   - Cache des données fréquemment utilisées

3. **UX :**
   - Confirmations avant suppressions
   - Messages de succès/erreur
   - Loading states
   - Optimistic updates quand possible

4. **Données mockées actuelles :**
   - Les données sont dans `client/src/data/mockProducts.ts`
   - À remplacer par les appels API Laravel

---

## 🎯 Checklist d'implémentation

### Backend Laravel
- [ ] Créer les migrations
- [ ] Créer les modèles
- [ ] Créer les contrôleurs
- [ ] Créer les routes API
- [ ] Implémenter l'authentification
- [ ] Ajouter la validation
- [ ] Tester tous les endpoints
- [ ] Gestion fournisseurs (commission + fréquence)
- [ ] Gestion factures (CRUD + PDF)

### Frontend Admin
- [ ] Créer le layout Admin
- [ ] Créer la sidebar
- [ ] Créer la page Dashboard
- [ ] Créer la gestion des produits
- [ ] Créer la gestion des catégories
- [ ] Créer la gestion des commandes
- [ ] Créer la gestion des fournisseurs (commission / fréquence)
- [ ] Créer la gestion des factures (liste / statut / PDF)
- [ ] Créer la gestion des témoignages
- [ ] Créer les paramètres
- [ ] Créer les statistiques
- [ ] Ajouter l'authentification
- [ ] Tester toutes les fonctionnalités

---

## 📞 Support

Pour toute question ou clarification, référez-vous à :
- Le code source dans `client/src/`
- Le schéma de données dans `shared/schema.ts`
- Les hooks existants dans `client/src/hooks/`

---

**Version :** 1.0  
**Date :** Décembre 2024  
**Auteur :** Documentation Fashop Admin


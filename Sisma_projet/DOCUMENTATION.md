# 📚 Documentation Complète - Fashop E-commerce

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Fonctionnalités Utilisateur (Client)](#fonctionnalités-utilisateur-client)
3. [Fonctionnalités Administrateur](#fonctionnalités-administrateur)
4. [API REST - Routes](#api-rest---routes)
5. [Architecture Technique](#architecture-technique)
6. [Guide d'Utilisation](#guide-dutilisation)

---

## Vue d'ensemble

**Fashop** est une plateforme e-commerce complète développée avec :
- **Backend** : Laravel 5.2 (API REST)
- **Frontend Client** : React + TypeScript + Vite + shadcn/ui
- **Frontend Admin** : React + TypeScript + Vite + shadcn/ui
- **Base de données** : MySQL/PostgreSQL

---

## Fonctionnalités Utilisateur (Client)

### 🏠 Page d'Accueil (`/`)

**Description** : Page principale du site avec promotions et produits vedettes.

**Fonctionnalités** :
- **Slider de Promotions Flash** : 
  - Affichage horizontal des produits en promotion
  - Compteur temps limité (HH:MM:SS)
  - Navigation par flèches gauche/droite
  - Indicateurs de pagination
  - Image background lifestyle avec overlay
  - Badge de réduction animé
  - Prix réduit et économies affichés
  - Bouton "Voir l'offre" avec lien vers le détail

- **Section Produits Vedettes** :
  - Grille 2 colonnes mobile, 4 colonnes desktop
  - Produits marqués comme "featured" ou "is_featured"
  - Cards compactes avec animations
  - Affichage des prix et réductions

- **Section Tous nos Produits** :
  - Grille de 8 produits maximum
  - Cards compactes responsive
  - Bouton "Voir tous les produits" si plus de 8 produits
  - Animations d'apparition progressives

- **Section Témoignages Clients** :
  - Carrousel automatique (changement toutes les 5 secondes)
  - Affichage des notes avec étoiles
  - Informations client (nom, localisation, avatar)
  - Indicateurs de pagination
  - Navigation manuelle possible

**Composants utilisés** :
- `PromoSlider` : Slider horizontal des promotions
- `ProductCardCompact` : Card produit compacte
- `useProducts` : Hook pour récupérer les produits
- `useTestimonials` : Hook pour récupérer les témoignages

---

### 🛍️ Page Boutique (`/products`)

**Description** : Catalogue complet des produits avec recherche et filtres.

**Fonctionnalités** :
- **Barre de recherche** :
  - Recherche en temps réel
  - Icône de recherche
  - Placeholder "Rechercher un produit..."
  - Scroll automatique vers le haut lors de la recherche

- **Filtres par catégorie** :
  - Bouton "Tout" pour afficher tous les produits
  - Boutons de catégories scrollables horizontalement sur mobile
  - Badge actif avec couleur orange
  - Scroll automatique vers le haut lors du changement de catégorie

- **Grille de produits** :
  - 2 colonnes sur mobile
  - 3 colonnes sur tablette
  - 4 colonnes sur desktop
  - Espacement adaptatif (gap-2 mobile, gap-4 desktop)
  - Animations d'apparition

- **État vide** :
  - Message clair si aucun résultat
  - Bouton pour réinitialiser les filtres
  - Design centré et informatif

**Composants utilisés** :
- `ProductCardCompact` : Card produit compacte
- `useProducts(search, category)` : Hook avec recherche et filtre
- `useCategories` : Hook pour récupérer les catégories

---

### 📦 Page Détail Produit (`/product/:id`)

**Description** : Page de détail d'un produit avec toutes les informations.

**Fonctionnalités** :
- **Images du produit** :
  - Support de plusieurs images avec slider
  - Navigation par flèches si plusieurs images
  - Indicateurs de pagination
  - Badge de réduction en haut à droite
  - Badge catégorie en haut à gauche
  - Zoom au survol

- **Informations produit** :
  - Nom du produit (titre principal)
  - Prix avec réduction affichée
  - Prix barré si réduction
  - Badge de pourcentage de réduction
  - Note avec étoiles (4.8/5)
  - Description complète

- **Sélecteur de quantité** :
  - Boutons + et - pour ajuster
  - Affichage de la quantité sélectionnée
  - Minimum : 1

- **Actions** :
  - Bouton "Ajouter au panier" (gradient orange)
  - Bouton "Partager" avec menu déroulant :
    - WhatsApp
    - Facebook
    - TikTok (copie le lien)
  - Bouton "Favoris" (cœur)

- **Caractéristiques** :
  - Produit authentique et de qualité
  - Retours gratuits sous 14 jours
  - Garantie qualité premium
  - Livraison rapide et sécurisée

- **Trust Badges** :
  - Livraison Rapide (partout en Côte d'Ivoire)
  - Paiement Sécurisé (à la livraison)

- **Produits similaires** :
  - Grille 2 colonnes mobile, 4 desktop
  - Produits de la même catégorie
  - Cards compactes

**Comportement** :
- Scroll automatique vers le haut lors de l'ouverture
- Support des images multiples avec slider
- Navigation fluide

**Composants utilisés** :
- `ProductImageSlider` : Slider d'images
- `ProductCardCompact` : Pour les produits similaires
- `useProduct(slug)` : Hook pour récupérer un produit
- `useCart` : Hook pour gérer le panier

---

### 🛒 Page Panier (`/cart`)

**Description** : Page de gestion du panier d'achat.

**Fonctionnalités** :
- **Liste des articles** :
  - Image du produit (64x64px)
  - Nom du produit
  - Prix unitaire
  - Contrôles de quantité (+ et -)
  - Bouton de suppression (icône poubelle)
  - Design compact et responsive

- **Récapitulatif** :
  - Sous-total (somme des articles)
  - Frais de livraison (calculé après)
  - Total général
  - Bouton "Commander" pour passer à la commande
  - Message "Paiement à la livraison disponible"

- **État vide** :
  - Message "Votre panier est vide"
  - Bouton "Commencer mes achats"
  - Design centré et accueillant

- **Comportement mobile** :
  - Récapitulatif sticky en bas sur mobile
  - Design optimisé pour petits écrans

**Composants utilisés** :
- `useCart` : Hook Zustand pour gérer le panier
- `FloatingCart` : Icône flottante du panier (visible si articles)

---

### 💳 Page Checkout (`/checkout`)

**Description** : Formulaire de commande avec informations client et livraison.

**Fonctionnalités** :
- **Informations client** :
  - Nom complet (requis)
  - Téléphone (requis, minimum 10 caractères)
  - Email (optionnel)

- **Adresse de livraison** :
  - Sélection de la commune (Abidjan) - requis
  - Sélection du quartier - optionnel
  - Repère/Landmark - optionnel
  - Construction automatique de `customer_location`

- **Type de livraison** :
  - Immédiate (livraison rapide)
  - Programmée (avec sélection de date)
  - Date de livraison requise si programmée

- **Calcul automatique** :
  - Frais de livraison calculés selon la commune
  - Sous-total des produits
  - Total général (sous-total + frais)

- **Récapitulatif** :
  - Liste des produits avec quantités
  - Prix unitaire et total par produit
  - Frais de livraison
  - Total final

- **Validation** :
  - Validation Zod côté client
  - Messages d'erreur clairs
  - Soumission vers API Laravel

**Données géographiques** :
- Liste complète des communes d'Abidjan
- Quartiers par commune
- Calcul automatique des frais de livraison

**Composants utilisés** :
- `useCart` : Pour récupérer les articles
- `useCreateOrder` : Hook pour créer la commande
- `abidjanLocations` : Données géographiques
- `useDeliveryFee` : Calcul des frais

---

### 📱 Composant Panier Flottant (`FloatingCart`)

**Description** : Icône de panier flottante visible en bas à droite.

**Fonctionnalités** :
- **Affichage conditionnel** : Visible uniquement si le panier contient des articles
- **Badge de quantité** : Affiche le nombre d'articles (max 9+)
- **Tooltip de prix** : Affiche le total au survol (3 secondes)
- **Animation** : Apparition avec scale animation
- **Lien** : Clique vers `/cart`
- **Position** : Fixe en bas à droite (z-50)

---

## Fonctionnalités Administrateur

### 🔐 Connexion Admin (`/login`)

**Description** : Page de connexion à l'interface d'administration.

**Fonctionnalités** :
- Formulaire de connexion (email/password)
- Authentification via API Laravel
- Stockage du token dans localStorage
- Redirection vers `/admin/dashboard` après connexion
- Protection des routes admin

---

### 📊 Dashboard (`/admin/dashboard`)

**Description** : Tableau de bord principal avec statistiques et graphiques.

**Fonctionnalités** :

#### Cards Statistiques
- **Total Commandes** : Nombre total avec variation mensuelle
- **Chiffre d'Affaires** : Revenus totaux avec variation mensuelle
- **Produits Actifs** : Nombre de produits actifs
- **Commandes en Attente** : Commandes non traitées

#### Graphiques
- **Vue d'ensemble des ventes** : Graphique en aires (AreaChart) sur 30 jours
- **Top Catégories** : Graphique en barres des catégories les plus vendues
- **Performance des Livreurs** :
  - Graphique en barres avec données réelles
  - Tableau détaillé avec :
    - Nom et téléphone du livreur
    - Total commandes
    - Commandes livrées
    - Commandes en cours
    - Revenus générés
    - Badges de statut colorés

**Données réelles** : Toutes les statistiques proviennent de l'API Laravel

**Composants utilisés** :
- `useDashboardStats` : Statistiques générales
- `useSalesStats` : Données de ventes
- `useCategorySales` : Ventes par catégorie
- `useDeliveryPersonsStats` : Statistiques livreurs
- Recharts pour les graphiques

---

### 📦 Gestion des Produits (`/admin/products`)

**Description** : Interface complète de gestion des produits.

**Fonctionnalités** :

#### Tableau des Produits
- **Colonnes** :
  - Image du produit
  - Nom et description
  - Catégorie (badge)
  - Prix (FCFA)
  - Réduction (%)
  - Statut (Actif/Inactif)
  - Actions (Éditer, Supprimer)

- **Recherche** : Recherche par nom ou catégorie
- **Filtres** : Bouton filtre (à venir)

#### Formulaire Création/Édition
- **Champs** :
  - Nom du produit (requis)
  - Description
  - Catégorie (sélection)
  - Prix en FCFA (requis)
  - Images multiples (URLs) :
    - Ajout de plusieurs images
    - Aperçu de chaque image
    - Suppression individuelle
    - Première image utilisée comme image principale
  - Réduction (%)
  - Toggle Actif/Inactif
  - Toggle Produit en promotion (isPromo)

- **Validation** :
  - Validation Zod côté client
  - Messages d'erreur clairs
  - Soumission vers API Laravel

#### Actions
- **Créer** : Bouton "Add Product"
- **Éditer** : Clic sur l'icône crayon
- **Supprimer** : Confirmation avant suppression

**Composants utilisés** :
- `useProducts` : Liste des produits
- `useCreateProduct` : Création
- `useUpdateProduct` : Mise à jour
- `useDeleteProduct` : Suppression
- `useCategories` : Liste des catégories

---

### 🏷️ Gestion des Catégories (`/admin/categories`)

**Description** : Interface de gestion des catégories de produits.

**Fonctionnalités** :

#### Tableau des Catégories
- **Colonnes** :
  - Nom
  - Slug (généré automatiquement)
  - Nombre de produits
  - Actions (Éditer, Supprimer)

#### Formulaire Création/Édition
- **Champs** :
  - Nom (requis, unique)
  - Slug généré automatiquement depuis le nom

#### Actions
- **Créer** : Bouton "Add Category"
- **Éditer** : Modification du nom
- **Supprimer** : Confirmation avant suppression

**Composants utilisés** :
- `useCategories` : Liste des catégories
- `useCreateCategory` : Création
- `useUpdateCategory` : Mise à jour
- `useDeleteCategory` : Suppression

---

### 🛒 Gestion des Commandes (`/admin/orders`)

**Description** : Interface complète de gestion des commandes.

**Fonctionnalités** :

#### Tableau des Commandes
- **Colonnes** :
  - ID
  - Client (nom)
  - Téléphone
  - Lieu de livraison
  - Date commande
  - Date livraison (si programmée)
  - Nombre de produits (badge circulaire)
  - Montant total
  - Statut (badge coloré)
  - Livreur assigné
  - Actions

- **Tri** :
  - Par date de livraison (si programmée)
  - Par lieu de livraison
  - Par date de commande

- **Filtres** :
  - Recherche par nom, téléphone, lieu
  - Filtre par statut

#### Section "Nouvelles Commandes du Jour"
- Affichage des commandes créées aujourd'hui
- Mise en évidence visuelle

#### Détail d'une Commande
- **Informations client** :
  - Nom, téléphone, email
  - Adresse complète de livraison
  - Commune et quartier

- **Produits à livrer** :
  - Liste complète des produits
  - Image de chaque produit
  - Nom, quantité, prix unitaire
  - Prix total par produit
  - Lien vers le produit
  - Disponibilité et stock

- **Informations de livraison** :
  - Type de livraison (immédiate/programmée)
  - Date de livraison
  - Frais de livraison
  - Livreur assigné (si assigné)

- **Actions** :
  - Changement de statut (dropdown)
  - Assignation d'un livreur
  - Envoi WhatsApp au client
  - Suppression (si nécessaire)

#### Assignation de Livreur
- Sélection dans une liste déroulante
- Options d'envoi :
  - Envoyer WhatsApp au livreur
  - Envoyer Email au livreur
- Confirmation et mise à jour automatique

**Composants utilisés** :
- `useOrders` : Liste des commandes
- `useOrder(id)` : Détail d'une commande
- `useUpdateOrderStatus` : Changement de statut
- `useAssignDeliveryPerson` : Assignation livreur
- `useDeliveryPersons` : Liste des livreurs

---

### 📈 Classement des Commandes (`/admin/orders-ranking`)

**Description** : Page de classement et export des commandes par statut.

**Fonctionnalités** :

#### Filtres par Statut
- **Cards de statut** :
  - Toutes
  - Livrées (completed)
  - En cours (processing)
  - Annulées (cancelled)
  - En attente (pending)
- Clic sur une card pour filtrer
- Compteur par statut

#### Tableau Détaillé
- **Colonnes** :
  - Rang (#)
  - ID commande
  - Client (nom)
  - Téléphone
  - Lieu de livraison
  - Date commande
  - Date livraison
  - Livreur (nom et téléphone)
  - Nombre de produits (badge)
  - Montant total
  - Statut (badge coloré)

- **Tri** :
  - Par statut (livrées en premier)
  - Par date de livraison
  - Par date de commande

#### Export Excel
- Bouton "Exporter en Excel"
- Export de toutes les données filtrées
- Nom de fichier : `Commandes_{statut}_{date}.xlsx`
- Colonnes exportées :
  - ID, Client, Téléphone, Lieu, Dates, Livreur, Produits, Montant, Statut

**Composants utilisés** :
- `useOrders` : Liste des commandes
- `xlsx` : Bibliothèque d'export Excel

---

### ➕ Créer une Commande (`/admin/create-order`)

**Description** : Formulaire pour créer manuellement une commande depuis l'admin.

**Fonctionnalités** :

#### Informations Client
- Nom du client (requis)
- Téléphone (requis, min 10 caractères)
- Commune (sélection, requis)
- Quartier (sélection, optionnel)
- Repère (optionnel)
- Notes (optionnel)

#### Type de Livraison
- Immédiate
- Programmée (avec sélection de date)

#### Sélection de Produits
- **Dialog de sélection** :
  - Grille de tous les produits actifs
  - Image, nom, prix de chaque produit
  - Badge "Ajouté" si déjà dans la commande
  - Bouton "Ajouter" pour chaque produit

- **Liste des produits ajoutés** :
  - Image, nom, prix
  - Contrôle de quantité
  - Prix total par produit
  - Bouton de suppression

#### Récapitulatif
- Frais de livraison (calculés automatiquement)
- Total général

#### Validation
- Validation Zod complète
- Soumission vers API Laravel
- Message de succès/erreur

**Composants utilisés** :
- `useProducts` : Liste des produits
- `useCreateOrder` : Création de commande
- `abidjanLocations` : Données géographiques
- `useDeliveryFee` : Calcul des frais

---

### 🚚 Gestion des Livreurs (`/admin/delivery-persons`)

**Description** : Interface de gestion des livreurs.

**Fonctionnalités** :

#### Tableau des Livreurs
- **Colonnes** :
  - Nom
  - Téléphone
  - Email
  - Type de véhicule
  - Statut (Actif/Inactif)
  - Actions (Éditer, Supprimer)

#### Formulaire Création/Édition
- **Champs** :
  - Nom (requis)
  - Téléphone (requis)
  - Email (optionnel)
  - Type de véhicule (optionnel)
  - Statut actif/inactif

#### Actions
- **Créer** : Bouton "Ajouter un livreur"
- **Éditer** : Modification des informations
- **Supprimer** : Confirmation avant suppression

**Composants utilisés** :
- `useDeliveryPersons` : Liste des livreurs
- `useCreateDeliveryPerson` : Création
- `useUpdateDeliveryPerson` : Mise à jour
- `useDeleteDeliveryPerson` : Suppression

---

### 💬 Gestion des Témoignages (`/admin/testimonials`)

**Description** : Interface de gestion des témoignages clients.

**Fonctionnalités** :

#### Tableau des Témoignages
- **Colonnes** :
  - Client (nom)
  - Localisation
  - Note (étoiles)
  - Contenu (aperçu)
  - Statut (Actif/Inactif)
  - Actions (Éditer, Supprimer)

#### Formulaire Création/Édition
- **Champs** :
  - Nom du client (requis)
  - Localisation (requis)
  - Note (1-5 étoiles, requis)
  - Contenu/Texte (requis)
  - Statut actif/inactif

#### Actions
- **Créer** : Bouton "Ajouter un témoignage"
- **Éditer** : Modification
- **Supprimer** : Confirmation

**Composants utilisés** :
- `useTestimonials` : Liste des témoignages
- `useCreateTestimonial` : Création
- `useUpdateTestimonial` : Mise à jour
- `useDeleteTestimonial` : Suppression

---

### 📊 Analytics (`/admin/analytics`)

**Description** : Page d'analyses approfondies avec graphiques.

**Fonctionnalités** :

#### Graphiques
- **Performance des Ventes** :
  - Graphique en aires (AreaChart)
  - Données sur 30 derniers jours
  - Revenus par jour
  - Gradient orange

- **Répartition des Commandes par Statut** :
  - Graphique en camembert (PieChart)
  - Pourcentage par statut
  - Légende colorée
  - Tooltip avec nombre de commandes

- **Top 5 Produits Vendus** :
  - Graphique en barres (BarChart)
  - Nombre d'unités vendues
  - Axe X avec noms de produits (angle -45°)

**Données réelles** : Tous les graphiques utilisent des données réelles de l'API

**Composants utilisés** :
- `useSalesStats` : Données de ventes
- `useOrdersByStatus` : Commandes par statut
- `useTopProducts` : Top produits
- Recharts pour visualisation

---

### ⚙️ Paramètres (`/admin/settings`)

**Description** : Page de configuration du site.

**Fonctionnalités** :

#### Réseaux Sociaux
- **Champs** :
  - WhatsApp (URL)
  - Facebook (URL)
  - TikTok (URL)
- Bouton "Tester le lien" pour chaque réseau

#### Bannière Publicitaire
- **Champs** :
  - Texte principal
  - Texte secondaire
  - Pourcentage de réduction
  - Toggle actif/inactif
- Aperçu visuel de la bannière

**Composants utilisés** :
- `useSettings` : Récupération des paramètres
- `useUpdateSettings` : Mise à jour

---

## API REST - Routes

### 🔓 Routes Publiques (sans authentification)

#### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription

#### Produits
- `GET /api/products` - Liste des produits (public)
- `GET /api/products/{slug}` - Détail d'un produit

#### Catégories
- `GET /api/categories` - Liste des catégories

#### Témoignages
- `GET /api/testimonials` - Liste des témoignages actifs

#### Paramètres
- `GET /api/settings` - Paramètres du site
- `GET /api/settings/{key}` - Paramètre spécifique

#### Frais de Livraison
- `GET /api/delivery-fees/calculate?commune={commune}` - Calcul des frais

#### Commandes
- `POST /api/orders` - Création d'une commande (public)

---

### 🔒 Routes Protégées (authentification requise)

#### Authentification Utilisateur
- `GET /api/auth/me` - Informations utilisateur connecté
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/refresh` - Rafraîchir le token

---

### 👑 Routes Admin (rôle admin requis)

#### Analytics
- `GET /api/admin/analytics/dashboard` - Statistiques dashboard
- `GET /api/admin/analytics/sales` - Données de ventes
- `GET /api/admin/analytics/category-sales` - Ventes par catégorie
- `GET /api/admin/analytics/top-products` - Top produits
- `GET /api/admin/analytics/orders-by-status` - Commandes par statut
- `GET /api/admin/analytics/delivery-persons` - Statistiques livreurs

#### Produits (Admin)
- `GET /api/admin/products` - Liste des produits (admin)
- `POST /api/admin/products` - Créer un produit
- `GET /api/admin/products/{product}` - Détail d'un produit
- `PUT /api/admin/products/{product}` - Modifier un produit
- `DELETE /api/admin/products/{product}` - Supprimer un produit
- `POST /api/admin/products/{product}/duplicate` - Dupliquer un produit

#### Catégories (Admin)
- `GET /api/admin/categories` - Liste des catégories (admin)
- `POST /api/admin/categories` - Créer une catégorie
- `PUT /api/admin/categories/{category}` - Modifier une catégorie
- `DELETE /api/admin/categories/{category}` - Supprimer une catégorie

#### Commandes (Admin)
- `GET /api/admin/orders` - Liste des commandes
- `GET /api/admin/orders/{order}` - Détail d'une commande
- `PUT /api/admin/orders/{order}/status` - Changer le statut
- `POST /api/admin/orders/{order}/whatsapp` - Envoyer WhatsApp au client
- `POST /api/admin/orders/{order}/assign-delivery-person` - Assigner un livreur
- `POST /api/admin/orders/{order}/send-to-delivery-person` - Envoyer détails au livreur
- `DELETE /api/admin/orders/{order}` - Supprimer une commande

#### Livreurs (Admin)
- `GET /api/admin/delivery-persons` - Liste des livreurs
- `POST /api/admin/delivery-persons` - Créer un livreur
- `PUT /api/admin/delivery-persons/{id}` - Modifier un livreur
- `DELETE /api/admin/delivery-persons/{id}` - Supprimer un livreur

#### Frais de Livraison (Admin)
- `GET /api/admin/delivery-fees` - Liste des frais
- `POST /api/admin/delivery-fees` - Créer/modifier des frais

#### Témoignages (Admin)
- `GET /api/admin/testimonials` - Liste des témoignages (admin)
- `POST /api/admin/testimonials` - Créer un témoignage
- `PUT /api/admin/testimonials/{testimonial}` - Modifier un témoignage
- `DELETE /api/admin/testimonials/{testimonial}` - Supprimer un témoignage

#### Paramètres (Admin)
- `PUT /api/admin/settings` - Mettre à jour les paramètres
- `PUT /api/admin/settings/bulk` - Mise à jour en masse

---

## Architecture Technique

### 📁 Structure du Projet

```
Fashop-E-commerce/
├── fashop-backend/          # Backend Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   │   ├── ProductController.php
│   │   │   ├── CategoryController.php
│   │   │   ├── OrderController.php
│   │   │   ├── TestimonialController.php
│   │   │   ├── DeliveryPersonController.php
│   │   │   ├── DeliveryFeeController.php
│   │   │   └── AnalyticsController.php
│   │   ├── Models/
│   │   └── Http/Middleware/
│   ├── routes/
│   │   └── api.php
│   └── database/migrations/
│
├── client/                   # Frontend Client (React)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── Cart.tsx
│   │   │   └── Checkout.tsx
│   │   ├── components/
│   │   │   ├── ProductCardCompact.tsx
│   │   │   ├── PromoSlider.tsx
│   │   │   ├── FloatingCart.tsx
│   │   │   └── Navbar.tsx
│   │   └── hooks/
│   │       ├── use-products.ts
│   │       ├── use-cart.ts
│   │       └── use-orders.ts
│
└── admin/                    # Frontend Admin (React)
    └── client/
        ├── src/
        │   ├── pages/
        │   │   ├── dashboard.tsx
        │   │   ├── products.tsx
        │   │   ├── orders.tsx
        │   │   ├── orders-ranking.tsx
        │   │   ├── create-order.tsx
        │   │   └── ...
        │   ├── hooks/
        │   │   ├── use-products.ts
        │   │   ├── use-orders.ts
        │   │   └── use-stats.ts
        │   └── components/
```

---

### 🛠️ Technologies Utilisées

#### Backend
- **Laravel 5.2** : Framework PHP
- **MySQL/PostgreSQL** : Base de données
- **Eloquent ORM** : Gestion des modèles
- **Middleware** : Authentification, CORS, Admin

#### Frontend Client
- **React 18** : Bibliothèque UI
- **TypeScript** : Typage statique
- **Vite** : Build tool
- **shadcn/ui** : Composants UI
- **Framer Motion** : Animations
- **Zustand** : Gestion d'état (panier)
- **React Query** : Gestion des données API
- **Wouter** : Routing
- **Zod** : Validation de schémas
- **date-fns** : Manipulation de dates
- **xlsx** : Export Excel

#### Frontend Admin
- **React 18** : Bibliothèque UI
- **TypeScript** : Typage statique
- **Vite** : Build tool
- **shadcn/ui** : Composants UI
- **Framer Motion** : Animations
- **React Query** : Gestion des données API
- **Recharts** : Graphiques
- **Wouter** : Routing
- **Zod** : Validation de schémas
- **date-fns** : Manipulation de dates
- **xlsx** : Export Excel

---

## Guide d'Utilisation

### 👤 Pour les Utilisateurs (Clients)

#### 1. Parcourir les Produits
1. Accédez à la page d'accueil (`/`)
2. Consultez les promotions flash dans le slider
3. Découvrez les produits vedettes
4. Cliquez sur "Voir tous les produits" ou allez sur `/products`
5. Utilisez la barre de recherche pour trouver un produit
6. Filtrez par catégorie en cliquant sur les boutons

#### 2. Voir les Détails d'un Produit
1. Cliquez sur une card produit
2. La page de détail s'ouvre en haut de la page
3. Consultez les images (slider si plusieurs images)
4. Ajustez la quantité avec + et -
5. Cliquez sur "Ajouter au panier"
6. Partagez le produit via WhatsApp, Facebook ou TikTok

#### 3. Gérer le Panier
1. L'icône de panier apparaît en bas à droite quand des articles sont ajoutés
2. Cliquez sur l'icône pour voir le panier
3. Modifiez les quantités avec + et -
4. Supprimez un article avec l'icône poubelle
5. Cliquez sur "Commander" pour passer à la commande

#### 4. Passer une Commande
1. Remplissez vos informations (nom, téléphone)
2. Sélectionnez votre commune (Abidjan)
3. Sélectionnez votre quartier (optionnel)
4. Ajoutez un repère si nécessaire
5. Choisissez le type de livraison (immédiate ou programmée)
6. Si programmée, sélectionnez une date
7. Vérifiez le récapitulatif
8. Cliquez sur "Passer la commande"
9. La commande est créée et vous recevrez une confirmation

---

### 👨‍💼 Pour les Administrateurs

#### 1. Se Connecter
1. Accédez à `/login`
2. Entrez vos identifiants admin
3. Vous êtes redirigé vers le dashboard

#### 2. Gérer les Produits
1. Allez dans "Products" (`/admin/products`)
2. Cliquez sur "Add Product" pour créer
3. Remplissez le formulaire :
   - Nom, description, catégorie
   - Prix en FCFA
   - Ajoutez plusieurs images (URLs)
   - Définissez la réduction
   - Activez "Produit en promotion" si nécessaire
4. Cliquez sur l'icône crayon pour éditer
5. Cliquez sur l'icône poubelle pour supprimer (avec confirmation)

#### 3. Gérer les Commandes
1. Allez dans "Orders" (`/admin/orders`)
2. Consultez la liste des commandes
3. Cliquez sur une commande pour voir les détails
4. Changez le statut avec le dropdown
5. Assignez un livreur :
   - Sélectionnez un livreur
   - Cochez "Envoyer WhatsApp" si nécessaire
   - Cliquez sur "Assigner"
6. Envoyez un message WhatsApp au client avec le bouton dédié

#### 4. Créer une Commande Manuellement
1. Allez dans "Créer Commande" (`/admin/create-order`)
2. Remplissez les informations client
3. Sélectionnez la commune et quartier
4. Cliquez sur "Ajouter un produit"
5. Sélectionnez les produits et quantités
6. Vérifiez le récapitulatif
7. Cliquez sur "Créer la commande"

#### 5. Voir les Statistiques
1. Allez dans "Dashboard" (`/admin/dashboard`)
2. Consultez les cards statistiques
3. Analysez les graphiques de ventes
4. Consultez les statistiques des livreurs
5. Allez dans "Analytics" pour des analyses approfondies

#### 6. Classer et Exporter les Commandes
1. Allez dans "Classement" (`/admin/orders-ranking`)
2. Cliquez sur un statut pour filtrer
3. Consultez le tableau détaillé
4. Cliquez sur "Exporter en Excel" pour télécharger

#### 7. Gérer les Livreurs
1. Allez dans "Livreurs" (`/admin/delivery-persons`)
2. Cliquez sur "Ajouter un livreur"
3. Remplissez les informations (nom, téléphone, email, véhicule)
4. Activez/désactivez le statut
5. Éditez ou supprimez un livreur

#### 8. Gérer les Témoignages
1. Allez dans "Testimonials" (`/admin/testimonials`)
2. Cliquez sur "Ajouter un témoignage"
3. Remplissez les informations (nom, localisation, note, contenu)
4. Activez/désactivez le témoignage
5. Éditez ou supprimez un témoignage

---

## 🎨 Design System

### Couleurs Principales
- **Primary (Orange)** : `#f97316` - Boutons, liens, accents
- **Success (Vert)** : `#10b981` - Statuts positifs
- **Danger (Rouge)** : `#ef4444` - Erreurs, suppressions
- **Warning (Jaune)** : `#eab308` - Avertissements
- **Gray** : `#6b7280` - Textes secondaires

### Typographie
- **Font Display** : Titres principaux (bold, extra-bold)
- **Font Body** : Textes normaux (medium, regular)

### Espacements
- **Mobile** : `gap-2`, `p-2`, `text-xs`
- **Desktop** : `gap-4`, `p-4`, `text-base`

### Composants UI
- **Cards** : `rounded-xl`, `shadow-sm`, `border`
- **Buttons** : `rounded-xl`, `font-semibold`
- **Inputs** : `rounded-xl`, `border-2`
- **Badges** : `rounded-full`, `px-3 py-1`

---

## 🔒 Sécurité

### Authentification
- Token JWT stocké dans localStorage
- Middleware `auth.api` pour les routes protégées
- Middleware `admin` pour les routes admin
- Protection CORS configurée

### Validation
- Validation côté client (Zod)
- Validation côté serveur (Laravel)
- Messages d'erreur clairs
- Protection contre les injections SQL (Eloquent)

---

## 📱 Responsive Design

### Breakpoints
- **Mobile** : < 640px (sm)
- **Tablette** : 640px - 1024px (md)
- **Desktop** : > 1024px (lg)

### Adaptations Mobile
- Grille 2 colonnes sur mobile
- Cartes compactes avec textes réduits
- Navigation hamburger
- Filtres scrollables horizontalement
- Sticky CTA sur mobile

---

## 🚀 Déploiement

### Prérequis
- PHP 7.4+
- Node.js 18+
- MySQL/PostgreSQL
- Composer
- NPM/Yarn

### Installation Backend
```bash
cd fashop-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Installation Frontend Client
```bash
cd client
npm install
npm run dev
```

### Installation Frontend Admin
```bash
cd admin/client
npm install
npm run dev
```

---

---

## 🔧 Hooks et API - Référence Complète

### 📦 Hooks Client (Frontend Utilisateur)

#### `useProducts(search?, categoryId?)`
**Description** : Récupère la liste des produits avec recherche et filtrage.

**Paramètres** :
- `search` (optionnel) : Terme de recherche
- `categoryId` (optionnel) : ID de la catégorie

**Retour** : `{ data: Product[], isLoading: boolean, error: Error }`

**Exemple** :
```typescript
const { data: products, isLoading } = useProducts("robe", "2");
```

#### `useProduct(slug)`
**Description** : Récupère un produit spécifique par slug ou ID.

**Paramètres** :
- `slug` : Slug ou ID du produit

**Retour** : `{ data: Product, isLoading: boolean, error: Error }`

**Exemple** :
```typescript
const { data: product } = useProduct("robe-elegante");
```

#### `useCategories()`
**Description** : Récupère toutes les catégories.

**Retour** : `{ data: Category[], isLoading: boolean }`

#### `useCart()`
**Description** : Hook Zustand pour gérer le panier.

**Méthodes disponibles** :
- `items: CartItem[]` - Liste des articles
- `addItem(product)` - Ajouter un produit
- `removeItem(productId)` - Supprimer un produit
- `updateQuantity(productId, quantity)` - Modifier la quantité
- `clearCart()` - Vider le panier
- `total()` - Calculer le total

**Exemple** :
```typescript
const { items, addItem, total, clearCart } = useCart();
```

#### `useCreateOrder()`
**Description** : Mutation pour créer une commande.

**Retour** : `{ mutate: Function, isPending: boolean, error: Error }`

**Exemple** :
```typescript
const { mutate, isPending } = useCreateOrder();
mutate({
  customerName: "Jean Dupont",
  customerPhone: "+2250700000000",
  customerLocation: "Abidjan, Cocody, Angré",
  deliveryType: "immediate",
  items: [{ productId: 1, quantity: 2 }]
}, {
  onSuccess: () => {
    toast({ title: "Commande créée !" });
    clearCart();
  }
});
```

#### `useTestimonials()`
**Description** : Récupère les témoignages actifs.

**Retour** : `{ data: Testimonial[], isLoading: boolean }`

#### `useSettings()`
**Description** : Récupère les paramètres du site.

**Retour** : `{ data: Settings, isLoading: boolean }`

---

### 👨‍💼 Hooks Admin (Frontend Administrateur)

#### `useProducts()` (Admin)
**Description** : Liste complète des produits pour l'admin.

**Retour** : `{ data: Product[], isLoading: boolean }`

#### `useCreateProduct()`
**Description** : Créer un nouveau produit.

**Paramètres** : `InsertProduct`

**Exemple** :
```typescript
const { mutate } = useCreateProduct();
mutate({
  name: "Nouveau Produit",
  description: "Description",
  category: "Vêtements",
  price: "15000",
  image: "https://...",
  images: ["https://...", "https://..."],
  discount: "10",
  isPromo: true,
  isActive: true
});
```

#### `useUpdateProduct()`
**Description** : Mettre à jour un produit.

**Paramètres** : `{ id: number, ...updates: Partial<InsertProduct> }`

#### `useDeleteProduct()`
**Description** : Supprimer un produit.

**Paramètres** : `id: number`

#### `useCategories()` (Admin)
**Description** : Liste des catégories avec nombre de produits.

**Retour** : `{ data: Category[], isLoading: boolean }`

#### `useCreateCategory()`
**Description** : Créer une catégorie.

**Paramètres** : `{ name: string }`

#### `useOrders()` (Admin)
**Description** : Liste des commandes avec filtres.

**Retour** : `{ data: Order[], isLoading: boolean }`

#### `useOrder(id)`
**Description** : Détail d'une commande.

**Paramètres** : `id: number`

**Retour** : `{ data: OrderWithItems, isLoading: boolean }`

#### `useUpdateOrderStatus()`
**Description** : Changer le statut d'une commande.

**Exemple** :
```typescript
const { mutate } = useUpdateOrderStatus();
mutate({ orderId: 1, status: "delivered" });
```

#### `useAssignDeliveryPerson()`
**Description** : Assigner un livreur à une commande.

**Exemple** :
```typescript
const { mutate } = useAssignDeliveryPerson();
mutate({ 
  orderId: 1, 
  deliveryPersonId: 2,
  sendWhatsApp: true 
});
```

#### `useDeliveryPersons()`
**Description** : Liste des livreurs.

**Retour** : `{ data: DeliveryPerson[], isLoading: boolean }`

#### `useCreateDeliveryPerson()`
**Description** : Créer un livreur.

**Paramètres** :
```typescript
{
  name: string;
  phone: string;
  email?: string;
  vehicle_type?: string;
  is_active: boolean;
}
```

#### `useDashboardStats()`
**Description** : Statistiques du dashboard.

**Retour** :
```typescript
{
  total_orders: { value: number, change: number };
  total_revenue: { value: number, change: number };
  active_products: { value: number };
  pending_orders: { value: number };
}
```

#### `useSalesStats()`
**Description** : Données de ventes sur 30 jours.

**Retour** : `Array<{ date: string, revenue: number }>`

#### `useCategorySales()`
**Description** : Ventes par catégorie.

**Retour** : `Array<{ name: string, total: number }>`

#### `useTopProducts()`
**Description** : Top produits vendus.

**Retour** : `Array<{ name: string, quantity: number }>`

#### `useOrdersByStatus()`
**Description** : Nombre de commandes par statut.

**Retour** : `Array<{ status: string, count: number }>`

#### `useDeliveryPersonsStats()`
**Description** : Statistiques des livreurs.

**Retour** :
```typescript
Array<{
  id: number;
  name: string;
  phone: string;
  total_orders: number;
  delivered_orders: number;
  processing_orders: number;
  total_revenue: number;
}>
```

---

## 📊 Modèles de Données

### Product (Produit)

```typescript
interface Product {
  id: number;
  name: string;
  description?: string;
  price: number; // En FCFA
  image?: string; // URL principale
  images?: string[]; // URLs multiples
  categoryId: number;
  category?: Category;
  discount?: number; // Pourcentage
  discountPercentage?: number; // Alias
  discountedPrice?: number; // Prix calculé
  isActive: boolean;
  isPromo?: boolean; // Produit en promotion
  isFeatured?: boolean; // Produit vedette
  slug?: string;
  createdAt: string;
}
```

### Category (Catégorie)

```typescript
interface Category {
  id: number;
  name: string;
  slug: string;
  productCount?: number; // Nombre de produits
}
```

### Order (Commande)

```typescript
interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  commune?: string;
  quartier?: string;
  deliveryType: "immediate" | "scheduled" | "programmed";
  deliveryDate?: string; // ISO string
  status: "pending" | "processing" | "delivered" | "cancelled" | "completed";
  totalAmount: number;
  deliveryFee?: number;
  itemsCount?: number; // Nombre de produits
  items?: OrderItem[];
  deliveryPersonId?: number;
  deliveryPerson?: DeliveryPerson;
  date: string; // Date de création
  createdAt: string;
}
```

### OrderItem (Article de Commande)

```typescript
interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number; // Prix au moment de la commande
  product?: Product; // Produit complet
}
```

### DeliveryPerson (Livreur)

```typescript
interface DeliveryPerson {
  id: number;
  name: string;
  phone: string;
  email?: string;
  vehicle_type?: string;
  is_active: boolean;
}
```

### Testimonial (Témoignage)

```typescript
interface Testimonial {
  id: number;
  customer_name: string;
  customer_location: string;
  rating: number; // 1-5
  content: string;
  is_active: boolean;
  avatar_initials?: string;
}
```

### Settings (Paramètres)

```typescript
interface Settings {
  whatsapp_link?: string;
  facebook_link?: string;
  tiktok_link?: string;
  banner_text?: string;
  banner_subtext?: string;
  banner_percentage?: number;
  banner_active?: boolean;
}
```

---

## 🔄 Workflows Complets

### Workflow : Création d'une Commande (Client)

1. **Navigation** :
   - Client parcourt les produits sur `/products`
   - Clique sur un produit → `/product/:id`
   - Ajoute au panier

2. **Gestion du Panier** :
   - Panier stocké dans localStorage (Zustand persist)
   - Icône flottante visible si articles présents
   - Page `/cart` pour modifier quantités

3. **Checkout** :
   - Client clique sur "Commander"
   - Redirection vers `/checkout`
   - Formulaire avec :
     - Informations client (nom, téléphone)
     - Sélection commune/quartier (Abidjan)
     - Type de livraison (immédiate/programmée)
     - Calcul automatique des frais de livraison

4. **Soumission** :
   - Validation Zod côté client
   - Appel API `POST /api/orders`
   - Backend crée la commande et les order_items
   - Retour avec ID de commande
   - Panier vidé
   - Redirection vers page de confirmation

### Workflow : Gestion d'une Commande (Admin)

1. **Réception** :
   - Nouvelle commande apparaît dans `/admin/orders`
   - Section "Nouvelles commandes du jour" mise en évidence

2. **Consultation** :
   - Clic sur la commande → Dialog de détail
   - Affichage :
     - Informations client
     - Liste des produits avec images
     - Adresse de livraison complète
     - Date de livraison si programmée

3. **Assignation Livreur** :
   - Sélection d'un livreur dans le dropdown
   - Option "Envoyer WhatsApp" au livreur
   - Confirmation et mise à jour

4. **Changement de Statut** :
   - Dropdown de statut
   - Options : pending → processing → delivered
   - Mise à jour en temps réel

5. **Communication** :
   - Bouton "Envoyer WhatsApp" au client
   - Message pré-rempli avec détails de la commande

6. **Suivi** :
   - Page `/admin/orders-ranking` pour classement
   - Export Excel pour analyse
   - Statistiques dans dashboard

### Workflow : Gestion des Produits (Admin)

1. **Création** :
   - Clic sur "Add Product"
   - Formulaire avec :
     - Nom, description, catégorie
     - Prix en FCFA
     - Images multiples (URLs)
     - Réduction (%)
     - Toggle "Produit en promotion"
     - Toggle "Actif"

2. **Validation** :
   - Validation Zod côté client
   - Soumission vers `POST /api/admin/products`
   - Backend valide et crée
   - Slug généré automatiquement

3. **Édition** :
   - Clic sur icône crayon
   - Formulaire pré-rempli
   - Modification et sauvegarde

4. **Suppression** :
   - Clic sur icône poubelle
   - Confirmation requise
   - Suppression définitive

---

## 📡 Structures de Réponses API

### GET /api/products

```json
{
  "data": [
    {
      "id": 1,
      "name": "Robe Élégante",
      "description": "Description...",
      "price": 15000,
      "image": "https://...",
      "images": ["https://...", "https://..."],
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Vêtements",
        "slug": "vetements"
      },
      "discount": 10,
      "discountPercentage": 10,
      "discountedPrice": 13500,
      "isActive": true,
      "isPromo": false,
      "slug": "robe-elegante",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /api/admin/orders

```json
{
  "data": [
    {
      "id": 1,
      "customerName": "Jean Dupont",
      "customerPhone": "+2250700000000",
      "customerLocation": "Abidjan, Cocody, Angré",
      "commune": "Cocody",
      "quartier": "Angré",
      "deliveryType": "immediate",
      "status": "processing",
      "totalAmount": 32000,
      "deliveryFee": 2000,
      "itemsCount": 2,
      "date": "2024-01-15T10:30:00Z",
      "deliveryPerson": {
        "id": 1,
        "name": "Kouassi",
        "phone": "+2250700000001"
      }
    }
  ]
}
```

### GET /api/admin/analytics/dashboard

```json
{
  "total_orders": {
    "value": 150,
    "change": 12.5
  },
  "total_revenue": {
    "value": 4500000,
    "change": 8.3
  },
  "active_products": {
    "value": 45
  },
  "pending_orders": {
    "value": 8
  }
}
```

### POST /api/orders (Request)

```json
{
  "customerName": "Jean Dupont",
  "customerPhone": "+2250700000000",
  "customerLocation": "Abidjan, Cocody, Angré",
  "commune": "Cocody",
  "quartier": "Angré",
  "deliveryType": "immediate",
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 3,
      "quantity": 1
    }
  ]
}
```

---

## 🛠️ Exemples de Code

### Exemple : Créer un Produit (Admin)

```typescript
import { useCreateProduct } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";

function CreateProductForm() {
  const { mutate, isPending } = useCreateProduct();
  const { toast } = useToast();

  const handleSubmit = (data: FormData) => {
    mutate({
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      images: data.images, // Array de URLs
      discount: data.discount,
      isPromo: data.isPromo,
      isActive: true
    }, {
      onSuccess: () => {
        toast({
          title: "Produit créé",
          description: "Le produit a été créé avec succès."
        });
      },
      onError: (error) => {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Champs du formulaire */}
    </form>
  );
}
```

### Exemple : Assigner un Livreur

```typescript
import { useAssignDeliveryPerson } from "@/hooks/use-orders";
import { useDeliveryPersons } from "@/hooks/use-delivery-persons";

function AssignDeliveryPerson({ orderId }: { orderId: number }) {
  const { data: deliveryPersons } = useDeliveryPersons();
  const { mutate, isPending } = useAssignDeliveryPerson();
  const { toast } = useToast();

  const handleAssign = (deliveryPersonId: number) => {
    mutate({
      orderId,
      deliveryPersonId,
      sendWhatsApp: true
    }, {
      onSuccess: () => {
        toast({
          title: "Livreur assigné",
          description: "Le livreur a été assigné et notifié."
        });
      }
    });
  };

  return (
    <Select onValueChange={(id) => handleAssign(Number(id))}>
      {deliveryPersons?.map(person => (
        <SelectItem key={person.id} value={String(person.id)}>
          {person.name} - {person.phone}
        </SelectItem>
      ))}
    </Select>
  );
}
```

### Exemple : Calculer les Frais de Livraison

```typescript
import { useState, useEffect } from "react";

function DeliveryFeeCalculator({ commune, quartier }: { commune: string, quartier?: string }) {
  const [fee, setFee] = useState(2000);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!commune) {
      setFee(2000); // Frais par défaut
      return;
    }

    setIsLoading(true);
    const params = new URLSearchParams({ commune });
    if (quartier) params.append('quartier', quartier);

    fetch(`http://localhost:8000/api/delivery-fees/calculate?${params}`)
      .then(res => res.json())
      .then(data => {
        setFee(data.fee || 2000);
        setIsLoading(false);
      })
      .catch(() => {
        setFee(2000);
        setIsLoading(false);
      });
  }, [commune, quartier]);

  return (
    <div>
      {isLoading ? (
        <span>Calcul...</span>
      ) : (
        <span>{fee.toLocaleString('fr-FR')} FCFA</span>
      )}
    </div>
  );
}
```

---

## ⚠️ Gestion d'Erreurs

### Erreurs Courantes et Solutions

#### 1. Erreur 500 - Internal Server Error

**Causes possibles** :
- Table ou colonne manquante en base
- Erreur de validation Laravel
- Problème de relation Eloquent

**Solution** :
- Vérifier les logs Laravel (`storage/logs/laravel.log`)
- Vérifier que les migrations sont à jour
- Vérifier les relations dans les modèles

#### 2. Erreur 404 - Not Found

**Causes possibles** :
- Route non définie
- ID/Slug incorrect
- Ressource supprimée

**Solution** :
- Vérifier `routes/api.php`
- Vérifier que l'ID existe en base
- Vérifier les paramètres de route

#### 3. Erreur CORS

**Causes possibles** :
- Headers CORS manquants
- Origine non autorisée

**Solution** :
- Vérifier `app/Http/Middleware/Cors.php`
- Ajouter l'origine dans `allowed_origins`

#### 4. Erreur de Validation

**Causes possibles** :
- Données invalides
- Champs requis manquants
- Format incorrect

**Solution** :
- Vérifier les messages d'erreur dans la réponse
- Vérifier le schéma Zod côté client
- Vérifier les règles de validation Laravel

---

## 🎯 Cas d'Usage Avancés

### Cas 1 : Produit avec Images Multiples

```typescript
// Backend reçoit
{
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg"
  ]
}

// Stocké en base comme JSON
// Frontend affiche avec ProductImageSlider
<ProductImageSlider 
  images={product.images} 
  productName={product.name}
/>
```

### Cas 2 : Commande Programmée

```typescript
// Client sélectionne "Programmée"
{
  deliveryType: "programmed",
  deliveryDate: "2024-02-15T10:00:00Z"
}

// Backend normalise
{
  delivery_type: "scheduled",
  delivery_date: "2024-02-15 10:00:00"
}

// Admin voit la date dans le tableau
// Tri automatique par date de livraison
```

### Cas 3 : Export Excel des Commandes

```typescript
import * as XLSX from 'xlsx';

function exportToExcel(orders: Order[], status: string) {
  const data = orders.map(order => ({
    'ID': order.id,
    'Client': order.customerName,
    'Téléphone': order.customerPhone,
    'Lieu': order.customerLocation,
    'Date Commande': format(new Date(order.date), 'dd/MM/yyyy'),
    'Date Livraison': order.deliveryDate 
      ? format(new Date(order.deliveryDate), 'dd/MM/yyyy')
      : '-',
    'Livreur': order.deliveryPerson?.name || '-',
    'Produits': order.itemsCount,
    'Montant': order.totalAmount,
    'Statut': order.status
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Commandes');
  
  const filename = `Commandes_${status}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, filename);
}
```

### Cas 4 : Statistiques en Temps Réel

```typescript
// Dashboard avec refresh automatique
const { data: stats } = useDashboardStats({
  refetchInterval: 30000 // Refresh toutes les 30 secondes
});

// Graphiques avec animations
<AreaChart data={salesData}>
  <Area 
    dataKey="revenue" 
    stroke="#f97316" 
    fill="url(#colorRevenue)"
    animationDuration={1000}
  />
</AreaChart>
```

---

## 📞 Support

Pour toute question ou problème :
- Email : support@fashop.com
- Documentation : Ce fichier
- Code source : Repository Git

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2024  
**Auteur** : Équipe Fashop


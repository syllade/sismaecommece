# 📋 Spécifications Techniques - Interface Admin Fashop

## 🎯 Objectif

Créer une interface d'administration complète permettant de gérer tous les aspects du site e-commerce Fashop depuis un seul endroit.

---

## 🔐 Authentification

### Page de connexion (`/admin/login`)

**Formulaire :**
- Email (input type="email")
- Mot de passe (input type="password")
- Bouton "Se connecter"
- Option "Se souvenir de moi" (checkbox)

**Validation :**
- Email valide requis
- Mot de passe minimum 8 caractères

**Après connexion :**
- Redirection vers `/admin/dashboard`
- Stockage du token/session
- Protection de toutes les routes `/admin/*`

---

## 📊 Dashboard (`/admin/dashboard`)

### Métriques principales (Cards en haut)

1. **Total des commandes**
   - Nombre total
   - Variation par rapport au mois précédent (+/- %)
   - Icône : ShoppingBag

2. **Chiffre d'affaires**
   - Montant total en FCFA
   - Variation par rapport au mois précédent
   - Icône : DollarSign

3. **Produits actifs**
   - Nombre de produits avec `isActive = true`
   - Icône : Package

4. **Commandes en attente**
   - Nombre de commandes avec `status = 'pending'`
   - Icône : Clock

### Graphiques

1. **Ventes sur 30 derniers jours** (Line Chart)
   - Axe X : Dates
   - Axe Y : Montant en FCFA
   - Ligne bleue

2. **Ventes par catégorie** (Pie Chart)
   - Chaque catégorie = une tranche
   - Couleurs différentes par catégorie
   - Pourcentage et montant affichés

3. **Top 5 produits les plus vendus** (Bar Chart)
   - Axe X : Nom du produit
   - Axe Y : Quantité vendue
   - Barres horizontales

### Tableau récent

**Dernières commandes** (5 dernières)
- Colonnes : ID, Client, Montant, Statut, Date
- Lien "Voir toutes" vers `/admin/orders`

---

## 📦 Gestion des Produits (`/admin/products`)

### Page liste (`/admin/products`)

**Tableau avec colonnes :**
1. Image (miniature 50x50px, arrondie)
2. Nom (lien vers édition)
3. Catégorie (badge coloré)
4. Prix (en FCFA)
5. Prix réduit (si réduction, sinon "-")
6. Statut (badge vert "Actif" / badge gris "Inactif")
7. Actions (3 boutons : Modifier, Dupliquer, Supprimer)

**Filtres en haut :**
- Recherche par nom (input texte)
- Filtre par catégorie (select)
- Filtre par statut (select : Tous, Actifs, Inactifs)
- Bouton "Réinitialiser"

**Actions :**
- Bouton "+ Ajouter un produit" (en haut à droite)
- Pagination en bas (20 produits par page)

### Page création/édition (`/admin/products/new` ou `/admin/products/:id/edit`)

**Formulaire en 2 colonnes :**

**Colonne gauche :**
1. Nom du produit *
   - Input texte
   - Validation : min 3 caractères, max 200

2. Description
   - Textarea (5 lignes)
   - Validation : max 1000 caractères

3. Catégorie *
   - Select avec toutes les catégories
   - Option "Créer une nouvelle catégorie" (ouvre modal)

4. Prix *
   - Input number
   - Suffixe "FCFA"
   - Validation : min 1

5. Réduction
   - Input number (0-100)
   - Suffixe "%"
   - Si rempli, afficher le prix réduit calculé en dessous

**Colonne droite :**
1. Image du produit
   - Zone de drag & drop
   - Ou bouton "Choisir un fichier"
   - Aperçu de l'image
   - Option "Supprimer l'image"
   - Accepte : JPG, PNG, WebP (max 5MB)

2. Statut
   - Toggle switch
   - "Actif" / "Inactif"

3. Boutons d'action
   - "Enregistrer" (primary, orange)
   - "Annuler" (secondary, gris)
   - "Prévisualiser" (lien vers page produit publique)

**Validation :**
- Tous les champs marqués * sont requis
- Afficher les erreurs sous chaque champ
- Empêcher la soumission si erreurs

### Suppression

**Modal de confirmation :**
- Message : "Êtes-vous sûr de vouloir supprimer ce produit ?"
- Avertissement si le produit est dans des commandes
- Options :
  - "Supprimer définitivement"
  - "Désactiver seulement" (recommandé)
  - "Annuler"

---

## 🏷️ Gestion des Catégories (`/admin/categories`)

### Page liste

**Tableau :**
- Nom
- Slug (gris, plus petit)
- Nombre de produits (badge)
- Actions (Modifier, Supprimer)

**Bouton :** "+ Ajouter une catégorie"

### Formulaire création/édition

**Champs :**
1. Nom *
   - Input texte
   - Validation : unique, min 2 caractères

2. Slug
   - Input texte
   - Auto-généré depuis le nom (lowercase, tirets)
   - Modifiable manuellement
   - Validation : unique, format URL-friendly

**Boutons :** Enregistrer, Annuler

---

## 🛒 Gestion des Commandes (`/admin/orders`)

### Page liste

**Tableau avec colonnes :**
1. ID (lien vers détails)
2. Client (nom)
3. Téléphone
4. Produits (liste avec quantités, tooltip pour voir tout)
5. Montant total (en gras, orange)
6. Statut (badge coloré)
   - En attente : jaune
   - En cours : bleu
   - Livrée : vert
   - Annulée : rouge
7. Date (format : DD/MM/YYYY HH:mm)
8. Actions (Voir détails, Modifier statut)

**Filtres :**
- Par statut (select)
- Par date (select : Aujourd'hui, Cette semaine, Ce mois, Personnalisé)
- Recherche (nom client ou téléphone)

**Tri :**
- Par date (plus récent en premier par défaut)
- Par montant
- Par statut

### Page détails (`/admin/orders/:id`)

**Section Informations client :**
- Nom
- Téléphone (lien cliquable pour appeler)
- Localisation
- Type de livraison
- Date de livraison prévue (si programmée)

**Section Produits commandés :**
- Tableau :
  - Image
  - Nom
  - Quantité
  - Prix unitaire
  - Total
- Total général en bas

**Section Actions :**
- Modifier le statut (select)
- Bouton "Imprimer"
- Bouton "Exporter PDF"
- Bouton "Envoyer SMS" (si intégration)

---

## ⭐ Gestion des Témoignages (`/admin/testimonials`)

### Page liste

**Tableau :**
- Nom
- Localisation
- Note (5 étoiles)
- Extrait texte (50 premiers caractères)
- Statut
- Actions

### Formulaire

**Champs :**
1. Nom du client *
2. Localisation *
3. Note (1-5 étoiles, slider ou select)
4. Texte du témoignage * (textarea)
5. Initiales pour avatar (auto-généré, modifiable)
6. Statut (Actif/Inactif)

---

## ⚙️ Paramètres (`/admin/settings`)

### Onglet : Réseaux sociaux (`/admin/settings/social`)

**Formulaire :**
- Lien WhatsApp (input URL)
- Lien TikTok (input URL)
- Lien Facebook (input URL)
- Bouton "Tester les liens" (ouvre dans nouvel onglet)
- Bouton "Enregistrer"

### Onglet : Bannière publicitaire (`/admin/settings/banner`)

**Formulaire :**
- Texte principal (ex: "Jusqu'à 30% de réduction")
- Texte secondaire (ex: "Offre limitée")
- Pourcentage de réduction (0-100)
- Activer/Désactiver (toggle)
- Lien du bouton CTA (input URL)

**Prévisualisation :**
- Aperçu de la bannière telle qu'elle apparaîtra
- Fond orange, texte blanc
- Bouton blanc

---

## 📊 Statistiques (`/admin/analytics`)

### Filtres en haut

- Période (select : 7 jours, 30 jours, 3 mois, 6 mois, 1 an, Personnalisé)
- Date de début / Date de fin (date pickers)

### Graphiques

1. **Évolution des ventes** (Line Chart)
   - Ligne bleue
   - Points interactifs

2. **Ventes par catégorie** (Pie Chart)
   - Couleurs distinctes
   - Légende avec pourcentages

3. **Top 10 produits** (Bar Chart horizontal)
   - Nom du produit
   - Quantité vendue

4. **Commandes par statut** (Donut Chart)
   - 4 segments colorés

### Export

- Bouton "Exporter en CSV"
- Bouton "Exporter en PDF"

---

## 🎨 Design et UI

### Couleurs

- **Primary** : Orange (#FF6B35 ou similaire)
- **Success** : Vert (#10B981)
- **Warning** : Jaune (#F59E0B)
- **Danger** : Rouge (#EF4444)
- **Background** : Blanc (#FFFFFF)
- **Sidebar** : Gris foncé (#1F2937)

### Typographie

- **Titres** : Font Display (Outfit), Bold
- **Corps** : Font Body (DM Sans), Regular
- **Tailles** : Responsive (mobile, tablette, desktop)

### Composants

Utiliser les composants shadcn/ui existants :
- `Button`
- `Input`
- `Select`
- `Table`
- `Dialog` (modals)
- `Toast` (notifications)
- `Card`
- `Badge`

### Responsive

- **Mobile** : Sidebar collapsible, tableaux scrollables
- **Tablette** : Sidebar réduite, 2 colonnes
- **Desktop** : Sidebar complète, layout optimal

---

## 🔄 Workflows

### Création d'un produit

1. Clic sur "+ Ajouter un produit"
2. Remplir le formulaire
3. Upload de l'image
4. Clic sur "Enregistrer"
5. Toast de succès
6. Redirection vers la liste

### Modification de statut de commande

1. Clic sur "Modifier statut" dans la liste
2. Select du nouveau statut
3. Confirmation
4. Toast de succès
5. Mise à jour automatique de la liste

### Suppression d'un produit

1. Clic sur "Supprimer"
2. Modal de confirmation
3. Choix : Supprimer ou Désactiver
4. Confirmation
5. Toast de succès
6. Mise à jour de la liste

---

## 📱 Responsive Breakpoints

- **Mobile** : < 640px
- **Tablette** : 640px - 1024px
- **Desktop** : > 1024px

---

## ✅ Checklist de développement

### Backend Laravel
- [ ] Créer les migrations
- [ ] Créer les modèles avec relations
- [ ] Créer les contrôleurs
- [ ] Créer les routes API
- [ ] Implémenter l'authentification (JWT ou Sessions)
- [ ] Ajouter la validation des données
- [ ] Créer les middlewares (auth, admin)
- [ ] Tester avec Postman/Insomnia

### Frontend Admin
- [ ] Créer le layout AdminLayout
- [ ] Créer la Sidebar avec navigation
- [ ] Créer le Header avec menu utilisateur
- [ ] Implémenter l'authentification (login)
- [ ] Créer toutes les pages listes
- [ ] Créer tous les formulaires
- [ ] Créer les modals de confirmation
- [ ] Intégrer les graphiques (Recharts)
- [ ] Ajouter les toasts de notification
- [ ] Tester toutes les fonctionnalités
- [ ] Optimiser pour mobile

---

**Version :** 1.0  
**Date :** Décembre 2024


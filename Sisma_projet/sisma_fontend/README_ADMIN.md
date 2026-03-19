# 📖 Guide d'utilisation - Documentation Admin Fashop

## 🎯 Pour qui ?

Cette documentation est destinée aux développeurs qui vont créer l'interface d'administration pour le site e-commerce **Fashop**.

---

## 📚 Fichiers de documentation

### 1. `DOCUMENTATION_ADMIN.md`
**Documentation complète et générale**

Contient :
- Vue d'ensemble du projet
- Architecture et structure
- Structure des données
- Fonctionnalités existantes
- Fonctionnalités à implémenter
- API Endpoints nécessaires
- Guide d'implémentation général

**👉 À lire en premier pour comprendre le projet**

### 2. `SPECIFICATIONS_ADMIN.md`
**Spécifications techniques détaillées**

Contient :
- Détails de chaque page admin
- Spécifications des formulaires
- Workflows utilisateur
- Design et UI
- Checklist de développement

**👉 À utiliser comme référence pendant le développement**

---

## 🚀 Comment utiliser cette documentation ?

### Pour Bolt (ou un autre assistant IA)

1. **Commencer par lire** `DOCUMENTATION_ADMIN.md` pour comprendre :
   - L'architecture du projet
   - Les données à gérer
   - Les fonctionnalités nécessaires

2. **Ensuite consulter** `SPECIFICATIONS_ADMIN.md` pour :
   - Les détails de chaque page
   - Les formulaires exacts à créer
   - Les workflows à implémenter

3. **Référencer** les fichiers existants :
   - `shared/schema.ts` : Structure des données
   - `shared/routes.ts` : Routes API définies
   - `client/src/hooks/use-products.ts` : Exemple de hooks
   - `client/src/data/mockProducts.ts` : Exemple de données

### Pour un développeur humain

1. Lire les deux fichiers de documentation
2. Examiner le code existant dans `client/src/`
3. Créer le backend Laravel selon les spécifications
4. Créer le frontend admin selon les spécifications
5. Tester chaque fonctionnalité

---

## 📋 Ordre de développement recommandé

### Phase 1 : Backend Laravel
1. ✅ Créer les migrations
2. ✅ Créer les modèles
3. ✅ Créer les contrôleurs
4. ✅ Créer les routes API
5. ✅ Implémenter l'authentification
6. ✅ Tester avec Postman

### Phase 2 : Frontend Admin - Base
1. ✅ Créer le layout AdminLayout
2. ✅ Créer la Sidebar
3. ✅ Créer la page de login
4. ✅ Protéger les routes

### Phase 3 : Frontend Admin - Fonctionnalités
1. ✅ Dashboard avec métriques
2. ✅ Gestion des produits (CRUD)
3. ✅ Gestion des catégories (CRUD)
4. ✅ Gestion des commandes (liste + détails)
5. ✅ Gestion des témoignages (CRUD)
6. ✅ Paramètres (réseaux sociaux + bannière)
7. ✅ Statistiques avec graphiques

### Phase 4 : Finalisation
1. ✅ Tests de toutes les fonctionnalités
2. ✅ Optimisation responsive
3. ✅ Gestion des erreurs
4. ✅ Documentation utilisateur

---

## 🔍 Points importants

### Données actuelles

Le frontend utilise actuellement des **données mockées** dans :
- `client/src/data/mockProducts.ts`

Ces données doivent être **remplacées** par des appels API Laravel une fois le backend prêt.

### Structure des données

Toutes les structures de données sont définies dans :
- `shared/schema.ts`

**Important :** Le champ `discountPercentage` n'est pas dans le schema actuel mais est utilisé dans le frontend. Il faut l'ajouter à la migration Laravel.

### Routes API

Les routes API sont définies dans :
- `shared/routes.ts`

Ces routes doivent être implémentées dans Laravel.

---

## 💡 Conseils pour Bolt

1. **Lire attentivement** les deux fichiers de documentation
2. **Examiner** le code existant pour comprendre les patterns
3. **Créer d'abord** le backend Laravel (API)
4. **Ensuite créer** le frontend admin
5. **Tester** chaque fonctionnalité au fur et à mesure
6. **Utiliser** les composants shadcn/ui existants
7. **Respecter** le design system (couleurs, typographie)

---

## 📞 Questions fréquentes

**Q : Où sont les données mockées ?**
R : Dans `client/src/data/mockProducts.ts`

**Q : Comment sont structurées les données ?**
R : Voir `shared/schema.ts`

**Q : Quelles routes API sont nécessaires ?**
R : Voir la section "API Endpoints" dans `DOCUMENTATION_ADMIN.md`

**Q : Quels composants UI utiliser ?**
R : Les composants shadcn/ui dans `client/src/components/ui/`

**Q : Comment gérer l'authentification ?**
R : Voir la section "Authentification" dans `SPECIFICATIONS_ADMIN.md`

---

## ✅ Checklist avant de commencer

- [ ] Lire `DOCUMENTATION_ADMIN.md`
- [ ] Lire `SPECIFICATIONS_ADMIN.md`
- [ ] Examiner `shared/schema.ts`
- [ ] Examiner `shared/routes.ts`
- [ ] Examiner `client/src/hooks/use-products.ts`
- [ ] Examiner `client/src/data/mockProducts.ts`
- [ ] Comprendre la structure du projet
- [ ] Préparer l'environnement de développement

---

**Bonne chance avec le développement ! 🚀**


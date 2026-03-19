# 📘 CAHIER DES CHARGES OFFICIEL

# 🛡️ SISMA – Marketplace Sécurisée & Gouvernée

---

## 1️⃣ PRÉSENTATION DU PROJET

### 🎯 Objectif

SISMA est une marketplace multi-vendeurs sécurisée permettant :

- Aux **fournisseurs** de vendre leurs produits
- Aux **clients** d'acheter en toute confiance
- Aux **livreurs** d'assurer les livraisons
- À l'**administration** de réguler, surveiller et sécuriser la plateforme

La plateforme doit être :

- Anti-fraude
- Disciplinée
- Automatisée
- Gouvernée intelligemment
- Production-ready

---

## 2️⃣ ARCHITECTURE GÉNÉRALE

### 🔹 Backend

| Composant | Technologie |
|-----------|-------------|
| Framework | Laravel 11 |
| Auth | Laravel Sanctum / API Tokens |
| API | REST JSON |
| Cache | Redis |
| Queue | Laravel Queue |

### 🔹 Middleware de Sécurité

| Middleware | Rôle |
|------------|------|
| `auth.api` | Vérification token |
| `role:{roles}` | Contrôle accès |
| `throttle` | Rate limiting |
| `cors` | Cross-Origin |

### 🔹 Frontend

| Application | Route | Rôle |
|-------------|-------|------|
| Admin | `/admin/*` | Gestion plateforme |
| Fournisseur | `/fournisseur/*` | Gestion boutique |
| Client | `/client/*` | Achat |
| Livreur | `/livreur/*` | Livraison |

### 🔹 Communication

- **Format** : JSON
- **Auth** : Bearer Token
- **Content-Type** : `application/json`
- **Errors** : 401 / 403 / 422 standardisés

---

## 3️⃣ GESTION DES RÔLES

### Définition des Rôles

| Rôle | Code | Accès |
|------|------|-------|
| Administrateur | `admin` | Contrôle global |
| Fournisseur | `supplier` | Gestion boutique |
| Client | `client` | Achat |
| Livreur | `delivery` | Livraison |

### Protection API

```php
// Admin uniquement
$router->group(['prefix' => 'api/v1/admin', 'middleware' => 'role:admin'], ...);

// Fournisseur uniquement
$router->group(['prefix' => 'api/v1/supplier', 'middleware' => 'role:supplier'], ...);

// Livreur uniquement
$router->group(['prefix' => 'api/v1/driver', 'middleware' => 'role:delivery'], ...);

// Client uniquement
$router->group(['prefix' => 'api/client', 'middleware' => 'role:client'], ...);
```

---

## 4️⃣ PROCESSUS D'INSCRIPTION & VALIDATION

---

### 4.1 FOURNISSEUR

#### Processus Mandatory

```
1. Création par Admin (pas d'auto-inscription)
2. Statut = pending_validation
3. Notification Admin
4. Validation Admin
5. Email activation (token 72h)
6. Accès autorisé
```

#### Règles de Validation - OBLIGATOIRE

| Champ | Règle |
|-------|-------|
| Email | UNIQUE - Vérification anti-doublon |
| Téléphone | UNIQUE - Vérification anti-doublon |
| Société | UNIQUE - Vérification anti-doublon |
| IP | Détection multi-comptes |

#### Statuts Fournisseur

| Statut | Code | Effet |
|--------|------|-------|
| En attente | `pending_validation` | Accès backend non autorisé |
| Approuvé | `approved` | Accès complet |
| Suspendu | `suspended` | Accès limité |
| Banni | `banned` | Accès bloqué |

#### API Endpoints

```php
// Création (Admin)
POST /api/v1/admin/suppliers
// Réponse: { supplier, activation_token, invite_sent }

// Activation
POST /api/auth/activate
// Body: { token, password }

// Blocage
POST /api/v1/admin/suppliers/{id}/block
```

---

### 4.2 CLIENT

#### Inscription

```
1. Inscription simple
2. Email UNIQUE - Vérification anti-doublon
3. Statut initial = normal
```

#### Statuts Client

| Statut | Code | Effet |
|--------|------|-------|
| Normal | `normal` | Accès complet |
| Avertissement | `warning` | Alerte affichée |
| Zone Rouge | `red_zone` | Restrictions |
| Banni | `banned` | Accès bloqué |

---

### 4.3 LIVREUR

#### Processus Mandatory

```
1. Création EXCLUSIVEMENT par Admin
2. Activation via lien sécurisé
3. Token avec expiration
4. Email UNIQUE obligatoire
```

#### Aucune inscription publique autorisée

```php
// Routes publiques - LIVREUR UNIQUEMENT
POST /api/v1/driver/login      // Auth
POST /api/v1/driver/activate/{id}  // Activation
POST /api/v1/driver/forgot-password

// TOUTES les autres routes = MIDDLEWARE role:delivery
```

---

## 5️⃣ SYSTÈME DISCIPLINAIRE CLIENT

### 🎯 Objectif

Protéger les fournisseurs contre les clients abusifs.

### 🔴 Règle Principale

```php
// Trigger
IF (annulations >= 3) OR (taux_annulation > 30%)
    THEN statut = warning
    
IF (statut == warning AND récidive)
    THEN statut = red_zone
```

### Effets `red_zone`

| Effet | Description |
|-------|-------------|
| Alerte Admin | Notification automatique |
| Badge Rouge | Affichage dashboard |
|Restriction COD | Paiement livraison interdit |
| Possibilité Suspension | Action admin |

### Dashboard Admin - Section Requise

```markdown
### 🔴 UTILISATEURS À RISQUE

| Client | Annulations | Taux | Actions |
|--------|-------------|------|---------|
| [Nom] | 5 | 45% | [Suspendre] |
```

---

## 6️⃣ BANNISSEMENT DÉFINITIF

### Principe

> **Un bannissement = Irréversible + Total + Définitif**

### Actions Automatiques sur Bannissement

| Action | Implémentation |
|--------|----------------|
| `suspended_permanently = true` | Database field |
| Blocage login | Middleware |
| Désactivation produits | Service |
| Arrêt campagnes | Service |
| Blocage commandes | Service |

### Protection Anti-Re-création

| Donnée | Action |
|--------|--------|
| Email | Blacklist table |
| Téléphone | Blacklist table |
| Identifiant fiscal | Blacklist table |
| Device Fingerprint | Si implémenté |

---

## 7️⃣ DÉTECTION ABUS FOURNISSEUR

### Déclencheurs d'Alerte

| Type Abus | Seuil | Action |
|-----------|-------|--------|
| Taux retour | > 15% | Alerte Admin |
| Produits rejetés | > 10 | Alerte Admin |
| Réclamations | > 5 | Alerte Admin |
| CPC suspect | Détection fraude | Alerte + Blocage |
| Commandes non traitées | > 20 | Suspension auto |

### Dashboard Admin - Section Requise

```markdown
### 🔴 FOURNISSEURS À RISQUE

| Fournisseur | Retours | Réclamations | Retards |
|------------|---------|--------------|---------|
```

---

## 8️⃣ SUSPENSION AUTOMATIQUE

### Fournisseur

```php
// Conditions suspension automatique
IF (commandes_non_traitees > 20 EN 24h)
    THEN suspension_temporaire
    
IF (taux_retour > 25%)
    THEN suspension_temporaire
```

### Livreur

```php
// Conditions suspension automatique
IF (livraisons_echouees > 5 EN 24h)
    THEN suspension_temporaire
    
IF (retards_excessifs > 10 EN 24h)
    THEN suspension_temporaire
```

### Client

```php
// Conditions suspension automatique
IF (statut == red_zone ET récidive)
    THEN suspension_definitive
```

---

## 9️⃣ CONTRÔLE ADMIN

### Admin = Régulateur

| Peut Faire | Ne Peut Pas |
|------------|-------------|
| ✅ Valider | ❌ Modifier SEO fournisseur |
| ✅ Suspendre | ❌ Gérer stock fournisseur |
| ✅ Bannir | ❌ Créer produit fournisseur |
| ✅ Voir alertes | ❌ Intervenir gestion interne |
| ✅ Voir stats | |

---

## 🔟 SÉCURITÉ API

### Codes de Réponse

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Bad Request |
| 401 | Non authentifié |
| 403 | Rôle insuffisant |
| 404 | Ressource non trouvée |
| 422 | Validation échouée |
| 429 | Rate limit |
| 500 | Erreur serveur |

### Format Erreur Standard

```json
{
  "success": false,
  "message": "Description",
  "errors": {
    "champ": ["erreur"]
  },
  "code": "ERROR_CODE"
}
```

### Headers Requis

```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

---

## 1️⃣1️⃣ MONITORING & AUDIT

### Actions à Journaliser

| Action | Table |
|--------|-------|
| Bannissement | `audit_logs` |
| Suspension | `audit_logs` |
| Validation | `audit_logs` |
| Activation | `audit_logs` |
| Modification sensible | `audit_logs` |

### Format Audit

```php
AuditLogService::record(
    action: 'admin.supplier.ban',
    user: $admin,
    data: ['supplier_id' => $id, 'reason' => '...'],
    category: 'supplier'
);
```

---

## 1️⃣2️⃣ BASE DE DONNÉES – SCHÉMA REQUIS

### Table Users

```sql
users:
  - id: bigint
  - name: string
  - email: string (unique)
  - phone: string (unique)
  - role: enum('admin','supplier','client','delivery')
  - password: string
  - is_active: boolean
  - status: string ('pending_validation','approved','suspended','banned')
  - suspended_permanently: boolean
  - cancellation_count: integer (clients)
  - return_rate: float (fournisseurs)
  - risk_level: string ('normal','warning','red_zone')
  - created_at: timestamp
  - updated_at: timestamp
```

### Table Suppliers

```sql
suppliers:
  - id: bigint
  - name: string
  - email: string (unique)
  - phone: string (unique)
  - company_unique_id: string (unique)
  - is_active: boolean
  - commission_rate: float
  - created_at: timestamp
```

### Table Audit Logs

```sql
audit_logs:
  - id: bigint
  - user_id: bigint
  - action: string
  - description: text
  - metadata: json
  - ip_address: string
  - created_at: timestamp
```

---

## 1️⃣3️⃣ INTÉGRATION FRONTEND

### Obligations Frontend

| Action | Implémentation |
|--------|----------------|
| Affichage selon statut | Switch sur `user.status` |
| Masquer fonctionnalités | V-if selon rôle |
| Afficher alertes risk_level | Badge rouge si `red_zone` |
| Gérer refresh token | Intercepteur |
| Bloquer si suspended | Route guard |

### Protected Routes

```typescript
// Guard par rôle
RoleProtectedRoute({
  allowedRoles: ['admin', 'supplier'],
  children: <Dashboard />
})
```

---

## 1️⃣4️⃣ OBJECTIFS PRODUCTION

### KPIs Requis

| Métrique | Cible |
|----------|-------|
| Sécurité | > 90/100 |
| Gouvernance | > 85/100 |
| Automatisation | > 80% |
| Doublons comptes | 0 |
| Accès non autorisés | 0 |

---

## 1️⃣5️⃣ VISION STRATÉGIQUE

> SISMA n'est pas juste un site e-commerce.

C'est :

- Une marketplace **disciplinée**
- Un environnement **professionnel**
- Un système **auto-régulé**
- Une plateforme qui **protège les sérieux**
- Une structure qui **filtre les abus**

**La confiance est la priorité.**

---

## ✅ DÉCLARATION DE CONFORMITÉ

Ce cahier des charges constitue :

- ✅ Le cadre officiel **Backend**
- ✅ Le cadre officiel **Frontend**
- ✅ La référence **Sécurité**
- ✅ La référence **Gouvernance**

**Toute nouvelle fonctionnalité doit respecter :**

- Sécurité
- Traçabilité
- Contrôle rôle
- Protection anti-fraude

---

*Document officiel - Équipe SISMA*
*Version 1.0 - Mars 2026*
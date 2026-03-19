# Script pour créer les accès admin
Write-Host "========================================" -ForegroundColor Green
Write-Host "CRÉATION DES ACCÈS ADMIN" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Vérifier si on est dans le bon répertoire
if (-not (Test-Path "artisan")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté dans le dossier fashop-backend" -ForegroundColor Red
    exit 1
}

Write-Host "Étape 1: Exécution des migrations..." -ForegroundColor Yellow
Write-Host ""

# Exécuter les migrations
php artisan migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Erreur lors des migrations" -ForegroundColor Red
    Write-Host "Vérifiez que:" -ForegroundColor Yellow
    Write-Host "  - MySQL est démarré dans XAMPP" -ForegroundColor White
    Write-Host "  - La base de données 'fashop_db' existe" -ForegroundColor White
    Write-Host "  - Les identifiants dans .env sont corrects" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "✓ Migrations exécutées avec succès!" -ForegroundColor Green
Write-Host ""

Write-Host "Étape 2: Création de l'utilisateur admin..." -ForegroundColor Yellow
Write-Host ""

# Créer l'utilisateur admin
php artisan db:seed --class=AdminUserSeeder

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Erreur lors de la création de l'admin" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ ACCÈS ADMIN CRÉÉS AVEC SUCCÈS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Identifiants de connexion:" -ForegroundColor Cyan
Write-Host "  Email    : admin@fashop.com" -ForegroundColor White
Write-Host "  Password : admin123" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Changez le mot de passe après la première connexion!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pour démarrer le serveur Laravel:" -ForegroundColor Cyan
Write-Host "  php artisan serve" -ForegroundColor White
Write-Host ""
Write-Host "Pour démarrer le frontend admin:" -ForegroundColor Cyan
Write-Host "  cd ../admin" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""


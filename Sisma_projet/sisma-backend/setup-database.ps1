# Script PowerShell pour configurer la base de données Fashop
# Exécutez: .\setup-database.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration de la base de données Fashop" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Demander les informations de la base de données
$dbName = Read-Host "Nom de la base de données (par défaut: fashop_db)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "fashop_db"
}

$dbUser = Read-Host "Nom d'utilisateur MySQL (par défaut: root)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "root"
}

$dbPassword = Read-Host "Mot de passe MySQL" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

$dbHost = Read-Host "Hôte MySQL (par défaut: 127.0.0.1)"
if ([string]::IsNullOrWhiteSpace($dbHost)) {
    $dbHost = "127.0.0.1"
}

$dbPort = Read-Host "Port MySQL (par défaut: 3306)"
if ([string]::IsNullOrWhiteSpace($dbPort)) {
    $dbPort = "3306"
}

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Base de données: $dbName"
Write-Host "  Utilisateur: $dbUser"
Write-Host "  Hôte: $dbHost"
Write-Host "  Port: $dbPort"
Write-Host ""

$confirm = Read-Host "Confirmer? (O/N)"
if ($confirm -ne "O" -and $confirm -ne "o") {
    Write-Host "Annulé." -ForegroundColor Red
    exit
}

# Mettre à jour le fichier .env
Write-Host ""
Write-Host "Mise à jour du fichier .env..." -ForegroundColor Green

$envFile = ".env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    
    # Remplacer les valeurs
    $content = $content -replace "DB_DATABASE=.*", "DB_DATABASE=$dbName"
    $content = $content -replace "DB_USERNAME=.*", "DB_USERNAME=$dbUser"
    $content = $content -replace "DB_PASSWORD=.*", "DB_PASSWORD=$dbPasswordPlain"
    $content = $content -replace "DB_HOST=.*", "DB_HOST=$dbHost"
    $content = $content -replace "DB_PORT=.*", "DB_PORT=$dbPort"
    
    Set-Content -Path $envFile -Value $content -NoNewline
    Write-Host "✓ Fichier .env mis à jour" -ForegroundColor Green
} else {
    Write-Host "✗ Fichier .env non trouvé!" -ForegroundColor Red
    exit
}

# Générer la clé d'application
Write-Host ""
Write-Host "Génération de la clé d'application..." -ForegroundColor Green
php artisan key:generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Clé d'application générée" -ForegroundColor Green
} else {
    Write-Host "✗ Erreur lors de la génération de la clé" -ForegroundColor Red
}

# Instructions pour créer la base de données
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Étapes suivantes:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Créez la base de données MySQL:" -ForegroundColor Yellow
Write-Host "   mysql -u $dbUser -p -e `"CREATE DATABASE $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`"" -ForegroundColor White
Write-Host ""
Write-Host "   OU via phpMyAdmin:" -ForegroundColor Yellow
Write-Host "   - Allez sur http://localhost/phpmyadmin" -ForegroundColor White
Write-Host "   - Créez une nouvelle base de données: $dbName" -ForegroundColor White
Write-Host "   - Interclassement: utf8mb4_unicode_ci" -ForegroundColor White
Write-Host ""
Write-Host "2. Exécutez les migrations:" -ForegroundColor Yellow
Write-Host "   php artisan migrate" -ForegroundColor White
Write-Host ""
Write-Host "3. Créez l'utilisateur admin:" -ForegroundColor Yellow
Write-Host "   php artisan db:seed --class=AdminUserSeeder" -ForegroundColor White
Write-Host ""
Write-Host "   OU exécutez tous les seeders:" -ForegroundColor Yellow
Write-Host "   php artisan db:seed" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan


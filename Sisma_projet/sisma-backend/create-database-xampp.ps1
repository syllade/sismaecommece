# Script pour créer la base de données avec XAMPP MySQL
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Création de la base de données Fashop" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"

if (-not (Test-Path $mysqlPath)) {
    Write-Host "✗ MySQL non trouvé dans C:\xampp\mysql\bin\" -ForegroundColor Red
    Write-Host ""
    Write-Host "Essayez d'utiliser la commande Artisan:" -ForegroundColor Yellow
    Write-Host "  php artisan db:create" -ForegroundColor White
    exit
}

# Lire la configuration depuis .env
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "✗ Fichier .env non trouvé!" -ForegroundColor Red
    exit
}

$envContent = Get-Content $envFile -Raw
$dbName = ($envContent | Select-String -Pattern "DB_DATABASE=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
$dbUser = ($envContent | Select-String -Pattern "DB_USERNAME=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
$dbPassword = ($envContent | Select-String -Pattern "DB_PASSWORD=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()

if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "fashop_db"
}
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "root"
}

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Base de données: $dbName"
Write-Host "  Utilisateur: $dbUser"
Write-Host ""

# Construire la commande SQL
$sqlCommand = "CREATE DATABASE IF NOT EXISTS \`$dbName\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Construire les arguments MySQL
$mysqlArgs = @()
$mysqlArgs += "-u$dbUser"

if (-not [string]::IsNullOrWhiteSpace($dbPassword)) {
    $mysqlArgs += "-p$dbPassword"
}

$mysqlArgs += "-e"
$mysqlArgs += $sqlCommand

Write-Host "Création de la base de données..." -ForegroundColor Green

try {
    $process = Start-Process -FilePath $mysqlPath -ArgumentList $mysqlArgs -NoNewWindow -Wait -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✓ Base de données '$dbName' créée avec succès!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Vous pouvez maintenant exécuter:" -ForegroundColor Cyan
        Write-Host "  php artisan migrate" -ForegroundColor White
    } else {
        Write-Host "✗ Erreur lors de la création" -ForegroundColor Red
        Write-Host ""
        Write-Host "Essayez la méthode alternative:" -ForegroundColor Yellow
        Write-Host "  php artisan db:create" -ForegroundColor White
    }
} catch {
    Write-Host "✗ Erreur: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Essayez la méthode alternative:" -ForegroundColor Yellow
    Write-Host "  php artisan db:create" -ForegroundColor White
}


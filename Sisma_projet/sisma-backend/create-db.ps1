# Script PowerShell pour créer la base de données MySQL
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Création de la base de données Fashop" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Lire les informations depuis .env
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "✗ Fichier .env non trouvé!" -ForegroundColor Red
    exit
}

$envContent = Get-Content $envFile -Raw
$dbName = ($envContent | Select-String -Pattern "DB_DATABASE=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
$dbUser = ($envContent | Select-String -Pattern "DB_USERNAME=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
$dbPassword = ($envContent | Select-String -Pattern "DB_PASSWORD=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
$dbHost = ($envContent | Select-String -Pattern "DB_HOST=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()

if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "fashop_db"
}

Write-Host "Configuration détectée:" -ForegroundColor Yellow
Write-Host "  Base de données: $dbName"
Write-Host "  Utilisateur: $dbUser"
Write-Host "  Hôte: $dbHost"
Write-Host ""

# Demander le mot de passe MySQL si nécessaire
if ([string]::IsNullOrWhiteSpace($dbPassword)) {
    Write-Host "Aucun mot de passe configuré dans .env" -ForegroundColor Yellow
    $usePassword = Read-Host "MySQL nécessite-t-il un mot de passe? (O/N)"
    if ($usePassword -eq "O" -or $usePassword -eq "o") {
        $mysqlPassword = Read-Host "Entrez le mot de passe MySQL" -AsSecureString
        $dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword)
        )
    }
}

Write-Host ""
Write-Host "Création de la base de données..." -ForegroundColor Green

# Construire la commande MySQL
$mysqlCmd = "mysql"
$mysqlArgs = @()

if (-not [string]::IsNullOrWhiteSpace($dbUser)) {
    $mysqlArgs += "-u$dbUser"
}

if (-not [string]::IsNullOrWhiteSpace($dbPassword)) {
    $mysqlArgs += "-p$dbPassword"
}

$mysqlArgs += "-e"
$mysqlArgs += "CREATE DATABASE IF NOT EXISTS \`$dbName\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

try {
    $process = Start-Process -FilePath $mysqlCmd -ArgumentList $mysqlArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput "mysql_output.txt" -RedirectStandardError "mysql_error.txt"
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✓ Base de données '$dbName' créée avec succès!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Vous pouvez maintenant exécuter:" -ForegroundColor Cyan
        Write-Host "  php artisan migrate" -ForegroundColor White
    } else {
        Write-Host "✗ Erreur lors de la création de la base de données" -ForegroundColor Red
        if (Test-Path "mysql_error.txt") {
            Write-Host "Détails:" -ForegroundColor Yellow
            Get-Content "mysql_error.txt"
        }
        Write-Host ""
        Write-Host "Essayez de créer la base de données manuellement:" -ForegroundColor Yellow
        Write-Host "  mysql -u $dbUser -p" -ForegroundColor White
        Write-Host "  CREATE DATABASE $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -ForegroundColor White
    }
} catch {
    Write-Host "✗ Erreur: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Méthode alternative - Créez la base de données manuellement:" -ForegroundColor Yellow
    Write-Host "  1. Ouvrez MySQL:" -ForegroundColor White
    Write-Host "     mysql -u $dbUser -p" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Exécutez:" -ForegroundColor White
    Write-Host "     CREATE DATABASE $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -ForegroundColor Gray
    Write-Host "     EXIT;" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Puis exécutez:" -ForegroundColor White
    Write-Host "     php artisan migrate" -ForegroundColor Gray
}

# Nettoyer les fichiers temporaires
if (Test-Path "mysql_output.txt") { Remove-Item "mysql_output.txt" -ErrorAction SilentlyContinue }
if (Test-Path "mysql_error.txt") { Remove-Item "mysql_error.txt" -ErrorAction SilentlyContinue }


# Script pour configurer le mot de passe MySQL dans .env
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration du mot de passe MySQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$password = Read-Host "Entrez votre mot de passe MySQL (laissez vide si pas de mot de passe)" -AsSecureString
$passwordPlain = ""

if ($password.Length -gt 0) {
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    )
}

$envFile = ".env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    $content = $content -replace "DB_PASSWORD=.*", "DB_PASSWORD=$passwordPlain"
    Set-Content -Path $envFile -Value $content -NoNewline
    
    Write-Host ""
    Write-Host "✓ Mot de passe configuré dans .env" -ForegroundColor Green
    Write-Host ""
    Write-Host "Configuration actuelle:" -ForegroundColor Yellow
    Get-Content $envFile | Select-String "DB_"
    Write-Host ""
    Write-Host "Vous pouvez maintenant exécuter:" -ForegroundColor Cyan
    Write-Host "  php artisan migrate" -ForegroundColor White
} else {
    Write-Host "✗ Fichier .env non trouvé!" -ForegroundColor Red
}


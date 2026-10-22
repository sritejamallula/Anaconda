# PowerShell build and launch script for Realistic Anaconda
Write-Host "===================================================================" -ForegroundColor Green
Write-Host " REALISTIC ANACONDA: AMAZON RAINFOREST SURVIVAL" -ForegroundColor Yellow
Write-Host " Compiling and Launching Java Application..." -ForegroundColor Cyan
Write-Host "==================================================================="

if (!(Test-Path -Path "bin")) {
    New-Item -ItemType Directory -Path "bin" | Out-Null
}

$sources = Get-ChildItem -Path "src" -Filter "*.java" -Recurse | Select-Object -ExpandProperty FullName
javac -d bin -encoding UTF-8 $sources

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Compilation successful! Launching game..." -ForegroundColor Green
    java -cp bin Main
} else {
    Write-Host "[ERROR] Compilation failed!" -ForegroundColor Red
}

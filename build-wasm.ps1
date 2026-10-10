# Build script for Aniimax WASM on Windows (PowerShell)
$ErrorActionPreference = "Stop"

# Ensure cargo/wasm-pack is in PATH
$cargoBin = "$env:USERPROFILE\.cargo\bin"
if (Test-Path $cargoBin) {
    if (-not ($env:PATH -split ';' -contains $cargoBin)) {
        $env:PATH = "$cargoBin;$env:PATH"
    }
}

Write-Host "Building Aniimax WASM..." -ForegroundColor Cyan

# Check if wasm-pack is installed
if (-not (Get-Command "wasm-pack" -ErrorAction SilentlyContinue)) {
    Write-Host "wasm-pack not found. Please install it with: cargo install wasm-pack" -ForegroundColor Red
    exit 1
}

# Build WASM
wasm-pack build --target web --out-dir web/pkg

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild complete successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To test locally in browser:" -ForegroundColor Yellow
    Write-Host "  python -m http.server 8080 --directory web"
    Write-Host "  Then open http://localhost:8080 in your browser"
} else {
    Write-Host "`nBuild failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

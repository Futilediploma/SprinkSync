# Docker Troubleshooting for SprinkSync
# PowerShell script to diagnose and fix Docker issues

Write-Host "=== SprinkSync Docker Troubleshooting ===" -ForegroundColor Blue

# Step 1: Check Docker Desktop
Write-Host "1. Checking Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   Docker is running: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop from the Windows Start Menu" -ForegroundColor Yellow
    Write-Host "   Wait for the Docker whale icon to appear in your system tray" -ForegroundColor Yellow
    exit 1
}

# Step 2: Check Docker Compose
Write-Host "2. Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version
    Write-Host "   Docker Compose is available: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Docker Compose not found!" -ForegroundColor Red
    exit 1
}

# Step 3: Check for running containers
Write-Host "3. Checking existing containers..." -ForegroundColor Yellow
$containers = docker ps -a --format "table {{.Names}}`t{{.Status}}"
if ($containers) {
    Write-Host "   Existing containers:" -ForegroundColor Cyan
    Write-Host $containers
} else {
    Write-Host "   No existing containers found" -ForegroundColor Green
}

# Step 4: Clean up if needed
Write-Host "4. Cleaning up stopped containers..." -ForegroundColor Yellow
docker container prune -f
Write-Host "   Cleanup complete" -ForegroundColor Green

# Step 5: Check disk space
Write-Host "5. Checking Docker disk usage..." -ForegroundColor Yellow
docker system df

# Step 6: Test image pull
Write-Host "6. Testing PostgreSQL image..." -ForegroundColor Yellow
try {
    docker pull postgres:15
    Write-Host "   PostgreSQL image available" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Cannot pull PostgreSQL image" -ForegroundColor Red
    Write-Host "   Check your internet connection" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Troubleshooting Complete ===" -ForegroundColor Blue
Write-Host "If all checks passed, try running:" -ForegroundColor Green
Write-Host "   .\start.ps1 development" -ForegroundColor White

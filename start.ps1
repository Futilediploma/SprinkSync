# SprinkSync Environment Startup Script (PowerShell)
# Usage: .\start.ps1 [development|production]

param(
    [string]$Environment = "development"
)

Write-Host "Starting SprinkSync in $Environment mode..." -ForegroundColor Green

switch ($Environment) {
    "development" {
        Write-Host "Using development configuration" -ForegroundColor Yellow
        $env:ENVIRONMENT = "development"
        Write-Host "Starting Docker containers..." -ForegroundColor Blue
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
        Write-Host "Development environment started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your SprinkSync Development Environment:" -ForegroundColor Cyan
        Write-Host "   Frontend:    http://localhost:3000" -ForegroundColor White
        Write-Host "   Backend API: http://localhost:8000" -ForegroundColor White
        Write-Host "   API Docs:    http://localhost:8000/docs" -ForegroundColor White
        Write-Host "   Database:    localhost:5432" -ForegroundColor White
    }
    
    "production" {
        Write-Host "Using production configuration" -ForegroundColor Red
        $env:ENVIRONMENT = "production"
        Write-Host "Starting Docker containers..." -ForegroundColor Blue
        docker-compose up -d
        Write-Host "Production environment started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your SprinkSync Production Environment:" -ForegroundColor Cyan
        Write-Host "   Website: https://sprinksync.com" -ForegroundColor White
    }
    
    default {
        Write-Host "Invalid environment: $Environment" -ForegroundColor Red
        Write-Host "Usage: .\start.ps1 [development|production]" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Container Status:" -ForegroundColor Blue
docker ps

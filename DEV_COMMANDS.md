# SprinkSync Development Commands
# PowerShell commands for easy development

## 🚀 Quick Start Development

### Full Docker Development (Recommended)
```powershell
# Start everything in development mode
.\start.ps1 development

# Check if everything is running
docker ps

# View logs
docker logs sprinksync-backend-1
docker logs sprinksync-frontend-1
```

### Local Development (Frontend only)
```powershell
# Start just the backend in Docker
docker-compose up db backend -d

# Start frontend locally
cd frontend
npm run dev
```

### Test Against Production API
```powershell
# Copy production env file
Copy-Item "frontend\.env.production" "frontend\.env.local"

# Start frontend
cd frontend
npm run dev
```

## 🧪 Testing Commands

### Test Backend API
```powershell
# Health check
curl http://localhost:8000/api/health

# Test login (replace with real credentials)
curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d '{\"email\":\"test@example.com\",\"password\":\"test123\"}'
```

### Test Frontend
```powershell
# Open in browser
Start-Process "http://localhost:3000"

# Check build
cd frontend
npm run build
```

## 🔧 Database Commands

### View Development Database
```powershell
# Access SQLite database (development)
sqlite3 backend/sprinksync_dev.db
# .tables
# .schema users
# .quit

# Access PostgreSQL (if using Docker)
docker exec -it sprinksync-db-1 psql -U postgres -d sprinksync_production
```

## 🐳 Docker Commands

### Development
```powershell
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Stop all containers
docker-compose down

# Rebuild containers
docker-compose up -d --build

# View logs
docker logs -f sprinksync-backend-1
```

### Production Testing
```powershell
# Start production environment locally
docker-compose up -d

# Stop production
docker-compose down
```

## 🔄 Environment Switching

### Switch to Development
```powershell
$env:ENVIRONMENT = "development"
Copy-Item "frontend\.env.development" "frontend\.env.local"
```

### Switch to Production Testing
```powershell
$env:ENVIRONMENT = "production"  
Copy-Item "frontend\.env.production" "frontend\.env.local"
```

## 🎯 Your Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432 (PostgreSQL) or backend/sprinksync_dev.db (SQLite)

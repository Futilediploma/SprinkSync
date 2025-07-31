# 🚀 SprinkSync Complete Setup & Development Guide

## 📋 Prerequisites

- **Docker & Docker Compose** installed
- **Node.js 18+** for frontend development
- **Python 3.9+** for backend development
- **Git** for version control

## 🏗️ Initial Setup

### 1. Clone and Setup
```bash
git clone https://github.com/futilediploma/SprinkSync.git
cd SprinkSync
```

### 2. Environment Configuration
```bash
# Backend environment files are already configured:
# - .env.development (SQLite, debug mode)  
# - .env.production (PostgreSQL, secure)

# Frontend environment files:
# - .env.development (localhost API)
# - .env.production (production API)
```

## 🧪 Development Workflow

### Option 1: Full Docker Development (Recommended)
```powershell
# Start development environment
.\start.ps1 development

# Access your app:
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### Option 2: Local Frontend + Docker Backend
```powershell
# Start backend services only
docker-compose up db backend -d

# Start frontend locally
cd frontend
npm install
npm run dev
```

### Option 3: Test Against Production API
```powershell
# Copy production env
Copy-Item "frontend\.env.production" "frontend\.env.local"

# Start frontend
cd frontend
npm run dev

# Your frontend will connect to https://sprinksync.com API
```

## 🚀 Production Deployment

### On Your Server
```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy latest changes
./deploy.sh

# Or manually:
git pull origin main
sudo docker compose down
sudo docker compose up -d --build
```

### From Local Machine
```bash
# Push changes to GitHub
git add .
git commit -m "Your changes"
git push origin main

# SSH to server and deploy
ssh futilediploma@192.168.1.31
cd ~/SprinkSync
./deploy.sh
```

## 🔧 Environment Management

### Development
- **Database**: SQLite file (`backend/sprinksync_dev.db`)
- **API**: `http://localhost:8000`
- **Frontend**: `http://localhost:3000`
- **Debug**: Enabled
- **CORS**: Allows localhost

### Production
- **Database**: PostgreSQL in Docker
- **API**: `https://sprinksync.com/api`
- **Frontend**: `https://sprinksync.com`
- **Debug**: Disabled
- **CORS**: Restricted to domain

## 🛠️ Common Development Tasks

### Making Changes
1. **Edit code** in VS Code
2. **Test locally** with `.\start.ps1 development`
3. **Commit changes** to Git
4. **Deploy to server** with `./deploy.sh`

### Database Changes
```bash
# Development (SQLite)
sqlite3 backend/sprinksync_dev.db

# Production (PostgreSQL)
docker exec -it sprinksync-db-1 psql -U postgres -d sprinksync_production
```

### Viewing Logs
```bash
# All containers
docker logs sprinksync-backend-1
docker logs sprinksync-frontend-1
docker logs sprinksync-db-1

# Follow logs in real-time
docker logs -f sprinksync-backend-1
```

## 🧪 Testing

### Backend API
```bash
# Health check
curl http://localhost:8000/api/health

# Login test (replace with real credentials)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Frontend
```bash
# Build test
cd frontend
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🔒 Security Notes

- **Never commit** `.env` files with real secrets
- **Use strong passwords** for production database
- **Keep environment files** separate for dev/prod
- **Regularly update** dependencies

## 📁 Project Structure
```
SprinkSync/
├── backend/
│   ├── .env.development      # Dev environment
│   ├── .env.production       # Prod environment
│   ├── config.py            # Environment loader
│   └── main.py              # FastAPI app
├── frontend/
│   ├── .env.development     # Frontend dev config
│   ├── .env.production      # Frontend prod config
│   └── vite.config.ts       # Vite configuration
├── docker-compose.yml       # Production containers
├── docker-compose.dev.yml   # Development overrides
├── start.ps1               # Environment startup script
└── deploy.sh               # Production deployment script
```

## 🎯 Quick Commands Reference

```powershell
# Development
.\start.ps1 development

# Production deployment
./deploy.sh

# Check status
docker ps

# View logs
docker logs sprinksync-backend-1

# Stop everything
docker-compose down
```

## 🆘 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs sprinksync-backend-1

# Rebuild
docker-compose up -d --build --force-recreate
```

### API Not Responding
```bash
# Check backend logs
docker logs sprinksync-backend-1

# Restart backend
docker-compose restart backend
```

### Frontend Can't Connect to API
1. Check `frontend/.env.local` file
2. Verify API is running: `curl http://localhost:8000/api/health`
3. Check browser console for CORS errors

## ✅ You're All Set!

Your SprinkSync development environment is now complete with:
- ✅ Separate development and production configurations
- ✅ Easy environment switching
- ✅ Automated deployment scripts
- ✅ Comprehensive documentation

**Happy coding! 🎉**

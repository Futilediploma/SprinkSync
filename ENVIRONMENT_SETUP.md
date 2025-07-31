# 🚀 SprinkSync Environment Management

## 📁 Environment Files Structure

```
backend/
├── .env.development     # Development settings (safe for local)
├── .env.production      # Production settings (secure secrets)
├── .env.example         # Template for new developers
└── config.py           # Automatic environment loader
```

## 🔧 How It Works

The system automatically loads the correct environment file based on the `ENVIRONMENT` variable:

- `ENVIRONMENT=development` → loads `.env.development`
- `ENVIRONMENT=production` → loads `.env.production`

## 🧪 Development Setup

### Option 1: Docker Development
```bash
# Start development environment
./start.ps1 development
# or
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Option 2: Local Development
```bash
# Set environment
$env:ENVIRONMENT = "development"  # PowerShell
export ENVIRONMENT=development    # Bash

# Start backend
cd backend
uvicorn main:app --reload

# Start frontend  
cd frontend
npm run dev
```

## 🚀 Production Deployment

```bash
# On your server
export ENVIRONMENT=production
docker-compose up -d
```

## ✅ Benefits

### 🔐 Security
- **Development**: Uses SQLite, weak secrets, debug enabled
- **Production**: Uses PostgreSQL, strong secrets, security headers

### ⚙️ Flexibility  
- **Development**: CORS allows localhost, rate limiting relaxed
- **Production**: CORS restricted to domain, strict rate limiting

### 🧪 Testing
- **Development**: Debug logs, fake email, relaxed file limits
- **Production**: Info logs, real email, strict file validation

## 🎯 Quick Commands

```bash
# Development
./start.ps1 development

# Production  
./start.ps1 production

# Check status
docker ps

# View logs
docker logs sprinksync-backend-1
```

## 🔍 Environment Variables Reference

| Variable | Development | Production |
|----------|-------------|------------|
| `DATABASE_URL` | SQLite file | PostgreSQL container |
| `DEBUG` | `true` | `false` |
| `ALLOWED_ORIGINS` | `localhost:3000` | `sprinksync.com` |
| `LOG_LEVEL` | `DEBUG` | `INFO` |
| `RATE_LIMIT_PER_MINUTE` | `1000` | `60` |

## 🛠️ Adding New Environment Variables

1. Add to both `.env.development` and `.env.production`
2. Add to `config.py` Settings class
3. Update `.env.example` with safe example values

## 🎉 Your Setup Is Now Complete!

- ✅ Separate development and production configurations
- ✅ Automatic environment detection
- ✅ Easy startup scripts
- ✅ Secure secrets management
- ✅ Docker support for both environments

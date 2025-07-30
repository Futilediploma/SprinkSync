# Domain Setup Guide: sprinksync.com 🌐

## ✅ Configuration Updated

I've updated your PMai application to work with your domain `sprinksync.com`. Here's what was configured:

### Updated Files:
1. **`backend/.env`** - Production CORS settings for sprinksync.com
2. **`backend/.env.production`** - Template updated for your domain
3. **`nginx.production.conf`** - Web server configuration for sprinksync.com

## 🔧 What's Configured

### CORS Settings ✅
```bash
ALLOWED_ORIGINS=https://sprinksync.com,https://www.sprinksync.com,http://localhost:3000,http://localhost:5173
```

### Email Settings ✅
```bash
EMAIL_FROM=noreply@sprinksync.com
```

### Nginx Configuration ✅
- Server names: `sprinksync.com` and `www.sprinksync.com`
- SSL certificates: `/etc/letsencrypt/live/sprinksync.com/`
- HTTPS redirect from HTTP

## 🚀 Deployment Steps Required

### 1. **Domain DNS Setup** (Required)
Point your domain to your server:
```
A Record: sprinksync.com → YOUR_SERVER_IP
A Record: www.sprinksync.com → YOUR_SERVER_IP
```

### 2. **SSL Certificate Setup** (Required)
Install Let's Encrypt SSL certificate:
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate for your domain
sudo certbot --nginx -d sprinksync.com -d www.sprinksync.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### 3. **Server Deployment** (Required)
Deploy your application to the server:

**Option A: Docker Deployment (Recommended)**
```bash
# Clone your repository on the server
git clone https://github.com/futilediploma/SprinkSync.git
cd SprinkSync

# Copy production environment
cp backend/.env.production backend/.env

# Update database credentials in .env
nano backend/.env

# Deploy with Docker
docker-compose up -d
```

**Option B: Manual Deployment**
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm install
npm run build
# Copy dist/ to /var/www/sprinksync/
```

### 4. **Database Setup** (Required)
Set up PostgreSQL database:
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE sprinksync_production;
CREATE USER sprinksync_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE sprinksync_production TO sprinksync_user;
\q

# Update DATABASE_URL in your .env file
DATABASE_URL=postgresql://sprinksync_user:your_strong_password@localhost:5432/sprinksync_production
```

### 5. **Nginx Setup** (Required)
```bash
# Copy nginx configuration
sudo cp nginx.production.conf /etc/nginx/sites-available/sprinksync
sudo ln -s /etc/nginx/sites-available/sprinksync /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## 🔒 Security Checklist for Production

### ✅ Already Configured:
- [x] Strong secret keys generated
- [x] CORS configured for sprinksync.com
- [x] Production environment settings
- [x] Security headers in nginx
- [x] Password validation implemented
- [x] Input sanitization added
- [x] Security middleware enabled

### 🔧 Still Need to Configure:
- [ ] SSL certificate installation
- [ ] PostgreSQL database setup
- [ ] Email SMTP credentials (for user invitations)
- [ ] Server deployment
- [ ] DNS records pointing to your server

## 📋 Environment Variables to Update

Update these in your production `.env` file:

```bash
# Database - Replace with your actual PostgreSQL credentials
DATABASE_URL=postgresql://sprinksync_user:YOUR_STRONG_PASSWORD@localhost:5432/sprinksync_production

# Email - Replace with your actual email credentials
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@sprinksync.com
```

## 🌐 Access Points After Deployment

Once deployed, your application will be accessible at:

- **Frontend**: https://sprinksync.com
- **API**: https://sprinksync.com/api
- **Health Check**: https://sprinksync.com/api/health
- **API Documentation**: https://sprinksync.com/docs

## 🚨 Important Notes

1. **SSL Required**: Your domain MUST have SSL certificates for the application to work properly
2. **Database Migration**: You'll need to migrate from SQLite to PostgreSQL for production
3. **Email Setup**: Configure SMTP credentials if you want user invitation functionality
4. **Server Resources**: Ensure your server has adequate resources (2GB+ RAM recommended)

## ✅ Ready for Deployment

Your application is now configured for `sprinksync.com` and ready for production deployment! The main remaining tasks are:

1. Set up your server with the domain pointing to it
2. Install SSL certificates
3. Deploy the application code
4. Configure the production database

Would you like help with any of these deployment steps?

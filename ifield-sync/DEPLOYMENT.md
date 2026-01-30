# Production Deployment Guide

This guide covers deploying iField Sync to production.

## Overview

You'll need to deploy two components:
1. **Backend** (FastAPI Python application)
2. **Frontend** (React static files)

## Backend Deployment Options

### Option 1: Railway (Easiest)

1. **Create account at railway.app**

2. **Create new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Configure settings**:
   - Set root directory: `backend`
   - Add environment variables from `.env`
   - Add start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Deploy**:
   - Railway will auto-deploy
   - Note your backend URL (e.g., `https://yourapp.railway.app`)

### Option 2: DigitalOcean App Platform

1. **Create Droplet** or use App Platform

2. **Install requirements**:
   ```bash
   ssh into server
   sudo apt update
   sudo apt install python3-pip python3-venv nginx
   ```

3. **Deploy application**:
   ```bash
   git clone your-repo
   cd ifield-sync/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install gunicorn
   ```

4. **Create systemd service** (`/etc/systemd/system/ifield-sync.service`):
   ```ini
   [Unit]
   Description=iField Sync API
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/path/to/ifield-sync/backend
   Environment="PATH=/path/to/ifield-sync/backend/venv/bin"
   ExecStart=/path/to/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000

   [Install]
   WantedBy=multi-user.target
   ```

5. **Configure nginx** (`/etc/nginx/sites-available/ifield-sync`):
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

6. **Enable and start**:
   ```bash
   sudo systemctl enable ifield-sync
   sudo systemctl start ifield-sync
   sudo systemctl enable nginx
   sudo systemctl restart nginx
   ```

### Option 3: AWS EC2

Similar to DigitalOcean but:
- Launch EC2 instance (Ubuntu 22.04 recommended)
- Configure security groups (ports 80, 443, 22)
- Follow DigitalOcean steps above
- Consider using RDS for PostgreSQL database

## Frontend Deployment Options

### Option 1: Netlify (Recommended)

1. **Build the app**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**:
   - Go to netlify.com
   - Drag and drop the `dist/` folder
   - Or connect GitHub repo

3. **Configure**:
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variable: `VITE_API_URL=https://your-backend-url.com`

4. **Configure redirects** (create `frontend/public/_redirects`):
   ```
   /api/*  https://your-backend-url.com/api/:splat  200
   /*  /index.html  200
   ```

### Option 2: Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure environment**:
   - Add `VITE_API_URL` in Vercel dashboard
   - Configure rewrites for API proxy

### Option 3: AWS S3 + CloudFront

1. **Build**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Create S3 bucket**:
   - Enable static website hosting
   - Upload `dist/` contents
   - Configure bucket policy for public access

3. **Create CloudFront distribution**:
   - Point to S3 bucket
   - Configure custom domain
   - Set up SSL certificate

## Database Migration to PostgreSQL (Recommended for Production)

### 1. Install PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib
```

### 2. Create database

```bash
sudo -u postgres psql
CREATE DATABASE ifield_sync;
CREATE USER ifield_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ifield_sync TO ifield_user;
\q
```

### 3. Update backend requirements

Add to `requirements.txt`:
```
psycopg2-binary==2.9.9
```

### 4. Update .env

```env
DATABASE_URL=postgresql://ifield_user:secure_password@localhost/ifield_sync
```

### 5. Migrate data (if needed)

```python
# Create migration script if you have existing SQLite data
# Or start fresh with PostgreSQL
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Auto-renewal:
```bash
sudo certbot renew --dry-run
```

## Environment Variables for Production

### Backend (.env)

```env
# Database (use PostgreSQL in production)
DATABASE_URL=postgresql://user:pass@host/dbname

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-production-email@company.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@company.com
DEFAULT_EMAIL_TO=office@company.com

# ProjectSight
PROJECTSIGHT_API_KEY=your-production-api-key
PROJECTSIGHT_API_URL=https://api.projectsight.com/v1
PROJECTSIGHT_PROJECT_ID=your-project-id

# Application
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SECRET_KEY=generate-a-strong-random-secret-key-here
```

### Frontend

Update `vite.config.ts` for production:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

## Monitoring and Maintenance

### 1. Setup Logging

Backend logs:
```bash
# View logs
sudo journalctl -u ifield-sync -f

# Or use a logging service
pip install python-json-logger
```

### 2. Database Backups

Automated PostgreSQL backups:
```bash
#!/bin/bash
# backup.sh
pg_dump -U ifield_user ifield_sync > backup_$(date +%Y%m%d).sql
```

Add to cron:
```bash
0 2 * * * /path/to/backup.sh
```

### 3. Monitoring

Consider:
- Uptime monitoring: UptimeRobot, Pingdom
- Error tracking: Sentry
- Analytics: Google Analytics, Plausible

### 4. Updates

```bash
cd ifield-sync
git pull
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart ifield-sync
cd ../frontend
npm install
npm run build
# Upload new build to hosting
```

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set strong SECRET_KEY
- [ ] Use environment variables (never commit secrets)
- [ ] Enable CORS only for your domain
- [ ] Use PostgreSQL with strong password
- [ ] Regular backups
- [ ] Keep dependencies updated
- [ ] Monitor logs for suspicious activity
- [ ] Rate limiting (consider adding nginx rate limiting)
- [ ] Firewall configured (UFW on Ubuntu)

## Performance Optimization

### Backend

1. **Add caching**:
   ```bash
   pip install aiocache
   ```

2. **Database connection pooling** (included with SQLAlchemy)

3. **Use Gunicorn with multiple workers**:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```

### Frontend

1. **Enable gzip compression** (nginx):
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

2. **Add caching headers**:
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

## Troubleshooting Production Issues

### Backend won't start
```bash
# Check logs
sudo journalctl -u ifield-sync -n 50

# Check if port is in use
sudo lsof -i :8000

# Test manually
cd backend
source venv/bin/activate
python main.py
```

### Database connection errors
```bash
# Test PostgreSQL connection
psql -U ifield_user -d ifield_sync -h localhost

# Check credentials in .env
cat .env | grep DATABASE_URL
```

### Frontend not connecting to backend
- Check CORS settings in backend
- Verify API proxy configuration
- Check browser console for errors
- Test API directly: `curl https://api.yourdomain.com/api/health`

## Scaling Considerations

As your usage grows:

1. **Horizontal scaling**:
   - Use load balancer (nginx, AWS ALB)
   - Run multiple backend instances
   - Use managed database (AWS RDS, DigitalOcean Managed DB)

2. **Vertical scaling**:
   - Increase server resources
   - Optimize database queries
   - Add Redis for caching

3. **CDN**:
   - Use CloudFront, Cloudflare for static assets
   - Reduce backend load

## Support

For deployment issues:
- Check application logs
- Review nginx/apache logs
- Test API endpoints directly
- Verify environment variables
- Check firewall rules

---

**Remember**: Test thoroughly in a staging environment before deploying to production!

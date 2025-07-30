# Cloudflare Setup Guide for SprinkSync

## Prerequisites
1. Domain `sprinksync.com` added to Cloudflare
2. Linux server with nginx installed
3. FastAPI backend running on port 8000

## Step 1: Cloudflare Dashboard Configuration

### SSL/TLS Settings
1. Go to SSL/TLS → Overview
2. Set encryption mode to **"Full (strict)"** for maximum security
3. Enable **"Always Use HTTPS"**

### SSL/TLS → Origin Server
1. Click **"Create Certificate"**
2. Choose **"Let Cloudflare generate a private key and a CSR"**
3. Add hostnames: `sprinksync.com`, `*.sprinksync.com`
4. Choose key type: **RSA (2048)**
5. Certificate validity: **15 years**
6. Download both files:
   - Origin Certificate → save as `/etc/ssl/cloudflare/sprinksync.com.pem`
   - Private Key → save as `/etc/ssl/cloudflare/sprinksync.com.key`

### Security Settings
1. **Security Level**: Medium or High
2. **Bot Fight Mode**: Enable
3. **Challenge Passage**: 30 minutes
4. **Browser Integrity Check**: Enable

### Speed Settings
1. **Auto Minify**: Enable CSS, HTML, JavaScript
2. **Brotli**: Enable
3. **Early Hints**: Enable
4. **HTTP/2**: Enable
5. **HTTP/3**: Enable

### Caching
1. **Caching Level**: Standard
2. **Browser Cache TTL**: 4 hours (for development) or 1 month (for production)

## Step 2: DNS Configuration

Set up these DNS records in Cloudflare:

```
Type    Name              Content              Proxy Status
A       sprinksync.com    YOUR_SERVER_IP       Proxied (orange cloud)
CNAME   www               sprinksync.com       Proxied (orange cloud)
A       api               YOUR_SERVER_IP       Proxied (optional)
```

## Step 3: Page Rules (Optional but Recommended)

Create these page rules in Cloudflare:

1. **API Caching Rule**
   - URL: `sprinksync.com/api/*`
   - Settings: Cache Level = Bypass

2. **Static Assets Caching**
   - URL: `sprinksync.com/*.js` or `sprinksync.com/*.css`
   - Settings: Cache Level = Cache Everything, Edge Cache TTL = 1 month

## Step 4: Firewall Rules

### Rate Limiting Rules
1. **API Rate Limit**
   - Expression: `(http.request.uri.path matches "/api/")`
   - Rate: 100 requests per minute per IP
   - Action: Block for 1 hour

2. **Login Rate Limit**
   - Expression: `(http.request.uri.path eq "/api/auth/login")`
   - Rate: 5 requests per minute per IP
   - Action: Block for 10 minutes

### Security Rules
1. **Block Bad Bots**
   - Expression: `(cf.bot_management.score lt 30)`
   - Action: Block

2. **Geographic Restrictions** (if needed)
   - Expression: `(ip.geoip.country ne "US" and ip.geoip.country ne "CA")`
   - Action: Challenge or Block

## Step 5: Linux Server Setup

### 1. Install SSL certificates
```bash
sudo mkdir -p /etc/ssl/cloudflare
sudo chmod 700 /etc/ssl/cloudflare

# Upload your Cloudflare Origin Certificate files
sudo nano /etc/ssl/cloudflare/sprinksync.com.pem
sudo nano /etc/ssl/cloudflare/sprinksync.com.key
sudo chmod 600 /etc/ssl/cloudflare/*
```

### 2. Deploy nginx configuration
```bash
# Copy the nginx.cloudflare.conf content to your server
sudo nano /etc/nginx/sites-available/sprinksync

# Enable the site
sudo ln -sf /etc/nginx/sites-available/sprinksync /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Deploy your application
```bash
# Frontend - upload React build to /var/www/sprinksync/dist/
# Backend - ensure FastAPI is running on port 8000

# Check if backend is running
curl http://localhost:8000/api/health
```

## Step 6: Environment Variables for Backend

Update your backend `.env` file:

```bash
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=["https://sprinksync.com", "https://www.sprinksync.com"]
FRONTEND_URL=https://sprinksync.com
SECRET_KEY=your-strong-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/sprinksync
```

## Step 7: Testing

### Test HTTPS redirect
```bash
curl -I http://sprinksync.com
# Should return 301 redirect to https://

curl -I https://sprinksync.com
# Should return 200 OK with security headers
```

### Test API endpoints
```bash
curl https://sprinksync.com/api/health
# Should return {"status":"healthy","service":"construction-management-api"}
```

### Test rate limiting
```bash
# This should eventually get rate limited
for i in {1..10}; do curl https://sprinksync.com/api/auth/login; done
```

## Step 8: Monitoring and Logs

### Nginx logs
```bash
# Monitor access logs
sudo tail -f /var/log/nginx/sprinksync_access.log

# Monitor error logs
sudo tail -f /var/log/nginx/sprinksync_error.log

# Monitor auth attempts
sudo tail -f /var/log/nginx/auth_access.log
```

### Cloudflare Analytics
Monitor these in Cloudflare dashboard:
- Traffic analytics
- Security events
- Performance metrics
- Cache hit ratio

## Step 9: Optional Enhancements

### 1. Fail2ban for additional security
```bash
sudo apt install fail2ban

# Create fail2ban filter for nginx auth failures
sudo nano /etc/fail2ban/filter.d/nginx-auth.conf
```

### 2. Log rotation
```bash
sudo nano /etc/logrotate.d/nginx-sprinksync
```

### 3. Monitoring with Prometheus/Grafana
- Set up nginx-prometheus-exporter
- Monitor response times and error rates

## Troubleshooting

### Common Issues:

1. **502 Bad Gateway**: Backend not running on port 8000
2. **SSL errors**: Check Cloudflare SSL mode and origin certificates
3. **CORS errors**: Verify CORS_ORIGINS in backend configuration
4. **Real IP issues**: Ensure Cloudflare IP ranges are up to date in nginx config

### Useful Commands:
```bash
# Check nginx status
sudo systemctl status nginx

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check if backend is running
sudo netstat -tlnp | grep :8000

# Check Cloudflare connectivity
curl -H "CF-Connecting-IP: 1.2.3.4" https://sprinksync.com/api/health
```

#!/bin/bash

# Setup script for nginx with Cloudflare on Ubuntu/Debian
# Run this script on your Linux server as root or with sudo

echo "Setting up nginx for sprinksync.com with Cloudflare..."

# Update system
apt update

# Install nginx if not already installed
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."
    apt install -y nginx
fi

# Create necessary directories
mkdir -p /var/www/sprinksync/dist
mkdir -p /etc/ssl/cloudflare
mkdir -p /var/log/nginx

# Create the nginx site configuration
echo "Creating nginx site configuration..."
cat > /etc/nginx/sites-available/sprinksync << 'EOF'
# Your nginx.cloudflare.conf content goes here
# Copy the content from the file we just created
EOF

# Remove default nginx site
rm -f /etc/nginx/sites-enabled/default

# Enable the sprinksync site
ln -sf /etc/nginx/sites-available/sprinksync /etc/nginx/sites-enabled/

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid!"
    
    # Reload nginx
    systemctl reload nginx
    
    echo "Nginx has been configured and reloaded."
    echo ""
    echo "Next steps:"
    echo "1. Upload your React build files to /var/www/sprinksync/dist/"
    echo "2. Get Cloudflare Origin Certificate from Cloudflare dashboard"
    echo "3. Save the certificate as /etc/ssl/cloudflare/sprinksync.com.pem"
    echo "4. Save the private key as /etc/ssl/cloudflare/sprinksync.com.key"
    echo "5. Make sure your FastAPI backend is running on port 8000"
    echo "6. Update Cloudflare DNS to point to this server"
    echo ""
    echo "Optional: Set up log rotation for nginx logs"
    echo "Optional: Configure fail2ban for additional security"
else
    echo "Nginx configuration test failed. Please check the configuration."
fi

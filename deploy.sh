#!/bin/bash

# SprinkSync Server Deployment Script
# Run this on your server to deploy updates

set -e  # Exit on any error

echo "🚀 SprinkSync Production Deployment Starting..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Make sure you're in the SprinkSync directory."
    exit 1
fi

# Show current status
echo "📊 Current Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}"

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git fetch origin
git pull origin main

# Stop containers gracefully
echo "⏹️  Stopping containers..."
sudo docker compose down

# Remove old images to free up space (optional)
echo "🧹 Cleaning up old Docker images..."
sudo docker image prune -f

# Rebuild and start containers
echo "🔨 Building and starting containers..."
sudo docker compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check container health
echo "🏥 Checking container health..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test API health
echo "🧪 Testing API health..."
sleep 5  # Give the API a moment to start

if curl -f -s https://sprinksync.com/api/health > /dev/null; then
    echo "✅ API is healthy!"
else
    echo "⚠️  API health check failed - checking logs..."
    docker logs sprinksync-backend-1 --tail 20
fi

# Show final status
echo ""
echo "🎉 Deployment Complete!"
echo "🌐 Your site should be available at: https://sprinksync.com"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker logs sprinksync-backend-1"
echo "  Check status: docker ps"
echo "  Restart: sudo docker compose restart"

echo ""
echo "✅ SprinkSync deployment finished successfully!"

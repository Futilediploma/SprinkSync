#!/bin/bash

# SprinkSync Environment Startup Script
# Usage: ./start.sh [development|production]

ENVIRONMENT=${1:-development}

echo "🚀 Starting SprinkSync in $ENVIRONMENT mode..."

case $ENVIRONMENT in
  "development")
    echo "📝 Using development configuration"
    export ENVIRONMENT=development
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    echo "✅ Development environment started!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8000"
    echo "🗄️  Database: localhost:5432"
    ;;
    
  "production")
    echo "🔒 Using production configuration"
    export ENVIRONMENT=production
    docker-compose up -d
    echo "✅ Production environment started!"
    echo "🌐 Website: https://sprinksync.com"
    ;;
    
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Usage: ./start.sh [development|production]"
    exit 1
    ;;
esac

echo ""
echo "📊 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

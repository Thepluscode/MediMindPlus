#!/bin/bash

echo "🚀 Starting MediMindPlus System..."

# Check dependencies
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  docker-compose not found, trying 'docker compose'..."
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Ensure env vars are set
if [ ! -f .env ]; then
    echo "⚠️  .env not found. Running setup..."
    ./setup_env.sh
fi

echo "🐳 Building and starting containers..."
$DOCKER_COMPOSE up -d --build

echo ""
echo "✅ System Online!"
echo "   - 📱 Mobile App: cd mobile && npx expo start"
echo "   - 🖥️  Web Dashboard: http://localhost:5173"
echo "   - ⚙️  Backend API: http://localhost:3000"
echo "   - 🗄️  Database: localhost:5434"

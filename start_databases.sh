#!/bin/bash

# MediMind Database Services Startup Script
echo "🗄️  Starting MediMind Database Services"
echo "======================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "🐳 Docker is running"

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose -f docker-compose-simple.yml down 2>/dev/null

# Start database services
echo "🚀 Starting PostgreSQL and Redis..."
docker-compose -f docker-compose-simple.yml up postgres redis -d

# Wait for services to be ready
echo "⏳ Waiting for databases to initialize..."
sleep 10

# Check PostgreSQL
echo -n "🐘 Checking PostgreSQL... "
if docker-compose -f docker-compose-simple.yml exec -T postgres pg_isready -U medimind_user -d medimind >/dev/null 2>&1; then
    echo "✅ Ready"
else
    echo "⚠️  Still starting (this is normal for first run)"
fi

# Check Redis
echo -n "🔄 Checking Redis... "
if docker-compose -f docker-compose-simple.yml exec -T redis redis-cli ping >/dev/null 2>&1; then
    echo "✅ Ready"
else
    echo "⚠️  Still starting"
fi

echo ""
echo "📊 Database Status:"
docker-compose -f docker-compose-simple.yml ps

echo ""
echo "🎉 Database services started!"
echo ""
echo "Connection Details:"
echo "PostgreSQL: localhost:5432"
echo "  Database: medimind"
echo "  User: medimind_user"
echo "  Password: medimind_password"
echo ""
echo "Redis: localhost:6379"
echo ""
echo "To stop databases: docker-compose -f docker-compose-simple.yml down"

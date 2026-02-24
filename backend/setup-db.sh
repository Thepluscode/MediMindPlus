#!/bin/bash

# MediMindPlus Database Setup Script
echo "🏥 MediMindPlus Database Setup"
echo "================================"
echo ""

# Check if PostgreSQL is running
if ! pg_isready > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running"
    echo "Please start PostgreSQL first:"
    echo "  brew services start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"
echo ""

# Try to create database without password
echo "Attempting to create database..."
createdb medimind 2>/dev/null && echo "✅ Database 'medimind' created successfully!" || {
    # If that fails, try with postgres user
    echo "Trying with postgres user..."
    psql -U postgres -c "CREATE DATABASE medimind;" 2>/dev/null && echo "✅ Database 'medimind' created!" || {
        echo "⚠️  Could not create database automatically"
        echo ""
        echo "Please run ONE of these commands manually:"
        echo "  1. createdb medimind"
        echo "  2. psql postgres -c \"CREATE DATABASE medimind;\""
        echo "  3. psql -U postgres -c \"CREATE DATABASE medimind;\""
        echo ""
        exit 1
    }
}

echo ""
echo "Running Prisma migrations..."
npx prisma db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup complete!"
    echo "You can now start the backend with: npm run dev"
else
    echo ""
    echo "❌ Migration failed"
    echo ""
    echo "If you see authentication errors, you may need to update your DATABASE_URL in .env"
    echo "Current DATABASE_URL: postgresql://theophilusogieva@localhost:5432/medimind?schema=public"
    echo ""
    echo "Try updating it to:"
    echo "  DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/medimind?schema=public\""
fi

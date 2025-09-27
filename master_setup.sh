#!/bin/bash

# MediMind Master Setup Script
echo "🏥 MediMind Healthcare AI Platform Setup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Make all scripts executable
print_status "Making scripts executable..."
chmod +x test_apis.sh
chmod +x start_databases.sh
chmod +x setup_frontend.sh
chmod +x start_services.sh

echo ""
echo "🎯 Choose what you want to set up:"
echo ""
echo "1) 🧪 Test API endpoints (requires services to be running)"
echo "2) 🗄️  Start database services (PostgreSQL + Redis)"
echo "3) 🎨 Set up frontend (React Native/Expo)"
echo "4) 🚀 Start all services (ML + Backend + Databases)"
echo "5) 📊 Full system status check"
echo "6) 🔧 Advanced features setup"
echo "7) 🎉 Complete setup (everything)"
echo ""
read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        print_status "Testing API endpoints..."
        ./test_apis.sh
        ;;
    2)
        print_status "Starting database services..."
        ./start_databases.sh
        ;;
    3)
        print_status "Setting up frontend..."
        ./setup_frontend.sh
        ;;
    4)
        print_status "Starting all services..."
        ./start_services.sh
        ;;
    5)
        print_status "Checking system status..."
        ./test_apis.sh
        echo ""
        print_status "Checking for running processes..."
        echo "ML Service (port 8001):"
        lsof -i :8001 || echo "  Not running"
        echo "Backend Service (port 3000):"
        lsof -i :3000 || echo "  Not running"
        echo "PostgreSQL (port 5432):"
        lsof -i :5432 || echo "  Not running"
        echo "Redis (port 6379):"
        lsof -i :6379 || echo "  Not running"
        ;;
    6)
        print_status "Setting up advanced features..."
        echo ""
        echo "🔧 Advanced Features Available:"
        echo ""
        echo "a) 🤖 Enhanced ML Models"
        echo "b) 📊 Real-time Analytics Dashboard"
        echo "c) 🔐 Advanced Security Features"
        echo "d) 📱 Mobile Health Integrations"
        echo "e) 🌐 API Documentation & Testing"
        echo ""
        read -p "Select feature (a-e): " feature
        
        case $feature in
            a)
                print_status "Setting up enhanced ML models..."
                # Add ML model enhancements
                echo "Enhanced ML models setup would go here"
                ;;
            b)
                print_status "Setting up analytics dashboard..."
                # Add analytics setup
                echo "Analytics dashboard setup would go here"
                ;;
            c)
                print_status "Setting up security features..."
                # Add security enhancements
                echo "Security features setup would go here"
                ;;
            d)
                print_status "Setting up mobile health integrations..."
                # Add mobile health integrations
                echo "Mobile health integrations setup would go here"
                ;;
            e)
                print_status "Setting up API documentation..."
                print_success "API documentation is available at:"
                echo "  ML Service: http://localhost:8001/docs"
                echo "  Backend: http://localhost:3000/api"
                ;;
            *)
                print_error "Invalid selection"
                ;;
        esac
        ;;
    7)
        print_status "Starting complete setup..."
        echo ""
        
        # Step 1: Start databases
        print_status "Step 1: Starting database services..."
        ./start_databases.sh
        sleep 5
        
        # Step 2: Setup frontend
        print_status "Step 2: Setting up frontend..."
        ./setup_frontend.sh
        
        # Step 3: Test APIs
        print_status "Step 3: Testing API endpoints..."
        ./test_apis.sh
        
        echo ""
        print_success "🎉 Complete setup finished!"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Your ML and Backend services should already be running"
        echo "2. Database services are now running"
        echo "3. Frontend is set up and ready"
        echo ""
        echo "🚀 To start the frontend:"
        echo "   cd frontend && npm start"
        echo ""
        echo "🌐 Access your services:"
        echo "   ML Service: http://localhost:8001/docs"
        echo "   Backend: http://localhost:3000/health"
        echo "   Frontend: Will open when you run 'npm start'"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_success "Setup operation completed!"
echo ""
echo "📚 Quick Reference:"
echo "   Test APIs: ./test_apis.sh"
echo "   Start DBs: ./start_databases.sh"
echo "   Setup Frontend: ./setup_frontend.sh"
echo "   Full Status: ./master_setup.sh (option 5)"

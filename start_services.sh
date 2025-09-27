#!/bin/bash

# MediMind Services Startup Script
echo "🏥 Starting MediMind Services..."
echo "=================================="

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Function to start ML service
start_ml_service() {
    echo ""
    echo "🤖 Starting ML Service..."
    echo "-------------------------"
    
    cd ml-pipeline
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "📦 Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    echo "🔄 Activating virtual environment..."
    source venv/bin/activate
    
    # Install dependencies
    echo "📥 Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Start the service
    echo "🚀 Starting ML service on port 8001..."
    python main.py &
    ML_PID=$!
    echo "ML Service PID: $ML_PID"
    
    cd ..
}

# Function to start backend service
start_backend_service() {
    echo ""
    echo "🖥️  Starting Backend Service..."
    echo "------------------------------"
    
    cd backend
    
    # Install dependencies
    echo "📥 Installing Node.js dependencies..."
    npm install
    
    # Start the service
    echo "🚀 Starting backend service on port 3000..."
    npm run dev &
    BACKEND_PID=$!
    echo "Backend Service PID: $BACKEND_PID"
    
    cd ..
}

# Function to start database services
start_database_services() {
    echo ""
    echo "🗄️  Starting Database Services..."
    echo "--------------------------------"
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker Desktop first."
        return 1
    fi
    
    echo "🐳 Starting PostgreSQL and Redis with Docker..."
    docker-compose -f docker-compose-simple.yml up postgres redis -d
    
    echo "⏳ Waiting for databases to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose -f docker-compose-simple.yml ps | grep -q "Up"; then
        echo "✅ Database services are running"
    else
        echo "❌ Database services failed to start"
        return 1
    fi
}

# Main execution
main() {
    echo "🔍 Checking prerequisites..."
    
    # Check required ports
    check_port 3000 || echo "   Backend may conflict"
    check_port 8001 || echo "   ML service may conflict"
    check_port 5432 || echo "   PostgreSQL may conflict"
    check_port 6379 || echo "   Redis may conflict"
    
    echo ""
    echo "Choose startup option:"
    echo "1) Start all services (databases + ML + backend)"
    echo "2) Start only ML service"
    echo "3) Start only backend service"
    echo "4) Start only database services"
    echo "5) Run setup test"
    echo ""
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            start_database_services
            sleep 5
            start_ml_service
            sleep 3
            start_backend_service
            echo ""
            echo "🎉 All services started!"
            echo "📊 ML Service: http://localhost:8001/health"
            echo "🖥️  Backend: http://localhost:3000/health"
            echo "🗄️  PostgreSQL: localhost:5432"
            echo "🔄 Redis: localhost:6379"
            ;;
        2)
            start_ml_service
            echo ""
            echo "🎉 ML Service started!"
            echo "📊 Health check: http://localhost:8001/health"
            ;;
        3)
            start_backend_service
            echo ""
            echo "🎉 Backend Service started!"
            echo "🖥️  Health check: http://localhost:3000/health"
            ;;
        4)
            start_database_services
            echo ""
            echo "🎉 Database services started!"
            ;;
        5)
            echo "🧪 Running setup test..."
            python3 test_setup.py
            ;;
        *)
            echo "❌ Invalid choice"
            exit 1
            ;;
    esac
    
    if [ "$choice" != "5" ]; then
        echo ""
        echo "💡 Tips:"
        echo "   - Press Ctrl+C to stop services"
        echo "   - Check logs if services don't respond"
        echo "   - Use 'docker-compose down' to stop databases"
        echo ""
        echo "⏳ Services are running. Press Ctrl+C to stop..."
        
        # Wait for user interrupt
        trap 'echo ""; echo "🛑 Stopping services..."; kill $ML_PID $BACKEND_PID 2>/dev/null; docker-compose -f docker-compose-simple.yml down 2>/dev/null; echo "✅ Services stopped"; exit 0' INT
        wait
    fi
}

# Run main function
main

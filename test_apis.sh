#!/bin/bash

# MediMind API Testing Script
echo "🧪 Testing MediMind API Endpoints"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test an endpoint
test_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url" 2>/dev/null)
    status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $status_code)"
        if [ -f /tmp/response.json ]; then
            echo "   Response: $(cat /tmp/response.json | head -c 100)..."
        fi
    else
        echo -e "${RED}❌ FAIL${NC} (Status: $status_code)"
        if [ -f /tmp/response.json ]; then
            echo "   Error: $(cat /tmp/response.json)"
        fi
    fi
    echo ""
}

# Test Backend Service
echo -e "${YELLOW}🖥️  Testing Backend Service (Port 3000)${NC}"
echo "----------------------------------------"
test_endpoint "http://localhost:3000/health" "Backend Health Check"
test_endpoint "http://localhost:3000/api" "Backend API Info"
test_endpoint "http://localhost:3000/" "Backend Root"
test_endpoint "http://localhost:3000/nonexistent" "Backend 404 Test" 404

# Test ML Service
echo -e "${YELLOW}🤖 Testing ML Service (Port 8001)${NC}"
echo "--------------------------------------"
test_endpoint "http://localhost:8001/health" "ML Service Health Check"
test_endpoint "http://localhost:8001/" "ML Service Root"
test_endpoint "http://localhost:8001/docs" "ML Service Documentation"

# Test ML Service Prediction Endpoint (if available)
echo -e "${YELLOW}🔬 Testing ML Prediction Capabilities${NC}"
echo "------------------------------------"

# Create a sample patient data for testing
cat > /tmp/sample_patient.json << EOF
{
  "age": 45,
  "gender": "male",
  "bmi": 28.5,
  "blood_pressure_systolic": 140,
  "blood_pressure_diastolic": 90,
  "cholesterol": 220,
  "glucose": 110,
  "smoking": false,
  "family_history": true
}
EOF

# Test prediction endpoint if it exists
if curl -s http://localhost:8001/predict >/dev/null 2>&1; then
    echo -n "Testing ML Prediction... "
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d @/tmp/sample_patient.json \
        http://localhost:8001/predict 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        echo "   Prediction: $(echo $response | head -c 150)..."
    else
        echo -e "${YELLOW}⚠️  Endpoint not ready${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Prediction endpoint not available yet${NC}"
fi

echo ""
echo -e "${YELLOW}📊 Service Status Summary${NC}"
echo "========================="

# Check if services are running
if curl -s http://localhost:3000/health >/dev/null 2>&1; then
    echo -e "Backend Service:  ${GREEN}✅ Running${NC} (http://localhost:3000)"
else
    echo -e "Backend Service:  ${RED}❌ Not Running${NC}"
fi

if curl -s http://localhost:8001/health >/dev/null 2>&1; then
    echo -e "ML Service:       ${GREEN}✅ Running${NC} (http://localhost:8001)"
else
    echo -e "ML Service:       ${RED}❌ Not Running${NC}"
fi

# Check database services
if nc -z localhost 5432 2>/dev/null; then
    echo -e "PostgreSQL:       ${GREEN}✅ Running${NC} (localhost:5432)"
else
    echo -e "PostgreSQL:       ${YELLOW}⚠️  Not Running${NC}"
fi

if nc -z localhost 6379 2>/dev/null; then
    echo -e "Redis:            ${GREEN}✅ Running${NC} (localhost:6379)"
else
    echo -e "Redis:            ${YELLOW}⚠️  Not Running${NC}"
fi

echo ""
echo -e "${YELLOW}🌐 Quick Access URLs${NC}"
echo "==================="
echo "Backend Health:    http://localhost:3000/health"
echo "Backend API:       http://localhost:3000/api"
echo "ML Service Health: http://localhost:8001/health"
echo "ML Service Docs:   http://localhost:8001/docs"

# Cleanup
rm -f /tmp/response.json /tmp/sample_patient.json

echo ""
echo "🎉 API testing complete!"

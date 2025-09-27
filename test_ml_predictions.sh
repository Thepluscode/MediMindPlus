#!/bin/bash

# MediMind ML Prediction Testing Script
echo "🔬 Testing MediMind AI Prediction Capabilities"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test prediction
test_prediction() {
    local test_name="$1"
    local patient_data="$2"
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    echo "Patient Data: $patient_data"
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$patient_data" \
        http://localhost:8001/predict 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Prediction successful${NC}"
        echo "Response: $(echo $response | head -c 200)..."
    else
        echo -e "${RED}❌ Prediction failed${NC}"
    fi
    echo ""
}

# Test Case 1: High-risk cardiovascular patient
echo -e "${YELLOW}🫀 Test Case 1: High-Risk Cardiovascular Patient${NC}"
test_prediction "High CVD Risk" '{
  "user_id": "patient_001",
  "age": 65,
  "gender": "male",
  "bmi": 32.5,
  "blood_pressure_systolic": 160,
  "blood_pressure_diastolic": 95,
  "cholesterol": 280,
  "glucose": 140,
  "smoking": true,
  "family_history": {
    "cardiovascular_disease": true,
    "diabetes": true,
    "hypertension": true
  },
  "lifestyle": {
    "exercise_frequency": 1,
    "alcohol_consumption": "moderate",
    "stress_level": 8
  }
}'

# Test Case 2: Young healthy patient
echo -e "${YELLOW}💚 Test Case 2: Young Healthy Patient${NC}"
test_prediction "Low Risk Profile" '{
  "user_id": "patient_002",
  "age": 25,
  "gender": "female",
  "bmi": 22.0,
  "blood_pressure_systolic": 110,
  "blood_pressure_diastolic": 70,
  "cholesterol": 180,
  "glucose": 85,
  "smoking": false,
  "family_history": {
    "cardiovascular_disease": false,
    "diabetes": false,
    "hypertension": false
  },
  "lifestyle": {
    "exercise_frequency": 5,
    "alcohol_consumption": "none",
    "stress_level": 3
  }
}'

# Test Case 3: Diabetes risk patient
echo -e "${YELLOW}🍯 Test Case 3: Diabetes Risk Patient${NC}"
test_prediction "Diabetes Risk" '{
  "user_id": "patient_003",
  "age": 45,
  "gender": "female",
  "bmi": 29.0,
  "blood_pressure_systolic": 135,
  "blood_pressure_diastolic": 85,
  "cholesterol": 220,
  "glucose": 125,
  "smoking": false,
  "family_history": {
    "cardiovascular_disease": false,
    "diabetes": true,
    "hypertension": false
  },
  "lifestyle": {
    "exercise_frequency": 2,
    "alcohol_consumption": "light",
    "stress_level": 6
  }
}'

# Test Case 4: Mental health focus
echo -e "${YELLOW}🧠 Test Case 4: Mental Health Assessment${NC}"
test_prediction "Mental Health" '{
  "user_id": "patient_004",
  "age": 35,
  "gender": "male",
  "bmi": 24.5,
  "blood_pressure_systolic": 120,
  "blood_pressure_diastolic": 80,
  "cholesterol": 190,
  "glucose": 90,
  "smoking": false,
  "family_history": {
    "cardiovascular_disease": false,
    "diabetes": false,
    "depression": true,
    "anxiety": true
  },
  "lifestyle": {
    "exercise_frequency": 3,
    "alcohol_consumption": "moderate",
    "stress_level": 9,
    "sleep_hours": 5
  },
  "mental_health": {
    "mood_score": 3,
    "anxiety_level": 8,
    "sleep_quality": 2
  }
}'

echo -e "${BLUE}🔍 Testing Individual Health Endpoints${NC}"
echo "================================================"

# Test health analysis endpoint
echo "Testing health analysis..."
curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
      "user_id": "test_user",
      "vital_signs": {
        "heart_rate": 75,
        "blood_pressure": "120/80",
        "temperature": 98.6,
        "oxygen_saturation": 98
      },
      "symptoms": ["fatigue", "headache"],
      "duration": "3 days"
    }' \
    http://localhost:8001/analyze 2>/dev/null | head -c 200

echo ""
echo ""

# Test model info endpoint
echo "Testing model information..."
curl -s http://localhost:8001/models 2>/dev/null | head -c 200

echo ""
echo ""

echo -e "${GREEN}🎉 ML Prediction Testing Complete!${NC}"
echo ""
echo -e "${YELLOW}📊 Available ML Capabilities:${NC}"
echo "• Cardiovascular disease prediction"
echo "• Type 2 diabetes risk assessment"
echo "• Hypertension analysis"
echo "• Mental health evaluation"
echo "• Obesity risk calculation"
echo "• Sleep disorder detection"
echo "• Respiratory health analysis"
echo "• Metabolic syndrome assessment"
echo ""
echo -e "${BLUE}🌐 Interactive Testing:${NC}"
echo "Visit http://localhost:8001/docs for interactive API testing"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "• Use realistic medical values for better predictions"
echo "• Include family history for more accurate risk assessment"
echo "• Lifestyle factors significantly impact predictions"
echo "• Mental health data improves overall health analysis"

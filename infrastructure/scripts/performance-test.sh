#!/bin/bash

# MediMind Performance Testing Script
# Comprehensive load testing and performance validation for production deployment

set -euo pipefail

# Configuration
NAMESPACE="medimind-production"
TEST_DURATION="10m"
MAX_VUS="1000"
TARGET_QPS="2000"
LATENCY_THRESHOLD="200"  # milliseconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get service URLs
get_service_urls() {
    log_info "Getting service URLs..."
    
    ML_PIPELINE_URL=$(kubectl get svc ml-pipeline-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    BACKEND_URL=$(kubectl get svc backend-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    
    if [[ -z "$ML_PIPELINE_URL" || -z "$BACKEND_URL" ]]; then
        log_error "Failed to get service URLs. Make sure services are deployed and load balancers are ready."
        exit 1
    fi
    
    log_success "Service URLs retrieved"
    log_info "ML Pipeline: http://$ML_PIPELINE_URL"
    log_info "Backend: http://$BACKEND_URL"
}

# Create k6 test scripts
create_test_scripts() {
    log_info "Creating performance test scripts..."
    
    # ML Pipeline Health Check Test
    cat > ml-pipeline-health-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  let response = http.get(`http://${__ENV.ML_PIPELINE_URL}/health`);
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1);
}
EOF

    # ML Pipeline Prediction Load Test
    cat > ml-pipeline-prediction-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '5m', target: 1000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.05'],
    http_reqs: ['rate>1500'],
  },
};

export default function () {
  let payload = JSON.stringify({
    age: 45,
    gender: 'M',
    bmi: 28.5,
    blood_pressure_systolic: 140,
    blood_pressure_diastolic: 90,
    cholesterol_total: 220,
    cholesterol_hdl: 40,
    cholesterol_ldl: 160,
    triglycerides: 180,
    glucose_fasting: 110,
    heart_rate: 75,
    smoking_status: 'former',
    alcohol_consumption: 'moderate',
    exercise_frequency: 3,
    family_history_heart_disease: true,
    family_history_diabetes: false,
    medications: ['statin'],
    symptoms: ['chest_pain', 'shortness_of_breath'],
    stress_level: 7,
    sleep_hours: 6.5,
    diet_quality: 'average',
    weight: 85,
    height: 175,
    waist_circumference: 95,
    hip_circumference: 100,
    body_fat_percentage: 22,
    muscle_mass: 65,
    bone_density: 1.2,
    vitamin_d: 25,
    hemoglobin_a1c: 5.8,
    creatinine: 1.1,
    bun: 18,
    alt: 25,
    ast: 22
  });

  let params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let response = http.post(`http://${__ENV.ML_PIPELINE_URL}/predict`, payload, params);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'has predictions': (r) => JSON.parse(r.body).predictions !== undefined,
  });
  
  sleep(Math.random() * 2 + 1);
}
EOF

    # Backend API Load Test
    cat > backend-api-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 200 },
    { duration: '5m', target: 800 },
    { duration: '2m', target: 1200 },
    { duration: '5m', target: 1200 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'],
    http_req_failed: ['rate<0.01'],
    http_reqs: ['rate>2000'],
  },
};

export default function () {
  // Test health endpoint
  let healthResponse = http.get(`http://${__ENV.BACKEND_URL}/api/health`);
  check(healthResponse, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  sleep(0.5);
}
EOF

    # Voice Analysis Load Test
    cat > voice-analysis-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  // Simulate voice file upload
  let formData = {
    audio: http.file(new ArrayBuffer(1024 * 100), 'test-audio.wav', 'audio/wav'),
    duration: '5.0',
    sample_rate: '16000'
  };

  let response = http.post(`http://${__ENV.ML_PIPELINE_URL}/analyze-voice`, formData);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has voice analysis': (r) => JSON.parse(r.body).voice_biomarkers !== undefined,
  });
  
  sleep(5);
}
EOF

    # GPU Utilization Test
    cat > gpu-stress-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '5m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  // Large batch prediction to stress GPU
  let batchPayload = JSON.stringify({
    batch_size: 32,
    instances: Array(32).fill({
      age: 45 + Math.random() * 30,
      gender: Math.random() > 0.5 ? 'M' : 'F',
      bmi: 20 + Math.random() * 15,
      blood_pressure_systolic: 120 + Math.random() * 40,
      blood_pressure_diastolic: 80 + Math.random() * 20,
      cholesterol_total: 180 + Math.random() * 80,
      cholesterol_hdl: 35 + Math.random() * 30,
      cholesterol_ldl: 100 + Math.random() * 80,
      triglycerides: 100 + Math.random() * 150,
      glucose_fasting: 80 + Math.random() * 50,
      heart_rate: 60 + Math.random() * 40,
      smoking_status: ['never', 'former', 'current'][Math.floor(Math.random() * 3)],
      alcohol_consumption: ['none', 'light', 'moderate', 'heavy'][Math.floor(Math.random() * 4)],
      exercise_frequency: Math.floor(Math.random() * 7),
      family_history_heart_disease: Math.random() > 0.7,
      family_history_diabetes: Math.random() > 0.8,
      stress_level: Math.floor(Math.random() * 10),
      sleep_hours: 5 + Math.random() * 4,
      weight: 50 + Math.random() * 50,
      height: 150 + Math.random() * 30,
      waist_circumference: 70 + Math.random() * 40,
      hip_circumference: 80 + Math.random() * 40,
      body_fat_percentage: 10 + Math.random() * 25,
      muscle_mass: 40 + Math.random() * 40,
      bone_density: 0.8 + Math.random() * 0.8,
      vitamin_d: 10 + Math.random() * 40,
      hemoglobin_a1c: 4.5 + Math.random() * 3,
      creatinine: 0.6 + Math.random() * 1,
      bun: 10 + Math.random() * 20,
      alt: 10 + Math.random() * 30,
      ast: 10 + Math.random() * 30
    })
  });

  let params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let response = http.post(`http://${__ENV.ML_PIPELINE_URL}/optimization/batch-predict`, batchPayload, params);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 300ms': (r) => r.timings.duration < 300,
    'batch processed': (r) => JSON.parse(r.body).predictions !== undefined,
  });
  
  sleep(2);
}
EOF

    log_success "Test scripts created"
}

# Run individual test
run_test() {
    local test_name="$1"
    local test_file="$2"
    
    log_info "Running $test_name..."
    
    ML_PIPELINE_URL="$ML_PIPELINE_URL" BACKEND_URL="$BACKEND_URL" k6 run "$test_file" \
        --out json="results-${test_name}.json" \
        --out influxdb=http://localhost:8086/k6 2>/dev/null || true
    
    # Parse results
    if [[ -f "results-${test_name}.json" ]]; then
        local avg_duration=$(jq -r '.metrics.http_req_duration.values.avg' "results-${test_name}.json" 2>/dev/null || echo "N/A")
        local p95_duration=$(jq -r '.metrics.http_req_duration.values["p(95)"]' "results-${test_name}.json" 2>/dev/null || echo "N/A")
        local error_rate=$(jq -r '.metrics.http_req_failed.values.rate' "results-${test_name}.json" 2>/dev/null || echo "N/A")
        local request_rate=$(jq -r '.metrics.http_reqs.values.rate' "results-${test_name}.json" 2>/dev/null || echo "N/A")
        
        log_success "$test_name completed"
        log_info "  Average Duration: ${avg_duration}ms"
        log_info "  P95 Duration: ${p95_duration}ms"
        log_info "  Error Rate: ${error_rate}"
        log_info "  Request Rate: ${request_rate} req/s"
        
        # Check thresholds
        if [[ "$avg_duration" != "N/A" && $(echo "$avg_duration > $LATENCY_THRESHOLD" | bc -l) -eq 1 ]]; then
            log_warning "$test_name exceeded latency threshold"
        fi
    else
        log_warning "No results file found for $test_name"
    fi
}

# Monitor system resources during tests
monitor_resources() {
    log_info "Starting resource monitoring..."
    
    # Monitor pod resources
    kubectl top pods -n "$NAMESPACE" --no-headers | while read line; do
        echo "$(date): $line"
    done > pod-resources.log &
    MONITOR_PID=$!
    
    # Monitor node resources
    kubectl top nodes --no-headers | while read line; do
        echo "$(date): $line"
    done > node-resources.log &
    NODE_MONITOR_PID=$!
    
    # Return PIDs for cleanup
    echo "$MONITOR_PID $NODE_MONITOR_PID"
}

# Generate performance report
generate_report() {
    log_info "Generating performance report..."
    
    cat > performance-report.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>MediMind Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .test-result { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { border-color: #4CAF50; background: #f9fff9; }
        .warning { border-color: #ff9800; background: #fff9f0; }
        .error { border-color: #f44336; background: #fff0f0; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-label { font-weight: bold; }
        .metric-value { color: #333; }
    </style>
</head>
<body>
    <div class="header">
        <h1>MediMind Performance Test Report</h1>
        <p>Generated on: $(date)</p>
        <p>Test Duration: $TEST_DURATION</p>
        <p>Target QPS: $TARGET_QPS</p>
        <p>Latency Threshold: ${LATENCY_THRESHOLD}ms</p>
    </div>
EOF

    # Add test results to report
    for result_file in results-*.json; do
        if [[ -f "$result_file" ]]; then
            test_name=$(basename "$result_file" .json | sed 's/results-//')
            
            echo "    <div class=\"test-result success\">" >> performance-report.html
            echo "        <h3>$test_name</h3>" >> performance-report.html
            
            # Extract metrics
            local avg_duration=$(jq -r '.metrics.http_req_duration.values.avg' "$result_file" 2>/dev/null || echo "N/A")
            local p95_duration=$(jq -r '.metrics.http_req_duration.values["p(95)"]' "$result_file" 2>/dev/null || echo "N/A")
            local error_rate=$(jq -r '.metrics.http_req_failed.values.rate' "$result_file" 2>/dev/null || echo "N/A")
            local request_rate=$(jq -r '.metrics.http_reqs.values.rate' "$result_file" 2>/dev/null || echo "N/A")
            
            echo "        <div class=\"metric\"><span class=\"metric-label\">Average Duration:</span> <span class=\"metric-value\">${avg_duration}ms</span></div>" >> performance-report.html
            echo "        <div class=\"metric\"><span class=\"metric-label\">P95 Duration:</span> <span class=\"metric-value\">${p95_duration}ms</span></div>" >> performance-report.html
            echo "        <div class=\"metric\"><span class=\"metric-label\">Error Rate:</span> <span class=\"metric-value\">${error_rate}</span></div>" >> performance-report.html
            echo "        <div class=\"metric\"><span class=\"metric-label\">Request Rate:</span> <span class=\"metric-value\">${request_rate} req/s</span></div>" >> performance-report.html
            echo "    </div>" >> performance-report.html
        fi
    done
    
    echo "</body></html>" >> performance-report.html
    
    log_success "Performance report generated: performance-report.html"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up test files..."
    rm -f *.js results-*.json pod-resources.log node-resources.log
}

# Main function
main() {
    log_info "Starting MediMind performance testing..."
    
    # Check prerequisites
    if ! command -v k6 &> /dev/null; then
        log_error "k6 is not installed. Please install k6 load testing tool."
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed."
        exit 1
    fi
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Get service URLs
    get_service_urls
    
    # Create test scripts
    create_test_scripts
    
    # Start resource monitoring
    monitor_pids=$(monitor_resources)
    
    # Run tests
    run_test "ml-pipeline-health" "ml-pipeline-health-test.js"
    sleep 30
    
    run_test "ml-pipeline-prediction" "ml-pipeline-prediction-test.js"
    sleep 30
    
    run_test "backend-api" "backend-api-test.js"
    sleep 30
    
    run_test "voice-analysis" "voice-analysis-test.js"
    sleep 30
    
    run_test "gpu-stress" "gpu-stress-test.js"
    
    # Stop monitoring
    kill $monitor_pids 2>/dev/null || true
    
    # Generate report
    generate_report
    
    log_success "Performance testing completed!"
    log_info "Check performance-report.html for detailed results"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

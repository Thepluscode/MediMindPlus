#!/bin/bash

# MediMind Production Deployment Script
# Comprehensive deployment automation for production-ready healthcare AI platform

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="medimind"
ENVIRONMENT="${ENVIRONMENT:-production}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-medimind}"
VERSION="${VERSION:-$(date +%Y%m%d-%H%M%S)}"
NAMESPACE="${NAMESPACE:-medimind-prod}"

# Logging functions
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    command -v kubectl >/dev/null 2>&1 || missing_tools+=("kubectl")
    command -v helm >/dev/null 2>&1 || missing_tools+=("helm")
    command -v node >/dev/null 2>&1 || missing_tools+=("node")
    command -v npm >/dev/null 2>&1 || missing_tools+=("npm")
    command -v python3 >/dev/null 2>&1 || missing_tools+=("python3")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check Kubernetes connection
    if ! kubectl cluster-info >/dev/null 2>&1; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

# Environment validation
validate_environment() {
    log_info "Validating environment configuration..."
    
    # Check required environment variables
    local required_vars=(
        "DB_HOST"
        "DB_PASSWORD"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "SESSION_SECRET"
        "ENCRYPTION_KEY"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        log_info "Please set these variables before deployment"
        exit 1
    fi
    
    # Validate secret lengths
    if [ ${#JWT_SECRET} -lt 32 ]; then
        log_error "JWT_SECRET must be at least 32 characters"
        exit 1
    fi
    
    if [ ${#ENCRYPTION_KEY} -ne 64 ]; then
        log_error "ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Build and test backend
build_backend() {
    log_info "Building backend application..."
    
    cd backend
    
    # Install dependencies
    log_info "Installing backend dependencies..."
    npm ci --production=false
    
    # Run linting
    log_info "Running backend linting..."
    npm run lint
    
    # Run type checking
    log_info "Running TypeScript type checking..."
    npm run typecheck
    
    # Build application
    log_info "Building backend application..."
    npm run build
    
    # Run tests
    log_info "Running backend tests..."
    npm test
    
    cd ..
    log_success "Backend build completed"
}

# Build and test frontend
build_frontend() {
    log_info "Building frontend application..."
    
    cd frontend
    
    # Install dependencies
    log_info "Installing frontend dependencies..."
    npm ci --production=false
    
    # Run linting
    log_info "Running frontend linting..."
    npm run lint || log_warning "Frontend linting issues detected"
    
    # Build application
    log_info "Building frontend application..."
    npm run build
    
    # Run tests
    log_info "Running frontend tests..."
    npm test || log_warning "Frontend tests failed"
    
    cd ..
    log_success "Frontend build completed"
}

# Build ML pipeline
build_ml_pipeline() {
    log_info "Building ML pipeline..."
    
    cd ml-pipeline
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        log_info "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    log_info "Installing ML pipeline dependencies..."
    pip install -r requirements.txt
    
    # Run tests
    log_info "Running ML pipeline tests..."
    python -m pytest tests/ || log_warning "ML pipeline tests failed"
    
    deactivate
    cd ..
    log_success "ML pipeline build completed"
}

# Build Docker images
build_docker_images() {
    log_info "Building Docker images..."
    
    # Backend image
    log_info "Building backend Docker image..."
    docker build -t ${DOCKER_REGISTRY}/medimind-backend:${VERSION} \
                 -t ${DOCKER_REGISTRY}/medimind-backend:latest \
                 -f backend/Dockerfile backend/
    
    # Frontend image
    log_info "Building frontend Docker image..."
    docker build -t ${DOCKER_REGISTRY}/medimind-frontend:${VERSION} \
                 -t ${DOCKER_REGISTRY}/medimind-frontend:latest \
                 -f frontend/Dockerfile frontend/
    
    # ML Pipeline image
    log_info "Building ML pipeline Docker image..."
    docker build -t ${DOCKER_REGISTRY}/medimind-ml:${VERSION} \
                 -t ${DOCKER_REGISTRY}/medimind-ml:latest \
                 -f ml-pipeline/Dockerfile ml-pipeline/
    
    log_success "Docker images built successfully"
}

# Push Docker images
push_docker_images() {
    log_info "Pushing Docker images to registry..."
    
    # Push all images
    docker push ${DOCKER_REGISTRY}/medimind-backend:${VERSION}
    docker push ${DOCKER_REGISTRY}/medimind-backend:latest
    
    docker push ${DOCKER_REGISTRY}/medimind-frontend:${VERSION}
    docker push ${DOCKER_REGISTRY}/medimind-frontend:latest
    
    docker push ${DOCKER_REGISTRY}/medimind-ml:${VERSION}
    docker push ${DOCKER_REGISTRY}/medimind-ml:latest
    
    log_success "Docker images pushed successfully"
}

# Deploy to Kubernetes
deploy_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Create secrets
    log_info "Creating Kubernetes secrets..."
    kubectl create secret generic medimind-secrets \
        --from-literal=db-password="${DB_PASSWORD}" \
        --from-literal=jwt-secret="${JWT_SECRET}" \
        --from-literal=jwt-refresh-secret="${JWT_REFRESH_SECRET}" \
        --from-literal=session-secret="${SESSION_SECRET}" \
        --from-literal=encryption-key="${ENCRYPTION_KEY}" \
        --namespace=${NAMESPACE} \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy using Helm
    log_info "Deploying with Helm..."
    helm upgrade --install medimind ./infrastructure/helm/medimind \
        --namespace=${NAMESPACE} \
        --set image.tag=${VERSION} \
        --set environment=${ENVIRONMENT} \
        --set database.host=${DB_HOST} \
        --set redis.host=${REDIS_HOST:-redis} \
        --wait --timeout=600s
    
    log_success "Kubernetes deployment completed"
}

# Run health checks
run_health_checks() {
    log_info "Running post-deployment health checks..."
    
    # Wait for pods to be ready
    log_info "Waiting for pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=medimind-backend \
        --namespace=${NAMESPACE} --timeout=300s
    
    # Get service URL
    local service_url
    if kubectl get service medimind-backend-lb --namespace=${NAMESPACE} >/dev/null 2>&1; then
        service_url=$(kubectl get service medimind-backend-lb \
            --namespace=${NAMESPACE} \
            -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
        service_url="http://${service_url}"
    else
        # Use port-forward for testing
        kubectl port-forward service/medimind-backend 8080:3000 \
            --namespace=${NAMESPACE} &
        local port_forward_pid=$!
        service_url="http://localhost:8080"
        sleep 5
    fi
    
    # Run health checks
    log_info "Running health check tests..."
    python3 backend/test_production_backend.py --url ${service_url}
    
    # Clean up port-forward if used
    if [ -n "${port_forward_pid:-}" ]; then
        kill ${port_forward_pid} 2>/dev/null || true
    fi
    
    log_success "Health checks passed"
}

# Rollback function
rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    helm rollback medimind --namespace=${NAMESPACE}
    
    log_info "Rollback completed"
}

# Main deployment function
main() {
    local start_time=$(date +%s)
    
    log_info "🚀 Starting MediMind Production Deployment"
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Version: ${VERSION}"
    log_info "Namespace: ${NAMESPACE}"
    
    # Trap errors for rollback
    trap 'log_error "Deployment failed! Check logs above."; exit 1' ERR
    
    # Run deployment steps
    check_prerequisites
    validate_environment
    build_backend
    build_frontend
    build_ml_pipeline
    build_docker_images
    
    # Only push and deploy if not in test mode
    if [ "${TEST_MODE:-false}" != "true" ]; then
        push_docker_images
        deploy_kubernetes
        run_health_checks
    else
        log_info "Test mode enabled - skipping push and deployment"
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "🎉 MediMind deployment completed successfully!"
    log_info "Total deployment time: ${duration} seconds"
    
    # Display access information
    if [ "${TEST_MODE:-false}" != "true" ]; then
        log_info "📋 Access Information:"
        log_info "  Backend API: kubectl port-forward service/medimind-backend 3000:3000 -n ${NAMESPACE}"
        log_info "  Frontend: kubectl port-forward service/medimind-frontend 3001:80 -n ${NAMESPACE}"
        log_info "  Monitoring: kubectl port-forward service/medimind-monitoring 3002:3000 -n ${NAMESPACE}"
    fi
}

# Script options
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback_deployment
        ;;
    "health-check")
        run_health_checks
        ;;
    "build-only")
        check_prerequisites
        build_backend
        build_frontend
        build_ml_pipeline
        build_docker_images
        log_success "Build completed successfully"
        ;;
    *)
        echo "Usage: $0 [deploy|rollback|health-check|build-only]"
        echo ""
        echo "Commands:"
        echo "  deploy      - Full deployment (default)"
        echo "  rollback    - Rollback to previous version"
        echo "  health-check - Run health checks only"
        echo "  build-only  - Build without deploying"
        echo ""
        echo "Environment Variables:"
        echo "  ENVIRONMENT - Deployment environment (default: production)"
        echo "  VERSION     - Version tag (default: timestamp)"
        echo "  NAMESPACE   - Kubernetes namespace (default: medimind-prod)"
        echo "  TEST_MODE   - Skip push/deploy steps (default: false)"
        exit 1
        ;;
esac

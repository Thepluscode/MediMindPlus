#!/bin/bash

# MediMind Production Deployment Script
# Automated deployment of the complete MediMind infrastructure and applications

set -euo pipefail

# Configuration
ENVIRONMENT="production"
AWS_REGION="us-west-2"
CLUSTER_NAME="medimind-production"
NAMESPACE="medimind-production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    
    # Check required tools
    local tools=("terraform" "kubectl" "helm" "aws" "docker")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed or not in PATH"
            exit 1
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    log_info "Deploying infrastructure with Terraform..."
    
    cd infrastructure/terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    terraform plan -var="environment=$ENVIRONMENT" -var="aws_region=$AWS_REGION" -out=tfplan
    
    # Apply infrastructure
    terraform apply tfplan
    
    # Get outputs
    export CLUSTER_ENDPOINT=$(terraform output -raw cluster_endpoint)
    export RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
    export REDIS_ENDPOINT=$(terraform output -raw redis_endpoint)
    
    log_success "Infrastructure deployed successfully"
    cd ../..
}

# Configure kubectl
configure_kubectl() {
    log_info "Configuring kubectl for EKS cluster..."
    
    aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME"
    
    # Verify connection
    if kubectl cluster-info &> /dev/null; then
        log_success "kubectl configured successfully"
    else
        log_error "Failed to connect to EKS cluster"
        exit 1
    fi
}

# Install cluster add-ons
install_cluster_addons() {
    log_info "Installing cluster add-ons..."
    
    # Install AWS Load Balancer Controller
    helm repo add eks https://aws.github.io/eks-charts
    helm repo update
    
    helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
        -n kube-system \
        --set clusterName="$CLUSTER_NAME" \
        --set serviceAccount.create=false \
        --set serviceAccount.name=aws-load-balancer-controller
    
    # Install External Secrets Operator
    helm repo add external-secrets https://charts.external-secrets.io
    helm upgrade --install external-secrets external-secrets/external-secrets \
        -n external-secrets-system \
        --create-namespace
    
    # Install NVIDIA GPU Operator
    helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
    helm upgrade --install gpu-operator nvidia/gpu-operator \
        -n gpu-operator-system \
        --create-namespace \
        --set driver.enabled=false  # Using pre-installed drivers
    
    # Install Cluster Autoscaler
    helm repo add autoscaler https://kubernetes.github.io/autoscaler
    helm upgrade --install cluster-autoscaler autoscaler/cluster-autoscaler \
        -n kube-system \
        --set autoDiscovery.clusterName="$CLUSTER_NAME" \
        --set awsRegion="$AWS_REGION"
    
    log_success "Cluster add-ons installed successfully"
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    # Get ECR login token
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com"
    
    # Build ML Pipeline image
    log_info "Building ML Pipeline image..."
    cd ml-pipeline
    docker build -t "medimind/ml-pipeline:latest" .
    docker tag "medimind/ml-pipeline:latest" "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/medimind/ml-pipeline:latest"
    docker push "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/medimind/ml-pipeline:latest"
    cd ..
    
    # Build Backend image
    log_info "Building Backend image..."
    cd backend
    docker build -t "medimind/backend:latest" .
    docker tag "medimind/backend:latest" "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/medimind/backend:latest"
    docker push "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/medimind/backend:latest"
    cd ..
    
    log_success "Docker images built and pushed successfully"
}

# Deploy applications
deploy_applications() {
    log_info "Deploying applications to Kubernetes..."
    
    # Create namespace
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply security configurations
    kubectl apply -f infrastructure/k8s/security.yaml
    
    # Wait for external secrets to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=external-secrets -n external-secrets-system --timeout=300s
    
    # Apply secrets
    kubectl apply -f infrastructure/k8s/security.yaml
    
    # Wait for secrets to be created
    sleep 30
    
    # Deploy ML Pipeline
    log_info "Deploying ML Pipeline..."
    kubectl apply -f infrastructure/k8s/ml-pipeline-deployment.yaml
    
    # Deploy Backend
    log_info "Deploying Backend..."
    kubectl apply -f infrastructure/k8s/backend-deployment.yaml
    
    # Wait for deployments to be ready
    kubectl wait --for=condition=available deployment/ml-pipeline -n "$NAMESPACE" --timeout=600s
    kubectl wait --for=condition=available deployment/backend -n "$NAMESPACE" --timeout=600s
    
    log_success "Applications deployed successfully"
}

# Deploy monitoring stack
deploy_monitoring() {
    log_info "Deploying monitoring stack..."
    
    # Apply monitoring configurations
    kubectl apply -f infrastructure/k8s/monitoring-stack.yaml
    
    # Wait for monitoring components to be ready
    kubectl wait --for=condition=available deployment/prometheus -n monitoring --timeout=300s
    kubectl wait --for=condition=available deployment/grafana -n monitoring --timeout=300s
    
    # Get Grafana URL
    GRAFANA_URL=$(kubectl get svc grafana -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    
    log_success "Monitoring stack deployed successfully"
    log_info "Grafana URL: http://$GRAFANA_URL:3000"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Check pod status
    kubectl get pods -n "$NAMESPACE"
    
    # Check service endpoints
    ML_PIPELINE_URL=$(kubectl get svc ml-pipeline-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    BACKEND_URL=$(kubectl get svc backend-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    
    # Wait for load balancers to be ready
    sleep 60
    
    # Test ML Pipeline health
    if curl -f "http://$ML_PIPELINE_URL/health" &> /dev/null; then
        log_success "ML Pipeline health check passed"
    else
        log_warning "ML Pipeline health check failed"
    fi
    
    # Test Backend health
    if curl -f "http://$BACKEND_URL/api/health" &> /dev/null; then
        log_success "Backend health check passed"
    else
        log_warning "Backend health check failed"
    fi
    
    log_info "ML Pipeline URL: http://$ML_PIPELINE_URL"
    log_info "Backend URL: http://$BACKEND_URL"
}

# Performance testing
run_performance_tests() {
    log_info "Running performance tests..."
    
    # Install k6 if not present
    if ! command -v k6 &> /dev/null; then
        log_warning "k6 not installed, skipping performance tests"
        return
    fi
    
    # Run load test on ML Pipeline
    cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
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
    
    ML_PIPELINE_URL=$(kubectl get svc ml-pipeline-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    ML_PIPELINE_URL="$ML_PIPELINE_URL" k6 run load-test.js
    
    rm load-test.js
    
    log_success "Performance tests completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f tfplan load-test.js
}

# Main deployment function
main() {
    log_info "Starting MediMind production deployment..."
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Run deployment steps
    check_prerequisites
    deploy_infrastructure
    configure_kubectl
    install_cluster_addons
    build_and_push_images
    deploy_applications
    deploy_monitoring
    run_health_checks
    
    # Optional performance testing
    if [[ "${RUN_PERF_TESTS:-false}" == "true" ]]; then
        run_performance_tests
    fi
    
    log_success "MediMind production deployment completed successfully!"
    
    # Display summary
    echo ""
    echo "=== DEPLOYMENT SUMMARY ==="
    echo "Environment: $ENVIRONMENT"
    echo "AWS Region: $AWS_REGION"
    echo "EKS Cluster: $CLUSTER_NAME"
    echo "Namespace: $NAMESPACE"
    echo ""
    echo "Service URLs:"
    echo "- ML Pipeline: http://$(kubectl get svc ml-pipeline-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
    echo "- Backend API: http://$(kubectl get svc backend-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
    echo "- Grafana: http://$(kubectl get svc grafana -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'):3000"
    echo ""
    echo "Next steps:"
    echo "1. Configure DNS records for your domain"
    echo "2. Set up SSL certificates"
    echo "3. Configure monitoring alerts"
    echo "4. Run comprehensive testing"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

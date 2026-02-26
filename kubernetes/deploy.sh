#!/bin/bash

################################################################################
# MediMindPlus Kubernetes Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Example: ./deploy.sh production apply
################################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
ACTION=${2:-apply}
NAMESPACE="medimindplus"
KUSTOMIZE_DIR="./kubernetes/overlays/${ENVIRONMENT}"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi

    # Check kustomize
    if ! command -v kustomize &> /dev/null; then
        log_warn "kustomize not found. Using kubectl's built-in kustomize."
    fi

    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Please configure kubectl."
        exit 1
    fi

    log_info "Prerequisites check passed ✓"
}

create_namespace() {
    log_info "Creating namespace: ${NAMESPACE}"
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
}

create_secrets() {
    log_info "Creating secrets..."

    # Check if secrets file exists
    SECRETS_FILE="${KUSTOMIZE_DIR}/secrets.env"

    if [[ ! -f "${SECRETS_FILE}" ]]; then
        log_error "Secrets file not found: ${SECRETS_FILE}"
        log_error "Please create ${SECRETS_FILE} from secrets.env.example"
        exit 1
    fi

    # Create secrets from file
    kubectl create secret generic medimindplus-secrets \
        --from-env-file="${SECRETS_FILE}" \
        --namespace=${NAMESPACE} \
        --dry-run=client -o yaml | kubectl apply -f -

    # Create Grafana password
    GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-$(openssl rand -base64 32)}
    kubectl create secret generic grafana-secrets \
        --from-literal=admin-password="${GRAFANA_PASSWORD}" \
        --namespace=${NAMESPACE} \
        --dry-run=client -o yaml | kubectl apply -f -

    log_info "Grafana admin password: ${GRAFANA_PASSWORD}"
    log_warn "Save this password! You'll need it to access Grafana."
}

build_docker_images() {
    log_info "Building Docker images..."

    # Get git commit hash for tagging
    GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
    IMAGE_TAG="${ENVIRONMENT}-${GIT_COMMIT}"

    # Build backend
    log_info "Building backend image: medimindplus-backend:${IMAGE_TAG}"
    docker build -t your-docker-registry/medimindplus-backend:${IMAGE_TAG} ./backend

    # Build ML service
    log_info "Building ML service image: medimindplus-ml:${IMAGE_TAG}"
    docker build -t your-docker-registry/medimindplus-ml:${IMAGE_TAG} ./ml-service

    # Push images
    if [[ "${PUSH_IMAGES:-true}" == "true" ]]; then
        log_info "Pushing images to registry..."
        docker push your-docker-registry/medimindplus-backend:${IMAGE_TAG}
        docker push your-docker-registry/medimindplus-ml:${IMAGE_TAG}
    fi

    log_info "Images built with tag: ${IMAGE_TAG}"
}

deploy_infrastructure() {
    log_info "Deploying infrastructure to ${ENVIRONMENT}..."

    if command -v kustomize &> /dev/null; then
        # Use standalone kustomize
        kustomize build ${KUSTOMIZE_DIR} | kubectl ${ACTION} -f -
    else
        # Use kubectl's built-in kustomize
        kubectl ${ACTION} -k ${KUSTOMIZE_DIR}
    fi
}

wait_for_rollout() {
    log_info "Waiting for deployments to be ready..."

    kubectl rollout status deployment/backend -n ${NAMESPACE} --timeout=5m
    kubectl rollout status deployment/postgres -n ${NAMESPACE} --timeout=5m
    kubectl rollout status deployment/redis -n ${NAMESPACE} --timeout=5m
    kubectl rollout status deployment/nginx -n ${NAMESPACE} --timeout=2m
    kubectl rollout status deployment/prometheus -n ${NAMESPACE} --timeout=2m
    kubectl rollout status deployment/grafana -n ${NAMESPACE} --timeout=2m

    log_info "All deployments are ready ✓"
}

run_database_migrations() {
    log_info "Running database migrations..."

    # Find a backend pod
    BACKEND_POD=$(kubectl get pods -n ${NAMESPACE} -l app=backend -o jsonpath='{.items[0].metadata.name}')

    if [[ -z "${BACKEND_POD}" ]]; then
        log_error "No backend pod found"
        exit 1
    fi

    # Run migrations
    kubectl exec -it ${BACKEND_POD} -n ${NAMESPACE} -- npm run migrate:deploy

    log_info "Database migrations completed ✓"
}

verify_deployment() {
    log_info "Verifying deployment..."

    # Check all pods are running
    log_info "Pod status:"
    kubectl get pods -n ${NAMESPACE}

    # Check services
    log_info "Service status:"
    kubectl get svc -n ${NAMESPACE}

    # Check ingress
    log_info "Ingress status:"
    kubectl get ingress -n ${NAMESPACE}

    # Health check
    log_info "Running health checks..."
    BACKEND_POD=$(kubectl get pods -n ${NAMESPACE} -l app=backend -o jsonpath='{.items[0].metadata.name}')

    if kubectl exec ${BACKEND_POD} -n ${NAMESPACE} -- curl -f http://localhost:3000/health; then
        log_info "Backend health check passed ✓"
    else
        log_error "Backend health check failed"
        exit 1
    fi
}

show_access_info() {
    log_info "Deployment complete! 🚀"
    echo ""
    echo "========================================="
    echo "Access Information"
    echo "========================================="

    # Get LoadBalancer IP/hostname
    LB_IP=$(kubectl get svc nginx-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    LB_HOSTNAME=$(kubectl get svc nginx-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

    echo "API Endpoint: http://${LB_IP:-$LB_HOSTNAME}/api"
    echo "Prometheus: http://${LB_IP:-$LB_HOSTNAME}/prometheus"
    echo "Grafana: http://${LB_IP:-$LB_HOSTNAME}/grafana"
    echo ""
    echo "Grafana Credentials:"
    echo "  Username: admin"
    echo "  Password: ${GRAFANA_PASSWORD}"
    echo ""
    echo "========================================="

    # Show revolutionary features endpoints
    echo ""
    echo "Revolutionary Features Endpoints:"
    echo "  Virtual Health Twin: POST /api/v1/health-twin/create"
    echo "  Mental Health: GET /api/v1/mental-health/crisis-assessment/:userId"
    echo "  Multi-Omics: GET /api/v1/omics/:userId/nutrition-plan"
    echo "  Longevity: GET /api/v1/longevity/:userId/biological-age"
    echo "  Employer Dashboard: GET /api/v1/employer/:employerId/dashboard"
    echo "  ... and 45+ more endpoints!"
    echo ""
}

rollback() {
    log_warn "Rolling back deployment..."
    kubectl rollout undo deployment/backend -n ${NAMESPACE}
    kubectl rollout status deployment/backend -n ${NAMESPACE}
    log_info "Rollback complete"
}

cleanup() {
    log_warn "Cleaning up resources in ${ENVIRONMENT}..."
    read -p "Are you sure you want to delete all resources? (yes/no): " -r
    if [[ $REPLY == "yes" ]]; then
        kubectl delete namespace ${NAMESPACE}
        log_info "Cleanup complete"
    else
        log_info "Cleanup cancelled"
    fi
}

# Main script
main() {
    log_info "MediMindPlus Kubernetes Deployment"
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Action: ${ACTION}"
    echo ""

    case ${ACTION} in
        apply)
            check_prerequisites
            create_namespace
            create_secrets
            # build_docker_images  # Uncomment if building locally
            deploy_infrastructure
            wait_for_rollout
            run_database_migrations
            verify_deployment
            show_access_info
            ;;
        delete)
            cleanup
            ;;
        rollback)
            rollback
            ;;
        verify)
            verify_deployment
            ;;
        *)
            log_error "Unknown action: ${ACTION}"
            echo "Usage: $0 [environment] [apply|delete|rollback|verify]"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

#!/bin/bash

# MediMind Production Deployment Validation Script
# Comprehensive validation of production deployment readiness

set -euo pipefail

# Configuration
NAMESPACE="medimind-production"
MONITORING_NAMESPACE="monitoring"
EXPECTED_LATENCY_MS=200
EXPECTED_QPS=2000
EXPECTED_ACCURACY=90

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED_CHECKS++))
}

check_result() {
    ((TOTAL_CHECKS++))
    if [[ $1 -eq 0 ]]; then
        log_success "$2"
    else
        log_error "$2"
    fi
}

# Infrastructure validation
validate_infrastructure() {
    log_info "=== Infrastructure Validation ==="
    
    # Check EKS cluster
    if kubectl cluster-info &>/dev/null; then
        check_result 0 "EKS cluster is accessible"
    else
        check_result 1 "EKS cluster is not accessible"
    fi
    
    # Check node readiness
    local ready_nodes=$(kubectl get nodes --no-headers | grep -c " Ready ")
    local total_nodes=$(kubectl get nodes --no-headers | wc -l)
    
    if [[ $ready_nodes -eq $total_nodes && $ready_nodes -gt 0 ]]; then
        check_result 0 "All $ready_nodes nodes are ready"
    else
        check_result 1 "Only $ready_nodes/$total_nodes nodes are ready"
    fi
    
    # Check GPU nodes
    local gpu_nodes=$(kubectl get nodes -l nvidia.com/gpu=true --no-headers | wc -l)
    if [[ $gpu_nodes -gt 0 ]]; then
        check_result 0 "GPU nodes available ($gpu_nodes nodes)"
    else
        check_result 1 "No GPU nodes found"
    fi
    
    # Check storage classes
    if kubectl get storageclass gp3 &>/dev/null; then
        check_result 0 "GP3 storage class available"
    else
        check_result 1 "GP3 storage class not found"
    fi
}

# Application validation
validate_applications() {
    log_info "=== Application Validation ==="
    
    # Check namespace
    if kubectl get namespace "$NAMESPACE" &>/dev/null; then
        check_result 0 "Production namespace exists"
    else
        check_result 1 "Production namespace not found"
        return
    fi
    
    # Check deployments
    local deployments=("ml-pipeline" "backend")
    for deployment in "${deployments[@]}"; do
        local ready_replicas=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        local desired_replicas=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
        
        if [[ $ready_replicas -eq $desired_replicas && $ready_replicas -gt 0 ]]; then
            check_result 0 "$deployment deployment ready ($ready_replicas/$desired_replicas replicas)"
        else
            check_result 1 "$deployment deployment not ready ($ready_replicas/$desired_replicas replicas)"
        fi
    done
    
    # Check services
    local services=("ml-pipeline-service" "backend-service")
    for service in "${services[@]}"; do
        if kubectl get service "$service" -n "$NAMESPACE" &>/dev/null; then
            local external_ip=$(kubectl get service "$service" -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
            if [[ -n "$external_ip" ]]; then
                check_result 0 "$service has external endpoint: $external_ip"
            else
                check_result 1 "$service has no external endpoint"
            fi
        else
            check_result 1 "$service not found"
        fi
    done
    
    # Check persistent volumes
    local pvcs=$(kubectl get pvc -n "$NAMESPACE" --no-headers 2>/dev/null | grep -c "Bound" || echo "0")
    if [[ $pvcs -gt 0 ]]; then
        check_result 0 "Persistent volumes bound ($pvcs PVCs)"
    else
        check_result 1 "No persistent volumes bound"
    fi
}

# Security validation
validate_security() {
    log_info "=== Security Validation ==="
    
    # Check RBAC
    if kubectl auth can-i get pods --as=system:serviceaccount:$NAMESPACE:ml-pipeline-sa -n "$NAMESPACE" &>/dev/null; then
        check_result 0 "RBAC configured for ML pipeline service account"
    else
        check_result 1 "RBAC not properly configured"
    fi
    
    # Check network policies
    local network_policies=$(kubectl get networkpolicy -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l)
    if [[ $network_policies -gt 0 ]]; then
        check_result 0 "Network policies configured ($network_policies policies)"
    else
        check_result 1 "No network policies found"
    fi
    
    # Check secrets
    local secrets=("database-secret" "redis-secret" "jwt-secret")
    for secret in "${secrets[@]}"; do
        if kubectl get secret "$secret" -n "$NAMESPACE" &>/dev/null; then
            check_result 0 "Secret $secret exists"
        else
            check_result 1 "Secret $secret not found"
        fi
    done
    
    # Check pod security
    local pods_with_security_context=$(kubectl get pods -n "$NAMESPACE" -o jsonpath='{.items[*].spec.securityContext.runAsNonRoot}' 2>/dev/null | grep -c "true" || echo "0")
    local total_pods=$(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l)
    
    if [[ $pods_with_security_context -eq $total_pods && $total_pods -gt 0 ]]; then
        check_result 0 "All pods run with security context"
    else
        check_result 1 "Some pods missing security context ($pods_with_security_context/$total_pods)"
    fi
}

# Performance validation
validate_performance() {
    log_info "=== Performance Validation ==="
    
    # Get service URLs
    local ml_pipeline_url=$(kubectl get service ml-pipeline-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
    local backend_url=$(kubectl get service backend-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
    
    if [[ -z "$ml_pipeline_url" || -z "$backend_url" ]]; then
        check_result 1 "Service URLs not available for performance testing"
        return
    fi
    
    # Test ML Pipeline health
    local ml_response_time=$(curl -w "%{time_total}" -s -o /dev/null "http://$ml_pipeline_url/health" 2>/dev/null || echo "999")
    local ml_response_time_ms=$(echo "$ml_response_time * 1000" | bc -l 2>/dev/null | cut -d. -f1)
    
    if [[ $ml_response_time_ms -lt $EXPECTED_LATENCY_MS ]]; then
        check_result 0 "ML Pipeline health check latency: ${ml_response_time_ms}ms"
    else
        check_result 1 "ML Pipeline health check latency too high: ${ml_response_time_ms}ms"
    fi
    
    # Test Backend health
    local backend_response_time=$(curl -w "%{time_total}" -s -o /dev/null "http://$backend_url/api/health" 2>/dev/null || echo "999")
    local backend_response_time_ms=$(echo "$backend_response_time * 1000" | bc -l 2>/dev/null | cut -d. -f1)
    
    if [[ $backend_response_time_ms -lt 100 ]]; then
        check_result 0 "Backend health check latency: ${backend_response_time_ms}ms"
    else
        check_result 1 "Backend health check latency too high: ${backend_response_time_ms}ms"
    fi
    
    # Check HPA configuration
    local hpa_count=$(kubectl get hpa -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l)
    if [[ $hpa_count -gt 0 ]]; then
        check_result 0 "Horizontal Pod Autoscaler configured ($hpa_count HPAs)"
    else
        check_result 1 "No Horizontal Pod Autoscaler found"
    fi
    
    # Check resource limits
    local pods_with_limits=$(kubectl get pods -n "$NAMESPACE" -o jsonpath='{.items[*].spec.containers[*].resources.limits}' 2>/dev/null | grep -c "cpu\|memory" || echo "0")
    local total_containers=$(kubectl get pods -n "$NAMESPACE" -o jsonpath='{.items[*].spec.containers[*].name}' 2>/dev/null | wc -w)
    
    if [[ $pods_with_limits -ge $total_containers ]]; then
        check_result 0 "All containers have resource limits"
    else
        check_result 1 "Some containers missing resource limits"
    fi
}

# Monitoring validation
validate_monitoring() {
    log_info "=== Monitoring Validation ==="
    
    # Check monitoring namespace
    if kubectl get namespace "$MONITORING_NAMESPACE" &>/dev/null; then
        check_result 0 "Monitoring namespace exists"
    else
        check_result 1 "Monitoring namespace not found"
        return
    fi
    
    # Check Prometheus
    if kubectl get deployment prometheus -n "$MONITORING_NAMESPACE" &>/dev/null; then
        local prometheus_ready=$(kubectl get deployment prometheus -n "$MONITORING_NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        if [[ $prometheus_ready -gt 0 ]]; then
            check_result 0 "Prometheus is running"
        else
            check_result 1 "Prometheus is not ready"
        fi
    else
        check_result 1 "Prometheus deployment not found"
    fi
    
    # Check Grafana
    if kubectl get deployment grafana -n "$MONITORING_NAMESPACE" &>/dev/null; then
        local grafana_ready=$(kubectl get deployment grafana -n "$MONITORING_NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        if [[ $grafana_ready -gt 0 ]]; then
            check_result 0 "Grafana is running"
        else
            check_result 1 "Grafana is not ready"
        fi
    else
        check_result 1 "Grafana deployment not found"
    fi
    
    # Check metrics endpoints
    local pods_with_metrics=$(kubectl get pods -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.annotations.prometheus\.io/scrape}' 2>/dev/null | grep -c "true" || echo "0")
    if [[ $pods_with_metrics -gt 0 ]]; then
        check_result 0 "Pods configured for metrics scraping ($pods_with_metrics pods)"
    else
        check_result 1 "No pods configured for metrics scraping"
    fi
    
    # Check alerting rules
    if kubectl get configmap prometheus-rules -n "$MONITORING_NAMESPACE" &>/dev/null; then
        check_result 0 "Prometheus alerting rules configured"
    else
        check_result 1 "Prometheus alerting rules not found"
    fi
}

# Database validation
validate_database() {
    log_info "=== Database Validation ==="
    
    # Check database connectivity from pods
    local ml_pod=$(kubectl get pods -n "$NAMESPACE" -l app=ml-pipeline -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$ml_pod" ]]; then
        if kubectl exec "$ml_pod" -n "$NAMESPACE" -- pg_isready -h "$DB_HOST" -p 5432 &>/dev/null; then
            check_result 0 "Database connectivity from ML pipeline"
        else
            check_result 1 "Database connectivity failed from ML pipeline"
        fi
    else
        check_result 1 "No ML pipeline pod found for database testing"
    fi
    
    # Check Redis connectivity
    if [[ -n "$ml_pod" ]]; then
        if kubectl exec "$ml_pod" -n "$NAMESPACE" -- redis-cli -h "$REDIS_HOST" ping &>/dev/null; then
            check_result 0 "Redis connectivity from ML pipeline"
        else
            check_result 1 "Redis connectivity failed from ML pipeline"
        fi
    fi
}

# GPU validation
validate_gpu() {
    log_info "=== GPU Validation ==="
    
    # Check GPU operator
    if kubectl get pods -n gpu-operator-system --no-headers 2>/dev/null | grep -q "Running"; then
        check_result 0 "GPU operator is running"
    else
        check_result 1 "GPU operator not found or not running"
    fi
    
    # Check GPU availability in ML pipeline pods
    local gpu_pods=$(kubectl get pods -n "$NAMESPACE" -l app=ml-pipeline -o jsonpath='{.items[*].spec.containers[*].resources.limits.nvidia\.com/gpu}' 2>/dev/null | grep -c "1" || echo "0")
    
    if [[ $gpu_pods -gt 0 ]]; then
        check_result 0 "ML pipeline pods have GPU allocation ($gpu_pods pods)"
    else
        check_result 1 "No ML pipeline pods have GPU allocation"
    fi
    
    # Check NVIDIA device plugin
    if kubectl get daemonset nvidia-device-plugin-daemonset -n gpu-operator-system &>/dev/null; then
        check_result 0 "NVIDIA device plugin deployed"
    else
        check_result 1 "NVIDIA device plugin not found"
    fi
}

# Generate validation report
generate_report() {
    log_info "=== Validation Summary ==="
    
    local success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    
    echo ""
    echo "╔══════════════════════════════════════╗"
    echo "║        VALIDATION RESULTS            ║"
    echo "╠══════════════════════════════════════╣"
    echo "║ Total Checks: $TOTAL_CHECKS                        ║"
    echo "║ Passed: $PASSED_CHECKS                             ║"
    echo "║ Failed: $FAILED_CHECKS                             ║"
    echo "║ Success Rate: $success_rate%                     ║"
    echo "╚══════════════════════════════════════╝"
    echo ""
    
    if [[ $success_rate -ge 95 ]]; then
        log_success "Deployment validation PASSED - Ready for production!"
        return 0
    elif [[ $success_rate -ge 80 ]]; then
        log_warning "Deployment validation PARTIAL - Some issues need attention"
        return 1
    else
        log_error "Deployment validation FAILED - Critical issues found"
        return 2
    fi
}

# Main validation function
main() {
    log_info "Starting MediMind production deployment validation..."
    echo ""
    
    # Run all validation checks
    validate_infrastructure
    echo ""
    validate_applications
    echo ""
    validate_security
    echo ""
    validate_performance
    echo ""
    validate_monitoring
    echo ""
    validate_database
    echo ""
    validate_gpu
    echo ""
    
    # Generate final report
    generate_report
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

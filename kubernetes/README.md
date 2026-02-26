# MediMindPlus Kubernetes Deployment Guide

Complete production-ready Kubernetes configuration for MediMindPlus platform.

## 📁 Directory Structure

```
kubernetes/
├── base/                           # Base Kubernetes manifests
│   ├── namespace.yaml             # Namespace definition
│   ├── configmap.yaml             # Application configuration
│   ├── secrets.yaml               # Secrets template
│   ├── rbac.yaml                  # RBAC configuration
│   ├── postgres-*.yaml            # PostgreSQL deployment
│   ├── redis-*.yaml               # Redis deployment
│   ├── backend-*.yaml             # Backend application
│   ├── ml-service-*.yaml          # ML service
│   ├── nginx-*.yaml               # Load balancer
│   ├── prometheus-*.yaml          # Metrics collection
│   ├── grafana-*.yaml             # Dashboards
│   ├── ingress.yaml               # Ingress routing
│   └── kustomization.yaml         # Kustomize base
│
├── overlays/
│   ├── production/                # Production environment
│   │   ├── kustomization.yaml
│   │   ├── backend-replicas.yaml
│   │   ├── resources.yaml
│   │   └── secrets.env.example
│   │
│   └── staging/                   # Staging environment
│       ├── kustomization.yaml
│       └── backend-replicas.yaml
│
├── deploy.sh                      # Deployment automation script
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Kubernetes cluster** (one of):
   - AWS EKS
   - Google GKE
   - Azure AKS
   - Self-managed (kubeadm, k3s, etc.)

2. **Tools installed**:
   ```bash
   # kubectl
   brew install kubectl  # macOS
   # or download from https://kubernetes.io/docs/tasks/tools/

   # kustomize (optional, kubectl has it built-in)
   brew install kustomize

   # helm (for cert-manager)
   brew install helm
   ```

3. **kubectl configured** to connect to your cluster:
   ```bash
   kubectl cluster-info
   kubectl get nodes
   ```

### 1. Create Secrets

```bash
# Copy secrets template
cd kubernetes/overlays/production
cp secrets.env.example secrets.env

# Edit with your actual secrets
vim secrets.env
```

**IMPORTANT**: Never commit `secrets.env` to git! It's in `.gitignore`.

### 2. Update Docker Registry

Edit the following files and replace `your-docker-registry` with your actual registry:

- `kubernetes/base/backend-deployment.yaml` (line 37)
- `kubernetes/base/ml-service-deployment.yaml` (line 18)
- `kubernetes/overlays/production/kustomization.yaml` (lines 15-18)

**Options**:
- Docker Hub: `username/medimindplus-backend`
- AWS ECR: `123456789012.dkr.ecr.us-east-1.amazonaws.com/medimindplus-backend`
- GCR: `gcr.io/project-id/medimindplus-backend`
- Azure ACR: `yourregistry.azurecr.io/medimindplus-backend`

### 3. Build and Push Images

```bash
# Build backend image
cd backend
docker build -t your-docker-registry/medimindplus-backend:v1.0.0 .
docker push your-docker-registry/medimindplus-backend:v1.0.0

# Build ML service image
cd ../ml-service
docker build -t your-docker-registry/medimindplus-ml:v1.0.0 .
docker push your-docker-registry/medimindplus-ml:v1.0.0
```

### 4. Deploy to Kubernetes

```bash
# Deploy to staging
./kubernetes/deploy.sh staging apply

# Deploy to production
./kubernetes/deploy.sh production apply
```

The script will:
1. ✅ Check prerequisites
2. ✅ Create namespace
3. ✅ Create secrets
4. ✅ Deploy all services
5. ✅ Wait for pods to be ready
6. ✅ Run database migrations
7. ✅ Verify health checks
8. ✅ Show access information

### 5. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n medimindplus

# Check services
kubectl get svc -n medimindplus

# Check ingress
kubectl get ingress -n medimindplus

# View logs
kubectl logs -f deployment/backend -n medimindplus
```

## 🔧 Configuration

### Environment Variables

All configuration is in `kubernetes/base/configmap.yaml`:

- Database settings
- Redis settings
- API configuration
- Feature flags (enable/disable each of the 12 revolutionary features)
- Monitoring settings

### Secrets

All sensitive data is in `kubernetes/overlays/{environment}/secrets.env`:

- Database passwords
- Redis password
- JWT secrets
- API keys (OpenAI, SendGrid, Twilio)
- AWS credentials
- Sentry DSN

### Resource Limits

**Staging** (2 backend pods):
- Backend: 512Mi-1Gi RAM, 500m-1000m CPU
- Postgres: 1Gi-2Gi RAM, 500m-1000m CPU
- Redis: 256Mi-512Mi RAM, 250m-500m CPU

**Production** (5 backend pods):
- Backend: 1Gi-2Gi RAM, 1000m-2000m CPU
- Postgres: 2Gi-4Gi RAM, 1000m-2000m CPU
- Redis: 256Mi-512Mi RAM, 250m-500m CPU

### Horizontal Pod Autoscaling

Backend automatically scales:
- **Min replicas**: 3
- **Max replicas**: 20
- **Scale up**: When CPU > 70% or Memory > 80%
- **Scale down**: After 5 minutes of low usage

## 🌐 Ingress & Domain Setup

### Option 1: Using NGINX Ingress Controller

```bash
# Install NGINX Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install nginx-ingress ingress-nginx/ingress-nginx

# Install cert-manager for automatic SSL
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Option 2: Using Cloud Provider Load Balancer

**AWS ALB**:
```bash
# Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=your-cluster-name
```

**GCP Load Balancer**:
```bash
# GKE includes load balancer by default
# Just update ingress.yaml with your domain
```

### DNS Configuration

After deploying, get the LoadBalancer IP/hostname:

```bash
kubectl get ingress medimindplus-ingress -n medimindplus
```

Then create DNS A records:
- `api.medimindplus.com` → LoadBalancer IP
- `monitoring.medimindplus.com` → LoadBalancer IP

## 📊 Monitoring

### Prometheus

Access: `http://monitoring.medimindplus.com/prometheus`

**Key Metrics**:
- `http_request_duration_seconds` - API latency
- `virtual_health_twin_creations_total` - Feature usage
- `node_cpu_seconds_total` - Server CPU
- `node_memory_MemAvailable_bytes` - Server memory

### Grafana

Access: `http://monitoring.medimindplus.com/grafana`

Default credentials:
- Username: `admin`
- Password: (shown after deployment)

**Pre-configured dashboards**:
1. API Performance
2. Revolutionary Features Usage
3. Database Metrics
4. Infrastructure Health

## 🔒 Security

### Network Policies

Create network policies to restrict pod communication:

```bash
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: medimindplus
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
EOF
```

### Pod Security Standards

```bash
kubectl label namespace medimindplus \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted
```

### Secrets Management

**Recommended**: Use external secrets manager

**AWS Secrets Manager**:
```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets
```

**Google Secret Manager**:
```bash
gcloud secrets create medimindplus-secrets --data-file=secrets.env
```

## 🗄️ Database Management

### Backups

**Automatic backups with CronJob**:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: medimindplus
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -h postgres-service -U postgres medimindplus | \
              gzip > /backups/backup-$(date +%Y%m%d-%H%M%S).sql.gz
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: medimindplus-secrets
                  key: DB_PASSWORD
            volumeMounts:
            - name: backups
              mountPath: /backups
          restartPolicy: OnFailure
          volumes:
          - name: backups
            persistentVolumeClaim:
              claimName: postgres-backups-pvc
```

### Restore from Backup

```bash
# Copy backup to pod
kubectl cp backup.sql.gz postgres-pod:/tmp/backup.sql.gz -n medimindplus

# Restore
kubectl exec -it postgres-pod -n medimindplus -- bash
gunzip /tmp/backup.sql.gz
psql -U postgres medimindplus < /tmp/backup.sql
```

## 🚨 Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n medimindplus

# Check logs
kubectl logs <pod-name> -n medimindplus

# Common issues:
# 1. ImagePullBackOff - wrong registry or credentials
# 2. CrashLoopBackOff - check logs for errors
# 3. Pending - insufficient resources
```

### Database Connection Issues

```bash
# Test postgres connection
kubectl exec -it deployment/backend -n medimindplus -- \
  psql -h postgres-service -U postgres -d medimindplus

# Check postgres logs
kubectl logs deployment/postgres -n medimindplus
```

### High Memory Usage

```bash
# Check current resource usage
kubectl top pods -n medimindplus

# Increase limits if needed
kubectl set resources deployment/backend -n medimindplus \
  --limits=memory=2Gi,cpu=2000m \
  --requests=memory=1Gi,cpu=1000m
```

## 📈 Scaling

### Manual Scaling

```bash
# Scale backend to 10 replicas
kubectl scale deployment/backend --replicas=10 -n medimindplus

# Scale down to 3
kubectl scale deployment/backend --replicas=3 -n medimindplus
```

### Vertical Scaling (Increase Resources)

Edit `kubernetes/overlays/production/resources.yaml` and redeploy.

### Cluster Autoscaling

**AWS EKS**:
```bash
eksctl create iamserviceaccount \
  --cluster=your-cluster \
  --namespace=kube-system \
  --name=cluster-autoscaler \
  --attach-policy-arn=arn:aws:iam::aws:policy/AutoScalingFullAccess \
  --approve
```

**GKE**:
```bash
gcloud container clusters update your-cluster \
  --enable-autoscaling \
  --min-nodes=3 \
  --max-nodes=20
```

## 🔄 CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        kubeconfig: ${{ secrets.KUBE_CONFIG }}

    - name: Build and push images
      run: |
        docker build -t ${{ secrets.REGISTRY }}/medimindplus-backend:${{ github.sha }} ./backend
        docker push ${{ secrets.REGISTRY }}/medimindplus-backend:${{ github.sha }}

    - name: Deploy to Kubernetes
      run: |
        cd kubernetes/overlays/production
        kustomize edit set image your-docker-registry/medimindplus-backend=${{ secrets.REGISTRY }}/medimindplus-backend:${{ github.sha }}
        kubectl apply -k .
```

## 🎯 Revolutionary Features Verification

After deployment, test all 12 revolutionary features:

```bash
# Get API endpoint
BACKEND_URL=$(kubectl get svc nginx-service -n medimindplus -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Get auth token
TOKEN=$(curl -X POST http://${BACKEND_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' | jq -r '.token')

# Test Revolutionary Features

# 1. Virtual Health Twin
curl -X POST http://${BACKEND_URL}/api/v1/health-twin/create \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123"}'

# 2. Mental Health Crisis Assessment
curl http://${BACKEND_URL}/api/v1/mental-health/crisis-assessment/user-123 \
  -H "Authorization: Bearer ${TOKEN}"

# 3. Multi-Omics Nutrition Plan
curl http://${BACKEND_URL}/api/v1/omics/user-123/nutrition-plan \
  -H "Authorization: Bearer ${TOKEN}"

# 4. Biological Age
curl http://${BACKEND_URL}/api/v1/longevity/user-123/biological-age \
  -H "Authorization: Bearer ${TOKEN}"

# 5. Employer Dashboard
curl http://${BACKEND_URL}/api/v1/employer/employer-123/dashboard \
  -H "Authorization: Bearer ${TOKEN}"

# 6. Provider Performance
curl http://${BACKEND_URL}/api/v1/provider/provider-123/performance \
  -H "Authorization: Bearer ${TOKEN}"

# 7. Federated Learning Status
curl http://${BACKEND_URL}/api/v1/federated-learning/status \
  -H "Authorization: Bearer ${TOKEN}"

# 8. Insurance Premium Calculation
curl http://${BACKEND_URL}/api/v1/insurance/user-123/premium \
  -H "Authorization: Bearer ${TOKEN}"

# 9. Drug Discovery Candidates
curl http://${BACKEND_URL}/api/v1/drug-discovery/candidates/diabetes \
  -H "Authorization: Bearer ${TOKEN}"

# 10. Pandemic Early Warning
curl http://${BACKEND_URL}/api/v1/pandemic/early-warning \
  -H "Authorization: Bearer ${TOKEN}"

# 11. Health Education Courses
curl http://${BACKEND_URL}/api/v1/health-education/courses \
  -H "Authorization: Bearer ${TOKEN}"

# 12. Data Marketplace Datasets
curl http://${BACKEND_URL}/api/v1/data-marketplace/datasets \
  -H "Authorization: Bearer ${TOKEN}"
```

All 50+ APIs should return `200 OK` responses!

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kustomize Documentation](https://kustomize.io/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- [Grafana Documentation](https://grafana.com/docs/)

## 🆘 Support

For issues with this deployment:

1. Check logs: `kubectl logs deployment/backend -n medimindplus`
2. Check events: `kubectl get events -n medimindplus --sort-by='.lastTimestamp'`
3. Check pod status: `kubectl describe pod <pod-name> -n medimindplus`

## 📝 License

Copyright 2025 MediMindPlus. All rights reserved.

---

**Next Steps**:

1. ✅ Create secrets file: `kubernetes/overlays/production/secrets.env`
2. ✅ Update docker registry in deployment files
3. ✅ Build and push Docker images
4. ✅ Run deployment: `./kubernetes/deploy.sh production apply`
5. ✅ Configure DNS records
6. ✅ Test all 50+ API endpoints
7. ✅ Set up monitoring alerts
8. ✅ Launch! 🚀

**The infrastructure for a $1.15B healthcare platform is ready to deploy.**

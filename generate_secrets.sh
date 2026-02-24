#!/bin/bash

# ========================================
# MediMindPlus Secret Generation Script
# ========================================
# This script generates secure random secrets for your .env file
# Usage: ./generate_secrets.sh

set -e

echo "=========================================="
echo "MediMindPlus Secret Generator"
echo "=========================================="
echo ""
echo "Generating secure secrets for your .env file..."
echo ""

# Function to generate a random string
generate_secret() {
    openssl rand -hex 32
}

# Function to generate a password
generate_password() {
    openssl rand -base64 24 | tr -d "=+/" | cut -c1-24
}

# Generate all secrets
JWT_SECRET=$(generate_secret)
JWT_REFRESH_SECRET=$(generate_secret)
ENCRYPTION_KEY=$(generate_secret)
DB_PASSWORD=$(generate_password)
REDIS_PASSWORD=$(generate_password)
GRAFANA_ADMIN_PASSWORD=$(generate_password)

# Display the generated secrets
echo "=========================================="
echo "GENERATED SECRETS (Copy to your .env file)"
echo "=========================================="
echo ""
echo "# Database"
echo "DB_PASSWORD=$DB_PASSWORD"
echo ""
echo "# Redis"
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
echo ""
echo "# JWT Authentication"
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""
echo "# HIPAA Compliance"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""
echo "# Grafana Monitoring"
echo "GRAFANA_ADMIN_PASSWORD=$GRAFANA_ADMIN_PASSWORD"
echo ""
echo "=========================================="
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "=========================================="
echo "1. Never commit these secrets to git"
echo "2. Store them securely (password manager recommended)"
echo "3. Use different secrets for dev/staging/production"
echo "4. Rotate secrets regularly in production"
echo "=========================================="

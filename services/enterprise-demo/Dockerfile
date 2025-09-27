# Enterprise Demo Automation Service
FROM node:20-alpine

# FROM node:20-alpine3.19@sha256:7ea13c9313940b8c434492ad9e9c6587cbe0230912afcfca3a9e01a705833773

WORKDIR /app

# Install curl for health checks and update packages for security
RUN apk update && apk upgrade && apk add --no-cache curl && rm -rf /var/cache/apk/*

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S enterprise -u 1001

# Set ownership
RUN chown -R enterprise:nodejs /app
USER enterprise

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8005/health || exit 1

EXPOSE 8005

CMD ["node", "server.js"]

# backend/Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    postgresql-client

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci --legacy-peer-deps

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S medimind -u 1001 && \
    chown -R medimind:nodejs /app
USER medimind

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "dist/index.js"]

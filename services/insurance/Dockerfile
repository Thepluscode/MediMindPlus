# Insurance Partner Integration Service
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S insurance -u 1001

# Set ownership
RUN chown -R insurance:nodejs /app
USER insurance

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8002/health || exit 1

EXPOSE 8002

CMD ["node", "server.js"]

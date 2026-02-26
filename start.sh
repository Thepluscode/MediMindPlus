#!/bin/bash
echo "=== Starting MediMindPlus Backend ==="
cd /app/backend || { echo "FAILED: cd /app/backend"; exit 1; }

echo "Running migrations..."
NODE_ENV=production npx knex --knexfile knexfile.js migrate:latest || echo "Warning: Migrations failed"

echo "Starting Node.js application..."
node dist/index.js

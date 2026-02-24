#!/bin/bash
set -e
echo "=== MediMindPlus Backend Build ==="
cd /app/backend
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Installing dependencies..."
npm ci --legacy-peer-deps
echo "Compiling TypeScript..."
npx tsc -p tsconfig.railway.json
echo "=== Build complete ==="
ls dist/index.js && echo "dist/index.js exists" || (echo "ERROR: dist/index.js not found" && exit 1)

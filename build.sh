#!/bin/bash
echo "=== MediMindPlus Backend Build ==="
echo "Working dir: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

cd /app/backend || { echo "FAILED: cd /app/backend"; exit 1; }
echo "Now in: $(pwd)"
echo "Files in /app/backend:"
ls -la | head -10

echo "Installing dependencies..."
npm ci --legacy-peer-deps
echo "Install exit code: $?"

echo "Checking tsconfig.railway.json..."
ls -la tsconfig.railway.json || echo "WARNING: tsconfig.railway.json not found"

echo "Compiling TypeScript..."
npx tsc -p tsconfig.railway.json 2>&1
TSC_EXIT=$?
echo "TSC exit code: $TSC_EXIT"

echo "Checking dist..."
ls dist/ 2>&1 | head -5
ls dist/index.js 2>&1 && echo "SUCCESS: dist/index.js exists" || echo "ERROR: dist/index.js not found"

#!/bin/bash

# ============================================================================
# Console.log to Logger Replacement Script
# ============================================================================
# Automatically replaces console.log/error/warn/info with proper logger calls
# Usage: ./scripts/replace-console-with-logger.sh

set -e

BACKEND_SRC="/Users/theophilusogieva/Desktop/MediMindPlus/MediMindPlus/backend/src"
FILES_MODIFIED=0

echo "=========================================="
echo "Console.log to Logger Replacement"
echo "=========================================="
echo ""
echo "Searching for files with console statements..."

# Find all TypeScript files with console statements
FILES=$(grep -rl "console\.\(log\|error\|warn\|info\|debug\)" "$BACKEND_SRC" --include="*.ts" --exclude-dir=node_modules || true)

if [ -z "$FILES" ]; then
    echo "✓ No console statements found!"
    exit 0
fi

echo "Found console statements in these files:"
echo "$FILES"
echo ""
echo "Starting replacement..."
echo ""

for file in $FILES; do
    echo "Processing: $file"

    # Check if file already imports logger
    if ! grep -q "import.*logger.*from.*'.*utils/logger" "$file"; then
        # Determine correct import path depth
        DEPTH=$(echo "$file" | sed "s|$BACKEND_SRC||" | tr -cd '/' | wc -c)
        IMPORT_PATH="../"
        for ((i=1; i<DEPTH; i++)); do
            IMPORT_PATH="../$IMPORT_PATH"
        done
        IMPORT_PATH="${IMPORT_PATH}utils/logger"

        # Add import statement after other imports
        sed -i.bak "1a\\
import { logger } from '$IMPORT_PATH';
" "$file"
    fi

    # Replace console statements
    sed -i.bak \
        -e 's/console\.log(/logger.info(/g' \
        -e 's/console\.error(/logger.error(/g' \
        -e 's/console\.warn(/logger.warn(/g' \
        -e 's/console\.info(/logger.info(/g' \
        -e 's/console\.debug(/logger.debug(/g' \
        "$file"

    # Remove backup file
    rm "${file}.bak" 2>/dev/null || true

    FILES_MODIFIED=$((FILES_MODIFIED + 1))
done

echo ""
echo "=========================================="
echo "✓ Replacement Complete!"
echo "=========================================="
echo "Files modified: $FILES_MODIFIED"
echo ""
echo "⚠️  IMPORTANT: Review the changes before committing:"
echo "   git diff backend/src"
echo ""
echo "Run TypeScript compiler to check for errors:"
echo "   npm run typecheck"

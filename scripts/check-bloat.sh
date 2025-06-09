#!/bin/bash

# HustleMode.ai Anti-Bloat Checker
# Prevents repository bloat by checking for common patterns

set -e

echo "🛡️ Running HustleMode.ai Anti-Bloat Check..."

# Function to report violations
report_violation() {
    echo "❌ BLOAT DETECTED: $1"
    echo "   $2"
    VIOLATIONS=$((VIOLATIONS + 1))
}

# Initialize violation counter
VIOLATIONS=0

# Check for empty directories (excluding git internals)
echo "🔍 Checking for empty directories..."
while IFS= read -r -d '' dir; do
    if [ -d "$dir" ] && [[ ! "$dir" =~ ^\./\.git ]] && [ ! "$dir" = "./.cursor" ]; then
        if [ -z "$(ls -A "$dir" 2>/dev/null)" ]; then
            report_violation "Empty directory found" "$dir should be removed"
        fi
    fi
done < <(find . -type d -not -path "./.git/*" -print0 2>/dev/null)

# Check for zip files in repository
echo "🔍 Checking for zip files..."
if find . -name "*.zip" -not -path "./.git/*" | grep -q .; then
    report_violation "Zip files in repository" "Build artifacts should be in temp/ directory"
    find . -name "*.zip" -not -path "./.git/*"
fi

# Check for multiple Azure Functions directories
echo "🔍 Checking for duplicate Azure Functions..."
AZURE_DIRS=$(find . -type d -name "*azure*function*" -not -path "./.git/*" | wc -l)
if [ "$AZURE_DIRS" -gt 1 ]; then
    report_violation "Multiple Azure Functions directories" "Only azure-functions-deploy/ should exist"
fi

# Check for duplicate requirements.txt
echo "🔍 Checking for duplicate requirements.txt..."
REQ_FILES=$(find . -name "requirements.txt" -not -path "./.git/*" | wc -l)
if [ "$REQ_FILES" -gt 1 ]; then
    report_violation "Multiple requirements.txt files" "Only azure-functions-deploy/requirements.txt should exist"
    find . -name "requirements.txt" -not -path "./.git/*"
fi

# Check for duplicate host.json
echo "🔍 Checking for duplicate host.json..."
HOST_FILES=$(find . -name "host.json" -not -path "./.git/*" | wc -l)
if [ "$HOST_FILES" -gt 1 ]; then
    report_violation "Multiple host.json files" "Only azure-functions-deploy/host.json should exist"
    find . -name "host.json" -not -path "./.git/*"
fi

# Check for deprecated patterns
echo "🔍 Checking for deprecated patterns..."
if [ -f ".cursorrules" ]; then
    report_violation "Deprecated .cursorrules file" "Use .cursor/rules/*.mdc instead"
fi

# Check for future/planning directories
echo "🔍 Checking for planning directories..."
if find . -type d -name "*future*" -o -name "*planning*" -o -name "*todo*" | grep -q .; then
    report_violation "Planning directories found" "Use GitHub issues or docs instead"
    find . -type d -name "*future*" -o -name "*planning*" -o -name "*todo*"
fi

# Check for architecture mixing
echo "🔍 Checking for mixed architectures..."
FASTAPI_FILES=$(find . -name "app.py" -o -name "main.py" | grep -v ".git" | wc -l)
LAMBDA_DIRS=$(find . -type d -name "*lambda*" -not -path "./.git/*" | wc -l)
if [ "$FASTAPI_FILES" -gt 0 ] || [ "$LAMBDA_DIRS" -gt 0 ]; then
    report_violation "Mixed architectures detected" "Project should only use Azure Functions"
fi

# Check for orphaned schema files (excluding documentation)
echo "🔍 Checking for orphaned schemas..."
if find . -name "*.sql" -not -path "./.git/*" -not -path "./.cursor/*" | grep -q .; then
    echo "⚠️  SQL schema files found - verify they're actively used:"
    find . -name "*.sql" -not -path "./.git/*" -not -path "./.cursor/*"
fi

# Summary
echo ""
if [ "$VIOLATIONS" -eq 0 ]; then
    echo "✅ No bloat detected! Repository is clean."
    exit 0
else
    echo "❌ Found $VIOLATIONS bloat violations!"
    echo "   Review and fix these issues before committing."
    exit 1
fi 
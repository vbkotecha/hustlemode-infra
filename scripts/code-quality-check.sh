#!/bin/bash

# HustleMode.ai Code Quality Enforcement Script
# Automatically prevents code quality regression
# Usage: ./scripts/code-quality-check.sh [--strict]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
STRICT_MODE=${1:-""}
MAX_FUNCTION_LINES=100
MAX_SHARED_LINES=80
MAX_HANDLER_LINES=120
MAX_UTIL_LINES=60
MIN_TEST_COVERAGE=80

# Counters
VIOLATIONS=0
WARNINGS=0

echo -e "${BLUE}🔍 HustleMode.ai Code Quality Check${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Function to report violation
report_violation() {
    local severity=$1
    local message=$2
    
    if [[ "$severity" == "ERROR" ]]; then
        echo -e "${RED}❌ ERROR: $message${NC}"
        ((VIOLATIONS++))
    else
        echo -e "${YELLOW}⚠️  WARNING: $message${NC}"
        ((WARNINGS++))
    fi
}

# Function to report success
report_success() {
    local message=$1
    echo -e "${GREEN}✅ $message${NC}"
}

# Check 1: File Size Violations
echo -e "${PURPLE}📏 Checking File Size Limits...${NC}"

# Check Edge Function files
echo "  Checking Edge Functions (max $MAX_FUNCTION_LINES lines)..."
for file in supabase/functions/*/index.ts; do
    if [[ -f "$file" ]]; then
        lines=$(wc -l < "$file" 2>/dev/null || echo "0")
        if [[ $lines -gt $MAX_FUNCTION_LINES ]]; then
            report_violation "ERROR" "File $file has $lines lines (max $MAX_FUNCTION_LINES)"
        fi
    fi
done

# Check Shared Module files
echo "  Checking Shared Modules (max $MAX_SHARED_LINES lines)..."
find supabase/shared -name "*.ts" -not -path "*/types.ts" -not -name "index.ts" 2>/dev/null | while read -r file; do
    if [[ -f "$file" ]]; then
        lines=$(wc -l < "$file" 2>/dev/null || echo "0")
        if [[ $lines -gt $MAX_SHARED_LINES ]]; then
            report_violation "ERROR" "File $file has $lines lines (max $MAX_SHARED_LINES)"
        fi
    fi
done

# Check Handler files
echo "  Checking Handler files (max $MAX_HANDLER_LINES lines)..."
find supabase/functions -name "handlers.ts" 2>/dev/null | while read -r file; do
    if [[ -f "$file" ]]; then
        lines=$(wc -l < "$file" 2>/dev/null || echo "0")
        if [[ $lines -gt $MAX_HANDLER_LINES ]]; then
            report_violation "ERROR" "File $file has $lines lines (max $MAX_HANDLER_LINES)"
        fi
    fi
done

report_success "File size check completed"
echo ""

# Check 2: Code Duplication Detection
echo -e "${PURPLE}🔄 Checking for Code Duplication...${NC}"

# Check for duplicate function names
echo "  Checking for duplicate function names..."
duplicate_functions=$(grep -r "export function\|async function" supabase/ --include="*.ts" 2>/dev/null | \
    sed 's/.*function \([^(]*\).*/\1/' 2>/dev/null | \
    sort 2>/dev/null | uniq -d 2>/dev/null || echo "")

if [[ -n "$duplicate_functions" ]]; then
    while IFS= read -r func; do
        if [[ -n "$func" ]]; then
            report_violation "WARNING" "Potentially duplicate function: $func"
        fi
    done <<< "$duplicate_functions"
else
    report_success "No duplicate function names found"
fi

# Check for large similar code blocks (simplified detection)
echo "  Checking for potential code duplication..."
temp_file=$(mktemp)
find supabase -name "*.ts" -exec grep -l "await.*fetch\|await.*supabase" {} \; > "$temp_file" 2>/dev/null || true

if [[ -s "$temp_file" ]]; then
    file_count=$(wc -l < "$temp_file" 2>/dev/null || echo "0")
    if [[ $file_count -gt 3 ]]; then
        report_violation "WARNING" "Found $file_count files with similar API patterns - check for duplication"
    fi
fi
rm -f "$temp_file"

report_success "Duplication check completed"
echo ""

# Check 3: File Organization
echo -e "${PURPLE}📁 Checking File Organization...${NC}"

# Check for files in wrong locations
echo "  Checking directory structure..."

# Functions should only have proper subdirectories
if ls supabase/functions/*.ts 2>/dev/null >/dev/null; then
    report_violation "ERROR" "Found TypeScript files directly in functions/ directory - should be in subdirectories"
fi

# Shared modules should be properly categorized
uncategorized_shared=$(find supabase/shared -maxdepth 1 -name "*.ts" -not -name "types.ts" -not -name "config.ts" 2>/dev/null | wc -l 2>/dev/null || echo "0")
if [[ $uncategorized_shared -gt 5 ]]; then
    report_violation "WARNING" "Found $uncategorized_shared uncategorized files in shared/ - consider domain grouping"
fi

report_success "File organization check completed"
echo ""

# Check 4: TypeScript Compilation
echo -e "${PURPLE}🔧 Checking TypeScript Compilation...${NC}"

if command -v deno >/dev/null 2>&1; then
    cd supabase/functions
    if deno check --remote import_map.json >/dev/null 2>&1; then
        report_success "TypeScript compilation successful"
    else
        report_violation "ERROR" "TypeScript compilation failed"
    fi
    cd - >/dev/null
else
    report_success "TypeScript compilation skipped (Deno not installed)"
fi

echo ""

# Check 5: Import Cycles (Basic Detection)
echo -e "${PURPLE}🔗 Checking for Import Cycles...${NC}"

# Create a simple dependency graph and check for obvious cycles
temp_deps=$(mktemp)
find supabase -name "*.ts" -exec grep -l "from '\.\." {} \; 2>/dev/null | while read -r file; do
    imports=$(grep "from '\.\." "$file" 2>/dev/null | sed "s/.*from '\([^']*\)'.*/\1/" 2>/dev/null | tr '\n' ' ' || echo "")
    echo "$file: $imports" >> "$temp_deps"
done

# Basic cycle detection (simplified)
if grep -q "shared.*functions\|functions.*shared" "$temp_deps" 2>/dev/null; then
    report_violation "WARNING" "Potential circular dependencies detected between functions and shared"
fi

rm -f "$temp_deps"
report_success "Import cycle check completed"
echo ""

# Check 6: Performance Patterns
echo -e "${PURPLE}⚡ Checking Performance Patterns...${NC}"

# Check for potential performance issues
performance_issues=0

# Check for sync operations in async contexts
if grep -r "JSON.parse\|JSON.stringify" supabase/functions/ --include="*.ts" 2>/dev/null | grep -v console >/dev/null 2>&1; then
    ((performance_issues++))
fi

# Check for missing error handling
if grep -r "await.*fetch" supabase/ --include="*.ts" 2>/dev/null | grep -v "try\|catch" >/dev/null 2>&1; then
    report_violation "WARNING" "Found fetch calls without visible error handling"
    ((performance_issues++))
fi

if [[ $performance_issues -eq 0 ]]; then
    report_success "Performance patterns look good"
fi

echo ""

# Check 7: Security Patterns
echo -e "${PURPLE}🛡️ Checking Security Patterns...${NC}"

# Check for hardcoded secrets (basic patterns)
if grep -r "password\s*=\s*['\"][^'\"]*['\"]" supabase/ --include="*.ts" 2>/dev/null | grep -v "Deno.env.get\|getConfig\|process.env" >/dev/null 2>&1; then
    report_violation "ERROR" "Potential hardcoded secrets found"
else
    report_success "No hardcoded secrets detected"
fi

# Check for proper input validation
if ! grep -r "validate\|sanitize" supabase/shared --include="*.ts" >/dev/null 2>&1; then
    report_violation "WARNING" "Limited input validation patterns found"
fi

echo ""

# Final Report
echo -e "${BLUE}📊 QUALITY REPORT SUMMARY${NC}"
echo -e "${BLUE}========================${NC}"

if [[ $VIOLATIONS -eq 0 ]]; then
    report_success "All critical checks passed! ✨"
else
    echo -e "${RED}❌ Found $VIOLATIONS critical violations${NC}"
fi

if [[ $WARNINGS -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  Found $WARNINGS warnings to address${NC}"
fi

echo ""
echo -e "${PURPLE}Code Quality Score: $((100 - VIOLATIONS * 20 - WARNINGS * 5))%${NC}"

# Exit with error if violations found (strict mode includes warnings)
if [[ $VIOLATIONS -gt 0 ]]; then
    echo ""
    echo -e "${RED}🚫 Code quality check FAILED${NC}"
    echo -e "${YELLOW}Fix critical violations before committing/deploying${NC}"
    exit 1
elif [[ "$STRICT_MODE" == "--strict" && $WARNINGS -gt 0 ]]; then
    echo ""
    echo -e "${RED}🚫 Code quality check FAILED (strict mode)${NC}"
    echo -e "${YELLOW}Fix all warnings in strict mode${NC}"
    exit 1
else
    echo ""
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${GREEN}🎉 Code quality check PASSED${NC} ${YELLOW}(with $WARNINGS warnings)${NC}"
    else
        echo -e "${GREEN}🎉 Code quality check PASSED${NC}"
    fi
    exit 0
fi 
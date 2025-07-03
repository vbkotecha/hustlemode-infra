#!/bin/bash

# HustleMode.ai - Automated Migration Deployment Script
# Safely deploys database migrations with version tracking and validation
# Usage: ./scripts/deploy-migrations.sh [--local|--production] [--dry-run]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
MIGRATIONS_DIR="supabase/migrations"
PROJECT_REF="yzfclhnkxpgyxeklrvur"
HEALTH_ENDPOINT="https://${PROJECT_REF}.supabase.co/functions/v1/health"

# Function to display usage
usage() {
    echo "Usage: $0 [--local|--production] [--dry-run] [--force]"
    echo ""
    echo "Options:"
    echo "  --local       : Deploy to local Supabase instance (default)"
    echo "  --production  : Deploy to production Supabase instance"
    echo "  --dry-run     : Show what would be deployed without executing"
    echo "  --force       : Skip safety checks (use with caution)"
    echo "  --help        : Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --local                    # Deploy to local development"
    echo "  $0 --production --dry-run     # Preview production deployment"
    echo "  $0 --production               # Deploy to production"
    echo ""
    echo "Safety Features:"
    echo "  - Validates migration files before deployment"
    echo "  - Checks database connectivity"
    echo "  - Verifies schema version tracking"
    echo "  - Tests health endpoints after deployment"
    echo "  - Provides rollback guidance on failures"
    exit 1
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check if supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        echo -e "${RED}❌ Error: Supabase CLI not installed${NC}"
        echo -e "${YELLOW}   Install: npm install -g supabase${NC}"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [[ ! -d "$MIGRATIONS_DIR" ]]; then
        echo -e "${RED}❌ Error: Migrations directory not found: $MIGRATIONS_DIR${NC}"
        echo -e "${YELLOW}   Are you running this from the project root?${NC}"
        exit 1
    fi
    
    # Check if there are migration files
    local migration_count=$(ls -1 ${MIGRATIONS_DIR}/*.sql 2>/dev/null | wc -l)
    if [[ $migration_count -eq 0 ]]; then
        echo -e "${RED}❌ Error: No migration files found in $MIGRATIONS_DIR${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites satisfied${NC}"
}

# Function to validate migration files
validate_migrations() {
    echo -e "${BLUE}🔍 Validating migration files...${NC}"
    
    local error_count=0
    
    for migration_file in ${MIGRATIONS_DIR}/*.sql; do
        if [[ -f "$migration_file" ]]; then
            local filename=$(basename "$migration_file")
            echo -e "   📄 Checking: $filename"
            
            # Check if file has version in name
            if [[ ! "$filename" =~ _v[0-9]+\.[0-9]+\.[0-9]+_ ]]; then
                echo -e "${RED}     ❌ Missing version in filename${NC}"
                ((error_count++))
            fi
            
            # Check if file contains schema_versions insert
            if ! grep -q "INSERT INTO schema_versions" "$migration_file"; then
                echo -e "${YELLOW}     ⚠️  Missing schema_versions entry${NC}"
            fi
            
            # Check for SQL syntax (basic)
            if grep -q "CREATE TABLE.*(" "$migration_file" && ! grep -q ";" "$migration_file"; then
                echo -e "${RED}     ❌ Possible SQL syntax issue (missing semicolons)${NC}"
                ((error_count++))
            fi
        fi
    done
    
    if [[ $error_count -gt 0 ]]; then
        echo -e "${RED}❌ Migration validation failed with $error_count errors${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All migrations validated${NC}"
}

# Function to get current database version
get_database_version() {
    local target=$1
    
    if [[ "$target" == "local" ]]; then
        # Try to connect to local database
        local result=$(supabase db diff --local --schema public 2>/dev/null || echo "error")
        if [[ "$result" == "error" ]]; then
            echo "unknown"
        else
            echo "local-connected"
        fi
    else
        # Try to get version from production health endpoint
        local health_response=$(curl -s "$HEALTH_ENDPOINT" 2>/dev/null || echo "error")
        if [[ "$health_response" == "error" ]] || [[ ! "$health_response" =~ "schema_version" ]]; then
            echo "unknown"
        else
            echo "$health_response" | grep -o '"schema_version":"[^"]*"' | cut -d'"' -f4 || echo "unknown"
        fi
    fi
}

# Function to deploy migrations
deploy_migrations() {
    local target=$1
    local dry_run=$2
    local force=$3
    
    echo -e "${PURPLE}🚀 Starting migration deployment...${NC}"
    echo -e "${YELLOW}   Target: $target${NC}"
    echo -e "${YELLOW}   Dry Run: $dry_run${NC}"
    
    # Get current database version
    local current_version=$(get_database_version "$target")
    echo -e "${YELLOW}   Current Version: $current_version${NC}"
    
    # Show migrations to be applied
    echo -e "${BLUE}📋 Migrations to apply:${NC}"
    for migration_file in ${MIGRATIONS_DIR}/*.sql; do
        if [[ -f "$migration_file" ]]; then
            local filename=$(basename "$migration_file")
            echo -e "   📄 $filename"
        fi
    done
    
    if [[ "$dry_run" == "true" ]]; then
        echo -e "${YELLOW}🔍 DRY RUN: Would deploy the above migrations${NC}"
        return 0
    fi
    
    # Safety confirmation for production
    if [[ "$target" == "production" ]] && [[ "$force" != "true" ]]; then
        echo ""
        echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT WARNING${NC}"
        echo -e "${YELLOW}   This will deploy migrations to production database${NC}"
        echo -e "${YELLOW}   Current version: $current_version${NC}"
        echo ""
        read -p "Continue with production deployment? (type 'yes' to confirm): " confirm
        if [[ "$confirm" != "yes" ]]; then
            echo -e "${YELLOW}🛑 Deployment cancelled${NC}"
            exit 0
        fi
    fi
    
    # Deploy based on target
    echo -e "${BLUE}🔨 Deploying migrations...${NC}"
    
    if [[ "$target" == "local" ]]; then
        echo -e "${YELLOW}   Running: supabase db reset${NC}"
        supabase db reset --linked
    else
        echo -e "${YELLOW}   Running: supabase db push${NC}"
        supabase db push --linked
    fi
    
    echo -e "${GREEN}✅ Migration deployment completed${NC}"
}

# Function to verify deployment
verify_deployment() {
    local target=$1
    
    echo -e "${BLUE}🔍 Verifying deployment...${NC}"
    
    if [[ "$target" == "local" ]]; then
        # Check local database
        echo -e "${YELLOW}   Checking local database connection...${NC}"
        if supabase db diff --local >/dev/null 2>&1; then
            echo -e "${GREEN}   ✅ Local database accessible${NC}"
        else
            echo -e "${RED}   ❌ Local database connection failed${NC}"
            return 1
        fi
    else
        # Check production health endpoint
        echo -e "${YELLOW}   Checking production health endpoint...${NC}"
        local health_response=$(curl -s -w "HTTP_CODE:%{http_code}" "$HEALTH_ENDPOINT")
        local http_code=$(echo "$health_response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
        
        if [[ "$http_code" == "200" ]]; then
            echo -e "${GREEN}   ✅ Health endpoint responding (HTTP $http_code)${NC}"
            
            # Extract and display schema version
            local schema_version=$(echo "$health_response" | grep -o '"schema_version":"[^"]*"' | cut -d'"' -f4)
            if [[ -n "$schema_version" ]]; then
                echo -e "${GREEN}   ✅ Schema version: $schema_version${NC}"
            fi
        else
            echo -e "${RED}   ❌ Health endpoint failed (HTTP $http_code)${NC}"
            return 1
        fi
    fi
    
    echo -e "${GREEN}✅ Deployment verification successful${NC}"
}

# Function to show rollback guidance
show_rollback_guidance() {
    echo -e "${RED}🚨 DEPLOYMENT FAILED${NC}"
    echo ""
    echo -e "${YELLOW}📋 Rollback Options:${NC}"
    echo -e "   1. Manual rollback (if recent):"
    echo -e "      ${BLUE}supabase db reset --linked${NC}"
    echo ""
    echo -e "   2. Restore from backup:"
    echo -e "      ${BLUE}# Use Supabase Dashboard to restore from backup${NC}"
    echo ""
    echo -e "   3. Fix migration and redeploy:"
    echo -e "      ${BLUE}./scripts/create-migration.sh \"fix_issue\" hotfix${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Next Steps:${NC}"
    echo -e "   - Review migration files for errors"
    echo -e "   - Check Supabase logs for detailed error information"
    echo -e "   - Test fix on local environment first"
    echo -e "   - Contact team if rollback assistance needed"
}

# Parse command line arguments
TARGET="local"
DRY_RUN="false"
FORCE="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            TARGET="local"
            shift
            ;;
        --production)
            TARGET="production"
            shift
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --force)
            FORCE="true"
            shift
            ;;
        --help|-h)
            usage
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# Main execution
main() {
    echo -e "${BLUE}🏗️  HustleMode.ai Migration Deployer${NC}"
    echo -e "${BLUE}====================================${NC}"
    
    # Run code quality checks before deployment
    echo -e "${BLUE}🔍 Running code quality checks...${NC}"
    if ! ./scripts/code-quality-check.sh; then
        echo -e "${RED}❌ Code quality check failed - cannot deploy${NC}"
        echo -e "${YELLOW}Fix quality issues before deploying${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Code quality checks passed${NC}"
    echo ""
    
    # Run pre-deployment checks
    check_prerequisites
    validate_migrations
    
    # Deploy migrations
    if deploy_migrations "$TARGET" "$DRY_RUN" "$FORCE"; then
        if [[ "$DRY_RUN" != "true" ]]; then
            # Verify deployment
            if verify_deployment "$TARGET"; then
                echo ""
                echo -e "${GREEN}🎉 SUCCESS: Migration deployment completed successfully!${NC}"
                echo -e "${GREEN}   Target: $TARGET${NC}"
                echo -e "${GREEN}   All validations passed${NC}"
                
                if [[ "$TARGET" == "production" ]]; then
                    echo ""
                    echo -e "${BLUE}📊 Production Status:${NC}"
                    echo -e "   Health: $HEALTH_ENDPOINT"
                    echo -e "   Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
                fi
            else
                show_rollback_guidance
                exit 1
            fi
        fi
    else
        show_rollback_guidance
        exit 1
    fi
}

# Run main function
main 
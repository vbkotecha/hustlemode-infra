#!/bin/bash

# HustleMode.ai Supabase Edge Functions Deployment Script
# Deploys all Edge Functions with proper validation and error handling

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FUNCTIONS_DIR="$PROJECT_ROOT/supabase-edge-functions"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate environment
validate_environment() {
    log_info "Validating deployment environment..."
    
    # Check if Supabase CLI is installed
    if ! command_exists supabase; then
        log_error "Supabase CLI is not installed. Install with: npm install -g supabase"
        log_info "Or visit: https://supabase.com/docs/guides/cli"
        exit 1
    fi
    
    # Check if Deno is installed  
    if ! command_exists deno; then
        log_error "Deno is not installed. Install with: curl -fsSL https://deno.land/x/install/install.sh | sh"
        exit 1
    fi
    
    # Check if logged into Supabase
    if ! supabase projects list >/dev/null 2>&1; then
        log_error "Not logged into Supabase CLI. Run: supabase login"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Validate required environment variables
validate_env_vars() {
    log_info "Validating environment variables..."
    
    local required_vars=(
        "SUPABASE_PROJECT_REF"
        "GROQ_API_KEY"
        "MEM0_API_KEY"
        "WHATSAPP_TOKEN"
        "WHATSAPP_PHONE_NUMBER_ID"
        "WHATSAPP_VERIFY_TOKEN"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        log_info "Set these variables in your environment or .env file"
        exit 1
    fi
    
    log_success "Environment variables validated"
}

# Link to Supabase project
link_project() {
    log_info "Linking to Supabase project: $SUPABASE_PROJECT_REF"
    
    if ! supabase link --project-ref "$SUPABASE_PROJECT_REF"; then
        log_error "Failed to link to Supabase project"
        exit 1
    fi
    
    log_success "Successfully linked to project"
}

# Validate function code
validate_functions() {
    log_info "Validating Edge Function code..."
    
    cd "$FUNCTIONS_DIR"
    
    # Check TypeScript syntax
    if ! deno check functions/*/index.ts; then
        log_error "TypeScript validation failed"
        exit 1
    fi
    
    # Check if all required functions exist
    local required_functions=("health" "chat" "whatsapp")
    
    for func in "${required_functions[@]}"; do
        if [[ ! -f "functions/$func/index.ts" ]]; then
            log_error "Missing function: $func"
            exit 1
        fi
    done
    
    log_success "Function validation passed"
}

# Deploy individual function
deploy_function() {
    local function_name="$1"
    local deploy_args="$2"
    
    log_info "Deploying function: $function_name"
    
    if supabase functions deploy "$function_name" $deploy_args; then
        log_success "Successfully deployed: $function_name"
        return 0
    else
        log_error "Failed to deploy: $function_name"
        return 1
    fi
}

# Deploy all functions
deploy_functions() {
    log_info "Deploying Edge Functions..."
    
    cd "$FUNCTIONS_DIR"
    
    local functions=("health" "chat" "whatsapp")
    local failed_functions=()
    
    # Deploy arguments
    local deploy_args="--no-verify-jwt"
    if [[ "${ENVIRONMENT:-}" == "production" ]]; then
        deploy_args="$deploy_args --project-ref $SUPABASE_PROJECT_REF"
    fi
    
    for func in "${functions[@]}"; do
        if ! deploy_function "$func" "$deploy_args"; then
            failed_functions+=("$func")
        fi
    done
    
    if [[ ${#failed_functions[@]} -gt 0 ]]; then
        log_error "Failed to deploy functions: ${failed_functions[*]}"
        exit 1
    fi
    
    log_success "All functions deployed successfully"
}

# Set environment variables in Supabase
set_environment_variables() {
    log_info "Setting environment variables in Supabase..."
    
    # Note: Environment variables need to be set via Supabase Dashboard
    # or using supabase secrets set command (if available)
    
    log_warning "Environment variables must be set manually in Supabase Dashboard:"
    log_info "1. Go to https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/settings/functions"
    log_info "2. Add the following secrets:"
    echo "   - GROQ_API_KEY"
    echo "   - MEM0_API_KEY"
    echo "   - WHATSAPP_TOKEN"
    echo "   - WHATSAPP_PHONE_NUMBER_ID"
    echo "   - WHATSAPP_VERIFY_TOKEN"
    echo "   - ENVIRONMENT"
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."
    
    local base_url="https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1"
    
    # Test health endpoint
    log_info "Testing health endpoint..."
    if curl -s "$base_url/health" | jq -e '.success' >/dev/null; then
        log_success "Health endpoint working"
    else
        log_warning "Health endpoint test failed (may need environment variables)"
    fi
    
    log_info "Deployment test completed"
}

# Show deployment information
show_deployment_info() {
    log_success "Deployment completed!"
    echo
    log_info "Edge Function URLs:"
    echo "  Health Check: https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1/health"
    echo "  Chat API:     https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1/chat"
    echo "  WhatsApp:     https://$SUPABASE_PROJECT_REF.supabase.co/functions/v1/whatsapp"
    echo
    log_info "Next steps:"
    echo "  1. Set environment variables in Supabase Dashboard"
    echo "  2. Update WhatsApp webhook URL"
    echo "  3. Test the endpoints"
    echo "  4. Monitor logs: supabase functions logs"
    echo
}

# Main deployment function
main() {
    log_info "Starting HustleMode.ai Supabase deployment..."
    
    # Check if we're in the right directory
    if [[ ! -d "$FUNCTIONS_DIR" ]]; then
        log_error "Functions directory not found: $FUNCTIONS_DIR"
        log_info "Make sure you're running this script from the project root"
        exit 1
    fi
    
    # Run code quality checks before deployment
    log_info "Running code quality checks..."
    if [[ -f "$PROJECT_ROOT/scripts/code-quality-check.sh" ]]; then
        if ! "$PROJECT_ROOT/scripts/code-quality-check.sh"; then
            log_error "Code quality check failed - cannot deploy"
            log_warning "Fix quality issues before deploying"
            exit 1
        fi
        log_success "Code quality checks passed"
    else
        log_warning "Code quality check script not found - skipping"
    fi
    
    # Parse arguments
    local skip_validation=false
    local environment="development"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-validation)
                skip_validation=true
                shift
                ;;
            --production)
                environment="production"
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --skip-validation  Skip environment validation"
                echo "  --production       Deploy to production"
                echo "  --help, -h         Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    export ENVIRONMENT="$environment"
    
    # Run deployment steps
    if [[ "$skip_validation" != true ]]; then
        validate_environment
        validate_env_vars
    fi
    
    link_project
    validate_functions
    deploy_functions
    
    if [[ "$environment" == "production" ]]; then
        test_deployment
    fi
    
    set_environment_variables
    show_deployment_info
    
    log_success "Deployment script completed successfully!"
}

# Run main function
main "$@" 
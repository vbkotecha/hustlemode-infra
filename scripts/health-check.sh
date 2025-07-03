#!/bin/bash

# HustleMode.ai Health Check Script
# Tests all endpoints and services to ensure proper deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_REF="yzfclhnkxpgyxeklrvur"
BASE_URL="https://${PROJECT_REF}.supabase.co/functions/v1"
VERIFY_TOKEN="fa22d4e7-cba4-48cf-9b36-af6190bf9c67"
TEST_PHONE="+17817470041"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test result tracking
test_result() {
    local test_name="$1"
    local status="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [[ "$status" == "pass" ]]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        log_success "$test_name"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        log_error "$test_name"
    fi
}

# Test 1: Health Endpoint
test_health() {
    log_info "Testing health endpoint..."
    local response status_code
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/health" || echo "HTTPSTATUS:000")
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    response=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [[ "$status_code" == "200" ]] && echo "$response" | jq -e '.success == true' >/dev/null 2>&1; then
        test_result "Health endpoint working" "pass"
    else
        test_result "Health endpoint working" "fail"
    fi
}

# Test 2: Chat API
test_chat() {
    log_info "Testing chat API..."
    local response status_code payload
    payload='{"phone_number":"'$TEST_PHONE'","message":"test","personality":"taskmaster"}'
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST "$BASE_URL/chat" \
        -H "Content-Type: application/json" \
        -d "$payload" || echo "HTTPSTATUS:000")
    
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    response=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [[ "$status_code" == "200" ]] && echo "$response" | jq -e '.success == true' >/dev/null 2>&1; then
        test_result "Chat API working" "pass"
    else
        test_result "Chat API working" "fail"
    fi
}

# Test 3: WhatsApp Webhook
test_whatsapp() {
    log_info "Testing WhatsApp webhook verification..."
    local response status_code challenge="test123"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        "$BASE_URL/whatsapp?hub.mode=subscribe&hub.challenge=$challenge&hub.verify_token=$VERIFY_TOKEN" \
        || echo "HTTPSTATUS:000")
    
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    response=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [[ "$status_code" == "200" ]] && [[ "$response" == "$challenge" ]]; then
        test_result "WhatsApp webhook verification working" "pass"
    else
        test_result "WhatsApp webhook verification working" "fail"
    fi
}

# Test 4: WhatsApp Message Processing
test_whatsapp_message_processing() {
    log_info "Testing WhatsApp message processing..."
    
    local response
    local status_code
    local payload
    
    payload='{
        "entry": [{
            "changes": [{
                "value": {
                    "messages": [{
                        "from": "'$TEST_PHONE'",
                        "text": { "body": "test motivation message" }
                    }],
                    "metadata": {
                        "display_phone_number": "'$TEST_PHONE'",
                        "phone_number_id": "682917338218717"
                    }
                }
            }]
        }]
    }'
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST "$BASE_URL/whatsapp" \
        -H "Content-Type: application/json" \
        -d "$payload" || echo "HTTPSTATUS:000")
    
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    response=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [[ "$status_code" == "200" ]]; then
        if echo "$response" | jq -e '.success == true' >/dev/null 2>&1; then
            test_result "WhatsApp message processing returns 200 and success=true" "pass"
        else
            test_result "WhatsApp message processing returns valid JSON" "fail"
            log_warning "Response: $response"
        fi
    else
        test_result "WhatsApp message processing returns 200" "fail"
        log_warning "Status code: $status_code"
        log_warning "Response: $response"
    fi
}

# Test 5: Database Connectivity
test_database_connectivity() {
    log_info "Testing database connectivity..."
    
    if command -v psql >/dev/null 2>&1; then
        local db_url="postgresql://postgres:UTA_nxh7zcn2gmz_jkz@db.${PROJECT_REF}.supabase.co:5432/postgres"
        
        if psql "$db_url" -c "SELECT 1;" >/dev/null 2>&1; then
            test_result "Direct database connection works" "pass"
            
            # Test table existence
            if psql "$db_url" -c "\dt" 2>/dev/null | grep -q "users"; then
                test_result "Users table exists" "pass"
            else
                test_result "Users table exists" "fail"
            fi
            
            if psql "$db_url" -c "\dt" 2>/dev/null | grep -q "conversation_memory"; then
                test_result "Conversation_memory table exists" "pass"
            else
                test_result "Conversation_memory table exists" "fail"
            fi
        else
            test_result "Direct database connection works" "fail"
        fi
    else
        log_warning "psql not available, skipping direct database tests"
        test_result "Database connectivity (psql available)" "fail"
    fi
}

# Test 6: Function Logs Check
test_function_logs() {
    log_info "Checking function logs for errors..."
    
    if command -v supabase >/dev/null 2>&1; then
        # Check if we can access logs (may require authentication)
        if supabase functions logs --project-ref "$PROJECT_REF" --limit 5 >/dev/null 2>&1; then
            test_result "Function logs accessible" "pass"
            
            # Check for recent errors in logs
            local recent_logs
            recent_logs=$(supabase functions logs --project-ref "$PROJECT_REF" --limit 20 2>/dev/null || echo "")
            
            if echo "$recent_logs" | grep -q "ERROR\|error\|Error"; then
                test_result "No recent errors in function logs" "fail"
                log_warning "Recent errors found in logs"
            else
                test_result "No recent errors in function logs" "pass"
            fi
        else
            test_result "Function logs accessible" "fail"
            log_warning "May need to run: supabase login"
        fi
    else
        log_warning "Supabase CLI not available, skipping log checks"
        test_result "Function logs check (supabase CLI available)" "fail"
    fi
}

# Test 7: Environment Variables
test_environment_variables() {
    log_info "Checking environment variables..."
    
    if command -v supabase >/dev/null 2>&1; then
        local secrets_output
        secrets_output=$(supabase secrets list --project-ref "$PROJECT_REF" 2>/dev/null || echo "")
        
        if [[ -n "$secrets_output" ]]; then
            test_result "Can access secrets list" "pass"
            
            # Check for required secrets
            local required_secrets=("GROQ_API_KEY" "WHATSAPP_TOKEN" "GROQ_MODEL")
            
            for secret in "${required_secrets[@]}"; do
                if echo "$secrets_output" | grep -q "$secret"; then
                    test_result "Secret $secret exists" "pass"
                else
                    test_result "Secret $secret exists" "fail"
                fi
            done
        else
            test_result "Can access secrets list" "fail"
            log_warning "May need to run: supabase login"
        fi
    else
        log_warning "Supabase CLI not available, skipping environment variable checks"
        test_result "Environment variables check (supabase CLI available)" "fail"
    fi
}

# Performance Test
test_performance() {
    log_info "Testing response times..."
    
    local start_time
    local end_time
    local duration
    
    # Test health endpoint response time
    start_time=$(date +%s%3N)
    curl -s "$BASE_URL/health" >/dev/null 2>&1
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    
    if [[ "$duration" -lt 1000 ]]; then
        test_result "Health endpoint responds within 1 second ($duration ms)" "pass"
    else
        test_result "Health endpoint responds within 1 second ($duration ms)" "fail"
    fi
    
    # Test chat API response time
    start_time=$(date +%s%3N)
    curl -s -X POST "$BASE_URL/chat" \
        -H "Content-Type: application/json" \
        -d '{"phone_number":"'$TEST_PHONE'","message":"quick test","personality":"taskmaster"}' \
        >/dev/null 2>&1
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    
    if [[ "$duration" -lt 2000 ]]; then
        test_result "Chat API responds within 2 seconds ($duration ms)" "pass"
    else
        test_result "Chat API responds within 2 seconds ($duration ms)" "fail"
    fi
}

# Main function
main() {
    echo "=========================================="
    echo "  HustleMode.ai Health Check"
    echo "=========================================="
    echo
    log_info "Project: $PROJECT_REF"
    log_info "Base URL: $BASE_URL"
    log_info "Test Phone: $TEST_PHONE"
    echo
    
    # Check if required tools are available
    if ! command -v curl >/dev/null 2>&1; then
        log_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        log_error "jq is required but not installed"
        exit 1
    fi
    
    # Run all tests
    test_health
    test_chat
    test_whatsapp
    test_whatsapp_message_processing
    test_database_connectivity
    test_function_logs
    test_environment_variables
    test_performance
    
    # Show results
    echo
    echo "=========================================="
    echo "  Test Results Summary"
    echo "=========================================="
    log_info "Total Tests: $TOTAL_TESTS"
    log_success "Passed: $PASSED_TESTS"
    log_error "Failed: $FAILED_TESTS"
    echo
    
    if [[ "$FAILED_TESTS" -gt 0 ]]; then
        log_error "Some tests failed. Check the output above for details."
        echo
        log_info "Common fixes:"
        echo "  1. Ensure all environment variables are set: supabase secrets list --project-ref $PROJECT_REF"
        echo "  2. Redeploy functions: supabase functions deploy --no-verify-jwt"
        echo "  3. Check function logs: supabase functions logs --project-ref $PROJECT_REF"
        echo "  4. Reset database: supabase db reset --linked --yes"
        exit 1
    else
        log_success "All tests passed! HustleMode.ai is healthy and ready."
        echo
        log_info "Endpoints:"
        echo "  Health: $BASE_URL/health"
        echo "  Chat: $BASE_URL/chat"
        echo "  WhatsApp: $BASE_URL/whatsapp"
        exit 0
    fi
}

# Run main function
main "$@" 
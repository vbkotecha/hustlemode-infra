#!/bin/bash

# HustleMode.ai PostgreSQL Passwordless Connection Script
# Uses Azure AD authentication - no password required!

echo "🔐 Getting Azure AD token for PostgreSQL..."
TOKEN=$(az account get-access-token --resource-type oss-rdbms --query accessToken -o tsv)

if [ $? -eq 0 ]; then
    echo "✅ Token acquired successfully"
    echo "🚀 Connecting to PostgreSQL..."
    
    # Connect using Azure AD authentication
    PGPASSWORD=$TOKEN psql \
        "host=hustlemode-ai-postgres.postgres.database.azure.com port=5432 dbname=postgres user=vbkotecha_outlook.com#EXT#@vbkotechaoutlook.onmicrosoft.com sslmode=require" \
        "$@"
else
    echo "❌ Failed to get Azure AD token. Make sure you're logged in with: az login"
    exit 1
fi 
#!/bin/bash

# HustleMode.ai Azure Functions Deployment with Python Dependencies
# This script uses Azure Functions Core Tools for proper dependency installation

set -e

# Parse command line arguments
AUTO_DEPLOY=true
SKIP_PROMPTS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --help, -h           Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🔥 HustleMode.ai Azure Functions Deployment Starting..."

# Check if we're in the azure-functions-deploy directory
if [[ ! -f "azure-functions-deploy/requirements.txt" ]]; then
    echo "🚨 Error: azure-functions-deploy directory not found or requirements.txt missing"
    exit 1
fi

# Check if Azure Functions Core Tools is installed
if ! command -v func &> /dev/null; then
    echo "🚨 Error: Azure Functions Core Tools not installed"
    echo "   Install with: brew tap azure/functions && brew install azure-functions-core-tools@4"
    exit 1
fi

# Check if logged into Azure
if ! az account show &> /dev/null; then
    echo "🚨 Error: Not logged into Azure CLI"
    echo "   Run: az login"
    exit 1
fi

echo "📦 Deploying Azure Functions with Python dependencies..."

# Navigate to the functions directory
cd azure-functions-deploy

# Deploy using Azure Functions Core Tools (this installs Python deps automatically)
echo "🚀 Publishing to Azure Functions..."
func azure functionapp publish hustlemode-api --python

# Check deployment status
if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    echo "🔗 Function App URL: https://hustlemode-api.azurewebsites.net"
    echo "🧪 Test endpoints:"
    echo "   - Health: https://hustlemode-api.azurewebsites.net/api/health"
    echo "   - Assistant: https://hustlemode-api.azurewebsites.net/api/assistants/{chatId}"
    echo "   - WhatsApp: https://hustlemode-api.azurewebsites.net/api/messaging/whatsapp"
else
    echo "🚨 Deployment failed!"
    exit 1
fi

# Return to original directory
cd ..

echo "🎯 Azure Functions deployment with Python dependencies completed!" 
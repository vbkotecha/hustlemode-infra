#!/bin/bash

# HustleMode.ai - Azure OpenAI Deployment Setup
# This script creates the necessary GPT-4 deployment for the Azure Functions

set -e

echo "🚀 Setting up Azure OpenAI deployment for HustleMode.ai"

# Configuration
RESOURCE_GROUP="hustlemode.ai"
OPENAI_RESOURCE="hustlemode-ai"
DEPLOYMENT_NAME="gpt-4o"
MODEL_NAME="gpt-4o"
MODEL_VERSION="2024-08-06"
DEPLOYMENT_CAPACITY=10

echo "📋 Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  OpenAI Resource: $OPENAI_RESOURCE"
echo "  Deployment Name: $DEPLOYMENT_NAME"
echo "  Model: $MODEL_NAME"
echo "  Version: $MODEL_VERSION"
echo "  Capacity: $DEPLOYMENT_CAPACITY"
echo ""

# Check if logged in to Azure
if ! az account show >/dev/null 2>&1; then
    echo "❌ Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

echo "✅ Azure CLI authenticated"

# Check if the OpenAI resource exists
echo "🔍 Checking if Azure OpenAI resource exists..."
if ! az cognitiveservices account show \
    --name "$OPENAI_RESOURCE" \
    --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
    echo "❌ Azure OpenAI resource '$OPENAI_RESOURCE' not found in resource group '$RESOURCE_GROUP'"
    exit 1
fi

echo "✅ Azure OpenAI resource found"

# List existing deployments
echo "📋 Existing deployments:"
az cognitiveservices account deployment list \
    --name "$OPENAI_RESOURCE" \
    --resource-group "$RESOURCE_GROUP" \
    --query "[].{name:name,model:properties.model.name,version:properties.model.version,capacity:properties.currentCapacity}" \
    --output table

# Check if deployment already exists
if az cognitiveservices account deployment show \
    --name "$OPENAI_RESOURCE" \
    --resource-group "$RESOURCE_GROUP" \
    --deployment-name "$DEPLOYMENT_NAME" >/dev/null 2>&1; then
    echo "✅ Deployment '$DEPLOYMENT_NAME' already exists"
    echo "🎯 Testing deployment..."
else
    echo "🔧 Creating deployment '$DEPLOYMENT_NAME'..."
    
    # Create the deployment
    az cognitiveservices account deployment create \
        --name "$OPENAI_RESOURCE" \
        --resource-group "$RESOURCE_GROUP" \
        --deployment-name "$DEPLOYMENT_NAME" \
        --model-name "$MODEL_NAME" \
        --model-version "$MODEL_VERSION" \
        --model-format OpenAI \
        --sku-capacity "$DEPLOYMENT_CAPACITY" \
        --sku-name "Standard"
    
    echo "✅ Deployment created successfully"
fi

# Test the deployment
echo "🧪 Testing deployment..."
ENDPOINT=$(az cognitiveservices account show \
    --name "$OPENAI_RESOURCE" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.endpoint" \
    --output tsv)

API_KEY=$(az cognitiveservices account keys list \
    --name "$OPENAI_RESOURCE" \
    --resource-group "$RESOURCE_GROUP" \
    --query "key1" \
    --output tsv)

# Test with a simple completion
echo "🔗 Endpoint: $ENDPOINT"
echo "🔑 API Key: ${API_KEY:0:10}..."

echo ""
echo "🎉 Setup complete! Your deployment is ready."
echo ""
echo "📝 Configuration for local.settings.json:"
echo "  AZURE_OPENAI_ENDPOINT: $ENDPOINT"
echo "  AZURE_OPENAI_API_KEY: $API_KEY"
echo "  CHAT_MODEL_DEPLOYMENT_NAME: $DEPLOYMENT_NAME"
echo ""
echo "🚀 You can now test your Azure Functions with:"
echo "  curl -X POST http://localhost:7071/api/ask -H \"Content-Type: application/json\" -d '{\"prompt\": \"Hello!\"}'" 
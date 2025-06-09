#!/bin/bash

# HustleMode.ai Clean Deployment Script
# This script creates deployment packages without cluttering the repository

set -e

echo "🔥 HustleMode.ai Clean Deployment Starting..."

# Create temporary build directory
BUILD_DIR="temp/build-$(date +%s)"
mkdir -p "$BUILD_DIR"

echo "📦 Preparing Azure Functions deployment package..."

# Copy Azure Functions deployment files
cp -r azure-functions-deploy/* "$BUILD_DIR/"

# Create deployment zip in temp directory
cd "$BUILD_DIR"
zip -r "../functions-deploy.zip" .
cd - > /dev/null

echo "✅ Deployment package created: temp/functions-deploy.zip"

# Optional: Deploy to Azure if Azure CLI is configured
read -p "Deploy to Azure now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to Azure Functions..."
    
    az functionapp deployment source config-zip \
        --name hustlemode-premium-bot \
        --resource-group hustlemode.ai \
        --src "temp/functions-deploy.zip"
    
    echo "✅ Deployment completed!"
else
    echo "📋 Deployment package ready at: temp/functions-deploy.zip"
    echo "   To deploy manually, run:"
    echo "   az functionapp deployment source config-zip --name hustlemode-premium-bot --resource-group hustlemode.ai --src temp/functions-deploy.zip"
fi

# Cleanup option
read -p "Clean up temp files? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    rm -rf temp/
    echo "🧹 Temporary files cleaned up"
else
    echo "📁 Build artifacts preserved in temp/ directory"
fi

echo "🎯 Clean deployment process completed!" 
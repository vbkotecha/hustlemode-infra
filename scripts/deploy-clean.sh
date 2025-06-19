#!/bin/bash

# HustleMode.ai Clean Deployment Script
# This script creates deployment packages without cluttering the repository

set -e

# Parse command line arguments
AUTO_DEPLOY=true
AUTO_CLEANUP=true
SKIP_PROMPTS=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --auto|--yes|-y)
            AUTO_DEPLOY=true
            AUTO_CLEANUP=true
            SKIP_PROMPTS=true
            shift
            ;;
        --deploy)
            AUTO_DEPLOY=true
            shift
            ;;
        --no-cleanup)
            AUTO_CLEANUP=false
            SKIP_PROMPTS=true  # Don't prompt when preserving artifacts
            shift
            ;;
        --build-only)
            AUTO_DEPLOY=false
            AUTO_CLEANUP=false
            SKIP_PROMPTS=true
            shift
            ;;
        --no-prompts)
            SKIP_PROMPTS=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "HustleMode.ai deployment script with cross-platform builds and fast Kudu ZipDeploy"
            echo ""
            echo "Options:"
            echo "  --auto, --yes, -y    Auto-deploy and cleanup (non-interactive)"
            echo "  --deploy             Auto-deploy but ask about cleanup"
            echo "  --no-cleanup         Don't cleanup temp files (non-interactive)"
            echo "  --build-only         Build package only, no deploy, no cleanup (non-interactive)"
            echo "  --no-prompts         Skip all interactive prompts"
            echo "  --help, -h           Show this help message"
            echo ""
            echo "Features:"
            echo "  • Cross-platform builds (macOS → Linux)"
            echo "  • Fast Kudu ZipDeploy (3x faster than Azure CLI)"
            echo "  • Local package installation with platform targeting"
            echo "  • Automatic cleanup of build artifacts"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🔥 HustleMode.ai Clean Deployment Starting..."

# Check required tools
if ! command -v jq &> /dev/null; then
    echo "❌ jq is required for deployment. Install with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

# Clean out any existing temp and build directories
echo "🧹 Cleaning previous build artifacts..."
rm -rf .temp
rm -rf .build

# Create build directory
BUILD_DIR=".build/functions-$(date +%s)"
mkdir -p "$BUILD_DIR"

echo "📦 Preparing Azure Functions deployment package..."

# Copy Azure Functions deployment files
cp -r azure-functions-deploy/* "$BUILD_DIR/"

echo "🐍 Creating virtual environment and installing packages..."

# Create virtual environment in build directory
python3 -m venv "$BUILD_DIR/venv"
source "$BUILD_DIR/venv/bin/activate"

# Create the .python_packages directory structure
mkdir -p "$BUILD_DIR/.python_packages/lib/site-packages"

# Install packages from requirements.txt for Linux x86_64 (Azure Functions platform)
pip install --upgrade pip
echo "🔧 Installing packages for Linux x86_64 platform (Azure Functions)..."
pip install -r "$BUILD_DIR/requirements.txt" \
    --target "$BUILD_DIR/.python_packages/lib/site-packages" \
    --platform linux_x86_64 \
    --implementation cp \
    --python-version 3.11 \
    --only-binary=:all: \
    --no-compile \
    --no-deps

# Install dependencies separately to handle any missing platform-specific packages
echo "🔧 Installing dependencies with fallback to universal packages..."
pip install -r "$BUILD_DIR/requirements.txt" \
    --target "$BUILD_DIR/.python_packages/lib/site-packages" \
    --no-compile \
    --upgrade

# Deactivate virtual environment
deactivate

# Remove virtual environment directory (not needed in deployment)
rm -rf "$BUILD_DIR/venv"

echo "✅ Packages installed locally"

# Create deployment zip in build directory
cd "$BUILD_DIR"
zip -r "../functions-deploy.zip" .
cd - > /dev/null

echo "✅ Deployment package created: .build/functions-deploy.zip"

# Deploy to Azure
SHOULD_DEPLOY=$AUTO_DEPLOY
if [[ $SKIP_PROMPTS == false && $AUTO_DEPLOY == false ]]; then
    read -p "Deploy to Azure now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        SHOULD_DEPLOY=true
    fi
fi

if [[ $SHOULD_DEPLOY == true ]]; then
    echo "🚀 Deploying to Azure Functions using Kudu ZipDeploy (fastest method)..."
    
    # Get publishing credentials
    echo "🔑 Getting publishing credentials..."
    CREDS=$(az functionapp deployment list-publishing-credentials \
        --name hustlemode-api \
        --resource-group hustlemode.ai \
        --query "{username:publishingUserName, password:publishingPassword}" \
        --output json)
    
    USERNAME=$(echo "$CREDS" | jq -r '.username')
    PASSWORD=$(echo "$CREDS" | jq -r '.password')
    
    if [[ "$USERNAME" == "null" || "$PASSWORD" == "null" ]]; then
        echo "❌ Failed to get publishing credentials"
        exit 1
    fi
    
    # Deploy using Kudu ZipDeploy API (much faster than Azure CLI)
    echo "📦 Uploading package via Kudu ZipDeploy..."
    DEPLOY_RESPONSE=$(curl -X POST \
        -u "$USERNAME:$PASSWORD" \
        --data-binary @".build/functions-deploy.zip" \
        -w "%{http_code}" \
        -s \
        -o /tmp/deploy_response.json \
        "https://hustlemode-api.scm.azurewebsites.net/api/zipdeploy")
    
    if [[ "$DEPLOY_RESPONSE" == "200" ]]; then
        echo "✅ Deployment completed successfully!"
    else
        echo "❌ Deployment failed with HTTP status: $DEPLOY_RESPONSE"
        if [[ -f /tmp/deploy_response.json ]]; then
            echo "Response: $(cat /tmp/deploy_response.json)"
        fi
        exit 1
    fi
    
    # Clean up temp file
    rm -f /tmp/deploy_response.json
else
    echo "📋 Deployment package ready at: .build/functions-deploy.zip"
    echo "   To deploy manually using fast Kudu ZipDeploy, run:"
    echo "   1. Get credentials: az functionapp deployment list-publishing-credentials --name hustlemode-api --resource-group hustlemode.ai"
    echo "   2. Deploy: curl -X POST -u '<username>:<password>' --data-binary @.build/functions-deploy.zip https://hustlemode-api.scm.azurewebsites.net/api/zipdeploy"
fi

# Cleanup
SHOULD_CLEANUP=$AUTO_CLEANUP
if [[ $SKIP_PROMPTS == false ]]; then
    read -p "Clean up build files? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        SHOULD_CLEANUP=false
    fi
fi

if [[ $SHOULD_CLEANUP == true ]]; then
    rm -rf .build/
    rm -rf .temp/
    echo "🧹 Build artifacts cleaned up"
else
    echo "📁 Build artifacts preserved in .build/ directory"
fi

echo "🎯 Clean deployment process completed!" 
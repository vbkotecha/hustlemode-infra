# HustleMode.ai Azure Functions Deployment Guide

## 📋 Prerequisites

1. **Azure Account**
   - Active Azure subscription
   - Owner or Contributor access to resource group `hustlemode.ai`

2. **WhatsApp Business Account**
   - Verified WhatsApp Business account
   - Business phone number: +15556583575
   - Meta for Developers access

3. **Development Tools**
   - Azure CLI installed and configured
   - Git repository access
   - Python 3.11 (for local development)

## 🏗️ Current Architecture

### Azure Resources (Already Deployed)
- **Azure Functions Premium (EP1)**: `hustlemode-premium-bot`
- **Resource Group**: `hustlemode.ai` (East US)
- **Application Insights**: Full monitoring and logging
- **No additional services required** - simplified architecture

## 🚀 Deployment Methods

### Method 1: Clean Script Deployment (Recommended)

   ```bash
# Use the built-in clean deployment script
./scripts/deploy-clean.sh
```

This script:
- Creates temporary deployment package
- Deploys to Azure Functions
- Cleans up build artifacts
- Keeps repository clean

### Method 2: Manual Deployment

   ```bash
# Create temporary deployment directory
mkdir -p temp/deploy
cp -r azure-functions-deploy/* temp/deploy/

# Create deployment package
cd temp/deploy
zip -r ../functions.zip .
cd ../..

# Deploy to Azure
az functionapp deployment source config-zip \
  --name hustlemode-premium-bot \
  --resource-group hustlemode.ai \
  --src temp/functions.zip

# Cleanup
rm -rf temp/
```

### Method 3: GitHub Actions (Automated)

Deployment automatically triggers on push to main branch when files in `azure-functions-deploy/` change.

## 🔧 Environment Configuration

### Required Environment Variables
Set these in the Azure Portal Function App Configuration:

```env
WHATSAPP_TOKEN=EACPL4t2aebo... 
WHATSAPP_PHONE_NUMBER_ID=682917338218717
WHATSAPP_VERIFY_TOKEN=fa22d4e7-cba4-48cf-9b36-af6190bf9c67
WHATSAPP_PHONE_NUMBER=15556583575
```

### Configure in Azure Portal
1. Go to Function App: `hustlemode-premium-bot`
2. Navigate to Configuration → Application settings
3. Add/update the environment variables
4. Click Save and restart the Function App

## 📱 WhatsApp Configuration

### Meta for Developers Setup
1. **App Configuration**:
   - Webhook URL: `https://hustlemode-premium-bot.azurewebsites.net/api/webhook/whatsapp`
   - Verify Token: `fa22d4e7-cba4-48cf-9b36-af6190bf9c67`
   - Webhook Fields: `messages` ✅

2. **API Details**:
   - Business Account ID: `715387334407630`
   - Phone Number ID: `682917338218717` 
   - API Version: `v22.0`

## 🧪 Testing & Verification

### Health Check
   ```bash
curl https://hustlemode-premium-bot.azurewebsites.net/api/health
   ```
Expected: `200 OK` with health status

### Webhook Verification
   ```bash
curl "https://hustlemode-premium-bot.azurewebsites.net/api/webhook/whatsapp?hub.mode=subscribe&hub.challenge=TEST&hub.verify_token=fa22d4e7-cba4-48cf-9b36-af6190bf9c67"
```
Expected: Returns `TEST` (the challenge value)

### Live Bot Test
Send a WhatsApp message to **+15556583575** with "hi" to test the full flow.

## 📊 Monitoring & Debugging

### Application Insights
- **Dashboard**: [View in Azure Portal](https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai/providers/microsoft.insights/components/hustlemode-premium-bot/overview)
- **Live Logs**: Real-time request/response monitoring
- **Performance**: Response times and error tracking

### Log Streaming
   ```bash
# View live logs
az webapp log tail --name hustlemode-premium-bot --resource-group hustlemode.ai
```

## 🛡️ Security & Best Practices

### Repository Hygiene
- **Use clean deployment**: Never commit zip files or build artifacts
- **Run bloat check**: `./scripts/check-bloat.sh` before commits
- **Follow rules**: Check `.cursor/rules/repository.mdc` for guidelines

### WhatsApp Security
- **Token Management**: Rotate access tokens regularly in Meta for Developers
- **Webhook Security**: Verify all incoming requests using the verify token
- **HTTPS Only**: All communication uses secure HTTPS endpoints

### Azure Security
- **Function App**: Configured with managed identity
- **Application Insights**: No sensitive data logged
- **Environment Variables**: Stored securely in Azure configuration

## 🔄 Maintenance

### Regular Tasks
1. **Monitor Performance**: Check Application Insights weekly
2. **Update Dependencies**: Review `azure-functions-deploy/requirements.txt` monthly
3. **Token Rotation**: Update WhatsApp tokens as needed
4. **Repository Cleanup**: Run `./scripts/check-bloat.sh` regularly

### Scaling
Current EP1 plan supports:
- **Concurrent Functions**: Up to 20 instances
- **Memory**: 3.5 GB per instance  
- **No Cold Starts**: Dedicated resources
- **Cost**: ~$150-300/month for production workloads

## 🚨 Troubleshooting

### Common Issues

#### Deployment Failures
   ```bash
# Check function app status
az functionapp show --name hustlemode-premium-bot --resource-group hustlemode.ai --query "state"

# Restart function app
az functionapp restart --name hustlemode-premium-bot --resource-group hustlemode.ai
```

#### WhatsApp Not Responding
1. Check webhook URL in Meta for Developers
2. Verify environment variables in Azure Portal
3. Test health endpoint: `curl https://hustlemode-premium-bot.azurewebsites.net/api/health`
4. Check Application Insights for error logs

#### Function Errors
1. **View logs**: Use Application Insights live logs
2. **Check dependencies**: Verify `requirements.txt` versions
3. **Restart function**: Azure Portal → Function App → Restart

### Support Resources
- **Azure Documentation**: [Azure Functions Python Guide](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-python)
- **WhatsApp API**: [Meta for Developers Documentation](https://developers.facebook.com/docs/whatsapp/)
- **Application Insights**: [Monitoring Guide](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)

---
**Last Updated**: June 9, 2025  
**Architecture**: Azure Functions Premium  
**Status**: ✅ PRODUCTION READY 
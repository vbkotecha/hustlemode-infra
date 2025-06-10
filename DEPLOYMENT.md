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
   - Azure Functions Core Tools installed
   - Git repository access
   - Python 3.11+ (for local development)

## 🏗️ Current Architecture

### Azure Resources (Deployed & Operational)
- **Azure Functions v2**: `hustlemode-api` (Consumption Plan, Linux)
- **Resource Group**: `hustlemode.ai` (East US)
- **Azure OpenAI**: `hustlemode-ai` with GPT-4 deployment
- **Storage Account**: `hustlemodestorageacct` 
- **Application Insights**: Full monitoring and logging
- **PostgreSQL**: `hustlemode-db` (ready for integration)

### Key Features
- ✅ **Intelligent WhatsApp Bot**: Context-aware responses
- ✅ **Azure OpenAI Integration**: GPT-4 powered responses (configured)
- ✅ **WhatsApp Business API**: Full send/receive capability
- ✅ **Serverless Architecture**: Pay-per-execution cost model
- ✅ **Application Insights**: Complete logging and monitoring

## 🚀 Deployment Methods

### Method 1: Azure Functions Core Tools (Recommended)

```bash
# Navigate to function directory
cd azure-functions-deploy

# Deploy with remote build (handles cross-platform dependencies)
func azure functionapp publish hustlemode-api --python --build remote
```

**Benefits:**
- Handles Python dependencies automatically
- Cross-platform builds (macOS → Linux)
- Fastest deployment method
- Real-time deployment logs

### Method 2: Clean Script Deployment

```bash
# Use the enhanced clean deployment script
./scripts/deploy-clean.sh --auto
```

**Features:**
- Creates temporary deployment package
- Installs dependencies for Linux platform
- Deploys to Azure Functions via Kudu ZipDeploy
- Cleans up build artifacts automatically
- Keeps repository clean

### Method 3: GitHub Actions (Automated)

Deployment automatically triggers on push to main branch when files in `azure-functions-deploy/` change.

**Note**: GitHub Actions workflow is working but should be modified carefully as requested.

## 🔧 Environment Configuration

### Required Environment Variables
Configure these in Azure Portal Function App Configuration:

```env
# WhatsApp Business API
WHATSAPP_TOKEN=your_whatsapp_system_user_token_here
WHATSAPP_PHONE_NUMBER_ID=682917338218717
WHATSAPP_VERIFY_TOKEN=fa22d4e7-cba4-48cf-9b36-af6190bf9c67

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://hustlemode-ai.openai.azure.com/
AZURE_OPENAI_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_DEPLOYMENT_NAME=hustlemode-ai
```

### Configure in Azure Portal
1. Go to Function App: `hustlemode-api`
2. Navigate to Configuration → Application settings
3. Add/update the environment variables
4. Click Save and restart the Function App

## 📱 WhatsApp Configuration

### Meta for Developers Setup
1. **App Configuration**:
   - Webhook URL: `https://hustlemode-api.azurewebsites.net/api/messaging/whatsapp`
   - Verify Token: `fa22d4e7-cba4-48cf-9b36-af6190bf9c67`
   - Webhook Fields: `messages` ✅

2. **API Details**:
   - Business Account ID: `715387334407630`
   - Phone Number ID: `682917338218717` 
   - API Version: `v22.0`

3. **Test Configuration**:
   - Test messages can only be sent TO: `+17817470041`
   - Production will work with any phone number

## 🧪 Testing & Verification

### Health Check
```bash
curl "https://hustlemode-api.azurewebsites.net/api/health?code=your_function_key_here"
```
**Expected**: `200 OK` with comprehensive health status including OpenAI and WhatsApp integration status

### Webhook Verification
```bash
curl "https://hustlemode-api.azurewebsites.net/api/messaging/whatsapp?code=your_function_key_here&hub.mode=subscribe&hub.challenge=TEST&hub.verify_token=fa22d4e7-cba4-48cf-9b36-af6190bf9c67"
```
**Expected**: Returns `TEST` (the challenge value)

### Intelligent Response Test
```bash
curl -X POST "https://hustlemode-api.azurewebsites.net/api/messaging/whatsapp?code=your_function_key_here" \
-H "Content-Type: application/json" \
-d '{"object":"whatsapp_business_account","entry":[{"id":"715387334407630","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"15556583575","phone_number_id":"682917338218717"},"messages":[{"from":"17817470041","id":"test_msg","timestamp":"1733875200","text":{"body":"I need motivation!"},"type":"text"}]},"field":"messages"}]}]}'
```
**Expected**: `OK` response, and the bot should send an intelligent motivational response to the sender

### Live Bot Test
Send a WhatsApp message to **+15556583575** with text like:
- `"Hello"` → Welcome message
- `"I need motivation"` → Motivational response
- `"goals"` → Goal-setting support
- Any other text → General support message

## 📊 Monitoring & Debugging

### Application Insights
- **Dashboard**: https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai/providers/microsoft.insights/components/hustlemode-api/overview
- **Live Logs**: Real-time function execution monitoring
- **Performance**: Response times and error tracking
- **Custom Queries**: Query conversation data and user interactions

### Function App Monitoring
```bash
# View function logs (if Azure CLI log streaming is available)
az webapp log tail --name hustlemode-api --resource-group hustlemode.ai
```

**Note**: Consumption plans may have limited log streaming. Use Application Insights for comprehensive monitoring.

### Debug Common Issues
1. **Function not responding**: Check Application Insights for startup errors
2. **WhatsApp not receiving responses**: Verify WHATSAPP_TOKEN and API credentials
3. **OpenAI integration issues**: Check AZURE_OPENAI_* environment variables

## 🛡️ Security & Best Practices

### Function Security
- **Authentication**: Functions require function key for access
- **Function Key**: `your_function_key_here`
- **HTTPS Only**: All communication uses secure HTTPS endpoints
- **Environment Variables**: Sensitive data stored securely in Azure configuration

### WhatsApp Security
- **Token Management**: System user token never expires (configured)
- **Webhook Security**: Verify all incoming requests using verify token
- **Phone Number Verification**: Production phone number verified and active

### Repository Hygiene
- **Clean Deployment**: Never commit build artifacts or zip files
- **Dependencies**: Only necessary packages in requirements.txt
- **Environment Files**: Never commit .env files to repository

## 🔄 Maintenance

### Regular Tasks
1. **Monitor Performance**: Check Application Insights for errors and performance
2. **Update Dependencies**: Review `azure-functions-deploy/requirements.txt` 
3. **Test Bot Responses**: Regularly test WhatsApp functionality
4. **Cost Monitoring**: Monitor consumption plan usage

### Current Dependencies
```txt
# azure-functions-deploy/requirements.txt
azure-functions
requests
```

### Architecture Benefits
- **Cost Effective**: Consumption plan charges only for executions
- **Auto Scaling**: Scales from 0 to thousands of concurrent executions
- **No Cold Starts**: OpenAI extension keeps functions warm
- **Maintenance Free**: Serverless architecture requires minimal maintenance

## 🚨 Troubleshooting

### Common Issues

#### Deployment Failures
```bash
# Check function app status
az functionapp show --name hustlemode-api --resource-group hustlemode.ai --query "state"

# Restart function app
az functionapp restart --name hustlemode-api --resource-group hustlemode.ai
```

#### WhatsApp Not Responding
1. **Verify webhook URL** in Meta for Developers
2. **Check environment variables** in Azure Portal
3. **Test health endpoint** with function key
4. **Check Application Insights** for error logs
5. **Verify function key** in URL parameters

#### Function Authentication Errors
- All function calls require the function key parameter: `?code=your_function_key_here`
- Get current keys: `az functionapp keys list --name hustlemode-api --resource-group hustlemode.ai`

#### OpenAI Integration Issues
1. **Check Azure OpenAI resource** is deployed and accessible
2. **Verify API keys** in environment variables
3. **Test OpenAI endpoint**: `curl "https://hustlemode-api.azurewebsites.net/api/test/openai?code=..."`
4. **Check deployment name** matches Azure OpenAI model deployment

### Support Resources
- **Azure Functions Python Guide**: https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-python
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp/
- **Azure OpenAI Service**: https://docs.microsoft.com/en-us/azure/ai-services/openai/
- **Application Insights**: https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview

---
**Last Updated**: June 10, 2025  
**Architecture**: Azure Functions v2 (Consumption Plan)  
**Status**: ✅ PRODUCTION READY WITH INTELLIGENT RESPONSES  
**Function Key**: `your_function_key_here` 
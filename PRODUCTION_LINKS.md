# HustleMode.ai Production Reference

## 🚀 Live Bot Information
- **WhatsApp Number**: +15556583575
- **Bot Status**: ✅ LIVE and responding with intelligent, contextual responses
- **Intelligence Level**: Smart message processing with intent detection
- **Last Verified**: June 10, 2025

## 🔗 Production URLs

### Main Application
- **Function App**: https://hustlemode-api.azurewebsites.net/
- **Health Check**: https://hustlemode-api.azurewebsites.net/api/health
- **WhatsApp Webhook**: https://hustlemode-api.azurewebsites.net/api/messaging/whatsapp
- **OpenAI Test**: https://hustlemode-api.azurewebsites.net/api/test/openai
- **AI Motivation**: https://hustlemode-api.azurewebsites.net/api/ai/motivate

### Azure Portal Links
- **Function App**: https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai/providers/Microsoft.Web/sites/hustlemode-api
- **Application Insights**: https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai/providers/microsoft.insights/components/hustlemode-api/overview
- **Resource Group**: https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai

## 📱 WhatsApp Configuration

### Meta for Developers
- **Webhook URL**: https://hustlemode-api.azurewebsites.net/api/messaging/whatsapp
- **Verify Token**: fa22d4e7-cba4-48cf-9b36-af6190bf9c67
- **Webhook Fields**: messages ✅
- **API Version**: v22.0

### WhatsApp Business Details
- **Phone Number**: +15556583575
- **Business Account ID**: 715387334407630
- **Phone Number ID**: 682917338218717
- **API Endpoint**: https://graph.facebook.com/v22.0/682917338218717/messages

## 🔑 Environment Variables

```env
WHATSAPP_TOKEN=your_whatsapp_system_user_token_here
WHATSAPP_PHONE_NUMBER_ID=682917338218717
WHATSAPP_VERIFY_TOKEN=fa22d4e7-cba4-48cf-9b36-af6190bf9c67
AZURE_OPENAI_ENDPOINT=https://hustlemode-ai.openai.azure.com/
AZURE_OPENAI_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_DEPLOYMENT_NAME=hustlemode-ai
```

## 🤖 Intelligent Bot Response System

### 1. Greeting Messages
**Triggers**: "hello", "hi", "hey", "start"
**Response**: 💪 Welcome to HustleMode.ai! I'm your digital David Goggins...

### 2. Motivation Requests
**Triggers**: "motivation", "motivate", "inspire", "help", "goals"
**Response**: 🔥 STAY HARD! You reached out for motivation - that's already a WIN!...

### 3. Goal-Related Messages
**Triggers**: "goal", "goals"
**Response**: 🎯 Goals without action are just dreams! What specific goal are you working on?...

### 4. General Support
**Triggers**: Any other text message
**Response**: 💪 I hear you! Remember: Every master was once a disaster...

### 5. Non-Text Messages
**Triggers**: Images, videos, audio, etc.
**Response**: 💪 I see your message! Text me your goals or say 'motivation' for some fire!

## 🏗️ Infrastructure Details

### Azure Function App
- **Name**: hustlemode-api
- **Plan**: Consumption Plan (Linux)
- **Resource Group**: hustlemode.ai
- **Region**: East US
- **Runtime**: Python 3.11
- **Architecture**: Azure Functions v2

### Features
- ✅ Serverless scaling (0 to thousands)
- ✅ Application Insights logging
- ✅ OpenAI extension integration
- ✅ WhatsApp Business API integration
- ✅ Intelligent message processing
- ✅ Cost-effective pay-per-execution

### Dependencies
- azure-functions
- requests (for WhatsApp API calls)
- OpenAI extension (Preview bundle v4.*)

### Monitoring
- **Application Insights**: Full request/response logging
- **Function Logs**: Complete execution traces
- **Performance Metrics**: Response times, success rates
- **Real-time Monitoring**: Azure Portal function monitoring

## 📊 Testing Commands

### Webhook Verification Test
```bash
curl "https://hustlemode-api.azurewebsites.net/api/messaging/whatsapp?code=your_function_key_here&hub.mode=subscribe&hub.challenge=TEST&hub.verify_token=fa22d4e7-cba4-48cf-9b36-af6190bf9c67"
```

### Health Check
```bash
curl "https://hustlemode-api.azurewebsites.net/api/health?code=your_function_key_here"
```

### WhatsApp Message Simulation
```bash
curl -X POST "https://hustlemode-api.azurewebsites.net/api/messaging/whatsapp?code=your_function_key_here" \
-H "Content-Type: application/json" \
-d '{"object":"whatsapp_business_account","entry":[{"id":"715387334407630","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"15556583575","phone_number_id":"682917338218717"},"messages":[{"from":"17817470041","id":"test_msg","timestamp":"1733875200","text":{"body":"I need motivation!"},"type":"text"}]},"field":"messages"}]}]}'
```

## 🔄 Deployment Process

### Method 1: Azure Functions Core Tools (Recommended)
```bash
cd azure-functions-deploy
func azure functionapp publish hustlemode-api --python --build remote
```

### Method 2: Clean Script 
```bash
./scripts/deploy-clean.sh --auto
```

### Method 3: GitHub Actions (Automatic)
Automatically deploys on push to main when `azure-functions-deploy/` files change.

## 💰 Cost Information
- **Consumption Plan**: Pay-per-execution (very cost-effective)
- **Application Insights**: Included in consumption plan
- **WhatsApp Business API**: Free tier (1000 conversations/month)
- **Azure OpenAI**: Pay-per-token usage

## 🎯 Current Capabilities
- ✅ Intelligent message processing and response
- ✅ WhatsApp Business API integration
- ✅ OpenAI-powered responses (configured but not yet active)
- ✅ Context-aware conversation handling
- ✅ Goal and motivation support
- ✅ Automated response to any message type

## 🚀 Next Development Goals
1. Activate OpenAI integration for dynamic responses
2. Add PostgreSQL user data persistence
3. Implement goal tracking with progress monitoring
4. Create user onboarding flow
5. Add analytics dashboard
6. Connect to full Mem0 conversation memory

---
**Last Updated**: June 10, 2025  
**Status**: ✅ PRODUCTION READY & INTELLIGENT RESPONSES ACTIVE 
**Test Number**: +17817470041 (test account limitation) 
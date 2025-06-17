# HustleMode.ai Production Reference

## 🚀 Live AI Coaching System Information
- **API Status**: ✅ LIVE with 4-Personality AI System
- **Personalities**: Goggins (tough love), Zen (mindful), Cheerleader (positive), Comedian (humorous)
- **AI Integration**: Direct OpenAI GPT-4 responses via Azure OpenAI SDK
- **Intelligence Level**: Real-time AI-generated coaching responses with personality consistency
- **Last Updated**: January 16, 2025

## 🔗 Production URLs

### Main Application
- **Function App**: https://hustlemode-api.azurewebsites.net/
- **Health Check**: https://hustlemode-api.azurewebsites.net/api/health?code=FUNCTION_KEY_HERE
- **Simple Ask API**: https://hustlemode-api.azurewebsites.net/api/ask?code=FUNCTION_KEY_HERE
- **Assistant API**: https://hustlemode-api.azurewebsites.net/api/assistants/{chatId}?code=FUNCTION_KEY_HERE
- **WhatsApp Webhook**: https://hustlemode-api.azurewebsites.net/api/messaging/whatsapp

### Azure Portal Links
- **Function App**: https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai/providers/Microsoft.Web/sites/hustlemode-api
- **Application Insights**: https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai/providers/microsoft.insights/components/hustlemode-api/overview
- **Resource Group**: https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai

## 📱 WhatsApp Configuration

### Meta for Developers
- **Webhook URL**: https://hustlemode-api.azurewebsites.net/api/messaging/whatsapp?code=gtSjj_laC1mjoon8u30eSs9KCXZl-HKqDgkLDiIw_aQTAzFuQtLgcw==
- **Function Key**: gtSjj_laC1mjoon8u30eSs9KCXZl-HKqDgkLDiIw_aQTAzFuQtLgcw==
- **Verify Token**: fa22d4e7-cba4-48cf-9b36-af6190bf9c67
- **Webhook Fields**: messages ✅
- **API Version**: v22.0
- **⚠️ CRITICAL**: Webhook URL MUST include function key for Azure Functions authentication

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

## 🎭 4-Personality AI Coaching System

### 🔥 Goggins (Tough Love Coach)
**API**: `POST /api/assistants/{chatId}?code=...` with `{"message": "...", "personality": "goggins"}`
**Style**: STAY HARD mentality, no-excuse accountability, military discipline
**Example**: "QUIT?! That's what your weak mind wants! Get back in there and STAY HARD! 💪"

### 🧘 Zen (Mindful Guide)  
**API**: `POST /api/assistants/{chatId}?code=...` with `{"message": "...", "personality": "zen"}`
**Style**: Calm wisdom, nature metaphors, balanced perspective
**Example**: "Like a river meeting a boulder, we can flow around obstacles. Small steps still lead to the summit. 🍃"

### 📣 Cheerleader (Positive Encourager)
**API**: `POST /api/assistants/{chatId}?code=...` with `{"message": "...", "personality": "cheerleader"}`  
**Style**: Enthusiastic celebration, positive reinforcement, high energy
**Example**: "Hey superstar! You've been SHOWING UP! That's incredible! Let's make this FUN again! ✨"

### 😄 Comedian (Humorous Motivator)
**API**: `POST /api/assistants/{chatId}?code=...` with `{"message": "...", "personality": "comedian"}`
**Style**: Laughter therapy, reframes challenges with humor, light-hearted coaching  
**Example**: "Your couch is very persuasive! But your future self is plotting revenge. Let's earn that pizza! 🍕💪"

### 🚀 API Features
- **Real-time AI**: Direct OpenAI GPT-4 responses
- **Personality Consistency**: Each coach maintains character
- **Dynamic Responses**: Never the same response twice
- **Stateless Design**: Simple API calls with personality parameter

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

## 📊 Testing Commands - 4 Personality System

### Health Check
```bash
curl "https://hustlemode-api.azurewebsites.net/api/health?code=FUNCTION_KEY_HERE"
```

### Simple Ask API Test
```bash
curl -X POST "https://hustlemode-api.azurewebsites.net/api/ask?code=FUNCTION_KEY_HERE" \
-H "Content-Type: application/json" \
-d '{"prompt": "Hello, are you working?"}'
```

### 🔥 Goggins Personality Test
```bash
curl -X POST "https://hustlemode-api.azurewebsites.net/api/assistants/goggins123?code=FUNCTION_KEY_HERE" \
-H "Content-Type: application/json" \
-d '{"message": "I want to quit my workout", "personality": "goggins"}'
```

### 🧘 Zen Personality Test  
```bash
curl -X POST "https://hustlemode-api.azurewebsites.net/api/assistants/zen123?code=FUNCTION_KEY_HERE" \
-H "Content-Type: application/json" \
-d '{"message": "I feel overwhelmed with my goals", "personality": "zen"}'
```

### 📣 Cheerleader Personality Test
```bash
curl -X POST "https://hustlemode-api.azurewebsites.net/api/assistants/cheer123?code=FUNCTION_KEY_HERE" \
-H "Content-Type: application/json" \
-d '{"message": "I completed my first workout!", "personality": "cheerleader"}'
```

### 😄 Comedian Personality Test
```bash
curl -X POST "https://hustlemode-api.azurewebsites.net/api/assistants/funny123?code=FUNCTION_KEY_HERE" \
-H "Content-Type: application/json" \
-d '{"message": "I ate pizza instead of going to the gym", "personality": "comedian"}'
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
- ✅ **4-Personality AI System**: Goggins, Zen, Cheerleader, Comedian all live and functional
- ✅ **Direct OpenAI Integration**: Real-time AI responses using Azure OpenAI GPT-4
- ✅ **Personality Selection**: Choose personality via API parameter
- ✅ **Context-aware AI responses**: Dynamic, never-repeated coaching
- ✅ **Production-ready API**: All endpoints working with function key authentication
- ✅ **Stateless design**: Simple API calls, no complex state management

## 🚀 Next Development Goals
1. **WhatsApp Integration**: Connect 4-personality system to WhatsApp webhook
2. **Conversation Memory**: Add PostgreSQL user data persistence across personalities
3. **Goal Tracking**: Implement progress monitoring with AI coaching insights
4. **Analytics Dashboard**: Track personality usage and coaching effectiveness
5. **Voice Integration**: Add audio message processing and voice responses
6. **Advanced Memory**: Long-term context with Mem0 integration

---
**Last Updated**: January 16, 2025  
**Status**: ✅ PRODUCTION READY WITH 4 AI PERSONALITIES ACTIVE 
**Architecture**: Azure Functions v2 + Direct OpenAI SDK
**Next Phase**: WhatsApp integration with personality selection 
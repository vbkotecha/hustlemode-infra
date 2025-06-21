# HustleMode.ai Production Operations Guide

## 🎯 Current MVP Status
- **Status**: ✅ LIVE - Simplified 2-Personality System
- **Personalities**: Taskmaster (tough love) + Cheerleader (positive support)  
- **Architecture**: Azure Functions Premium Plan + OpenAI GPT-4
- **Message Length**: Ultra-concise (8-12 words max)
- **Last Updated**: January 16, 2025 (Storage Monitoring Added)

> 📋 **Configuration Reference**: See `deployment-config.json` for all authoritative configuration values

## 🔗 Live URLs

### Core Endpoints
```bash
# Base URL (from deployment-config.json)
BASE_URL="https://hustlemode-api.azurewebsites.net"

# Get function key from Azure Portal first, then:
FUNCTION_KEY="your_function_key_here"
```

**Key Endpoints:**
- Health Check: `${BASE_URL}/api/health?code=${FUNCTION_KEY}`
- Storage Metrics: `${BASE_URL}/api/storage?code=${FUNCTION_KEY}`
- Assistant API: `${BASE_URL}/api/assistants/{chatId}?code=${FUNCTION_KEY}`
- WhatsApp Webhook: `${BASE_URL}/api/messaging/whatsapp?code=${FUNCTION_KEY}`

### Azure Portal Links
- **Function App**: [hustlemode-api](https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai/providers/Microsoft.Web/sites/hustlemode-api)
- **Application Insights**: [Monitoring](https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai/providers/microsoft.insights/components/hustlemode-api/overview)
- **Resource Group**: [hustlemode.ai](https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai)

## 📱 WhatsApp Configuration

### Meta for Developers Setup
- **Webhook URL**: `https://hustlemode-api.azurewebsites.net/api/messaging/whatsapp?code={FUNCTION_KEY}`
- **Verify Token**: `fa22d4e7-cba4-48cf-9b36-af6190bf9c67`
- **Webhook Fields**: ✅ messages
- **⚠️ CRITICAL**: Webhook URL MUST include function key for Azure authentication

### Phone Numbers
- **Business Number**: +15556583575 (sends messages)
- **Test Recipient**: +17817470041 (receives messages during testing)

## 🎭 2-Personality MVP System

### 💪 Taskmaster Mode (Default)
**Style**: Military discipline, no excuses, tough love  
**Response Length**: 8-12 words maximum  
**Example**: "Stop whining. Go work out. Now! 🏋️‍♂️" (6 words)

### 🎉 Cheerleader Mode  
**Style**: Enthusiastic celebration, positive reinforcement  
**Response Length**: 8-12 words maximum  
**Example**: "YES! You're crushing it! 🎉 Keep going!" (7 words)

## 🧪 Testing Commands

### 1. Health Check
```bash
curl "https://hustlemode-api.azurewebsites.net/api/health?code=${FUNCTION_KEY}"
```

### 2. Storage Metrics & Database Monitoring
```bash
curl "https://hustlemode-api.azurewebsites.net/api/storage?code=${FUNCTION_KEY}" | jq
```
**Current Status** (from deployment-config.json):
- **Phase**: Phase 1 (0-5K Users) - Optimal state ✅
- **Storage**: 224 KB for 77 messages from 5 users
- **Database**: PostgreSQL + Mem0 hybrid architecture
- **Scaling**: 3-phase strategy documented

### 3. Taskmaster Personality Test
```bash
curl -X POST "https://hustlemode-api.azurewebsites.net/api/assistants/test123?code=${FUNCTION_KEY}" \
-H "Content-Type: application/json" \
-d '{"message": "I want to quit my workout", "personality": "taskmaster"}'
```

### 4. Cheerleader Personality Test
```bash
curl -X POST "https://hustlemode-api.azurewebsites.net/api/assistants/test123?code=${FUNCTION_KEY}" \
-H "Content-Type: application/json" \
-d '{"message": "I completed my first workout!", "personality": "cheerleader"}'
```

### 5. WhatsApp Webhook Simulation
```bash
curl -X POST "https://hustlemode-api.azurewebsites.net/api/messaging/whatsapp?code=${FUNCTION_KEY}" \
-H "Content-Type: application/json" \
-d '{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "715387334407630",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "17817470041",
          "phone_number_id": "682917338218717"
        },
        "messages": [{
          "from": "17817470041",
          "id": "test_msg_123",
          "timestamp": "1733875200",
          "text": {"body": "I need motivation!"},
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}'
```

## 🚀 Deployment Operations

### Method 1: Azure Functions Core Tools (Recommended)
```bash
cd azure-functions-deploy
func azure functionapp publish hustlemode-api --python --build remote
```

### Method 2: Clean Script
```bash
./scripts/deploy-clean.sh --auto
```

### Method 3: GitHub Actions
Automatically deploys on push to main branch when `azure-functions-deploy/` files change.

## 🔍 Monitoring & Troubleshooting

### Key Metrics to Monitor
- **Response Time**: Should be < 2 seconds
- **Error Rate**: Should be < 1%
- **Function Executions**: Track usage patterns
- **WhatsApp Webhook Success**: Monitor message delivery
- **Database Storage**: Monitor via `/api/storage` endpoint
- **Storage Growth**: Track message volume and user growth
- **Performance**: Database query times and index usage

### Common Issues
1. **401 Unauthorized**: Function key missing or invalid
2. **WhatsApp Not Responding**: Check webhook URL includes function key
3. **Slow Responses**: Monitor Application Insights for bottlenecks
4. **OpenAI Errors**: Check Azure OpenAI service status and quotas
5. **Storage Endpoint 404**: Ensure separate storage.py blueprint is deployed
6. **Database Connection**: Check PostgreSQL firewall and connection string

### Logs Access
- **Azure Portal**: Function App → Functions → Monitor
- **Application Insights**: Query logs with KQL
- **Real-time**: Function App → Log stream

## 🔑 Security Checklist

### Function Keys
- [ ] **Obtain from Azure Portal**: Functions → App keys → Function keys
- [ ] **Update WhatsApp webhook**: Include `?code={key}` parameter
- [ ] **Test all endpoints**: Verify authentication works
- [ ] **Rotate periodically**: Generate new keys as needed

### Environment Variables
- [ ] **WhatsApp Token**: System user token (never expires)
- [ ] **Azure OpenAI**: Endpoint and key configured
- [ ] **Verify Token**: WhatsApp webhook verification token set

## 💰 Cost Monitoring

### Premium Plan Benefits  
- **No Cold Starts**: Always warm instances
- **Better Performance**: Guaranteed compute resources  
- **Higher Scale Limits**: More concurrent executions
- **VNet Integration**: Enhanced security options

### Usage Patterns to Monitor
- Function execution count and duration
- Azure OpenAI token usage (90% reduction with Mem0 optimization)
- Application Insights data ingestion
- Storage account transactions
- **PostgreSQL Storage**: Currently 224 KB (Phase 1 optimal)
- **Database Query Performance**: Monitor index usage and query times

### Storage Scaling Economics (from deployment-config.json)
- **Phase 1 (0-5K Users)**: ~$5/month PostgreSQL + monitoring
- **Phase 2 (5K-50K Users)**: ~$20/month with 90-day retention  
- **Phase 3 (50K+ Users)**: ~$50/month with advanced optimization
- **Mem0 Benefits**: 90% token savings reduces AI processing costs significantly

---
**Configuration Source**: `deployment-config.json`  
**Last Updated**: January 16, 2025  
**Status**: ✅ Production Ready - 2-Personality MVP System 
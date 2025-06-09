# HustleMode.ai Production Reference

## 🚀 Live Bot Information
- **WhatsApp Number**: +15556583575
- **Bot Status**: ✅ LIVE and responding with full Goggins personality
- **Last Verified**: June 9, 2025

## 🔗 Production URLs

### Main Application
- **Function App**: https://hustlemode-premium-bot.azurewebsites.net/
- **Health Check**: https://hustlemode-premium-bot.azurewebsites.net/api/health
- **WhatsApp Webhook**: https://hustlemode-premium-bot.azurewebsites.net/api/webhook/whatsapp

### Azure Portal Links
- **Function App**: https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai/providers/Microsoft.Web/sites/hustlemode-premium-bot
- **Application Insights**: https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai/providers/microsoft.insights/components/hustlemode-premium-bot/overview
- **Resource Group**: https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai

## 📱 WhatsApp Configuration

### Meta for Developers
- **Webhook URL**: https://hustlemode-premium-bot.azurewebsites.net/api/webhook/whatsapp
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
WHATSAPP_TOKEN=EACPL4t2aebo... (current as of June 9, 2025)
WHATSAPP_PHONE_NUMBER_ID=682917338218717
WHATSAPP_VERIFY_TOKEN=fa22d4e7-cba4-48cf-9b36-af6190bf9c67
WHATSAPP_PHONE_NUMBER=15556583575
```

## 🤖 Bot Response Types

### 1. Welcome Message
**Triggers**: hi, hello, hey, start, begin
**Response**: Full accountability partner introduction

### 2. Goal Setting
**Triggers**: set goal, new goal, goal, target, achieve
**Response**: No weak targets allowed framework

### 3. Progress Check
**Triggers**: progress, check in, update, how am i doing, status
**Response**: Brutal honesty about performance

### 4. Setback Recovery
**Triggers**: failed, setback, can't do it, giving up, too hard, quit
**Response**: Turn pain into power motivation

### 5. General Motivation
**Triggers**: motivate, encourage, help, stuck, motivation, tired
**Response**: Discipline over motivation philosophy

### 6. Default Responses
**Random selection** from 5 different Goggins-style motivational messages

## 🏗️ Infrastructure Details

### Azure Function App
- **Name**: hustlemode-premium-bot
- **Plan**: EP1 (ElasticPremium) - Premium Plan
- **Resource Group**: hustlemode.ai
- **Region**: East US
- **Runtime**: Python 3.11

### Features
- ✅ No cold starts (dedicated resources)
- ✅ Application Insights logging
- ✅ 99.9% uptime SLA
- ✅ Auto-scaling capabilities
- ✅ VNet integration available
- ✅ ZIP deployment

### Monitoring
- **Application Insights**: Full request/response logging
- **Debug Logs**: Complete HTTP traffic details
- **Performance Metrics**: Response times, error rates
- **Real-time Monitoring**: Live log streaming

## 📊 Testing Commands

### Webhook Verification Test
```bash
curl "https://hustlemode-premium-bot.azurewebsites.net/api/webhook/whatsapp?hub.mode=subscribe&hub.challenge=TEST&hub.verify_token=fa22d4e7-cba4-48cf-9b36-af6190bf9c67"
```

### Health Check
```bash
curl https://hustlemode-premium-bot.azurewebsites.net/api/health
```

### WhatsApp API Test
```bash
curl -i -X POST \
  https://graph.facebook.com/v22.0/682917338218717/messages \
  -H 'Authorization: Bearer [CURRENT_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{ "messaging_product": "whatsapp", "to": "17817470041", "type": "text", "text": { "body": "STAY HARD!" } }'
```

## 🔄 Deployment Process

### Method 1: Clean Script (Recommended)
```bash
./scripts/deploy-clean.sh
```

### Method 2: GitHub Actions (Automatic)
Automatically deploys on push to main when `azure-functions-deploy/` files change.

### Method 3: Manual
```bash
mkdir -p temp/deploy
cp -r azure-functions-deploy/* temp/deploy/
cd temp/deploy && zip -r ../functions.zip .
az functionapp deployment source config-zip --name hustlemode-premium-bot --resource-group hustlemode.ai --src temp/functions.zip
rm -rf temp/
```

### Dependencies
- azure-functions==1.19.0
- azure-core>=1.30.0
- Python built-in: urllib, json, os, random

### Repository Status
- **Bloat Check**: `./scripts/check-bloat.sh`
- **Status**: ✅ CLEAN and protected against future bloat

## 💰 Cost Information
- **Premium Plan EP1**: ~$150-300/month
- **Application Insights**: Included
- **WhatsApp Business API**: Free tier (1000 conversations/month)

## 🎯 Next Development Goals
1. Add PostgreSQL user data persistence
2. Implement goal tracking with Mem0
3. Create user onboarding flow
4. Add analytics dashboard
5. Expand response personality variations

---
**Last Updated**: June 9, 2025  
**Status**: ✅ PRODUCTION READY & OPERATIONAL 
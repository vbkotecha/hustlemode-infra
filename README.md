# HustleMode.ai

**🎉 LIVE PRODUCTION BOT: 2-Personality MVP - Ultra-Concise AI Coaching System**

[![Production Status](https://img.shields.io/badge/Status-LIVE-brightgreen.svg)](https://hustlemode-api.azurewebsites.net/api/health)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-+15556583575-25D366.svg)](https://wa.me/15556583575)
[![Azure Functions](https://img.shields.io/badge/Azure-Functions%20Premium-0078D4.svg)](https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai/providers/Microsoft.Web/sites/hustlemode-api)

HustleMode.ai is a production-ready AI coaching system with 2 distinct personalities delivering ultra-concise motivation (8-12 words max). Built on Azure Functions Premium with modular architecture and WhatsApp Business API integration.

## 🚀 Try It Now!

**Text the bot**: [+1 (555) 658-3575](https://wa.me/15556583575)

### 🎭 2-Personality MVP System
- **💪 Taskmaster Mode** (Default): Military discipline, no excuses, tough love
- **🎉 Cheerleader Mode**: Enthusiastic celebration, positive reinforcement

Try these commands:
- **"Hi"** → Get introduction to coaching personalities
- **"switch to cheerleader"** → Change to positive encourager mode
- **"be my taskmaster"** → Switch to tough love accountability coach
- **"I need motivation!"** → Get ultra-concise coaching response
- **"I completed my workout!"** → Personality-appropriate celebration/acknowledgment

## 🏗️ Production Architecture

### Live Infrastructure
- **Azure Functions Premium Plan**: No cold starts, guaranteed warm instances
- **Function App**: `hustlemode-api` (Premium Plan EP1)
- **Application Insights**: Full logging and monitoring
- **WhatsApp Business API**: Direct integration with Meta
- **Python 3.11**: Modular blueprint architecture

### Core Components

1. **Modular API Architecture**
   ```
   apis/
   ├── health.py           # Health check endpoints
   ├── assistant.py        # AI assistant with personalities  
   ├── completion.py       # Simple completion endpoint
   ├── whatsapp.py        # WhatsApp webhook and messaging
   └── user_management.py # User conversations and preferences
   ```

2. **2-Personality Coaching System**
   ```
   personalities/
   ├── taskmaster.py      # Tough love accountability coach
   └── cheerleader.py     # Enthusiastic positive support
   ```

3. **Production Monitoring**
   - Application Insights dashboard
   - Real-time performance metrics
   - HTTP request/response logging
   - Error tracking and alerts

## 🤖 Bot Capabilities

### 🎭 Personality System

| Personality | Style | Response Length | Example |
|-------------|-------|-----------------|---------|
| **💪 Taskmaster** | Military discipline, no excuses | 8-12 words | "Stop whining. Go work out. Now! 🏋️‍♂️" |
| **🎉 Cheerleader** | Enthusiastic celebration | 8-12 words | "YES! You're crushing it! 🎉 Keep going!" |

### Key Features
- ✅ **Ultra-Concise Responses**: Maximum 8-12 words for mobile messaging
- ✅ **Instant Responses**: Premium plan eliminates cold starts
- ✅ **Personality Switching**: Voice commands or API parameters
- ✅ **Production Ready**: 99.9% uptime SLA
- ✅ **Full Monitoring**: Complete request/response logging
- ✅ **Scalable**: Auto-scaling with dedicated resources

## 🔗 Production Links

### Application URLs
- **Live Bot**: https://hustlemode-api.azurewebsites.net/
- **Health Check**: https://hustlemode-api.azurewebsites.net/api/health
- **WhatsApp Webhook**: https://hustlemode-api.azurewebsites.net/api/messaging/whatsapp

### Monitoring & Management
- **[Application Insights Dashboard](https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai/providers/microsoft.insights/components/hustlemode-api/overview)**
- **[Azure Function App](https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai/providers/Microsoft.Web/sites/hustlemode-api)**
- **[Resource Group](https://portal.azure.com/#resource/subscriptions/346876ba-71e4-417a-a63a-9a42f434a0ae/resourceGroups/hustlemode.ai)**

## 🛠️ Technical Implementation

### Project Structure

```
hustlemode-infra/
├── azure-functions-deploy/     # Main Azure Functions (PRODUCTION CODE)
│   ├── apis/                  # Modular API blueprints
│   │   ├── health.py          # Health check endpoints
│   │   ├── assistant.py       # AI assistant management
│   │   ├── completion.py      # Simple completion endpoint
│   │   ├── whatsapp.py       # WhatsApp integration
│   │   └── user_management.py # User data management
│   ├── personalities/         # Coaching personality modules
│   │   ├── taskmaster.py      # Tough love coach
│   │   └── cheerleader.py     # Positive encourager
│   ├── assistant_utils.py     # Helper functions
│   ├── constants.py           # Configuration and fallbacks
│   ├── whatsapp_api.py       # WhatsApp Business API
│   ├── function_app.py       # Blueprint registration (8 lines)
│   ├── requirements.txt      # Python dependencies
│   └── host.json             # Azure Functions configuration
├── ai/                        # AI services and documentation
├── prompts/                   # AI prompt templates
├── scripts/                   # Deployment and utility scripts
├── .github/workflows/         # Automated CI/CD and quality checks
├── .cursor/rules/             # Development guidelines
└── [documentation files]      # Project documentation
```

### Dependencies
```txt
azure-functions==1.19.0
azure-core>=1.30.0
requests>=2.31.0
openai>=1.0.0
```

### WhatsApp Configuration
- **Phone Number**: +15556583575
- **Business Account**: 715387334407630
- **Phone Number ID**: 682917338218717
- **API Version**: v22.0
- **Test Recipient**: +17817470041 (during testing phase)

## 🚀 Development & Deployment

### Local Development
```bash
# Clone repository
git clone [repository-url]
cd hustlemode-infra

# Check repository health
./scripts/check-bloat.sh

# Local testing
curl https://hustlemode-api.azurewebsites.net/api/health
```

### Repository Quality & Anti-Bloat System
```bash
# Run comprehensive bloat check
./scripts/check-bloat.sh

# Automated protection via GitHub Actions
# - Runs on every push and pull request
# - Prevents empty directories, zip files, duplicates
# - Enforces clean architecture standards
```

### Deployment Process
```bash
# Method 1: Azure Functions Core Tools (Recommended)
cd azure-functions-deploy
func azure functionapp publish hustlemode-api --python --build remote

# Method 2: Clean Script
./scripts/deploy-clean.sh --auto

# Method 3: GitHub Actions (Automatic on push to main)
```

### Testing
```bash
# Health check
curl https://hustlemode-api.azurewebsites.net/api/health

# Taskmaster personality test
curl -X POST "https://hustlemode-api.azurewebsites.net/api/assistants/test123?code=${FUNCTION_KEY}" \
-H "Content-Type: application/json" \
-d '{"message": "I want to quit my workout", "personality": "taskmaster"}'

# Cheerleader personality test  
curl -X POST "https://hustlemode-api.azurewebsites.net/api/assistants/test123?code=${FUNCTION_KEY}" \
-H "Content-Type: application/json" \
-d '{"message": "I completed my first workout!", "personality": "cheerleader"}'
```

## 📊 Production Metrics

### Performance
- **Response Time**: < 2 seconds average
- **Message Length**: 8-12 words maximum (mobile-optimized)
- **Uptime**: 99.9% SLA
- **Concurrent Users**: Auto-scaling enabled
- **Monthly Conversations**: 1000+ supported

### Cost Structure
- **Azure Functions Premium EP1**: ~$150-300/month (no cold starts)
- **Application Insights**: Included
- **WhatsApp Business API**: Free tier (1000 conversations/month)
- **Azure OpenAI**: Pay-per-token usage

## 🎯 Roadmap

### Phase 1: MVP Foundation ✅ COMPLETE
- [x] 2-personality coaching system (Taskmaster + Cheerleader)
- [x] Ultra-concise messaging (8-12 words max)
- [x] WhatsApp Business API integration
- [x] Azure Functions Premium deployment
- [x] Modular architecture (APIs + Personalities)
- [x] Production monitoring setup

### Phase 2: Data & Intelligence (Next)
- [ ] PostgreSQL user data persistence
- [ ] Conversation memory across personality switches
- [ ] Goal tracking and progress monitoring
- [ ] User onboarding flow
- [ ] Analytics dashboard

### Phase 3: Scale & Advanced Features
- [ ] Voice message processing and responses
- [ ] Multi-language support
- [ ] Advanced goal frameworks
- [ ] Integration with fitness trackers
- [ ] Group coaching features

## 📞 Support & Documentation

- **Live Bot**: [+1 (555) 658-3575](https://wa.me/15556583575)
- **Configuration Reference**: [deployment-config.json](deployment-config.json)
- **Operations Guide**: [PRODUCTION_LINKS.md](PRODUCTION_LINKS.md)
- **Change History**: [CHANGELOG.md](CHANGELOG.md)
- **Health Status**: [Live Health Check](https://hustlemode-api.azurewebsites.net/api/health)

## 🏆 Project Status

**Status**: ✅ **PRODUCTION READY - 2-PERSONALITY MVP**  
**Last Updated**: January 16, 2025  
**Version**: 2.0-simplified-mvp  

The HustleMode.ai coaching system is live with 2 focused personalities delivering ultra-concise motivation perfect for mobile messaging. All core functionality is operational with production-grade infrastructure and monitoring.

### Repository Health
- ✅ **Clean Architecture**: Modular APIs and personalities structure
- ✅ **No Bloat**: Anti-bloat protection active, obsolete files removed
- ✅ **Automated Quality**: GitHub Actions prevent future repository degradation
- ✅ **Single Source of Truth**: deployment-config.json as authoritative source
- ✅ **Maintainable**: Clear separation of concerns, comprehensive documentation

---

*"Discipline equals freedom. Every small action builds your future." - Taskmaster Mode*

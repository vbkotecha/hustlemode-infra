# HustleMode.ai Azure Functions

**🎯 2-Personality MVP AI Coaching System**

Ultra-concise AI coaching with 2 focused personalities delivering 8-12 word responses optimized for mobile messaging.

## 🎭 Personality System

### Available Personalities
- **💪 Taskmaster** (Default): Tough love accountability coach
- **🎉 Cheerleader**: Enthusiastic positive support and celebration

### Response Examples
- **Taskmaster**: "Stop whining. Go work out. Now! 🏋️‍♂️" (6 words)
- **Cheerleader**: "YES! You're crushing it! 🎉 Keep going!" (7 words)

## 🏗️ Architecture

### Modular Structure
```
azure-functions-deploy/
├── apis/                    # Modular API blueprints
│   ├── __init__.py         # Blueprint exports
│   ├── health.py           # Health check endpoints
│   ├── assistant.py        # AI assistant with personalities
│   ├── completion.py       # Simple completion endpoint
│   ├── whatsapp.py        # WhatsApp integration
│   └── user_management.py # User data management
├── personalities/          # 2-personality MVP system
│   ├── __init__.py        # Personality exports
│   ├── taskmaster.py      # Tough love coach
│   └── cheerleader.py     # Positive encourager
├── function_app.py        # Blueprint registration (8 lines)
├── constants.py           # Configuration constants
├── assistant_utils.py     # Helper functions
├── whatsapp_api.py        # WhatsApp Business API
└── requirements.txt       # Dependencies
```

## 🚀 API Endpoints

### Health Check
```http
GET /api/health
```

### Assistant API (Personality-Based)
```http
POST /api/assistants/{chatId}
Content-Type: application/json

{
  "message": "I need motivation!",
  "personality": "taskmaster"  // or "cheerleader"
}
```

### Simple Completion
```http
POST /api/completion
Content-Type: application/json

{
  "prompt": "Give me motivation!"
}
```

### WhatsApp Integration
```http
POST /api/messaging/whatsapp  (webhook)
GET /api/messaging/whatsapp   (verification)
```

### User Management
```http
GET /api/users/{userId}/conversations
PUT /api/users/{userId}/preferences
```

## 🎯 Personality Switching

### Voice Commands
- **"switch to taskmaster"** → Tough love mode
- **"be my cheerleader"** → Positive support mode
- **"change personality"** → Switch between modes

### API Parameter
```json
{
  "message": "I completed my workout!",
  "personality": "cheerleader"
}
```

## 📱 Mobile Optimization

### Ultra-Concise Responses
- **Maximum**: 12 words per response
- **Target**: 8-10 words for optimal mobile experience
- **Text-Message Perfect**: Fits comfortably in single text bubble
- **Action-Oriented**: Every response inspires immediate action

## 🔧 Development

### Adding New API Groups
1. Create new file in `apis/` directory
2. Implement Azure Functions blueprint pattern
3. Export blueprint in `apis/__init__.py`
4. Register in `function_app.py`

### Personality Guidelines
- Maintain character consistency within word limits
- Provide fallback responses for when AI unavailable
- Test across all messaging platforms
- Validate word count limits (8-12 words max)

## 🧪 Testing

### Local Development
```bash
func start
```

### Test Endpoints
```bash
# Health check
curl http://localhost:7071/api/health

# Taskmaster personality
curl -X POST http://localhost:7071/api/assistants/test123 \
-H "Content-Type: application/json" \
-d '{"message": "I want to quit my workout", "personality": "taskmaster"}'

# Cheerleader personality
curl -X POST http://localhost:7071/api/assistants/test123 \
-H "Content-Type: application/json" \
-d '{"message": "I completed my first workout!", "personality": "cheerleader"}'
```

## 🚀 Deployment

### Recommended Method
```bash
cd azure-functions-deploy
func azure functionapp publish hustlemode-api --python --build remote
```

### Alternative (Clean Script)
```bash
# From repository root
./scripts/deploy-clean.sh
```

## 📊 Environment Variables

Required in `local.settings.json`:
```json
{
  "Values": {
    "WHATSAPP_TOKEN": "your_whatsapp_token",
    "WHATSAPP_PHONE_NUMBER_ID": "682917338218717",
    "WHATSAPP_VERIFY_TOKEN": "fa22d4e7-cba4-48cf-9b36-af6190bf9c67",
    "AZURE_OPENAI_ENDPOINT": "https://hustlemode-ai.openai.azure.com/",
    "AZURE_OPENAI_KEY": "your_azure_openai_key",
    "AZURE_OPENAI_DEPLOYMENT_NAME": "hustlemode-ai"
  }
}
```

## 🎯 Core Principles

- **Ultra-Concise**: Maximum 12 words per response
- **2-Personality Focus**: Taskmaster + Cheerleader covers 80% of coaching needs
- **Platform-Agnostic**: Works across WhatsApp, iMessage, SMS
- **Mobile-First**: Optimized for mobile messaging platforms
- **Modular Architecture**: Easy to extend and maintain

---
**Status**: Production Ready - 2-Personality MVP System  
**Focus**: Ultra-concise AI coaching for mobile messaging 
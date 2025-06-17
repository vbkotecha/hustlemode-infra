# HustleMode.ai Azure Functions API

## Overview

**Clean Azure Functions implementation using direct OpenAI API calls** for HustleMode.ai motivational coaching platform.

This implementation uses **direct Azure OpenAI SDK calls** instead of the Azure Functions OpenAI Extension for better reliability, debugging, and control.

## Architecture: Direct vs Extension Approach

### ✅ Direct OpenAI Calls (Current Implementation)
```python
from openai import AzureOpenAI
client = AzureOpenAI(api_key="...", azure_endpoint="...")
response = client.chat.completions.create(model="gpt-4o", messages=[...])
```

**Advantages:**
- ✅ **Simpler setup** - just API key and endpoint needed  
- ✅ **Full control** over OpenAI requests and responses
- ✅ **Easy debugging** - you see exactly what's happening
- ✅ **Better error handling** - direct access to errors
- ✅ **No dependency issues** - works with any Azure Functions runtime

### ❌ Azure Functions OpenAI Extension (Previous)
```python
@app.assistant_post_input(model="gpt-4o", ...)
def post_message(req, state: str):  # Extension handles OpenAI calls
```

**Disadvantages:**
- ❌ Complex configuration required (extensions, host.json)
- ❌ Limited control over OpenAI interactions
- ❌ Harder to debug when things go wrong
- ❌ Extension dependency issues
- ❌ Black box behavior

## Configuration

### Environment Variables
```
AZURE_OPENAI_ENDPOINT=https://hustlemode-ai.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key-here
FUNCTIONS_WORKER_RUNTIME=python
AzureWebJobsStorage=your-storage-connection-string
```

### Azure OpenAI Deployment
- **Model**: `gpt-4o`
- **Deployment Name**: `gpt-4o`
- **API Version**: `2024-02-01`

## API Endpoints

### Health Check
```bash
GET /api/health
```
Basic health status endpoint.

### Simple Ask (Stateless)
```bash
POST /api/ask
Content-Type: application/json

{
  "prompt": "Your question here"
}
```

**Response:**
```json
{
  "response": "AI response here",
  "success": true
}
```

### Assistant API (Personality-based)

#### Create Assistant
```bash
PUT /api/assistants/{chatId}
Content-Type: application/json

{
  "personality": "goggins"  // or "zen"
}
```

#### Send Message to Assistant
```bash
POST /api/assistants/{chatId}
Content-Type: application/json

{
  "message": "Your message here"
}
```

**Response:**
```json
{
  "chatId": "your-chat-id",
  "response": "Personality-based response",
  "success": true
}
```

#### Get Chat History
```bash
GET /api/assistants/{chatId}
```

### Personalities

#### Goggins (Default)
Intense, no-nonsense motivation and accountability:
- Mental toughness focus
- "STAY HARD" energy
- Challenge-oriented responses
- Action-focused advice

#### Zen
Calm, mindful guidance:
- Inner peace and balance
- Nature metaphors
- Journey over destination
- Mindful approaches

## Testing

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Start local functions
func start --host 0.0.0.0 --port 7071

# Test endpoints
curl -X POST "http://localhost:7071/api/ask" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'
```

### Production Testing
```bash
# Test ask endpoint
curl -X POST "https://hustlemode-api.azurewebsites.net/api/ask?code=FUNCTION_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'

# Test Goggins assistant
curl -X POST "https://hustlemode-api.azurewebsites.net/api/assistants/test123?code=FUNCTION_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to get fit but keep making excuses"}'
```

## Deployment

Uses `../scripts/deploy-clean.sh` for consistent Azure deployments:

```bash
cd /path/to/hustlemode-infra
./scripts/deploy-clean.sh
```

## Key Benefits of This Implementation

1. **Reliability**: Direct SDK calls are more stable than extensions
2. **Debugging**: Full visibility into OpenAI requests/responses  
3. **Control**: Complete control over personality system logic
4. **Simplicity**: Minimal configuration needed
5. **Performance**: No extension overhead

## Future Enhancements

- [ ] Add conversation memory with Azure Storage
- [ ] Implement user-specific personality preferences
- [ ] Add more personality types (Coach, Therapist, etc.)
- [ ] WhatsApp integration for message delivery
- [ ] Rate limiting and usage analytics 
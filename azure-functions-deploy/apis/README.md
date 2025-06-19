# APIs Module

This module contains individual API blueprints for the HustleMode.ai Azure Functions app. Each API group is defined in its own file for better organization and maintainability.

## Structure

```
apis/
├── __init__.py           # Module interface and blueprint exports
├── health.py            # Health check endpoint
├── assistant.py         # Assistant API (Create, PostMessage, GetChatState)
├── completion.py        # Simple completion endpoint (ask)
├── whatsapp.py         # WhatsApp webhook and messaging endpoints
├── user_management.py  # User conversations and preferences
└── README.md           # This documentation
```

## API Groups

### Health (`health.py`)
Basic health check and status endpoints:
- `GET /api/health` - Application health status

### Assistant (`assistant.py`)
AI assistant management with personality support:
- `PUT /api/assistants/{chatId}` - Create assistant with personality
- `POST /api/assistants/{chatId}` - Send message to assistant
- `GET /api/assistants/{chatId}` - Get chat conversation history

### Completion (`completion.py`)
Simple stateless AI completion:
- `POST /api/ask` - Direct OpenAI completion endpoint

### WhatsApp (`whatsapp.py`)
WhatsApp Business API integration:
- `GET/POST /api/messaging/whatsapp` - Webhook handler
- `POST /api/messaging/send` - Send WhatsApp message with AI

### User Management (`user_management.py`)
User data and preferences:
- `GET /api/users/{phone}/conversations` - Get user conversation history
- `PUT /api/users/{phone}/preferences` - Set user preferences

## Adding New API Groups

To add a new API group:

1. **Create a new blueprint file** (e.g., `analytics.py`):
   ```python
   import json
   import logging
   import azure.functions as func
   
   # Create blueprint for analytics endpoints
   analytics_bp = func.Blueprint()
   
   @analytics_bp.function_name("get_analytics")
   @analytics_bp.route(route="analytics", methods=["GET"])
   def get_analytics(req: func.HttpRequest) -> func.HttpResponse:
       """Get usage analytics."""
       
       # Your implementation here
       return func.HttpResponse(
           json.dumps({"status": "analytics data"}),
           status_code=200,
           mimetype="application/json"
       )
   ```

2. **Update `__init__.py`** to include your new blueprint:
   ```python
   from .analytics import analytics_bp
   
   BLUEPRINTS = [
       health_bp,
       assistant_bp,
       completion_bp,
       whatsapp_bp,
       user_management_bp,
       analytics_bp  # Add your new blueprint
   ]
   ```

3. **The main `function_app.py`** will automatically register your blueprint

## Blueprint File Format

Each API blueprint file should follow this structure:

```python
import json
import logging
import azure.functions as func
# Import any specific dependencies

# Create blueprint for your API group
your_api_bp = func.Blueprint()

@your_api_bp.function_name("unique_function_name")
@your_api_bp.route(route="your/route", methods=["GET", "POST"])
def your_endpoint(req: func.HttpRequest) -> func.HttpResponse:
    """Endpoint description."""
    
    try:
        # Your logic here
        
        return func.HttpResponse(
            json.dumps({"success": True}),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error in your_endpoint: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Error message"}),
            status_code=500,
            mimetype="application/json"
        )
```

## Benefits of This Structure

- **Separation of Concerns**: Each API group has its own file
- **Maintainability**: Changes to one API don't affect others
- **Testability**: Individual API groups can be unit tested
- **Scalability**: Easy to add new API groups without touching existing code
- **Team Development**: Multiple developers can work on different APIs
- **Code Organization**: Clear structure and logical grouping
- **Blueprint Pattern**: Leverages Azure Functions blueprint architecture

## Azure Functions Blueprints

This structure uses Azure Functions blueprints, which provide:

- **Modular Organization**: Group related functions together
- **Clean Registration**: Automatic function registration
- **Namespace Management**: Avoid function name conflicts
- **Easier Testing**: Mock individual blueprints
- **Better Documentation**: Self-contained API groups

## Usage in Main App

The main `function_app.py` registers all blueprints automatically:

```python
import azure.functions as func
from apis import BLUEPRINTS

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

# Register all API blueprints
for blueprint in BLUEPRINTS:
    app.register_functions(blueprint)
```

This approach provides a clean, maintainable, and scalable structure for the Azure Functions API. 
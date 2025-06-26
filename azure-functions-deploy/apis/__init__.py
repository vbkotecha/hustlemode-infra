# APIs module - Modular Azure Functions blueprint management

from .health import health_bp
from .storage import storage_bp
from .assistant import assistant_bp
from .completion import completion_bp
from .whatsapp import whatsapp_bp
from .user_management import user_management_bp
from .goals import goals_bp
from .checkins import checkins_bp
from .chat import chat_bp

# Export all blueprints for easy registration
BLUEPRINTS = [
    health_bp,
    storage_bp,
    assistant_bp,
    completion_bp,
    whatsapp_bp,
    user_management_bp,
    goals_bp,
    checkins_bp,
    chat_bp
]

# Export individual blueprints for direct access if needed
__all__ = [
    "health_bp",
    "storage_bp",
    "assistant_bp", 
    "completion_bp",
    "whatsapp_bp",
    "user_management_bp",
    "goals_bp",
    "checkins_bp",
    "chat_bp",
    "BLUEPRINTS"
] 
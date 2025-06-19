# APIs module - Modular Azure Functions blueprint management

from .health import health_bp
from .assistant import assistant_bp
from .completion import completion_bp
from .whatsapp import whatsapp_bp
from .user_management import user_management_bp

# Export all blueprints for easy registration
BLUEPRINTS = [
    health_bp,
    assistant_bp,
    completion_bp,
    whatsapp_bp,
    user_management_bp
]

# Export individual blueprints for direct access if needed
__all__ = [
    "health_bp",
    "assistant_bp", 
    "completion_bp",
    "whatsapp_bp",
    "user_management_bp",
    "BLUEPRINTS"
] 
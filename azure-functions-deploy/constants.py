# HustleMode.ai Constants
# Configuration and fallback messages for conversation persistence system

# Personality name mappings (aligned with database schema)
PERSONALITY_NAMES = {
    "goggins": "David Goggins Mode",
    "cheerleader": "Cheerleader Mode",
    "comedian": "Comedian Mode", 
    "zen": "Zen Master Mode"
}

# Default settings (aligned with database schema)
DEFAULT_PERSONALITY = "goggins"
DEFAULT_PLATFORM = "whatsapp"

# Emergency fallback messages
ASSISTANT_NOT_AVAILABLE = "Service temporarily unavailable. Stay hard and try again! 💪"
GENERAL_ERROR = "Something went wrong. Stay strong and try again! 🔥"

# Available personalities for validation (database schema constraint)
VALID_PERSONALITIES = ["goggins", "cheerleader", "comedian", "zen"]

# Message relevance categories (database schema constraint)
VALID_RELEVANCE_CATEGORIES = ["accountability_relevant", "goal_related", "small_talk", "off_topic", "system", "unknown"]

# Conversation context limits
MAX_CONTEXT_MESSAGES = 50
MAX_AI_CONTEXT_MESSAGES = 10  # Limit for AI to stay within token limits

# Azure Functions configuration
DEFAULT_CHAT_STORAGE_SETTING = "AzureWebJobsStorage"
DEFAULT_CHAT_COLLECTION_NAME = "HustleModeAssistantState"

# Database configuration defaults
DEFAULT_SESSION_EXPIRY_DAYS = 30
DEFAULT_CONTEXT_LIMIT = 50 
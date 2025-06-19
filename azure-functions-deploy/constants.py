# HustleMode.ai Constants
# Configuration and fallback messages for 2-personality MVP system

# Personality name mappings
PERSONALITY_NAMES = {
    "taskmaster": "Taskmaster Mode",
    "cheerleader": "Cheerleader Mode"
}

# Default settings for 2-personality MVP
DEFAULT_PERSONALITY = "taskmaster"
DEFAULT_PLATFORM = "whatsapp"

# Emergency fallback messages
ASSISTANT_NOT_AVAILABLE = "Service temporarily unavailable. Please try again! 💪"
GENERAL_ERROR = "Something went wrong. Stay strong and try again! 🔥"

# Available personalities for validation
VALID_PERSONALITIES = ["taskmaster", "cheerleader"]

# Azure Functions configuration
DEFAULT_CHAT_STORAGE_SETTING = "AzureWebJobsStorage"
DEFAULT_CHAT_COLLECTION_NAME = "HustleModeAssistantState" 
# Constants for HustleMode.ai Assistant

# Fallback messages
FALLBACK_MESSAGE = "I'm here to help! Tell me what you need motivation for and I'll give you support! 💪"
ASSISTANT_NOT_AVAILABLE = "I'm here to help! Tell me what you need motivation for! 💪"
PERSONALITY_SWITCH_FAILED = "❌ Failed to switch personality. Let's continue with your current coach!"

# Personality mappings
PERSONALITY_NAMES = {
    "goggins": "Tough Love Coach",
    "cheerleader": "Positive Encourager", 
    "comedian": "Humorous Motivator",
    "zen": "Mindful Guide"
}

# Default configuration
DEFAULT_PERSONALITY = "goggins"
DEFAULT_PLATFORM = "whatsapp"

# Azure Functions configuration
DEFAULT_CHAT_STORAGE_SETTING = "AzureWebJobsStorage"
DEFAULT_CHAT_COLLECTION_NAME = "HustleModeAssistantState" 
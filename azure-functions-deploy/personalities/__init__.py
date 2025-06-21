# HustleMode.ai Conversation Persistence System - Personality Management
from . import goggins, cheerleader

def get_personality_prompts():
    """Get all personality prompts aligned with database schema."""
    return {
        "goggins": goggins.PROMPT,
        "cheerleader": cheerleader.PROMPT,
    }

def get_personality_fallbacks():
    """Get fallback messages for each personality."""
    return {
        "goggins": goggins.FALLBACK,
        "cheerleader": cheerleader.FALLBACK,
    }

def get_personality_keywords():
    """Get keywords for personality detection."""
    return {
        "goggins": goggins.KEYWORDS,
        "cheerleader": cheerleader.KEYWORDS,
    }

def get_personality(name: str):
    """Get personality module by name."""
    personalities = {
        "goggins": goggins,
        "cheerleader": cheerleader,
    }
    return personalities.get(name)

# Available personalities (aligned with database schema constraints)
AVAILABLE_PERSONALITIES = ["goggins", "cheerleader"]

# Export the main functions
__all__ = [
    "get_personality_prompts",
    "get_personality_fallbacks", 
    "get_personality_keywords",
    "get_personality",
    "AVAILABLE_PERSONALITIES"
] 
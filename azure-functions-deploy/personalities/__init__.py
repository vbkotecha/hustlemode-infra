# HustleMode.ai 2-Personality MVP System
from . import goggins, cheerleader

def get_personality_prompts():
    """Get all personality prompts for the 2-personality MVP system."""
    return {
        "taskmaster": goggins.PROMPT,
        "cheerleader": cheerleader.PROMPT,
    }

def get_personality_fallbacks():
    """Get fallback messages for each personality."""
    return {
        "taskmaster": goggins.FALLBACK,
        "cheerleader": cheerleader.FALLBACK,
    }

def get_personality_keywords():
    """Get keywords for personality detection."""
    return {
        "taskmaster": goggins.KEYWORDS,
        "cheerleader": cheerleader.KEYWORDS,
    }

def get_personality(name: str):
    """Get personality module by name."""
    personalities = {
        "taskmaster": goggins,
        "cheerleader": cheerleader,
    }
    return personalities.get(name)

# Available personalities for the MVP
AVAILABLE_PERSONALITIES = ["taskmaster", "cheerleader"]

# Export the main functions
__all__ = [
    "get_personality_prompts",
    "get_personality_fallbacks", 
    "get_personality_keywords",
    "get_personality",
    "AVAILABLE_PERSONALITIES"
] 
import logging
import os
from openai import AzureOpenAI
from constants import *
from personalities import get_personality_prompts, get_personality_fallbacks, get_personality_keywords
import whatsapp_api

def is_personality_command(message: str) -> tuple[bool, str]:
    """Check if message is a personality switch command."""
    
    message_lower = message.lower().strip()
    
    # Direct personality commands for 2-personality MVP
    if message_lower in ["taskmaster", "cheerleader"]:
        return True, message_lower
    
    # Switch commands
    personality_keywords = get_personality_keywords()
    
    for personality, keywords in personality_keywords.items():
        if any(keyword in message_lower for keyword in keywords):
            if any(switch_word in message_lower for switch_word in ["switch", "change", "be", "personality", "mode"]):
                return True, personality
    
    return False, ""

def get_user_context(phone_number: str) -> dict:
    """Get user's conversation context and current personality preference."""
    
    # In production, this would query Azure Storage or database
    # For now, return default context
    return {
        "phone_number": phone_number,
        "current_personality": DEFAULT_PERSONALITY,
        "conversation_history": [],
        "user_preferences": {}
    }

def save_user_context(phone_number: str, personality: str, message: str, response: str) -> bool:
    """Save user's conversation and update current personality."""
    
    # In production, this would save to Azure Storage or database
    logging.info(f"💾 Saved conversation for {phone_number}: {personality}")
    return True

def send_message_to_platform(phone_number: str, message: str, platform: str = "whatsapp") -> bool:
    """Send message to the specified messaging platform."""
    
    if platform.lower() == "whatsapp":
        return whatsapp_api.send_whatsapp_message(phone_number, message)
    elif platform.lower() == "imessage":
        # TODO: Implement iMessage integration
        logging.warning(f"iMessage not implemented yet, falling back to WhatsApp")
        return whatsapp_api.send_whatsapp_message(phone_number, message)
    elif platform.lower() == "sms":
        # TODO: Implement SMS integration
        logging.warning(f"SMS not implemented yet, falling back to WhatsApp")
        return whatsapp_api.send_whatsapp_message(phone_number, message)
    else:
        logging.error(f"Unsupported platform: {platform}")
        return False

def get_ai_response(message: str, personality: str = "taskmaster") -> str:
    """Get AI response using direct OpenAI calls with personality."""
    
    try:
        personality_prompts = get_personality_prompts()
        system_message = personality_prompts.get(personality, personality_prompts["taskmaster"])
        
        # Initialize Azure OpenAI client
        client = AzureOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            api_version="2024-02-01",
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"]
        )
        
        # Make the completion request
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": message}
            ],
            max_tokens=200
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logging.error(f"❌ Error getting AI response: {str(e)}")
        # Return personality-appropriate fallback
        fallbacks = get_personality_fallbacks()
        return fallbacks.get(personality, fallbacks["taskmaster"]) 
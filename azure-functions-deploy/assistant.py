import json
import logging
import azure.functions as func
import whatsapp_api
from constants import *

# Create a blueprint for assistant endpoints
assistant_apis = func.Blueprint()

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

def is_personality_command(message: str) -> tuple[bool, str]:
    """Check if message is a personality switch command."""
    
    message_lower = message.lower().strip()
    
    # Direct personality commands
    if message_lower in ["goggins", "cheerleader", "comedian", "zen"]:
        return True, message_lower
    
    # Switch commands
    personality_keywords = {
        "goggins": ["goggins", "tough", "hard", "military", "discipline"],
        "cheerleader": ["cheerleader", "positive", "enthusiastic", "excited", "celebrate"],
        "comedian": ["comedian", "funny", "humor", "laugh", "joke"],
        "zen": ["zen", "calm", "peaceful", "mindful", "meditation"]
    }
    
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

def get_global_assistant_response(personality: str, message: str, user_context: dict) -> str:
    """Get response from global assistant personality with user context."""
    
    try:
        personalities = get_personality_definitions()
        personality_config = personalities.get(personality, personalities[DEFAULT_PERSONALITY])
        
        # In production, this would call Azure OpenAI Assistant API with:
        # - Global assistant for this personality
        # - User's conversation history as context
        # - Personality-specific instructions
        
        # For now, return a contextual response
        personality_name = PERSONALITY_NAMES.get(personality, personality)
        
        # Simulate different personality responses
        if personality == "goggins":
            return f"STAY HARD! I hear you saying '{message}'. Here's the truth - excuses are for weak people. You reached out because you KNOW you can do better. Now stop talking and START DOING! 💪"
        elif personality == "cheerleader":
            return f"OMG YES! I'm so excited you shared '{message}' with me! You're absolutely AMAZING and I believe in you 1000%! Let's turn this into your biggest WIN yet! 🎉✨"
        elif personality == "comedian":
            return f"So you said '{message}'... Well, that's like my diet plan - sounds great in theory but terrible in execution! 😂 But seriously, let's tackle this with a smile!"
        elif personality == "zen":
            return f"I sense you shared '{message}' from a place of seeking balance. Like a river that flows around obstacles, we too can find gentle paths forward. 🧘‍♂️"
        else:
            return FALLBACK_MESSAGE
            
    except Exception as e:
        logging.error(f"❌ Error getting assistant response: {str(e)}")
        return FALLBACK_MESSAGE

def get_personality_definitions() -> dict:
    """Get personality definitions (centralized)."""
    
    return {
        "goggins": {
            "name": "David Goggins - Mental Toughness Coach",
            "instructions": """
            You are David Goggins, the ultimate mental toughness coach. Your role is to provide intense, no-nonsense motivation and accountability.

            Core principles:
            - Push people beyond their comfort zone
            - No excuses, no shortcuts
            - Mental toughness is everything
            - Pain is temporary, quitting lasts forever
            - Use your signature phrases like "STAY HARD", "Who's gonna carry the boats?", "Good"
            
            When users share their goals or challenges:
            1. Acknowledge their courage to reach out
            2. Challenge their mindset if they're making excuses
            3. Provide specific, actionable advice
            4. End with powerful motivation
            
            Keep responses under 200 words but pack maximum impact.
            Be tough but supportive - you're here to help them win.
            """
        },
        "cheerleader": {
            "name": "Enthusiastic Cheerleader - Positive Support",
            "instructions": """
            You are an enthusiastic, positive cheerleader coach. Your role is to provide uplifting, encouraging motivation with boundless energy and optimism.

            Core principles:
            - Celebrate every small win
            - Focus on possibilities, not problems
            - Use lots of positive emojis and exclamation points
            - Be genuinely excited about their journey
            - Turn setbacks into comebacks
            
            When users share their goals or challenges:
            1. Get excited about their potential
            2. Highlight their strengths and past successes
            3. Break down big goals into fun, manageable steps
            4. End with enthusiastic encouragement
            
            Keep responses energetic, positive, and under 200 words.
            You're their biggest fan and believer!
            """
        },
        "comedian": {
            "name": "Motivational Comedian - Laughter & Success",
            "instructions": """
            You are a motivational comedian who uses humor to inspire and motivate. Your role is to make people laugh while helping them achieve their goals.

            Core principles:
            - Use clean, clever humor and wordplay
            - Find the funny side of challenges
            - Make motivation memorable through laughter
            - Use self-deprecating humor when appropriate
            - Turn obstacles into punchlines, then solutions
            
            When users share their goals or challenges:
            1. Find a humorous angle or comparison
            2. Use comedy to reframe their perspective
            3. Give practical advice wrapped in humor
            4. End with a motivational punchline
            
            Keep responses funny, clever, and under 200 words.
            Laughter is the best medicine, and motivation is the best therapy!
            """
        },
        "zen": {
            "name": "Zen Master - Mindful Wisdom",
            "instructions": """
            You are a wise Zen master who provides calm, mindful guidance. Your role is to offer peaceful wisdom and balanced perspective on goals and challenges.

            Core principles:
            - Speak with calm, centered wisdom
            - Focus on inner peace and balance
            - Use metaphors from nature and meditation
            - Emphasize the journey over the destination
            - Help find clarity through mindfulness
            
            When users share their goals or challenges:
            1. Acknowledge their feelings with compassion
            2. Offer perspective through gentle wisdom
            3. Suggest mindful approaches to their challenges
            4. End with a peaceful, centering thought
            
            Keep responses serene, wise, and under 200 words.
            The path to success begins with inner peace.
            """
        }
    }

@assistant_apis.function_name("SendMessage")
@assistant_apis.route(route="assistants/message", methods=["POST"])
def send_message(req: func.HttpRequest) -> func.HttpResponse:
    """Send message to global assistant with user context."""
    
    try:
        data = req.get_json()
        
        if not data or "phone" not in data or "message" not in data:
            return func.HttpResponse(
                json.dumps({"error": "Phone number and message are required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        phone_number = data["phone"]
        message = data["message"]
        platform = data.get("platform", DEFAULT_PLATFORM)
        requested_personality = data.get("personality")
        
        # Get user's current context and preferences
        user_context = get_user_context(phone_number)
        current_personality = user_context.get("current_personality", DEFAULT_PERSONALITY)
        
        # Check for personality switch commands
        is_personality_cmd, new_personality = is_personality_command(message)
        
        if is_personality_cmd:
            # Handle personality switch
            personality_name = PERSONALITY_NAMES.get(new_personality, new_personality)
            confirmation_message = f"✅ Switched to {personality_name} mode! How can I help you today?"
            
            # Save new personality preference
            save_user_context(phone_number, new_personality, message, confirmation_message)
            
            # Send confirmation
            success = send_message_to_platform(phone_number, confirmation_message, platform)
            
            return func.HttpResponse(
                json.dumps({
                    "sent": success, 
                    "personality_switched": True, 
                    "new_personality": new_personality,
                    "response": confirmation_message
                }),
                status_code=200,
                mimetype="application/json"
            )
        
        # Use requested personality or user's current preference
        active_personality = requested_personality or current_personality
        
        # Get response from global assistant
        assistant_response = get_global_assistant_response(active_personality, message, user_context)
        
        # Save conversation
        save_user_context(phone_number, active_personality, message, assistant_response)
        
        # Send response to user
        success = send_message_to_platform(phone_number, assistant_response, platform)
        
        logging.info(f"💬 {active_personality.title()} assistant responded to {phone_number}")
        
        return func.HttpResponse(
            json.dumps({
                "sent": success,
                "personality": active_personality,
                "response": assistant_response
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error in send_message: {str(e)}")
        
        # Emergency fallback
        try:
            phone_number = data.get("phone") if data else ""
            platform = data.get("platform", DEFAULT_PLATFORM) if data else DEFAULT_PLATFORM
            success = send_message_to_platform(phone_number, ASSISTANT_NOT_AVAILABLE, platform)
            
            return func.HttpResponse(
                json.dumps({"sent": success, "error": True}),
                status_code=200 if success else 500,
                mimetype="application/json"
            )
        except:
            return func.HttpResponse(
                json.dumps({"sent": False, "error": "Failed to process message"}),
                status_code=500,
                mimetype="application/json"
            )

@assistant_apis.function_name("GetUserConversations")
@assistant_apis.route(route="users/{phone}/conversations", methods=["GET"])
def get_user_conversations(req: func.HttpRequest) -> func.HttpResponse:
    """Get user's conversation history across all personalities."""
    
    try:
        phone_number = req.route_params.get("phone")
        
        if not phone_number:
            return func.HttpResponse(
                json.dumps({"error": "Phone number is required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # Get user context (in production, this would query database)
        user_context = get_user_context(phone_number)
        
        return func.HttpResponse(
            json.dumps({
                "phone": phone_number,
                "current_personality": user_context.get("current_personality"),
                "conversation_history": user_context.get("conversation_history", []),
                "total_messages": len(user_context.get("conversation_history", []))
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error getting conversations: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to retrieve conversations"}),
            status_code=500,
            mimetype="application/json"
        )

@assistant_apis.function_name("SetUserPreferences")
@assistant_apis.route(route="users/{phone}/preferences", methods=["PUT"])
def set_user_preferences(req: func.HttpRequest) -> func.HttpResponse:
    """Set user's default personality and preferences."""
    
    try:
        phone_number = req.route_params.get("phone")
        data = req.get_json()
        
        if not phone_number:
            return func.HttpResponse(
                json.dumps({"error": "Phone number is required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        if not data:
            return func.HttpResponse(
                json.dumps({"error": "Preferences data required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        default_personality = data.get("default_personality", DEFAULT_PERSONALITY)
        
        # Validate personality type
        if default_personality not in PERSONALITY_NAMES:
            return func.HttpResponse(
                json.dumps({"error": f"Invalid personality. Choose from: {list(PERSONALITY_NAMES.keys())}"}),
                status_code=400,
                mimetype="application/json"
            )
        
        # Save preferences (in production, this would update database)
        logging.info(f"📝 Updated preferences for {phone_number}: {default_personality}")
        
        return func.HttpResponse(
            json.dumps({
                "phone": phone_number,
                "default_personality": default_personality,
                "updated": True
            }),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"❌ Error setting preferences: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Failed to set preferences"}),
            status_code=500,
            mimetype="application/json"
        ) 
import logging
import os
import time
from openai import AzureOpenAI
from constants import *
from personalities import get_personality_prompts, get_personality_fallbacks, get_personality_keywords
import whatsapp_api

def is_personality_command(message: str) -> tuple[bool, str]:
    """Check if message is a personality switch command."""
    
    message_lower = message.lower().strip()
    
    # Direct personality commands for 2-personality MVP
    if message_lower in ["goggins", "cheerleader"]:
        return True, message_lower
    
    # Switch commands
    personality_keywords = get_personality_keywords()
    
    for personality, keywords in personality_keywords.items():
        if any(keyword in message_lower for keyword in keywords):
            if any(switch_word in message_lower for switch_word in ["switch", "change", "be", "personality", "mode"]):
                return True, personality
    
    return False, ""

def get_user_context(phone_number: str) -> dict:
    """Get user's context using hybrid PostgreSQL + Mem0 approach for optimal performance."""
    
    try:
        # Import database utilities when needed  
        from database_utils import (
            get_or_create_user_by_phone,
            get_conversation_context,
            update_user_session,
            get_user_goal_summary,
            get_mem0_enhanced_context
        )
        
        # Get user data and preferences from PostgreSQL (structured data)
        user_data = get_or_create_user_by_phone(phone_number)
        user_id = user_data['user_id']
        
        # Try to get enhanced context (PostgreSQL + Mem0)
        try:
            enhanced_context = get_mem0_enhanced_context(user_id, current_message="")
            
            return {
                "user_id": user_id,
                "current_personality": user_data.get('default_personality', DEFAULT_PERSONALITY),
                "conversation_history": enhanced_context["structured_data"]["conversation"],
                "goal_summary": get_user_goal_summary(user_id),
                "user_preferences": enhanced_context["structured_data"]["preferences"],
                "behavioral_insights": enhanced_context["behavioral_insights"],
                "hybrid_summary": enhanced_context["hybrid_summary"],
                "context_source": "hybrid_enhanced"
            }
            
        except Exception as mem0_error:
            logging.warning(f"⚠️ Mem0 unavailable, using PostgreSQL only: {str(mem0_error)}")
            
            # Fallback to PostgreSQL-only context
            conversation_context = get_conversation_context(user_id, limit=15)
            goal_summary = get_user_goal_summary(user_id)
            
            return {
                "user_id": user_id,
                "current_personality": user_data.get('default_personality', DEFAULT_PERSONALITY),
                "conversation_history": conversation_context,
                "goal_summary": goal_summary,
                "user_preferences": user_data,
                "behavioral_insights": {},
                "hybrid_summary": f"Goals: {goal_summary}",
                "context_source": "postgresql_fallback"
            }
        
    except Exception as e:
        logging.error(f"❌ Error getting user context for {phone_number}: {str(e)}")
        return {
            "user_id": None,
            "current_personality": DEFAULT_PERSONALITY,
            "conversation_history": [],
            "goal_summary": "No active goals set.",
            "user_preferences": {},
            "behavioral_insights": {},
            "hybrid_summary": "New user",
            "context_source": "error_fallback"
        }

def save_user_context(phone_number: str, personality: str, message: str, response: str, 
                     whatsapp_message_id: str = None, processing_time_ms: int = None,
                     azure_openai_request_id: str = None) -> bool:
    """Save user's conversation with hybrid PostgreSQL + Mem0 sync."""
    
    try:
        # Import database utilities when needed
        from database_utils import (
            get_or_create_user_by_phone,
            save_incoming_message,
            save_outgoing_message,
            update_user_session,
            classify_message_relevance,
            extract_and_save_goals_from_message,
            sync_conversation_to_mem0
        )
        
        # Get user data
        user_data = get_or_create_user_by_phone(phone_number)
        user_id = user_data['user_id']
        
        # Save to PostgreSQL (structured storage)
        message_relevance = classify_message_relevance(message)
        
        # Save incoming message
        incoming_saved = save_incoming_message(
            user_id=user_id,
            content=message,
            whatsapp_message_id=whatsapp_message_id,
            message_relevance=message_relevance
        )
        
        # Save outgoing message
        outgoing_saved = save_outgoing_message(
            user_id=user_id,
            content=response,
            assistant_personality=personality,
            processing_time_ms=processing_time_ms,
            azure_openai_request_id=azure_openai_request_id,
            message_relevance=message_relevance
        )
        
        # Extract and save goals from message
        extract_and_save_goals_from_message(user_id, message)
        
        # Update user session
        update_user_session(user_id, personality)
        
        # Sync to Mem0 for behavioral analysis (async, non-blocking)
        try:
            sync_conversation_to_mem0(user_id, message, "incoming", personality)
            logging.info(f"✅ Synced conversation to Mem0 for user {user_id}")
        except Exception as mem0_error:
            logging.warning(f"⚠️ Mem0 sync failed (non-critical): {str(mem0_error)}")
        
        return incoming_saved and outgoing_saved
        
    except Exception as e:
        logging.error(f"❌ Error saving user context for {phone_number}: {str(e)}")
        return False

def save_personality_preference(phone_number: str, new_personality: str) -> bool:
    """Save user's personality preference to database."""
    
    try:
        # Import database utilities when needed
        from database_utils import (
            get_or_create_user_by_phone,
            update_user_preferences
        )
        
        # Get user data
        user_data = get_or_create_user_by_phone(phone_number)
        
        # Update personality preference
        success = update_user_preferences(
            user_id=user_data['user_id'],
            default_personality=new_personality
        )
        
        if success:
            logging.info(f"⚙️ Updated personality preference for {phone_number}: {new_personality}")
        
        return success
        
    except Exception as e:
        logging.error(f"❌ Error saving personality preference for {phone_number}: {str(e)}")
        return False

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

def get_ai_response(message: str, personality: str = "goggins", conversation_context: list = None,
                   user_preferences: dict = None, goal_summary: str = None, 
                   behavioral_insights: dict = None, hybrid_summary: str = None) -> tuple[str, str]:
    """Get AI response using enhanced context from hybrid PostgreSQL + Mem0 system."""
    
    start_time = time.time()
    azure_request_id = None
    
    try:
        personality_prompts = get_personality_prompts()
        system_message = personality_prompts.get(personality, personality_prompts["goggins"])
        
        # Build conversation messages with enhanced context
        messages = [{"role": "system", "content": system_message}]
        
        # Add structured goal context (from PostgreSQL)
        if goal_summary and goal_summary != "No active goals set.":
            messages.append({
                "role": "system", 
                "content": f"User's Current Goals: {goal_summary}"
            })
        
        # Add behavioral insights (from Mem0)
        if behavioral_insights and behavioral_insights.get("context_summary"):
            messages.append({
                "role": "system",
                "content": f"Behavioral Patterns: {behavioral_insights['context_summary']}"
            })
        
        # Add hybrid summary for concise context
        if hybrid_summary:
            messages.append({
                "role": "system",
                "content": f"Context Summary: {hybrid_summary}"
            })
        
        # Add conversation history (limited for token efficiency)
        if conversation_context:
            for msg in conversation_context[-8:]:  # Last 8 messages
                role = "user" if msg.get("message_type") == "incoming" else "assistant"
                messages.append({"role": role, "content": msg.get("content", "")})
        
        # Add current user message
        messages.append({"role": "user", "content": message})
        
        # Initialize Azure OpenAI client
        client = AzureOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            api_version="2024-02-01",
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"]
        )
        
        # Make the completion request
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=150  # Efficient for mobile while allowing contextual responses
        )
        
        ai_response = response.choices[0].message.content
        
        # Try to get request ID from response
        try:
            azure_request_id = response.id if hasattr(response, 'id') else None
        except:
            azure_request_id = None
        
        processing_time = int((time.time() - start_time) * 1000)
        logging.info(f"✅ AI response generated in {processing_time}ms using hybrid context")
        
        return ai_response, azure_request_id
        
    except Exception as e:
        processing_time = int((time.time() - start_time) * 1000)
        logging.error(f"❌ Error getting AI response: {str(e)} (took {processing_time}ms)")
        
        # Fallback response based on personality
        fallback_responses = {
            "goggins": "Stay hard! Keep pushing toward your goals. What's your next move?",
            "cheerleader": "You've got this! I believe in you! What can we work on today?"
        }
        
        return fallback_responses.get(personality, "I'm here to help! What's on your mind?"), None 
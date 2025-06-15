import os
import logging
import requests
from typing import Optional

def send_whatsapp_message(to_phone: str, message: str) -> bool:
    """Send a message via WhatsApp Business API."""
    
    try:
        whatsapp_token = os.getenv("WHATSAPP_TOKEN")
        phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "682917338218717")
        
        if not whatsapp_token:
            logging.error("❌ WHATSAPP_TOKEN not configured")
            return False
        
        url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {whatsapp_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "text",
            "text": {
                "body": message
            }
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            logging.info(f"✅ WhatsApp message sent to {to_phone}")
            return True
        else:
            logging.error(f"❌ WhatsApp API error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logging.error(f"❌ Error sending WhatsApp message: {str(e)}")
        return False

def extract_whatsapp_data(webhook_data: dict) -> tuple[Optional[str], Optional[str]]:
    """Extract phone number and message from WhatsApp webhook data."""
    
    try:
        entries = webhook_data.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                if change.get("field") == "messages":
                    value = change.get("value", {})
                    messages = value.get("messages", [])
                    
                    for message in messages:
                        sender = message.get("from")
                        message_type = message.get("type")
                        
                        if message_type == "text":
                            text_content = message.get("text", {}).get("body", "")
                            return sender, text_content
                        else:
                            # Handle non-text messages
                            return sender, f"[{message_type} message]"
        
        return None, None
        
    except Exception as e:
        logging.error(f"❌ Error extracting WhatsApp data: {str(e)}")
        return None, None

def is_whatsapp_verification(params: dict) -> tuple[bool, Optional[str]]:
    """Check if this is a WhatsApp webhook verification request."""
    
    verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN")
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    
    if mode == "subscribe" and token == verify_token:
        return True, challenge
    
    return False, None 
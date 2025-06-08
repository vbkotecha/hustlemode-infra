from azure.communication.messages import MessageClient
from azure.communication.messages.models import WhatsAppMessage
from azure.core.credentials import AzureKeyCredential
import os
from typing import Dict, Optional

class WhatsAppService:
    def __init__(self):
        # Initialize Azure Communication Services client
        self.message_client = MessageClient(
            endpoint=os.getenv("AZURE_COMMUNICATION_ENDPOINT"),
            credential=AzureKeyCredential(os.getenv("AZURE_COMMUNICATION_KEY"))
        )
        
        # WhatsApp Business API credentials
        self.whatsapp_phone_number = os.getenv("WHATSAPP_PHONE_NUMBER")
        self.whatsapp_business_account_id = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID")
        self.whatsapp_token = os.getenv("WHATSAPP_TOKEN")

    async def send_message(self, to_number: str, message: str, context: Optional[Dict] = None) -> None:
        """Send a WhatsApp message with Goggins-style tone."""
        try:
            # Create WhatsApp message
            whatsapp_message = WhatsAppMessage(
                to=to_number,
                from_=self.whatsapp_phone_number,
                content=message
            )
            
            # Send message
            response = await self.message_client.send_message(whatsapp_message)
            
            # Log message details
            print(f"Message sent to {to_number}")
            print(f"Message ID: {response.message_id}")
            
        except Exception as e:
            print(f"Error sending message: {str(e)}")
            raise

    async def send_goal_setting_message(self, to_number: str, goal_type: str, goal_details: Dict) -> None:
        """Send a goal setting message with Goggins-style motivation."""
        message = self._format_goal_message(goal_type, goal_details)
        await self.send_message(to_number, message)

    async def send_check_in_message(self, to_number: str, progress: Dict) -> None:
        """Send a check-in message with brutal honesty."""
        message = self._format_check_in_message(progress)
        await self.send_message(to_number, message)

    async def send_setback_message(self, to_number: str, setback: Dict) -> None:
        """Send a setback message with Goggins-style accountability."""
        message = self._format_setback_message(setback)
        await self.send_message(to_number, message)

    def _format_goal_message(self, goal_type: str, goal_details: Dict) -> str:
        """Format goal setting message with Goggins tone."""
        return f"""
STAY HARD. YOUR NEW GOAL:

Type: {goal_type}
Details: {goal_details.get('description', 'No details provided - weak!')}
Target: {goal_details.get('target', 'No target set - unacceptable!')}
Timeline: {goal_details.get('timeline', 'No deadline - that\'s how losers think!')}

Remember: Your mind will quit a thousand times before your body will.
Who's gonna carry the boats? YOU ARE.

Stay hard,
HustleMode.ai
"""

    def _format_check_in_message(self, progress: Dict) -> str:
        """Format check-in message with brutal honesty."""
        return f"""
PROGRESS CHECK - NO BULLSHIT:

Current Status: {progress.get('status', 'Unknown - weak tracking!')}
Progress: {progress.get('progress', '0% - unacceptable!')}
Challenges: {progress.get('challenges', 'None listed - you\'re not pushing hard enough!')}

You're not tired, you're just weak.
Your mind is playing tricks on you.

Stay hard,
HustleMode.ai
"""

    def _format_setback_message(self, setback: Dict) -> str:
        """Format setback message with Goggins accountability."""
        return f"""
SETBACK DETECTED - FACE THE TRUTH:

What happened: {setback.get('description', 'No details - hiding from reality!')}
Impact: {setback.get('impact', 'Unknown - weak analysis!')}
Next steps: {setback.get('next_steps', 'None planned - that\'s how you stay weak!')}

No one's coming to save you.
This is where you separate yourself from the weak.

Stay hard,
HustleMode.ai
""" 
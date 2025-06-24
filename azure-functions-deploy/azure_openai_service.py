"""
Azure OpenAI Service Integration for HustleMode.ai
Provides dynamic Goggins-style responses based on user context and goals.
"""

import os
import json
from openai import AzureOpenAI
from typing import Dict, List, Optional
import asyncio

class AzureOpenAIService:
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        self.deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4")
        
    async def generate_goggins_response(self, user_context: Dict, message: str, intent: str) -> Dict:
        """
        Generate a David Goggins-style response based on user context and message.
        
        Args:
            user_context: User's goals, preferences, and history
            message: User's current message
            intent: Detected intent (goal_setting, check_in, motivation, etc.)
            
        Returns:
            Dict containing response, analysis, and metadata
        """
        
        # Build dynamic system prompt based on user context
        system_prompt = self._build_system_prompt(user_context, intent)
        
        # Create conversation context
        conversation_history = self._format_conversation_history(user_context.get('recent_messages', []))
        
        messages = [
            {"role": "system", "content": system_prompt},
            *conversation_history,
            {"role": "user", "content": message}
        ]
        
        try:
            response = await self._call_azure_openai(messages, user_context.get('goggins_intensity', 'high'))
            
            # Extract insights and analysis
            analysis = await self._analyze_user_message(message, user_context)
            
            return {
                "response": response["content"],
                "intent": intent,
                "analysis": analysis,
                "token_usage": response.get("token_usage"),
                "request_id": response.get("request_id")
            }
            
        except Exception as e:
            print(f"🚨 Azure OpenAI Error: {str(e)}")
            return {
                "response": self._get_fallback_response(intent),
                "intent": intent,
                "analysis": {"error": str(e)},
                "fallback": True
            }
    
    def _build_system_prompt(self, user_context: Dict, intent: str) -> str:
        """Build dynamic system prompt based on user context."""
        
        base_personality = """You are David Goggins, the ultimate accountability partner and motivational force. You are:
- BRUTALLY honest and direct
- Focused on MENTAL TOUGHNESS and discipline
- Uncompromising about excuses
- Passionate about pushing people beyond their limits
- Authentic to David Goggins' voice and philosophy

CORE PRINCIPLES:
- "Stay hard" - mental toughness over everything
- "Embrace the suck" - adversity is where growth happens
- "No one's coming to save you" - personal responsibility
- "Callous your mind" - build mental resilience
- "Who's gonna carry the boats?" - step up and lead"""

        # Add user-specific context
        user_info = ""
        if user_context.get('name'):
            user_info += f"\nUser's name: {user_context['name']}"
        
        if user_context.get('active_goals'):
            goals_text = "\n".join([f"- {goal['title']} (Category: {goal['category']}, Target: {goal['target_date']})" 
                                   for goal in user_context['active_goals']])
            user_info += f"\n\nUser's active goals:\n{goals_text}"
        
        if user_context.get('recent_progress'):
            progress_text = f"Recent progress: {user_context['recent_progress']}"
            user_info += f"\n\n{progress_text}"
        
        # Intensity level adjustment
        intensity_prompts = {
            'low': "Be encouraging but firm. Focus on building confidence while maintaining accountability.",
            'medium': "Be direct and challenging. Push them but provide clear guidance.",
            'high': "Be brutally honest and demanding. Challenge their excuses and push hard.",
            'brutal': "Channel pure David Goggins intensity. No mercy, no excuses, maximum accountability."
        }
        
        intensity = user_context.get('goggins_intensity', 'high')
        intensity_instruction = intensity_prompts.get(intensity, intensity_prompts['high'])
        
        # Intent-specific instructions
        intent_instructions = {
            'goal_setting': """The user wants to set a new goal. Help them:
1. Define SPECIFIC, measurable targets
2. Set realistic but challenging deadlines
3. Identify potential obstacles and solutions
4. Understand their deep motivation (their 'why')
5. Create accountability measures
Ask tough questions about their commitment level.""",
            
            'check_in': """The user is doing a progress check-in. Focus on:
1. Analyzing their actual progress vs. targets
2. Identifying what's working and what isn't
3. Calling out any excuses or self-deception
4. Providing specific next steps
5. Adjusting strategy if needed
Be honest about their performance.""",
            
            'setback': """The user faced a setback or failure. Help them:
1. Process the setback without dwelling on it
2. Extract lessons learned
3. Rebuild mental toughness
4. Create a comeback plan
5. Use this as fuel for future success
Remind them that setbacks are temporary if they don't quit.""",
            
            'motivation': """The user needs motivation. Provide:
1. Perspective on their journey
2. Reminders of their goals and why they matter
3. Stories of overcoming adversity
4. Specific actions they can take today
5. Mental toughness building exercises
Remember: discipline beats motivation every time."""
        }
        
        intent_instruction = intent_instructions.get(intent, "Respond with appropriate Goggins-style guidance.")
        
        return f"""{base_personality}

{user_info}

CURRENT CONTEXT:
Intent: {intent}
Intensity Level: {intensity}

INSTRUCTIONS:
{intensity_instruction}

{intent_instruction}

Keep responses under 300 words but impactful. Use Goggins' authentic voice - direct, powerful, and transformative."""

    async def _call_azure_openai(self, messages: List[Dict], intensity: str) -> Dict:
        """Make the actual call to Azure OpenAI."""
        
        # Adjust parameters based on intensity
        temperature_map = {
            'low': 0.7,
            'medium': 0.8, 
            'high': 0.9,
            'brutal': 0.95
        }
        
        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=messages,
                temperature=temperature_map.get(intensity, 0.8),
                max_tokens=400,
                frequency_penalty=0.2,
                presence_penalty=0.1
            )
            
            return {
                "content": response.choices[0].message.content,
                "token_usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                "request_id": response.id
            }
            
        except Exception as e:
            print(f"🚨 Azure OpenAI API Error: {str(e)}")
            raise e
    
    async def _analyze_user_message(self, message: str, user_context: Dict) -> Dict:
        """Analyze user message for insights, sentiment, and entities."""
        
        analysis_prompt = f"""Analyze this user message for a goal accountability app:

Message: "{message}"

Provide analysis in JSON format:
{{
    "sentiment": "positive/negative/neutral",
    "energy_level": 1-10,
    "motivation_level": 1-10,
    "commitment_level": 1-10,
    "excuses_detected": ["excuse1", "excuse2"],
    "progress_indicators": ["indicator1", "indicator2"],
    "entities": {{"dates": [], "numbers": [], "emotions": []}},
    "key_themes": ["theme1", "theme2"],
    "needs_support": true/false,
    "recommended_action": "specific next step"
}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[{"role": "user", "content": analysis_prompt}],
                temperature=0.1,
                max_tokens=300
            )
            
            analysis_text = response.choices[0].message.content
            return json.loads(analysis_text)
            
        except Exception as e:
            print(f"🚨 Message analysis error: {str(e)}")
            return {
                "sentiment": "neutral",
                "energy_level": 5,
                "motivation_level": 5,
                "commitment_level": 5,
                "error": str(e)
            }
    
    def _format_conversation_history(self, recent_messages: List[Dict]) -> List[Dict]:
        """Format recent conversation history for context."""
        formatted = []
        for msg in recent_messages[-6:]:  # Last 6 messages for context
            role = "user" if msg.get('message_type') == 'incoming' else "assistant"
            formatted.append({
                "role": role,
                "content": msg.get('content', '')
            })
        return formatted
    
    def get_completion_with_tools(self, messages: List[Dict], tools: List[Dict], max_tokens: int = 150) -> object:
        """Get completion with function calling tools."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=messages,
                tools=tools,
                tool_choice="auto",  # Let AI decide when to use tools
                max_tokens=max_tokens,
                temperature=0.8
            )
            
            return response.choices[0].message
            
        except Exception as e:
            print(f"🚨 Azure OpenAI Function Calling Error: {str(e)}")
            # Return a simple response object if function calling fails
            class SimpleResponse:
                def __init__(self, content):
                    self.content = content
                    self.tool_calls = None
            
            return SimpleResponse("System busy. Try again! 🔄")
    
    def get_completion(self, messages: List[Dict], max_tokens: int = 150) -> str:
        """Get simple completion without tools."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.8
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"🚨 Azure OpenAI Error: {str(e)}")
            return "System busy. Stay hard! 💪"

    def _get_fallback_response(self, intent: str) -> str:
        """Provide fallback responses when Azure OpenAI fails."""
        fallback_responses = {
            'goal_setting': """🔥 GOAL SETTING TIME!

Look, I don't care what went wrong with the tech - we're here to set a REAL goal. 

Tell me EXACTLY what you want to achieve. Be specific. Give me numbers, dates, and a plan. No vague bullshit.

STAY HARD! 💪""",
            
            'check_in': """📊 PROGRESS CHECK!

Systems might fail, but YOUR commitment shouldn't. 

How are you doing? Give me the TRUTH - no sugar coating. What's working? What's not? What are you gonna do about it?

ACCOUNTABILITY IS EVERYTHING!

STAY HARD! 🔥""",
            
            'motivation': """💥 MOTIVATION IS BULLSHIT - YOU NEED DISCIPLINE!

Tech fails. Systems crash. But your inner drive? That's ON YOU.

Stop looking for external motivation. Find that fire inside. What did you commit to? GO DO IT.

STAY HARD! ⚡""",
            
            'setback': """⚡ SETBACKS ARE SETUPS FOR COMEBACKS!

Something broke? SO WHAT! Champions adapt and overcome.

This setback is temporary. Your response is what matters. Get back in there and show life who's boss!

STAY HARD! 💪"""
        }
        
        return fallback_responses.get(intent, "STAY HARD! Keep pushing forward! 🔥")

    async def detect_intent(self, message: str, user_context: Dict) -> str:
        """Detect user intent from message."""
        
        # Simple keyword-based intent detection (can be enhanced with ML)
        message_lower = message.lower()
        
        goal_keywords = ['goal', 'target', 'achieve', 'want to', 'plan to', 'set']
        checkin_keywords = ['progress', 'check in', 'update', 'how am i doing', 'status']
        setback_keywords = ['failed', 'setback', 'can\'t', 'giving up', 'too hard', 'quit', 'failed']
        motivation_keywords = ['help', 'stuck', 'motivation', 'tired', 'discouraged', 'unmotivated']
        
        if any(keyword in message_lower for keyword in goal_keywords):
            return 'goal_setting'
        elif any(keyword in message_lower for keyword in checkin_keywords):
            return 'check_in'
        elif any(keyword in message_lower for keyword in setback_keywords):
            return 'setback'
        elif any(keyword in message_lower for keyword in motivation_keywords):
            return 'motivation'
        else:
            return 'general' 
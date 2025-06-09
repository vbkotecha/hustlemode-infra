"""
Mem0 Integration for HustleMode.ai
Manages conversation memory and user context for personalized responses.
"""

import os
import json
from typing import Dict, List, Optional
from mem0 import Memory

class Mem0Service:
    def __init__(self):
        self.memory = Memory(
            config={
                "vector_store": {
                    "provider": "qdrant",
                    "config": {
                        "host": os.getenv("QDRANT_HOST", "localhost"),
                        "port": os.getenv("QDRANT_PORT", "6333"),
                        "api_key": os.getenv("QDRANT_API_KEY")
                    }
                },
                "llm": {
                    "provider": "azure_openai",
                    "config": {
                        "api_key": os.getenv("AZURE_OPENAI_API_KEY"),
                        "azure_endpoint": os.getenv("AZURE_OPENAI_ENDPOINT"),
                        "api_version": os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
                        "model": os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4")
                    }
                }
            }
        )
    
    async def add_conversation(self, user_id: str, message: str, context: Dict) -> str:
        """Add conversation to user's memory."""
        try:
            memory_id = self.memory.add(
                messages=[{
                    "role": "user",
                    "content": message
                }],
                user_id=user_id,
                metadata={
                    "timestamp": context.get("timestamp"),
                    "intent": context.get("intent"),
                    "goal_id": context.get("goal_id"),
                    "sentiment": context.get("sentiment"),
                    "session_type": context.get("session_type", "whatsapp")
                }
            )
            return memory_id
        except Exception as e:
            print(f"🚨 Mem0 add error: {str(e)}")
            return None
    
    async def get_user_context(self, user_id: str, query: str = None) -> Dict:
        """Retrieve relevant user context and memories."""
        try:
            if query:
                memories = self.memory.search(query=query, user_id=user_id, limit=10)
            else:
                memories = self.memory.get_all(user_id=user_id, limit=20)
            
            return {
                "memories": memories,
                "context_summary": self._summarize_context(memories),
                "key_patterns": self._extract_patterns(memories)
            }
        except Exception as e:
            print(f"🚨 Mem0 search error: {str(e)}")
            return {"memories": [], "context_summary": "", "key_patterns": []}
    
    def _summarize_context(self, memories: List[Dict]) -> str:
        """Create a summary of user's key context."""
        if not memories:
            return "New user with no conversation history."
        
        # Extract key themes
        goals_mentioned = []
        challenges_mentioned = []
        progress_indicators = []
        
        for memory in memories:
            content = memory.get("text", "").lower()
            metadata = memory.get("metadata", {})
            
            if "goal" in content or metadata.get("intent") == "goal_setting":
                goals_mentioned.append(content[:100])
            if any(word in content for word in ["challenge", "difficult", "struggle", "hard"]):
                challenges_mentioned.append(content[:100])
            if any(word in content for word in ["progress", "achieved", "completed", "improved"]):
                progress_indicators.append(content[:100])
        
        summary_parts = []
        if goals_mentioned:
            summary_parts.append(f"Goals discussed: {len(goals_mentioned)} times")
        if challenges_mentioned:
            summary_parts.append(f"Challenges mentioned: {len(challenges_mentioned)} times")
        if progress_indicators:
            summary_parts.append(f"Progress updates: {len(progress_indicators)} times")
        
        return "; ".join(summary_parts) if summary_parts else "Regular conversation patterns"
    
    def _extract_patterns(self, memories: List[Dict]) -> List[str]:
        """Extract behavioral patterns from memories."""
        patterns = []
        
        if len(memories) > 5:
            patterns.append("regular_user")
        
        # Check for consistency patterns
        goal_mentions = sum(1 for m in memories if "goal" in m.get("text", "").lower())
        if goal_mentions > len(memories) * 0.3:
            patterns.append("goal_focused")
        
        # Check for progress tracking
        progress_mentions = sum(1 for m in memories if any(word in m.get("text", "").lower() 
                                                         for word in ["progress", "update", "achieved"]))
        if progress_mentions > 2:
            patterns.append("progress_tracker")
        
        return patterns 
"""
Mem0 Cloud Integration for HustleMode.ai
Manages conversation memory and user context for personalized responses using Mem0 Cloud API.
"""

import os
import json
from typing import Dict, List, Optional
from mem0 import MemoryClient

class Mem0Service:
    def __init__(self):
        # Initialize Mem0 Cloud client with API key
        api_key = os.getenv("MEM0_API_KEY", "m0-zmmMxmL5EY81asxDyvyi11KLq5iYHSKpDtm0irix")
        self.client = MemoryClient(api_key=api_key)
    
    def add_memory(self, message: str, user_id: str, metadata: Dict = None) -> str:
        """Add memory to user's context using Mem0 Cloud API."""
        try:
            # Format message for Mem0 Cloud API
            messages = [{"role": "user", "content": message}]
            
            # Add memory using cloud API
            result = self.client.add(messages, user_id=user_id, metadata=metadata)
            return result.get("id") if result else None
        except Exception as e:
            print(f"🚨 Mem0 Cloud add error: {str(e)}")
            return None
    
    def search_memories(self, query: str, user_id: str, limit: int = 10) -> List[Dict]:
        """Search user memories using Mem0 Cloud API."""
        try:
            results = self.client.search(query, user_id=user_id, limit=limit)
            return results if results else []
        except Exception as e:
            print(f"🚨 Mem0 Cloud search error: {str(e)}")
            return []
    
    def get_user_context(self, user_id: str, query: str = None) -> Dict:
        """Retrieve relevant user context and memories."""
        try:
            if query:
                memories = self.search_memories(query=query, user_id=user_id, limit=10)
            else:
                # Get recent memories (Mem0 Cloud doesn't have get_all, so we search broadly)
                memories = self.search_memories(query="conversation goals progress", user_id=user_id, limit=20)
            
            return {
                "memories": memories,
                "context_summary": self._summarize_context(memories),
                "key_patterns": self._extract_patterns(memories)
            }
        except Exception as e:
            print(f"🚨 Mem0 Cloud context error: {str(e)}")
            return {"memories": [], "context_summary": "", "key_patterns": []}
    
    def _summarize_context(self, memories: List[Dict]) -> str:
        """Create a summary of user's key context."""
        if not memories:
            return "New user with no conversation history."
        
        # Extract key themes from Mem0 Cloud API response format
        goals_mentioned = []
        challenges_mentioned = []
        progress_indicators = []
        
        for memory in memories:
            # Mem0 Cloud API returns different structure
            content = memory.get("memory", memory.get("text", "")).lower()
            metadata = memory.get("metadata", {})
            
            if "goal" in content or metadata.get("type") == "goal":
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
        
        # Check for consistency patterns using Mem0 Cloud API response format
        goal_mentions = sum(1 for m in memories if "goal" in m.get("memory", m.get("text", "")).lower())
        if goal_mentions > len(memories) * 0.3:
            patterns.append("goal_focused")
        
        # Check for progress tracking
        progress_mentions = sum(1 for m in memories if any(word in m.get("memory", m.get("text", "")).lower() 
                                                         for word in ["progress", "update", "achieved"]))
        if progress_mentions > 2:
            patterns.append("progress_tracker")
        
        return patterns


# Legacy alias for backward compatibility
class MemoryService(Mem0Service):
    """Alias for Mem0Service to maintain backward compatibility."""
    pass 
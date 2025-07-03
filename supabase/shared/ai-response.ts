// AI Response Generation Service - Main coordinator
import { MemoryService } from './memory.ts';
import { generateGroqResponse } from './ai-groq.ts';
import { getFallbackResponse } from './ai-fallbacks.ts';

export async function generateAIResponse(
  message: string, 
  userId: string, 
  personality: 'taskmaster' | 'cheerleader' = 'taskmaster'
): Promise<string | null> {
  try {
    // Get conversation context
    const recentMemories = await MemoryService.getMemories(userId, 50);
    
    // Build conversation context  
    const conversationContext = recentMemories
      .slice(0, 30) // Last 30 exchanges for rich context
      .reverse() // Chronological order
      .map(memory => `Previous: ${memory.memory}`)
      .join('\n');

    // Create AI prompt with context
    const prompt = buildPrompt(message, conversationContext, personality);

    // Generate AI response using Groq
    const aiResponse = await generateGroqResponse(prompt);
    
    if (!aiResponse) {
      return getFallbackResponse(personality);
    }

    // Store conversation in memory
    await MemoryService.addMemory(
      `User: ${message}\nAI (${personality}): ${aiResponse}`,
      userId,
      {
        personality,
        platform: 'api',
        intent: 'general_chat',
        timestamp: new Date().toISOString(),
      }
    );

    return aiResponse;

  } catch (error) {
    console.error('❌ AI generation error:', error);
    return getFallbackResponse(personality);
  }
}

function buildPrompt(message: string, context: string, personality: 'taskmaster' | 'cheerleader'): string {
  const personalityPrompts = {
    taskmaster: `You are David Goggins, the ultimate tough love coach. Be BRUTAL, direct, and uncompromising. No excuses, no sympathy - just pure motivation and accountability. Keep responses 8-12 words max. Examples: "Stop making excuses. Get after it NOW." or "Weak mindset. Do better. No shortcuts."`,
    
    cheerleader: `You are an enthusiastic, positive coach who celebrates every win. Be encouraging, energetic, and supportive while maintaining accountability. Keep responses 8-12 words max. Examples: "Amazing progress! Keep that momentum going!" or "You've got this! One step closer!"`
  };

  return `${personalityPrompts[personality]}

Context from previous conversations:
${context || 'First conversation with this user.'}

User's current message: "${message}"

Respond with brutal honesty and motivation in exactly 8-12 words. Stay in character.`;
} 
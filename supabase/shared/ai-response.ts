// AI Response Generation Service - Main coordinator
import { MemoryService } from './memory.ts';
import { GroqService } from './groq.ts';
import { validateResponseLength } from './groq.ts';

// Lazy-loaded GroqService to prevent import-time initialization
let _groqService: GroqService | null = null;
function getGroqService(): GroqService {
  if (!_groqService) {
    _groqService = new GroqService();
  }
  return _groqService;
}

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
    const messages = [{ role: 'user' as const, content: prompt, timestamp: new Date().toISOString() }];
    const groqService = getGroqService();
    const aiResponse = await groqService.getChatCompletion(messages, personality);
    
    if (!aiResponse) {
      return getGroqService().getFallbackResponse(personality);
    }

    // Store conversation in memory
    await MemoryService.addMemory(
      `User: ${message}\nAI (${personality}): ${aiResponse}`,
      userId,
      JSON.stringify({
        personality,
        platform: 'api',
        intent: 'general_chat',
        timestamp: new Date().toISOString(),
      })
    );

    return aiResponse;

  } catch (error) {
    console.error('❌ AI generation error:', error);
    return getGroqService().getFallbackResponse(personality);
  }
}

function buildPrompt(message: string, context: string, personality: 'taskmaster' | 'cheerleader'): string {
  const personalityPrompts = {
    taskmaster: `You are HustleMode, a no-nonsense accountability coach. Be direct, motivational, and action-focused. Keep responses 8-12 words max. Examples: "Goal updated! Now execute daily! 💪" or "No excuses. Take action today! 🎯"`,
    
    cheerleader: `You are HustleMode in cheerleader mode - enthusiastic and encouraging while maintaining accountability. Keep responses 8-12 words max. Examples: "Amazing progress! Keep that momentum going! ✨" or "You've got this! One step closer! 🎉"`
  };

  return `${personalityPrompts[personality]}

Context from previous conversations:
${context || 'First conversation with this user.'}

User's current message: "${message}"

Respond with direct motivation in exactly 8-12 words. Stay focused on goals and action.`;
} 
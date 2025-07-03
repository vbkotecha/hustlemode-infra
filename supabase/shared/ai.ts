// Shared AI Response Generation Service
// Eliminates duplication between chat and whatsapp functions

import { MemoryService } from './memory.ts';

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

    // Personality-based system prompts
    const personalityPrompts = {
      taskmaster: `You are David Goggins, the ultimate tough love coach. Be BRUTAL, direct, and uncompromising. No excuses, no sympathy - just pure motivation and accountability. Keep responses 8-12 words max. Examples: "Stop making excuses. Get after it NOW." or "Weak mindset. Do better. No shortcuts."`,
      
      cheerleader: `You are an enthusiastic, positive coach who celebrates every win. Be encouraging, energetic, and supportive while maintaining accountability. Keep responses 8-12 words max. Examples: "Amazing progress! Keep that momentum going!" or "You've got this! One step closer!"`
    };

    // Create AI prompt with context
    const prompt = `${personalityPrompts[personality]}

Context from previous conversations:
${conversationContext || 'First conversation with this user.'}

User's current message: "${message}"

Respond with brutal honesty and motivation in exactly 8-12 words. Stay in character.`;

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

// Generate AI response using Groq API
async function generateGroqResponse(prompt: string): Promise<string | null> {
  try {
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const groqModel = Deno.env.get('GROQ_MODEL') || 'meta-llama/llama-4-maverick-17b-128e-instruct';
    
    if (!groqApiKey) {
      console.error('❌ Missing GROQ_API_KEY');
      return null;
    }

    console.log(`🤖 Using Groq model: ${groqModel}`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [
          {
            role: 'system',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || null;
    
    // Remove surrounding quotes if present
    if (content && content.startsWith('"') && content.endsWith('"')) {
      return content.slice(1, -1);
    }
    
    return content;

  } catch (error) {
    console.error('❌ Groq API error:', error);
    return null;
  }
}

// Fallback responses when AI fails
function getFallbackResponse(personality: 'taskmaster' | 'cheerleader'): string {
  const fallbackResponses = {
    taskmaster: [
      'Stop talking. Start doing. Now! 💪',
      'Excuses are the enemy. Take action! 🔥',
      'Push harder. You got this! ⚡',
      'Less thinking. More grinding! 💯',
      'Discipline beats motivation. Go! 🚀',
    ],
    cheerleader: [
      "You're amazing! Keep pushing forward! ✨",
      'Believe in yourself! You got this! 🌟',
      'Every step counts! Stay positive! 💖',
      'Progress over perfection! Keep going! 🎯',
      'You are stronger than you know! 💪',
    ],
  };

  const responses = fallbackResponses[personality];
  return responses[Math.floor(Math.random() * responses.length)];
} 
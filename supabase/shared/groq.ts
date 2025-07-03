import type { GroqChatCompletion, ConversationMessage, Personality } from './types.ts';
import { getConfig, GROQ_BASE_URL, GROQ_MODEL, PERSONALITIES, PERFORMANCE } from './config.ts';

export class GroqService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const config = getConfig();
    this.apiKey = config.GROQ_API_KEY;
    this.baseUrl = GROQ_BASE_URL;
  }

  async getChatCompletion(
    messages: ConversationMessage[],
    personality: Personality = 'taskmaster',
    maxTokens: number = PERFORMANCE.GROQ_MAX_TOKENS
  ): Promise<string> {
    try {
      const personalityConfig = PERSONALITIES[personality];
      
      // Build messages with system prompt
      const systemMessage = {
        role: 'system' as const,
        content: `${personalityConfig.system_prompt} Keep responses to ${personalityConfig.max_words} words maximum.`,
        timestamp: new Date().toISOString(),
      };

      const requestMessages = [
        systemMessage,
        ...messages.slice(-8), // Last 8 messages for context
      ];

      const requestBody = {
        model: GROQ_MODEL,
        messages: requestMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: maxTokens,
        temperature: personalityConfig.temperature,
        top_p: 1,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        stop: null,
      };

      console.log(`🤖 Groq request: ${messages.length} messages, ${personality} personality`);

      const response = await this.makeRequest('/chat/completions', requestBody);
      
      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response choices returned from Groq');
      }

      const content = response.choices[0].message.content.trim();
      
      // Validate response length (emergency fallback if too long)
      const wordCount = content.split(' ').length;
      if (wordCount > 15) {
        console.warn(`⚠️ Response too long (${wordCount} words), using fallback`);
        return this.getFallbackResponse(personality);
      }

      console.log(`✅ Groq response: ${content} (${wordCount} words)`);
      return content;

    } catch (error) {
      console.error('❌ Groq API error:', error);
      return this.getFallbackResponse(personality);
    }
  }

  private async makeRequest(endpoint: string, body: any): Promise<GroqChatCompletion> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PERFORMANCE.GROQ_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Groq API error ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      return data as GroqChatCompletion;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Groq API request timeout');
      }
      
      throw error;
    }
  }

  private getFallbackResponse(personality: Personality): string {
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

  // Health check for Groq API
  async checkHealth(): Promise<{ healthy: boolean; latency: number }> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest('/chat/completions', {
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
        temperature: 0.1,
      });

      const latency = Date.now() - startTime;
      
      return {
        healthy: !!response.choices?.[0]?.message?.content,
        latency,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
      };
    }
  }
} 
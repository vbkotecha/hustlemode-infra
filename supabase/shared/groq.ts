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
      const requestBody = this.buildRequestBody(messages, personalityConfig, maxTokens);
      console.log(`🤖 Groq request: ${messages.length} messages, ${personality} personality`);
      console.log(`🔧 System prompt: ${personalityConfig.system_prompt.substring(0, 100)}...`);
      
      const response = await this.makeRequest('/chat/completions', requestBody);
      
      if (!response.choices?.[0]?.message?.content) {
        console.error('❌ No response content from Groq');
        throw new Error('No response content from Groq');
      }

      let content = response.choices[0].message.content.trim();
      
      // Remove unnecessary quotes that the AI sometimes adds
      if (content.startsWith('"') && content.endsWith('"')) {
        content = content.slice(1, -1);
      }
      
      const wordCount = content.split(' ').length;
      
      // Skip word limit check for tool-related calls (indicated by higher maxTokens)
      const isToolCall = maxTokens > 100; // Tool calls use 200+ tokens, chat uses default ~50
      
      if (!isToolCall && wordCount > 25) {
        console.warn(`⚠️ Response too long (${wordCount} words), using fallback`);
        return this.getFallbackResponse(personality);
      }

      console.log(`✅ Groq response: ${content} (${wordCount} words)${isToolCall ? ' [TOOL CALL]' : ''}`);
      return content;
    } catch (error) {
      console.error('❌ Groq API error:', error);
      return this.getFallbackResponse(personality);
    }
  }

  private buildRequestBody(messages: ConversationMessage[], personalityConfig: any, maxTokens: number) {
    const systemMessage = {
      role: 'system' as const,
      content: `${personalityConfig.system_prompt} Keep responses to ${personalityConfig.max_words} words maximum.`,
    };

    return {
      model: GROQ_MODEL,
      messages: [systemMessage, ...messages.slice(-8)].map(msg => ({ role: msg.role, content: msg.content })),
      max_tokens: maxTokens,
      temperature: personalityConfig.temperature,
      top_p: 1,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
    };
  }

  private async makeRequest(endpoint: string, body: any): Promise<GroqChatCompletion> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Groq API error ${response.status}`);
    return await response.json();
  }

  private getFallbackResponse(personality: Personality): string {
    // Updated fallback responses for accountability coach
    const responses = {
      taskmaster: 'System error. But accountability never stops. Check your goals and TAKE ACTION!',
    };
    return responses[personality] || responses.taskmaster;
  }
} 
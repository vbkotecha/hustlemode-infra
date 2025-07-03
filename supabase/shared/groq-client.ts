// Core Groq API client functionality
import type { GroqChatCompletion } from './types.ts';
import { getConfig, GROQ_BASE_URL, PERFORMANCE } from './config.ts';

export class GroqClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const config = getConfig();
    this.apiKey = config.GROQ_API_KEY;
    this.baseUrl = GROQ_BASE_URL;
  }

  async makeRequest(endpoint: string, body: any): Promise<GroqChatCompletion> {
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

  async checkHealth(): Promise<{ healthy: boolean; latency: number }> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest('/chat/completions', {
        model: getConfig().GROQ_MODEL || 'meta-llama/llama-4-maverick-17b-128e-instruct',
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
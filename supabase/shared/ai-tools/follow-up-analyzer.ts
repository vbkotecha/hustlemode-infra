// Follow-up Analysis - Extracted from message-analyzer.ts
import { GroqService } from '../groq.ts';

export interface FollowUpAnalysis {
  isFollowUp: boolean;
  followUpType: 'clarification' | 'deeper_detail' | 'implementation' | 'problem_solving' | 'none';
  needsDeepDive: boolean;
  previousTopic?: string;
  reasoning: string;
}

export class FollowUpAnalyzer {
  private _groqService: GroqService | null = null;

  private get groqService(): GroqService {
    if (!this._groqService) {
      this._groqService = new GroqService();
    }
    return this._groqService;
  }

  async analyzeIntelligentFollowUp(
    message: string, 
    conversationContext?: string
  ): Promise<FollowUpAnalysis> {
    if (!conversationContext || conversationContext.trim().length < 20) {
      return {
        isFollowUp: false,
        followUpType: 'none',
        needsDeepDive: false,
        reasoning: 'No conversation context available'
      };
    }

    const prompt = this.buildFollowUpPrompt(message, conversationContext);
    
    try {
      const response = await this.groqService.getChatCompletion([{
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 200);

      return this.parseFollowUpResponse(response);
    } catch (error) {
      console.error('❌ Follow-up analysis failed:', error);
      return {
        isFollowUp: false,
        followUpType: 'none',
        needsDeepDive: false,
        reasoning: 'Analysis failed, treating as new conversation'
      };
    }
  }

  private buildFollowUpPrompt(message: string, conversationContext: string): string {
    return `
Analyze if this message is a follow-up to previous conversation:

Current Message: "${message}"
Recent Context: ${conversationContext.slice(-800)}

Determine:
1. Is this clearly a follow-up to something discussed before?
2. What type of follow-up is it?
3. Does it need deeper discussion?
4. What was the previous topic?

Respond in JSON format:
{
  "isFollowUp": boolean,
  "followUpType": "clarification|deeper_detail|implementation|problem_solving|none",
  "needsDeepDive": boolean,
  "previousTopic": "string or null",
  "reasoning": "Brief explanation"
}

Look for continuity patterns, pronouns referring to previous discussion, and progressive depth.`;
  }

  private parseFollowUpResponse(response: string): FollowUpAnalysis {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      return {
        isFollowUp: !!parsed.isFollowUp,
        followUpType: parsed.followUpType || 'none',
        needsDeepDive: !!parsed.needsDeepDive,
        previousTopic: parsed.previousTopic || undefined,
        reasoning: parsed.reasoning || 'Follow-up analysis completed'
      };
    } catch (error) {
      console.error('❌ Failed to parse follow-up response:', error);
      return {
        isFollowUp: false,
        followUpType: 'none',
        needsDeepDive: false,
        reasoning: 'Parse error, treating as new conversation'
      };
    }
  }
} 
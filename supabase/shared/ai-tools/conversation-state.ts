// Refactored Conversation State - Using extracted analyzers
import { GroqService } from '../groq.ts';
import { ConversationAnalyzers } from './conversation-analyzers.ts';

export interface ConversationState {
  currentTopic: string;
  depthLevel: 'surface' | 'detailed' | 'implementation' | 'strategic' | 'expert';
  lastCoachingType: 'informational' | 'motivational' | 'tactical' | 'strategic' | 'troubleshooting';
  pendingFollowUp: boolean;
  lastDomain: string;
  conversationTurns: number;
  needsDeepDive: boolean;
}

export class ConversationStateAnalyzer {
  private _groqService: GroqService | null = null;

  private get groqService(): GroqService {
    if (!this._groqService) {
      this._groqService = new GroqService();
    }
    return this._groqService;
  }

  async analyzeConversationState(
    conversationMemory: string,
    currentMessage: string,
    goals: any[]
  ): Promise<ConversationState> {
    if (!conversationMemory || conversationMemory.trim().length < 50) {
      return ConversationAnalyzers.getDefaultConversationState();
    }

    const prompt = this.buildStateAnalysisPrompt(conversationMemory, currentMessage, goals);
    
    try {
      const response = await this.groqService.getChatCompletion([{
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 200);

      return this.parseStateResponse(response);
    } catch (error) {
      console.error('❌ Conversation state analysis failed:', error);
      return ConversationAnalyzers.getDefaultConversationState();
    }
  }

  async identifyUnresolvedNeeds(
    conversationMemory: string,
    currentMessage: string,
    conversationState: ConversationState
  ): Promise<string[]> {
    return await ConversationAnalyzers.identifyUnresolvedNeeds(conversationMemory, currentMessage);
  }

  async determineConversationProgression(
    conversationMemory: string,
    currentMessage: string,
    conversationState: ConversationState
  ): Promise<'start' | 'continue' | 'deep_dive' | 'switching_topics' | 'wrapping_up'> {
    return await ConversationAnalyzers.determineConversationProgression(
      conversationMemory,
      currentMessage,
      conversationState
    );
  }

  private buildStateAnalysisPrompt(
    conversationMemory: string,
    currentMessage: string,
    goals: any[]
  ): string {
    return `
Analyze conversation state from this context:

Recent conversation: "${conversationMemory.slice(-500)}"
Current message: "${currentMessage}"
User goals: ${goals.map(g => g.title).join(', ') || 'None'}

Determine conversation state and respond in JSON format:
{
  "currentTopic": "main topic being discussed",
  "depthLevel": "surface|detailed|implementation|strategic|expert",
  "lastCoachingType": "informational|motivational|tactical|strategic|troubleshooting",
  "pendingFollowUp": boolean,
  "lastDomain": "fitness|learning|productivity|financial|creative|health|general",
  "conversationTurns": number_estimate,
  "needsDeepDive": boolean
}

Focus on understanding the progression and depth of the conversation.`;
  }

  private parseStateResponse(response: string): ConversationState {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      return {
        currentTopic: parsed.currentTopic || 'general',
        depthLevel: parsed.depthLevel || 'surface',
        lastCoachingType: parsed.lastCoachingType || 'informational',
        pendingFollowUp: !!parsed.pendingFollowUp,
        lastDomain: parsed.lastDomain || 'general',
        conversationTurns: parsed.conversationTurns || 1,
        needsDeepDive: !!parsed.needsDeepDive
      };
    } catch (error) {
      console.error('❌ Failed to parse conversation state:', error);
      return ConversationAnalyzers.getDefaultConversationState();
    }
  }
} 
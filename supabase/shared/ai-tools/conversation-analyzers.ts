// Conversation Analyzers - Semantic LLM Analysis (NO KEYWORD MATCHING)
import { GroqService } from '../groq.ts';

export class ConversationAnalyzers {
  private static _groqService: GroqService | null = null;

  private static get groqService(): GroqService {
    if (!this._groqService) {
      this._groqService = new GroqService();
    }
    return this._groqService;
  }

  static async identifyUnresolvedNeeds(
    conversationMemory: string,
    currentMessage: string
  ): Promise<string[]> {
    // ✅ SEMANTIC LLM ANALYSIS - No regex patterns
    const analysisPrompt = `
Analyze conversation context to identify unresolved user needs:

Conversation context: "${conversationMemory.slice(-500)}"
Current message: "${currentMessage}"

What unresolved needs can you identify? Categories:
- guidance (user needs direction/help)
- implementation (user needs step-by-step actions)
- troubleshooting (user has problems to solve)
- planning (user needs timing/scheduling help)
- motivation (user needs encouragement)

Respond in JSON:
{
  "unresolvedNeeds": ["category1", "category2"],
  "reasoning": "semantic analysis explanation"
}

Use semantic understanding of context, not keyword matching.`;

    try {
      const response = await this.groqService.getChatCompletion([{
        role: 'user',
        content: analysisPrompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 200);

      const analysis = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
      return analysis.unresolvedNeeds || [];
    } catch (error) {
      console.error('❌ Unresolved needs LLM analysis failed:', error);
      return [];
    }
  }

  static async determineConversationProgression(
    conversationMemory: string,
    currentMessage: string,
    conversationState: any
  ): Promise<'start' | 'continue' | 'deep_dive' | 'switching_topics' | 'wrapping_up'> {
    // ✅ SEMANTIC LLM ANALYSIS - No includes() checks
    const turns = conversationState.conversationTurns;
    if (turns <= 1) return 'start';

    const analysisPrompt = `
Analyze conversation progression:

Conversation context: "${conversationMemory.slice(-500)}"
Current message: "${currentMessage}"
Conversation turns: ${turns}

What is the conversation progression? Options:
- continue (normal conversation flow)
- deep_dive (user wants more detail/breakdown)
- switching_topics (changing subjects)
- wrapping_up (user indicating end/thanks)

Respond in JSON:
{
  "progression": "continue|deep_dive|switching_topics|wrapping_up",
  "reasoning": "semantic analysis explanation"
}

Use semantic understanding of conversation flow, not keyword matching.`;

    try {
      const response = await this.groqService.getChatCompletion([{
        role: 'user',
        content: analysisPrompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 150);

      const analysis = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
      return analysis.progression || 'continue';
    } catch (error) {
      console.error('❌ Conversation progression LLM analysis failed:', error);
      return 'continue';
    }
  }

  static async detectTopicChange(conversationMemory: string, currentMessage: string): Promise<boolean> {
    // ✅ SEMANTIC LLM ANALYSIS - No keyword arrays
    const analysisPrompt = `
Analyze if the user changed topics:

Previous conversation: "${conversationMemory.slice(-500)}"
Current message: "${currentMessage}"

Did the user switch to a different topic/domain? Respond in JSON:
{
  "topicChanged": boolean,
  "previousTopic": "description of previous topic",
  "currentTopic": "description of current topic",
  "reasoning": "semantic analysis explanation"
}

Use semantic understanding, not keyword matching.`;

    try {
      const response = await this.groqService.getChatCompletion([{
        role: 'user',
        content: analysisPrompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 150);

      const analysis = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
      return analysis.topicChanged || false;
    } catch (error) {
      console.error('❌ Topic change LLM analysis failed:', error);
      return false;
    }
  }

  static async extractTopicsFromText(text: string): Promise<string[]> {
    // ✅ SEMANTIC LLM ANALYSIS - No keyword matching
    const analysisPrompt = `
Extract discussion topics from this text using semantic understanding:

Text: "${text}"

What topics/domains are being discussed? Examples:
- goal/achievement related
- exercise/fitness related  
- work/productivity related
- learning/education related
- finance/money related
- health/wellness related

Respond in JSON:
{
  "topics": ["topic1", "topic2"],
  "reasoning": "semantic analysis explanation"
}

Use semantic understanding, not keyword lists.`;

    try {
      const response = await this.groqService.getChatCompletion([{
        role: 'user',
        content: analysisPrompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 150);

      const analysis = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
      return analysis.topics || [];
    } catch (error) {
      console.error('❌ Topic extraction LLM analysis failed:', error);
      return [];
    }
  }

  static getDefaultConversationState(): any {
    return {
      currentTopic: 'general',
      depthLevel: 'surface',
      lastCoachingType: 'informational',
      pendingFollowUp: false,
      lastDomain: 'general',
      conversationTurns: 1,
      needsDeepDive: false
    };
  }
} 
// Enhanced Intent Analysis - Extracted from message-analyzer.ts
import { Platform } from '../tools/types.ts';
import { GroqService } from '../groq.ts';

export interface EnhancedIntentAnalysis {
  // Core action types
  requiresGoalManagement: boolean;
  requiresConflictAnalysis: boolean;
  requiresAmendmentSuggestion: boolean;
  requiresProgressInquiry: boolean;
  requiresPreferenceChange: boolean;
  
  // Enhanced dimensions
  domain: 'fitness' | 'learning' | 'productivity' | 'financial' | 'creative' | 'health' | 'general';
  depth_level: 'surface' | 'detailed' | 'implementation' | 'strategic' | 'expert';
  coaching_type: 'informational' | 'motivational' | 'tactical' | 'strategic' | 'troubleshooting';
  follow_up_context: 'initial' | 'clarification' | 'deeper_detail' | 'implementation' | 'problem_solving';
  specificity_needed: 'high' | 'medium' | 'low';
  
  // Conversation intelligence
  conversation_progression: 'start' | 'continue' | 'deep_dive' | 'switching_topics' | 'wrapping_up';
  unresolved_needs: string[];
  
  // Legacy fields
  goalAction?: string;
  reasoning: string;
}

export class IntentAnalyzer {
  private _groqService: GroqService | null = null;

  private get groqService(): GroqService {
    if (!this._groqService) {
      this._groqService = new GroqService();
    }
    return this._groqService;
  }

  async analyzeMessageIntentEnhanced(
    message: string, 
    conversationContext?: string
  ): Promise<EnhancedIntentAnalysis> {
    const prompt = this.buildIntentAnalysisPrompt(message, conversationContext);
    
    try {
      const response = await this.groqService.getChatCompletion([{
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 300);

      return this.parseIntentResponse(response);
    } catch (error) {
      console.error('❌ Enhanced intent analysis failed:', error);
      return this.getDefaultIntentAnalysis(message);
    }
  }

  private buildIntentAnalysisPrompt(message: string, conversationContext?: string): string {
    return `
Analyze this user message for coaching intent and requirements:

Message: "${message}"
${conversationContext ? `Context: ${conversationContext.slice(-500)}` : ''}

Determine the following dimensions and respond in JSON format:

{
  "requiresGoalManagement": boolean,
  "requiresConflictAnalysis": boolean, 
  "requiresAmendmentSuggestion": boolean,
  "requiresProgressInquiry": boolean,
  "requiresPreferenceChange": boolean,
  "domain": "fitness|learning|productivity|financial|creative|health|general",
  "depth_level": "surface|detailed|implementation|strategic|expert",
  "coaching_type": "informational|motivational|tactical|strategic|troubleshooting",
  "follow_up_context": "initial|clarification|deeper_detail|implementation|problem_solving",
  "specificity_needed": "high|medium|low",
  "conversation_progression": "start|continue|deep_dive|switching_topics|wrapping_up",
  "unresolved_needs": ["string array of identified needs"],
  "goalAction": "create|update|list|delete|none",
  "reasoning": "Brief explanation of analysis"
}

Focus on semantic understanding of intent, not keyword matching.`;
  }

  private parseIntentResponse(response: string): EnhancedIntentAnalysis {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      return {
        requiresGoalManagement: !!parsed.requiresGoalManagement,
        requiresConflictAnalysis: !!parsed.requiresConflictAnalysis,
        requiresAmendmentSuggestion: !!parsed.requiresAmendmentSuggestion,
        requiresProgressInquiry: !!parsed.requiresProgressInquiry,
        requiresPreferenceChange: !!parsed.requiresPreferenceChange,
        domain: parsed.domain || 'general',
        depth_level: parsed.depth_level || 'surface',
        coaching_type: parsed.coaching_type || 'motivational',
        follow_up_context: parsed.follow_up_context || 'initial',
        specificity_needed: parsed.specificity_needed || 'medium',
        conversation_progression: parsed.conversation_progression || 'start',
        unresolved_needs: parsed.unresolved_needs || [],
        goalAction: parsed.goalAction,
        reasoning: parsed.reasoning || 'Intent analysis completed'
      };
    } catch (error) {
      console.error('❌ Failed to parse intent response:', error);
      return this.getDefaultIntentAnalysis();
    }
  }

  private getDefaultIntentAnalysis(message?: string): EnhancedIntentAnalysis {
    return {
      requiresGoalManagement: false,
      requiresConflictAnalysis: false,
      requiresAmendmentSuggestion: false,
      requiresProgressInquiry: false,
      requiresPreferenceChange: false,
      domain: 'general',
      depth_level: 'surface',
      coaching_type: 'motivational',
      follow_up_context: 'initial',
      specificity_needed: 'medium',
      conversation_progression: 'start',
      unresolved_needs: [],
      reasoning: message ? 'Using fallback analysis due to LLM failure' : 'Default analysis'
    };
  }
} 
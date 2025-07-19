// Refactored Goal Coaching - Using extracted prompt builders
import { GroqService } from '../../groq.ts';
import { CoachingPrompts } from './coaching-prompts.ts';

export class GoalCoachingService {
  private _groqService: GroqService | null = null;

  private get groqService(): GroqService {
    if (!this._groqService) {
      this._groqService = new GroqService();
    }
    return this._groqService;
  }

  async generateExpertCoachingResponse(
    message: string,
    domain: string,
    depth_level: string,
    coaching_type: string,
    follow_up_context: string,
    specificity_needed: string,
    conversation_progression: string,
    unresolved_needs: string[],
    userGoals: any
  ): Promise<string> {
    const prompt = CoachingPrompts.buildExpertCoachingPrompt(
      message,
      domain,
      depth_level,
      coaching_type,
      follow_up_context,
      specificity_needed,
      conversation_progression,
      unresolved_needs,
      userGoals
    );

    try {
      const response = await this.groqService.getChatCompletion([{
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 100);

      return response || 'Expert coaching needs more context. What specifically?';
    } catch (error) {
      console.error('❌ Expert coaching generation failed:', error);
      return 'Coaching system temporarily down. Keep pushing forward!';
    }
  }
} 
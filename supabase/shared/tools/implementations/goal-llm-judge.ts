// Refactored Goal LLM Judge - Using extracted prompts
import { GroqService } from '../../groq.ts';
import { LLMPrompts } from './llm-prompts.ts';
import type { Platform } from '../types.ts';

export interface LLMJudgeResult {
  goal_identified: boolean;
  goal_id?: string;
  goal_title?: string;
  confidence: number;
  reasoning: string;
}

export class GoalLLMJudge {
  private _groqService: GroqService | null = null;

  private get groqService(): GroqService {
    if (!this._groqService) {
      this._groqService = new GroqService();
    }
    return this._groqService;
  }

  async judgeGoalReference(
    message: string,
    availableGoals: any[],
    action: string,
    platform: Platform
  ): Promise<LLMJudgeResult> {
    try {
      const prompt = LLMPrompts.buildGoalJudgePrompt(message, availableGoals, action);
      
      const response = await this.groqService.getChatCompletion([{
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 300);

      return this.parseJudgeResponse(response);
    } catch (error) {
      console.error('❌ Goal LLM judge failed:', error);
      return {
        goal_identified: false,
        confidence: 0,
        reasoning: `LLM evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async extractGoalFromMessage(
    message: string,
    action: string,
    platform: Platform
  ): Promise<any> {
    try {
      const prompt = LLMPrompts.buildGoalExtractionPrompt(message, action);
      
      const response = await this.groqService.getChatCompletion([{
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 400);

      return this.parseExtractionResponse(response);
    } catch (error) {
      console.error('❌ Goal extraction failed:', error);
      return null;
    }
  }

  async analyzeGoalConflicts(
    newGoal: any,
    existingGoals: any[],
    platform: Platform
  ): Promise<any> {
    try {
      const prompt = LLMPrompts.buildConflictAnalysisPrompt(newGoal, existingGoals);
      
      const response = await this.groqService.getChatCompletion([{
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 400);

      return this.parseConflictResponse(response);
    } catch (error) {
      console.error('❌ Conflict analysis failed:', error);
      return { has_conflicts: false, reasoning: 'Analysis failed' };
    }
  }

  async suggestAmendments(
    goals: any[],
    conflictType: string,
    platform: Platform
  ): Promise<any> {
    try {
      const prompt = LLMPrompts.buildAmendmentPrompt(goals, conflictType);
      
      const response = await this.groqService.getChatCompletion([{
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 400);

      return this.parseAmendmentResponse(response);
    } catch (error) {
      console.error('❌ Amendment suggestions failed:', error);
      return { suggestions: [] };
    }
  }

  private parseJudgeResponse(response: string): LLMJudgeResult {
    try {
      const cleaned = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleaned);
      
      return {
        goal_identified: !!parsed.goal_identified,
        goal_id: parsed.goal_id || undefined,
        goal_title: parsed.goal_title || undefined,
        confidence: Math.max(0, Math.min(100, parsed.confidence || 0)),
        reasoning: parsed.reasoning || 'No reasoning provided'
      };
    } catch (error) {
      console.error('❌ Failed to parse judge response:', error);
      return {
        goal_identified: false,
        confidence: 0,
        reasoning: 'Failed to parse LLM response'
      };
    }
  }

  private parseExtractionResponse(response: string): any {
    try {
      const cleaned = this.cleanJsonResponse(response);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('❌ Failed to parse extraction response:', error);
      return null;
    }
  }

  private parseConflictResponse(response: string): any {
    try {
      const cleaned = this.cleanJsonResponse(response);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('❌ Failed to parse conflict response:', error);
      return { has_conflicts: false, reasoning: 'Parse error' };
    }
  }

  private parseAmendmentResponse(response: string): any {
    try {
      const cleaned = this.cleanJsonResponse(response);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('❌ Failed to parse amendment response:', error);
      return { suggestions: [] };
    }
  }

  private cleanJsonResponse(response: string): string {
    return response
      .replace(/```json\n?|\n?```/g, '')
      .replace(/^\s*```\s*|\s*```\s*$/g, '')
      .trim();
  }
} 
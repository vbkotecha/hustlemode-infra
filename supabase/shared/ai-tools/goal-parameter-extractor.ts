// Goal Parameter Extraction - Extracted from message-analyzer.ts
import { GroqService } from '../groq.ts';
import { Platform } from '../tools/types.ts';
import { EnhancedIntentAnalysis } from './intent-analyzer.ts';

export class GoalParameterExtractor {
  private _groqService: GroqService | null = null;

  private get groqService(): GroqService {
    if (!this._groqService) {
      this._groqService = new GroqService();
    }
    return this._groqService;
  }

  async extractGoalParametersEnhanced(
    message: string, 
    action: string, 
    intentAnalysis: EnhancedIntentAnalysis
  ): Promise<any> {
    const prompt = this.buildParameterExtractionPrompt(message, action, intentAnalysis);
    
    try {
      const response = await this.groqService.getChatCompletion([{
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 400);

      return this.parseParameterResponse(response, action);
    } catch (error) {
      console.error('❌ Parameter extraction failed:', error);
      return this.getDefaultParameters(action);
    }
  }

  private buildParameterExtractionPrompt(
    message: string, 
    action: string, 
    intentAnalysis: EnhancedIntentAnalysis
  ): string {
    const basePrompt = `
Extract goal parameters from this message:
Message: "${message}"
Action: ${action}
Domain: ${intentAnalysis.domain}
Depth Level: ${intentAnalysis.depth_level}

Respond in JSON format with these fields:`;

    if (action === 'create') {
      return basePrompt + `
{
  "title": "Clear, actionable goal title",
  "description": "Brief description (optional)",
  "goal_type": "habit|project|calendar",
  "frequency": "daily|weekly|monthly|custom",
  "target_value": number_or_null,
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD_or_null"
}

Extract meaningful numeric targets and realistic timeframes.`;
    }

    if (action === 'update') {
      return basePrompt + `
{
  "goalReference": "How user refers to the goal",
  "title": "New title if mentioned",
  "target_value": "New target if mentioned", 
  "frequency": "New frequency if mentioned",
  "end_date": "New deadline if mentioned",
  "changes": "Summary of what to change"
}

Focus on what specifically needs to be updated.`;
    }

    return basePrompt + `
{
  "action": "${action}",
  "goalReference": "How user refers to goal",
  "parameters": {}
}`;
  }

  private parseParameterResponse(response: string, action: string): any {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      if (action === 'create') {
        return {
          title: parsed.title || 'New Goal',
          description: parsed.description || null,
          goal_type: parsed.goal_type || 'habit',
          frequency: parsed.frequency || 'daily',
          target_value: parsed.target_value || null,
          start_date: parsed.start_date || new Date().toISOString().split('T')[0],
          end_date: parsed.end_date || null
        };
      }

      if (action === 'update') {
        return {
          goalReference: parsed.goalReference || '',
          title: parsed.title || null,
          target_value: parsed.target_value || null,
          frequency: parsed.frequency || null,
          end_date: parsed.end_date || null,
          changes: parsed.changes || 'General update'
        };
      }

      return parsed;
    } catch (error) {
      console.error('❌ Failed to parse parameter response:', error);
      return this.getDefaultParameters(action);
    }
  }

  private getDefaultParameters(action: string): any {
    if (action === 'create') {
      return {
        title: 'New Goal',
        goal_type: 'habit',
        frequency: 'daily',
        start_date: new Date().toISOString().split('T')[0]
      };
    }
    
    if (action === 'update') {
      return {
        goalReference: 'goal',
        changes: 'Update goal'
      };
    }
    
    return { action };
  }
} 
// Preference Analysis Logic - Extracted from tool-creators.ts
import { Platform, ToolExecution } from '../tools/types.ts';

export class PreferenceAnalyzer {
  async createPreferenceToolExecutionLLM(
    message: string, 
    userId: string, 
    platform: Platform
  ): Promise<ToolExecution | null> {
    const analysisPrompt = `
Analyze this message for personality switching intent:

Message: "${message}"

Available personalities:
- taskmaster (tough love, accountability, discipline)
- cheerleader (positive, encouraging, supportive)

Does the user want to switch AI personality? Respond in JSON:
{
  "wantsPersonalitySwitch": boolean,
  "targetPersonality": "taskmaster|cheerleader|null",
  "confidence": number (0-100),
  "reasoning": "semantic analysis explanation"
}

Use semantic understanding, not keyword matching.`;

    try {
      const { GroqService } = await import('../groq.ts');
      const groqService = new GroqService();
      
      const response = await groqService.getChatCompletion([{
        role: 'user',
        content: analysisPrompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 150);

      const analysis = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
      
      if (!analysis.wantsPersonalitySwitch || analysis.confidence < 70) {
        return null;
      }

      return {
        tool_name: 'update_preferences',
        parameters: { default_personality: analysis.targetPersonality },
        user_id: userId,
        platform
      };
    } catch (error) {
      console.error('❌ Preference tool LLM analysis failed:', error);
      return null;
    }
  }
} 
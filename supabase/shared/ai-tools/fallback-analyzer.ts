// Fallback Analysis Logic - Extracted from message-analyzer.ts
import { Platform, ToolExecution } from '../tools/types.ts';

export class FallbackAnalyzer {
  async analyzeMessageForTools(
    message: string,
    userId: string,
    platform: Platform
  ): Promise<{ requiresTools: boolean; tools: ToolExecution[] }> {
    console.log('🔄 Using fallback basic analysis');
    
    const analysisPrompt = `
Analyze this message for tool requirements using semantic understanding:

Message: "${message}"

Available tools:
- manage_goal (goal creation, updates, deletion)
- get_progress (checking goal progress)
- update_preferences (changing settings/personality)
- enhanced_coaching (advanced coaching support)

What tools does this message require? Respond in JSON:
{
  "requiresTools": boolean,
  "suggestedTools": [
    {
      "tool": "tool_name",
      "action": "specific_action",
      "confidence": number (0-100),
      "reasoning": "why this tool is needed"
    }
  ]
}

Use semantic understanding of user intent, not keyword matching.`;

    try {
      const { GroqService } = await import('../groq.ts');
      const groqService = new GroqService();
      
      const response = await groqService.getChatCompletion([{
        role: 'user',
        content: analysisPrompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 200);

      const analysis = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
      
      const tools: ToolExecution[] = [];
      
      if (analysis.requiresTools && analysis.suggestedTools) {
        for (const toolSuggestion of analysis.suggestedTools) {
          if (toolSuggestion.confidence > 60) {
            tools.push({
              tool_name: toolSuggestion.tool,
              parameters: { action: toolSuggestion.action },
              user_id: userId,
              platform
            });
          }
        }
      }

      return {
        requiresTools: tools.length > 0,
        tools
      };
      
    } catch (error) {
      console.error('❌ Fallback LLM analysis failed:', error);
      // Emergency fallback - no tools rather than keyword matching
      return { requiresTools: false, tools: [] };
    }
  }
} 
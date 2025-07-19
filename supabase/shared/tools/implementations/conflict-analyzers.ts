// Conflict Analyzers - Semantic LLM Analysis (NO KEYWORD MATCHING)
import { GroqService } from '../../groq.ts';

export async function detectDuplicateActivity(goal1: any, goal2: any): Promise<boolean> {
  // ✅ SEMANTIC LLM ANALYSIS - No word filtering
  const analysisPrompt = `
Analyze if these two goals have duplicate/overlapping activities:

Goal 1: "${goal1.title}" (${goal1.description || 'no description'})
Goal 2: "${goal2.title}" (${goal2.description || 'no description'})

Are these goals essentially the same activity or highly overlapping? Respond in JSON:
{
  "isDuplicate": boolean,
  "overlapPercentage": number (0-100),
  "reasoning": "semantic analysis explanation"
}

Use semantic understanding, not keyword matching.`;

  try {
    const groqService = new GroqService();
    const response = await groqService.getChatCompletion([{
      role: 'user',
      content: analysisPrompt,
      timestamp: new Date().toISOString()
    }], 'taskmaster', 150);

    const analysis = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
    return analysis.isDuplicate && analysis.overlapPercentage > 70;
  } catch (error) {
    console.error('❌ Duplicate activity LLM analysis failed:', error);
    return false;
  }
}

export async function estimateGoalTimeRequirement(goal: any): Promise<number> {
  // ✅ SEMANTIC LLM ANALYSIS - No activity keyword matching
  const analysisPrompt = `
Estimate time requirement for this goal:

Goal: "${goal.title}"
Description: "${goal.description || 'no description'}"
Frequency: "${goal.frequency || 'not specified'}"
Duration: ${goal.duration_minutes || 'not specified'} minutes

What is the realistic daily time commitment in minutes? Respond in JSON:
{
  "dailyMinutes": number,
  "reasoning": "semantic analysis of time requirements"
}

Use semantic understanding of the activity, not keyword lists.`;

  try {
    const groqService = new GroqService();
    const response = await groqService.getChatCompletion([{
      role: 'user',
      content: analysisPrompt,
      timestamp: new Date().toISOString()
    }], 'taskmaster', 150);

    const analysis = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
    return analysis.dailyMinutes || 30; // Default fallback
  } catch (error) {
    console.error('❌ Time estimation LLM analysis failed:', error);
    return goal.duration_minutes || 30; // Fallback to existing data
  }
}

function applyFrequencyMultiplier(baseMinutes: number, frequency?: string): number {
  if (!frequency) return baseMinutes;
  
  // ✅ Keep frequency multiplier as it's mathematical, not semantic
  const freq = frequency.toLowerCase();
  if (freq.includes('daily')) return baseMinutes;
  if (freq.includes('twice')) return baseMinutes * 2;
  if (freq.includes('3') || freq.includes('three')) return baseMinutes * 3;
  if (freq.includes('4') || freq.includes('four')) return baseMinutes * 4;
  if (freq.includes('5') || freq.includes('five')) return baseMinutes * 5;
  
  return baseMinutes;
}

export async function detectTimeOverload(goal1: any, goal2: any): Promise<{ totalHours: number } | null> {
  // ✅ Use LLM-based time estimation, keep mathematical logic
  const time1 = await estimateGoalTimeRequirement(goal1);
  const time2 = await estimateGoalTimeRequirement(goal2);
  
  const totalHours = (time1 + time2) / 60;
  
  if (totalHours > 3) { // More than 3 hours daily is likely overload
    return { totalHours };
  }
  
  return null;
}

export async function detectResourceContradiction(goal1: any, goal2: any): Promise<{ reason: string } | null> {
  // ✅ SEMANTIC LLM ANALYSIS - No keyword arrays
  const analysisPrompt = `
Analyze if these goals have resource conflicts:

Goal 1: "${goal1.title}" (${goal1.description || 'no description'})
Goal 2: "${goal2.title}" (${goal2.description || 'no description'})

Do these goals conflict in terms of:
- Money/budget resources
- Physical space/location requirements  
- Equipment/tools needed
- Lifestyle contradictions

Respond in JSON:
{
  "hasConflict": boolean,
  "conflictType": "financial|spatial|equipment|lifestyle|none",
  "reason": "specific explanation of the conflict",
  "severity": "low|medium|high"
}

Use semantic understanding, not keyword matching.`;

  try {
    const groqService = new GroqService();
    const response = await groqService.getChatCompletion([{
      role: 'user',
      content: analysisPrompt,
      timestamp: new Date().toISOString()
    }], 'taskmaster', 200);

    const analysis = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
    
    if (analysis.hasConflict && analysis.severity !== 'low') {
      return { reason: analysis.reason };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Resource contradiction LLM analysis failed:', error);
    return null;
  }
} 
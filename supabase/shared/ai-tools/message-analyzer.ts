// Message Analysis for AI Tool Detection - LLM SEMANTIC UNDERSTANDING
import type { ToolExecution, Platform } from '../tools/types.ts';
import { GroqService } from '../groq.ts';

const groq = new GroqService();

export class MessageAnalyzer {
  static async analyzeMessageForTools(
    message: string, 
    userId: string, 
    platform: Platform
  ): Promise<{ requiresTools: boolean; tools: ToolExecution[] }> {
    const tools: ToolExecution[] = [];
    
    // 🧠 LLM SEMANTIC UNDERSTANDING - Replace ALL keyword matching
    console.log(`🧠 Analyzing message semantically: "${message}"`);
    
    try {
      // Use LLM to understand user intent semantically
      const intentAnalysis = await this.analyzeMessageIntent(message);
      console.log('🧠 Intent analysis result:', intentAnalysis);
      
      // Based on LLM semantic understanding, create appropriate tool executions
      if (intentAnalysis.requiresGoalManagement) {
        const goalTool = await this.createGoalToolExecutionLLM(message, userId, platform, intentAnalysis);
        if (goalTool) tools.push(goalTool);
      }
      
      if (intentAnalysis.requiresConflictAnalysis) {
        tools.push({ tool_name: 'manage_goal', parameters: { action: 'analyze_conflicts' }, user_id: userId, platform });
      }
      
      if (intentAnalysis.requiresAmendmentSuggestion) {
        tools.push({ tool_name: 'manage_goal', parameters: { action: 'suggest_amendments' }, user_id: userId, platform });
      }
      
      if (intentAnalysis.requiresProgressInquiry) {
        tools.push({ tool_name: 'get_progress', parameters: { time_period: 'week' }, user_id: userId, platform });
      }
      
      if (intentAnalysis.requiresPreferenceChange) {
        const prefTool = await this.createPreferenceToolExecutionLLM(message, userId, platform);
        if (prefTool) tools.push(prefTool);
      }
      
    } catch (error) {
      console.error('❌ LLM semantic analysis failed:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Try to provide more detailed error information
      if (error.message?.includes('Unexpected token')) {
        console.error('❌ Likely JSON parsing error - LLM returned non-JSON response');
      }
      
      // Fallback: no tools (better than wrong analysis)
      return { requiresTools: false, tools: [] };
    }
    
    return { requiresTools: tools.length > 0, tools };
  }

  /**
   * 🧠 LLM SEMANTIC INTENT ANALYSIS
   * Replaces ALL keyword matching with semantic understanding
   */
  private static async analyzeMessageIntent(message: string): Promise<{
    requiresGoalManagement: boolean;
    requiresConflictAnalysis: boolean;
    requiresAmendmentSuggestion: boolean;
    requiresProgressInquiry: boolean;
    requiresPreferenceChange: boolean;
    goalAction?: string;
    reasoning: string;
  }> {
    const prompt = `You are an intent analysis AI. Analyze this user message to understand what they want to do.

User message: "${message}"

Determine what the user wants (use semantic understanding, NOT keyword matching):

1. GOAL MANAGEMENT: Does user want to create, update, delete, or list goals?
   Examples: 
   - create: "set a reading goal", "I want to start exercising"
   - update: "increase my steps to 15,000", "change my workout routine"
   - delete: "remove my exercise goal", "stop tracking reading"
   - list: "what are my goals", "what should I do today", "what should I work on", "tell me my daily tasks"

2. CONFLICT ANALYSIS: Do they want to check for goal conflicts or problems?
   Examples: "are my goals conflicting", "too many goals", "check for problems"

3. AMENDMENT SUGGESTIONS: Do they want suggestions to improve their goals?
   Examples: "optimize my goals", "make my goals better", "suggest improvements"

4. PROGRESS INQUIRY: Are they asking about their progress?
   Examples: "how am I doing", "my progress", "check my status"

5. PREFERENCE CHANGE: Do they want to change coaching settings?
   Examples: "be more gentle", "switch personality", "change accountability level"

If GOAL MANAGEMENT, also determine the specific action:
- "create": Setting new goals
- "update": Changing existing goals  
- "delete": Removing goals
- "list": Viewing current goals

Respond in this exact format:
GOAL_MANAGEMENT: YES/NO
GOAL_ACTION: create/update/delete/list (if applicable)
CONFLICT_ANALYSIS: YES/NO  
AMENDMENT_SUGGESTION: YES/NO
PROGRESS_INQUIRY: YES/NO
PREFERENCE_CHANGE: YES/NO
REASONING: [Brief explanation of your semantic analysis]`;

    try {
      const response = await groq.getChatCompletion([
        { role: 'user', content: prompt, timestamp: new Date().toISOString() }
      ], 'taskmaster', 200);
      
      console.log('🧠 Raw LLM intent analysis:', response);
      
      // Parse LLM response
      const lines = response.trim().split('\n');
      const result = {
        requiresGoalManagement: false,
        requiresConflictAnalysis: false,
        requiresAmendmentSuggestion: false,
        requiresProgressInquiry: false,
        requiresPreferenceChange: false,
        goalAction: undefined as string | undefined,
        reasoning: ''
      };
      
      lines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        switch (key) {
          case 'GOAL_MANAGEMENT':
            result.requiresGoalManagement = value === 'YES';
            break;
          case 'GOAL_ACTION':
            if (value && value !== '(if applicable)') result.goalAction = value;
            break;
          case 'CONFLICT_ANALYSIS':
            result.requiresConflictAnalysis = value === 'YES';
            break;
          case 'AMENDMENT_SUGGESTION':
            result.requiresAmendmentSuggestion = value === 'YES';
            break;
          case 'PROGRESS_INQUIRY':
            result.requiresProgressInquiry = value === 'YES';
            break;
          case 'PREFERENCE_CHANGE':
            result.requiresPreferenceChange = value === 'YES';
            break;
          case 'REASONING':
            result.reasoning = value;
            break;
        }
      });
      
      console.log('✅ Parsed intent analysis:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Intent analysis LLM error:', error);
      throw error;
    }
  }

  /**
   * 🧠 LLM-BASED GOAL TOOL CREATION
   * Replaces keyword matching with semantic parameter extraction
   */
  private static async createGoalToolExecutionLLM(
    message: string, 
    userId: string, 
    platform: Platform,
    intentAnalysis: any
  ): Promise<ToolExecution | null> {
    
    console.log('🎯 Creating goal tool execution with LLM semantic understanding');
    console.log('🎯 Message:', message);
    console.log('🎯 Intent:', intentAnalysis);
    
    const action = intentAnalysis.goalAction;
    if (!action) {
      console.log('❌ No goal action identified by LLM');
      return null;
    }
    
    // Use LLM to extract goal parameters semantically
    const parameters = await this.extractGoalParametersLLM(message, action);
    
    // 🚫 SAFEGUARD: If create/update action lacks essential parameters, fall back to list
    let finalAction = action;
    if ((action === 'create' || action === 'update') && !parameters.title && !parameters.goal_reference) {
      console.log(`🔄 Action "${action}" lacks title/reference, falling back to "list"`);
      console.log('🔄 Original message likely asking for goal list, not creation/update');
      finalAction = 'list';
    }
    
    const baseExecution: ToolExecution = {
      tool_name: 'manage_goal',
      parameters: {
        action: finalAction,
        original_message: message,
        check_conflicts: true,
        auto_resolve: false,
        ...parameters
      },
      user_id: userId,
      platform
    };
    
    console.log('✅ Created LLM-based goal tool execution:', JSON.stringify(baseExecution, null, 2));
    return baseExecution;
  }

  /**
   * 🧠 LLM-BASED PARAMETER EXTRACTION
   * Replaces regex patterns with semantic understanding
   */
  private static async extractGoalParametersLLM(message: string, action: string): Promise<any> {
    console.log(`🔍 Extracting goal parameters for action: ${action}`);
    
    const prompt = `Extract goal-related parameters from this user message using semantic understanding.

User message: "${message}"
Action: ${action}

Extract these parameters if present:
1. GOAL_REFERENCE: Which goal is the user referring to? (e.g., "walking", "exercise", "reading")
2. TITLE: Goal title for creation (e.g., "Walk 15,000 steps daily")  
3. TARGET_VALUE: Numeric target if specified (e.g., 15000 from "15,000 steps")
4. UNIT: Unit of measurement (e.g., "steps", "minutes", "hours")
5. GOAL_TYPE: habit/project/calendar (default: habit)
6. FREQUENCY: How often (e.g., "daily", "weekly", "3x weekly")

For UPDATE actions, focus on what's changing.
For CREATE actions, extract the complete goal definition.
For DELETE actions, identify which goal to remove.
For LIST actions, no parameters needed.

Respond in this exact format:
GOAL_REFERENCE: [value or NONE]
TITLE: [value or NONE]  
TARGET_VALUE: [number or NONE]
UNIT: [value or NONE]
GOAL_TYPE: [habit/project/calendar or NONE]
FREQUENCY: [value or NONE]
REASONING: [Brief explanation]`;

    try {
      const response = await groq.getChatCompletion([
        { role: 'user', content: prompt, timestamp: new Date().toISOString() }
      ], 'taskmaster', 250);
      
      console.log('🔍 Raw parameter extraction response:', response);
      
      // Parse LLM response
      const lines = response.trim().split('\n');
      const params: any = {};
      
      lines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        if (value && value !== 'NONE' && value !== '[value or NONE]') {
          switch (key) {
            case 'GOAL_REFERENCE':
              params.goal_reference = value;
              break;
            case 'TITLE':
              params.title = value;
              break;
            case 'TARGET_VALUE':
              const numValue = parseInt(value);
              if (!isNaN(numValue)) params.target_value = numValue;
              break;
            case 'UNIT':
              params.unit = value;
              break;
            case 'GOAL_TYPE':
              if (['habit', 'project', 'calendar'].includes(value)) {
                params.goal_type = value;
              }
              break;
            case 'FREQUENCY':
              params.frequency = value;
              break;
            case 'REASONING':
              console.log('🧠 LLM reasoning:', value);
              break;
          }
        }
      });
      
      // For updates with target_value and unit, add smart title update flag
      if (action === 'update' && params.target_value && params.unit) {
        params.smart_title_update = {
          new_value: params.target_value,
          unit: params.unit,
          should_update_title: true
        };
      }
      
      console.log('✅ Extracted parameters:', JSON.stringify(params, null, 2));
      return params;
      
    } catch (error) {
      console.error('❌ Parameter extraction LLM error:', error);
      return {};
    }
  }

  /**
   * 🧠 LLM-BASED PREFERENCE TOOL CREATION
   * Replaces keyword matching with semantic understanding
   */
  private static async createPreferenceToolExecutionLLM(
    message: string, 
    userId: string, 
    platform: Platform
  ): Promise<ToolExecution | null> {
    
    const prompt = `Analyze this message for preference/personality changes.

User message: "${message}"

Determine what preference changes the user wants:
1. ACCOUNTABILITY_LEVEL: high (taskmaster), medium (cheerleader), low (gentle)
2. PERSONALITY_SWITCH: taskmaster or cheerleader

Respond in format:
ACCOUNTABILITY_LEVEL: [high/medium/low or NONE]
PERSONALITY_SWITCH: [taskmaster/cheerleader or NONE]`;

    try {
      const response = await groq.getChatCompletion([
        { role: 'user', content: prompt, timestamp: new Date().toISOString() }
      ], 'taskmaster', 100);
      
      const lines = response.trim().split('\n');
      const parameters: any = {};
      
      lines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        if (value && value !== 'NONE') {
          if (key === 'ACCOUNTABILITY_LEVEL' && ['high', 'medium', 'low'].includes(value)) {
            parameters.accountability_level = value;
          }
          if (key === 'PERSONALITY_SWITCH' && ['taskmaster', 'cheerleader'].includes(value)) {
            parameters.default_personality = value;
          }
        }
      });
      
      if (Object.keys(parameters).length === 0) return null;
      
      return { 
        tool_name: 'update_preferences', 
        parameters, 
        user_id: userId, 
        platform 
      };
      
    } catch (error) {
      console.error('❌ Preference analysis LLM error:', error);
      return null;
    }
  }
} 
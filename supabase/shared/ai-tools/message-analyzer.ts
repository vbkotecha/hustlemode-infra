// Message Analysis for AI Tool Detection - ENHANCED MULTI-DIMENSIONAL INTENT ANALYSIS
import type { ToolExecution, Platform } from '../tools/types.ts';
import { GroqService } from '../groq.ts';

const groq = new GroqService();

// Enhanced intent analysis types
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

export class MessageAnalyzer {
  static async analyzeMessageForTools(
    message: string, 
    userId: string, 
    platform: Platform,
    conversationContext?: string
  ): Promise<{ requiresTools: boolean; tools: ToolExecution[] }> {
    const tools: ToolExecution[] = [];
    
    // 🧠 ENHANCED MULTI-DIMENSIONAL INTENT ANALYSIS
    console.log(`🧠 Analyzing message with enhanced multi-dimensional understanding: "${message}"`);
    
    try {
      // Use enhanced LLM to understand user intent across multiple dimensions
      const intentAnalysis = await this.analyzeMessageIntentEnhanced(message, conversationContext);
      console.log('🧠 Enhanced intent analysis result:', intentAnalysis);
      
      // Based on enhanced semantic understanding, create appropriate tool executions
      if (intentAnalysis.requiresGoalManagement) {
        const goalTool = await this.createGoalToolExecutionEnhanced(message, userId, platform, intentAnalysis);
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
      
      // NEW: Add enhanced coaching tool for complex coaching needs
      if (intentAnalysis.coaching_type !== 'informational' || intentAnalysis.depth_level !== 'surface') {
        const coachingTool = await this.createEnhancedCoachingTool(message, userId, platform, intentAnalysis);
        if (coachingTool) tools.push(coachingTool);
      }
      
      const requiresTools = tools.length > 0;
      console.log(`🔧 Analysis complete: ${requiresTools ? 'Tools required' : 'No tools needed'}`);
      
      return { requiresTools, tools };
      
    } catch (error) {
      console.error('❌ Enhanced intent analysis error:', error);
      // Fallback to basic analysis if enhanced fails
      return await this.fallbackBasicAnalysis(message, userId, platform);
    }
  }

  /**
   * 🧠 ENHANCED MULTI-DIMENSIONAL INTENT ANALYSIS
   * Replaces basic CRUD with comprehensive coaching intelligence
   */
  private static async analyzeMessageIntentEnhanced(
    message: string, 
    conversationContext?: string
  ): Promise<EnhancedIntentAnalysis> {
    // First, analyze for intelligent follow-up patterns
    const followUpAnalysis = await this.analyzeIntelligentFollowUp(message, conversationContext);
    
    const prompt = `You are an advanced coaching intent analysis AI. Analyze this user message across multiple dimensions to understand their complete coaching needs.

User message: "${message}"
${conversationContext ? `Recent conversation context: "${conversationContext}"` : ''}

INTELLIGENT FOLLOW-UP ANALYSIS:
${followUpAnalysis.isFollowUp ? `FOLLOW-UP DETECTED: ${followUpAnalysis.followUpType} - ${followUpAnalysis.reasoning}` : 'No follow-up detected'}
${followUpAnalysis.needsDeepDive ? 'DEEP DIVE NEEDED: User wants detailed implementation guidance' : ''}
${followUpAnalysis.previousTopic ? `PREVIOUS TOPIC: ${followUpAnalysis.previousTopic}` : ''}

Analyze across these dimensions:

1. BASIC INTENT ANALYSIS:
   GOAL_MANAGEMENT: Does user want to create, update, delete, or list goals?
   CONFLICT_ANALYSIS: Do they want to check for goal conflicts?
   AMENDMENT_SUGGESTION: Do they want suggestions to improve goals?
   PROGRESS_INQUIRY: Are they asking about progress?
   PREFERENCE_CHANGE: Do they want to change coaching settings?

2. DOMAIN CLASSIFICATION:
   Which domain does this relate to?
   - fitness: exercise, health, physical activity
   - learning: education, skills, knowledge acquisition
   - productivity: work, efficiency, time management
   - financial: money, budgeting, investing
   - creative: art, writing, music, design
   - health: wellness, mental health, habits
   - general: conversations, casual chat

3. DEPTH LEVEL ANALYSIS:
   What level of detail/complexity is needed?
   - surface: basic info, simple questions
   - detailed: specific information, explanations
   - implementation: step-by-step guidance, how-to
   - strategic: planning, optimization, long-term thinking
   - expert: advanced techniques, troubleshooting

4. COACHING TYPE NEEDED:
   What type of coaching response is appropriate?
   - informational: providing facts, data, lists
   - motivational: encouragement, inspiration
   - tactical: specific actions, methods
   - strategic: planning, prioritization
   - troubleshooting: problem-solving, obstacles

5. FOLLOW-UP CONTEXT:
   Where are we in the conversation?
   - initial: first question on topic
   - clarification: asking for more info on same topic
   - deeper_detail: wanting more specific implementation
   - implementation: ready to take action
   - problem_solving: encountering obstacles

6. SPECIFICITY NEEDED:
   How specific should the response be?
   - high: detailed steps, specific numbers, exact methods
   - medium: general guidance with some specifics
   - low: broad concepts, general direction

7. CONVERSATION PROGRESSION:
   What's the conversation flow?
   - start: beginning new topic
   - continue: building on previous topic
   - deep_dive: going deeper into specifics
   - switching_topics: changing subjects
   - wrapping_up: concluding discussion

8. UNRESOLVED NEEDS:
   What underlying needs might not be explicitly stated?
   List any implied needs for follow-up

If GOAL_MANAGEMENT, determine the specific action:
- "create": Setting new goals
- "update": Changing existing goals  
- "delete": Removing goals
- "list": Viewing current goals
- "breakdown": Breaking goals into actionable steps
- "schedule": Creating implementation timeline
- "optimize": Improving goal structure

FOLLOW-UP INTELLIGENCE:
Consider the follow-up analysis above when determining depth level and coaching type.
If follow-up detected, prioritize deeper detail and implementation guidance.

Respond in this exact format:
GOAL_MANAGEMENT: YES/NO
GOAL_ACTION: [action or NONE]
CONFLICT_ANALYSIS: YES/NO  
AMENDMENT_SUGGESTION: YES/NO
PROGRESS_INQUIRY: YES/NO
PREFERENCE_CHANGE: YES/NO
DOMAIN: [fitness/learning/productivity/financial/creative/health/general]
DEPTH_LEVEL: [surface/detailed/implementation/strategic/expert]
COACHING_TYPE: [informational/motivational/tactical/strategic/troubleshooting]
FOLLOW_UP_CONTEXT: [initial/clarification/deeper_detail/implementation/problem_solving]
SPECIFICITY_NEEDED: [high/medium/low]
CONVERSATION_PROGRESSION: [start/continue/deep_dive/switching_topics/wrapping_up]
UNRESOLVED_NEEDS: [comma-separated list or NONE]
REASONING: [Comprehensive analysis of user's coaching needs]`;

    try {
      const response = await groq.getChatCompletion([
        { role: 'user', content: prompt, timestamp: new Date().toISOString() }
      ], 'taskmaster', 400);
      
      console.log('🧠 Enhanced intent analysis response:', response);
      
      if (!response || response.trim().length === 0) {
        throw new Error('Empty response from enhanced intent analysis');
      }
      
      // Parse enhanced LLM response with error handling
      const lines = response.trim().split('\n');
      const result: EnhancedIntentAnalysis = {
        requiresGoalManagement: false,
        requiresConflictAnalysis: false,
        requiresAmendmentSuggestion: false,
        requiresProgressInquiry: false,
        requiresPreferenceChange: false,
        domain: 'general',
        depth_level: 'surface',
        coaching_type: 'informational',
        follow_up_context: 'initial',
        specificity_needed: 'low',
        conversation_progression: 'start',
        unresolved_needs: [],
        reasoning: ''
      };
      
      // Apply follow-up analysis overrides
      if (followUpAnalysis.isFollowUp) {
        result.follow_up_context = followUpAnalysis.followUpType as any;
        result.conversation_progression = 'deep_dive';
        if (followUpAnalysis.needsDeepDive) {
          result.depth_level = 'implementation';
          result.coaching_type = 'tactical';
          result.specificity_needed = 'high';
        }
      }
      
      lines.forEach(line => {
        try {
          if (!line.includes(':')) return; // Skip lines without key-value structure
          const [key, value] = line.split(':').map(s => s.trim());
          if (!key || !value) return; // Skip incomplete lines
          
          switch (key) {
            case 'GOAL_MANAGEMENT':
              result.requiresGoalManagement = value === 'YES';
              break;
            case 'GOAL_ACTION':
              if (value && value !== 'NONE') result.goalAction = value;
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
          case 'DOMAIN':
            if (['fitness', 'learning', 'productivity', 'financial', 'creative', 'health', 'general'].includes(value)) {
              result.domain = value as any;
            }
            break;
          case 'DEPTH_LEVEL':
            if (['surface', 'detailed', 'implementation', 'strategic', 'expert'].includes(value)) {
              result.depth_level = value as any;
            }
            break;
          case 'COACHING_TYPE':
            if (['informational', 'motivational', 'tactical', 'strategic', 'troubleshooting'].includes(value)) {
              result.coaching_type = value as any;
            }
            break;
          case 'FOLLOW_UP_CONTEXT':
            if (['initial', 'clarification', 'deeper_detail', 'implementation', 'problem_solving'].includes(value)) {
              result.follow_up_context = value as any;
            }
            break;
          case 'SPECIFICITY_NEEDED':
            if (['high', 'medium', 'low'].includes(value)) {
              result.specificity_needed = value as any;
            }
            break;
          case 'CONVERSATION_PROGRESSION':
            if (['start', 'continue', 'deep_dive', 'switching_topics', 'wrapping_up'].includes(value)) {
              result.conversation_progression = value as any;
            }
            break;
          case 'UNRESOLVED_NEEDS':
            if (value && value !== 'NONE') {
              result.unresolved_needs = value.split(',').map(s => s.trim());
            }
            break;
          case 'REASONING':
            result.reasoning = value;
            break;
        }
        } catch (parseError) {
          console.warn('⚠️ Failed to parse intent analysis line:', line, parseError);
        }
      });
      
      console.log('✅ Enhanced intent analysis parsed:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Enhanced intent analysis LLM error:', error);
      throw error;
    }
  }

  /**
   * 🔍 INTELLIGENT FOLLOW-UP RECOGNITION
   * Detects when users are asking for deeper detail or implementation guidance
   */
  private static async analyzeIntelligentFollowUp(
    message: string, 
    conversationContext?: string
  ): Promise<{
    isFollowUp: boolean;
    followUpType: 'clarification' | 'deeper_detail' | 'implementation' | 'problem_solving' | 'none';
    needsDeepDive: boolean;
    previousTopic?: string;
    reasoning: string;
  }> {
    console.log('🔍 Analyzing intelligent follow-up patterns');
    
    if (!conversationContext || conversationContext.trim() === '') {
      return {
        isFollowUp: false,
        followUpType: 'none',
        needsDeepDive: false,
        reasoning: 'No conversation context available'
      };
    }
    
    const prompt = `Analyze this message to detect intelligent follow-up patterns that indicate the user wants deeper detail or implementation guidance.

Recent conversation: "${conversationContext}"
Current message: "${message}"

FOLLOW-UP PATTERNS TO DETECT:
1. CLARIFICATION REQUESTS: "Can you explain that more?", "What do you mean by...", "I don't understand..."
2. DEEPER DETAIL REQUESTS: "Break it down", "Can you be more specific?", "Tell me more about...", "How exactly do I..."
3. IMPLEMENTATION REQUESTS: "How do I do that?", "What are the steps?", "Walk me through it", "Show me how to..."
4. PROBLEM SOLVING: "That didn't work", "I'm having trouble with...", "I tried but...", "What if..."

PROGRESSIVE DEPTH INDICATORS:
- User asked basic question previously and now wants more detail
- User received general advice and now wants specific implementation
- User is building on previous topic with deeper questions
- User is asking for step-by-step breakdowns
- User is asking for time-based schedules (hourly, daily)

DEEP DIVE SIGNALS:
- "break it down", "break them down", "by the hour", "step by step", "how exactly"
- "Can you be more specific?", "Tell me more", "What should I do specifically?"
- "How do I implement this?", "What are the actual steps?"

Determine:
1. Is this a follow-up to previous conversation?
2. What type of follow-up is it?
3. Does the user need deep dive implementation guidance?
4. What was the previous topic they're following up on?

Respond in this format:
IS_FOLLOW_UP: [YES/NO]
FOLLOW_UP_TYPE: [clarification/deeper_detail/implementation/problem_solving/none]
NEEDS_DEEP_DIVE: [YES/NO]
PREVIOUS_TOPIC: [topic or NONE]
REASONING: [Brief explanation of follow-up analysis]`;

    try {
      const response = await groq.getChatCompletion([
        { role: 'user', content: prompt, timestamp: new Date().toISOString() }
      ], 'taskmaster', 200);
      
      console.log('🔍 Follow-up analysis response:', response);
      
      // Parse LLM response
      const lines = response.trim().split('\n');
      const result = {
        isFollowUp: false,
        followUpType: 'none' as any,
        needsDeepDive: false,
        previousTopic: undefined as string | undefined,
        reasoning: ''
      };
      
      lines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        switch (key) {
          case 'IS_FOLLOW_UP':
            result.isFollowUp = value === 'YES';
            break;
          case 'FOLLOW_UP_TYPE':
            if (['clarification', 'deeper_detail', 'implementation', 'problem_solving'].includes(value)) {
              result.followUpType = value as any;
            }
            break;
          case 'NEEDS_DEEP_DIVE':
            result.needsDeepDive = value === 'YES';
            break;
          case 'PREVIOUS_TOPIC':
            if (value && value !== 'NONE') {
              result.previousTopic = value;
            }
            break;
          case 'REASONING':
            result.reasoning = value;
            break;
        }
      });
      
      console.log('✅ Follow-up analysis result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Follow-up analysis error:', error);
      return {
        isFollowUp: false,
        followUpType: 'none',
        needsDeepDive: false,
        reasoning: 'Analysis failed'
      };
    }
  }

  /**
   * 🧠 ENHANCED GOAL TOOL CREATION
   * Uses multi-dimensional analysis for better goal management
   */
  private static async createGoalToolExecutionEnhanced(
    message: string, 
    userId: string, 
    platform: Platform,
    intentAnalysis: EnhancedIntentAnalysis
  ): Promise<ToolExecution | null> {
    
    console.log('🎯 Creating enhanced goal tool execution');
    console.log('🎯 Message:', message);
    console.log('🎯 Enhanced intent:', intentAnalysis);
    
    const action = intentAnalysis.goalAction;
    if (!action) {
      console.log('❌ No goal action identified by enhanced LLM');
      return null;
    }
    
    // Use enhanced LLM to extract goal parameters with coaching context
    const parameters = await this.extractGoalParametersEnhanced(message, action, intentAnalysis);
    
    // 🚫 SAFEGUARD: If create/update action lacks essential parameters, fall back to list
    let finalAction = action;
    if ((action === 'create' || action === 'update') && !parameters.title && !parameters.goal_reference) {
      console.log(`🔄 Action "${action}" lacks title/reference, falling back to "list"`);
      finalAction = 'list';
    }
    
    const baseExecution: ToolExecution = {
      tool_name: 'manage_goal',
      parameters: {
        action: finalAction,
        original_message: message,
        check_conflicts: true,
        auto_resolve: false,
        // Enhanced coaching context
        coaching_context: {
          domain: intentAnalysis.domain,
          depth_level: intentAnalysis.depth_level,
          coaching_type: intentAnalysis.coaching_type,
          follow_up_context: intentAnalysis.follow_up_context,
          specificity_needed: intentAnalysis.specificity_needed
        },
        ...parameters
      },
      user_id: userId,
      platform
    };
    
    console.log('✅ Created enhanced goal tool execution:', JSON.stringify(baseExecution, null, 2));
    return baseExecution;
  }

  /**
   * 🧠 ENHANCED PARAMETER EXTRACTION
   * Uses coaching context for better parameter understanding
   */
  private static async extractGoalParametersEnhanced(
    message: string, 
    action: string, 
    intentAnalysis: EnhancedIntentAnalysis
  ): Promise<any> {
    console.log(`🔍 Enhanced parameter extraction for action: ${action}`);
    
    const prompt = `Extract goal-related parameters from this user message using semantic understanding and coaching context.

User message: "${message}"
Action: ${action}
Domain: ${intentAnalysis.domain}
Depth Level: ${intentAnalysis.depth_level}
Coaching Type: ${intentAnalysis.coaching_type}
Follow-up Context: ${intentAnalysis.follow_up_context}
Specificity Needed: ${intentAnalysis.specificity_needed}

Extract these parameters considering the coaching context:
1. GOAL_REFERENCE: Which goal is the user referring to?
2. TITLE: Goal title for creation
3. TARGET_VALUE: Numeric target if specified
4. UNIT: Unit of measurement
5. GOAL_TYPE: habit/project/calendar (default: habit)
6. FREQUENCY: How often (daily, weekly, etc.)
7. PRIORITY: high/medium/low based on user's language
8. TIMEFRAME: when they want to achieve this
9. IMPLEMENTATION_LEVEL: basic/detailed/expert based on depth_level
10. COACHING_FOCUS: what type of coaching support they need

For different coaching types:
- TACTICAL: Focus on specific actions and methods
- STRATEGIC: Consider long-term planning and optimization
- IMPLEMENTATION: Break down into actionable steps
- TROUBLESHOOTING: Identify obstacles and solutions

Respond in this exact format:
GOAL_REFERENCE: [value or NONE]
TITLE: [value or NONE]  
TARGET_VALUE: [number or NONE]
UNIT: [value or NONE]
GOAL_TYPE: [habit/project/calendar or NONE]
FREQUENCY: [value or NONE]
PRIORITY: [high/medium/low or NONE]
TIMEFRAME: [value or NONE]
IMPLEMENTATION_LEVEL: [basic/detailed/expert or NONE]
COACHING_FOCUS: [actions/planning/motivation/troubleshooting or NONE]
REASONING: [Brief explanation]`;

    try {
      const response = await groq.getChatCompletion([
        { role: 'user', content: prompt, timestamp: new Date().toISOString() }
      ], 'taskmaster', 300);
      
      console.log('🔍 Enhanced parameter extraction response:', response);
      
      // Parse enhanced LLM response
      const lines = response.trim().split('\n');
      const params: any = {};
      
      lines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        if (value && value !== 'NONE') {
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
            case 'PRIORITY':
              if (['high', 'medium', 'low'].includes(value)) {
                params.priority = value;
              }
              break;
            case 'TIMEFRAME':
              params.timeframe = value;
              break;
            case 'IMPLEMENTATION_LEVEL':
              if (['basic', 'detailed', 'expert'].includes(value)) {
                params.implementation_level = value;
              }
              break;
            case 'COACHING_FOCUS':
              if (['actions', 'planning', 'motivation', 'troubleshooting'].includes(value)) {
                params.coaching_focus = value;
              }
              break;
            case 'REASONING':
              console.log('🧠 Enhanced reasoning:', value);
              break;
          }
        }
      });
      
      // Enhanced smart title update for coaching context
      if (action === 'update' && params.target_value && params.unit) {
        params.smart_title_update = {
          new_value: params.target_value,
          unit: params.unit,
          should_update_title: true,
          coaching_context: {
            domain: intentAnalysis.domain,
            implementation_level: params.implementation_level
          }
        };
      }
      
      console.log('✅ Enhanced parameters extracted:', JSON.stringify(params, null, 2));
      return params;
      
    } catch (error) {
      console.error('❌ Enhanced parameter extraction error:', error);
      return {};
    }
  }

  /**
   * 🧠 NEW: ENHANCED COACHING TOOL CREATION
   * Handles complex coaching needs beyond basic CRUD
   */
  private static async createEnhancedCoachingTool(
    message: string,
    userId: string,
    platform: Platform,
    intentAnalysis: EnhancedIntentAnalysis
  ): Promise<ToolExecution | null> {
    
    console.log('🎓 Creating enhanced coaching tool');
    
    // Only create coaching tool for non-basic interactions
    if (intentAnalysis.depth_level === 'surface' && intentAnalysis.coaching_type === 'informational') {
      return null;
    }
    
    return {
      tool_name: 'enhanced_coaching',
      parameters: {
        original_message: message,
        domain: intentAnalysis.domain,
        depth_level: intentAnalysis.depth_level,
        coaching_type: intentAnalysis.coaching_type,
        follow_up_context: intentAnalysis.follow_up_context,
        specificity_needed: intentAnalysis.specificity_needed,
        conversation_progression: intentAnalysis.conversation_progression,
        unresolved_needs: intentAnalysis.unresolved_needs
      },
      user_id: userId,
      platform
    };
  }

  /**
   * Fallback to basic analysis if enhanced fails
   * CRITICAL: Must use LLM-based semantic understanding, never keyword matching
   */
  private static async fallbackBasicAnalysis(
    message: string,
    userId: string,
    platform: Platform
  ): Promise<{ requiresTools: boolean; tools: ToolExecution[] }> {
    console.log('🔄 Falling back to basic LLM analysis (no keywords)');
    const tools: ToolExecution[] = [];
    
    try {
      // Use basic LLM analysis instead of keyword matching
      const prompt = `Analyze this message for goal management intent using semantic understanding.

User message: "${message}"

Determine if this message requires goal management tools:
1. Does the user want to see their current goals?
2. Are they asking about what they should do?
3. Are they looking for their goal status?

Respond with:
REQUIRES_GOAL_MANAGEMENT: YES/NO
ACTION: [list/create/update/delete or NONE]
CONFIDENCE: [high/medium/low]`;

      const response = await groq.getChatCompletion([
        { role: 'user', content: prompt, timestamp: new Date().toISOString() }
      ], 'taskmaster', 100);

      if (response && response.includes('REQUIRES_GOAL_MANAGEMENT: YES')) {
        const actionMatch = response.match(/ACTION: (\w+)/);
        const action = actionMatch ? actionMatch[1] : 'list';
        
        if (action !== 'NONE') {
          tools.push({
            tool_name: 'manage_goal',
            parameters: { action, original_message: message },
            user_id: userId,
            platform
          });
        }
      }
    } catch (error) {
      console.error('❌ Fallback LLM analysis failed:', error);
      // Last resort: assume goal listing if we can't analyze
      tools.push({
        tool_name: 'manage_goal',
        parameters: { action: 'list', original_message: message },
        user_id: userId,
        platform
      });
    }
    
    return { requiresTools: tools.length > 0, tools };
  }

  /**
   * 🧠 LLM-BASED PREFERENCE TOOL CREATION
   * (Keeping existing implementation)
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
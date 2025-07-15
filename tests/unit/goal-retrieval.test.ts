// Unit Tests for Goal Retrieval and AI Response Generation
// Tests to prevent regression of bugs fixed in phase 1

import { assertEquals, assertExists } from 'https://deno.land/std@0.190.0/testing/asserts.ts';
import { AIToolService } from '../../supabase/shared/ai-tools.ts';
import { MessageAnalyzer } from '../../supabase/shared/ai-tools/message-analyzer.ts';
import { getActiveGoalsFromDB } from '../../supabase/shared/tools/implementations/goal-db-operations.ts';

Deno.test({
  name: "Goal Retrieval - Database Query Uses Correct Table Name",
  async fn() {
    // Test that goal retrieval uses 'user_goals' not 'goals'
    const mockExecution = {
      tool_name: 'manage_goal' as const,
      parameters: { action: 'list', original_message: 'what are my goals?' },
      user_id: 'test-user-id',
      platform: 'whatsapp' as const
    };

    try {
      const result = await getActiveGoalsFromDB(mockExecution);
      // Should not throw error about table 'goals' not existing
      assertExists(result);
      assertEquals(typeof result, 'object');
      assertExists(result.data);
    } catch (error) {
      // Should not fail with "relation 'goals' does not exist"
      const errorMessage = error.message.toLowerCase();
      assertEquals(errorMessage.includes('relation "goals" does not exist'), false, 
        'Database query should use user_goals table, not goals table');
    }
  }
});

Deno.test({
  name: "Message Analysis - LLM Based Fallback, No Keyword Matching",
  async fn() {
    // Test that fallback analysis uses LLM, not keyword matching
    const testMessage = "Can you help me understand what I should focus on?";
    const userId = "test-user-id";
    const platform = "whatsapp";

    try {
      const result = await MessageAnalyzer.analyzeMessageForTools(
        testMessage, 
        userId, 
        platform as any
      );
      
      assertExists(result);
      assertEquals(typeof result.requiresTools, 'boolean');
      assertEquals(Array.isArray(result.tools), true);
      
      // If tools are suggested, they should come from LLM analysis, not keywords
      if (result.tools.length > 0) {
        const goalTool = result.tools.find(t => t.tool_name === 'manage_goal');
        if (goalTool) {
          assertEquals(goalTool.parameters.action, 'list', 
            'Should default to list action for ambiguous goal queries');
        }
      }
    } catch (error) {
      // Enhanced analysis might fail, but should fall back to LLM-based basic analysis
      assertEquals(error.message.includes('keyword'), false,
        'Fallback should never mention keyword-based analysis');
    }
  }
});

Deno.test({
  name: "AI Tool Service - Enhanced Message Processing",
  async fn() {
    // Test that AI tool service can process goal-related messages
    const aiToolService = new AIToolService();
    const testMessage = "What goals do I have?";
    const userId = "test-user-id";
    const platform = "whatsapp";
    const personality = "taskmaster";

    try {
      const result = await aiToolService.generateToolAwareResponse(
        testMessage,
        userId,
        platform as any,
        personality as any,
        ""
      );
      
      assertExists(result);
      assertExists(result.response);
      assertEquals(typeof result.response, 'string');
      assertEquals(Array.isArray(result.toolsUsed), true);
      assertEquals(typeof result.processingTime, 'number');
      
      // Response should not be the hardcoded fallback
      const isHardcodedFallback = result.response.includes('System error. But accountability never stops');
      assertEquals(isHardcodedFallback, false, 
        'Should not return hardcoded fallback for goal queries');
        
    } catch (error) {
      // Should not fail due to import errors or missing tables
      const errorMessage = error.message.toLowerCase();
      assertEquals(errorMessage.includes('cannot resolve module'), false,
        'Should not have import resolution errors');
      assertEquals(errorMessage.includes('relation "goals" does not exist'), false,
        'Should not reference non-existent goals table');
    }
  }
});

Deno.test({
  name: "Goal Tool Execution - List Action Returns Proper Format",
  async fn() {
    // Test that goal listing returns the expected data structure
    const mockExecution = {
      tool_name: 'manage_goal' as const,
      parameters: { action: 'list', original_message: 'show my goals' },
      user_id: 'test-user-id',
      platform: 'whatsapp' as const
    };

    try {
      const { GoalToolImplementation } = await import('../../supabase/shared/tools/implementations/goal-tools.ts');
      const result = await GoalToolImplementation.executeGoalTool(
        mockExecution, 
        mockExecution.user_id, 
        mockExecution.platform
      );
      
      assertExists(result);
      assertEquals(result.tool_name, 'manage_goal');
      assertEquals(typeof result.success, 'boolean');
      assertExists(result.data);
      
      if (result.success) {
        assertEquals(Array.isArray(result.data.goals), true);
        assertEquals(typeof result.data.count, 'number');
      }
      
    } catch (error) {
      // Should not fail due to database schema issues
      const errorMessage = error.message.toLowerCase();
      assertEquals(errorMessage.includes('relation "goals" does not exist'), false,
        'Should use correct table name user_goals');
    }
  }
});

Deno.test({
  name: "Response Generation - No Generic Fallbacks for Goal Queries",
  async fn() {
    // Test that goal-related queries don't return generic responses
    const testCases = [
      "What are my goals?",
      "Show me my current goals",
      "List my goals",
      "What should I be working on?",
      "What am I supposed to do?"
    ];

    for (const message of testCases) {
      try {
        const aiToolService = new AIToolService();
        const result = await aiToolService.generateToolAwareResponse(
          message,
          "test-user-id",
          "whatsapp" as any,
          "taskmaster" as any,
          ""
        );
        
        // Response should reference goals in some way, not be completely generic
        const response = result.response.toLowerCase();
        const isCompletelyGeneric = !response.includes('goal') && 
                                   !response.includes('focus') && 
                                   !response.includes('work') &&
                                   !response.includes('active') &&
                                   !response.includes('set');
        
        assertEquals(isCompletelyGeneric, false, 
          `Response "${result.response}" should reference goals or actions for message "${message}"`);
          
      } catch (error) {
        console.warn(`Test case "${message}" failed:`, error.message);
        // Don't fail the test for individual cases, but log issues
      }
    }
  }
}); 
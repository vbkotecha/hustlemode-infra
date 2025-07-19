import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getOrCreateUserByPhone, updateUserLastActive } from '../../shared/database/users.ts';
import { getConfig } from '../../shared/config.ts';
import { GroqService } from '../../shared/groq.ts';
import { executeTool } from '../../shared/tools/executor.ts';
import { MessageAnalyzerMinimal } from '../../shared/ai-tools/message-analyzer-minimal.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function handleChatRequest(request: Request): Promise<Response> {
  console.log('🚀 Chat request received');
  
  try {
    const { message, phone_number, personality } = await request.json();
    console.log(`📱 Processing: "${message}" from ${phone_number}`);
    
    if (!message || !phone_number) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: message and phone_number'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get or create user
    const user = await getOrCreateUserByPhone(phone_number);
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to get or create user'
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`👤 User resolved: ${user.id}`);
    
    // Get conversation context from memory
    const { MemoryService } = await import('../../shared/memory.ts');
    const recentMemories = await MemoryService.getMemories(user.id, 5);
    const conversationContext = recentMemories
      .slice(0, 3)
      .reverse()
      .map(memory => memory.memory)
      .join('\n');
    
    // **FIXED MESSAGE ANALYZER**: Using our rebuilt minimal version
    console.log('🔧 Using MessageAnalyzerMinimal (fixed version)');
    const validPersonality = (personality === 'taskmaster' || personality === 'cheerleader') ? personality : 'taskmaster';
    
    let toolsUsed: any[] = [];
    let finalResponse = '';
    const startTime = performance.now();
    
    // Step 1: Use MessageAnalyzerMinimal for tool detection
    const toolAnalysis = await MessageAnalyzerMinimal.analyzeMessageForTools(
      message,
      user.id,
      'api',
      conversationContext
    );
    
    console.log('🧪 Tool Analysis Result:', {
      requiresTools: toolAnalysis.requiresTools,
      toolCount: toolAnalysis.tools.length,
      toolNames: toolAnalysis.tools.map(t => t.tool_name)
    });
    
    // Step 2: Execute tools if detected
    if (toolAnalysis.requiresTools && toolAnalysis.tools.length > 0) {
      console.log(`🔧 Executing ${toolAnalysis.tools.length} tools...`);
      
      for (const toolExecution of toolAnalysis.tools) {
        try {
          const toolResult = await executeTool(toolExecution);
          toolsUsed.push(toolResult);
          
          if (toolResult.success && toolResult.response) {
            finalResponse = toolResult.response;
            console.log(`✅ Tool ${toolExecution.tool_name} succeeded: ${toolResult.response}`);
            break; // Use first successful tool result
          } else {
            console.log(`❌ Tool ${toolExecution.tool_name} failed: ${toolResult.error}`);
          }
        } catch (error) {
          console.error(`❌ Tool execution error for ${toolExecution.tool_name}:`, error);
        }
      }
    }
    
    // Step 3: If no tools or tool failed, generate normal AI response
    if (!finalResponse) {
      console.log('🤖 No tool result, generating AI response...');
      const groqService = new GroqService();
      
      const contextMessage = conversationContext 
        ? `Recent conversation:\n${conversationContext}\n\nCurrent message: ${message}`
        : message;
      
      const messages = [{ 
        role: 'user' as const, 
        content: contextMessage, 
        timestamp: new Date().toISOString() 
      }];
      
      finalResponse = await groqService.getChatCompletion(messages, validPersonality);
    }
    
    const processingTime = performance.now() - startTime;
    
    console.log(`🤖 Final Response (${validPersonality}): ${finalResponse}`);
    console.log(`🔧 MessageAnalyzer: ${toolAnalysis.requiresTools ? 'tools detected' : 'no tools'}`);
    console.log(`🔧 Tools executed: ${toolsUsed.length}, Processing: ${processingTime.toFixed(1)}ms`);
    
    // Store conversation in memory
    await MemoryService.addMemory(
      `User: ${message}\nAI (${validPersonality}): ${finalResponse}`,
      user.id,
      'chat_api'
    );
    
    // Update user's last activity
    await updateUserLastActive(user.id);

    return new Response(JSON.stringify({
      success: true,
      data: {
        response: finalResponse,
        personality: validPersonality,
        user_id: user.id,
        processing_time_ms: processingTime,
        memory_provider: 'postgresql',
        context_used: !!conversationContext,
        tools_used: toolsUsed.length,
        tool_names: toolsUsed.map(t => t.tool_name || 'unknown'),
        system: 'messageAnalyzer_minimal_fixed',
        analyzer_detected_tools: toolAnalysis.requiresTools,
        analyzer_tool_count: toolAnalysis.tools.length
      },
      timestamp: new Date().toISOString()
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('❌ Chat request failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      debug: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
} 
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AIToolService } from '../../shared/ai-tools.ts';
import { getUserOrCreate, updateUserLastActive } from '../../shared/users.ts';
import { getConfig } from '../../shared/config.ts';

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
    
    // Get or create user (same as WhatsApp function)
    const user = await getUserOrCreate(phone_number);
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
    
    // Use enhanced AI tool system (same as WhatsApp function)
    console.log('🔧 Using tool-aware AI system for chat');
    const aiToolService = new AIToolService();
    
    // Get conversation context from memory
    const { MemoryService } = await import('../../shared/memory.ts');
    const recentMemories = await MemoryService.getMemories(user.id, 5);
    const conversationContext = recentMemories
      .slice(0, 3)
      .reverse()
      .map(memory => memory.memory)
      .join('\n');
    
    // Generate tool-aware response
    const validPersonality = (personality === 'taskmaster' || personality === 'cheerleader') ? personality : 'taskmaster';
    const { response, toolsUsed, processingTime } = await aiToolService.generateToolAwareResponse(
      message,
      user.id,
      'api',
      validPersonality,
      conversationContext
    );
    
    console.log(`🤖 Enhanced AI Response (${validPersonality}): ${response}`);
    console.log(`🔧 Tools used: ${toolsUsed.length}, Processing: ${processingTime.toFixed(1)}ms`);
    
    // Update user's last activity
    await updateUserLastActive(user.id);

    return new Response(JSON.stringify({
      success: true,
      data: {
        response: response,
        personality: validPersonality,
        user_id: user.id,
        processing_time_ms: processingTime,
        memory_provider: Deno.env.get('MEMORY_PROVIDER') || 'postgresql',
        tools_used: toolsUsed.length,
        tool_names: toolsUsed.map(t => t.tool_name)
      },
      timestamp: new Date().toISOString()
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('❌ Chat request failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
} 
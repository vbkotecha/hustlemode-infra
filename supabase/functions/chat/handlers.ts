import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getConfig } from '../../shared/config.ts';
import { AIToolService } from '../../shared/ai-tools.ts';
import { WhatsAppAdapter } from '../../shared/platforms/whatsapp-adapter.ts';
import { getUserOrCreate, updateUserLastActive } from '../../shared/users.ts';

export interface ChatRequest {
  message: string;
  user_id?: string;
  phone_number?: string;
  personality?: string;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    response: string;
    personality: string;
    user_id: string;
    processing_time_ms: number;
    memory_provider: string;
    tools_used?: number;
    tool_names?: string[];
  };
  error?: string;
  processing_time_ms?: number;
  timestamp: string;
}

export async function processChatRequest(request: ChatRequest): Promise<ChatResponse> {
  const startTime = Date.now();
  
  try {
    const config = getConfig();
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    const { message, user_id, phone_number, personality = 'taskmaster' } = request;

    // Validate required fields
    if (!message || (!user_id && !phone_number)) {
      throw new Error('Missing required fields: message and (user_id or phone_number)');
    }

    console.log(`💬 Processing chat for user: ${user_id || phone_number}`);

    // Resolve user_id from phone_number if needed
    const resolvedUserId = await resolveUserId(user_id, phone_number, supabase);
    console.log(`👤 Resolved user ID: ${resolvedUserId}`);

    // Use enhanced AI tool system for all messages
    const validPersonality = (personality === 'taskmaster' || personality === 'cheerleader') ? personality : 'taskmaster';
    
    console.log('🔧 Using tool-aware AI system for chat');
    const aiToolService = new AIToolService();
    
    // Get conversation context from memory
    const { MemoryService } = await import('../../shared/memory.ts');
    const recentMemories = await MemoryService.getMemories(resolvedUserId, 5);
    const conversationContext = recentMemories
      .slice(0, 3)
      .reverse()
      .map(memory => memory.memory)
      .join('\n');
    
    // Generate tool-aware response
    const { response, toolsUsed, processingTime } = await aiToolService.generateToolAwareResponse(
      message,
      resolvedUserId,
      'api', // platform for chat API
      validPersonality,
      conversationContext
    );
    
    // Format response (no platform-specific formatting for API)
    const finalResponse = response;
    
    console.log(`🤖 Enhanced AI Response (${validPersonality}): ${finalResponse}`);
    console.log(`🔧 Tools used: ${toolsUsed.length}, Processing: ${processingTime.toFixed(1)}ms`);

    // Update user's last activity
    await updateUserLastActive(resolvedUserId);

    const responseTime = Date.now() - startTime;
    console.log(`⚡ Chat completed in ${responseTime}ms`);

    return {
      success: true,
      data: {
        response: finalResponse,
        personality: validPersonality,
        user_id: resolvedUserId,
        processing_time_ms: responseTime,
        memory_provider: Deno.env.get('MEMORY_PROVIDER') || 'postgresql',
        tools_used: toolsUsed.length,
        tool_names: toolsUsed.map(t => t.tool_name)
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Chat processing error:', error);
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      error: error.message || 'Internal server error',
      processing_time_ms: responseTime,
      timestamp: new Date().toISOString()
    };
  }
}

async function resolveUserId(user_id?: string, phone_number?: string, supabase?: any): Promise<string> {
  if (user_id) {
    return user_id;
  }
  
  if (phone_number) {
    const user = await getUserOrCreate(phone_number);
    if (!user) {
      throw new Error('User not found');
    }
    return user.id;
  }
  
  throw new Error('No user identification provided');
} 
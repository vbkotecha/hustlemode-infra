import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getConfig } from '../../shared/config.ts';
import { generateAIResponse } from '../../shared/ai.ts';
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

    // Generate AI response using shared service
    const aiResponse = await generateAIResponse(message, resolvedUserId, personality);
    
    if (!aiResponse) {
      throw new Error('Failed to generate AI response');
    }

    console.log(`🤖 AI Response (${personality}): ${aiResponse}`);

    // Update user's last activity
    await updateUserLastActive(resolvedUserId, supabase);

    const responseTime = Date.now() - startTime;
    console.log(`⚡ Chat completed in ${responseTime}ms`);

    return {
      success: true,
      data: {
        response: aiResponse,
        personality,
        user_id: resolvedUserId,
        processing_time_ms: responseTime,
        memory_provider: Deno.env.get('MEMORY_PROVIDER') || 'postgresql'
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
    const user = await getUserOrCreate(phone_number, supabase);
    if (!user) {
      throw new Error('User not found');
    }
    return user.id;
  }
  
  throw new Error('No user identification provided');
} 
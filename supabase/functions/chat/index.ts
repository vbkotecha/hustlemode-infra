import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getConfig } from '../../shared/config.ts';
import { MemoryService } from '../../shared/memory.ts';

// Universal Chat Edge Function
// POST /functions/v1/chat
Deno.serve(async (req: Request) => {
  const startTime = Date.now();
  
  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const config = getConfig();
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const { message, user_id, phone_number, personality = 'taskmaster' } = await req.json();

    if (!message || (!user_id && !phone_number)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: message and (user_id or phone_number)',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log(`💬 Processing chat for user: ${user_id || phone_number}`);

    // Resolve user_id from phone_number if needed
    let resolvedUserId = user_id;
    if (!resolvedUserId && phone_number) {
      // Ensure phone number has + prefix for database lookup
      const formattedPhoneNumber = phone_number.startsWith('+') ? phone_number : `+${phone_number}`;
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', formattedPhoneNumber)
        .single();

      if (userError) {
        console.error('❌ User lookup error:', userError);
        return new Response(JSON.stringify({
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString()
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      resolvedUserId = userData.id;
    }

    console.log(`👤 Resolved user ID: ${resolvedUserId}`);

    // Get recent conversation context using Memory Service
    const recentMemories = await MemoryService.getMemories(resolvedUserId, 50);
    
    // Build conversation context
    const conversationContext = recentMemories
      .slice(0, 30) // Last 30 exchanges for rich context
      .reverse() // Chronological order
      .map(memory => `Previous: ${memory.memory}`)
      .join('\n');

    // Personality-based system prompts
    const personalityPrompts = {
      taskmaster: `You are David Goggins, the ultimate tough love coach. Be BRUTAL, direct, and uncompromising. No excuses, no sympathy - just pure motivation and accountability. Keep responses 8-12 words max. Examples: "Stop making excuses. Get after it NOW." or "Weak mindset. Do better. No shortcuts."`,
      
      cheerleader: `You are an enthusiastic, positive coach who celebrates every win. Be encouraging, energetic, and supportive while maintaining accountability. Keep responses 8-12 words max. Examples: "Amazing progress! Keep that momentum going!" or "You've got this! One step closer!"`
    };

    // Create AI prompt with context
    const prompt = `${personalityPrompts[personality as keyof typeof personalityPrompts]}

Context from previous conversations:
${conversationContext || 'First conversation with this user.'}

User's current message: "${message}"

Respond with brutal honesty and motivation in exactly 8-12 words. Stay in character.`;

    // Generate AI response using Groq
    const aiResponse = await generateGroqResponse(prompt);
    
    if (!aiResponse) {
      throw new Error('Failed to generate AI response');
    }

    console.log(`🤖 AI Response (${personality}): ${aiResponse}`);

    // Store conversation in memory using Memory Service
    await MemoryService.addMemory(
      `User: ${message}\nAI (${personality}): ${aiResponse}`,
      resolvedUserId,
      {
        personality,
        platform: 'api',
        intent: 'general_chat',
        timestamp: new Date().toISOString(),
      }
    );

    // Update user's last activity
    await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', resolvedUserId);

    const responseTime = Date.now() - startTime;
    console.log(`⚡ Chat completed in ${responseTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        response: aiResponse,
        personality,
        user_id: resolvedUserId,
        processing_time_ms: responseTime,
        context_used: recentMemories.length > 0,
        memory_provider: Deno.env.get('MEMORY_PROVIDER') || 'postgresql'
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('❌ Chat processing error:', error);
    
    const responseTime = Date.now() - startTime;
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      processing_time_ms: responseTime,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// Generate AI response using Groq
async function generateGroqResponse(prompt: string): Promise<string | null> {
  try {
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const groqModel = Deno.env.get('GROQ_MODEL') || 'meta-llama/llama-4-maverick-17b-128e-instruct';
    
    if (!groqApiKey) {
      console.error('❌ Missing GROQ_API_KEY');
      return null;
    }

    console.log(`🤖 Using Groq model: ${groqModel}`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [
          {
            role: 'system',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || null;
    
    // Remove surrounding quotes if present
    if (content && content.startsWith('"') && content.endsWith('"')) {
      return content.slice(1, -1);
    }
    
    return content;

  } catch (error) {
    console.error('❌ Groq API error:', error);
    return null;
  }
} 
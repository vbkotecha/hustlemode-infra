// Chat API Edge Function - Enhanced with Tool System
// POST /functions/v1/chat

Deno.serve(async (req: Request) => {
  console.log(`🚀 Chat API called: ${req.method} ${req.url}`);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await req.json();
    const { message, phone_number, personality } = body;
    
    console.log(`📱 Processing chat: "${message}" from ${phone_number}`);
    
    if (!message || !phone_number) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: message and phone_number'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Import services (same pattern as WhatsApp function)
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const { getOrCreateUserByPhone } = await import('../../shared/database/users.ts');
    const { AIToolService } = await import('../../shared/ai-tools.ts');
    const { MemoryService } = await import('../../shared/memory.ts');
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration');
      return new Response(JSON.stringify({
        success: false,
        error: 'Server configuration error'
      }), { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get or create user
    const user = await getOrCreateUserByPhone(phone_number);
    if (!user) {
      console.error('❌ Failed to get or create user');
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to get or create user'
      }), { status: 500 });
    }
    
    console.log(`👤 User resolved: ${user.id}`);
    
    // Use enhanced AI tool system (same as WhatsApp function)
    console.log('🔧 Using tool-aware AI system for chat');
    const aiToolService = new AIToolService();
    
    // Get conversation context from memory
    const recentMemories = await MemoryService.getMemories(user.id, 5);
    const conversationContext = recentMemories
      .slice(0, 3)
      .reverse()
      .map(memory => memory.memory)
      .join('\n');
    
    // Generate tool-aware response
    const validPersonality = 'taskmaster'; // Only personality available now
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
    await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', user.id);

    return new Response(JSON.stringify({
      success: true,
      data: {
        response: response,
        personality: validPersonality,
        user_id: user.id,
        processing_time_ms: processingTime,
        tools_used: toolsUsed.length,
        tool_names: toolsUsed.map(t => t.tool_name),
        tool_results: toolsUsed
      },
      timestamp: new Date().toISOString()
    }), { 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      } 
    });

  } catch (error) {
    console.error('❌ Chat API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Internal server error: ${error.message}`,
      stack: error.stack
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}); 
// WhatsApp Webhook Edge Function - Uses Same Logic as Chat Function
// GET/POST /functions/v1/whatsapp

Deno.serve(async (req: Request) => {
  console.log(`🔥 WhatsApp webhook called: ${req.method} ${req.url}`);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      }
    });
  }

  try {
    // GET request - WhatsApp webhook verification
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'fa22d4e7-cba4-48cf-9b36-af6190bf9c67';
      
      console.log(`🔗 Verification: mode=${mode}, token=${token}, challenge=${challenge}`);
      
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('✅ WhatsApp webhook verified');
        return new Response(challenge, { 
          status: 200, 
          headers: { 'Content-Type': 'text/plain' }
        });
      } else {
        console.log('❌ WhatsApp webhook verification failed');
        return new Response('Forbidden', { status: 403 });
      }
    }

    // POST request - Incoming WhatsApp message  
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('📱 WhatsApp webhook payload received:', JSON.stringify(body, null, 2));
      
      // Process WhatsApp messages
      if (body.entry && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          if (entry.changes && Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              if (change.field === 'messages' && change.value && change.value.messages) {
                for (const message of change.value.messages) {
                  await processWhatsAppMessage(message);
                }
              }
            }
          }
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Webhook processed',
        timestamp: new Date().toISOString()
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error) {
    console.error('❌ WhatsApp webhook error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), { status: 500 });
  }
});

// Message processing using SAME logic as chat function
async function processWhatsAppMessage(message: any) {
  try {
    const rawPhoneNumber = message.from;
    const phoneNumber = rawPhoneNumber.startsWith('+') ? rawPhoneNumber : `+${rawPhoneNumber}`;
    const messageText = message.text?.body;
    
    if (!messageText) {
      console.log('⚠️ No text content in message');
      return;
    }
    
    console.log(`💬 Processing WhatsApp message from ${phoneNumber}: "${messageText}"`);
    
    // Use same imports as chat function
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const { AIToolService } = await import('../../shared/ai-tools.ts');
    const { WhatsAppAdapter } = await import('../../shared/platforms/whatsapp-adapter.ts');
          const { getOrCreateUserByPhone, updateUserLastActive } = await import('../../shared/database/users.ts');
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get or create user
          const user = await getOrCreateUserByPhone(phoneNumber);
    if (!user) {
      console.error('❌ Failed to get or create user');
      return;
    }
    
    console.log(`👤 User resolved: ${user.id}`);
    
    // Use enhanced AI tool system (same as chat function)
    console.log('🔧 Using tool-aware AI system for WhatsApp');
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
    const { response, toolsUsed, processingTime } = await aiToolService.generateToolAwareResponse(
      messageText,
      user.id,
      'whatsapp',
      'taskmaster', // Only personality available now
      conversationContext
    );
    
    // Format response for WhatsApp platform
    const platformResponse = WhatsAppAdapter.formatToolResults(toolsUsed, response, 'taskmaster');
    
    console.log(`🤖 Enhanced AI Response (taskmaster): ${platformResponse.text}`);
    console.log(`🔧 Tools used: ${toolsUsed.length}, Processing: ${processingTime.toFixed(1)}ms`);
    
    // Send WhatsApp response
    const { WhatsAppService } = await import('../../shared/whatsapp.ts');
    const whatsappService = new WhatsAppService();
    const success = await whatsappService.sendMessage(phoneNumber, platformResponse.text);
    
    if (success) {
      console.log(`✅ Response sent to WhatsApp ${phoneNumber}`);
      await updateUserLastActive(user.id);
    } else {
      console.error(`❌ Failed to send response to WhatsApp ${phoneNumber}`);
    }
    
  } catch (error) {
    console.error('❌ Error processing WhatsApp message:', error);
  }
} 
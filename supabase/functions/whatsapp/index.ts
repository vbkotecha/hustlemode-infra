// WhatsApp Webhook Edge Function - Full Functionality (No Auth Required)
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

// Message processing function (inline to avoid imports causing auth issues)
async function processWhatsAppMessage(message: any) {
  try {
    const rawPhoneNumber = message.from;
    const phoneNumber = rawPhoneNumber.startsWith('+') ? rawPhoneNumber : `+${rawPhoneNumber}`;
    const messageText = message.text?.body;
    
    if (!messageText) {
      console.log('⚠️ No text content in message');
      return;
    }
    
    console.log(`💬 Processing message from ${phoneNumber}: "${messageText}"`);
    
    // Import and process message using the enhanced tool system
    const { processMessage } = await import('./message-processor.ts');
    
    // Create Supabase client for message processing
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    await processMessage(message, supabase);
    
  } catch (error) {
    console.error('❌ Error processing WhatsApp message:', error);
  }
} 
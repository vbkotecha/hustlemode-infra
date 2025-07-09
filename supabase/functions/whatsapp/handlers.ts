// WhatsApp Message Handlers
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processMessage } from './message-processor.ts';
export async function handleWebhookVerification(url: URL): Promise<Response> {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'fa22d4e7-cba4-48cf-9b36-af6190bf9c67';
  
  console.log('🔗 WhatsApp webhook verification request');
  console.log(`Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WhatsApp webhook verified successfully');
    return new Response(challenge, { 
      status: 200, 
      headers: { 'Content-Type': 'text/plain' }
    });
  } else {
    console.error('❌ WhatsApp webhook verification failed');
    return new Response('Forbidden', { status: 403 });
  }
}
export async function handleIncomingMessage(body: any): Promise<Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration');
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Configuration error' 
    }), { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  // Process WhatsApp messages
  if (body.entry && Array.isArray(body.entry)) {
    for (const entry of body.entry) {
      if (entry.changes && Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value && change.value.messages) {
            for (const message of change.value.messages) {
              await processMessage(message, supabase);
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
  }), { status: 200 });
}
// Message processing logic moved to message-processor.ts 
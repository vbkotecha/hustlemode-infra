// WhatsApp Message Handlers - Extracted from main function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateAIResponse } from '../../shared/ai.ts';
import { WhatsAppService } from '../../shared/whatsapp.ts';

const whatsappService = new WhatsAppService();

export async function handleWebhookVerification(url: URL): Promise<Response> {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  console.log('🔗 WhatsApp webhook verification request');
  console.log(`Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);

  if (mode === 'subscribe' && token === 'fa22d4e7-cba4-48cf-9b36-af6190bf9c67') {
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

async function processMessage(message: any, supabase: any) {
  try {
    const rawPhoneNumber = message.from;
    const phoneNumber = rawPhoneNumber.startsWith('+') ? rawPhoneNumber : `+${rawPhoneNumber}`;
    const messageText = message.text?.body;
    
    if (!messageText) {
      console.log('⚠️ No text content in message');
      return;
    }

    console.log(`💬 Processing message from ${phoneNumber}: "${messageText}"`);

    // Use shared user service
    const { getUserOrCreate } = await import('../../shared/users.ts');
    const user = await getUserOrCreate(phoneNumber, supabase);
    
    if (!user) {
      console.error('❌ Failed to get or create user');
      return;
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('default_personality, ai_memory_enabled')
      .eq('user_id', user.id)
      .single();

    const personality = preferences?.default_personality || 'taskmaster';

    // Generate AI response using shared service
    const aiResponse = await generateAIResponse(messageText, user.id, personality);
    
    if (!aiResponse) {
      console.error('❌ Failed to generate AI response');
      return;
    }

    console.log(`🤖 AI Response (${personality}): ${aiResponse}`);

    // Send response via WhatsApp
    const success = await whatsappService.sendMessage(rawPhoneNumber, aiResponse);
    
    if (success) {
      console.log(`✅ Response sent to WhatsApp ${rawPhoneNumber}`);
      
      // Update user last activity
      await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', user.id);
    } else {
      console.error(`❌ Failed to send response to WhatsApp ${rawPhoneNumber}`);
    }

  } catch (error) {
    console.error('❌ Error processing message:', error);
  }
} 
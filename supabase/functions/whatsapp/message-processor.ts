// WhatsApp Message Processing Logic - Simplified for testing
import { generateAIResponse } from '../../shared/ai-response.ts';
import { WhatsAppService } from '../../shared/whatsapp.ts';

// Lazy-loaded WhatsAppService to prevent import-time initialization
let _whatsappService: WhatsAppService | null = null;
function getWhatsAppService(): WhatsAppService {
  if (!_whatsappService) {
    _whatsappService = new WhatsAppService();
  }
  return _whatsappService;
}

export async function processMessage(message: any, supabase: any) {
  try {
    const rawPhoneNumber = message.from;
    const phoneNumber = rawPhoneNumber.startsWith('+') ? rawPhoneNumber : `+${rawPhoneNumber}`;
    const messageText = message.text?.body;
    
    if (!messageText) {
      console.log('⚠️ No text content in message');
      return;
    }
    
    console.log(`💬 Processing message from ${phoneNumber}: "${messageText}"`);
    
    const { getOrCreateUserByPhone } = await import('../../shared/database/users.ts');
    const user = await getOrCreateUserByPhone(phoneNumber);
    
    if (!user) {
      console.error('❌ Failed to get or create user');
      return;
    }
    
    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('default_personality, ai_memory_enabled, accountability_level')
      .eq('user_id', user.id)
      .single();
    
    const personality = preferences?.default_personality || 'taskmaster';
    
    // Use simple AI response for now
    const aiResponse = await generateAIResponse(messageText, user.id, personality);
    if (aiResponse) {
      await sendWhatsAppResponse(phoneNumber, aiResponse, user.id, supabase);
    }
    
  } catch (error) {
    console.error('❌ Error processing message:', error);
    await handleFallback(message, rawPhoneNumber, supabase);
  }
}

async function handleFallback(message: any, phoneNumber: string, supabase: any) {
  try {
    const { getOrCreateUserByPhone } = await import('../../shared/database/users.ts');
    const user = await getOrCreateUserByPhone(phoneNumber);
    if (user) {
      const fallbackResponse = await generateAIResponse(message.text?.body, user.id, 'taskmaster');
      if (fallbackResponse) {
        await sendWhatsAppResponse(phoneNumber, fallbackResponse, user.id, supabase);
      }
    }
  } catch (fallbackError) {
    console.error('❌ Fallback response also failed:', fallbackError);
  }
}

async function sendWhatsAppResponse(phoneNumber: string, response: string, userId: string, supabase: any) {
  const success = await getWhatsAppService().sendMessage(phoneNumber, response);
  
  if (success) {
    console.log(`✅ Response sent to WhatsApp ${phoneNumber}`);
    
    // Update user last activity
    await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId);
  } else {
    console.error(`❌ Failed to send response to WhatsApp ${phoneNumber}`);
  }
} 
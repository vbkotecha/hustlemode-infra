// WhatsApp Message Processing Logic
import { generateAIResponse } from '../../shared/ai-response.ts';
import { AIToolService } from '../../shared/ai-tools.ts';
import { WhatsAppAdapter } from '../../shared/platforms/whatsapp-adapter.ts';
import { WhatsAppService } from '../../shared/whatsapp.ts';

const whatsappService = new WhatsAppService();

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
    
    // Check if we should use fast path for simple messages
    if (WhatsAppAdapter.shouldUseFastPath(messageText)) {
      await handleSimpleMessage(messageText, user, personality, rawPhoneNumber, supabase);
      return;
    }
    
    // Use enhanced AI tool system for complex messages
    await handleComplexMessage(messageText, user, personality, rawPhoneNumber, supabase);
    
  } catch (error) {
    console.error('❌ Error processing message:', error);
    await handleFallback(message, rawPhoneNumber, supabase);
  }
}

async function handleSimpleMessage(
  messageText: string, 
  user: any, 
  personality: string, 
  phoneNumber: string, 
  supabase: any
) {
  console.log('🚀 Using fast path for simple message');
  const aiResponse = await generateAIResponse(messageText, user.id, personality);
  if (aiResponse) {
    await sendWhatsAppResponse(phoneNumber, aiResponse, user.id, supabase);
  }
}

async function handleComplexMessage(
  messageText: string, 
  user: any, 
  personality: string, 
  phoneNumber: string, 
  supabase: any
) {
  console.log('🔧 Using tool-aware AI system');
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
    personality,
    conversationContext
  );
  
  // Format response for WhatsApp platform
  const platformResponse = WhatsAppAdapter.formatToolResults(toolsUsed, response, personality);
  
  console.log(`🤖 Enhanced AI Response (${personality}): ${platformResponse.text}`);
  console.log(`🔧 Tools used: ${toolsUsed.length}, Processing: ${processingTime.toFixed(1)}ms`);
  
  // Send response via WhatsApp
  await sendWhatsAppResponse(phoneNumber, platformResponse.text, user.id, supabase);
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
  const success = await whatsappService.sendMessage(phoneNumber, response);
  
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
import type { WhatsAppWebhookData } from './types.ts';
import { getConfig, WHATSAPP_BASE_URL } from './config.ts';

export class WhatsAppService {
  private token: string;
  private phoneNumberId: string;
  private verifyToken: string;

  constructor() {
    const config = getConfig();
    this.token = config.WHATSAPP_TOKEN;
    this.phoneNumberId = config.WHATSAPP_PHONE_NUMBER_ID;
    this.verifyToken = config.WHATSAPP_VERIFY_TOKEN;
  }

  verifyWebhook(params: URLSearchParams): { isValid: boolean; challenge?: string } {
    const mode = params.get('hub.mode');
    const token = params.get('hub.verify_token');
    const challenge = params.get('hub.challenge');

    if (mode === 'subscribe' && token === this.verifyToken) {
      console.log('✅ WhatsApp webhook verified successfully');
      return { isValid: true, challenge: challenge || '' };
    }
    console.warn('❌ WhatsApp webhook verification failed');
    return { isValid: false };
  }

  extractMessageData(data: WhatsAppWebhookData): { phoneNumber: string | null; message: string | null; messageId: string | null } {
    try {
      const messageData = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!messageData) return { phoneNumber: null, message: null, messageId: null };
      
      return {
        phoneNumber: messageData.from,
        message: messageData.text?.body || null,
        messageId: messageData.id,
      };
    } catch (error) {
      console.error('❌ Error extracting WhatsApp message data:', error);
      return { phoneNumber: null, message: null, messageId: null };
    }
  }

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`${WHATSAPP_BASE_URL}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: { body: message },
        }),
      });

      if (!response.ok) {
        console.error(`❌ WhatsApp send error ${response.status}`);
        return false;
      }
      console.log(`📤 Message sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('❌ WhatsApp send message error:', error);
      return false;
    }
  }

  async detectPersonalityCommand(message: string): Promise<{ isCommand: boolean; personality?: string }> {
    // ✅ SEMANTIC LLM ANALYSIS - No keyword matching
    const analysisPrompt = `
Analyze this message for personality switching intent:

Message: "${message}"

Available personalities:
- taskmaster (tough love, accountability, discipline)
- cheerleader (positive, encouraging, celebrating)

Does the user want to switch AI personality modes? Respond in JSON:
{
  "isPersonalityCommand": boolean,
  "targetPersonality": "taskmaster|cheerleader|null",
  "confidence": number (0-100),
  "reasoning": "semantic understanding explanation"
}

Use semantic understanding, not keyword matching.`;

    try {
      const { GroqService } = await import('./groq.ts');
      const groqService = new GroqService();
      
      const response = await groqService.getChatCompletion([{
        role: 'user',
        content: analysisPrompt,
        timestamp: new Date().toISOString()
      }], 'taskmaster', 150);

      const analysis = JSON.parse(response.replace(/```json\n?|\n?```/g, ''));
      
      return {
        isCommand: analysis.isPersonalityCommand && analysis.confidence > 70,
        personality: analysis.targetPersonality
      };
    } catch (error) {
      console.error('❌ Personality detection LLM failed:', error);
      return { isCommand: false };
    }
  }
} 
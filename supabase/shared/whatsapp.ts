import type { WhatsAppWebhookData } from './types.ts';
import { getConfig, WHATSAPP_BASE_URL, PERFORMANCE } from './config.ts';

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

  // Webhook verification for WhatsApp
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

  // Extract phone number and message from WhatsApp webhook data
  extractMessageData(data: WhatsAppWebhookData): { phoneNumber: string | null; message: string | null; messageId: string | null } {
    try {
      if (!data.entry || data.entry.length === 0) {
        return { phoneNumber: null, message: null, messageId: null };
      }

      const entry = data.entry[0];
      if (!entry.changes || entry.changes.length === 0) {
        return { phoneNumber: null, message: null, messageId: null };
      }

      const change = entry.changes[0];
      const value = change.value;
      
      if (!value.messages || value.messages.length === 0) {
        return { phoneNumber: null, message: null, messageId: null };
      }

      const messageData = value.messages[0];
      
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

  // Send message to WhatsApp user
  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const url = `${WHATSAPP_BASE_URL}/${this.phoneNumberId}/messages`;
      
      const body = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message,
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PERFORMANCE.WHATSAPP_TIMEOUT_MS);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ WhatsApp send error ${response.status}: ${errorData}`);
        return false;
      }

      console.log(`📤 Message sent to ${phoneNumber}`);
      return true;

    } catch (error) {
      console.error('❌ WhatsApp send message error:', error);
      return false;
    }
  }

  // Check if message is a personality switch command
  detectPersonalityCommand(message: string): { isCommand: boolean; personality?: string } {
    const lowerMessage = message.toLowerCase().trim();
    
    const commands = {
      'switch to taskmaster': 'taskmaster',
      'switch to cheerleader': 'cheerleader',
      'taskmaster mode': 'taskmaster',
      'cheerleader mode': 'cheerleader',
      'tough love': 'taskmaster',
      'positive mode': 'cheerleader',
      '/taskmaster': 'taskmaster',
      '/cheerleader': 'cheerleader',
    };

    for (const [command, personality] of Object.entries(commands)) {
      if (lowerMessage.includes(command)) {
        return { isCommand: true, personality };
      }
    }

    return { isCommand: false };
  }

  // Health check for WhatsApp API
  async checkHealth(): Promise<{ healthy: boolean; latency: number }> {
    const startTime = Date.now();
    
    try {
      const url = `${WHATSAPP_BASE_URL}/${this.phoneNumberId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const latency = Date.now() - startTime;
      
      return {
        healthy: response.ok,
        latency,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
      };
    }
  }
} 
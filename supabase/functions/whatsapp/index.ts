// WhatsApp Webhook Edge Function - Refactored for size compliance
import { handleWebhookVerification, handleIncomingMessage } from './handlers.ts';

Deno.serve(async (req: Request) => {
  console.log(`🔥 WhatsApp webhook: ${req.method} ${req.url}`);
  
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
      return await handleWebhookVerification(url);
    }

    // POST request - Incoming WhatsApp message  
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('📱 WhatsApp webhook payload:', JSON.stringify(body, null, 2));
      return await handleIncomingMessage(body);
    }

    // Unsupported method
    return new Response('Method not allowed', { 
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ WhatsApp webhook error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}); 
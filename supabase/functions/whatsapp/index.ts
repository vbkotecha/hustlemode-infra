import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// WhatsApp Webhook Edge Function - No Authentication Required
// GET/POST /functions/v1/whatsapp
Deno.serve(async (req: Request) => {
  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // GET request - WhatsApp webhook verification (Meta for Developers)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log('🔗 WhatsApp webhook verification request');
      console.log(`Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);

      // Check if this is a webhook verification request
      if (mode === 'subscribe' && token === 'fa22d4e7-cba4-48cf-9b36-af6190bf9c67') {
        console.log('✅ WhatsApp webhook verified successfully');
        return new Response(challenge, { 
          status: 200, 
          headers: {
            'Content-Type': 'text/plain',
            ...corsHeaders
          }
        });
      } else {
        console.error('❌ WhatsApp webhook verification failed');
        console.error(`Expected token: fa22d4e7-cba4-48cf-9b36-af6190bf9c67, Got: ${token}`);
        return new Response('Forbidden', { 
          status: 403, 
          headers: {
            'Content-Type': 'text/plain',
            ...corsHeaders
          }
        });
      }
    }

    // POST request - Incoming WhatsApp message  
    if (req.method === 'POST') {
      const body = await req.json();
      
      console.log('📱 Incoming WhatsApp webhook:', JSON.stringify(body, null, 2));

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase configuration');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Configuration error' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
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
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Method not allowed
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Method not allowed' 
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('❌ WhatsApp webhook error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

// Process individual WhatsApp message
async function processMessage(message: any, supabase: any) {
  try {
    const rawPhoneNumber = message.from;
    // Ensure phone number has + prefix for database constraint
    const phoneNumber = rawPhoneNumber.startsWith('+') ? rawPhoneNumber : `+${rawPhoneNumber}`;
    const messageText = message.text?.body;
    
    if (!messageText) {
      console.log('⚠️ No text content in message');
      return;
    }

    console.log(`💬 Processing message from ${rawPhoneNumber} (stored as ${phoneNumber}): "${messageText}"`);

    // Find or create user
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, phone_number')
      .eq('phone_number', phoneNumber)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // Create new user
      console.log(`👤 Creating new user for ${phoneNumber} (from WhatsApp ${rawPhoneNumber})`);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone_number: phoneNumber,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
        .select('id, phone_number')
        .single();

      if (createError) {
        console.error('❌ Failed to create user:', createError);
        return;
      }

      userData = newUser;
      
      // Create default preferences
      await supabase
        .from('user_preferences')
        .insert({
          user_id: userData.id,
          default_personality: 'taskmaster',
          groq_temperature: 0.8,
          ai_memory_enabled: true
        });

      console.log(`✅ Created new user with ID: ${userData.id}`);
    } else if (userError) {
      console.error('❌ Database error:', userError);
      return;
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('default_personality, groq_temperature, ai_memory_enabled')
      .eq('user_id', userData.id)
      .single();

    const personality = preferences?.default_personality || 'taskmaster';

    // Get conversation context
    let conversationContext = '';
    if (preferences?.ai_memory_enabled !== false) {
      const { data: memories } = await supabase
        .from('conversation_memory')
        .select('content')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (memories && memories.length > 0) {
        conversationContext = memories
          .reverse()
          .map(m => `Previous: ${m.content}`)
          .join('\n');
      }
    }

    // Generate AI response
    const personalityPrompts = {
      taskmaster: `You are David Goggins, the ultimate tough love coach. Be BRUTAL, direct, and uncompromising. No excuses, no sympathy - just pure motivation and accountability. Keep responses 8-12 words max. Examples: "Stop making excuses. Get after it NOW." or "Weak mindset. Do better. No shortcuts."`,
      
      cheerleader: `You are an enthusiastic, positive coach who celebrates every win. Be encouraging, energetic, and supportive while maintaining accountability. Keep responses 8-12 words max. Examples: "Amazing progress! Keep that momentum going!" or "You've got this! One step closer!"`
    };

    const prompt = `${personalityPrompts[personality as keyof typeof personalityPrompts]}

Context from previous conversations:
${conversationContext || 'First conversation with this user.'}

User's current message: "${messageText}"

Respond with brutal honesty and motivation in exactly 8-12 words. Stay in character.`;

    const aiResponse = await generateGroqResponse(prompt);
    
    if (!aiResponse) {
      console.error('❌ Failed to generate AI response');
      return;
    }

    console.log(`🤖 AI Response (${personality}): ${aiResponse}`);

    // Store conversation in memory
    if (preferences?.ai_memory_enabled !== false) {
      await supabase
        .from('conversation_memory')
        .insert({
          user_id: userData.id,
          content: `User: ${messageText}\nAI (${personality}): ${aiResponse}`,
          metadata: {
            personality,
            platform: 'whatsapp',
            intent: 'general_chat',
            timestamp: new Date().toISOString(),
          },
        });
    }

    // Send response via WhatsApp (remove + for API call)
    const success = await sendWhatsAppMessage(rawPhoneNumber, aiResponse);
    
          if (success) {
        console.log(`✅ Response sent to WhatsApp ${rawPhoneNumber}`);
        
        // Update user last activity
        await supabase
          .from('users')
          .update({ last_active: new Date().toISOString() })
          .eq('id', userData.id);
      } else {
        console.error(`❌ Failed to send response to WhatsApp ${rawPhoneNumber}`);
      }

  } catch (error) {
    console.error('❌ Error processing message:', error);
  }
}

// Generate AI response using Groq
async function generateGroqResponse(prompt: string): Promise<string | null> {
  try {
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const groqModel = Deno.env.get('GROQ_MODEL') || 'meta-llama/llama-4-maverick-17b-128e-instruct';
    
    if (!groqApiKey) {
      console.error('❌ Missing GROQ_API_KEY');
      return null;
    }

    console.log(`🤖 Using Groq model: ${groqModel}`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [
          {
            role: 'system',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || null;
    
    // Remove surrounding quotes if present
    if (content && content.startsWith('"') && content.endsWith('"')) {
      return content.slice(1, -1);
    }
    
    return content;

  } catch (error) {
    console.error('❌ Groq API error:', error);
    return null;
  }
}

// Send WhatsApp message
async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    const token = Deno.env.get('WHATSAPP_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    if (!token || !phoneNumberId) {
      console.error('❌ Missing WhatsApp configuration');
      return false;
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      }),
    });

    if (!response.ok) {
      console.error('❌ WhatsApp API error:', response.status, await response.text());
      return false;
    }

    return true;

  } catch (error) {
    console.error('❌ WhatsApp send error:', error);
    return false;
  }
} 
import { createSuccessResponse, createErrorResponse } from '../../shared/utils/index.ts';

// Health Check Edge Function - Public endpoint for monitoring
// GET /functions/v1/health
Deno.serve(async (req: Request) => {
  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    if (req.method !== 'GET') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    // Simple health check without service dependencies
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: Deno.env.get('ENVIRONMENT') || 'development',
      memory_provider: Deno.env.get('MEMORY_PROVIDER') || 'postgresql',
      services: {
        edge_functions: {
          healthy: true,
          runtime: 'Deno',
          platform: 'Supabase Edge Functions',
        },
        ai_inference: {
          provider: 'Groq',
          model: Deno.env.get('GROQ_MODEL') || 'meta-llama/llama-4-maverick-17b-128e-instruct',
          configured: !!Deno.env.get('GROQ_API_KEY'),
        },
        messaging: {
          platform: 'WhatsApp Business API',
          configured: !!Deno.env.get('WHATSAPP_TOKEN'),
          phone: Deno.env.get('WHATSAPP_PHONE_NUMBER') || 'not-configured',
        },
        database: {
          type: 'Supabase PostgreSQL',
          configured: !!Deno.env.get('SUPABASE_URL'),
        },
      },
      deployment_info: {
        project_ref: 'yzfclhnkxpgyxeklrvur',
        functions_deployed: ['health', 'chat', 'whatsapp'],
        webhook_url: 'https://yzfclhnkxpgyxeklrvur.supabase.co/functions/v1/whatsapp',
      },
      performance: {
        response_time_ms: Date.now() - startTime,
      },
    };

    console.log(`✅ Health check completed in ${Date.now() - startTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      data: healthData
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('❌ Health check failed:', error);

    return new Response(JSON.stringify({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      performance: {
        response_time_ms: Date.now() - startTime,
      },
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}); 
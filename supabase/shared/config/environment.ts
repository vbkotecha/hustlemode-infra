// Environment Configuration - Extracted from config.ts
export interface EnvironmentConfig {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GROQ_API_KEY: string;
  GROQ_MODEL: string;
  WHATSAPP_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_VERIFY_TOKEN: string;
  MEMORY_PROVIDER: string;
  ENVIRONMENT: string;
  APP_DEBUG: boolean;
}

export function loadEnvironmentVariables(): EnvironmentConfig {
  const env = Deno.env.toObject();
  
  return {
    SUPABASE_URL: env.SUPABASE_URL || '',
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY || '',
    GROQ_API_KEY: env.GROQ_API_KEY || '',
    GROQ_MODEL: env.GROQ_MODEL || 'meta-llama/llama-4-maverick-17b-128e-instruct',
    WHATSAPP_TOKEN: env.WHATSAPP_TOKEN || '',
    WHATSAPP_PHONE_NUMBER_ID: env.WHATSAPP_PHONE_NUMBER_ID || '',
    WHATSAPP_VERIFY_TOKEN: env.WHATSAPP_VERIFY_TOKEN || '',
    MEMORY_PROVIDER: env.MEMORY_PROVIDER || 'postgresql',
    ENVIRONMENT: env.ENVIRONMENT || 'development',
    APP_DEBUG: env.APP_DEBUG === 'true' || env.ENVIRONMENT === 'development'
  };
}

export function validateEnvironmentConfig(config: EnvironmentConfig): { 
  isValid: boolean; 
  missingVars: string[];
  warnings: string[];
} {
  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Critical variables required for all environments
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GROQ_API_KEY'
  ];

  for (const varName of requiredVars) {
    if (!config[varName as keyof EnvironmentConfig]) {
      missingVars.push(varName);
    }
  }

  // Production-specific validations
  if (config.ENVIRONMENT === 'production') {
    const productionRequired = [
      'WHATSAPP_TOKEN',
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_VERIFY_TOKEN'
    ];

    for (const varName of productionRequired) {
      if (!config[varName as keyof EnvironmentConfig]) {
        missingVars.push(varName);
      }
    }
  }

  // Warnings for suspicious configurations
  if (config.SUPABASE_URL && !config.SUPABASE_URL.includes('supabase.co')) {
    warnings.push('SUPABASE_URL does not appear to be a valid Supabase URL');
  }

  if (config.GROQ_API_KEY && !config.GROQ_API_KEY.startsWith('gsk_')) {
    warnings.push('GROQ_API_KEY does not appear to be a valid Groq API key');
  }

  if (config.WHATSAPP_TOKEN && config.WHATSAPP_TOKEN.length < 50) {
    warnings.push('WHATSAPP_TOKEN appears to be too short');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings
  };
}

export function isDevelopment(config: EnvironmentConfig): boolean {
  return config.ENVIRONMENT === 'development';
}

export function isProduction(config: EnvironmentConfig): boolean {
  return config.ENVIRONMENT === 'production';
}

export function shouldLogDebug(config: EnvironmentConfig): boolean {
  return config.APP_DEBUG || isDevelopment(config);
} 
// Test Environment Configuration
export const TEST_CONFIG = {
  // Supabase Configuration
  supabaseUrl: process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
  supabaseProjectRef: process.env.TEST_SUPABASE_PROJECT_REF || 'test-project',
  
  // AI Configuration
  groqApiKey: process.env.TEST_GROQ_API_KEY || 'test-groq-key',
  groqModel: process.env.TEST_GROQ_MODEL || 'meta-llama/llama-3.1-70b-versatile',
  
  // WhatsApp Configuration
  whatsappToken: process.env.TEST_WHATSAPP_TOKEN || 'test-whatsapp-token',
  whatsappPhoneNumberId: process.env.TEST_WHATSAPP_PHONE_NUMBER_ID || '123456789',
  whatsappVerifyToken: process.env.TEST_WHATSAPP_VERIFY_TOKEN || 'test-verify-token',
  
  // Test User Configuration
  testPhoneNumber: '+17817470041',
  testUserId: '550e8400-e29b-41d4-a716-446655440000',
  
  // Performance Targets
  performanceTargets: {
    coldStart: 100, // ms
    responseTime: 500, // ms
    concurrentRequests: 10,
    memorySearchTime: 50 // ms
  },
  
  // Quality Thresholds
  qualityThresholds: {
    unitTestCoverage: 95,
    integrationTestPassRate: 100,
    personalityConsistency: 0.8,
    responseQuality: 0.9,
    toolDetectionAccuracy: 0.95,
    wordCountMin: 4,
    wordCountMax: 12
  }
};

// Test utilities
export const TEST_UTILS = {
  // Generate test user ID
  generateTestUserId: () => `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  // Generate test phone number
  generateTestPhoneNumber: () => `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
  
  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Measure execution time
  measureTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  }
};

// Test data factories
export const TEST_DATA = {
  // Sample conversation messages
  messages: {
    motivation: 'I need motivation',
    goalSetting: 'I want to workout 3 times a week',
    progress: 'I completed my workout today',
    personalitySwitch: 'switch to cheerleader mode',
    simpleGreeting: 'Hello'
  },
  
  // Expected response patterns
  responsePatterns: {
    taskmaster: {
      emojis: ['💪', '🔥', '⚡'],
      keywords: ['go', 'do', 'work', 'push', 'move', 'start', 'begin', 'execute'],
      tone: 'direct'
    },
    cheerleader: {
      emojis: ['✨', '🎉', '🌟'],
      keywords: ['amazing', 'awesome', 'great', 'fantastic', 'incredible'],
      tone: 'encouraging'
    }
  },
  
  // WhatsApp webhook test data
  whatsappWebhooks: {
    verification: {
      mode: 'subscribe',
      challenge: 'test123',
      verifyToken: 'fa22d4e7-cba4-48cf-9b36-af6190bf9c67'
    },
    messageEvent: {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '+17817470041',
              text: { body: 'test message' }
            }],
            metadata: {
              display_phone_number: '+17817470041',
              phone_number_id: '682917338218717'
            }
          }
        }]
      }]
    }
  }
}; 
# HustleMode.ai Testing Framework

## 🎯 Testing Pyramid Architecture

```
                    ┌─────────────────┐
                    │   EVALUATIONS   │  ← LLM Quality & User Experience
                    │   (Manual)      │
                    └─────────────────┘
                           │
                    ┌─────────────────┐
                    │  INTEGRATION    │  ← End-to-End API & Workflow Tests
                    │     TESTS       │
                    └─────────────────┘
                           │
                    ┌─────────────────┐
                    │   UNIT TESTS    │  ← Individual Component Tests
                    │   (Automated)   │
                    └─────────────────┘
```

## 📁 Directory Structure

```
tests/
├── unit/                          # Fast, isolated component tests
│   ├── ai-tools/                  # AI tool orchestration tests
│   │   ├── message-analyzer.test.ts
│   │   ├── intent-analyzer.test.ts
│   │   ├── goal-extractor.test.ts
│   │   └── tool-executor.test.ts
│   ├── memory/                    # Memory service tests
│   │   ├── postgresql-memory.test.ts
│   │   ├── memory-service.test.ts
│   │   └── search.test.ts
│   ├── ai/                        # AI response generation tests
│   │   ├── groq-service.test.ts
│   │   ├── ai-response.test.ts
│   │   └── personality.test.ts
│   ├── database/                  # Database operation tests
│   │   ├── users.test.ts
│   │   ├── preferences.test.ts
│   │   └── migrations.test.ts
│   ├── platforms/                 # Platform-specific tests
│   │   ├── whatsapp-adapter.test.ts
│   │   ├── response-formatters.test.ts
│   │   └── constraints.test.ts
│   └── utils/                     # Utility function tests
│       ├── validation.test.ts
│       ├── text-processing.test.ts
│       └── performance.test.ts
├── integration/                   # End-to-end workflow tests
│   ├── api/                       # API endpoint tests
│   │   ├── health.test.ts
│   │   ├── chat.test.ts
│   │   └── whatsapp.test.ts
│   ├── workflows/                 # Complete user journey tests
│   │   ├── goal-setting.test.ts
│   │   ├── personality-switching.test.ts
│   │   ├── progress-tracking.test.ts
│   │   └── memory-context.test.ts
│   ├── edge-functions/            # Supabase Edge Function tests
│   │   ├── deployment.test.ts
│   │   ├── cold-start.test.ts
│   │   └── error-handling.test.ts
│   └── external/                  # External service integration tests
│       ├── groq-api.test.ts
│       ├── whatsapp-webhook.test.ts
│       └── supabase-db.test.ts
├── evaluations/                   # LLM quality & UX evaluations
│   ├── personality/               # Personality consistency tests
│   │   ├── taskmaster-eval.test.ts
│   │   ├── cheerleader-eval.test.ts
│   │   └── personality-switch.test.ts
│   ├── response-quality/          # Response quality assessments
│   │   ├── word-count.test.ts
│   │   ├── motivation-level.test.ts
│   │   ├── action-orientation.test.ts
│   │   └── context-relevance.test.ts
│   ├── tool-detection/            # AI tool detection accuracy
│   │   ├── goal-detection.test.ts
│   │   ├── preference-detection.test.ts
│   │   └── intent-classification.test.ts
│   └── user-experience/           # End-user experience tests
│       ├── conversation-flow.test.ts
│       ├── error-recovery.test.ts
│       └── performance-perception.test.ts
├── fixtures/                      # Test data and mock responses
│   ├── conversations/             # Sample conversation data
│   │   ├── goal-setting.json
│   │   ├── motivation-requests.json
│   │   └── personality-switches.json
│   ├── ai-responses/              # Expected AI response patterns
│   │   ├── taskmaster-responses.json
│   │   ├── cheerleader-responses.json
│   │   └── tool-executions.json
│   └── webhooks/                  # WhatsApp webhook test data
│       ├── verification.json
│       ├── message-events.json
│       └── error-scenarios.json
├── utils/                         # Testing utilities and helpers
│   ├── test-helpers.ts            # Common test utilities
│   ├── mock-factories.ts          # Mock data generators
│   ├── assertion-helpers.ts       # Custom assertions
│   └── performance-helpers.ts     # Performance testing utilities
└── config/                        # Test configuration
    ├── jest.config.js             # Jest configuration
    ├── test-env.ts                # Test environment setup
    └── coverage.config.js         # Coverage thresholds
```

## 🧪 Unit Tests (Fast & Isolated)

### Purpose
- Test individual components in isolation
- Fast execution (<100ms per test)
- High coverage (95%+ target)
- Mock external dependencies

### Key Test Categories

#### 1. AI Tools Testing
```typescript
// tests/unit/ai-tools/message-analyzer.test.ts
describe('MessageAnalyzer', () => {
  test('should detect goal-setting intent', async () => {
    const message = "I want to workout 3 times a week";
    const result = await MessageAnalyzer.analyzeMessageForTools(message, userId, 'whatsapp');
    expect(result.requiresTools).toBe(true);
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0].tool_name).toBe('manage_goal');
  });

  test('should handle simple motivation requests', async () => {
    const message = "I need motivation";
    const result = await MessageAnalyzer.analyzeMessageForTools(message, userId, 'whatsapp');
    expect(result.requiresTools).toBe(false);
    expect(result.tools).toHaveLength(0);
  });
});
```

#### 2. Memory Service Testing
```typescript
// tests/unit/memory/memory-service.test.ts
describe('MemoryService', () => {
  test('should store and retrieve conversation context', async () => {
    const userId = 'test-user-id';
    const content = 'User: Hello\nAI: Hi there!';
    
    await MemoryService.addMemory(content, userId);
    const memories = await MemoryService.getMemories(userId, 5);
    
    expect(memories).toHaveLength(1);
    expect(memories[0].memory).toBe(content);
  });

  test('should search memories by relevance', async () => {
    const results = await MemoryService.searchMemories('workout', userId, 3);
    expect(results).toBeInstanceOf(Array);
    expect(results[0]).toHaveProperty('score');
  });
});
```

#### 3. Personality System Testing
```typescript
// tests/unit/ai/personality.test.ts
describe('Personality System', () => {
  test('should generate taskmaster responses within word limit', async () => {
    const response = await generateAIResponse('I need motivation', userId, 'taskmaster');
    const wordCount = response.split(' ').length;
    expect(wordCount).toBeGreaterThanOrEqual(4);
    expect(wordCount).toBeLessThanOrEqual(12);
    expect(response).toMatch(/💪|🔥|⚡/); // Taskmaster emojis
  });

  test('should generate cheerleader responses with positive tone', async () => {
    const response = await generateAIResponse('I completed my workout', userId, 'cheerleader');
    expect(response).toMatch(/amazing|awesome|great|fantastic/i);
    expect(response).toMatch(/✨|🎉|🌟/); // Cheerleader emojis
  });
});
```

## 🔗 Integration Tests (End-to-End Workflows)

### Purpose
- Test complete user journeys
- Verify API endpoints work together
- Test external service integrations
- Moderate execution time (1-5s per test)

### Key Test Categories

#### 1. API Endpoint Integration
```typescript
// tests/integration/api/chat.test.ts
describe('Chat API Integration', () => {
  test('should handle complete goal-setting workflow', async () => {
    // 1. User requests goal setting
    const response1 = await fetch('/chat', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: '+17817470041',
        message: 'I want to workout 3 times a week',
        personality: 'cheerleader'
      })
    });
    
    expect(response1.status).toBe(200);
    const data1 = await response1.json();
    expect(data1.success).toBe(true);
    expect(data1.data.tools_used).toBeGreaterThan(0);

    // 2. User reports progress
    const response2 = await fetch('/chat', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: '+17817470041',
        message: 'I completed my workout today',
        personality: 'cheerleader'
      })
    });
    
    expect(response2.status).toBe(200);
    const data2 = await response2.json();
    expect(data2.data.response).toMatch(/awesome|great|amazing/i);
  });
});
```

#### 2. WhatsApp Webhook Integration
```typescript
// tests/integration/external/whatsapp-webhook.test.ts
describe('WhatsApp Webhook Integration', () => {
  test('should verify webhook and process messages', async () => {
    // 1. Test webhook verification
    const verifyResponse = await fetch('/whatsapp?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=fa22d4e7-cba4-48cf-9b36-af6190bf9c67');
    expect(verifyResponse.status).toBe(200);
    const challenge = await verifyResponse.text();
    expect(challenge).toBe('test123');

    // 2. Test message processing
    const messageResponse = await fetch('/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      })
    });
    
    expect(messageResponse.status).toBe(200);
    const data = await messageResponse.json();
    expect(data.success).toBe(true);
  });
});
```

#### 3. Performance Integration Tests
```typescript
// tests/integration/edge-functions/performance.test.ts
describe('Performance Integration', () => {
  test('should meet cold start performance targets', async () => {
    const startTime = Date.now();
    const response = await fetch('/health');
    const endTime = Date.now();
    
    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(100); // <100ms cold start
  });

  test('should handle concurrent requests', async () => {
    const concurrentRequests = 10;
    const promises = Array(concurrentRequests).fill(0).map(() => 
      fetch('/chat', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: '+17817470041',
          message: 'test',
          personality: 'taskmaster'
        })
      })
    );
    
    const responses = await Promise.all(promises);
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
```

## 🎯 Evaluations (LLM Quality & UX)

### Purpose
- Assess AI response quality
- Evaluate user experience
- Test personality consistency
- Manual review of edge cases

### Key Evaluation Categories

#### 1. Personality Consistency Evaluation
```typescript
// tests/evaluations/personality/taskmaster-eval.test.ts
describe('Taskmaster Personality Evaluation', () => {
  test('should maintain consistent tone across scenarios', async () => {
    const scenarios = [
      'I need motivation',
      'I failed my workout',
      'I want to give up',
      'I achieved my goal'
    ];

    for (const scenario of scenarios) {
      const response = await generateAIResponse(scenario, userId, 'taskmaster');
      
      // Evaluate response characteristics
      const evaluation = await evaluateTaskmasterResponse(response, scenario);
      
      expect(evaluation.toneScore).toBeGreaterThan(0.8);
      expect(evaluation.motivationLevel).toBeGreaterThan(0.7);
      expect(evaluation.actionOrientation).toBeGreaterThan(0.8);
      expect(evaluation.wordCount).toBeLessThanOrEqual(12);
    }
  });
});
```

#### 2. Response Quality Assessment
```typescript
// tests/evaluations/response-quality/word-count.test.ts
describe('Response Quality Evaluation', () => {
  test('should maintain 8-12 word constraint', async () => {
    const testMessages = loadTestMessages('fixtures/conversations/motivation-requests.json');
    
    for (const message of testMessages) {
      const response = await generateAIResponse(message.text, message.userId, message.personality);
      const wordCount = response.split(' ').length;
      
      expect(wordCount).toBeGreaterThanOrEqual(4);
      expect(wordCount).toBeLessThanOrEqual(12);
    }
  });

  test('should be action-oriented', async () => {
    const response = await generateAIResponse('I need motivation', userId, 'taskmaster');
    const actionWords = ['go', 'do', 'work', 'push', 'move', 'start', 'begin', 'execute'];
    const hasActionWord = actionWords.some(word => response.toLowerCase().includes(word));
    
    expect(hasActionWord).toBe(true);
  });
});
```

#### 3. Tool Detection Accuracy
```typescript
// tests/evaluations/tool-detection/goal-detection.test.ts
describe('Goal Detection Evaluation', () => {
  test('should accurately detect goal-setting intent', async () => {
    const goalMessages = [
      'I want to workout 3 times a week',
      'My goal is to read 20 books this year',
      'I need to save $5000 by December',
      'I want to learn Spanish'
    ];

    for (const message of goalMessages) {
      const analysis = await MessageAnalyzer.analyzeMessageForTools(message, userId, 'whatsapp');
      
      expect(analysis.requiresTools).toBe(true);
      expect(analysis.tools.some(tool => tool.tool_name === 'manage_goal')).toBe(true);
    }
  });
});
```

## 🚀 Test Execution Strategy

### 1. Pre-commit Hooks
```bash
# Run unit tests before commit
npm run test:unit

# Run integration tests in CI
npm run test:integration

# Run evaluations manually
npm run test:evaluations
```

### 2. CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      - run: deno test tests/unit/ --coverage=coverage

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v3
      - run: npm run test:integration

  performance-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v3
      - run: npm run test:performance
```

### 3. Quality Gates
```typescript
// Quality thresholds
const QUALITY_THRESHOLDS = {
  unitTestCoverage: 95,
  integrationTestPassRate: 100,
  performanceTargets: {
    coldStart: 100, // ms
    responseTime: 500, // ms
    concurrentRequests: 10
  },
  evaluationScores: {
    personalityConsistency: 0.8,
    responseQuality: 0.9,
    toolDetectionAccuracy: 0.95
  }
};
```

## 📊 Test Metrics & Reporting

### 1. Coverage Reports
- Unit test coverage by module
- Integration test coverage by workflow
- Performance regression tracking

### 2. Quality Dashboards
- Test pass/fail rates
- Performance trends
- Evaluation scores over time

### 3. Automated Alerts
- Test failures
- Performance degradation
- Quality score drops

## 🔧 Test Environment Setup

### 1. Local Development
```bash
# Install test dependencies
npm install --save-dev jest @types/jest supertest

# Run tests locally
npm run test:unit
npm run test:integration
npm run test:evaluations
```

### 2. Test Data Management
- Use fixtures for consistent test data
- Mock external services in unit tests
- Use test databases for integration tests

### 3. Environment Configuration
```typescript
// tests/config/test-env.ts
export const TEST_CONFIG = {
  supabaseUrl: process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
  groqApiKey: process.env.TEST_GROQ_API_KEY || 'test-key',
  whatsappToken: process.env.TEST_WHATSAPP_TOKEN || 'test-token'
};
```

This testing framework provides comprehensive coverage from fast unit tests to thorough evaluations, ensuring production-level quality for HustleMode.ai. 
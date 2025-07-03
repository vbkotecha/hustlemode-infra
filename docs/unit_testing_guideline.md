# Unit Testing Guidelines
## HustleMode.ai - TDD Enforcement & Testing Standards

### Testing Philosophy

**Test-Driven Development (TDD) Enforcement:**
- Write tests BEFORE implementing functionality
- Red → Green → Refactor cycle
- 100% test coverage for business logic
- Fast, reliable, isolated tests

**Testing Pyramid:**
```
    /\     E2E Tests (Few)
   /  \    Integration Tests (Some)  
  /____\   Unit Tests (Many)
```

---

### Testing Framework Setup

#### Deno Testing Environment
```typescript
// deno.json test configuration
{
  "tasks": {
    "test": "deno test --allow-env --allow-net",
    "test:watch": "deno test --allow-env --allow-net --watch",
    "test:coverage": "deno test --allow-env --allow-net --coverage=coverage",
    "test:unit": "deno test tests/unit/ --allow-env",
    "test:integration": "deno test tests/integration/ --allow-env --allow-net",
    "test:e2e": "deno test tests/e2e/ --allow-env --allow-net"
  }
}
```

#### Test File Naming Convention
```
src/domain/user/services/UserService.ts
tests/unit/domain/user/services/UserService.test.ts

src/infrastructure/groq/GroqClient.ts  
tests/unit/infrastructure/groq/GroqClient.test.ts

tests/integration/api/whatsapp.integration.test.ts
tests/e2e/whatsapp-flow/complete-conversation.e2e.test.ts
```

---

### Unit Testing Patterns

#### 1. Test Structure (Arrange-Act-Assert)
```typescript
import { assertEquals, assertRejects } from "https://deno.land/std/testing/asserts.ts"
import { describe, it, beforeEach, afterEach } from "https://deno.land/std/testing/bdd.ts"

describe("UserService", () => {
  let userService: UserService
  let mockRepository: MockUserRepository
  
  beforeEach(() => {
    // Arrange: Set up test doubles and dependencies
    mockRepository = new MockUserRepository()
    userService = new UserService(mockRepository)
  })
  
  afterEach(() => {
    // Cleanup: Reset mocks and state
    mockRepository.reset()
  })
  
  it("should create user with valid phone number", async () => {
    // Arrange
    const phoneNumber = "+15551234567"
    const userData = { phone_number: phoneNumber, name: "Test User" }
    
    // Act
    const result = await userService.createUser(userData)
    
    // Assert
    assertEquals(result.success, true)
    assertEquals(result.data?.phone_number, phoneNumber)
    assertEquals(mockRepository.createCallCount, 1)
  })
})
```

#### 2. Test Doubles (Mocks, Stubs, Fakes)
```typescript
// Mock for external dependencies
class MockMemoryService implements IMemoryService {
  private memories: Map<string, MemoryResult[]> = new Map()
  public searchCallCount = 0
  public addCallCount = 0
  
  async searchMemories(query: string, userId: string): Promise<MemoryResult[]> {
    this.searchCallCount++
    return this.memories.get(userId) || []
  }
  
  async addMemory(content: string, userId: string): Promise<boolean> {
    this.addCallCount++
    const existing = this.memories.get(userId) || []
    existing.push({ id: crypto.randomUUID(), content, userId, createdAt: new Date() })
    this.memories.set(userId, existing)
    return true
  }
  
  async checkHealth(): Promise<{ healthy: boolean; latency: number }> {
    return { healthy: true, latency: 10 }
  }
  
  async getMemories(userId: string): Promise<MemoryResult[]> {
    return this.memories.get(userId) || []
  }
  
  reset(): void {
    this.memories.clear()
    this.searchCallCount = 0
    this.addCallCount = 0
  }
}
```

#### 3. Async Testing Patterns
```typescript
describe("AI Response Generation", () => {
  it("should generate response within time limit", async () => {
    const startTime = performance.now()
    
    const response = await aiService.generateResponse("I need motivation", "taskmaster")
    
    const duration = performance.now() - startTime
    assertEquals(response.split(' ').length <= 12, true)
    assertEquals(duration < 200, true) // Performance requirement
  })
  
  it("should handle API timeout gracefully", async () => {
    const slowAiService = new AIService(new SlowMockGroqClient())
    
    await assertRejects(
      () => slowAiService.generateResponse("test", "taskmaster"),
      Error,
      "Request timeout"
    )
  })
})
```

---

### Test Coverage Requirements

#### Coverage Targets by Layer
```typescript
// Business Logic (Domain Layer): 100% coverage required
export class UserService {
  async createUser(userData: CreateUser): Promise<Result<User>> {
    // Every branch must be tested
    if (!this.validatePhoneNumber(userData.phone_number)) {
      return { success: false, error: new Error("Invalid phone number") }
    }
    
    const existing = await this.userRepository.findByPhone(userData.phone_number)
    if (existing) {
      return { success: false, error: new Error("User already exists") }
    }
    
    return await this.userRepository.create(userData)
  }
}
```

#### Coverage Requirements
- **Domain Layer**: 100% line coverage, 100% branch coverage
- **Infrastructure Layer**: 80% line coverage, focus on error handling
- **API Layer**: 90% coverage, all endpoints and error responses
- **Shared Utilities**: 100% coverage, critical for reliability

---

### Testing Specific Components

#### 1. AI Personality Testing
```typescript
describe("TaskmasterPersonality", () => {
  let personality: TaskmasterPersonality
  
  beforeEach(() => {
    personality = new TaskmasterPersonality([])
  })
  
  it("should enforce 8-12 word limit", () => {
    const testCases = [
      "Stop making excuses and get after it NOW",
      "You're stronger than your excuses. Prove it.",
      "Weak mindset. Do better. No shortcuts."
    ]
    
    testCases.forEach(response => {
      const words = response.split(' ')
      assertEquals(words.length >= 8 && words.length <= 12, true,
        `Response "${response}" has ${words.length} words, expected 8-12`)
    })
  })
  
  it("should maintain tough-love tone", () => {
    const memory = ["User struggling with motivation"]
    const prompt = personality.generatePrompt("I'm feeling lazy", memory)
    
    // Assert prompt contains Goggins-style elements
    assertEquals(prompt.includes("David Goggins"), true)
    assertEquals(prompt.includes("brutal"), true)
    assertEquals(prompt.includes("8-12 words"), true)
  })
})
```

#### 2. Memory Service Testing
```typescript
describe("PostgreSQLMemoryService", () => {
  let memoryService: PostgreSQLMemoryService
  let testUserId: string
  
  beforeEach(async () => {
    memoryService = new PostgreSQLMemoryService()
    testUserId = crypto.randomUUID()
  })
  
  it("should store and retrieve memories", async () => {
    const content = "User set goal to exercise daily"
    
    const stored = await memoryService.addMemory(content, testUserId)
    assertEquals(stored, true)
    
    const memories = await memoryService.getMemories(testUserId)
    assertEquals(memories.length, 1)
    assertEquals(memories[0].content, content)
  })
  
  it("should search memories by relevance", async () => {
    await memoryService.addMemory("User loves running", testUserId)
    await memoryService.addMemory("User hates cold weather", testUserId)
    await memoryService.addMemory("User enjoys morning workouts", testUserId)
    
    const results = await memoryService.searchMemories("exercise motivation", testUserId)
    
    assertEquals(results.length > 0, true)
    // Most relevant should be about running/workouts
    assertEquals(results[0].content.includes("running") || results[0].content.includes("workouts"), true)
  })
})
```

#### 3. WhatsApp Integration Testing
```typescript
describe("WhatsAppService", () => {
  let whatsappService: WhatsAppService
  let mockHttpClient: MockHttpClient
  
  beforeEach(() => {
    mockHttpClient = new MockHttpClient()
    whatsappService = new WhatsAppService(mockHttpClient)
  })
  
  it("should send message with correct format", async () => {
    const phoneNumber = "+15551234567"
    const message = "Stop making excuses. Get after it NOW."
    
    await whatsappService.sendMessage(phoneNumber, message)
    
    const sentRequest = mockHttpClient.getLastRequest()
    assertEquals(sentRequest.url.includes("graph.facebook.com"), true)
    assertEquals(sentRequest.body.messaging_product, "whatsapp")
    assertEquals(sentRequest.body.to, phoneNumber)
    assertEquals(sentRequest.body.text.body, message)
  })
  
  it("should handle delivery failures gracefully", async () => {
    mockHttpClient.setShouldFail(true)
    
    const result = await whatsappService.sendMessage("+15551234567", "test")
    
    assertEquals(result.success, false)
    assertEquals(result.error?.message.includes("delivery failed"), true)
  })
})
```

---

### Performance Testing

#### Response Time Testing
```typescript
describe("Performance Requirements", () => {
  it("should process message under 500ms end-to-end", async () => {
    const startTime = performance.now()
    
    const mockMessage: WhatsAppMessage = {
      from: "+15551234567",
      body: "I need motivation",
      timestamp: new Date().toISOString()
    }
    
    await whatsappHandler(mockMessage)
    
    const duration = performance.now() - startTime
    assertEquals(duration < 500, true, `Processing took ${duration}ms, expected <500ms`)
  })
  
  it("should search memory under 50ms", async () => {
    const userId = crypto.randomUUID()
    await memoryService.addMemory("test memory", userId)
    
    const startTime = performance.now()
    await memoryService.searchMemories("test", userId)
    const duration = performance.now() - startTime
    
    assertEquals(duration < 50, true, `Memory search took ${duration}ms, expected <50ms`)
  })
})
```

---

### Error Handling Testing

#### Comprehensive Error Scenarios
```typescript
describe("Error Handling", () => {
  it("should handle database connection failures", async () => {
    const faultyMemoryService = new PostgreSQLMemoryService(new FailingDbClient())
    
    const result = await faultyMemoryService.addMemory("test", "user-id")
    
    assertEquals(result, false)
    // Should log error but not crash
  })
  
  it("should handle Groq API rate limiting", async () => {
    const rateLimitedGroq = new GroqService(new RateLimitedMockClient())
    
    await assertRejects(
      () => rateLimitedGroq.generateResponse("test", "taskmaster"),
      Error,
      "Rate limit exceeded"
    )
  })
  
  it("should handle malformed WhatsApp webhooks", async () => {
    const malformedPayload = { invalid: "data" }
    
    const response = await whatsappWebhook(malformedPayload)
    
    assertEquals(response.status, 400)
    assertEquals(response.body.error.includes("Invalid webhook format"), true)
  })
})
```

---

### Test Data Management

#### Test Fixtures
```typescript
// tests/fixtures/users.ts
export const TEST_USERS = {
  validUser: {
    phone_number: "+15551234567",
    name: "Test User",
    email: "test@example.com"
  },
  
  invalidPhoneUser: {
    phone_number: "invalid-phone",
    name: "Invalid User"
  }
} as const

// tests/fixtures/memories.ts
export const TEST_MEMORIES = {
  motivationContext: [
    "User wants to wake up early",
    "User struggles with procrastination", 
    "User responds well to tough love"
  ],
  
  positiveContext: [
    "User recently achieved a goal",
    "User prefers encouragement",
    "User celebrates small wins"
  ]
} as const
```

#### Database Test Helpers
```typescript
// tests/helpers/database.ts
export class TestDatabaseHelper {
  static async setupTestUser(): Promise<string> {
    const user = await userRepository.create(TEST_USERS.validUser)
    return user.id
  }
  
  static async cleanupTestData(userId: string): Promise<void> {
    await memoryRepository.deleteByUserId(userId)
    await userRepository.delete(userId)
  }
  
  static async seedMemories(userId: string, memories: string[]): Promise<void> {
    for (const memory of memories) {
      await memoryService.addMemory(memory, userId)
    }
  }
}
```

---

### Continuous Testing

#### Test Automation
```typescript
// .github/workflows/test.yml integration
export const TEST_PIPELINE = {
  unitTests: "deno test tests/unit/ --coverage",
  integrationTests: "deno test tests/integration/", 
  e2eTests: "deno test tests/e2e/",
  coverageReport: "deno coverage coverage --lcov > coverage.lcov"
}
```

#### Quality Gates
- **Unit Tests**: Must pass with 95%+ coverage
- **Integration Tests**: Must pass for all critical paths
- **Performance Tests**: All response times under targets
- **E2E Tests**: Complete user flows working

---

### Testing Checklist

#### Before Each Commit
- [ ] All unit tests pass
- [ ] New functionality has corresponding tests
- [ ] Test coverage meets requirements
- [ ] Performance tests pass
- [ ] No flaky or inconsistent tests

#### Before Each Release  
- [ ] Full test suite passes
- [ ] Integration tests verified
- [ ] E2E scenarios validated
- [ ] Performance benchmarks met
- [ ] Error handling scenarios tested

---

**Testing Philosophy**: "Tests are not just about preventing bugs—they're about enabling confident refactoring, documenting behavior, and ensuring our AI coach delivers reliable motivation when users need it most."

**Last Updated**: 2024-12-19  
**Testing Framework**: Deno Test + Custom Helpers  
**Next Review**: After Phase 2 feature implementation 
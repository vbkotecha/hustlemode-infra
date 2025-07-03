# Technical Documentation
## HustleMode.ai - Engineering Patterns & Best Practices

### Architecture Philosophy

**Core Principles**: 
- **SOLID Principles**: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY (Don't Repeat Yourself)**: Shared utilities, abstracted interfaces, reusable components
- **KISS (Keep It Simple, Stupid)**: Minimal complexity, clear data flow, focused responsibilities
- **Domain-Driven Design**: User-centric features, clear boundaries between messaging/AI/memory domains

---

### Technology Stack

#### Runtime & Infrastructure
```typescript
Runtime: Deno (Supabase Edge Functions)
Language: TypeScript (strict mode)
Database: PostgreSQL with Row Level Security
AI Provider: Groq (Llama 3.1 70B)
Messaging: WhatsApp Business API
Memory: Abstracted interface (PostgreSQL + optional Mem0)
```

#### Dependencies & Libraries
```json
{
  "supabase": "^2.0.0",
  "groq": "^0.9.0", 
  "deno/std": "^0.208.0"
}
```

---

### Design Patterns Implementation

#### 1. Strategy Pattern - Memory Service Abstraction
```typescript
// Abstraction allows switching between PostgreSQL and Mem0
interface IMemoryService {
  searchMemories(query: string, userId: string): Promise<MemoryResult[]>
  addMemory(content: string, userId: string): Promise<boolean>
  getMemories(userId: string): Promise<MemoryResult[]>
  checkHealth(): Promise<{ healthy: boolean; latency: number }>
}

// Implementation can be swapped via environment variable
const memoryService: IMemoryService = config.MEMORY_PROVIDER === 'mem0' 
  ? new Mem0Service() 
  : new PostgreSQLService()
```

#### 2. Factory Pattern - Personality Selection
```typescript
// Factory creates appropriate personality based on user preference
class PersonalityFactory {
  static create(type: 'taskmaster' | 'cheerleader', memory: string[]): IPersonality {
    switch (type) {
      case 'taskmaster': return new TaskmasterPersonality(memory)
      case 'cheerleader': return new CheerleaderPersonality(memory)
      default: throw new Error(`Unknown personality: ${type}`)
    }
  }
}
```

#### 3. Repository Pattern - Data Access Layer
```typescript
// Separation of data access logic from business logic
interface IUserRepository {
  findByPhone(phone: string): Promise<User | null>
  create(userData: CreateUser): Promise<User>
  updatePreferences(userId: string, prefs: UserPreferences): Promise<boolean>
}

class SupabaseUserRepository implements IUserRepository {
  // Implementation details isolated from business logic
}
```

#### 4. Command Pattern - Message Processing Pipeline
```typescript
// Each step in message processing is a command
interface ICommand {
  execute(context: MessageContext): Promise<MessageContext>
}

class MessageProcessor {
  private pipeline: ICommand[] = [
    new ExtractUserCommand(),
    new LoadMemoryCommand(),
    new GenerateResponseCommand(),
    new SaveMemoryCommand(),
    new SendResponseCommand()
  ]
}
```

---

### SOLID Principles Implementation

#### Single Responsibility Principle
```typescript
// Each class has one reason to change
class PhoneNumberValidator {
  static validate(phone: string): boolean {
    return /^\+[1-9]\d{1,14}$/.test(phone)
  }
}

class UserIdLookup {
  static async findUserId(phone: string): Promise<string | null> {
    // Only responsible for phone → user_id mapping
  }
}

class ResponseGenerator {
  static async generate(prompt: string, personality: string): Promise<string> {
    // Only responsible for AI response generation
  }
}
```

#### Open/Closed Principle
```typescript
// Open for extension (new personalities), closed for modification
abstract class BasePersonality {
  abstract generatePrompt(userMessage: string, memory: string[]): string
  
  protected enforceWordLimit(response: string): string {
    const words = response.split(' ')
    return words.length <= 12 ? response : words.slice(0, 12).join(' ')
  }
}

class TaskmasterPersonality extends BasePersonality {
  generatePrompt(userMessage: string, memory: string[]): string {
    return `Be David Goggins. Respond in 8-12 words with brutal motivation...`
  }
}
```

#### Interface Segregation Principle
```typescript
// Clients only depend on interfaces they use
interface IMemoryWriter {
  addMemory(content: string, userId: string): Promise<boolean>
}

interface IMemoryReader {
  searchMemories(query: string, userId: string): Promise<MemoryResult[]>
  getMemories(userId: string): Promise<MemoryResult[]>
}

interface IHealthCheck {
  checkHealth(): Promise<{ healthy: boolean; latency: number }>
}

// Full interface composed of smaller interfaces
interface IMemoryService extends IMemoryWriter, IMemoryReader, IHealthCheck {}
```

#### Dependency Inversion Principle
```typescript
// High-level modules depend on abstractions, not concretions
class ChatService {
  constructor(
    private memoryService: IMemoryService,
    private aiService: IAIService,
    private userRepository: IUserRepository
  ) {}
  
  async processMessage(message: WhatsAppMessage): Promise<string> {
    // Depends on abstractions, not concrete implementations
  }
}
```

---

### Directory Structure Convention

```
src/hustlemode/
├── api/                    # Edge Function entry points
│   ├── health.ts          # Health check endpoint
│   ├── chat.ts            # Universal chat API
│   └── whatsapp.ts        # WhatsApp webhook handler
├── domain/                 # Business logic (DDD)
│   ├── user/              # User management domain
│   │   ├── entities/      # User, UserPreferences
│   │   ├── repositories/  # IUserRepository
│   │   └── services/      # UserService
│   ├── memory/            # Memory management domain
│   │   ├── entities/      # Memory, MemoryResult
│   │   ├── services/      # IMemoryService implementations
│   │   └── providers/     # PostgreSQL, Mem0 providers
│   ├── ai/                # AI personality domain
│   │   ├── personalities/ # Taskmaster, Cheerleader
│   │   ├── services/      # IAIService, GroqService
│   │   └── types/         # Personality interfaces
│   └── messaging/         # WhatsApp messaging domain
│       ├── services/      # WhatsAppService
│       ├── validators/    # Message validation
│       └── types/         # WhatsApp message types
├── shared/                 # Cross-cutting concerns
│   ├── config.ts          # Environment configuration
│   ├── database.ts        # Database connection
│   ├── utils.ts           # Utility functions
│   ├── types.ts           # Shared type definitions
│   └── constants.ts       # Application constants
└── infrastructure/        # External integrations
    ├── groq/              # Groq API client
    ├── supabase/          # Supabase client
    └── whatsapp/          # WhatsApp API client

tests/                     # Root-level test directory
├── unit/                  # Unit tests by domain
│   ├── domain/
│   ├── shared/
│   └── infrastructure/
├── integration/           # Integration tests
│   ├── api/
│   ├── database/
│   └── external/
└── e2e/                   # End-to-end tests
    ├── whatsapp-flow/
    ├── memory-persistence/
    └── personality-switching/
```

---

### Code Quality Standards

#### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### Error Handling Patterns
```typescript
// Use Result<T, E> pattern for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

async function safeApiCall<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}
```

#### Validation & Type Safety
```typescript
// Runtime validation with compile-time types
import { z } from 'zod'

const WhatsAppMessageSchema = z.object({
  from: z.string().regex(/^\+[1-9]\d{1,14}$/),
  body: z.string().min(1).max(1000),
  timestamp: z.string()
})

type WhatsAppMessage = z.infer<typeof WhatsAppMessageSchema>
```

---

### Performance Optimization Patterns

#### Caching Strategy
```typescript
// In-memory cache for user preferences (short TTL)
class UserPreferencesCache {
  private cache = new Map<string, { data: UserPreferences; expires: number }>()
  
  async get(userId: string): Promise<UserPreferences | null> {
    const cached = this.cache.get(userId)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }
    return null
  }
}
```

#### Database Query Optimization
```sql
-- Optimized indexes for common queries
CREATE INDEX CONCURRENTLY idx_users_phone_number ON users (phone_number);
CREATE INDEX CONCURRENTLY idx_memory_user_search ON conversation_memory 
  USING GIN (user_id, to_tsvector('english', content));
```

#### Response Streaming
```typescript
// Stream responses for better perceived performance
async function generateStreamingResponse(prompt: string): Promise<ReadableStream> {
  return new ReadableStream({
    async start(controller) {
      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        stream: true
      })
      
      for await (const chunk of response) {
        controller.enqueue(chunk.choices[0]?.delta?.content || '')
      }
      controller.close()
    }
  })
}
```

---

### Security Patterns

#### Input Sanitization
```typescript
// Sanitize all user inputs
class InputSanitizer {
  static sanitizeMessage(message: string): string {
    return message
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, 1000) // Max length
  }
}
```

#### Database Security (Row Level Security)
```sql
-- RLS policies for data isolation
CREATE POLICY user_isolation ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY memory_isolation ON conversation_memory FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE auth.uid() = id)
);
```

---

### Testing Strategy

#### Unit Testing Patterns
```typescript
// Test doubles for external dependencies
class MockMemoryService implements IMemoryService {
  private memories: Map<string, MemoryResult[]> = new Map()
  
  async addMemory(content: string, userId: string): Promise<boolean> {
    // Mock implementation
    return true
  }
}

// Test with dependency injection
describe('ChatService', () => {
  let chatService: ChatService
  let mockMemoryService: MockMemoryService
  
  beforeEach(() => {
    mockMemoryService = new MockMemoryService()
    chatService = new ChatService(mockMemoryService, mockAiService, mockUserRepo)
  })
})
```

#### Integration Testing
```typescript
// Test actual database operations
describe('UserRepository Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })
  
  afterEach(async () => {
    await cleanupTestData()
  })
  
  test('should create user with phone number', async () => {
    const user = await userRepository.create({
      phone_number: '+15551234567',
      name: 'Test User'
    })
    expect(user.id).toBeDefined()
  })
})
```

---

### Deployment & Infrastructure

#### Environment Management
```typescript
// Type-safe environment configuration
interface Config {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  GROQ_API_KEY: string
  MEMORY_PROVIDER: 'postgresql' | 'mem0'
}

const config: Config = {
  SUPABASE_URL: Deno.env.get('SUPABASE_URL')!,
  // ... validate all required env vars at startup
}
```

#### Health Check Implementation
```typescript
// Comprehensive health monitoring
class HealthChecker {
  async checkAll(): Promise<HealthStatus> {
    const [database, memory, ai] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemoryService(),
      this.checkAIService()
    ])
    
    return {
      status: this.determineOverallStatus([database, memory, ai]),
      components: { database, memory, ai },
      timestamp: new Date().toISOString()
    }
  }
}
```

---

### Monitoring & Observability

#### Structured Logging
```typescript
// Consistent log structure
interface LogEntry {
  level: 'info' | 'warn' | 'error'
  message: string
  userId?: string
  duration?: number
  error?: Error
  timestamp: string
}

class Logger {
  static info(message: string, context?: Partial<LogEntry>) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }))
  }
}
```

#### Performance Metrics
```typescript
// Track key performance indicators
class MetricsCollector {
  static async trackResponseTime(fn: () => Promise<any>, operation: string) {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.recordMetric('response_time', duration, { operation })
      return result
    } catch (error) {
      this.recordMetric('error_count', 1, { operation, error: error.message })
      throw error
    }
  }
}
```

---

## Development Guidelines

### Git Workflow
1. **Feature Branches**: `feature/TASK-ID-description`
2. **Commit Messages**: `[TASK-ID] Brief description of change`
3. **Pull Requests**: Required for all changes, include tests
4. **Branch Protection**: Main branch requires passing tests

### Code Review Checklist
- [ ] SOLID principles followed
- [ ] Error handling implemented
- [ ] Tests written and passing
- [ ] Performance implications considered
- [ ] Security vulnerabilities checked
- [ ] Documentation updated

### Performance Targets
- **Edge Function Cold Start**: <100ms
- **Database Query**: <50ms for user lookups
- **AI Response Generation**: <200ms
- **Memory Search**: <50ms
- **End-to-End Response**: <500ms

---

**Last Updated**: 2024-12-19  
**Architecture Version**: 2.0 (Supabase Migration)  
**Next Review**: Phase 2 implementation planning 
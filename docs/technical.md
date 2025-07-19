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

## Goal Conflict Detection & Amendment System

### Overview
Enhanced goal management system with **intelligent conflict detection** and **conversational user guidance**. Helps users maintain realistic, achievable goals through AI-powered analysis that asks permission rather than blocking progress.

### Core Philosophy: **Smart Detection, User Choice**
- ✅ **Create first, suggest later**: Goals are created successfully, then potential conflicts mentioned conversationally
- ✅ **Real conflicts only**: Detects actual problems (duplicates, time overload, contradictions) - not false positives  
- ✅ **Ask permission**: "Want to combine these?" instead of "3 conflicts detected!"
- ✅ **Specific messaging**: "Gym daily + Exercise daily - combine them?" instead of vague warnings

### Smart Conflict Detection

#### **1. Duplicate Activity Detection** 
Finds essentially the same goal:
```
❌ "Go to gym daily" + "Exercise daily" 
   → "'Gym daily' + 'Exercise daily' seem similar - combine them?"

✅ "Exercise daily" + "Study daily" = NO conflict (different activities)
```

#### **2. Time Overload Detection**
Calculates actual time requirements:
```
❌ "Study 3 hours daily" + "Code 4 hours daily" + "Workout 2 hours" = 9+ hours
   → "9+ hours daily seems tough - reduce scope?"

✅ "Exercise 1h" + "Study 1h" + "Cook 30min" = 2.5 hours = Fine!
```

#### **3. Resource Contradiction Detection**
Identifies conflicting behaviors:
```
❌ "Save $500/month" + "Buy expensive gadgets weekly"
   → "Saving vs spending conflict - pick priority?"

❌ "Eat healthy daily" + "Try new dessert shops"  
   → "Healthy vs unhealthy habits - choose focus?"
```

#### **4. Lifestyle Contradiction Detection**
Catches incompatible lifestyles:
```
❌ "Wake up 5AM daily" + "Party every weekend night"
   → "Early mornings + late nights = tough combo. Pick one?"

✅ "Wake up early" + "Exercise daily" = NO conflict (complementary)
```

### User Experience Examples

#### **Smart Goal Creation**
```
User: "Set goal: Go to gym daily"
AI: "'Gym daily' + 'Exercise daily' seem similar - combine them?" 
   (Goal still created successfully!)

vs OLD approach: "Conflict detected! Fix first! ⚠️"
```

#### **Conversational Amendments**
```
User: "Improve my goals"
AI: "Frequency too aggressive. Scale back?"

vs OLD: "3 improvements suggested. Apply them! 💪"
```

#### **Smart Goal Deletion**
```
User: "Delete exercise goal"
AI: "Exercise daily deleted! 1h freed up. Use wisely! 🎯"
   (Finds goal by name, shows time impact)
```

### Technical Implementation

#### Goal Load Calculation (Time-Based)
```typescript
function estimateGoalTimeRequirement(goal: any): number {
  // Extract explicit time: "2 hours", "30 minutes"
  const timeMatch = text.match(/(\d+)\s*(hour|minute)/);
  
  // Activity-based estimates:
  if (text.includes('workout')) return 1;      // 1 hour
  if (text.includes('study')) return 2;       // 2 hours  
  if (text.includes('meditate')) return 0.25; // 15 minutes
  
  // Frequency adjustment:
  if (frequency === 'daily') return estimate;
  if (frequency === '3x_weekly') return estimate * 0.6;
}
```

#### Duplicate Detection (Activity-Based)
```typescript
const duplicatePairs = [
  ['gym', 'exercise'], ['workout', 'exercise'],
  ['read', 'reading'], ['study', 'studying'],
  ['run', 'running'], ['jog', 'jogging']
];
```

#### Conversational Responses
```typescript
// Smart conflict messaging with permission-asking
conversational: "'Gym daily' + 'Exercise daily' seem similar - combine them?"

// vs old generic messaging  
OLD: "2 conflicts detected. Fix them first! ⚠️"
```

### Message Analysis Enhancement

#### **New Keywords Detected:**
- **Goal Management**: "delete goal", "remove goal", "drop goal"
- **Smart References**: "delete exercise goal" (finds by name)
- **Conflict Requests**: "overlapping goals", "goal problems"
- **Improvements**: "optimize goals", "better goals"

#### **Goal Reference Lookup:**
```typescript
// Finds goals by partial name matching
"delete exercise goal" → finds "Exercise daily" goal
"remove study" → finds "Study programming 2h daily"
```

### WhatsApp Integration (8-12 Word Constraint)

#### **Conversational Conflict Messages:**
```
Instead of: "3 conflicts detected. Fix them first! ⚠️"
Use: "'Gym daily' + 'Exercise daily' seem similar - combine them?"

Instead of: "Time conflict found. Reduce frequency now!"  
Use: "9+ hours daily seems tough - reduce scope?"
```

#### **Goal Deletion Feedback:**
```
Taskmaster: "Exercise daily deleted! 1h freed up. Use wisely! 🎯"
Cheerleader: "Exercise removed! 1h freed up. New opportunities! ✨"
```

### Error Handling & User Guidance

#### **Smart Goal Lookup:**
- Exact title match: "Exercise daily"
- Partial match: "exercise" → "Exercise daily"  
- Keyword match: "gym" → "Go to gym daily"
- Fallback: "No goal found matching 'xyz'. Try 'my goals' to see options."

#### **Permission-Based Flow:**
1. ✅ **Create/Update goal successfully**
2. 💡 **Mention potential conflicts conversationally**  
3. 🤝 **Ask user permission for changes**
4. 📊 **Provide specific context (time saved, etc.)**

### Performance & Reliability

- **Non-blocking**: Goals always created successfully, conflicts mentioned after
- **Smart caching**: Tool results cached for 5 minutes  
- **Fallback handling**: If conflict detection fails, proceed normally
- **Specific messaging**: Each conflict type has targeted suggestions
- **User choice**: System suggests, user decides

This approach maintains user momentum while providing intelligent guidance! [[memory:2188079]]

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
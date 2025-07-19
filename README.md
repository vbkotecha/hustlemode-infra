# HustleMode.ai Infrastructure

Production-ready AI coaching platform built on Supabase Edge Functions with Groq AI and WhatsApp integration.

## 🚀 Quick Start

```bash
# Deploy to production
./scripts/deploy-supabase.sh

# Run health check
./scripts/health-check.sh

# Test APIs
curl https://yzfclhnkxpgyxeklrvur.supabase.co/functions/v1/health
```

## 🧪 Testing Framework

### Testing Pyramid

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

### Test Commands

```bash
# Unit tests (fast, isolated)
deno task test:unit

# Integration tests (end-to-end workflows)
deno task test:integration

# Evaluations (LLM quality & UX)
deno task test:evaluations

# Performance tests
deno task test:performance

# All tests
deno task test:all

# Coverage report
deno task test:coverage
```

### Test Structure

```
tests/
├── unit/                          # Fast, isolated component tests
│   ├── ai-tools/                  # AI tool orchestration tests
│   ├── memory/                    # Memory service tests
│   ├── ai/                        # AI response generation tests
│   ├── database/                  # Database operation tests
│   ├── platforms/                 # Platform-specific tests
│   └── utils/                     # Utility function tests
├── integration/                   # End-to-end workflow tests
│   ├── api/                       # API endpoint tests
│   ├── workflows/                 # Complete user journey tests
│   ├── edge-functions/            # Supabase Edge Function tests
│   └── external/                  # External service integration tests
├── evaluations/                   # LLM quality & UX evaluations
│   ├── personality/               # Personality consistency tests
│   ├── response-quality/          # Response quality assessments
│   ├── tool-detection/            # AI tool detection accuracy
│   └── user-experience/           # End-user experience tests
├── fixtures/                      # Test data and mock responses
├── utils/                         # Testing utilities and helpers
└── config/                        # Test configuration
```

### Quality Thresholds

- **Unit Test Coverage**: 95%+
- **Integration Test Pass Rate**: 100%
- **Performance Targets**:
  - Cold Start: <100ms
  - Response Time: <500ms
  - Concurrent Requests: 10
- **Evaluation Scores**:
  - Personality Consistency: 0.8+
  - Response Quality: 0.9+
  - Tool Detection Accuracy: 0.95+

## 🏗️ Architecture

### Core Components

- **Supabase Edge Functions**: Serverless API endpoints
- **Groq AI**: Ultra-fast LLM inference (Llama 4 Maverick)
- **PostgreSQL**: Memory and user data storage
- **WhatsApp Business API**: Messaging platform integration

### Key Features

- **2-Personality System**: Taskmaster (tough love) & Cheerleader (positive support)
- **Ultra-Concise Responses**: 4-12 words for mobile optimization
- **AI Tool Orchestration**: Goal management, progress tracking, preference management
- **Memory Context**: Conversation history across all platforms
- **Quality Enforcement**: Automated code quality checks and file size limits

## 📊 Production Status

- **Health Check**: ✅ All services healthy
- **API Endpoints**: ✅ Health, Chat, WhatsApp working
- **AI Model**: ✅ Groq meta-llama/llama-3.1-70b-versatile
- **Memory Service**: ✅ PostgreSQL with full-text search
- **WhatsApp Integration**: ✅ Webhook verification and message processing
- **Quality Compliance**: 85% (32 violations remaining)

## 🔧 Development

### Prerequisites

- Deno 1.40+
- Supabase CLI
- Groq API key
- WhatsApp Business API access

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Set required variables
SUPABASE_URL=https://yzfclhnkxpgyxeklrvur.supabase.co
GROQ_API_KEY=your_groq_key_here
WHATSAPP_TOKEN=your_whatsapp_token_here
```

### Development Workflow

```bash
# 1. Run quality checks
./scripts/code-quality-check.sh

# 2. Run tests
deno task test:unit

# 3. Deploy changes
./scripts/deploy-supabase.sh

# 4. Verify deployment
./scripts/health-check.sh
```

## 📈 Performance Metrics

- **Cold Start**: ~50ms (vs 2-5s Azure Functions)
- **Response Time**: 200-500ms (vs 800-1500ms)
- **Memory Search**: <50ms (PostgreSQL full-text)
- **AI Inference**: <200ms (Groq Llama 4 Maverick)
- **Cost Savings**: 60-80% vs previous architecture

## 🔒 Security

- Row Level Security (RLS) on all database tables
- Service role authentication for Edge Functions
- WhatsApp webhook verification
- Input validation and sanitization
- Rate limiting on public endpoints

## 📚 Documentation

- [Architecture Overview](docs/architecture.mermaid)
- [API Documentation](docs/technical.md)
- [Testing Framework](docs/testing-framework.md)
- [Quality Enforcement](docs/quality-enforcement-system.md)
- [Deployment Guide](docs/deployment.md)

## 🤝 Contributing

1. Follow the quality enforcement rules
2. Write tests for new features
3. Use the deployment script (never raw commands)
4. Maintain file size limits
5. Run full test suite before deployment

## 📄 License

MIT License - see LICENSE file for details. 
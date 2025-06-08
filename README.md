# HustleMode.ai

HustleMode.ai is a GPT-powered motivational assistant designed to help users stay consistent with their goals and routines. It uses Azure AI Studio (Foundry) to orchestrate prompts and flows, providing a stateless, prompt-based workflow through public API endpoints.

## Architecture

### Core Components

1. **Prompt Layer**
   - Centralized prompt management
   - Version-controlled prompt templates
   - Environment-specific configurations

2. **AI Orchestration**
   - Azure AI Studio (Foundry) integration
   - Flow management and routing
   - Response processing and formatting

3. **API Layer**
   - RESTful endpoints
   - Stateless request handling
   - Standardized response formats

4. **Future Integration Points**
   - WhatsApp
   - SMS
   - Email

## Project Structure

```
hustlemode-infra/
├── prompts/              # Version-controlled prompt templates
│   ├── goals/           # Goal-related prompts
│   ├── motivation/      # Motivational prompts
│   └── routines/        # Routine-related prompts
├── api/                 # API implementation
│   ├── v1/             # API version 1
│   └── docs/           # API documentation
├── flows/              # Azure AI Studio flows
│   ├── goal-setting/   # Goal setting flows
│   └── check-in/       # Progress check-in flows
└── tests/              # Test suites
    ├── prompts/        # Prompt tests
    └── api/            # API tests
```

## Getting Started

1. Clone the repository
2. Set up Azure AI Studio (Foundry) credentials
3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

## Development

### Prompt Management
- Store prompts in `/prompts` directory
- Use semantic versioning
- Include metadata with each prompt
- Test all prompt variations

### API Development
- Follow RESTful conventions
- Version all endpoints
- Implement proper error handling
- Document using OpenAPI/Swagger

### Testing
- Unit test all prompt variations
- Integration test API endpoints
- Load test for concurrent requests

## Security

- API key management
- Rate limiting
- Input validation
- Response sanitization

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

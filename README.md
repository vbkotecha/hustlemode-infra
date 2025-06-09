# HustleMode.ai

HustleMode.ai is a GPT-powered motivational assistant designed to help users stay consistent with their goals and routines. Currently implemented as a WhatsApp bot with David Goggins-style motivational responses.

## Architecture

### Core Components

1. **API Layer**
   - FastAPI-based REST API
   - WhatsApp webhook integration
   - Stateless request handling

2. **Backend Services**
   - Prompt management
   - Cost control
   - Caching layer

3. **Functions**
   - Serverless function handlers
   - Database schema management

## Project Structure

```
hustlemode-infra/
├── src/                 # Source code
│   ├── api/            # FastAPI application
│   │   ├── main.py     # Main API application
│   │   ├── v1/         # API version 1
│   │   └── docs/       # API documentation
│   ├── backend/        # Backend services
│   │   ├── cache.py    # Caching implementation
│   │   ├── cost_control.py  # Cost management
│   │   └── prompts.py  # Prompt handling
│   └── functions/      # Serverless functions
│       ├── handler.py  # Function handlers
│       └── schema.sql  # Database schema
├── prompts/            # Prompt templates
│   ├── goals/         # Goal-related prompts
│   └── motivation/    # Motivational prompts
├── flows/             # AI workflow definitions
│   └── azure-ai-studio/
├── schemas/           # Data schemas
│   ├── azure-search/
│   ├── cosmos-db/
│   └── postgres/
├── tests/             # Test suites
│   ├── api/          # API tests
│   └── prompts/      # Prompt tests
├── deployment-config.json  # Deployment configuration
├── requirements.txt   # Python dependencies
├── package.json      # Node.js scripts
└── .env.example      # Environment variables template
```

## Getting Started

1. Clone the repository
2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the API locally:
   ```bash
   npm run dev
   # or directly: cd src/api && uvicorn main:app --reload
   ```

## Development

### API Development
- The main API is in `src/api/main.py`
- Uses FastAPI for REST endpoints
- WhatsApp webhook integration for bot functionality

### Testing
```bash
npm run test  # Run all tests
npm run lint  # Run linting
```

### Deployment
The application is configured for deployment to Azure App Service. See `deployment-config.json` for configuration details.

## Environment Variables

See `.env.example` for all required environment variables:
- WhatsApp Business API credentials
- Database connection settings
- Azure service configurations

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

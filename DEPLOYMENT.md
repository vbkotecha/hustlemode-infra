# HustleMode.ai WhatsApp Integration Deployment Guide

## Prerequisites

1. **Azure Account**
   - Active Azure subscription
   - Owner or Contributor access

2. **WhatsApp Business Account**
   - Verified WhatsApp Business account
   - Business phone number
   - Business profile set up

3. **Azure Resources**
   - Azure Communication Services
   - Azure OpenAI
   - Azure Cognitive Search
   - Azure App Service (for hosting)

## Setup Steps

### 1. Azure Communication Services Setup

1. Create Azure Communication Services resource:
   ```bash
   az communication create --name hustlemode-comm --resource-group your-resource-group --location eastus
   ```

2. Get the connection string:
   ```bash
   az communication list-key --name hustlemode-comm --resource-group your-resource-group
   ```

3. Configure WhatsApp channel:
   - Go to Azure Portal > Your Communication Service
   - Navigate to "Channels" > "WhatsApp"
   - Click "Connect WhatsApp Business Account"
   - Follow the setup wizard

### 2. WhatsApp Business API Setup

1. Create WhatsApp Business API account:
   - Go to [WhatsApp Business Platform](https://business.whatsapp.com/)
   - Create a new business account
   - Verify your business phone number

2. Get API credentials:
   - Note down your Business Account ID
   - Generate API token
   - Save the phone number ID

3. Configure webhook:
   - Set webhook URL to your Azure App Service endpoint
   - Configure webhook events (messages, status)
   - Save the webhook secret

### 3. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in the environment variables:
   - Azure Communication Services credentials
   - WhatsApp Business API credentials
   - Azure OpenAI credentials
   - Azure Cognitive Search credentials

### 4. Deploy to Azure

1. Create Azure App Service:
   ```bash
   az appservice plan create --name hustlemode-plan --resource-group your-resource-group --sku B1
   az webapp create --name hustlemode-app --resource-group your-resource-group --plan hustlemode-plan
   ```

2. Configure environment variables:
   ```bash
   az webapp config appsettings set --name hustlemode-app --resource-group your-resource-group --settings @.env
   ```

3. Deploy the application:
   ```bash
   az webapp deployment source config-local-git --name hustlemode-app --resource-group your-resource-group
   git remote add azure <git-url>
   git push azure main
   ```

### 5. Testing

1. Test webhook:
   ```bash
   curl -X POST https://your-app.azurewebsites.net/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -H "X-Hub-Signature-256: your-signature" \
     -d '{"entry":[{"changes":[{"field":"messages"}]}]}'
   ```

2. Test message sending:
   ```bash
   curl -X POST https://your-app.azurewebsites.net/api/send \
     -H "Content-Type: application/json" \
     -d '{"to":"+1234567890","message":"STAY HARD"}'
   ```

## Monitoring

1. Set up Azure Monitor:
   - Configure Application Insights
   - Set up alerts for errors
   - Monitor message delivery rates

2. Log monitoring:
   - Check Azure App Service logs
   - Monitor webhook responses
   - Track message delivery status

## Security Considerations

1. **API Security**
   - Keep API keys secure
   - Rotate tokens regularly
   - Use HTTPS only

2. **Data Protection**
   - Encrypt sensitive data
   - Implement rate limiting
   - Monitor for abuse

3. **Compliance**
   - Follow WhatsApp Business Policy
   - Implement data retention
   - Handle user consent

## Troubleshooting

1. **Webhook Issues**
   - Check webhook URL
   - Verify signature
   - Monitor response codes

2. **Message Delivery**
   - Check phone number format
   - Verify message content
   - Monitor delivery status

3. **API Errors**
   - Check API credentials
   - Verify rate limits
   - Monitor error logs

## Maintenance

1. **Regular Updates**
   - Update dependencies
   - Check API changes
   - Monitor deprecations

2. **Backup**
   - Backup configuration
   - Export user data
   - Save message history

3. **Scaling**
   - Monitor usage
   - Scale resources
   - Optimize performance 
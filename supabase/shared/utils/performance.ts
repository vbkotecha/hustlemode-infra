// Performance monitoring utilities - Extracted from utils.ts

export function measureTime<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  
  return operation().then(
    result => ({
      result,
      duration: Date.now() - start,
    })
  );
}

export function logRequest(method: string, url: string, body?: any): void {
  console.log(`📥 ${method} ${url}`, body ? `Body: ${JSON.stringify(body).substring(0, 200)}...` : '');
}

export function logResponse(status: number, duration: number, details?: string): void {
  const emoji = status < 400 ? '✅' : '❌';
  console.log(`${emoji} Response ${status} (${duration}ms)${details ? ` - ${details}` : ''}`);
}

export function isDevelopment(): boolean {
  return Deno.env.get('ENVIRONMENT') === 'development';
}

export function isProduction(): boolean {
  return Deno.env.get('ENVIRONMENT') === 'production';
} 
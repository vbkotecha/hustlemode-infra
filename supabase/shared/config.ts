// Refactored Configuration - Using extracted modules
import { 
  loadEnvironmentVariables, 
  validateEnvironmentConfig, 
  type EnvironmentConfig 
} from './config/environment.ts';

// Re-export for backward compatibility
export type Config = EnvironmentConfig;

// Re-export constants for convenience
export * from './config/constants.ts';
export * from './config/personalities.ts';

let cachedConfig: EnvironmentConfig | null = null;

export function getConfig(): EnvironmentConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = loadEnvironmentVariables();
  
  // Validate configuration
  const validation = validateEnvironmentConfig(cachedConfig);
  
  if (!validation.isValid) {
    console.error('❌ Configuration validation failed:');
    console.error('Missing required environment variables:', validation.missingVars);
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Configuration warnings:', validation.warnings);
    }
    
    throw new Error(`Missing required environment variables: ${validation.missingVars.join(', ')}`);
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:', validation.warnings);
  }

  return cachedConfig;
}

export function reloadConfig(): EnvironmentConfig {
  cachedConfig = null;
  return getConfig();
}

export function isConfigLoaded(): boolean {
  return cachedConfig !== null;
} 
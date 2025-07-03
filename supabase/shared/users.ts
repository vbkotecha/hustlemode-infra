// Shared User Management Service
// Eliminates duplication of user operations across functions

// User operations - re-exports from database directory
export {
  getOrCreateUserByPhone as getUserOrCreate,
  getUserPreferences,
  updateUserLastActive 
} from './database/index.ts'; 
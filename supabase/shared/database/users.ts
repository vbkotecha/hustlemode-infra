// User database operations - re-exports from focused modules
export { getOrCreateUserByPhone } from './user-creation.ts';
export { 
  getUserPreferences, 
  updateUserPreferences, 
  createDefaultPreferences 
} from './user-preferences.ts';
export { updateUserLastActive } from './user-activity.ts'; 
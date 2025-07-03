// User activity tracking operations
import { getSupabaseClient } from './client.ts';

export async function updateUserLastActive(userId: string): Promise<void> {
  const db = getSupabaseClient();
  
  try {
    await db
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId);
  } catch (error) {
    console.warn(`⚠️ Failed to update last_active for user ${userId}:`, error);
    // Non-critical error, don't throw
  }
} 
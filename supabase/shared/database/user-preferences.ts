// User preferences operations
import type { UserPreferences } from '../types.ts';
import { DatabaseError } from '../types.ts';
import { getSupabaseClient } from './client.ts';

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const db = getSupabaseClient();
  
  try {
    const { data, error } = await db
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new DatabaseError(`Failed to fetch preferences: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ Error fetching preferences for user ${userId}:`, error);
    return null;
  }
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<UserPreferences>
): Promise<boolean> {
  const db = getSupabaseClient();
  
  try {
    const { error } = await db
      .from('user_preferences')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError(`Failed to update preferences: ${error.message}`);
    }

    console.log(`⚙️ Updated preferences for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating preferences for user ${userId}:`, error);
    return false;
  }
}

export async function createDefaultPreferences(userId: string): Promise<void> {
  const db = getSupabaseClient();
  
  const { error: prefsError } = await db
    .from('user_preferences')
    .insert({
      user_id: userId,
      default_personality: 'taskmaster',
      groq_temperature: 0.8,
      check_in_frequency: 'daily',
      reminder_enabled: true,
      weekend_check_ins: false,
      ai_memory_enabled: true,
    });

  if (prefsError) {
    console.warn(`⚠️ Failed to create user preferences: ${prefsError.message}`);
  }
} 
// User-specific database operations (extracted from database.ts)
import type { User, UserPreferences, DatabaseError } from '../types.ts';
import { getSupabaseClient } from './client.ts';

export async function getOrCreateUserByPhone(phoneNumber: string): Promise<User> {
  const db = getSupabaseClient();
  
  try {
    // First, try to get existing user with preferences
    const { data: existingUser, error: fetchError } = await db
      .from('users')
      .select(`
        *,
        user_preferences (*)
      `)
      .eq('phone_number', phoneNumber)
      .single();

    if (existingUser && !fetchError) {
      console.log(`👤 Found existing user: ${phoneNumber}`);
      return existingUser;
    }

    // Create new user if not found
    const userId = crypto.randomUUID();
    
    const { data: newUser, error: insertError } = await db
      .from('users')
      .insert({
        id: userId,
        phone_number: phoneNumber,
        timezone: 'UTC',
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      throw new DatabaseError(`Failed to create user: ${insertError.message}`);
    }

    // Create default preferences
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

    console.log(`✅ Created new user: ${phoneNumber}`);
    return newUser;

  } catch (error) {
    console.error(`❌ Database error for user ${phoneNumber}:`, error);
    throw new DatabaseError(`Database operation failed: ${error.message}`);
  }
}

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
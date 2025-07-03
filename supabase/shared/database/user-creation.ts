// User creation and retrieval operations
import type { User, DatabaseError } from '../types.ts';
import { getSupabaseClient } from './client.ts';
import { createDefaultPreferences } from './user-preferences.ts';

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
    return await createNewUser(phoneNumber);

  } catch (error) {
    console.error(`❌ Database error for user ${phoneNumber}:`, error);
    throw new DatabaseError(`Database operation failed: ${error.message}`);
  }
}

async function createNewUser(phoneNumber: string): Promise<User> {
  const db = getSupabaseClient();
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
  await createDefaultPreferences(userId);
  
  console.log(`✅ Created new user: ${phoneNumber}`);
  return newUser;
}

 
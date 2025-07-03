// Shared User Management Service
// Eliminates duplication of user operations across functions

export async function getUserOrCreate(phoneNumber: string, supabase: any) {
  try {
    // Ensure phone number has + prefix for database constraint
    const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // First, try to get existing user
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, phone_number')
      .eq('phone_number', formattedPhoneNumber)
      .single();

    if (userData && !userError) {
      console.log(`👤 Found existing user: ${formattedPhoneNumber}`);
      return userData;
    }

    // User not found, create new user
    if (userError && userError.code === 'PGRST116') {
      console.log(`👤 Creating new user for ${formattedPhoneNumber}`);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone_number: formattedPhoneNumber,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
        .select('id, phone_number')
        .single();

      if (createError) {
        console.error('❌ Failed to create user:', createError);
        return null;
      }

      // Create default preferences for new user
      await supabase
        .from('user_preferences')
        .insert({
          user_id: newUser.id,
          default_personality: 'taskmaster',
          groq_temperature: 0.8,
          ai_memory_enabled: true
        });

      console.log(`✅ Created new user with ID: ${newUser.id}`);
      return newUser;
    } else {
      console.error('❌ Database error:', userError);
      return null;
    }

  } catch (error) {
    console.error('❌ Error in getUserOrCreate:', error);
    return null;
  }
}

export async function getUserPreferences(userId: string, supabase: any) {
  try {
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('default_personality, groq_temperature, ai_memory_enabled')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching preferences:', error);
      return null;
    }

    return preferences;
  } catch (error) {
    console.error('❌ Error in getUserPreferences:', error);
    return null;
  }
}

export async function updateUserLastActive(userId: string, supabase: any) {
  try {
    await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId);
  } catch (error) {
    console.warn(`⚠️ Failed to update last_active for user ${userId}:`, error);
    // Non-critical error, don't throw
  }
} 
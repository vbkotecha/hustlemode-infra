// Database health checks - Extracted from database.ts
import { getSupabaseClient } from './client.ts';

export async function checkDatabaseHealth(): Promise<{ healthy: boolean; latency: number }> {
  const db = getSupabaseClient();
  const startTime = Date.now();
  
  try {
    const { error } = await db
      .from('users')
      .select('count')
      .limit(1);

    const latency = Date.now() - startTime;
    
    return {
      healthy: !error,
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - startTime,
    };
  }
}

export async function validateDatabaseSchema(): Promise<boolean> {
  const db = getSupabaseClient();
  
  try {
    // Check if required tables exist
    const { data: tables, error } = await db
      .rpc('get_table_names');

    if (error) {
      console.error('❌ Failed to validate database schema:', error);
      return false;
    }

    const requiredTables = ['users', 'user_preferences'];
    const missingTables = requiredTables.filter(table => 
      !tables?.some((t: any) => t.table_name === table)
    );

    if (missingTables.length > 0) {
      console.error(`❌ Missing database tables: ${missingTables.join(', ')}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Database schema validation failed:', error);
    return false;
  }
} 
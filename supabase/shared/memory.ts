import type { MemoryResult } from './types.ts';
import { getConfig, PERFORMANCE } from './config.ts';
import { getSupabaseClient } from './database.ts';

// Abstract Memory Service Interface
export interface IMemoryService {
  searchMemories(query: string, userId: string, limit?: number): Promise<MemoryResult[]>;
  addMemory(content: string, userId: string, metadata?: Record<string, any>): Promise<boolean>;
  getMemories(userId: string, limit?: number): Promise<MemoryResult[]>;
  deleteMemory(memoryId: string): Promise<boolean>;
  checkHealth(): Promise<{ healthy: boolean; latency: number }>;
}

// PostgreSQL Memory Implementation
class PostgreSQLMemoryService implements IMemoryService {
  private db = getSupabaseClient();

  async searchMemories(query: string, userId: string, limit: number = 5): Promise<MemoryResult[]> {
    try {
      // Simple PostgreSQL text search for now
      // Later can upgrade to vector similarity search
      const { data, error } = await this.db
        .from('conversation_memory')
        .select('*')
        .eq('user_id', userId)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ PostgreSQL memory search error:', error);
        return [];
      }

      console.log(`🧠 Found ${data?.length || 0} memories for user ${userId}`);
      
      return (data || []).map(row => ({
        memory: row.content,
        score: 0.8, // Fixed score for simple text search
        metadata: row.metadata || {}
      }));

    } catch (error) {
      console.error('❌ Memory search error:', error);
      return [];
    }
  }

  async addMemory(content: string, userId: string, metadata?: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await this.db
        .from('conversation_memory')
        .insert({
          user_id: userId,
          content,
          metadata: {
            timestamp: new Date().toISOString(),
            platform: 'whatsapp',
            ...metadata,
          },
        });

      if (error) {
        console.error('❌ PostgreSQL memory storage error:', error);
        return false;
      }

      console.log(`💾 Added memory for user ${userId}`);
      return true;

    } catch (error) {
      console.error('❌ Memory storage error:', error);
      return false;
    }
  }

  async getMemories(userId: string, limit: number = 50): Promise<MemoryResult[]> {
    try {
      const { data, error } = await this.db
        .from('conversation_memory')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ PostgreSQL get memories error:', error);
        return [];
      }

      return (data || []).map(row => ({
        memory: row.content,
        score: 1.0,
        metadata: row.metadata || {}
      }));

    } catch (error) {
      console.error('❌ Error fetching memories:', error);
      return [];
    }
  }

  async deleteMemory(memoryId: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from('conversation_memory')
        .delete()
        .eq('id', memoryId);

      if (error) {
        console.error('❌ PostgreSQL memory deletion error:', error);
        return false;
      }

      console.log(`🗑️ Deleted memory ${memoryId}`);
      return true;

    } catch (error) {
      console.error('❌ Memory deletion error:', error);
      return false;
    }
  }

  async checkHealth(): Promise<{ healthy: boolean; latency: number }> {
    const startTime = Date.now();
    
    try {
      // Test with a simple query
      const { error } = await this.db
        .from('conversation_memory')
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
}

// Mem0 Cloud Implementation (for future use)
class Mem0MemoryService implements IMemoryService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const config = getConfig();
    this.apiKey = config.MEM0_API_KEY || '';
    this.baseUrl = 'https://api.mem0.ai/v1';
  }

  async searchMemories(query: string, userId: string, limit: number = 5): Promise<MemoryResult[]> {
    // Mem0 implementation would go here
    console.log('🔮 Mem0 not implemented yet, using PostgreSQL fallback');
    return [];
  }

  async addMemory(content: string, userId: string, metadata?: Record<string, any>): Promise<boolean> {
    // Mem0 implementation would go here
    console.log('🔮 Mem0 not implemented yet, using PostgreSQL fallback');
    return false;
  }

  async getMemories(userId: string, limit?: number): Promise<MemoryResult[]> {
    console.log('🔮 Mem0 not implemented yet, using PostgreSQL fallback');
    return [];
  }

  async deleteMemory(memoryId: string): Promise<boolean> {
    console.log('🔮 Mem0 not implemented yet, using PostgreSQL fallback');
    return false;
  }

  async checkHealth(): Promise<{ healthy: boolean; latency: number }> {
    return { healthy: false, latency: 0 };
  }
}

// Factory function to create the appropriate memory service
export function createMemoryService(): IMemoryService {
  const memoryProvider = Deno.env.get('MEMORY_PROVIDER') || 'postgresql';
  
  switch (memoryProvider) {
    case 'mem0':
      console.log('🔮 Using Mem0 Cloud memory service');
      return new Mem0MemoryService();
    case 'postgresql':
    default:
      console.log('🗄️ Using PostgreSQL memory service');
      return new PostgreSQLMemoryService();
  }
}

// Export the service instance
export const MemoryService = createMemoryService(); 
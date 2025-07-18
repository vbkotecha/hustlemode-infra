import type { MemoryResult } from './types.ts';
import { getSupabaseClient } from './database/index.ts';

export interface IMemoryService {
  searchMemories(query: string, userId: string, limit?: number): Promise<MemoryResult[]>;
  addMemory(content: string, userId: string, metadata?: Record<string, any>): Promise<boolean>;
  getMemories(userId: string, limit?: number): Promise<MemoryResult[]>;
  checkHealth(): Promise<{ healthy: boolean; latency: number }>;
}

class PostgreSQLMemoryService implements IMemoryService {
  private _db: any = null;

  private get db() {
    if (!this._db) {
      this._db = getSupabaseClient();
    }
    return this._db;
  }

  async searchMemories(query: string, userId: string, limit: number = 5): Promise<MemoryResult[]> {
    try {
      const { data, error } = await this.db
        .from('conversation_memory')
        .select('*')
        .eq('user_id', userId)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) return [];
      return (data || []).map(row => ({ memory: row.content, score: 0.8, metadata: row.metadata || {} }));
    } catch (error) {
      console.error('❌ Memory search error:', error);
      return [];
    }
  }

  async addMemory(content: string, userId: string, metadata?: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await this.db.from('conversation_memory').insert({
        user_id: userId, content,
        metadata: { timestamp: new Date().toISOString(), platform: 'whatsapp', ...metadata },
      });
      return !error;
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
      if (error) return [];
      return (data || []).map(row => ({ memory: row.content, score: 1.0, metadata: row.metadata || {} }));
    } catch (error) {
      return [];
    }
  }

  async checkHealth(): Promise<{ healthy: boolean; latency: number }> {
    const startTime = Date.now();
    try {
      const { error } = await this.db.from('conversation_memory').select('count').limit(1);
      return { healthy: !error, latency: Date.now() - startTime };
    } catch (error) {
      return { healthy: false, latency: Date.now() - startTime };
    }
  }
}

// Export lazy-loaded singleton instance to prevent import-time initialization
let _memoryServiceInstance: IMemoryService | null = null;

function getMemoryServiceInstance(): IMemoryService {
  if (!_memoryServiceInstance) {
    _memoryServiceInstance = new PostgreSQLMemoryService();
  }
  return _memoryServiceInstance;
}

// Export singleton with lazy loading
export const MemoryService = {
  searchMemories: (query: string, userId: string, limit?: number) => 
    getMemoryServiceInstance().searchMemories(query, userId, limit),
  addMemory: (content: string, userId: string, context?: string) => 
    getMemoryServiceInstance().addMemory(content, userId, context),
  getMemories: (userId: string, limit?: number) => 
    getMemoryServiceInstance().getMemories(userId, limit),
  checkHealth: () => 
    getMemoryServiceInstance().checkHealth()
};

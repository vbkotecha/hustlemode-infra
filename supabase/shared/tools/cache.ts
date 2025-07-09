// Tool Result Caching System
import { getSupabaseClient } from '../database/index.ts';
import type { ToolResult, ToolExecution, Platform } from './types.ts';

const db = getSupabaseClient();

export async function getCachedToolResult(
  execution: ToolExecution,
  cacheKey: string
): Promise<ToolResult | null> {
  try {
    const { data, error } = await db
      .from('tool_executions')
      .select('execution_result, created_at')
      .eq('user_id', execution.user_id)
      .eq('tool_name', execution.tool_name)
      .eq('platform', execution.platform)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      ...data.execution_result,
      cached: true
    } as ToolResult;
  } catch (error) {
    console.warn('Cache lookup failed:', error);
    return null;
  }
}

export async function setCachedToolResult(
  execution: ToolExecution,
  result: ToolResult,
  cacheTtlSeconds?: number
): Promise<void> {
  if (!cacheTtlSeconds) return;

  try {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + cacheTtlSeconds);

    await db
      .from('tool_executions')
      .insert({
        user_id: execution.user_id,
        tool_name: execution.tool_name,
        tool_parameters: execution.parameters,
        execution_result: result,
        platform: execution.platform,
        expires_at: expiresAt.toISOString()
      });
  } catch (error) {
    console.warn('Cache storage failed:', error);
    // Non-fatal - continue without caching
  }
}

export async function clearExpiredCache(): Promise<number> {
  try {
    const { data } = await db
      .from('tool_executions')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');
    return data?.length || 0;
  } catch (error) {
    console.warn('Cache cleanup failed:', error);
    return 0;
  }
}

export function generateCacheKey(execution: ToolExecution): string {
  const paramString = JSON.stringify(execution.parameters, Object.keys(execution.parameters).sort());
  return `${execution.tool_name}:${execution.user_id}:${execution.platform}:${paramString}`;
} 
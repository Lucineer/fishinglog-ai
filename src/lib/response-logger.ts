// ═══════════════════════════════════════════════════════════════════
// Response Logger — Track deadband efficiency
// Author: Superinstance & Lucineer (DiGennaro et al.)
// ═══════════════════════════════════════════════════════════════════

export interface EfficiencyStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  tokensSaved: number;
  lastUpdated: number;
}

const STATS_KEY = 'deadband:stats';

/** Load efficiency stats from KV */
export async function loadStats(kv: KVNamespace): Promise<EfficiencyStats> {
  const raw = await kv.get(STATS_KEY, 'json') as EfficiencyStats | null;
  return raw || { totalRequests: 0, cacheHits: 0, cacheMisses: 0, tokensSaved: 0, lastUpdated: Date.now() };
}

/** Record a cache hit */
export async function recordHit(kv: KVNamespace, tokensSaved = 0): Promise<EfficiencyStats> {
  const stats = await loadStats(kv);
  stats.totalRequests++;
  stats.cacheHits++;
  stats.tokensSaved += tokensSaved;
  stats.lastUpdated = Date.now();
  await kv.put(STATS_KEY, JSON.stringify(stats));
  return stats;
}

/** Record a cache miss (LLM called) */
export async function recordMiss(kv: KVNamespace): Promise<EfficiencyStats> {
  const stats = await loadStats(kv);
  stats.totalRequests++;
  stats.cacheMisses++;
  stats.lastUpdated = Date.now();
  await kv.put(STATS_KEY, JSON.stringify(stats));
  return stats;
}

/** Get hit rate as percentage */
export function hitRate(stats: EfficiencyStats): number {
  return stats.totalRequests > 0 ? (stats.cacheHits / stats.totalRequests) * 100 : 0;
}

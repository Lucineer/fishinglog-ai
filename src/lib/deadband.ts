// ═══════════════════════════════════════════════════════════════════
// Deadband Response Cache — Conservation of Intelligence
// Author: Superinstance & Lucineer (DiGennaro et al.)
//
// Normalizes user input, checks KV cache within similarity tolerance,
// returns cached response if match found, otherwise calls LLM and stores.
// ═══════════════════════════════════════════════════════════════════

export interface CacheEntry {
  response: string;
  normalizedInput: string;
  timestamp: number;
  hitCount: number;
  inputTokens: number;
  outputTokens: number;
}

export interface DeadbandResult {
  response: string;
  fromCache: boolean;
  cacheKey: string;
}

const CACHE_TTL_SECONDS = 86400; // 24h

/** Normalize input: lowercase, collapse whitespace, strip punctuation, trim */
export function normalizeInput(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Generate a cache key from normalized input */
export function cacheKey(normalized: string, prefix = ''): string {
  const truncated = normalized.slice(0, 200);
  const data = prefix ? `${prefix}:${truncated}` : truncated;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const c = data.charCodeAt(i);
    hash = ((hash << 5) - hash + c) | 0;
  }
  return `deadband:${hash.toString(36)}:${truncated.slice(0, 60)}`;
}

/** Check if two normalized strings are within tolerance (Jaccard similarity) */
export function withinTolerance(a: string, b: string, threshold = 0.85): boolean {
  if (a === b) return true;
  const wordsA = new Set(a.split(' '));
  const wordsB = new Set(b.split(' '));
  if (wordsA.size === 0 && wordsB.size === 0) return true;
  let intersection = 0;
  for (const w of wordsA) if (wordsB.has(w)) intersection++;
  const union = wordsA.size + wordsB.size - intersection;
  return union > 0 && intersection / union >= threshold;
}

/** Check cache for a matching response */
export async function checkCache(
  kv: KVNamespace,
  normalizedInput: string,
  prefix: string,
): Promise<CacheEntry | null> {
  const key = cacheKey(normalizedInput, prefix);
  const raw = await kv.get(key, 'json') as CacheEntry | null;
  if (raw) return raw;

  // Fuzzy: scan recent keys for tolerance match
  const list = await kv.list({ prefix: 'deadband:', limit: 50 });
  for (const k of list.keys) {
    if (k.name === key) continue;
    const entry = await kv.get(k.name, 'json') as CacheEntry | null;
    if (entry && withinTolerance(normalizedInput, entry.normalizedInput)) {
      await kv.put(key, JSON.stringify({ ...entry, hitCount: entry.hitCount + 1 }), {
        expirationTtl: CACHE_TTL_SECONDS,
      });
      return entry;
    }
  }
  return null;
}

/** Store a response in cache */
export async function storeCache(
  kv: KVNamespace,
  normalizedInput: string,
  response: string,
  prefix: string,
  inputTokens = 0,
  outputTokens = 0,
): Promise<string> {
  const key = cacheKey(normalizedInput, prefix);
  const entry: CacheEntry = {
    response, normalizedInput,
    timestamp: Date.now(), hitCount: 0,
    inputTokens, outputTokens,
  };
  await kv.put(key, JSON.stringify(entry), { expirationTtl: CACHE_TTL_SECONDS });
  return key;
}

/** Main: check cache, return cached or null */
export async function deadbandCheck(
  kv: KVNamespace,
  userInput: string,
  prefix: string,
): Promise<DeadbandResult | null> {
  const normalized = normalizeInput(userInput);
  const cached = await checkCache(kv, normalized, prefix);
  if (cached) {
    return { response: cached.response, fromCache: true, cacheKey: cacheKey(normalized, prefix) };
  }
  return null;
}

/** Store LLM response in deadband cache */
export async function deadbandStore(
  kv: KVNamespace,
  userInput: string,
  response: string,
  prefix: string,
  inputTokens = 0,
  outputTokens = 0,
): Promise<string> {
  return storeCache(kv, normalizeInput(userInput), response, prefix, inputTokens, outputTokens);
}

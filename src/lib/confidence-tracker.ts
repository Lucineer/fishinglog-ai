/**
 * Confidence Tracker — Phase 1B
 * Tracks per-topic confidence scores over time, signals when topics
 * can demote to smaller/cheaper models.
 */

interface TopicSnapshot {
  score: number;       // 0–1 rolling average
  count: number;       // number of interactions
  lastUpdated: number; // epoch ms
}

export interface ConfidenceRecord {
  topic: string;
  score: number;
  count: number;
  eligibleForDemotion: boolean;
  trend: 'rising' | 'falling' | 'stable';
}

const DEMOTION_THRESHOLD = 0.85;  // confidence above this → demotable
const MIN_INTERACTIONS = 10;      // need this many before demotion
const DECAY = 0.1;               // how fast old scores fade per interaction
const SNAPSHOT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h window

type TopicMap = Record<string, TopicSnapshot>;

export class ConfidenceTracker {
  private topics: TopicMap = {};

  /** Classify a user message into a topic (simple keyword/regex bucket). */
  classify(message: string): string {
    const lower = message.toLowerCase();
    const buckets: [string, string[]][] = [
      ['greeting', ['hello', 'hi ', 'hey', 'howdy', 'good morning', 'good evening']],
      ['qa', ['what', 'how', 'why', 'when', 'where', 'who', 'explain', 'tell me']],
      ['task', ['do ', 'make', 'create', 'write', 'build', 'generate', 'summarize']],
      ['creative', ['story', 'poem', 'joke', 'imagine', 'dream', 'fiction']],
    ];
    for (const [topic, keywords] of buckets) {
      if (keywords.some(k => lower.includes(k))) return topic;
    }
    return 'general';
  }

  /** Record an interaction and update rolling confidence. */
  record(topic: string, success: boolean): void {
    const prev = this.topics[topic] ?? { score: 0.5, count: 0, lastUpdated: Date.now() };
    const now = Date.now();
    const ageFactor = Math.max(0, 1 - ((now - prev.lastUpdated) / SNAPSHOT_WINDOW_MS));
    const weight = Math.min(1, prev.count / MIN_INTERACTIONS);
    const decayed = prev.score * (1 - DECAY) * ageFactor + prev.score * DECAY * weight;
    const target = success ? 1.0 : 0.0;
    prev.score = decayed * (1 - (1 / (prev.count + 1))) + target * (1 / (prev.count + 1));
    prev.count++;
    prev.lastUpdated = now;
    this.topics[topic] = prev;
  }

  /** Get confidence record for a topic. */
  get(topic: string): ConfidenceRecord {
    const s = this.topics[topic];
    if (!s) return { topic, score: 0.5, count: 0, eligibleForDemotion: false, trend: 'stable' };
    return {
      topic,
      score: Math.round(s.score * 1000) / 1000,
      count: s.count,
      eligibleForDemotion: s.score >= DEMOTION_THRESHOLD && s.count >= MIN_INTERACTIONS,
      trend: s.score > 0.6 ? 'rising' : s.score < 0.4 ? 'falling' : 'stable',
    };
  }

  /** Get all tracked topics. */
  getAll(): ConfidenceRecord[] {
    return Object.keys(this.topics).map(t => this.get(t));
  }

  /** Serialize for KV persistence. */
  serialize(): string {
    return JSON.stringify(this.topics);
  }

  /** Deserialize from KV. */
  deserialize(json: string): void {
    try { this.topics = JSON.parse(json); } catch { this.topics = {}; }
  }

  /** Should this topic use a lighter model? */
  shouldDemote(topic: string): boolean {
    return this.get(topic).eligibleForDemotion;
  }
}

// Singleton for worker reuse
let _instance: ConfidenceTracker | null = null;
export function getTracker(): ConfidenceTracker {
  if (!_instance) _instance = new ConfidenceTracker();
  return _instance;
}

/**
 * audio.ts — Captain voice interface
 *
 * Pipeline:
 *   [Headset Mic] → Noise Suppression (RNNoise) → Wake Word → Command Classifier
 *                  → Local Whisper-tiny → Intent Recognition → Action Execution
 *                  → Always-listening buffer (30s rolling) for incident capture
 *
 * TODO: Integrate with Jetson audio hardware via ALSA/PulseAudio
 */

// ===== Types =====

export type VoiceIntent =
  | 'log_catch'
  | 'identify_fish'
  | 'report_issue'
  | 'train_ai'
  | 'query'
  | 'cancel'
  | 'repeat'
  | 'status';

export interface VoiceCommand {
  commandId: string;
  rawAudio: ArrayBuffer;
  transcribedText: string;
  intent: VoiceIntent;
  parameters: Record<string, string | number>;
  confidence: number;
  timestamp: Date;
  executedActions: ExecutedAction[];
}

export interface ExecutedAction {
  type: string;
  success: boolean;
  detail: string;
}

export interface ConversationContext {
  recentCommands: VoiceCommand[];
  fishingContext: {
    currentGear: string;
    location: { lat: number; lon: number };
    targetSpecies: string;
    depth: number;
    waterTemp: number;
  };
  activeDialogue?: TrainingSession;
}

export interface TrainingSession {
  speciesInQuestion: string;
  correctedLabel: string;
  frameId: string;
  captainExplanation: string;
  completed: boolean;
}

// ===== Wake Word Detection (Stub) =====

const WAKE_WORD = 'hey cap';

/**
 * Listen for wake word in audio stream.
 * In production, uses Porcupine or similar lightweight wake word engine.
 */
export async function detectWakeWord(
  _audioChunk: ArrayBuffer,
): Promise<boolean> {
  // TODO: Replace with actual wake word detection
  // 1. Feed audio chunk to wake word engine
  // 2. Return true if "Hey Cap" detected
  // 3. Two-tier detection: wake word + command phrase
  return false;
}

// ===== Speech-to-Text (Stub) =====

/**
 * Transcribe audio to text using local Whisper-tiny.
 * Runs entirely on-device for offline capability.
 */
export async function transcribeAudio(
  _audioData: ArrayBuffer,
): Promise<{ text: string; confidence: number }> {
  // TODO: Replace with Whisper-tiny inference via TensorRT
  // 1. Convert PCM to Whisper input format (16kHz, mono)
  // 2. Run Whisper-tiny decoder
  // 3. Return transcribed text with confidence
  console.info('[audio] Transcription requested (stub)');
  return { text: '', confidence: 0 };
}

// ===== Intent Recognition (Stub) =====

const INTENT_PATTERNS: Array<{ pattern: RegExp; intent: VoiceIntent }> = [
  { pattern: /log (?:a )?(?:catch|haul|pull)/i, intent: 'log_catch' },
  { pattern: /what(?:'s| is) (?:this|that) (?:fish|species)/i, intent: 'identify_fish' },
  { pattern: /(?:that's|this is (?:actually )?(?:a |an )?)(\w+)/i, intent: 'train_ai' },
  { pattern: /(?:report|there's) (?:a |an )?(?:issue|problem|emergency)/i, intent: 'report_issue' },
  { pattern: /(?:how much|what's the) (?:quota|limit|left)/i, intent: 'query' },
  { pattern: /(?:cancel|never mind|scratch that)/i, intent: 'cancel' },
  { pattern: /(?:say that again|repeat)/i, intent: 'repeat' },
  { pattern: /(?:status|what's the) (?:status|situation|report)/i, intent: 'status' },
];

/**
 * Classify the intent of a transcribed voice command.
 */
export function classifyIntent(
  text: string,
): { intent: VoiceIntent; parameters: Record<string, string | number>; confidence: number } {
  for (const { pattern, intent } of INTENT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const parameters: Record<string, string | number> = {};
      if (match[1]) parameters.species = match[1];
      return { intent, parameters, confidence: 0.85 };
    }
  }

  return { intent: 'query', parameters: {}, confidence: 0.3 };
}

// ===== Command Execution (Stub) =====

/**
 * Execute a classified voice command.
 * Dispatches to the appropriate subsystem.
 */
export async function executeCommand(
  command: VoiceCommand,
  _context: ConversationContext,
): Promise<VoiceCommand> {
  const actions: ExecutedAction[] = [];

  switch (command.intent) {
    case 'log_catch':
      // TODO: Create catch record via vision + voice confirmation
      actions.push({ type: 'catch_log', success: true, detail: 'Catch logged (stub)' });
      break;
    case 'identify_fish':
      // TODO: Trigger re-classification of most recent detection
      actions.push({ type: 'identify', success: true, detail: 'Identification requested (stub)' });
      break;
    case 'train_ai':
      // TODO: Process correction, create training triplet
      actions.push({ type: 'training', success: true, detail: 'Correction processed (stub)' });
      break;
    case 'report_issue':
      // TODO: Create incident report, alert crew
      actions.push({ type: 'incident', success: true, detail: 'Issue reported (stub)' });
      break;
    case 'query':
      // TODO: Query vessel database for requested info
      actions.push({ type: 'query', success: true, detail: 'Query processed (stub)' });
      break;
    default:
      actions.push({ type: 'unknown', success: false, detail: 'Unknown command' });
  }

  return { ...command, executedActions: actions };
}

// ===== Text-to-Speech Response (Stub) =====

/**
 * Convert text response to speech for headset playback.
 * Uses local TTS optimized for maritime radio quality.
 */
export async function speakResponse(
  _text: string,
  _priority: 'normal' | 'urgent' | 'critical' = 'normal',
): Promise<void> {
  // TODO: Replace with local TTS engine
  // 1. Generate audio from text
  // 2. Apply priority-appropriate audio cue (chime, bell, siren)
  // 3. Play through headset speaker
  console.info('[audio] TTS response (stub)');
}

/**
 * Get the wake word phrase.
 */
export function getWakeWord(): string {
  return WAKE_WORD;
}

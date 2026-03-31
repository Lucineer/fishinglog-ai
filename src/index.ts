/**
 * index.ts — Entry point for fishinglog-ai
 *
 * On Jetson: starts all subsystems (vision, audio, alerts)
 * On development: runs in simulation mode
 */

import { classifyFrame, queueCloudValidation, processCorrection } from './vision.js';
import { detectWakeWord, transcribeAudio, classifyIntent, executeCommand, speakResponse } from './audio.js';
import { evaluatePrediction, checkQuotaStatus, shouldSuppressAlert } from './alerts.js';

const VESSEL_ID = process.env.VESSEL_ID || 'vessel-unknown';
const IS_EDGE = process.env.RUNTIME === 'edge';

interface VesselState {
  running: boolean;
  cameraPositions: Map<string, 'deck' | 'catch' | 'processing'>;
  currentQuota: Record<string, { used: number; total: number }>;
  alertLog: Array<{ id: string; timestamp: Date; message: string }>;
}

const state: VesselState = {
  running: false,
  cameraPositions: new Map([
    ['cam-0', 'deck'],
    ['cam-1', 'catch'],
  ]),
  currentQuota: {},
  alertLog: [],
};

/**
 * Start the fishinglog-ai system.
 * In edge mode, initializes all hardware subsystems.
 * In dev mode, runs a simulation loop.
 */
export async function start(): Promise<void> {
  console.info(`[fishinglog] Starting fishinglog-ai — vessel: ${VESSEL_ID}`);
  console.info(`[fishinglog] Runtime: ${IS_EDGE ? 'edge (Jetson)' : 'development (simulation)'}`);

  state.running = true;

  if (IS_EDGE) {
    // TODO: Initialize Jetson hardware
    // 1. Start GStreamer pipelines for both cameras
    // 2. Initialize TensorRT engines for vision models
    // 3. Start ALSA audio capture for headset
    // 4. Connect to NMEA 2000 for GPS/sensor data
    // 5. Start Redis edge cache
    // 6. Begin sync queue processor
    console.info('[fishinglog] Edge subsystems initialized (stub)');
  } else {
    console.info('[fishinglog] Running in simulation mode');
    console.info('[fishinglog] Available modules: vision, audio, alerts');
    console.info('[fishinglog] See docs/ARCHITECTURE.md for full system design');
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.info(`[fishinglog] Received ${signal}, shutting down...`);
    state.running = false;
    // TODO: Flush upload queue, close camera streams, save state
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Re-export for external use
export { classifyFrame, queueCloudValidation, processCorrection } from './vision.js';
export { detectWakeWord, transcribeAudio, classifyIntent, executeCommand, speakResponse } from './audio.js';
export { evaluatePrediction, checkQuotaStatus, shouldSuppressAlert } from './alerts.js';

// Auto-start if run directly
if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  start().catch(console.error);
}

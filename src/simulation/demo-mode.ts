/**
 * demo-mode.ts — Simulation engine for land-based testing and demos
 *
 * Generates fake sensor data that flows through the vision pipeline
 * as if it came from real cameras, sonar, GPS, and drones.
 * Perfect for development, demos, and testing without hardware.
 */

import type { Detection, VisionFrame } from '../vision.js';
import { classifyFrame } from '../vision.js';

// ===== Types =====

export type SimulationType = 'underwater' | 'surface' | 'aerial' | 'sonar';

export interface SimulationConfig {
  type: SimulationType;
  fps: number;
  durationMs: number;
  vesselId: string;
  lat: number;
  lon: number;
}

export interface SimulatedSensorData {
  timestamp: Date;
  type: SimulationType;
  frameData: ArrayBuffer;
  detections: Detection[];
  metadata: Record<string, unknown>;
}

export interface UnderwaterMetadata {
  depth: number;          // meters
  waterTemp: number;      // celsius
  visibility: number;     // meters
  salinity: number;       // PSU
  lightLevel: number;     // 0-1
  corals: Array<{ x: number; y: number; species: string }>;
}

export interface SurfaceMetadata {
  seaState: number;       // Beaufort 0-12
  windSpeedKts: number;
  windDirection: number;  // degrees
  waveHeight: number;     // meters
  airTemp: number;        // celsius
  cloudCover: number;     // 0-1
}

export interface AerialMetadata {
  altitude: number;       // meters AGL
  droneBattery: number;   // 0-100
  gimbalAngle: number;    // degrees
  birdsDetected: number;
  baitBalls: Array<{ lat: number; lon: number; radius: number }>;
}

export interface SonarMetadata {
  frequency: number;      // kHz
  depthBelowTransducer: number; // meters
  bottomType: 'sand' | 'rock' | 'mud' | 'gravel' | 'coral';
  fishArches: Array<{ depth: number; strength: number; width: number }>;
  waterColumn: Array<{ depth: number; temperature: number }>;
}

export interface SimulationState {
  running: boolean;
  type: SimulationType;
  startTime: Date;
  frameCount: number;
  elapsedMs: number;
  lastFrame: SimulatedSensorData | null;
}

// ===== Simulation Data Generators =====

const FISH_SPECIES = [
  'chinook_salmon', 'coho_salmon', 'sockeye_salmon', 'pacific_halibut',
  'lingcod', 'rockfish_vermilion', 'albacore_tuna', 'yellowfin_tuna',
  'dungeness_crab', 'mahi_mahi', 'swordfish', 'cod_pacific',
  'flounder', 'sardine', 'mackerel',
];

const CORAL_TYPES = [
  'staghorn_coral', 'brain_coral', 'elkhorn_coral', 'table_coral',
  'fan_coral', 'pillar_coral', 'mushroom_coral',
];

const BOTTOM_TYPES: SonarMetadata['bottomType'][] = ['sand', 'rock', 'mud', 'gravel', 'coral'];

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFakeFrameData(width: number, height: number): ArrayBuffer {
  // Simulate a JPEG-like frame with random pixel data
  // In production, you'd use a canvas or image generator
  const size = width * height * 3;
  const buffer = new ArrayBuffer(size);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < size; i++) {
    view[i] = Math.floor(Math.random() * 256);
  }
  return buffer;
}

function generateDetections(count: number): Detection[] {
  const detections: Detection[] = [];
  for (let i = 0; i < count; i++) {
    const x1 = rand(0, 500);
    const y1 = rand(0, 400);
    const x2 = x1 + rand(50, 200);
    const y2 = y1 + rand(40, 160);
    detections.push({
      species: pick(FISH_SPECIES),
      confidence: rand(0.6, 0.99),
      bbox: [x1, y1, x2, y2],
      lengthPixels: x2 - x1,
      trackingId: randInt(1000, 9999),
    });
  }
  return detections;
}

// ===== Simulation Tick Functions =====

function tickUnderwater(state: SimulationState, config: SimulationConfig): SimulatedSensorData {
  const t = state.frameCount / config.fps;
  const depth = 5 + Math.sin(t * 0.1) * 15 + rand(-1, 1);
  const coralCount = randInt(0, 5);
  const corals = Array.from({ length: coralCount }, () => ({
    x: rand(0, 1920),
    y: rand(0, 1080),
    species: pick(CORAL_TYPES),
  }));

  const metadata: UnderwaterMetadata = {
    depth: Math.max(1, depth),
    waterTemp: 12 + Math.sin(t * 0.02) * 3 + rand(-0.5, 0.5),
    visibility: 8 + Math.sin(t * 0.05) * 4 + rand(-1, 1),
    salinity: 34 + rand(-0.5, 0.5),
    lightLevel: Math.max(0.05, 1 - depth / 50),
    corals,
  };

  return {
    timestamp: new Date(),
    type: 'underwater',
    frameData: generateFakeFrameData(1920, 1080),
    detections: generateDetections(randInt(0, 8)),
    metadata: metadata as unknown as Record<string, unknown>,
  };
}

function tickSurface(state: SimulationState, config: SimulationConfig): SimulatedSensorData {
  const t = state.frameCount / config.fps;
  const metadata: SurfaceMetadata = {
    seaState: Math.min(12, Math.max(0, Math.round(3 + Math.sin(t * 0.01) * 2 + rand(-1, 1)))),
    windSpeedKts: 10 + Math.sin(t * 0.03) * 8 + rand(-2, 2),
    windDirection: (180 + Math.sin(t * 0.01) * 90 + rand(-10, 10)) % 360,
    waveHeight: 1 + Math.sin(t * 0.02) * 0.8 + rand(-0.2, 0.2),
    airTemp: 15 + Math.sin(t * 0.005) * 5 + rand(-1, 1),
    cloudCover: Math.max(0, Math.min(1, 0.4 + Math.sin(t * 0.008) * 0.3 + rand(-0.1, 0.1))),
  };

  return {
    timestamp: new Date(),
    type: 'surface',
    frameData: generateFakeFrameData(3840, 2160),
    detections: generateDetections(randInt(0, 4)),
    metadata: metadata as unknown as Record<string, unknown>,
  };
}

function tickAerial(state: SimulationState, config: SimulationConfig): SimulatedSensorData {
  const t = state.frameCount / config.fps;
  const baitBalls = Math.random() > 0.7 ? [{
    lat: config.lat + rand(-0.01, 0.01),
    lon: config.lon + rand(-0.01, 0.01),
    radius: rand(5, 30),
  }] : [];

  const metadata: AerialMetadata = {
    altitude: 50 + Math.sin(t * 0.02) * 20 + rand(-2, 2),
    droneBattery: Math.max(0, 100 - (state.elapsedMs / 1000) * 0.5),
    gimbalAngle: -45 + Math.sin(t * 0.05) * 15,
    birdsDetected: randInt(0, 20),
    baitBalls,
  };

  return {
    timestamp: new Date(),
    type: 'aerial',
    frameData: generateFakeFrameData(4096, 2160),
    detections: generateDetections(randInt(0, 3)),
    metadata: metadata as unknown as Record<string, unknown>,
  };
}

function tickSonar(state: SimulationState, config: SimulationConfig): SimulatedSensorData {
  const t = state.frameCount / config.fps;
  const bottomDepth = 40 + Math.sin(t * 0.01) * 20 + rand(-2, 2);
  const fishArchCount = randInt(1, 6);
  const fishArches = Array.from({ length: fishArchCount }, () => ({
    depth: rand(5, bottomDepth - 5),
    strength: rand(0.3, 1.0),
    width: rand(2, 15),
  }));

  const waterColumn = Array.from({ length: 10 }, (_, i) => ({
    depth: (bottomDepth / 10) * (i + 1),
    temperature: 15 - (i * 0.5) + rand(-0.3, 0.3),
  }));

  const metadata: SonarMetadata = {
    frequency: [50, 83, 200][randInt(0, 2)],
    depthBelowTransducer: bottomDepth,
    bottomType: pick(BOTTOM_TYPES),
    fishArches,
    waterColumn,
  };

  return {
    timestamp: new Date(),
    type: 'sonar',
    frameData: generateFakeFrameData(800, 480),
    detections: generateDetections(randInt(0, 5)),
    metadata: metadata as unknown as Record<string, unknown>,
  };
}

// ===== Main Simulation Loop =====

const tickFunctions: Record<SimulationType, (s: SimulationState, c: SimulationConfig) => SimulatedSensorData> = {
  underwater: tickUnderwater,
  surface: tickSurface,
  aerial: tickAerial,
  sonar: tickSonar,
};

export const simulationInstances = new Map<string, SimulationState>();

/**
 * Start a simulation of the specified type.
 * Returns the simulation ID for tracking.
 */
export function startSimulation(
  type: SimulationType,
  overrides?: Partial<SimulationConfig>,
): string {
  const id = `sim-${Date.now()}-${type}`;
  const config: SimulationConfig = {
    type,
    fps: type === 'sonar' ? 10 : 2,
    durationMs: overrides?.durationMs ?? 60_000,
    vesselId: overrides?.vesselId ?? 'demo-vessel',
    lat: overrides?.lat ?? 48.856,
    lon: overrides?.lon ?? -123.287,
  };

  const state: SimulationState = {
    running: true,
    type,
    startTime: new Date(),
    frameCount: 0,
    elapsedMs: 0,
    lastFrame: null,
  };

  simulationInstances.set(id, state);

  const tickFn = tickFunctions[type];
  const intervalMs = 1000 / config.fps;

  console.info(`[simulation] Starting ${type} simulation (id=${id}, fps=${config.fps})`);

  const timer = setInterval(() => {
    if (!state.running) {
      clearInterval(timer);
      return;
    }

    state.frameCount++;
    state.elapsedMs = Date.now() - state.startTime.getTime();

    if (state.elapsedMs >= config.durationMs) {
      state.running = false;
      clearInterval(timer);
      console.info(`[simulation] ${type} simulation complete (id=${id}, frames=${state.frameCount})`);
      return;
    }

    const data = tickFn(state, config);
    state.lastFrame = data;

    // Feed simulated data through the vision pipeline as if real
    classifyFrame(data.frameData, type).then((detections) => {
      console.info(
        `[simulation] ${type} frame #${state.frameCount}: ` +
        `${data.detections.length} sim detections, ` +
        `${detections.length} pipeline detections, ` +
        `elapsed=${(state.elapsedMs / 1000).toFixed(1)}s`,
      );
    });
  }, intervalMs);

  return id;
}

/**
 * Stop a running simulation by ID.
 */
export function stopSimulation(id: string): boolean {
  const state = simulationInstances.get(id);
  if (!state) return false;
  state.running = false;
  simulationInstances.delete(id);
  console.info(`[simulation] Stopped simulation ${id}`);
  return true;
}

/**
 * Get the status of a simulation.
 */
export function getSimulationStatus(id: string): SimulationState | null {
  return simulationInstances.get(id) ?? null;
}

/**
 * List all active simulations.
 */
export function listSimulations(): Array<{ id: string; state: SimulationState }> {
  return Array.from(simulationInstances.entries()).map(([id, state]) => ({ id, state }));
}

/**
 * Generate a VisionFrame from simulated sensor data.
 * Useful for feeding into the cloud validation pipeline.
 */
export function simulatedDataToVisionFrame(
  data: SimulatedSensorData,
  vesselId: string,
): VisionFrame {
  return {
    frameId: `sim-${data.timestamp.getTime()}-${data.type}`,
    timestamp: data.timestamp,
    vesselId,
    cameraPosition: data.type === 'underwater' ? 'catch' : 'deck',
    localDetections: data.detections,
    cloudValidations: [],
    gpsCoordinates: { lat: 48.856, lon: -123.287 },
    seaState: (data.metadata as unknown as SurfaceMetadata)?.seaState ?? 2,
  };
}

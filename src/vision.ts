/**
 * vision.ts — Species classification pipeline
 *
 * Dual-model architecture:
 *   Edge: YOLOv8-nano (FP16) → 25 common species @ 15 FPS
 *   Cloud: Ensemble(ResNet50, ViT-small) → 300+ species @ 2 FPS async
 *
 * TODO: Integrate with Jetson Orin Nano camera streams via GStreamer/DeepStream
 */

// ===== Types =====

export interface Detection {
  species: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  lengthPixels: number;
  trackingId: number;
}

export interface VisionFrame {
  frameId: string;
  timestamp: Date;
  vesselId: string;
  cameraPosition: 'deck' | 'catch' | 'processing';
  localDetections: Detection[];
  cloudValidations: CloudValidation[];
  gpsCoordinates: { lat: number; lon: number };
  seaState: number; // Beaufort scale
}

export interface CloudValidation {
  species: string;
  scientificName: string;
  confidence: number;
  regulations: Regulation[];
  marketData: { pricePerKg: number; demand: 'high' | 'medium' | 'low' };
}

export interface Regulation {
  authority: string; // e.g., "NOAA", "DFO"
  sizeLimit?: { min: number; max: number }; // cm
  quotaRemaining?: number; // kg
  seasonOpen: boolean;
  protected: boolean;
}

export interface SpeciesPrediction {
  timestamp: Date;
  edgePrediction: {
    species: string;
    confidence: number;
    inferenceTimeMs: number;
  };
  cloudPrediction?: CloudValidation & { confidence: number };
  discrepancyFlag: boolean;
  captainOverride?: string;
}

// ===== Edge Classification (Stub) =====

const EDGE_CONFIDENCE_THRESHOLD = 0.7;
const EDGE_SPECIES: string[] = [
  'chinook_salmon', 'coho_salmon', 'sockeye_salmon', 'pink_salmon', 'chum_salmon',
  'pacific_halibut', 'lingcod', 'rockfish_vermilion', 'rockfish_yellowtail',
  'albacore_tuna', 'yellowfin_tuna', 'bluefin_tuna', 'skipjack_tuna',
  'dungeness_crab', 'spot_prawn', 'herring', 'sardine', 'mackerel',
  'swordfish', 'mahimahi', 'opah', 'pollock', 'cod_pacific',
  'flounder', 'sole_dover',
];

/**
 * Classify a camera frame using the edge model.
 * In production, this calls the TensorRT-accelerated YOLOv8-nano model.
 */
export async function classifyFrame(
  _frameData: ArrayBuffer,
  cameraPosition: string,
): Promise<Detection[]> {
  // TODO: Replace with actual TensorRT inference
  // 1. Decode JPEG frame
  // 2. Preprocess (resize to 640x640, normalize)
  // 3. Run YOLOv8-nano inference
  // 4. NMS on detections
  // 5. Map class IDs to species names
  // 6. Estimate sizes from bounding boxes

  console.info(`[vision] Edge classification for ${cameraPosition} camera (stub)`);

  return [];
}

/**
 * Queue a frame for cloud validation.
 * Uploaded async when connectivity is available.
 */
export async function queueCloudValidation(
  _frame: VisionFrame,
  _endpoint: string,
): Promise<void> {
  // TODO: Add to upload queue
  // Priority: frames with low-confidence edge detections first
  // Batch: max 10 frames per upload
  // Retry: exponential backoff on failure
  console.info('[vision] Queued frame for cloud validation (stub)');
}

/**
 * Process captain correction as training data.
 * Creates a training triplet: (image, wrong_label, correct_label)
 */
export async function processCorrection(
  _frameId: string,
  _originalPrediction: string,
  _correctedLabel: string,
  _captainAudio?: ArrayBuffer,
): Promise<void> {
  // TODO:
  // 1. Retrieve original frame from local storage
  // 2. Create training example with correction metadata
  // 3. Add to offline training queue
  // 4. Queue for cloud upload (high priority)
  // 5. Log correction in vessel database
  console.info('[vision] Captain correction processed (stub)');
}

/**
 * Check for discrepancy between edge and cloud predictions.
 */
export function checkDiscrepancy(prediction: SpeciesPrediction): boolean {
  if (!prediction.cloudPrediction) return false;
  return (
    prediction.edgePrediction.species !== prediction.cloudPrediction.species &&
    prediction.edgePrediction.confidence > EDGE_CONFIDENCE_THRESHOLD &&
    prediction.cloudPrediction.confidence > EDGE_CONFIDENCE_THRESHOLD
  );
}

/**
 * Get list of species the edge model can classify.
 */
export function getEdgeSpeciesList(): string[] {
  return [...EDGE_SPECIES];
}

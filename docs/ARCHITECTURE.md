# FishingLog.ai - System Architecture
*A Co-Captain AI for Commercial Fishing Vessels*

## 1. SYSTEM OVERVIEW
**Core Philosophy**: "AI as First Mate" - always assists, never autonomously decides. All critical decisions remain with captain.

**Hardware Stack**:
- **Primary**: Jetson Orin Nano 8GB (Edge AI)
- **Sensors**: 2x IP67 4K fisheye cameras (deck + catch area), waterproof headset microphone, GPS/NMEA 2000 interface
- **Connectivity**: Dual SIM 4G router + Starlink RV (failover), local WiFi for tablets
- **Storage**: 1TB NVMe SSD for local data, 30-day rolling buffer

---

## 2. COMPONENT ARCHITECTURES

### 2.1 Vision Pipeline
```
[Camera Stream] → (Jetson: Frame Selection @ 2Hz)
                  → Local YOLOv8-nano (FP16) → [Detections]
                  → Async Upload → Cloud → Megadetector-L → [Validated Labels]
```

**Data Structures**:
```typescript
interface VisionFrame {
  frameId: string;
  timestamp: Date;
  vesselId: string;
  cameraPosition: 'deck' | 'catch' | 'processing';
  localDetections: Detection[];
  cloudValidations: CloudValidation[];
  gpsCoordinates: { lat: number; lon: number };
  seaState: number;  // Beaufort scale
}

interface Detection {
  species: string;
  confidence: number;
  lengthPixels: number;
  bbox: [number, number, number, number];
  trackingId: number;
}
```

**Failure Modes**:
- **Salt occlusion**: Camera wash system + daily calibration check
- **Low light**: IR illuminators trigger automatically
- **Edge model drift**: Weekly cloud validation compares edge/cloud discrepancies
- **Mitigation**: Triple-redundant frame storage; if vision fails, fallback to manual voice logging

### 2.2 Captain Voice Interface
```
[Headset Mic] → Noise Suppression (RNNoise) → Wake Word Detector → Command Classifier
               → Local Intent Recognition → Action Execution
               → Always-listening buffer (30s rolling) for incident capture
```

**Data Structures**:
```typescript
interface VoiceCommand {
  commandId: string;
  rawAudio: ArrayBuffer;
  transcribedText: string;
  intent: 'log_catch' | 'identify_fish' | 'report_issue' | 'train_ai' | 'query';
  parameters: Record<string, string | number>;
  confidence: number;
  executedActions: ExecutedAction[];
}

interface ConversationContext {
  recentCommands: VoiceCommand[];
  fishingContext: {
    currentGear: string;
    location: { lat: number; lon: number };
    targetSpecies: string;
  };
  activeDialogue?: TrainingSession;
}
```

**Failure Modes**:
- **Background noise**: Directional headset mic + adaptive noise cancellation
- **Dialect/accent issues**: Incremental training with captain's voice samples
- **False triggers**: Two-tier wake word ("Hey Cap" + "Log this")
- **Mitigation**: Physical button override for all voice functions

### 2.3 Real-time Species Classification
**Dual-Model Architecture**:
```
Edge (Always available):
  EfficientNet-B0 (quantized) → 25 common species @ 15 FPS
  Confidence threshold: 0.7

Cloud (When connected):
  Ensemble(ResNet50, ViT-small) → 300+ species @ 2 FPS async
  Returns: species, IUCN status, regulations, market price
```

**Data Structures**:
```typescript
interface SpeciesPrediction {
  timestamp: Date;
  edgePrediction: {
    species: string;
    confidence: number;
    inferenceTimeMs: number;
  };
  cloudPrediction?: {
    species: string;
    scientificName: string;
    confidence: number;
    regulations: Regulation[];
    marketData: { pricePerKg: number; demand: 'high' | 'medium' | 'low' };
  };
  discrepancyFlag: boolean;
  captainOverride?: string;
}
```

### 2.4 Conversational Training System
```
Captain: "This is actually a yellowtail rockfish, not vermilion"
→ System captures correction frame + audio
→ Creates training triplet: (image, wrong_label, correct_label)
→ Offline queue for cloud retraining
→ Next OTA update improves edge model
```

### 2.5 Alert System
**Priority Levels**:
1. **CRITICAL**: Bycatch of protected species, gear failure detection
2. **OPERATIONAL**: Quota approaching, weather change, equipment maintenance
3. **INFORMATIONAL**: Species price change, new fishing grounds nearby

```
Alert Engine:
  Inputs: [Vision, Sensors, Regulations, Market Data]
  → Rule-based + ML anomaly detection
  → Priority queue
  → Delivery: Voice announcement + tablet visual + Starlink SMS backup
```

### 2.6 Catch Reporting
**Automated Logbook**:
```
[Vision Detection] + [Voice Confirmation] → Catch Record
→ Local SQLite + JSON backup
→ Auto-sync when connected
→ Regulatory format conversion (NOAA, DFO, etc.)
```

### 2.7 Multi-Vessel A2A
**Peer-to-Peer Mesh**:
```
VHF Data Exchange (when in range):
  - Fishing hotspots (anonymized)
  - Weather observations
  - Hazard warnings

Cloud-Synced Fleet Features:
  - Fleet-wide species sightings
  - Collective bargaining price data
  - Search patterns for lost gear
```

---

## 3. SYSTEM INTEGRATION

### 3.1 Data Flow
```
Local (Jetson):
  SQLite + Redis Edge Cache
  → 30-day rolling storage
  → Async upload queue

Cloud (AWS/GCP):
  S3/Cloud Storage: Raw images, audio
  RDS/Cloud SQL: Processed data
  SageMaker/Vertex AI: Model training

Sync Protocol:
  - Differential sync (only changes)
  - Resume broken transfers
  - Priority: Alerts > Corrections > Catch data > Images
```

### 3.2 Failure Resilience
1. **Power loss**: UPS + graceful shutdown trigger
2. **Jetson failure**: Tablet can operate basic logging via 4G direct
3. **Network loss**: All critical functions remain operational offline
4. **Storage corruption**: Dual SQLite + CSV logging, cloud restore

### 3.3 Captain UX Principles
1. **Voice-first, not voice-only**: Physical buttons for critical functions
2. **Confirm, don't assume**: Always seek confirmation for uncertain classifications
3. **Progressive disclosure**: Advanced features unlock as captain gains confidence
4. **Maritime idioms**: Uses fishing terminology, not AI jargon
5. **Glove-compatible**: Large touch targets, high contrast displays

---

## 4. DEPLOYMENT & SCALING

### Initial Rollout
- 10-vessel pilot (Pacific Northwest salmon troll)
- Weekly model updates based on collected data
- Captain feedback loop: Weekly 15-min voice check-ins

### Success Metrics
1. **Captain adoption**: >80% daily active use
2. **Time saving**: >30min/day on logbook reporting
3. **Accuracy**: >95% species classification (with captain correction)
4. **Reliability**: <1 unplanned downtime per quarter

---

## 5. REGULATORY & COMPLIANCE

- **Data ownership**: Captain owns all data, can delete at any time
- **Privacy**: Crew faces automatically blurred in cloud processing
- **Legal**: Catch records cryptographically signed, immutable audit trail
- **Export controls**: No data crosses jurisdictions without explicit permission

---

**FishingLog.ai** - Because the best AI is the one that earns its sea legs alongside you.

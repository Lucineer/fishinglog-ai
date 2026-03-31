# fishinglog.ai

> **Edge AI Co-Captain for Commercial Fishing Vessels**
> Jetson-powered species classification, captain voice interface, conversational training. Built on [cocapn](https://github.com/nichochar/cocapn).

---

## Vision

fishinglog.ai is an edge AI system that serves as a co-captain on commercial fishing vessels. It combines real-time vision, voice interaction, and conversational training to make fishing operations safer, more compliant, and more efficient.

**Core Philosophy**: "AI as First Mate" — always assists, never autonomously decides. All critical decisions remain with the captain.

## Architecture

### Hardware Stack
- **Primary**: Jetson Orin Nano 8GB (Edge AI)
- **Sensors**: 2x IP67 4K fisheye cameras (deck + catch area), waterproof headset microphone, GPS/NMEA 2000 interface
- **Connectivity**: Dual SIM 4G router + Starlink RV (failover), local WiFi for tablets
- **Storage**: 1TB NVMe SSD for local data, 30-day rolling buffer

### Component Architecture

#### 1. Vision Pipeline
```
[Camera Stream] → Jetson: Frame Selection @ 2Hz
                → Local YOLOv8-nano (FP16) → [Detections]
                → Async Upload → Cloud → Megadetector-L → [Validated Labels]
```

#### 2. Captain Voice Interface
```
[Headset Mic] → Noise Suppression (RNNoise) → Wake Word → Command Classifier
              → Local Whisper-tiny → Intent Recognition → Action Execution
              → Always-listening buffer (30s rolling) for incident capture
```

#### 3. Real-time Species Classification
- **Edge**: EfficientNet-B0 (quantized) → 25 common species @ 15 FPS
- **Cloud**: Ensemble(ResNet50, ViT-small) → 300+ species @ 2 FPS async
- Returns: species, IUCN status, regulations, market price

#### 4. Conversational Training
Captain corrections are captured as training triplets (image, wrong_label, correct_label) and queued for cloud retraining. Next OTA update improves the edge model.

#### 5. Alert System
- **CRITICAL**: Bycatch of protected species, gear failure detection
- **OPERATIONAL**: Quota approaching, weather change, equipment maintenance
- **INFORMATIONAL**: Species price change, new fishing grounds nearby

#### 6. Automated Catch Reporting
Vision + Voice confirmation → Catch Record → Local SQLite → Auto-sync → Regulatory format conversion (NOAA, DFO, etc.)

### Data Flow
```
Local (Jetson):
  SQLite + Redis Edge Cache
  → 30-day rolling storage
  → Async upload queue

Cloud (AWS/GCP):
  S3: Raw images, audio
  Cloud SQL: Processed data
  SageMaker: Model training

Sync Priority: Alerts > Corrections > Catch data > Images
```

## Failure Resilience
- **Power loss**: UPS + graceful shutdown trigger
- **Jetson failure**: Tablet operates basic logging via 4G direct
- **Network loss**: All critical functions remain operational offline
- **Storage corruption**: Dual SQLite + CSV logging, cloud restore

## Captain UX Principles
1. Voice-first, not voice-only — physical buttons for critical functions
2. Confirm, don't assume — always seek confirmation for uncertain classifications
3. Progressive disclosure — advanced features unlock as captain gains confidence
4. Maritime idioms — uses fishing terminology, not AI jargon
5. Glove-compatible — large touch targets, high contrast displays

## Regulatory & Compliance
- **Data ownership**: Captain owns all data, can delete at any time
- **Privacy**: Crew faces automatically blurred in cloud processing
- **Legal**: Catch records cryptographically signed, immutable audit trail
- **Export controls**: No data crosses jurisdictions without explicit permission

## Project Structure

```
fishinglog-ai/
├── cocapn/
│   ├── soul.md              # Fishing vessel AI personality
│   └── cocapn.json           # cocapn configuration
├── src/
│   ├── index.ts              # Entry point
│   ├── vision.ts             # Species classification pipeline
│   ├── audio.ts              # Captain voice interface
│   └── alerts.ts             # Species mismatch alerts
├── public/
│   └── index.html            # Landing page
├── docs/
│   └── ARCHITECTURE.md       # Full architecture spec
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Type check
npm run build
```

## Deployment

### Edge (Jetson Orin Nano)
```bash
# Build for Jetson
npm run build
# Deploy via OTA or USB
scp -r dist/ jetson@192.168.1.100:~/fishinglog-ai/
```

### Cloud Sync Service
Deployed separately — handles model training, data aggregation, and regulatory reporting.

## Success Metrics
1. **Captain adoption**: >80% daily active use
2. **Time saving**: >30min/day on logbook reporting
3. **Accuracy**: >95% species classification (with captain correction)
4. **Reliability**: <1 unplanned downtime per quarter

## License

MIT — see [LICENSE](./LICENSE)

---

**fishinglog.ai** — Because the best AI earns its sea legs alongside you.

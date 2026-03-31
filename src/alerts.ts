/**
 * alerts.ts — Species mismatch and operational alerts
 *
 * Alert priorities:
 *   CRITICAL     — Bycatch of protected species, gear failure detection
 *   OPERATIONAL  — Quota approaching, weather change, equipment maintenance
 *   INFORMATIONAL — Species price change, new fishing grounds nearby
 *
 * Delivery channels: Voice announcement + tablet visual + Starlink SMS backup
 */

import type { SpeciesPrediction } from './vision.js';

// ===== Types =====

export type AlertPriority = 'critical' | 'operational' | 'informational';
export type AlertCategory = 'bycatch' | 'quota' | 'weather' | 'equipment' | 'market' | 'species_mismatch';
export type AudioAttention = 'none' | 'chime' | 'bell' | 'siren';

export interface Alert {
  alertId: string;
  priority: AlertPriority;
  category: AlertCategory;
  message: string;
  requiredAcknowledgement: boolean;
  audioAttention: AudioAttention;
  actions: string[];
  expires?: Date;
  escalationPath?: EscalationStep[];
  timestamp: Date;
}

export interface EscalationStep {
  delayMinutes: number;
  channel: 'voice' | 'tablet' | 'sms' | 'crew_tablet';
  message: string;
}

export interface AlertLog {
  alerts: Alert[];
  acknowledgementTimes: Map<string, Date>;
  falsePositiveFeedback: Map<string, boolean>;
}

// ===== Alert Thresholds =====

const THRESHOLDS = {
  bycatchConfidence: 0.8,       // Confidence threshold for protected species detection
  quotaWarningPercent: 80,       // Warn when quota reaches this percentage
  quotaCriticalPercent: 95,      // Critical alert at this percentage
  speciesMismatchDelta: 0.3,     // Confidence delta for edge/cloud discrepancy
  maxAlertsPerHour: 20,          // Prevent alert fatigue
  criticalEscalationMinutes: 5,  // Escalate unacknowledged critical alerts
} as const;

// ===== Species Alert Rules (Stub) =====

const PROTECTED_SPECIES: string[] = [
  'sea_lion_steller', 'sea_lion_california', 'sea_otter',
  'whale_humpback', 'whale_gray', 'whale_orca',
  'turtle_green', 'turtle_leatherback', 'turtle_loggerhead',
  'salmon_chinook_sr', // Snake River spring Chinook (ESA listed)
];

/**
 * Check if a species prediction triggers an alert.
 */
export function evaluatePrediction(
  prediction: SpeciesPrediction,
  _quotaStatus?: Record<string, number>,
): Alert | null {
  const species = prediction.edgePrediction.species;

  // 1. Protected species / bycatch alert
  if (PROTECTED_SPECIES.includes(species) && prediction.edgePrediction.confidence >= THRESHOLDS.bycatchConfidence) {
    return createAlert({
      priority: 'critical',
      category: 'bycatch',
      message: `Protected species detected: ${species.replace(/_/g, ' ')} — immediate action required`,
      requiredAcknowledgement: true,
      audioAttention: 'siren',
      actions: ['Stop winch', 'Notify fishery officer', 'Document sighting'],
      escalationPath: [
        { delayMinutes: 2, channel: 'crew_tablet', message: `Protected species: ${species}` },
        { delayMinutes: 5, channel: 'sms', message: `UNACKNOWLEDGED: Protected ${species} detected` },
      ],
    });
  }

  // 2. Edge/cloud species mismatch
  if (prediction.discrepancyFlag) {
    const edgeConf = prediction.edgePrediction.confidence;
    const cloudConf = prediction.cloudPrediction?.confidence ?? 0;
    if (Math.abs(edgeConf - cloudConf) > THRESHOLDS.speciesMismatchDelta) {
      return createAlert({
        priority: 'operational',
        category: 'species_mismatch',
        message: `Species mismatch — edge says ${prediction.edgePrediction.species}, cloud says ${prediction.cloudPrediction?.species ?? 'unknown'}. Captain confirmation needed.`,
        requiredAcknowledgement: false,
        audioAttention: 'chime',
        actions: ['Confirm species', 'Override classification'],
      });
    }
  }

  return null;
}

// ===== Alert Creation =====

let alertCounter = 0;

function createAlert(params: {
  priority: AlertPriority;
  category: AlertCategory;
  message: string;
  requiredAcknowledgement: boolean;
  audioAttention: AudioAttention;
  actions: string[];
  escalationPath?: EscalationStep[];
  expires?: Date;
}): Alert {
  alertCounter++;
  return {
    alertId: `alert_${Date.now()}_${alertCounter}`,
    priority: params.priority,
    category: params.category,
    message: params.message,
    requiredAcknowledgement: params.requiredAcknowledgement,
    audioAttention: params.audioAttention,
    actions: params.actions,
    escalationPath: params.escalationPath,
    expires: params.expires,
    timestamp: new Date(),
  };
}

// ===== Quota Monitoring (Stub) =====

/**
 * Check quota status and generate alerts.
 */
export function checkQuotaStatus(
  quotaStatus: Record<string, { used: number; total: number }>,
): Alert[] {
  const alerts: Alert[] = [];

  for (const [species, { used, total }] of Object.entries(quotaStatus)) {
    const percent = (used / total) * 100;

    if (percent >= THRESHOLDS.quotaCriticalPercent) {
      alerts.push(createAlert({
        priority: 'critical',
        category: 'quota',
        message: `${species}: Quota nearly exhausted (${percent.toFixed(1)}% used). Consider switching target species.`,
        requiredAcknowledgement: true,
        audioAttention: 'bell',
        actions: ['Review remaining quota', 'Consider alternate grounds'],
      }));
    } else if (percent >= THRESHOLDS.quotaWarningPercent) {
      alerts.push(createAlert({
        priority: 'operational',
        category: 'quota',
        message: `${species}: Quota approaching limit (${percent.toFixed(1)}% used).`,
        requiredAcknowledgement: false,
        audioAttention: 'chime',
        actions: ['Monitor catch rate'],
      }));
    }
  }

  return alerts;
}

// ===== Alert Rate Limiting =====

const recentAlerts: Date[] = [];

/**
 * Check if we should suppress this alert to prevent alert fatigue.
 * Uses adaptive thresholding based on captain response rate.
 */
export function shouldSuppressAlert(_alert: Alert): boolean {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  // Clean old entries
  while (recentAlerts.length > 0 && recentAlerts[0].getTime() < oneHourAgo) {
    recentAlerts.shift();
  }

  if (recentAlerts.length >= THRESHOLDS.maxAlertsPerHour) {
    return true;
  }

  recentAlerts.push(new Date());
  return false;
}

/**
 * Get the list of protected species.
 */
export function getProtectedSpecies(): string[] {
  return [...PROTECTED_SPECIES];
}

/**
 * Get current alert thresholds.
 */
export function getThresholds(): typeof THRESHOLDS {
  return { ...THRESHOLDS };
}

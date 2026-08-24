import { z } from "zod";

export interface KeystrokeEvent {
  key: string;
  time: number;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  wpm: number;
  avgInterval: number;
  intervalVariance: number;
  suspiciousBursts: number;
}

const keystrokeEventSchema = z.object({
  key: z.string().min(1).max(5),
  time: z.number().min(0),
});

const keystrokeArraySchema = z.array(keystrokeEventSchema).min(1).max(1000);

const MAX_WPM = 300;
const MIN_POSSIBLE_WPM = 20;
const MAX_CONSECUTIVE_SAME_INTERVAL = 5;
const INTERVAL_VARIANCE_THRESHOLD = 0.01;
const BURST_THRESHOLD_MS = 50;
const MIN_KEY_INTERVAL_MS = 30;

export function validateKeystrokes(
  keystrokes: KeystrokeEvent[],
  expectedChars: number
): ValidationResult {
  const parsed = keystrokeArraySchema.safeParse(keystrokes);
  if (!parsed.success) {
    return {
      valid: false,
      reason: "Invalid keystroke data format",
      wpm: 0,
      avgInterval: 0,
      intervalVariance: 0,
      suspiciousBursts: 0,
    };
  }

  const events = parsed.data;

  if (events.length < 2) {
    return {
      valid: false,
      reason: "Insufficient keystroke events for validation",
      wpm: 0,
      avgInterval: 0,
      intervalVariance: 0,
      suspiciousBursts: 0,
    };
  }

  const sortedEvents = [...events].sort((a, b) => a.time - b.time);

  const totalTimeMs =
    sortedEvents[sortedEvents.length - 1].time - sortedEvents[0].time;
  const totalTimeMin = totalTimeMs / 60000;
  const wpm = totalTimeMin > 0 ? expectedChars / 5 / totalTimeMin : 0;

  if (wpm > MAX_WPM) {
    return {
      valid: false,
      reason: `Impossible WPM: ${wpm.toFixed(1)} (max ${MAX_WPM})`,
      wpm,
      avgInterval: 0,
      intervalVariance: 0,
      suspiciousBursts: 0,
    };
  }

  if (wpm < MIN_POSSIBLE_WPM && sortedEvents.length > 5) {
    return {
      valid: false,
      reason: `Suspiciously low WPM: ${wpm.toFixed(1)} (min ${MIN_POSSIBLE_WPM})`,
      wpm,
      avgInterval: 0,
      intervalVariance: 0,
      suspiciousBursts: 0,
    };
  }

  const intervals: number[] = [];
  let suspiciousBursts = 0;

  for (let i = 1; i < sortedEvents.length; i++) {
    const interval = sortedEvents[i].time - sortedEvents[i - 1].time;
    intervals.push(interval);

    if (interval < MIN_KEY_INTERVAL_MS) {
      suspiciousBursts++;
    }

    if (interval < BURST_THRESHOLD_MS) {
      suspiciousBursts++;
    }
  }

  const avgInterval =
    intervals.reduce((sum, v) => sum + v, 0) / intervals.length;

  const intervalVariance =
    intervals.reduce((sum, v) => sum + Math.pow(v - avgInterval, 2), 0) /
    intervals.length;

  if (intervalVariance < INTERVAL_VARIANCE_THRESHOLD && intervals.length > 5) {
    let consecutiveSame = 1;
    for (let i = 1; i < intervals.length; i++) {
      if (Math.abs(intervals[i] - intervals[i - 1]) < 1) {
        consecutiveSame++;
        if (consecutiveSame >= MAX_CONSECUTIVE_SAME_INTERVAL) {
          return {
            valid: false,
            reason: "Bot-like pattern detected: perfectly consistent intervals",
            wpm,
            avgInterval,
            intervalVariance,
            suspiciousBursts,
          };
        }
      } else {
        consecutiveSame = 1;
      }
    }
  }

  if (suspiciousBursts > sortedEvents.length * 0.3) {
    return {
      valid: false,
      reason: `Too many suspicious bursts: ${suspiciousBursts}/${sortedEvents.length}`,
      wpm,
      avgInterval,
      intervalVariance,
      suspiciousBursts,
    };
  }

  return {
    valid: true,
    wpm,
    avgInterval,
    intervalVariance,
    suspiciousBursts,
  };
}

export function computeTelemetry(keystrokes: KeystrokeEvent[]) {
  if (keystrokes.length < 2) {
    return {
      avgWpm: 0,
      peakWpm: 0,
      consistency: 100,
      avgInterval: 0,
      intervalVariance: 0,
    };
  }

  const sorted = [...keystrokes].sort((a, b) => a.time - b.time);

  const windowSize = 5;
  const wpmWindow: number[] = [];

  for (let i = windowSize; i < sorted.length; i++) {
    const windowTimeMs = sorted[i].time - sorted[i - windowSize].time;
    const windowTimeMin = windowTimeMs / 60000;
    const windowWpm = windowSize / 5 / windowTimeMin;
    wpmWindow.push(windowWpm);
  }

  const avgWpm =
    wpmWindow.length > 0
      ? wpmWindow.reduce((s, v) => s + v, 0) / wpmWindow.length
      : 0;
  const peakWpm = wpmWindow.length > 0 ? Math.max(...wpmWindow) : 0;

  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(sorted[i].time - sorted[i - 1].time);
  }

  const avgInterval =
    intervals.reduce((s, v) => s + v, 0) / intervals.length;
  const intervalVariance =
    intervals.reduce((s, v) => s + Math.pow(v - avgInterval, 2), 0) /
    intervals.length;

  const cv = avgInterval > 0 ? Math.sqrt(intervalVariance) / avgInterval : 0;
  const consistency = Math.max(0, Math.min(100, (1 - cv) * 100));

  return {
    avgWpm,
    peakWpm,
    consistency,
    avgInterval,
    intervalVariance,
  };
}

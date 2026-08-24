import { prisma } from "../lib/prisma.js";
import type { KeystrokeEvent } from "./anticheat.service.js";
import { computeTelemetry } from "./anticheat.service.js";

export interface UserAnalytics {
  totalGames: number;
  avgWpm: number;
  peakWpm: number;
  avgAccuracy: number;
  avgConsistency: number;
  bestTime: number | null;
  worstTime: number | null;
  totalTimePlayed: number;
  avgPenaltyPerGame: number;
  mostMissedKeys: Array<{ key: string; count: number }>;
  speedTrend: Array<{ date: string; avgWpm: number; gamesPlayed: number }>;
  fingerAccuracy: Record<string, { correct: number; wrong: number; accuracy: number }>;
}

const KEY_TO_FINGER: Record<string, string> = {
  a: "left_pinky",
  q: "left_pinky",
  z: "left_pinky",
  s: "left_ring",
  w: "left_ring",
  x: "left_ring",
  d: "left_middle",
  e: "left_middle",
  c: "left_middle",
  f: "left_index",
  r: "left_index",
  v: "left_index",
  g: "left_index",
  t: "left_index",
  b: "left_index",
  h: "right_index",
  y: "right_index",
  n: "right_index",
  j: "right_index",
  u: "right_index",
  m: "right_index",
  k: "right_middle",
  i: "right_middle",
  l: "right_ring",
  o: "right_ring",
  p: "right_pinky",
  ";": "right_pinky",
};

export async function getUserAnalytics(
  userId: string
): Promise<UserAnalytics> {
  const results = await prisma.gameResult.findMany({
    where: { userId },
    orderBy: { completedAt: "asc" },
  });

  if (results.length === 0) {
    return {
      totalGames: 0,
      avgWpm: 0,
      peakWpm: 0,
      avgAccuracy: 0,
      avgConsistency: 0,
      bestTime: null,
      worstTime: null,
      totalTimePlayed: 0,
      avgPenaltyPerGame: 0,
      mostMissedKeys: [],
      speedTrend: [],
      fingerAccuracy: {},
    };
  }

  const totalGames = results.length;
  const totalTimePlayed = results.reduce((s, r) => s + r.totalTime, 0);
  const avgAccuracy =
    results.reduce((s, r) => s + r.accuracy, 0) / totalGames;
  const bestTime = results[0].totalTime;
  const worstTime = results[results.length - 1].totalTime;
  const avgPenaltyPerGame =
    results.reduce((s, r) => s + r.penaltyTime, 0) / totalGames;

  const allKeystrokeEvents = await prisma.keystrokeEvent.findMany({
    where: { gameResult: { userId } },
    orderBy: { timeMs: "asc" },
  });

  const keystrokesByGame = new Map<string, KeystrokeEvent[]>();
  for (const ev of allKeystrokeEvents) {
    const existing = keystrokesByGame.get(ev.gameResultId) ?? [];
    existing.push({ key: ev.key, time: ev.timeMs });
    keystrokesByGame.set(ev.gameResultId, existing);
  }

  let totalWpm = 0;
  let peakWpm = 0;
  let totalConsistency = 0;
  const keyMissCounts: Record<string, number> = {};
  const fingerAcc: Record<string, { correct: number; wrong: number }> = {};

  for (const result of results) {
    const keystrokes = keystrokesByGame.get(result.id) ?? [];
    if (keystrokes.length > 1) {
      const telemetry = computeTelemetry(keystrokes);
      totalWpm += telemetry.avgWpm;
      peakWpm = Math.max(peakWpm, telemetry.peakWpm);
      totalConsistency += telemetry.consistency;
    }

    const keyEvents = allKeystrokeEvents.filter(
      (e) => e.gameResultId === result.id
    );
    for (const ev of keyEvents) {
      if (!ev.correct) {
        keyMissCounts[ev.key] = (keyMissCounts[ev.key] ?? 0) + 1;
      }

      const finger = KEY_TO_FINGER[ev.key.toLowerCase()];
      if (finger) {
        if (!fingerAcc[finger]) {
          fingerAcc[finger] = { correct: 0, wrong: 0 };
        }
        if (ev.correct) {
          fingerAcc[finger].correct++;
        } else {
          fingerAcc[finger].wrong++;
        }
      }
    }
  }

  const mostMissedKeys = Object.entries(keyMissCounts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const fingerAccuracy: Record<
    string,
    { correct: number; wrong: number; accuracy: number }
  > = {};
  for (const [finger, data] of Object.entries(fingerAcc)) {
    const total = data.correct + data.wrong;
    fingerAccuracy[finger] = {
      ...data,
      accuracy: total > 0 ? (data.correct / total) * 100 : 100,
    };
  }

  const gamesWithKeystrokes = keystrokesByGame.size;
  const avgWpm = gamesWithKeystrokes > 0 ? totalWpm / gamesWithKeystrokes : 0;
  const avgConsistency =
    gamesWithKeystrokes > 0 ? totalConsistency / gamesWithKeystrokes : 100;

  const dailyMap = new Map<
    string,
    { totalWpm: number; count: number }
  >();
  for (const result of results) {
    const date = result.completedAt.toISOString().split("T")[0];
    const existing = dailyMap.get(date) ?? { totalWpm: 0, count: 0 };
    const keystrokes = keystrokesByGame.get(result.id) ?? [];
    if (keystrokes.length > 1) {
      const t = computeTelemetry(keystrokes);
      existing.totalWpm += t.avgWpm;
    }
    existing.count++;
    dailyMap.set(date, existing);
  }

  const speedTrend = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      avgWpm: data.count > 0 ? data.totalWpm / data.count : 0,
      gamesPlayed: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalGames,
    avgWpm,
    peakWpm,
    avgAccuracy,
    avgConsistency,
    bestTime,
    worstTime,
    totalTimePlayed,
    avgPenaltyPerGame,
    mostMissedKeys,
    speedTrend,
    fingerAccuracy,
  };
}

import { createPubSub } from "graphql-yoga";

export interface LeaderboardUpdateEvent {
  rank: number;
  userId: string;
  username: string;
  bestTime: number;
  accuracy: number;
  gamesPlayed: number;
  timestamp: string;
}

export interface GameSubmittedEvent {
  gameId: string;
  userId: string;
  username: string;
  totalTime: number;
  accuracy: number;
  isBestScore: boolean;
  timestamp: string;
}

export interface TypingVelocityEvent {
  userId: string;
  username: string;
  wpm: number;
  accuracy: number;
  timestamp: string;
}

export const pubsub = createPubSub<{
  LEADERBOARD_UPDATED: [LeaderboardUpdateEvent];
  GAME_SUBMITTED: [GameSubmittedEvent];
  TYPING_VELOCITY: [TypingVelocityEvent];
}>();

export const SUBSCRIPTION_KEYS = {
  LEADERBOARD_UPDATED: "LEADERBOARD_UPDATED",
  GAME_SUBMITTED: "GAME_SUBMITTED",
  TYPING_VELOCITY: "TYPING_VELOCITY",
} as const;

export function publishLeaderboardUpdate(event: LeaderboardUpdateEvent) {
  pubsub.publish("LEADERBOARD_UPDATED", event);
}

export function publishGameSubmitted(event: GameSubmittedEvent) {
  pubsub.publish("GAME_SUBMITTED", event);
}

export function publishTypingVelocity(event: TypingVelocityEvent) {
  pubsub.publish("TYPING_VELOCITY", event);
}

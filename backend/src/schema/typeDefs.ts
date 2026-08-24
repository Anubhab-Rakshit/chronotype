export const typeDefs = /* GraphQL */ `
  type User {
    id: ID!
    username: String!
    email: String!
    createdAt: String!
    bestScore: Float
    totalGames: Int!
  }

  type GameResult {
    id: ID!
    userId: ID!
    totalTime: Float!
    rawTime: Float!
    penaltyTime: Float!
    wrongAttempts: Int!
    correctCharacters: Int!
    accuracy: Float!
    completedAt: String!
    isBestScore: Boolean!
    keystrokeEvents: [KeystrokeEvent!]!
    telemetry: GameTelemetry
  }

  type KeystrokeEvent {
    key: String!
    correct: Boolean!
    timeMs: Float!
    intervalMs: Float
    finger: String
  }

  type GameTelemetry {
    avgWpm: Float!
    peakWpm: Float!
    consistency: Float!
    avgInterval: Float!
    intervalVariance: Float!
    flagged: Boolean!
    flagReason: String
  }

  type LeaderboardEntry {
    rank: Int!
    userId: ID!
    username: String!
    bestTime: Float!
    accuracy: Float!
    gamesPlayed: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type GameStats {
    totalGamesPlayed: Int!
    globalBestTime: Float
    totalRegisteredUsers: Int!
  }

  type UserAnalytics {
    totalGames: Int!
    avgWpm: Float!
    peakWpm: Float!
    avgAccuracy: Float!
    avgConsistency: Float!
    bestTime: Float
    worstTime: Float
    totalTimePlayed: Float!
    avgPenaltyPerGame: Float!
    mostMissedKeys: [MissedKey!]!
    speedTrend: [SpeedTrendPoint!]!
    fingerAccuracy: [FingerAccuracyEntry!]!
  }

  type MissedKey {
    key: String!
    count: Int!
  }

  type SpeedTrendPoint {
    date: String!
    avgWpm: Float!
    gamesPlayed: Int!
  }

  type FingerAccuracyEntry {
    finger: String!
    correct: Int!
    wrong: Int!
    accuracy: Float!
  }

  type AntiCheatResult {
    valid: Boolean!
    reason: String
    wpm: Float!
    avgInterval: Float!
    intervalVariance: Float!
    suspiciousBursts: Int!
  }

  type LeaderboardUpdate {
    rank: Int!
    userId: ID!
    username: String!
    bestTime: Float!
    accuracy: Float!
    gamesPlayed: Int!
    timestamp: String!
  }

  type GameSubmitted {
    gameId: ID!
    userId: ID!
    username: String!
    totalTime: Float!
    accuracy: Float!
    isBestScore: Boolean!
    timestamp: String!
  }

  type TypingVelocity {
    userId: ID!
    username: String!
    wpm: Float!
    accuracy: Float!
    timestamp: String!
  }

  type RateLimitInfo {
    limit: Int!
    remaining: Int!
    resetAt: String!
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input SubmitGameInput {
    totalTime: Float!
    rawTime: Float!
    penaltyTime: Float!
    wrongAttempts: Int!
    correctCharacters: Int!
    accuracy: Float!
  }

  input KeystrokeInput {
    key: String!
    time: Float!
  }

  input ValidateKeystrokesInput {
    keystrokes: [KeystrokeInput!]!
    expectedChars: Int!
  }

  type Query {
    me: User
    userBestScore: Float
    userHistory(limit: Int = 20, offset: Int = 0): [GameResult!]!
    leaderboard(limit: Int = 50): [LeaderboardEntry!]!
    globalStats: GameStats!
    userAnalytics(userId: ID!): UserAnalytics!
    gameResult(id: ID!): GameResult
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    submitGameResult(
      input: SubmitGameInput!
      keystrokes: [KeystrokeInput!]
    ): GameResult!
    validateKeystrokes(input: ValidateKeystrokesInput!): AntiCheatResult!
  }

  type Subscription {
    leaderboardUpdated: LeaderboardUpdate!
    gameSubmitted: GameSubmitted!
    typingVelocity: TypingVelocity!
  }
`;

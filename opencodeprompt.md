# ChronoType Backend Enhancement Prompt

**Target Agent:** OpenCode
**Role:** Senior Backend Architect (Bun / GraphQL / Prisma)
**Objective:** Evolve the ChronoType backend from a basic CRUD application into a robust, real-time, highly secure gaming server capable of handling global scale and competitive integrity.

## Background
ChronoType currently has a solid foundation: a Bun runtime, GraphQL Yoga server, Prisma ORM, and PostgreSQL database. The frontend is an authentic, Awwwards-grade luxury UI built on SplitStellar's design language. 

The current backend capabilities:
- User Authentication (JWT, bcrypt)
- Submitting game results
- Fetching Leaderboard & Personal History

## Directives for Next Iteration

You are tasked with implementing the following major architectural upgrades:

### 1. Real-Time Capabilities (GraphQL Subscriptions)
- **Objective:** The Leaderboard and live game feeds must be real-time.
- **Implementation:** Introduce GraphQL Subscriptions (via WebSockets/SSE). When a user submits a new high score, it should instantly push an event to all connected clients viewing the leaderboard.
- **Bonus:** Lay the groundwork for real-time multiplayer lobbies (broadcasting player typing velocity).

### 2. Cryptographic Anti-Cheat & Validation Engine
- **Objective:** Currently, the backend blindly trusts the `SubmitGameResult` payload. We need competitive integrity.
- **Implementation:** 
  - Update the frontend to send an encrypted array of keystroke timestamps (`[ { key: 'a', time: 120 }, { key: 'b', time: 240 } ]`).
  - Build a backend validation engine that replays these timestamps.
  - Flag or reject submissions that exhibit impossible bursts (e.g., 500 WPM instantly) or perfectly linear bot-like keystroke intervals.

### 3. Caching & Performance (Redis Integration)
- **Objective:** Database optimization. The leaderboard shouldn't query PostgreSQL on every page load.
- **Implementation:** Integrate Redis (via `ioredis` or Bun's native methods). Cache the top 50 leaderboard and invalidate/update the cache only when a score in the top 50 is beaten.

### 4. Advanced Telemetry & Analytics
- **Objective:** Give players deep insights into their performance.
- **Implementation:** Expand the Prisma schema to store per-finger accuracy, most frequently missed keys, and speed consistency (variance). Create new GraphQL queries to return this rich data for a future "Analytics Dashboard".

### 5. Rate Limiting & Security
- **Objective:** Protect the API endpoints.
- **Implementation:** Add rate-limiting middleware to GraphQL Yoga (e.g., via `@graphql-yoga/plugin-rate-limit` or a custom Redis-based limiter) to prevent brute-forcing authentication and spamming the score submission endpoints.

## Execution Rules
- Stick to the existing stack: Bun, GraphQL Yoga, Prisma, Zod.
- Provide clean, strictly typed TypeScript code.
- Focus heavily on the Anti-Cheat and Real-Time WebSocket infrastructure, as these are critical for the premium competitive feel of ChronoType.

# ⚡ ChronoType — Full-Stack Typing Speed Arena

**[LIVE DEMO: Play ChronoType on Vercel](https://chronotype-rust.vercel.app/)** 

An **Awwwards-caliber**, production-grade typing speed game application built to evaluate full-stack engineering, GraphQL API design, database modeling, secure authentication, state management, procedural audio synthesis, and high-performance frontend micro-interactions.

## 🌍 Live Deployments
- **Frontend (Vercel)**: [https://chronotype-rust.vercel.app/](https://chronotype-rust.vercel.app/)
- **Backend (Render)**: [https://chronotype-backend.onrender.com/graphql](https://chronotype-backend.onrender.com/graphql)
- **Database (Supabase)**: PostgreSQL 16
- **Caching & Subscriptions (Upstash)**: Serverless Redis

---

## 🌟 Key Highlights & Engineering Features

### 🎨 Frontend & UI/UX Excellence (Antigravity)
- **Strict Game Loop Adherence**:
  - Exactly **20 randomly generated uppercase alphabets (`A-Z`)**.
  - Displays **one alphabet at a time** in the central hero HUD with an upcoming 5-character queue ribbon.
  - Character progression advances **only** upon entering the correct matching key.
  - Strict **0.5-second penalty** applied per incorrect keystroke with instant red screen-shake, ambient vignette, and floating physics badge.
  - High-precision `requestAnimationFrame` + `performance.now()` millisecond stopwatch.
  - Active keyboard focus maintained 100% of the time.
  - Local high-score persistence (`localStorage`) with conditional feedback: **"🏆 SUCCESS: NEW BEST SCORE!"** vs **"TRY AGAIN / KEEP PUSHING"**.
- **Zero-Dependency Procedural Audio Synthesizer**: Pure Web Audio API engine generating mechanical keyboard "thock" clicks with randomized pitch variations (±15Hz), sub-bass error buzzers, and harmonic victory chords.
- **2D-as-3D Isometric Virtual Keyboard**: Real-time virtual keycap visualizer utilizing CSS 3D transforms (`rotateX`, `rotateZ`, `translateZ`) that mirrors physical keystrokes with physical depressions and neon LED underglow without heavy WebGL/Three.js overhead.
- **Interactive Particle Grid**: High-performance 2D Canvas ambient mesh with mouse repulsion and velocity response.
- **Dynamic Theme Engine**: Switch seamlessly between **Cyber Emerald**, **OLED Obsidian**, **Synthwave Neon**, and **Amber Matrix**.
- **Real-Time Telemetry HUD**: Live WPM, CPS, consecutive streak counter (🔥 10 STREAK), and accuracy percentage.

### ⚙️ Backend & Infrastructure (OpenCode)
- **Runtime**: [Bun v1.3](https://bun.sh) + TypeScript for ultra-fast execution.
- **GraphQL Engine**: [GraphQL Yoga v5](https://the-guild.dev/graphql/yoga-server) with full CORS support and Bearer JWT context injection.
- **Database & ORM**: PostgreSQL 16 (Hosted on Supabase) + Prisma ORM with composite indexes.
- **Caching & Rate Limiting**: Upstash Serverless Redis via `ioredis` for ultra-low latency telemetry caching.
- **Security & Auth**: JWT authentication (`jose`), password hashing with bcrypt cost 10, and Zod input validation schemas.
- **Server-Side Verification**: Strict backend mathematical validation on score submission (`expectedPenalty = wrongAttempts * 0.5`, `expectedTotal = rawTime + expectedPenalty`).
- **Global Leaderboard**: Optimized SQL queries aggregating distinct player personal bests sorted by fastest time.

---

## 🏗️ Architecture & Sync Contract

```
┌─────────────────────────────────────────────────────────────┐
│                       PROJECT STRUCTURE                     │
├──────────────────────────────┬──────────────────────────────┤
│ 🎨 FRONTEND (Vercel)         │ ⚙️ BACKEND (Render Docker)   │
├──────────────────────────────┼──────────────────────────────┤
│ • useTypingEngine (20-char)  │ • Supabase PostgreSQL 16     │
│ • useSoundEffects (WebAudio) │ • Upstash Redis Cache        │
│ • VirtualKeyboard (3D CSS)   │ • Prisma Schema & Migration  │
│ • ParticleCanvas (Mesh)      │ • JWT Auth & Bcrypt          │
│ • Apollo Client & Views      │ • GraphQL Resolvers & Logic  │
│ • Vitest Test Suite (6/6)    │ • Bun Test Suite (10/10)     │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Option 1: One-Command Docker Setup (Recommended)

Make sure Docker is running on your machine, then run:

```bash
docker-compose up --build
```

- **Frontend Client**: `http://localhost:5173`
- **GraphQL Yoga Server & GraphiQL**: `http://localhost:4000/graphql`
- **PostgreSQL Database**: `localhost:5432`

---

### Option 2: Local Development Setup

#### 1. Prerequisites
- [Bun](https://bun.sh) installed (`curl -fsSL https://bun.sh/install | bash`)
- [Node.js](https://nodejs.org) v20+ and npm installed
- PostgreSQL 16 running locally (or via Docker)

#### 2. Backend Setup
```bash
cd backend
bun install

# Configure environment variables
cp .env.example .env

# Push Prisma schema to PostgreSQL
bun run db:push

# Start GraphQL Yoga development server
bun run dev
```
Backend will start on `http://localhost:4000/graphql`.

#### 3. Frontend Setup
```bash
cd frontend
npm install

# Start Vite development server
npm run dev
```
Frontend will start on `http://localhost:5173`.

---

## 🧪 Automated Testing

Both Frontend and Backend include dedicated automated test suites covering all core requirements.

### Run Backend Tests (`bun test`)
```bash
cd backend
bun test
```
**Test Coverage**:
- Valid user registration and JWT token signing.
- Duplicate email / username rejection.
- Login credential verification and password security.
- Game result submission and 0.5s penalty math validation.
- Unauthorized request rejection.
- Global leaderboard rank ordering (fastest `totalTime` = Rank #1).

### Run Frontend Tests (`vitest`)
```bash
cd frontend
npm test
```
**Test Coverage**:
- 20 uppercase random character sequence generation.
- Strict 0.5s penalty accumulation per incorrect keystroke.
- 100% accuracy calculation on flawless runs.
- Local storage high-score comparison and persistence.
- WPM and CPS telemetry calculations.

---

## 📡 GraphQL API Reference

### Queries
| Query | Auth Required | Description |
|---|---|---|
| `me` | Yes | Retrieves authenticated user profile, best score, and total games |
| `userBestScore` | Yes | Retrieves user's personal best time in seconds |
| `userHistory(limit, offset)` | Yes | Returns paginated list of user's past runs with telemetry |
| `leaderboard(limit)` | No | Returns top global players ranked by fastest time |
| `globalStats` | No | Total games played, global record, and total registered users |

### Mutations
| Mutation | Auth Required | Description |
|---|---|---|
| `register(input)` | No | Creates new player account and returns JWT token |
| `login(input)` | No | Authenticates existing user and returns JWT token |
| `submitGameResult(input)` | Yes | Validates penalty math, saves game run, and updates high score |

---

## 📹 Video Walkthrough & Technical Decisions

When recording your Loom walkthrough for the hiring team, follow this recommended 3-minute structure:

1. **Architecture & Stack Selection (45s)**:
   - Why Bun + GraphQL Yoga + Prisma (blazing fast cold starts, native TypeScript execution, type-safe API boundary).
   - Why custom Vanilla CSS Design System instead of generic component libraries (unmatched brand identity, zero bundle bloat, fine-tuned micro-interactions).
2. **Gameplay & Core Mechanics (60s)**:
   - Demonstrate the 20-alphabet progression.
   - Intentionally hit wrong keys to show the `+0.5s` penalty accumulation, red screen-shake, and procedural sound error buzzer.
   - Show the 3D isometric virtual keycap visualizer responding physically to real keystrokes.
3. **Authentication & Cloud Synchronization (45s)**:
   - Register a new user in the glassmorphic modal.
   - Complete a run to demonstrate automatic cloud submission to GraphQL.
   - Open the **Leaderboard** and **History** modals to showcase real-time database persistence.
4. **Docker & Automated Test Suites (30s)**:
   - Show `bun test` and `npm test` passing with 100% success.

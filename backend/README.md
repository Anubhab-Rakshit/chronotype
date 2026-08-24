# ChronoType Backend

GraphQL API backend for the ChronoType typing speed game.

## Tech Stack

- **Runtime**: Bun + TypeScript
- **GraphQL**: GraphQL Yoga
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Auth**: JWT (jose)
- **Validation**: Zod

## Setup

### Local Development

1. **Prerequisites**: Bun, PostgreSQL

2. **Install dependencies**:
   ```bash
   cd backend
   bun install
   ```

3. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and JWT secret
   ```

4. **Run migrations**:
   ```bash
   bun run db:push
   ```

5. **Start dev server**:
   ```bash
   bun run dev
   ```

   Server runs at `http://localhost:4000/graphql`

### Docker Compose

```bash
# From project root
docker compose up --build
```

Services:
- **PostgreSQL**: `localhost:5432`
- **Backend**: `localhost:4000/graphql`
- **Frontend**: `localhost:5173`

## API

### Queries

| Query | Auth | Description |
|-------|------|-------------|
| `me` | Yes | Get current user profile |
| `userBestScore` | Yes | Get user's best score |
| `userHistory(limit, offset)` | Yes | Get user's game history |
| `leaderboard(limit)` | No | Get global leaderboard |
| `globalStats` | No | Get global game statistics |

### Mutations

| Mutation | Auth | Description |
|----------|------|-------------|
| `register(input)` | No | Register new user |
| `login(input)` | No | Login existing user |
| `submitGameResult(input)` | Yes | Submit a game result |

### Authentication

Include JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

## Testing

```bash
# Start the server first, then run tests
bun test
```

## Project Structure

```
backend/
├── prisma/schema.prisma    # Database schema
├── src/
│   ├── index.ts            # Server entry point
│   ├── context.ts          # Auth context
│   ├── lib/
│   │   ├── env.ts          # Environment validation
│   │   └── prisma.ts       # Prisma client singleton
│   ├── schema/
│   │   ├── typeDefs.ts     # GraphQL schema
│   │   └── resolvers.ts    # Query/Mutation resolvers
│   └── services/
│       ├── auth.service.ts # Auth logic
│       └── game.service.ts # Game logic
└── tests/
    ├── auth.test.ts
    ├── game.test.ts
    └── leaderboard.test.ts
```

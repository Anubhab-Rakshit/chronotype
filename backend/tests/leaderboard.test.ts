import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { prisma } from "../src/lib/prisma.js";

const API_URL = "http://localhost:4000/graphql";

async function graphqlRequest(
  query: string,
  variables?: Record<string, unknown>,
  headers?: Record<string, string>
) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
}

describe("Leaderboard", () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  const user1Email = `lb1${Date.now()}@example.com`;
  const user1Name = `lbuser1${Date.now()}`;
  const user2Email = `lb2${Date.now()}@example.com`;
  const user2Name = `lbuser2${Date.now()}`;

  beforeAll(async () => {
    const [r1, r2] = await Promise.all([
      graphqlRequest(
        `
        mutation Register($input: RegisterInput!) {
          register(input: $input) { token user { id } }
        }
      `,
        { input: { username: user1Name, email: user1Email, password: "password123" } }
      ),
      graphqlRequest(
        `
        mutation Register($input: RegisterInput!) {
          register(input: $input) { token user { id } }
        }
      `,
        { input: { username: user2Name, email: user2Email, password: "password123" } }
      ),
    ]);

    user1Token = r1.data.register.token;
    user1Id = r1.data.register.user.id;
    user2Token = r2.data.register.token;
    user2Id = r2.data.register.user.id;

    // User1 plays with 8.5s (best)
    await graphqlRequest(
      `
      mutation SubmitGame($input: SubmitGameInput!) {
        submitGameResult(input: $input) { id }
      }
    `,
      {
        input: {
          totalTime: 8.5,
          rawTime: 8.5,
          penaltyTime: 0,
          wrongAttempts: 0,
          correctCharacters: 20,
          accuracy: 100,
        },
      },
      { Authorization: `Bearer ${user1Token}` }
    );

    // User2 plays with 10.0s
    await graphqlRequest(
      `
      mutation SubmitGame($input: SubmitGameInput!) {
        submitGameResult(input: $input) { id }
      }
    `,
      {
        input: {
          totalTime: 10.0,
          rawTime: 10.0,
          penaltyTime: 0,
          wrongAttempts: 0,
          correctCharacters: 20,
          accuracy: 100,
        },
      },
      { Authorization: `Bearer ${user2Token}` }
    );
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(
      `DELETE FROM game_results WHERE "userId" IN ('${user1Id}', '${user2Id}')`
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM users WHERE id IN ('${user1Id}', '${user2Id}')`
    );
  });

  it("should return leaderboard sorted by fastest time", async () => {
    const result = await graphqlRequest(`
      query Leaderboard {
        leaderboard(limit: 10) {
          rank
          userId
          username
          bestTime
          accuracy
          gamesPlayed
        }
      }
    `);

    expect(result.errors).toBeUndefined();
    expect(result.data.leaderboard.length).toBeGreaterThanOrEqual(2);

    const user1Entry = result.data.leaderboard.find(
      (e: { userId: string }) => e.userId === user1Id
    );
    const user2Entry = result.data.leaderboard.find(
      (e: { userId: string }) => e.userId === user2Id
    );

    expect(user1Entry).toBeTruthy();
    expect(user2Entry).toBeTruthy();
    expect(user1Entry.rank).toBeLessThan(user2Entry.rank);
    expect(user1Entry.bestTime).toBeLessThan(user2Entry.bestTime);
  });

  it("should include correct fields in leaderboard entries", async () => {
    const result = await graphqlRequest(`
      query Leaderboard {
        leaderboard(limit: 10) {
          rank
          userId
          username
          bestTime
          accuracy
          gamesPlayed
        }
      }
    `);

    expect(result.errors).toBeUndefined();
    const entry = result.data.leaderboard[0];
    expect(entry.rank).toBe(1);
    expect(entry.userId).toBeTruthy();
    expect(entry.username).toBeTruthy();
    expect(typeof entry.bestTime).toBe("number");
    expect(typeof entry.accuracy).toBe("number");
    expect(typeof entry.gamesPlayed).toBe("number");
  });
});

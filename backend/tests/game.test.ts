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

describe("Game Results", () => {
  let authToken: string;
  let userId: string;
  const testEmail = `game${Date.now()}@example.com`;
  const testUsername = `gamer${Date.now()}`;

  beforeAll(async () => {
    const result = await graphqlRequest(
      `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          user { id }
        }
      }
    `,
      {
        input: {
          username: testUsername,
          email: testEmail,
          password: "password123",
        },
      }
    );
    authToken = result.data.register.token;
    userId = result.data.register.user.id;
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(
      `DELETE FROM game_results WHERE "userId" = '${userId}'`
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM users WHERE id = '${userId}'`
    );
  });

  it("should submit a game result with 0 penalties", async () => {
    const result = await graphqlRequest(
      `
      mutation SubmitGame($input: SubmitGameInput!) {
        submitGameResult(input: $input) {
          id
          totalTime
          rawTime
          penaltyTime
          wrongAttempts
          isBestScore
        }
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
      { Authorization: `Bearer ${authToken}` }
    );

    expect(result.errors).toBeUndefined();
    expect(result.data.submitGameResult.totalTime).toBe(8.5);
    expect(result.data.submitGameResult.penaltyTime).toBe(0);
    expect(result.data.submitGameResult.isBestScore).toBe(true);
  });

  it("should submit a game result with penalties", async () => {
    const wrongAttempts = 4;
    const penaltyTime = wrongAttempts * 0.5;
    const rawTime = 10.0;
    const totalTime = rawTime + penaltyTime;

    const result = await graphqlRequest(
      `
      mutation SubmitGame($input: SubmitGameInput!) {
        submitGameResult(input: $input) {
          totalTime
          penaltyTime
          wrongAttempts
          accuracy
        }
      }
    `,
      {
        input: {
          totalTime,
          rawTime,
          penaltyTime,
          wrongAttempts,
          correctCharacters: 20,
          accuracy: (20 / (20 + wrongAttempts)) * 100,
        },
      },
      { Authorization: `Bearer ${authToken}` }
    );

    expect(result.errors).toBeUndefined();
    expect(result.data.submitGameResult.totalTime).toBe(totalTime);
    expect(result.data.submitGameResult.penaltyTime).toBe(penaltyTime);
    expect(result.data.submitGameResult.wrongAttempts).toBe(wrongAttempts);
  });

  it("should detect high score correctly", async () => {
    const result = await graphqlRequest(
      `
      mutation SubmitGame($input: SubmitGameInput!) {
        submitGameResult(input: $input) {
          isBestScore
          totalTime
        }
      }
    `,
      {
        input: {
          totalTime: 12.0,
          rawTime: 12.0,
          penaltyTime: 0,
          wrongAttempts: 0,
          correctCharacters: 20,
          accuracy: 100,
        },
      },
      { Authorization: `Bearer ${authToken}` }
    );

    expect(result.errors).toBeUndefined();
    expect(result.data.submitGameResult.isBestScore).toBe(false);
  });

  it("should reject unauthenticated submissions", async () => {
    const result = await graphqlRequest(
      `
      mutation SubmitGame($input: SubmitGameInput!) {
        submitGameResult(input: $input) {
          id
        }
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
      }
    );

    expect(result.errors).toBeTruthy();
    expect(result.errors[0].message).toContain("UNAUTHENTICATED");
  });
});

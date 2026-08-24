import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { prisma } from "../src/lib/prisma.js";

const API_URL = "http://localhost:4000/graphql";

async function graphqlRequest(query: string, variables?: Record<string, unknown>, headers?: Record<string, string>) {
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

describe("Auth", () => {
  const testEmail = `test${Date.now()}@example.com`;
  const testUsername = `user${Date.now()}`;
  let authToken: string;

  afterAll(async () => {
    await prisma.$executeRawUnsafe(
      `DELETE FROM users WHERE email = '${testEmail}'`
    );
  });

  it("should register a new user", async () => {
    const result = await graphqlRequest(`
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          user {
            id
            username
            email
          }
        }
      }
    `, {
      input: {
        username: testUsername,
        email: testEmail,
        password: "password123",
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.token).toBeTruthy();
    expect(result.data.register.user.username).toBe(testUsername);
    expect(result.data.register.user.email).toBe(testEmail);
    authToken = result.data.register.token;
  });

  it("should reject duplicate email", async () => {
    const result = await graphqlRequest(`
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
        }
      }
    `, {
      input: {
        username: "anotheruser",
        email: testEmail,
        password: "password123",
      },
    });

    expect(result.errors).toBeTruthy();
    expect(result.errors[0].message).toContain("Email already registered");
  });

  it("should reject duplicate username", async () => {
    const result = await graphqlRequest(`
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
        }
      }
    `, {
      input: {
        username: testUsername,
        email: "different@example.com",
        password: "password123",
      },
    });

    expect(result.errors).toBeTruthy();
    expect(result.errors[0].message).toContain("Username already taken");
  });

  it("should login with correct credentials", async () => {
    const result = await graphqlRequest(`
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
          user {
            username
          }
        }
      }
    `, {
      input: {
        email: testEmail,
        password: "password123",
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.token).toBeTruthy();
    expect(result.data.login.user.username).toBe(testUsername);
  });

  it("should reject wrong password", async () => {
    const result = await graphqlRequest(`
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
        }
      }
    `, {
      input: {
        email: testEmail,
        password: "wrongpassword",
      },
    });

    expect(result.errors).toBeTruthy();
    expect(result.errors[0].message).toContain("Invalid email or password");
  });

  it("should get current user with valid token", async () => {
    const result = await graphqlRequest(`
      query Me {
        me {
          id
          username
          email
          totalGames
        }
      }
    `, undefined, {
      Authorization: `Bearer ${authToken}`,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.me.username).toBe(testUsername);
    expect(result.data.me.email).toBe(testEmail);
  });

  it("should reject unauthenticated requests to me", async () => {
    const result = await graphqlRequest(`
      query Me {
        me {
          id
        }
      }
    `);

    expect(result.errors).toBeTruthy();
    expect(result.errors[0].message).toContain("UNAUTHENTICATED");
  });
});

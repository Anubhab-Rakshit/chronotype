import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

interface JWTPayload {
  userId: string;
  username: string;
  email: string;
}

export async function register(input: z.infer<typeof registerSchema>) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { username, email, password } = parsed.data;

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error("Email already registered");
    }
    throw new Error("Username already taken");
  }

  const passwordHash = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  const user = await prisma.user.create({
    data: { username, email, passwordHash },
  });

  const token = await signJWT({
    userId: user.id,
    username: user.username,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      bestScore: null,
      totalGames: 0,
    },
  };
}

export async function login(input: z.infer<typeof loginSchema>) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const valid = await Bun.password.verify(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  const bestResult = await prisma.gameResult.findFirst({
    where: { userId: user.id, isBestScore: true },
    orderBy: { totalTime: "asc" },
  });

  const totalGames = await prisma.gameResult.count({
    where: { userId: user.id },
  });

  const token = await signJWT({
    userId: user.id,
    username: user.username,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      bestScore: bestResult?.totalTime ?? null,
      totalGames,
    },
  };
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

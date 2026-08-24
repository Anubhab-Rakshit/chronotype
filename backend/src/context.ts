import { verifyJWT } from "./services/auth.service.js";

export interface GraphQLContext {
  userId: string | null;
  username: string | null;
  email: string | null;
}

export async function createContext({
  request,
}: {
  request: Request;
}): Promise<GraphQLContext> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { userId: null, username: null, email: null };
  }

  const token = authHeader.slice(7);
  const payload = await verifyJWT(token);

  if (!payload) {
    return { userId: null, username: null, email: null };
  }

  return {
    userId: payload.userId,
    username: payload.username,
    email: payload.email,
  };
}

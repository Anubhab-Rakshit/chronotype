import { createYoga, createSchema } from "graphql-yoga";
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";
import { createContext } from "./context.js";
import { env } from "./lib/env.js";
import { redis } from "./lib/redis.js";

const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  context: createContext,
  graphqlEndpoint: "/graphql",
  landingPage: true,
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://chronotype-rust.vercel.app"],
    credentials: true,
    methods: ["POST", "GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

const server = Bun.serve({
  fetch: async (request) => {
    const url = new URL(request.url);

    if (url.pathname === "/graphql" && request.method === "GET") {
      const upgradeHeader = request.headers.get("upgrade");
      if (upgradeHeader === "websocket") {
        return new Response("WebSocket upgrade handled by graphql-ws", {
          status: 101,
          headers: { Upgrade: "websocket" },
        });
      }
    }

    const operationBody = await request.clone().text();
    let operationType: string | undefined;
    try {
      const parsed = JSON.parse(operationBody);
      if (parsed.query?.trimStart().startsWith("subscription")) {
        operationType = "subscription";
      } else if (parsed.query?.trimStart().startsWith("mutation")) {
        operationType = "mutation";
      } else {
        operationType = "query";
      }
    } catch {
      // ignore parse errors
    }

    const { rateLimitMiddleware } = await import("./middleware/rateLimit.js");
    const rateResult = await rateLimitMiddleware(request, operationType);

    if (!rateResult.allowed) {
      return new Response(
        JSON.stringify({
          errors: [{ message: "Rate limit exceeded. Please try again later." }],
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...rateResult.headers,
          },
        }
      );
    }

    const response = await yoga.fetch(request, {});

    if (response instanceof Response) {
      const newResponse = new Response(response.body, response);
      for (const [key, value] of Object.entries(rateResult.headers)) {
        newResponse.headers.set(key, value);
      }
      return newResponse;
    }

    return response;
  },
  port: env.PORT,
});

console.log(`🚀 Server ready at http://localhost:${server.port}/graphql`);

async function shutdown() {
  console.log("\nShutting down...");
  await redis.quit();
  server.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

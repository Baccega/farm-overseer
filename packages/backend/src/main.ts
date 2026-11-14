import { createServer } from "node:http";
import { HttpApiBuilder } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { AppApi } from "@app/common";
const HealthLive = HttpApiBuilder.group(AppApi, "health", (handlers) =>
  handlers.handle("get", () => Effect.succeed({ status: "ok" as const })),
);
const ApiLive = HttpApiBuilder.api(AppApi).pipe(Layer.provide(HealthLive));
const port = Number(process.env.PORT ?? 3001);
HttpApiBuilder.serve().pipe(
  Layer.provide(ApiLive),
  Layer.provide(NodeHttpServer.layer(createServer, { host: "127.0.0.1", port })),
  Layer.launch,
  NodeRuntime.runMain,
);

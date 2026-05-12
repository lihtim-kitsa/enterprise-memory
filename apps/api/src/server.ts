import Fastify from "fastify";
import cors from "@fastify/cors";

const server = Fastify({ logger: true });

await server.register(cors, {
  origin: true,
});

server.get("/health", async () => ({ status: "ok" }));

server.get("/events", async (_request, reply) => {
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  reply.raw.write("\n");

  const chunks = [
    {
      type: "status",
      message: "Loading EnterpriseMemory graph...",
      ts: new Date().toISOString(),
    },
    {
      type: "context",
      message: "Slack + Notion + Drive + Gmail synced.",
      ts: new Date().toISOString(),
    },
    {
      type: "answer",
      message:
        "Pricing decisions in Q1 focused on tiered volume discounts and a revised enterprise onboarding fee. See citations for supporting sources.",
      ts: new Date().toISOString(),
    },
    {
      type: "citations",
      message:
        "Notion: Q1 Strategy 2026-02-12 | Slack: #pricing 2026-03-08 | Email: Finance recap 2026-03-29",
      ts: new Date().toISOString(),
    },
  ];

  let index = 0;
  const interval = setInterval(() => {
    if (index >= chunks.length) {
      reply.raw.write("event: done\n");
      reply.raw.write("data: {}\n\n");
      clearInterval(interval);
      reply.raw.end();
      return;
    }
    reply.raw.write(`event: message\n`);
    reply.raw.write(`data: ${JSON.stringify(chunks[index])}\n\n`);
    index += 1;
  }, 900);

  reply.raw.on("close", () => {
    clearInterval(interval);
  });
});

const port = Number(process.env.PORT ?? 4000);

server.listen({ port, host: "0.0.0.0" });

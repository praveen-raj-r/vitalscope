import { createServer } from "node:http";
import { handleIngest } from "../../web/src/lib/ingest/handler";
import { createRateLimiter } from "../../web/src/lib/ingest/rate-limit";
import type { EventRow } from "../../web/src/lib/ingest/schema";

/**
 * A tiny server for the end-to-end tests. It runs the REAL ingest handler (size cap, origin check, rate limit,
 * validation, row mapping) with an in-memory site list and an in-memory event store instead of a database,
 * so the test covers a real browser, the real SDK and the real ingest logic without any infrastructure.
 *
 *   POST   /api/ingest   the ingest endpoint
 *   GET    /__events     the rows that would have been stored
 *   DELETE /__events     forget them
 *   GET    /__health     readiness check for Playwright
 */

const PORT = 3100;
const SITE_KEY = "vs_pub_e2e";
const SITE = { id: "e2e-site", allowedOrigins: ["http://localhost:5173"] };
const MAX_REQUEST_BYTES = 1024 * 1024; // the handler enforces the real 16 KB cap; this only protects the stub

const events: EventRow[] = [];
const limiter = createRateLimiter({ capacity: 100, windowMs: 10_000 });

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname === "/__health") {
    res.writeHead(200).end("ok");
    return;
  }

  if (url.pathname === "/__events") {
    if (req.method === "DELETE") events.length = 0;
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(events));
    return;
  }

  if (url.pathname === "/api/ingest" && req.method === "POST") {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += (chunk as Buffer).length;
      if (size > MAX_REQUEST_BYTES) {
        res.writeHead(413).end();
        return;
      }
      chunks.push(chunk as Buffer);
    }

    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (typeof value === "string") headers.set(name, value);
    }

    const response = await handleIngest(
      new Request(url, { method: "POST", headers, body: Buffer.concat(chunks) }),
      {
        limiter,
        findSite: async (key) => (key === SITE_KEY ? SITE : null),
        saveEvents: async (rows) => {
          events.push(...rows);
        },
      },
    );

    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }

  res.writeHead(404).end();
});

server.listen(PORT, () => console.log(`[stub-ingest] listening on http://localhost:${PORT}`));

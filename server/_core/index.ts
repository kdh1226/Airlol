import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // Webhook sync API endpoint (called by Google Apps Script on spreadsheet edit)
  app.post("/api/webhook/sync", async (req, res) => {
    try {
      const { ENV } = await import("./env");
      // Authenticate via webhook secret in header or body
      const headerSecret = req.headers["x-webhook-secret"] || req.headers["authorization"]?.replace("Bearer ", "");
      const bodySecret = req.body?.secret;
      const secret = headerSecret || bodySecret;
      
      if (!secret || secret !== ENV.webhookSecret) {
        console.warn("[Webhook Sync] Invalid or missing secret");
        res.status(401).json({ error: "Invalid webhook secret" });
        return;
      }
      
      console.log("[Webhook Sync] Triggered by Google Sheets webhook");
      const { syncFromSpreadsheet } = await import("../syncService");
      const result = await syncFromSpreadsheet();
      console.log(`[Webhook Sync] Success: players=${result.playersUpdated}, champions=${result.championsUpdated}`);
      res.json(result);
    } catch (error: any) {
      console.error("[Webhook Sync] Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertStormSchema, insertDropSchema, insertRequestSchema } from "@shared/schema";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ── Stats ─────────────────────────────────────────────────────────────────
  app.get("/api/stats", async (_req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  // ── Storms ────────────────────────────────────────────────────────────────
  app.get("/api/storms", async (_req, res) => {
    const storms = await storage.getStorms();
    res.json(storms);
  });

  app.get("/api/storms/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const storm = await storage.getStorm(id);
    if (!storm) return res.status(404).json({ message: "Storm not found" });
    res.json(storm);
  });

  app.post("/api/storms", async (req, res) => {
    const parsed = insertStormSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    const storm = await storage.createStorm(parsed.data);
    res.status(201).json(storm);
  });

  app.patch("/api/storms/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const storm = await storage.updateStorm(id, req.body);
    if (!storm) return res.status(404).json({ message: "Storm not found" });
    res.json(storm);
  });

  // ── Drops ─────────────────────────────────────────────────────────────────
  app.get("/api/storms/:id/drops", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const drops = await storage.getDropsByStorm(id);
    res.json(drops);
  });

  app.post("/api/drops", async (req, res) => {
    const parsed = insertDropSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    const drop = await storage.createDrop(parsed.data);
    res.status(201).json(drop);
  });

  app.patch("/api/drops/:id/complete", async (req, res) => {
    const id = parseInt(req.params.id);
    const drop = await storage.completeDrop(id);
    if (!drop) return res.status(404).json({ message: "Drop not found" });
    res.json(drop);
  });

  // ── Requests ──────────────────────────────────────────────────────────────
  app.get("/api/requests", async (_req, res) => {
    const reqs = await storage.getRequests();
    res.json(reqs);
  });

  app.post("/api/requests", async (req, res) => {
    const parsed = insertRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    const request = await storage.createRequest(parsed.data);
    res.status(201).json(request);
  });

  app.patch("/api/requests/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const req2 = await storage.updateRequest(id, req.body);
    if (!req2) return res.status(404).json({ message: "Request not found" });
    res.json(req2);
  });

  return httpServer;
}

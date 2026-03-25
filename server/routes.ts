import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, updateTaskSchema, insertGroupSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // ── Groups ──────────────────────────────────────────────────────────────

  app.get("/api/groups", async (req, res) => {
    try {
      const groups = await storage.getGroups();
      res.json(groups);
    } catch {
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      const data = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(data);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid group data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create group" });
      }
    }
  });

  app.delete("/api/groups/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteGroup(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Group not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  // ── Tasks ────────────────────────────────────────────────────────────────

  app.get("/api/tasks", async (req, res) => {
    try {
      const groupId = req.query.groupId as string | undefined;
      const tasks = await storage.getTasks(groupId ?? null);
      res.json(tasks);
    } catch {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const data = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(data);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const updates = updateTaskSchema.parse(req.body);
      const task = await storage.updateTask(req.params.id, updates);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update task" });
      }
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTask(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Task not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // ── Password verify ──────────────────────────────────────────────────────

  app.post("/api/verify-password", (req, res) => {
    const { password } = req.body ?? {};
    if (typeof password !== "string") {
      return res.status(400).json({ ok: false });
    }
    const correct = process.env.GATE_PASSWORD;
    if (!correct) {
      return res.status(500).json({ ok: false, message: "GATE_PASSWORD not set" });
    }
    res.json({ ok: password === correct });
  });

  const httpServer = createServer(app);
  return httpServer;
}

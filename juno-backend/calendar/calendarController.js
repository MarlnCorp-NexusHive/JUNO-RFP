import { Router } from "express";
import * as svc from "./calendarService.js";

export const calendarRouter = Router();

calendarRouter.get("/events", (_req, res) => {
  res.json({ events: svc.listAllCalendarEvents() });
});

calendarRouter.get("/team-summary", (_req, res) => {
  res.json(svc.getTeamSummary());
});

calendarRouter.post("/events", (req, res) => {
  try {
    const event = svc.createManualEvent(req.body || {});
    res.status(201).json({ event });
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message || "Failed to create event" });
  }
});

calendarRouter.put("/events/:id", (req, res) => {
  try {
    const event = svc.updateManualEvent(req.params.id, req.body || {});
    res.json({ event });
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message || "Failed to update event" });
  }
});

calendarRouter.delete("/events/:id", (req, res) => {
  try {
    svc.deleteManualEvent(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message || "Failed to delete event" });
  }
});

calendarRouter.post("/sync-deadlines", (req, res) => {
  try {
    const result = svc.syncRfpDeadlines(req.body?.events || []);
    res.json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message || "Failed to sync deadlines" });
  }
});

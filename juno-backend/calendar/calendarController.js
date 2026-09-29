import { Router } from "express";
import * as svc from "./calendarService.js";

export const calendarRouter = Router();

function scopeFromReq(req) {
  return svc.resolveCalendarScope(req.tenantId);
}

calendarRouter.get("/events", (req, res) => {
  res.json({ events: svc.listAllCalendarEvents(scopeFromReq(req)) });
});

calendarRouter.get("/team-summary", (req, res) => {
  res.json(svc.getTeamSummary(scopeFromReq(req)));
});

calendarRouter.post("/events", (req, res) => {
  try {
    const event = svc.createManualEvent(req.body || {}, scopeFromReq(req));
    res.status(201).json({ event });
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message || "Failed to create event" });
  }
});

calendarRouter.put("/events/:id", (req, res) => {
  try {
    const event = svc.updateManualEvent(req.params.id, req.body || {}, scopeFromReq(req));
    res.json({ event });
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message || "Failed to update event" });
  }
});

calendarRouter.delete("/events/:id", (req, res) => {
  try {
    svc.deleteManualEvent(req.params.id, scopeFromReq(req));
    res.json({ ok: true });
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message || "Failed to delete event" });
  }
});

calendarRouter.post("/sync-deadlines", (req, res) => {
  try {
    const result = svc.syncRfpDeadlines(req.body?.events || [], scopeFromReq(req));
    res.json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message || "Failed to sync deadlines" });
  }
});

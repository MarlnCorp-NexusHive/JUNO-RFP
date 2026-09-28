import { Router } from "express";
import { requireTrialAuth } from "./authMiddleware.js";
import {
  FEATURE_KEYS,
  deleteTenantFeature,
  getTenantFeature,
  isValidFeatureKey,
  putTenantFeature,
} from "./featureStore.js";

const router = Router();

router.get("/keys", requireTrialAuth, (_req, res) => {
  res.json({ keys: FEATURE_KEYS });
});

router.get("/:key", requireTrialAuth, (req, res) => {
  try {
    const key = String(req.params.key || "");
    if (!isValidFeatureKey(key)) {
      return res.status(400).json({ error: "Unknown feature key", code: "invalid_feature_key", keys: FEATURE_KEYS });
    }
    const result = getTenantFeature(req.tenantId, key);
    return res.json({ ok: true, ...result });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to load feature" });
  }
});

router.put("/:key", requireTrialAuth, (req, res) => {
  try {
    const key = String(req.params.key || "");
    if (!isValidFeatureKey(key)) {
      return res.status(400).json({ error: "Unknown feature key", code: "invalid_feature_key", keys: FEATURE_KEYS });
    }
    const data = req.body?.data !== undefined ? req.body.data : req.body;
    const result = putTenantFeature(req.tenantId, key, data);
    return res.json({ ok: true, ...result });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to save feature" });
  }
});

router.delete("/:key", requireTrialAuth, (req, res) => {
  try {
    const key = String(req.params.key || "");
    if (!isValidFeatureKey(key)) {
      return res.status(400).json({ error: "Unknown feature key", code: "invalid_feature_key", keys: FEATURE_KEYS });
    }
    const result = deleteTenantFeature(req.tenantId, key);
    return res.json({ ok: true, ...result });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to reset feature" });
  }
});

export default router;

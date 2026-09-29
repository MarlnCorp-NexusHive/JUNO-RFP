import { scopedStorageKey, isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";
import {
  canUseTrialFeatures,
  loadTrialFeatureData,
  persistTrialFeatureData,
} from "../../../services/trialFeatureApi.js";
import { getTrialSession } from "../../../services/trialAuthSession.js";

const BASE_KEY = "juno_trial_communication";
export const COMMUNICATION_CHANGED_EVENT = "juno-trial-communication-changed";

const EMPTY = { channels: [], messages: [], readState: {} };

const CHANNEL_TYPES = new Set(["opportunity", "team", "external"]);

function storageKey() {
  return scopedStorageKey(BASE_KEY);
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeType(type) {
  const t = String(type || "").toLowerCase();
  if (CHANNEL_TYPES.has(t)) return t;
  return "team";
}

function extractMentions(body) {
  const text = String(body || "");
  const found = text.match(/@([\w.+-]+(?:@[\w.-]+\.\w+)?)/g) || [];
  return [...new Set(found.map((m) => m.slice(1).toLowerCase()))];
}

function currentAuthor() {
  const session = getTrialSession();
  const user = session?.user || {};
  try {
    const rbac = JSON.parse(localStorage.getItem("rbac_current_user") || "null");
    return {
      authorId: String(user.id || rbac?.id || "unknown"),
      authorName: String(user.name || rbac?.name || "Team member"),
      authorEmail: String(user.email || rbac?.email || rbac?.username || "").toLowerCase(),
    };
  } catch {
    return {
      authorId: String(user.id || "unknown"),
      authorName: String(user.name || "Team member"),
      authorEmail: String(user.email || "").toLowerCase(),
    };
  }
}

function normalizeChannel(ch) {
  if (!ch || typeof ch !== "object") return null;
  const id = String(ch.id || "").trim();
  if (!id) return null;
  return {
    id,
    name: String(ch.name || "").trim() || "Untitled channel",
    type: normalizeType(ch.type),
    opportunityId: ch.opportunityId != null ? String(ch.opportunityId) : null,
    opportunityTitle: ch.opportunityTitle != null ? String(ch.opportunityTitle) : null,
    opportunityNumber: ch.opportunityNumber != null ? String(ch.opportunityNumber) : null,
    opportunityAgency: ch.opportunityAgency != null ? String(ch.opportunityAgency) : null,
    opportunityDeadline: ch.opportunityDeadline != null ? String(ch.opportunityDeadline) : null,
    memberIds: Array.isArray(ch.memberIds) ? ch.memberIds.map(String) : [],
    createdAt: String(ch.createdAt || new Date().toISOString()),
    createdBy: String(ch.createdBy || ""),
    lastMessageAt: ch.lastMessageAt ? String(ch.lastMessageAt) : null,
    lastMessagePreview: ch.lastMessagePreview != null ? String(ch.lastMessagePreview) : "",
  };
}

function normalizeMessage(msg) {
  if (!msg || typeof msg !== "object") return null;
  const id = String(msg.id || "").trim();
  const channelId = String(msg.channelId || "").trim();
  if (!id || !channelId) return null;
  return {
    id,
    channelId,
    authorId: String(msg.authorId || ""),
    authorName: String(msg.authorName || "Team member"),
    authorEmail: String(msg.authorEmail || "").toLowerCase(),
    body: String(msg.body || ""),
    createdAt: String(msg.createdAt || new Date().toISOString()),
    attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
    mentions: Array.isArray(msg.mentions) ? msg.mentions.map(String) : [],
  };
}

function normalizeBlob(data) {
  const channels = Array.isArray(data?.channels)
    ? data.channels.map(normalizeChannel).filter(Boolean)
    : [];
  const messages = Array.isArray(data?.messages)
    ? data.messages.map(normalizeMessage).filter(Boolean)
    : [];
  const readState =
    data?.readState && typeof data.readState === "object" && !Array.isArray(data.readState)
      ? data.readState
      : {};
  return { channels, messages, readState };
}

function readRaw() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return { ...EMPTY, channels: [], messages: [], readState: {} };
    return normalizeBlob(JSON.parse(raw));
  } catch {
    return { ...EMPTY, channels: [], messages: [], readState: {} };
  }
}

async function persistCompanyWide(data) {
  if (!canUseTrialFeatures()) return;
  await persistTrialFeatureData("communication", normalizeBlob(data));
}

function writeRaw(data) {
  const next = normalizeBlob(data);
  localStorage.setItem(storageKey(), JSON.stringify(next));
  try {
    window.dispatchEvent(new CustomEvent(COMMUNICATION_CHANGED_EVENT, { detail: next }));
  } catch {
    /* ignore */
  }
  void persistCompanyWide(next);
  return next;
}

export function getCommunicationData() {
  return readRaw();
}

export function listChannels() {
  return readRaw()
    .channels.slice()
    .sort((a, b) => {
      const ta = Date.parse(a.lastMessageAt || a.createdAt) || 0;
      const tb = Date.parse(b.lastMessageAt || b.createdAt) || 0;
      return tb - ta;
    });
}

export function listMessages(channelId) {
  if (!channelId) return [];
  return readRaw()
    .messages.filter((m) => m.channelId === channelId)
    .sort((a, b) => (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0));
}

export function getChannel(channelId) {
  if (!channelId) return null;
  return readRaw().channels.find((c) => c.id === channelId) || null;
}

export function findChannelByOpportunityId(opportunityId) {
  if (!opportunityId) return null;
  const id = String(opportunityId);
  return readRaw().channels.find((c) => c.opportunityId === id) || null;
}

/**
 * @param {{ name: string, type?: string, opportunityId?: string, opportunityTitle?: string, opportunityNumber?: string, opportunityAgency?: string, opportunityDeadline?: string, memberIds?: string[] }} input
 */
export function createChannel(input = {}) {
  const data = readRaw();
  const author = currentAuthor();
  const now = new Date().toISOString();
  const channel = normalizeChannel({
    id: newId("ch"),
    name: String(input.name || "").trim() || "New channel",
    type: input.type || (input.opportunityId ? "opportunity" : "team"),
    opportunityId: input.opportunityId || null,
    opportunityTitle: input.opportunityTitle || null,
    opportunityNumber: input.opportunityNumber || null,
    opportunityAgency: input.opportunityAgency || null,
    opportunityDeadline: input.opportunityDeadline || null,
    memberIds: input.memberIds || [],
    createdAt: now,
    createdBy: author.authorId,
    lastMessageAt: null,
    lastMessagePreview: "",
  });
  data.channels = [channel, ...data.channels];
  writeRaw(data);
  return channel;
}

/**
 * Open existing opportunity channel or create a kickoff channel for a shortlist item.
 * @param {{ id: string, title?: string, number?: string, agency?: string, deadline?: string|null }} item
 */
export function openOrCreateKickoffChannel(item) {
  if (!item?.id) return null;
  const existing = findChannelByOpportunityId(item.id);
  if (existing) return { channel: existing, created: false };
  const label = String(item.title || item.number || item.id).trim() || "Opportunity";
  const channel = createChannel({
    name: `Kickoff · ${label}`,
    type: "opportunity",
    opportunityId: item.id,
    opportunityTitle: item.title || label,
    opportunityNumber: item.number || null,
    opportunityAgency: item.agency || null,
    opportunityDeadline: item.deadline || null,
  });
  return { channel, created: true };
}

/**
 * @param {string} channelId
 * @param {{ body: string, attachments?: object[] }} input
 */
export function postMessage(channelId, input = {}) {
  const body = String(input.body || "").trim();
  if (!channelId || !body) return null;
  const data = readRaw();
  const idx = data.channels.findIndex((c) => c.id === channelId);
  if (idx < 0) return null;
  const author = currentAuthor();
  const now = new Date().toISOString();
  const message = normalizeMessage({
    id: newId("msg"),
    channelId,
    authorId: author.authorId,
    authorName: author.authorName,
    authorEmail: author.authorEmail,
    body,
    createdAt: now,
    attachments: Array.isArray(input.attachments) ? input.attachments : [],
    mentions: extractMentions(body),
  });
  data.messages = [...data.messages, message];
  data.channels[idx] = {
    ...data.channels[idx],
    lastMessageAt: now,
    lastMessagePreview: body.slice(0, 160),
  };
  // Author has read up to this message
  const userKey = author.authorId || author.authorEmail || "self";
  if (!data.readState[userKey] || typeof data.readState[userKey] !== "object") {
    data.readState[userKey] = {};
  }
  data.readState[userKey][channelId] = now;
  writeRaw(data);
  return message;
}

export function markChannelRead(channelId) {
  if (!channelId) return getCommunicationData();
  const data = readRaw();
  if (!data.channels.some((c) => c.id === channelId)) return data;
  const author = currentAuthor();
  const userKey = author.authorId || author.authorEmail || "self";
  if (!data.readState[userKey] || typeof data.readState[userKey] !== "object") {
    data.readState[userKey] = {};
  }
  data.readState[userKey][channelId] = new Date().toISOString();
  return writeRaw(data);
}

export function getUnreadCount(channelId, data = readRaw()) {
  if (!channelId) return 0;
  const author = currentAuthor();
  const userKey = author.authorId || author.authorEmail || "self";
  const lastRead = data.readState?.[userKey]?.[channelId]
    ? Date.parse(data.readState[userKey][channelId])
    : 0;
  return data.messages.filter((m) => {
    if (m.channelId !== channelId) return false;
    if (m.authorId && m.authorId === author.authorId) return false;
    const ts = Date.parse(m.createdAt) || 0;
    return ts > lastRead;
  }).length;
}

export function getTotalUnread(data = readRaw()) {
  return data.channels.reduce((sum, ch) => sum + getUnreadCount(ch.id, data), 0);
}

/** Messages that @mention the current user and are unread. */
export function listUnreadMentions(data = readRaw()) {
  const author = currentAuthor();
  const email = author.authorEmail;
  const nameToken = String(author.authorName || "")
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase();
  const userKey = author.authorId || author.authorEmail || "self";
  const readMap = data.readState?.[userKey] || {};

  return data.messages
    .filter((m) => {
      if (m.authorId && m.authorId === author.authorId) return false;
      const mentions = (m.mentions || []).map((x) => String(x).toLowerCase());
      const hit =
        (email && mentions.includes(email)) ||
        (nameToken && mentions.some((x) => x === nameToken || x.startsWith(nameToken)));
      if (!hit) return false;
      const lastRead = readMap[m.channelId] ? Date.parse(readMap[m.channelId]) : 0;
      return (Date.parse(m.createdAt) || 0) > lastRead;
    })
    .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
}

export function deleteChannel(channelId) {
  if (!channelId) return getCommunicationData();
  const data = readRaw();
  data.channels = data.channels.filter((c) => c.id !== channelId);
  data.messages = data.messages.filter((m) => m.channelId !== channelId);
  Object.keys(data.readState || {}).forEach((uid) => {
    if (data.readState[uid]?.[channelId]) delete data.readState[uid][channelId];
  });
  return writeRaw(data);
}

export async function hydrateCommunicationFromServer(opts = {}) {
  const notify = opts.notify !== false;
  if (!canUseTrialFeatures()) return getCommunicationData();
  try {
    const data = await loadTrialFeatureData("communication", EMPTY);
    const next = normalizeBlob(data);
    const nextJson = JSON.stringify(next);
    const prevJson = localStorage.getItem(storageKey());
    if (prevJson === nextJson) return getCommunicationData();
    localStorage.setItem(storageKey(), nextJson);
    if (notify) {
      try {
        window.dispatchEvent(new CustomEvent(COMMUNICATION_CHANGED_EVENT, { detail: next }));
      } catch {
        /* ignore */
      }
    }
    return getCommunicationData();
  } catch {
    return getCommunicationData();
  }
}

export function subscribeCommunication(onChange) {
  const handleCustom = () => onChange(getCommunicationData());
  const handleStorage = (e) => {
    if (!isScopedStorageEventKey(e.key, BASE_KEY)) return;
    onChange(getCommunicationData());
  };
  window.addEventListener(COMMUNICATION_CHANGED_EVENT, handleCustom);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(COMMUNICATION_CHANGED_EVENT, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}

export function buildCommunicationAlerts(data = getCommunicationData(), t) {
  const alerts = [];
  const unreadTotal = getTotalUnread(data);
  if (unreadTotal > 0) {
    alerts.push({
      text: t("dashboard.alerts.proposalManager.communicationUnread", { count: unreadTotal }),
      color: "text-indigo-500",
    });
  }
  const mentions = listUnreadMentions(data);
  mentions.slice(0, 3).forEach((m) => {
    const ch = data.channels.find((c) => c.id === m.channelId);
    alerts.push({
      text: t("dashboard.alerts.proposalManager.communicationMention", {
        channel: ch?.name || "channel",
        preview: String(m.body || "").slice(0, 80),
      }),
      color: "text-violet-500",
    });
  });
  return alerts;
}

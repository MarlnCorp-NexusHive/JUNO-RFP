import { getDocuments } from "./proposalManagerStorage.js";
import { getPursuitState, listGrantPursuits } from "./grantPursuitStore.js";
import { listShortlist } from "./shortlistStore.js";

/**
 * Resolve a calendar event to a workspace (or collab) URL when the RFP/grant
 * is currently in progress. Returns null when there is nowhere meaningful to go.
 */
export function resolveCalendarWorkspaceTarget(ev) {
  if (!ev) return null;
  const source = String(ev.source || "");

  if (source === "collaboration" && ev.workspaceId) {
    return {
      href: `/app/rfp-collaboration/w/${encodeURIComponent(String(ev.workspaceId))}`,
      kind: "collaboration",
      inProgress: true,
    };
  }

  const briefKey = String(ev.briefKey || "").trim();
  if ((source === "pursuit" || source === "grant_brief") && briefKey) {
    const pursuit = getPursuitState(briefKey);
    if (pursuit?.startedAt) {
      return {
        href: `/app/workspace?grantPursuit=${encodeURIComponent(briefKey)}`,
        kind: "grant",
        inProgress: true,
      };
    }
    return null;
  }

  if (source === "shortlist" || ev.shortlistId) {
    const shortId = String(ev.shortlistId || String(ev.id || "").replace(/^shortlist_/, "")).trim();
    const matched = findPursuitForShortlist(shortId, ev);
    if (matched?.briefKey && matched.startedAt) {
      return {
        href: `/app/workspace?grantPursuit=${encodeURIComponent(matched.briefKey)}`,
        kind: "grant",
        inProgress: true,
      };
    }
    return null;
  }

  if (source === "rfp-deadline" || source === "source-doc" || ev.documentId) {
    const docId = String(ev.documentId || "").trim();
    if (!docId) return null;
    const doc = getDocuments().find((d) => d.id === docId);
    if (!doc) return null;
    // Linked collab workspace takes precedence when present.
    const collabId = String(doc.rfpCollabWorkspaceId || "").trim();
    if (collabId) {
      return {
        href: `/app/rfp-collaboration/w/${encodeURIComponent(collabId)}`,
        kind: "collaboration",
        inProgress: true,
      };
    }
    return {
      href: `/app/workspace?doc=${encodeURIComponent(docId)}`,
      kind: "rfp",
      inProgress: true,
    };
  }

  return null;
}

function findPursuitForShortlist(shortId, ev) {
  const pursuits = listGrantPursuits();
  if (ev?.briefKey) {
    const direct = getPursuitState(ev.briefKey);
    if (direct?.startedAt) return direct;
  }
  const shortItem = listShortlist().find((s) => String(s.id) === shortId) || null;
  const candidates = [
    shortId,
    shortItem?.id,
    shortItem?.number,
    shortItem?.opportunityId,
    ev?.bidName,
  ]
    .map((v) => String(v || "").trim().toLowerCase())
    .filter(Boolean);

  return (
    pursuits.find((p) => {
      const keys = [p.briefKey, p.opportunityId, p.title]
        .map((v) => String(v || "").trim().toLowerCase())
        .filter(Boolean);
      return candidates.some((c) => keys.some((k) => k === c || k.includes(c) || c.includes(k)));
    }) || null
  );
}

/** True when clicking the event should navigate immediately. */
export function shouldNavigateCalendarEvent(ev) {
  return Boolean(resolveCalendarWorkspaceTarget(ev)?.inProgress);
}

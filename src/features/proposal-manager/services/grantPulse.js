/**
 * Grant Pulse — compare time elapsed, spend, and deliverables done.
 * A gap of 15+ points is At risk; 10–14 is Watch.
 */

export function clampPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Compute % of award period elapsed (UTC date-only friendly). */
export function computeTimePct(periodStart, periodEnd, now = new Date()) {
  const start = periodStart ? new Date(periodStart) : null;
  const end = periodEnd ? new Date(periodEnd) : null;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 100;
  const elapsed = now.getTime() - start.getTime();
  return clampPct((elapsed / total) * 100);
}

export function daysUntil(isoDate, now = new Date()) {
  if (!isoDate) return null;
  const end = new Date(`${String(isoDate).slice(0, 10)}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  const ms = end.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function largestGap(timePct, spentPct, donePct) {
  const spendGap = timePct - spentPct;
  const doneGap = timePct - donePct;
  const absSpend = Math.abs(spendGap);
  const absDone = Math.abs(doneGap);
  if (absSpend >= absDone) {
    return { kind: spendGap >= 0 ? "spendBehind" : "spendAhead", pts: absSpend, spendGap, doneGap };
  }
  return { kind: doneGap >= 0 ? "doneBehind" : "doneAhead", pts: absDone, spendGap, doneGap };
}

/**
 * @returns {{ status: 'onTrack' | 'watch' | 'atRisk', reasonKey: string, reasonParams: object, gapPts: number }}
 */
export function evaluateGrantPulse({ timePct, spentPct, donePct }) {
  const time = clampPct(timePct);
  const spent = clampPct(spentPct);
  const done = clampPct(donePct);
  const gap = largestGap(time, spent, done);

  if (gap.pts >= 15) {
    if (gap.kind === "spendBehind") {
      return {
        status: "atRisk",
        reasonKey: "reasonSpendBehind",
        reasonParams: { count: gap.pts },
        gapPts: gap.pts,
      };
    }
    if (gap.kind === "doneBehind") {
      return {
        status: "atRisk",
        reasonKey: "reasonDoneBehind",
        reasonParams: { count: gap.pts },
        gapPts: gap.pts,
      };
    }
    return {
      status: "atRisk",
      reasonKey: "reasonSpendAhead",
      reasonParams: { count: gap.pts },
      gapPts: gap.pts,
    };
  }

  if (gap.pts >= 10) {
    if (gap.kind === "spendBehind") {
      return {
        status: "watch",
        reasonKey: "reasonSpendTrails",
        reasonParams: { count: gap.pts },
        gapPts: gap.pts,
      };
    }
    return {
      status: "watch",
      reasonKey: "reasonGapWatch",
      reasonParams: { count: gap.pts },
      gapPts: gap.pts,
    };
  }

  return {
    status: "onTrack",
    reasonKey: "reasonOnTrack",
    reasonParams: {},
    gapPts: gap.pts,
  };
}

export function enrichAward(award, now = new Date()) {
  const timePct =
    award.timePct != null
      ? clampPct(award.timePct)
      : computeTimePct(award.periodStart, award.periodEnd, now);
  const spentPct = clampPct(award.spentPct);
  const donePct = clampPct(award.donePct);
  const pulse = evaluateGrantPulse({ timePct, spentPct, donePct });
  const daysLeft = daysUntil(award.periodEnd, now);
  const underspentAmount =
    pulse.status === "atRisk" && pulse.reasonKey === "reasonSpendBehind"
      ? Math.max(0, Math.round((Number(award.amount) || 0) * ((timePct - spentPct) / 100)))
      : 0;

  return {
    ...award,
    timePct,
    spentPct,
    donePct,
    pulse,
    daysLeft,
    underspentAmount,
  };
}

export function formatUsdCompact(amount) {
  const n = Number(amount) || 0;
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const rounded = Math.round(m * 100) / 100;
    return `$${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}M`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatUsdFull(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

/** Count awards that need attention this week (risk, watch, due ≤7d, approval). */
export function countAttention(awards, now = new Date()) {
  return awards.filter((a) => {
    const enriched = a.pulse ? a : enrichAward(a, now);
    if (enriched.pulse.status === "atRisk" || enriched.pulse.status === "watch") return true;
    if (enriched.needsApproval) return true;
    const d = daysUntil(enriched.nextDeadlineIso || enriched.nextDeadlineDate, now);
    return d != null && d >= 0 && d <= 7;
  }).length;
}

/**
 * Derive up to 3 priority action cards from awards.
 */
export function derivePriorityActions(awards, now = new Date()) {
  const enriched = awards.map((a) => enrichAward(a, now));
  const actions = [];

  for (const a of enriched) {
    const dueDays = daysUntil(a.nextDeadlineIso || a.nextDeadlineDate, now);
    if (dueDays != null && dueDays >= 0 && dueDays <= 7 && a.nextDeadlineLabel) {
      actions.push({
        id: `due-${a.id}`,
        kind: "dueSoon",
        tagKey: "tagDueInDays",
        tagParams: { count: dueDays },
        title: a.nextDeadlineLabel,
        bodyKey: "actionDueBody",
        bodyParams: { award: a.title, date: a.nextDeadlineDisplay || a.nextDeadlineIso },
        awardId: a.id,
        sort: dueDays,
      });
    }
  }

  for (const a of enriched) {
    if (a.needsApproval) {
      actions.push({
        id: `approval-${a.id}`,
        kind: "needsApproval",
        tagKey: "tagNeedsApproval",
        tagParams: {},
        title: a.approvalTitle || a.title,
        bodyKey: "actionApprovalBody",
        bodyParams: { award: a.title, detail: a.approvalDetail || "" },
        awardId: a.id,
        sort: 50,
      });
    }
  }

  for (const a of enriched) {
    if (a.pulse.status === "atRisk" && a.pulse.reasonKey === "reasonSpendBehind") {
      actions.push({
        id: `risk-${a.id}`,
        kind: "atRisk",
        tagKey: "tagAtRisk",
        tagParams: {},
        titleKey: "actionUnderspentTitle",
        titleParams: { award: a.title },
        bodyKey: "actionUnderspentBody",
        bodyParams: {
          time: a.timePct,
          spent: a.spentPct,
          days: a.daysLeft != null && a.daysLeft > 0 ? a.daysLeft : 0,
          amount: formatUsdFull(a.underspentAmount),
        },
        awardId: a.id,
        sort: 80 + a.pulse.gapPts,
      });
    }
  }

  const seen = new Set();
  return actions
    .filter((x) => {
      if (seen.has(x.id)) return false;
      seen.add(x.id);
      return true;
    })
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 3);
}

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle, FiCheckCircle, FiEdit2, FiPlus, FiX } from "react-icons/fi";
import { parseLocalStorageJson } from "../../../utils/safeStorage.js";
import { getTrialSession } from "../../../services/trialAuthSession.js";
import { isTrialUserSession } from "../../rfp-collaboration/useTrialCollabT.js";
import {
  DEMO_AWARDS,
  DEMO_PRIORITY_ACTIONS,
} from "../data/awardManagementDemoData.js";
import {
  countAttention,
  derivePriorityActions,
  enrichAward,
  formatUsdCompact,
  formatUsdFull,
} from "../services/grantPulse.js";
import {
  addAward,
  addAwardFromBidSubmission,
  ensureAwardManagementFresh,
  getAwardManagementData,
  hydrateAwardManagementFromServer,
  subscribeAwardManagement,
  updateAward,
} from "../services/awardManagementStore.js";
import { listSubmissions, BID_VAULT_CHANGED_EVENT } from "../services/bidVaultStore.js";
import {
  GRANARY_BTN_PRIMARY,
  GRANARY_BTN_SECONDARY,
  GRANARY_CARD,
  GRANARY_INPUT,
  GRANARY_PANEL,
} from "../../../styles/granarySurfaces.js";

function isDemoProposalManagerSession() {
  if (isTrialUserSession()) return false;
  const user = parseLocalStorageJson("rbac_current_user");
  const username = String(user?.username || "").toLowerCase();
  const role = String(user?.role || "").toLowerCase();
  const team = String(user?.team || "").toLowerCase();
  return (
    username === "proposal_manager" ||
    role === "proposal manager" ||
    team === "proposal team"
  );
}

function greetingPeriod(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function displayFirstName() {
  const session = getTrialSession();
  const user = parseLocalStorageJson("rbac_current_user");
  const raw = String(
    session?.user?.name || user?.name || user?.displayName || user?.username || "",
  ).trim();
  if (!raw) return "there";
  return raw.split(/\s+/)[0];
}

function PulseBar({ label, pct, tone }) {
  const fill =
    tone === "spent"
      ? "bg-[#3D4F66] dark:bg-[#8FA3B8]"
      : tone === "done"
        ? "bg-emerald-500 dark:bg-emerald-400"
        : "bg-slate-400 dark:bg-slate-500";
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <div className="h-1.5 min-w-[4.5rem] flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-[11px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
        {pct}%
      </span>
    </div>
  );
}

function StatusBadge({ status, t }) {
  if (status === "atRisk") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-800 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-800">
        <span className="inline-block h-1.5 w-1.5 rounded-sm bg-red-600" aria-hidden />
        {t("proposalManagerAwardManagement.statusAtRisk")}
      </span>
    );
  }
  if (status === "watch") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800">
        <FiAlertTriangle className="h-3 w-3" aria-hidden />
        {t("proposalManagerAwardManagement.statusWatch")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800">
      <FiCheckCircle className="h-3 w-3" aria-hidden />
      {t("proposalManagerAwardManagement.statusOnTrack")}
    </span>
  );
}

function ActionTag({ kind, tagKey, tagParams, t }) {
  const label = t(`proposalManagerAwardManagement.${tagKey}`, tagParams);
  const cls =
    kind === "atRisk"
      ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200"
      : kind === "needsApproval"
        ? "bg-amber-100/80 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        : "bg-orange-100 text-orange-900 dark:bg-orange-950/40 dark:text-orange-100";
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function EditAwardModal({ award, onClose, onSave, t }) {
  const [spentPct, setSpentPct] = useState(String(award.spentPct ?? 0));
  const [donePct, setDonePct] = useState(String(award.donePct ?? 0));
  const [needsApproval, setNeedsApproval] = useState(Boolean(award.needsApproval));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal>
      <div className={`${GRANARY_CARD} w-full max-w-md space-y-4 p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t("proposalManagerAwardManagement.editTitle")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{award.title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t("proposalManagerAwardManagement.cancel")}>
            <FiX className="h-4 w-4" />
          </button>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("proposalManagerAwardManagement.fieldSpent")}
          </span>
          <input
            type="number"
            min={0}
            max={100}
            value={spentPct}
            onChange={(e) => setSpentPct(e.target.value)}
            className={GRANARY_INPUT}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("proposalManagerAwardManagement.fieldDone")}
          </span>
          <input
            type="number"
            min={0}
            max={100}
            value={donePct}
            onChange={(e) => setDonePct(e.target.value)}
            className={GRANARY_INPUT}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={needsApproval}
            onChange={(e) => setNeedsApproval(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#3D4F66] focus:ring-[#3D4F66]"
          />
          {t("proposalManagerAwardManagement.fieldNeedsApproval")}
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={GRANARY_BTN_SECONDARY} onClick={onClose}>
            {t("proposalManagerAwardManagement.cancel")}
          </button>
          <button
            type="button"
            className={GRANARY_BTN_PRIMARY}
            onClick={() =>
              onSave({
                spentPct: Number(spentPct),
                donePct: Number(donePct),
                needsApproval,
              })
            }
          >
            {t("proposalManagerAwardManagement.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddAwardModal({ onClose, onSave, t }) {
  const [title, setTitle] = useState("");
  const [funder, setFunder] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal>
      <div className={`${GRANARY_CARD} w-full max-w-md space-y-4 p-5`}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {t("proposalManagerAwardManagement.addTitle")}
          </h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t("proposalManagerAwardManagement.cancel")}>
            <FiX className="h-4 w-4" />
          </button>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("proposalManagerAwardManagement.fieldTitle")}
          </span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={GRANARY_INPUT} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("proposalManagerAwardManagement.fieldFunder")}
          </span>
          <input value={funder} onChange={(e) => setFunder(e.target.value)} className={GRANARY_INPUT} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {t("proposalManagerAwardManagement.fieldAmount")}
          </span>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={GRANARY_INPUT}
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={GRANARY_BTN_SECONDARY} onClick={onClose}>
            {t("proposalManagerAwardManagement.cancel")}
          </button>
          <button
            type="button"
            className={GRANARY_BTN_PRIMARY}
            disabled={!title.trim()}
            onClick={() =>
              onSave({
                title: title.trim(),
                funder: funder.trim(),
                amount: Number(amount) || 0,
              })
            }
          >
            {t("proposalManagerAwardManagement.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AwardManagementPage() {
  const { t } = useTranslation("common");
  const demoMode = isDemoProposalManagerSession();
  const trialMode = isTrialUserSession();
  const [trialBlob, setTrialBlob] = useState(() =>
    trialMode ? getAwardManagementData() : { awards: [], freshReset: true },
  );
  const [hydrating, setHydrating] = useState(trialMode);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [wonBids, setWonBids] = useState([]);

  useEffect(() => {
    if (!trialMode) return undefined;
    let cancelled = false;
    (async () => {
      setHydrating(true);
      await hydrateAwardManagementFromServer();
      if (!cancelled) {
        ensureAwardManagementFresh();
        setTrialBlob(getAwardManagementData());
        setWonBids(listSubmissions().filter((s) => s.stage === "won"));
        setHydrating(false);
      }
    })();
    const unsub = subscribeAwardManagement((next) => setTrialBlob(next));
    const onVault = () => setWonBids(listSubmissions().filter((s) => s.stage === "won"));
    window.addEventListener(BID_VAULT_CHANGED_EVENT, onVault);
    return () => {
      cancelled = true;
      unsub();
      window.removeEventListener(BID_VAULT_CHANGED_EVENT, onVault);
    };
  }, [trialMode]);

  const rawAwards = demoMode ? DEMO_AWARDS : trialBlob.awards;
  const awards = useMemo(() => rawAwards.map((a) => enrichAward(a)), [rawAwards]);

  const priorityActions = useMemo(() => {
    if (demoMode) return DEMO_PRIORITY_ACTIONS;
    return derivePriorityActions(rawAwards);
  }, [demoMode, rawAwards]);

  const promotableWins = useMemo(() => {
    if (!trialMode) return [];
    const linked = new Set(rawAwards.map((a) => a.sourceBidId).filter(Boolean));
    return wonBids.filter((s) => !linked.has(String(s.id)));
  }, [trialMode, wonBids, rawAwards]);

  const totalAmount = awards.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  const attention = countAttention(awards);
  const firstName = displayFirstName();
  const period = greetingPeriod();
  const showFreshEmpty = trialMode && !demoMode && awards.length === 0 && !hydrating;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {demoMode
              ? t(`proposalManagerAwardManagement.greetingPlain.${period}`)
              : t(`proposalManagerAwardManagement.greeting.${period}`, { name: firstName })}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {showFreshEmpty
              ? t("proposalManagerAwardManagement.rollupEmpty")
              : t("proposalManagerAwardManagement.rollup", {
                  count: awards.length,
                  amount: formatUsdCompact(totalAmount),
                  attention,
                })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {demoMode ? (
            <span className="inline-flex self-start rounded-full bg-[#D8E0EA] px-2.5 py-1 text-[11px] font-semibold text-[#3D4F66] ring-1 ring-[#3D4F66]/20 dark:bg-[#2A3548] dark:text-[#B8C5D6] dark:ring-[#8FA3B8]/30">
              {t("proposalManagerAwardManagement.demoBadge")}
            </span>
          ) : null}
          {trialMode ? (
            <button type="button" className={GRANARY_BTN_PRIMARY} onClick={() => setAdding(true)}>
              <FiPlus className="h-4 w-4" aria-hidden />
              {t("proposalManagerAwardManagement.addAward")}
            </button>
          ) : null}
        </div>
      </header>

      {hydrating ? (
        <p className="text-sm text-slate-500">{t("proposalManagerAwardManagement.loading")}</p>
      ) : null}

      {showFreshEmpty ? (
        <section className={`${GRANARY_PANEL} space-y-4`}>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("proposalManagerAwardManagement.freshTitle")}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {t("proposalManagerAwardManagement.freshBody")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={GRANARY_BTN_PRIMARY} onClick={() => setAdding(true)}>
              <FiPlus className="h-4 w-4" aria-hidden />
              {t("proposalManagerAwardManagement.addAward")}
            </button>
            <Link to="/app/bid-vault" className={GRANARY_BTN_SECONDARY}>
              {t("proposalManagerAwardManagement.openBidVault")}
            </Link>
            <Link to="/app/grants" className={GRANARY_BTN_SECONDARY}>
              {t("proposalManagerAwardManagement.openGrants")}
            </Link>
          </div>
          {promotableWins.length > 0 ? (
            <div className="space-y-2 border-t border-[#D8E0EA] pt-4 dark:border-[#2A3548]">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("proposalManagerAwardManagement.promoteHeading")}
              </p>
              <ul className="space-y-2">
                {promotableWins.map((bid) => (
                  <li
                    key={bid.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[#D8E0EA] bg-[#F4F6F9] px-3 py-2 dark:border-[#2A3548] dark:bg-[#0B1017]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{bid.title}</p>
                      <p className="text-xs text-slate-500">
                        {[bid.agency, bid.value != null ? formatUsdFull(bid.value) : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={GRANARY_BTN_SECONDARY}
                      onClick={() => addAwardFromBidSubmission(bid)}
                    >
                      {t("proposalManagerAwardManagement.promoteCta")}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("proposalManagerAwardManagement.promoteHint")}
            </p>
          )}
        </section>
      ) : null}

      {priorityActions.length > 0 ? (
        <section
          aria-label={t("proposalManagerAwardManagement.priorityHeading")}
          className="grid grid-cols-1 gap-3 md:grid-cols-3"
        >
          {priorityActions.map((action) => {
            const title =
              action.title ||
              (action.titleKey
                ? t(`proposalManagerAwardManagement.${action.titleKey}`, action.titleParams)
                : "");
            const body =
              action.bodyFixed ||
              (action.bodyKey
                ? t(`proposalManagerAwardManagement.${action.bodyKey}`, action.bodyParams)
                : "");
            return (
              <article key={action.id} className={`${GRANARY_CARD} space-y-2 p-4`}>
                <ActionTag
                  kind={action.kind}
                  tagKey={action.tagKey}
                  tagParams={action.tagParams}
                  t={t}
                />
                <h2 className="text-sm font-semibold leading-snug text-slate-900 dark:text-white">
                  {title}
                </h2>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{body}</p>
              </article>
            );
          })}
        </section>
      ) : null}

      {!showFreshEmpty ? (
      <section className={`${GRANARY_PANEL} space-y-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("proposalManagerAwardManagement.myAwards")}
            </h2>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {t("proposalManagerAwardManagement.pulseHint")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden />
              {t("proposalManagerAwardManagement.legendTime")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#3D4F66] dark:bg-[#8FA3B8]" aria-hidden />
              {t("proposalManagerAwardManagement.legendSpent")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              {t("proposalManagerAwardManagement.legendDone")}
            </span>
          </div>
        </div>

        {trialMode && promotableWins.length > 0 ? (
          <div className="space-y-2 rounded-[10px] border border-dashed border-[#3D4F66]/25 bg-[#F0F3F7] p-3 dark:border-[#8FA3B8]/30 dark:bg-[#2A3548]">
            <p className="text-xs font-semibold text-[#3D4F66] dark:text-[#B8C5D6]">
              {t("proposalManagerAwardManagement.promoteHeading")}
            </p>
            <ul className="space-y-2">
              {promotableWins.slice(0, 3).map((bid) => (
                <li key={bid.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-slate-800 dark:text-slate-100">{bid.title}</span>
                  <button
                    type="button"
                    className={GRANARY_BTN_SECONDARY}
                    onClick={() => addAwardFromBidSubmission(bid)}
                  >
                    {t("proposalManagerAwardManagement.promoteCta")}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {awards.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {t("proposalManagerAwardManagement.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#D8E0EA] text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-[#2A3548] dark:text-slate-400">
                  <th className="px-2 py-2">{t("proposalManagerAwardManagement.colAward")}</th>
                  <th className="px-2 py-2">{t("proposalManagerAwardManagement.colAmount")}</th>
                  <th className="px-2 py-2">{t("proposalManagerAwardManagement.colPulse")}</th>
                  <th className="px-2 py-2">{t("proposalManagerAwardManagement.colStatus")}</th>
                  <th className="px-2 py-2">{t("proposalManagerAwardManagement.colDeadline")}</th>
                  {trialMode ? <th className="px-2 py-2"><span className="sr-only">{t("proposalManagerAwardManagement.edit")}</span></th> : null}
                </tr>
              </thead>
              <tbody>
                {awards.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#D8E0EA]/80 last:border-0 dark:border-[#2A3548]/80"
                  >
                    <td className="px-2 py-3 align-top">
                      <p className="font-semibold text-slate-900 dark:text-white">{row.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{row.funder}</p>
                    </td>
                    <td className="px-2 py-3 align-top tabular-nums text-slate-800 dark:text-slate-100">
                      {formatUsdFull(row.amount)}
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="min-w-[11rem] space-y-1.5">
                        <PulseBar
                          label={t("proposalManagerAwardManagement.legendTime")}
                          pct={row.timePct}
                          tone="time"
                        />
                        <PulseBar
                          label={t("proposalManagerAwardManagement.legendSpent")}
                          pct={row.spentPct}
                          tone="spent"
                        />
                        <PulseBar
                          label={t("proposalManagerAwardManagement.legendDone")}
                          pct={row.donePct}
                          tone="done"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top">
                      <div className="space-y-1">
                        <StatusBadge status={row.pulse.status} t={t} />
                        <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                          {t(`proposalManagerAwardManagement.${row.pulse.reasonKey}`, row.pulse.reasonParams)}
                        </p>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top text-slate-700 dark:text-slate-200">
                      {[row.nextDeadlineDisplay || row.nextDeadlineIso, row.nextDeadlineLabel]
                        .filter(Boolean)
                        .join(" · ")}
                    </td>
                    {trialMode ? (
                      <td className="px-2 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => setEditing(row)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#3D4F66] hover:bg-[#F0F3F7] dark:text-[#B8C5D6] dark:hover:bg-[#2A3548]"
                        >
                          <FiEdit2 className="h-3 w-3" aria-hidden />
                          {t("proposalManagerAwardManagement.edit")}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      ) : null}

      {editing ? (
        <EditAwardModal
          award={editing}
          t={t}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            updateAward(editing.id, patch);
            setEditing(null);
          }}
        />
      ) : null}

      {adding ? (
        <AddAwardModal
          t={t}
          onClose={() => setAdding(false)}
          onSave={(input) => {
            addAward(input);
            setAdding(false);
          }}
        />
      ) : null}
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiDownload, FiLayout } from "react-icons/fi";
import { useLocalization } from "../../../hooks/useLocalization";
import { generateSlideDeck } from "../../../services/api.js";
import { COMPETITORS } from "../data/competitiveIntelligenceSamples";
import { buildWinSlideDeckContent, defaultWinSlideFromPursuit } from "../data/winSlideTemplates";
import { getWinLossRecords } from "../services/winLossStorage";
import { loadWinSlideDraft, saveWinSlideDraft } from "../services/winSlideStorage";
import { useProposalIssuer } from "./ProposalIssuerContext";

export default function WinSlidePage() {
  const { t } = useTranslation("common");
  const { isRTLMode } = useLocalization();
  const { issuer } = useProposalIssuer();
  const pursuits = useMemo(() => getWinLossRecords(), []);
  const draft = loadWinSlideDraft();

  const [pursuitId, setPursuitId] = useState(draft?.pursuitId || pursuits[0]?.id || "");
  const [competitorIds, setCompetitorIds] = useState(draft?.competitorIds || ["accenture", "dxc"]);
  const [outcome, setOutcome] = useState(draft?.outcome || pursuits[0]?.outcome || "won");
  const [pov, setPov] = useState(draft?.pov || "");
  const [testing, setTesting] = useState(draft?.testing || "");
  const [whyUs, setWhyUs] = useState(draft?.whyUs || "");
  const [whyThem, setWhyThem] = useState(draft?.whyThem || "");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [seeded, setSeeded] = useState(!!draft?.pov);

  const pursuit = pursuits.find((p) => p.id === pursuitId) || null;
  const selectedCompetitors = COMPETITORS.filter((c) => competitorIds.includes(c.id));

  useEffect(() => {
    if (seeded || !pursuit) return;
    applyTemplate(pursuit, selectedCompetitors, pursuit.outcome || outcome);
    setSeeded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pursuit?.id, seeded]);

  const applyTemplate = (nextPursuit = pursuit, nextCompetitors = selectedCompetitors, nextOutcome = nextPursuit?.outcome || outcome) => {
    const copy = defaultWinSlideFromPursuit(nextPursuit, nextCompetitors);
    setPov(copy.pov);
    setTesting(copy.testing);
    setWhyUs(copy.whyUs.join("\n"));
    setWhyThem(copy.whyThem.join("\n"));
    setOutcome(nextOutcome);
    persist({
      pursuitId: nextPursuit?.id,
      competitorIds,
      outcome: nextOutcome,
      pov: copy.pov,
      testing: copy.testing,
      whyUs: copy.whyUs.join("\n"),
      whyThem: copy.whyThem.join("\n"),
    });
  };

  const persist = (patch) => {
    saveWinSlideDraft({
      pursuitId,
      competitorIds,
      outcome,
      pov,
      testing,
      whyUs,
      whyThem,
      ...patch,
    });
  };

  const lines = (text) =>
    String(text || "")
      .split(/\n/)
      .map((l) => l.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);

  const againstLabel =
    selectedCompetitors.length > 0
      ? selectedCompetitors.map((c) => c.shortName).join(" · ")
      : t("proposalManagerWinSlide.theField");

  const downloadDeck = async () => {
    setExportError("");
    setExporting(true);
    try {
      const content = buildWinSlideDeckContent({
        pursuit,
        outcome,
        competitors: selectedCompetitors,
        pov,
        testing,
        whyUs: lines(whyUs),
        whyThem: lines(whyThem),
      });
      const question =
        outcome === "won"
          ? `Win slide — Won against ${againstLabel}`
          : outcome === "lost"
            ? `Win slide — Lost against ${againstLabel}`
            : `Win slide — Competing against ${againstLabel}`;
      const { blob, filename } = await generateSlideDeck({
        question,
        content,
        issuerName: issuer?.name || pursuit?.agency || "",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "juno-win-slide.pptx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err?.message || t("proposalManagerWinSlide.exportError"));
    } finally {
      setExporting(false);
    }
  };

  const toggleCompetitor = (id) => {
    setCompetitorIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 4 ? prev : [...prev, id];
      persist({ competitorIds: next });
      return next;
    });
  };

  const dir = isRTLMode ? "rtl" : "ltr";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8" dir={dir}>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <FiLayout className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">{t("proposalManagerWinSlide.eyebrow")}</span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">
              {t("proposalManagerWinSlide.title")}
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{t("proposalManagerWinSlide.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyTemplate()}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("proposalManagerWinSlide.applyTemplate")}
            </button>
            <button
              type="button"
              onClick={downloadDeck}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              <FiDownload className="h-4 w-4" />
              {exporting ? t("proposalManagerWinSlide.exporting") : t("proposalManagerWinSlide.exportPptx")}
            </button>
          </div>
        </header>
        {exportError ? <p className="text-sm text-rose-600">{exportError}</p> : null}

        <section className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("proposalManagerWinSlide.pursuit")}
              </label>
              <select
                value={pursuitId}
                onChange={(e) => {
                  const id = e.target.value;
                  setPursuitId(id);
                  const next = pursuits.find((p) => p.id === id);
                  persist({ pursuitId: id, outcome: next?.outcome || outcome });
                  if (next) applyTemplate(next, selectedCompetitors, next.outcome);
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {pursuits.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.rfpName} ({p.outcome})
                  </option>
                ))}
              </select>
              <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("proposalManagerWinSlide.postSelection")}
              </label>
              <div className="mt-1 flex gap-1">
                {["won", "lost", "pending"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setOutcome(key);
                      persist({ outcome: key });
                    }}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      outcome === key ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                    }`}
                  >
                    {t(`proposalManagerWinSlide.outcome.${key}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("proposalManagerWinSlide.against")}
              </h2>
              <p className="mt-1 text-[11px] text-slate-400">{t("proposalManagerWinSlide.againstHint")}</p>
              <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
                {COMPETITORS.map((c) => (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <input type="checkbox" checked={competitorIds.includes(c.id)} onChange={() => toggleCompetitor(c.id)} />
                      <span>
                        <span className="font-medium text-slate-800 dark:text-white">{c.shortName}</span>
                        <span className="block text-[11px] text-slate-500">{c.segment}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <label className="text-xs font-semibold uppercase text-slate-500">{t("proposalManagerWinSlide.pov")}</label>
              <textarea
                value={pov}
                onChange={(e) => {
                  setPov(e.target.value);
                  persist({ pov: e.target.value });
                }}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <label className="mt-3 block text-xs font-semibold uppercase text-slate-500">{t("proposalManagerWinSlide.testing")}</label>
              <textarea
                value={testing}
                onChange={(e) => {
                  setTesting(e.target.value);
                  persist({ testing: e.target.value });
                }}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-emerald-700">{t("proposalManagerWinSlide.whyUs")}</label>
                  <textarea
                    value={whyUs}
                    onChange={(e) => {
                      setWhyUs(e.target.value);
                      persist({ whyUs: e.target.value });
                    }}
                    rows={5}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-rose-700">{t("proposalManagerWinSlide.whyThem")}</label>
                  <textarea
                    value={whyThem}
                    onChange={(e) => {
                      setWhyThem(e.target.value);
                      persist({ whyThem: e.target.value });
                    }}
                    rows={5}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 shadow-lg">
              <div className="aspect-video bg-[#1E3A5F] text-white">
                <div className="flex h-full flex-col p-6 md:p-8">
                  <div className="flex items-start justify-between gap-3 text-[10px] uppercase tracking-[0.16em] text-teal-300">
                    <span>JUNO RFP · Marln</span>
                    <span>{t("proposalManagerWinSlide.slideKicker")}</span>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold md:text-2xl">
                    {pursuit?.rfpName || t("proposalManagerWinSlide.title")}
                  </h2>
                  <p className="mt-1 text-sm text-blue-100">
                    {outcome === "won"
                      ? t("proposalManagerWinSlide.wonAgainst", { names: againstLabel })
                      : outcome === "lost"
                        ? t("proposalManagerWinSlide.lostAgainst", { names: againstLabel })
                        : t("proposalManagerWinSlide.competingAgainst", { names: againstLabel })}
                  </p>
                  <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-100 md:text-sm">{pov}</p>
                  <div className="mt-4 grid min-h-0 flex-1 grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white/10 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-300">{t("proposalManagerWinSlide.whyUs")}</p>
                      <ul className="mt-2 space-y-1 text-[11px] leading-snug text-slate-100">
                        {lines(whyUs).slice(0, 4).map((l) => (
                          <li key={l}>• {l}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg bg-white/10 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-rose-300">{t("proposalManagerWinSlide.whyThem")}</p>
                      <ul className="mt-2 space-y-1 text-[11px] leading-snug text-slate-100">
                        {lines(whyThem).slice(0, 4).map((l) => (
                          <li key={l}>• {l}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-[11px] text-teal-100">{testing}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

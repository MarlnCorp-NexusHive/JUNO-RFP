import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiLayers, FiMap } from "react-icons/fi";
import { useLocalization } from "../../../hooks/useLocalization";
import { useProposalIssuer } from "./ProposalIssuerContext";
import TopologyEnvironmentDiagram, { TopologyGlyph } from "./topology/TopologyEnvironmentDiagram";
import {
  ICON_LEGEND,
  OWNER_LEGEND,
  TOPOLOGY_TEMPLATES,
  buildTopology,
  matchTemplateForIssuer,
} from "../data/topologyEnvironments";
import { loadTopologyPrefs, saveTopologyPrefs } from "../services/topologyStorage";

export default function TopologyPage() {
  const { t } = useTranslation("common");
  const { isRTLMode } = useLocalization();
  const { issuer } = useProposalIssuer();
  const suggested = useMemo(() => matchTemplateForIssuer(issuer), [issuer]);
  const initial = loadTopologyPrefs();

  const [templateId, setTemplateId] = useState(initial.templateId || suggested.id);
  const [overlay, setOverlay] = useState(initial.overlay);

  const persist = (nextId, nextOverlay) => {
    saveTopologyPrefs({ templateId: nextId, overlay: nextOverlay });
  };

  const spec = useMemo(
    () =>
      buildTopology({
        templateId,
        companyName: issuer?.name,
        overlay,
      }),
    [templateId, issuer?.name, overlay]
  );

  const dir = isRTLMode ? "rtl" : "ltr";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8" dir={dir}>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <FiMap className="h-5 w-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">
              {t("proposalManagerTopology.eyebrow")}
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">
            {t("proposalManagerTopology.title")}
          </h1>
          <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-400 md:text-base">
            {t("proposalManagerTopology.subtitle")}
          </p>
          {issuer ? (
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              {t("proposalManagerTopology.linkedIssuer", {
                name: issuer.name,
                sector: issuer.sector || t("proposalManagerTopology.sectorUnknown"),
              })}
            </p>
          ) : (
            <p className="text-xs text-slate-500">{t("proposalManagerTopology.noIssuer")}</p>
          )}
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("proposalManagerTopology.environment")}
              </span>
              <select
                value={templateId}
                onChange={(e) => {
                  setTemplateId(e.target.value);
                  persist(e.target.value, overlay);
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {TOPOLOGY_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                    {tpl.id === suggested.id ? ` — ${t("proposalManagerTopology.suggested")}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setOverlay(false);
                  persist(templateId, false);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  !overlay
                    ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {t("proposalManagerTopology.asIs")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOverlay(true);
                  persist(templateId, true);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  overlay
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {t("proposalManagerTopology.withJuno")}
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{spec.legendNote}</p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <FiLayers className="h-4 w-4 text-indigo-500" />
            {overlay
              ? t("proposalManagerTopology.diagramToBe", { company: spec.companyName })
              : t("proposalManagerTopology.diagramAsIs", { company: spec.companyName })}
          </div>
          <TopologyEnvironmentDiagram diagramSpec={spec} />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t("proposalManagerTopology.iconLegend")}
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              {ICON_LEGEND.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <TopologyGlyph icon={item.id} />
                  </span>
                  {t(`proposalManagerTopology.icons.${item.id}`, { defaultValue: item.label })}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t("proposalManagerTopology.ownerLegend")}
            </h2>
            <ul className="mt-3 space-y-2 text-xs">
              {OWNER_LEGEND.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span
                    className={`h-3 w-3 rounded-sm border ${
                      item.id === "juno"
                        ? "border-indigo-600 bg-indigo-100"
                        : item.id === "integration"
                          ? "border-teal-700 bg-teal-100"
                          : "border-slate-500 bg-white"
                    }`}
                  />
                  {t(`proposalManagerTopology.owners.${item.id}`, { defaultValue: item.label })}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {overlay && spec.placements?.length ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t("proposalManagerTopology.placementsTitle")}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {spec.placements.map((row) => (
                <article
                  key={row.capability}
                  className="rounded-xl border border-indigo-100 bg-white p-4 dark:border-indigo-900/40 dark:bg-slate-900"
                >
                  <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{row.capability}</h3>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {t("proposalManagerTopology.sitsOn")}: {row.sitsOn}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{row.why}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

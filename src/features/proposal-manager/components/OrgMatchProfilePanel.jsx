import React, { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiChevronDown, FiSearch, FiTarget, FiX } from "react-icons/fi";
import {
  CERTIFICATION_OPTIONS,
  EMPTY_ORG_MATCH_PROFILE,
  ENTITY_TYPE_OPTIONS,
  REVENUE_BAND_OPTIONS,
  US_STATE_OPTIONS,
  clearOrgMatchProfile,
  getOrgMatchProfile,
  hydrateOrgMatchProfileFromServer,
  isOrgMatchProfileReady,
  saveOrgMatchProfile,
  subscribeOrgMatchProfile,
} from "../services/orgMatchProfileStore.js";

const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white";

function StatesMultiSelect({ selected = [], onChange, tt }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const listId = useId();
  const searchId = useId();
  const selectedSet = new Set(selected);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return undefined;
    }
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (id) => {
    if (selectedSet.has(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id].sort());
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? US_STATE_OPTIONS.filter(
        (opt) => opt.id.toLowerCase().includes(q) || opt.name.toLowerCase().includes(q),
      )
    : US_STATE_OPTIONS;

  const summary =
    selected.length === 0
      ? tt("statesNone")
      : selected.length <= 4
        ? selected.join(", ")
        : tt("statesSelected", { count: selected.length });

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={`${fieldClass} flex items-center justify-between gap-2 text-start`}
      >
        <span className={selected.length ? "" : "text-gray-400 dark:text-gray-500"}>{summary}</span>
        <FiChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {selected.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const opt = US_STATE_OPTIONS.find((s) => s.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-800"
              >
                {opt ? `${id} · ${opt.name}` : id}
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="rounded p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-900"
                  aria-label={`Remove ${id}`}
                >
                  <FiX className="h-3 w-3" aria-hidden />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      {open ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          <div className="sticky top-0 space-y-2 border-b border-gray-100 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
            <div className="relative">
              <FiSearch
                className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                ref={searchRef}
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder={tt("statesSearch")}
                className="w-full rounded-md border border-gray-300 bg-white py-1.5 pe-2 ps-8 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                autoComplete="off"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300"
              >
                {tt("statesClear")}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              >
                {tt("statesDone")}
              </button>
            </div>
          </div>
          <div id={listId} role="listbox" aria-multiselectable="true" className="max-h-44 overflow-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-gray-500 dark:text-gray-400">{tt("statesNoResults")}</p>
            ) : (
              <ul className="space-y-0.5">
                {filtered.map((opt) => {
                  const on = selectedSet.has(opt.id);
                  return (
                    <li key={opt.id}>
                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/60 ${
                          on ? "bg-indigo-50/80 dark:bg-indigo-950/30" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(opt.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="w-8 font-semibold tabular-nums text-gray-800 dark:text-gray-100">{opt.id}</span>
                        <span className="text-gray-600 dark:text-gray-300">{opt.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function OrgMatchProfilePanel() {
  const { t } = useTranslation("common");
  const tt = (key, opts) => t(`proposalManagerCompanyIntelligence.orgMatch.${key}`, opts);
  const [form, setForm] = useState(() => getOrgMatchProfile());
  const [savedFlash, setSavedFlash] = useState(false);
  const [clearedFlash, setClearedFlash] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(getOrgMatchProfile());
    void hydrateOrgMatchProfileFromServer().then((profile) => {
      if (profile) setForm(profile);
    });
    return subscribeOrgMatchProfile((profile) => {
      setForm(profile);
    });
  }, []);

  const setField = (key, value) => {
    setError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleInArray = (key, id) => {
    setError("");
    setForm((prev) => {
      const cur = Array.isArray(prev[key]) ? prev[key] : [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...prev, [key]: next };
    });
  };

  const onSave = (e) => {
    e.preventDefault();
    setClearedFlash(false);
    const result = saveOrgMatchProfile(form);
    if (!result.ok) {
      setError(tt("errorEntityRequired"));
      setForm(result.profile);
      return;
    }
    setError("");
    setForm(result.profile);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 3000);
  };

  const onClear = () => {
    setError("");
    setSavedFlash(false);
    clearOrgMatchProfile();
    setForm({ ...EMPTY_ORG_MATCH_PROFILE });
    setClearedFlash(true);
    window.setTimeout(() => setClearedFlash(false), 3000);
  };

  const ready = isOrgMatchProfileReady(form);
  const entityTypes = Array.isArray(form.entityTypes) ? form.entityTypes : [];
  const certifications = Array.isArray(form.certifications) ? form.certifications : [];

  return (
    <section
      className="rounded-xl border border-indigo-200/80 bg-white p-4 shadow-sm dark:border-indigo-900/50 dark:bg-gray-800 md:p-6"
      data-tour="org-match"
      data-tour-title-en="Applicant Profile"
      data-tour-title-ar="ملف المتقدم"
      data-tour-content-en="Tell Grants who you are as an applicant so opportunities can be scored for eligibility and capacity."
      data-tour-content-ar="عرّف المنح بمن أنتم كمتقدم حتى تُقيَّم الفرص حسب الأهلية والقدرة."
      data-tour-position="bottom"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <FiTarget className="h-5 w-5 text-indigo-600" aria-hidden />
            {tt("title")}
          </h2>
          <p className="max-w-2xl text-sm text-gray-600 dark:text-gray-300">{tt("subtitle")}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            ready
              ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800"
              : "bg-amber-50 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800"
          }`}
        >
          {ready ? tt("statusReady") : tt("statusIncomplete")}
        </span>
      </div>

      <form onSubmit={onSave} className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {tt("entityTypes")} <span className="text-rose-500">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {ENTITY_TYPE_OPTIONS.map((opt) => {
              const on = entityTypes.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleInArray("entityTypes", opt.id)}
                  aria-pressed={on}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                    on
                      ? "bg-indigo-600 text-white ring-indigo-600"
                      : "bg-gray-50 text-gray-700 ring-gray-200 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-600"
                  }`}
                >
                  {tt(opt.labelKey)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{tt("yearsInOperation")}</span>
            <input
              type="number"
              min={0}
              max={200}
              value={form.yearsInOperation ?? ""}
              onChange={(e) =>
                setField("yearsInOperation", e.target.value === "" ? null : Number(e.target.value))
              }
              className={fieldClass}
              placeholder={tt("yearsPlaceholder")}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{tt("foundedYear")}</span>
            <input
              type="number"
              min={1800}
              max={2100}
              value={form.foundedYear ?? ""}
              onChange={(e) =>
                setField("foundedYear", e.target.value === "" ? null : Number(e.target.value))
              }
              className={fieldClass}
              placeholder="e.g. 2018"
            />
          </label>
          <div className="block space-y-1 sm:col-span-2 lg:col-span-1">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{tt("states")}</span>
            <StatesMultiSelect
              selected={Array.isArray(form.states) ? form.states : []}
              onChange={(next) => setField("states", next)}
              tt={tt}
            />
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{tt("revenueBand")}</span>
            <select
              value={form.revenueBand || ""}
              onChange={(e) => setField("revenueBand", e.target.value)}
              className={fieldClass}
            >
              {REVENUE_BAND_OPTIONS.map((opt) => (
                <option key={opt.id || "unset"} value={opt.id}>
                  {tt(opt.labelKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{tt("minAwardCapacity")}</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={form.minAwardCapacity ?? ""}
              onChange={(e) =>
                setField("minAwardCapacity", e.target.value === "" ? null : Number(e.target.value))
              }
              className={fieldClass}
              placeholder={tt("minAwardPlaceholder")}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{tt("maxAwardCapacity")}</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={form.maxAwardCapacity ?? ""}
              onChange={(e) =>
                setField("maxAwardCapacity", e.target.value === "" ? null : Number(e.target.value))
              }
              className={fieldClass}
              placeholder={tt("maxAwardPlaceholder")}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{tt("naics")}</span>
            <input
              type="text"
              value={form.naics || ""}
              onChange={(e) => setField("naics", e.target.value)}
              className={fieldClass}
              placeholder="541511, 541512"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={!!form.hasSam}
              onChange={(e) => setField("hasSam", e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            {tt("hasSam")}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={!!form.hasUei}
              onChange={(e) => setField("hasUei", e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            {tt("hasUei")}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={!!form.costShareOk}
              onChange={(e) => setField("costShareOk", e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            {tt("costShareOk")}
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {tt("certifications")}
          </legend>
          <div className="flex flex-wrap gap-2">
            {CERTIFICATION_OPTIONS.map((opt) => {
              const on = certifications.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleInArray("certifications", opt.id)}
                  aria-pressed={on}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                    on
                      ? "bg-slate-800 text-white ring-slate-800 dark:bg-slate-200 dark:text-slate-900"
                      : "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-600"
                  }`}
                >
                  {tt(opt.labelKey)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="block space-y-1">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{tt("missionKeywords")}</span>
          <textarea
            rows={2}
            value={form.missionKeywords || ""}
            onChange={(e) => setField("missionKeywords", e.target.value)}
            className={fieldClass}
            placeholder={tt("missionPlaceholder")}
          />
        </label>

        {error ? (
          <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {tt("save")}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {tt("clear")}
          </button>
          {savedFlash ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <FiCheckCircle aria-hidden />
              {tt("saved")}
            </span>
          ) : null}
          {clearedFlash ? (
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{tt("cleared")}</span>
          ) : null}
          {form.updatedAt && !clearedFlash ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {tt("lastSaved", { time: new Date(form.updatedAt).toLocaleString() })}
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}

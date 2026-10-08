import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { searchSbir } from "../../../services/api.js";
import GrantSourceSearchPanel from "./GrantSourceSearchPanel.jsx";

export default function SbirPanel() {
  const { t } = useTranslation("common");
  const [kind, setKind] = useState("topics");

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={t("proposalManagerSbir.kindTabs")}
        className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-700 dark:bg-slate-800/80"
      >
        {[
          { id: "topics", label: t("proposalManagerSbir.kindTopics") },
          { id: "awards", label: t("proposalManagerSbir.kindAwards") },
        ].map((tab) => {
          const active = kind === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setKind(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <GrantSourceSearchPanel
        key={kind}
        ns={kind === "topics" ? "proposalManagerSbirTopics" : "proposalManagerSbirAwards"}
        shortlistSource="sbir"
        openOnly={kind === "topics"}
        searchFn={searchSbir}
        initialExtra={{ agency: "", status: kind === "topics" ? "Open" : "" }}
        extraFilters={[
          {
            key: "agency",
            labelKey: "agency",
            type: "text",
            placeholderKey: "agencyPlaceholder",
            className: "w-full lg:w-36",
          },
        ]}
        buildParams={({ keyword, page, extra }) => ({
          kind,
          keyword,
          page,
          rows: 25,
          agency: extra.agency || "",
          // Topics: open solicitations only — never forecasted/closed.
          status: kind === "topics" ? "Open" : extra.status || "",
        })}
      />
    </div>
  );
}

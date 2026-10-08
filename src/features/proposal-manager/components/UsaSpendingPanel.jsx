import React from "react";
import { searchUsaSpending } from "../../../services/api.js";
import GrantSourceSearchPanel from "./GrantSourceSearchPanel.jsx";

export default function UsaSpendingPanel() {
  return (
    <GrantSourceSearchPanel
      ns="proposalManagerUsaSpending"
      shortlistSource="usaspending"
      openOnly={false}
      searchFn={searchUsaSpending}
      initialExtra={{ awardKind: "all" }}
      extraFilters={[
        {
          key: "awardKind",
          labelKey: "awardKind",
          type: "select",
          className: "w-full lg:w-48",
          options: [
            { value: "all", labelKey: "awardKindAll" },
            { value: "grants", labelKey: "awardKindGrants" },
            { value: "contracts", labelKey: "awardKindContracts" },
          ],
        },
      ]}
      buildParams={({ keyword, page, extra }) => ({
        keyword,
        page: page + 1,
        rows: 25,
        awardKind: extra.awardKind || "all",
      })}
    />
  );
}

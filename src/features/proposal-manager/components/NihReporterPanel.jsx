import React from "react";
import { searchNihReporter } from "../../../services/api.js";
import GrantSourceSearchPanel from "./GrantSourceSearchPanel.jsx";

export default function NihReporterPanel() {
  return (
    <GrantSourceSearchPanel
      ns="proposalManagerNih"
      shortlistSource="nih"
      searchFn={searchNihReporter}
      initialExtra={{ agency: "" }}
      extraFilters={[
        {
          key: "agency",
          labelKey: "agency",
          type: "text",
          placeholderKey: "agencyPlaceholder",
          className: "w-full lg:w-40",
        },
      ]}
      buildParams={({ keyword, page, extra }) => ({
        keyword,
        page,
        rows: 25,
        agency: extra.agency || "",
      })}
    />
  );
}

import React from "react";
import { searchAssistanceListings } from "../../../services/api.js";
import GrantSourceSearchPanel from "./GrantSourceSearchPanel.jsx";

export default function AssistanceListingsPanel() {
  return (
    <GrantSourceSearchPanel
      ns="proposalManagerAssistanceListings"
      shortlistSource="assistance"
      searchFn={searchAssistanceListings}
      initialExtra={{ agency: "", status: "Active" }}
      extraFilters={[
        {
          key: "agency",
          labelKey: "agency",
          type: "text",
          placeholderKey: "agencyPlaceholder",
          className: "w-full lg:w-40",
        },
        {
          key: "status",
          labelKey: "status",
          type: "select",
          className: "w-full lg:w-40",
          options: [
            { value: "all", labelKey: "statusAll" },
            { value: "Active", labelKey: "statusActive" },
            { value: "Inactive", labelKey: "statusInactive" },
          ],
        },
      ]}
      buildParams={({ keyword, page, extra }) => ({
        keyword,
        page,
        rows: 25,
        agency: extra.agency || "",
        status: extra.status || "Active",
      })}
    />
  );
}

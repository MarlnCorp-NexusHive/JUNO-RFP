import React from "react";
import { searchAssistanceListings } from "../../../services/api.js";
import GrantSourceSearchPanel from "./GrantSourceSearchPanel.jsx";

export default function AssistanceListingsPanel() {
  return (
    <GrantSourceSearchPanel
      ns="proposalManagerAssistanceListings"
      shortlistSource="assistance"
      openOnly
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
      ]}
      buildParams={({ keyword, page, extra }) => ({
        keyword,
        page,
        rows: 25,
        agency: extra.agency || "",
        status: "Active",
      })}
    />
  );
}

import React from "react";
import { searchCaGrants } from "../../../services/api.js";
import GrantSourceSearchPanel from "./GrantSourceSearchPanel.jsx";

export default function CaGrantsPanel() {
  return (
    <GrantSourceSearchPanel
      ns="proposalManagerCaGrants"
      shortlistSource="ca"
      openOnly
      searchFn={searchCaGrants}
      initialExtra={{ status: "active" }}
      extraFilters={[]}
      buildParams={({ keyword, page }) => ({
        keyword,
        page,
        rows: 25,
        status: "active",
      })}
    />
  );
}

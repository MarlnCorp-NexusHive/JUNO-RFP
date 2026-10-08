import React from "react";
import { searchFac } from "../../../services/api.js";
import GrantSourceSearchPanel from "./GrantSourceSearchPanel.jsx";

export default function FacPanel() {
  return (
    <GrantSourceSearchPanel
      ns="proposalManagerFac"
      shortlistSource="fac"
      openOnly={false}
      searchFn={searchFac}
      buildParams={({ keyword, page }) => ({
        keyword,
        page,
        rows: 25,
      })}
    />
  );
}

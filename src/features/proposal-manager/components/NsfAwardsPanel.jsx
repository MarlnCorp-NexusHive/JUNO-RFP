import React from "react";
import { searchNsfAwards } from "../../../services/api.js";
import GrantSourceSearchPanel from "./GrantSourceSearchPanel.jsx";

export default function NsfAwardsPanel() {
  return (
    <GrantSourceSearchPanel
      ns="proposalManagerNsf"
      shortlistSource="nsf"
      openOnly={false}
      searchFn={searchNsfAwards}
      buildParams={({ keyword, page }) => ({
        keyword,
        page,
        rows: 25,
      })}
    />
  );
}

import React from "react";
import { searchCaGrants } from "../../../services/api.js";
import GrantSourceSearchPanel from "./GrantSourceSearchPanel.jsx";

export default function CaGrantsPanel() {
  return (
    <GrantSourceSearchPanel
      ns="proposalManagerCaGrants"
      shortlistSource="ca"
      searchFn={searchCaGrants}
      initialExtra={{ status: "active" }}
      extraFilters={[
        {
          key: "status",
          labelKey: "status",
          type: "select",
          className: "w-full lg:w-44",
          options: [
            { value: "", labelKey: "statusAll" },
            { value: "active", labelKey: "statusActive" },
            { value: "closed", labelKey: "statusClosed" },
          ],
        },
      ]}
      buildParams={({ keyword, page, extra }) => ({
        keyword,
        page,
        rows: 25,
        status: extra.status || "",
      })}
    />
  );
}

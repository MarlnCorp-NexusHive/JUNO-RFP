import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getLinkedIssuer,
  setLinkedIssuer as persistIssuer,
  clearLinkedIssuer as clearPersisted,
  buildSnapshotFromIntelligenceResult,
} from "../services/proposalIssuerStorage";

const ProposalIssuerContext = createContext(null);

export function ProposalIssuerProvider({ children }) {
  const [issuer, setIssuer] = useState(() => getLinkedIssuer());

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "proposal_manager_linked_issuer") setIssuer(getLinkedIssuer());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const linkFromIntelligence = useCallback((result) => {
    const snap = buildSnapshotFromIntelligenceResult(result);
    if (!snap) return false;
    persistIssuer(snap);
    setIssuer(snap);
    return true;
  }, []);

  const clearLink = useCallback(() => {
    clearPersisted();
    setIssuer(null);
  }, []);

  const value = useMemo(
    () => ({
      issuer,
      linkFromIntelligence,
      clearLink,
      refreshIssuer: () => setIssuer(getLinkedIssuer()),
    }),
    [issuer, linkFromIntelligence, clearLink],
  );

  return <ProposalIssuerContext.Provider value={value}>{children}</ProposalIssuerContext.Provider>;
}

export function useProposalIssuer() {
  const ctx = useContext(ProposalIssuerContext);
  if (!ctx) {
    throw new Error("useProposalIssuer must be used within ProposalIssuerProvider");
  }
  return ctx;
}

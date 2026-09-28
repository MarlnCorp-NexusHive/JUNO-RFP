import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getLinkedIssuer,
  setLinkedIssuer as persistIssuer,
  clearLinkedIssuer as clearPersisted,
  buildSnapshotFromIntelligenceResult,
  LINKED_ISSUER_BASE_KEY,
  DISABLE_ISSUER_TAILORING_BASE_KEY,
  getDisableIssuerTailoring,
  setDisableIssuerTailoring as persistDisableTailoring,
} from "../services/proposalIssuerStorage";
import { isScopedStorageEventKey } from "../../../services/tenantScopedStorage.js";

const ProposalIssuerContext = createContext(null);

export function ProposalIssuerProvider({ children }) {
  const [issuer, setIssuer] = useState(() => getLinkedIssuer());
  const [disableIssuerTailoring, setDisableIssuerTailoringState] = useState(() =>
    getDisableIssuerTailoring(),
  );

  useEffect(() => {
    const onStorage = (e) => {
      if (isScopedStorageEventKey(e.key, LINKED_ISSUER_BASE_KEY)) setIssuer(getLinkedIssuer());
      if (isScopedStorageEventKey(e.key, DISABLE_ISSUER_TAILORING_BASE_KEY)) {
        setDisableIssuerTailoringState(getDisableIssuerTailoring());
      }
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

  const setDisableIssuerTailoring = useCallback((disabled) => {
    const next = Boolean(disabled);
    persistDisableTailoring(next);
    setDisableIssuerTailoringState(next);
  }, []);

  const value = useMemo(
    () => ({
      issuer,
      linkFromIntelligence,
      clearLink,
      refreshIssuer: () => setIssuer(getLinkedIssuer()),
      disableIssuerTailoring,
      setDisableIssuerTailoring,
      /** Issuer name for AI/exports — empty when tailoring is off */
      effectiveIssuerName: disableIssuerTailoring ? "" : issuer?.name || issuer?.displayName || "",
    }),
    [issuer, linkFromIntelligence, clearLink, disableIssuerTailoring, setDisableIssuerTailoring],
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

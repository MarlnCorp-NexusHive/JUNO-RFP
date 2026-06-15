/**
 * Technical Solutioning — reference asset library, indexed patterns, generated designs.
 */

const KEYS = {
  ASSETS: "proposal_manager_tech_solution_assets",
  PATTERNS: "proposal_manager_tech_solution_patterns",
  DESIGNS: "proposal_manager_tech_solution_designs",
  SETTINGS: "proposal_manager_tech_solution_settings",
};

export const REFERENCE_CATEGORIES = [
  { id: "architecture_diagram", labelKey: "architectureDiagram" },
  { id: "system_design", labelKey: "systemDesign" },
  { id: "product_solution", labelKey: "productSolution" },
  { id: "integration_spec", labelKey: "integrationSpec" },
  { id: "security_baseline", labelKey: "securityBaseline" },
  { id: "deployment_runbook", labelKey: "deploymentRunbook" },
];

export const DEMO_REFERENCE_ASSETS = [
  {
    id: "demo_arch_cloud_platform",
    name: "Enterprise Cloud Platform — Reference Architecture v3.2",
    category: "architecture_diagram",
    fileType: "demo",
    text: `REFERENCE ARCHITECTURE — MARLN CLOUD PLATFORM v3.2

Layers:
- Edge: CloudFront CDN, WAF, Route 53
- Presentation: React SPA (multi-tenant), mobile-responsive portals
- API Gateway: Kong / AWS API Gateway — OAuth2, rate limits, request validation
- Microservices: Proposal Service, Document Service, Collaboration Service, Notification Service, AI Orchestrator
- Async: SQS job queues, worker pools for document generation and AI batch jobs
- Data: PostgreSQL (RDS) primary store, Redis ElastiCache for sessions/cache/pub-sub, S3 for document blobs
- Observability: CloudWatch, Datadog APM, centralized structured logging

Integration patterns:
- REST + SSE for real-time collaboration activity streams
- SAML/OIDC SSO with enterprise IdP (Okta, Azure AD)
- Webhook notifications for CRM sync (Salesforce)
- OpenAI API server-side only — no client keys

Security baseline:
- TLS 1.3 everywhere, encryption at rest (AES-256), KMS-managed keys
- RBAC enforced server-side, tenant isolation at database row level
- SOC 2 Type II aligned controls, annual penetration testing
- Immutable audit event log for compliance traceability

Deployment:
- Blue-green deployments on ECS Fargate / Kubernetes
- IaC via Terraform, CI/CD GitHub Actions with automated tests
- RPO 1h, RTO 4h, multi-AZ active-passive failover`,
    isDemo: true,
    uploadedAt: "2025-11-01T10:00:00.000Z",
  },
  {
    id: "demo_product_rfp_module",
    name: "JUNO RFP Module — Product Solution Design",
    category: "product_solution",
    fileType: "demo",
    text: `PRODUCT SOLUTION — JUNO RFP RESPONSE MODULE

Capabilities delivered to proposal teams:
1. RFP Ingest — PDF/DOCX parsing, AI requirement structuring, deadline extraction
2. Response Workspace — Q&A drafting with rich editor, AI-assisted answers grounded in source docs
3. Content Hub — reusable answer library with tagging (Technical, Section L/M, Pricing)
4. Team Collaboration — PM assigns requirements to writers/auditors; review workflow with clarifications
5. Company Intelligence — issuer financial context for tailored executive summaries
6. Export Engine — styled DOCX (OOXML template merge) and PPTX slide decks from approved content
7. Compliance traceability — requirement-to-answer mapping with approval status

Technical differentiators:
- Dual-path AI: server-side OpenAI for RFP-critical generation; governed retrieval from approved content
- 600s timeout pipeline for long-running styled exports
- Full EN/AR i18n with RTL support for global pursuits
- Integration-ready API surface for ERP/CRM embedding

Performance targets:
- Requirement structuring: < 90s for 50-page RFP
- Styled export: < 8 min for 200-section response
- Concurrent users: 50+ per tenant on standard tier`,
    isDemo: true,
    uploadedAt: "2025-11-01T10:00:00.000Z",
  },
  {
    id: "demo_integration_erp",
    name: "ERP Integration Specification — Bidirectional Sync",
    category: "integration_spec",
    fileType: "demo",
    text: `INTEGRATION SPEC — ERP / CRM CONNECTOR

Scope: Sync opportunities, team assignments, and submission artifacts between JUNO RFP and enterprise ERP.

Inbound (ERP → JUNO):
- Opportunity created/updated webhook → auto-create pursuit workspace
- Team roster sync → map ERP roles to JUNO RBAC (Proposal Manager, Auditor, Pricing)
- Calendar deadlines → sync to proposal calendar module

Outbound (JUNO → ERP):
- Submission-ready export uploaded to ERP document store
- Win/loss outcome pushed on opportunity close
- Activity milestones (structured, reviewed, exported) as ERP timeline events

Protocol: HTTPS REST + signed webhooks (HMAC-SHA256)
Auth: OAuth2 client credentials per tenant
Error handling: idempotent webhook delivery with retry (exponential backoff, max 24h)
Data mapping: JSON schema v2 with field-level validation`,
    isDemo: true,
    uploadedAt: "2025-11-01T10:00:00.000Z",
  },
];

function load(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("technicalSolutioningStorage save failed", key, e);
  }
}

export function getReferenceAssets() {
  const existing = load(KEYS.ASSETS, []);
  if (!Array.isArray(existing) || existing.length === 0) {
    save(KEYS.ASSETS, DEMO_REFERENCE_ASSETS);
    return [...DEMO_REFERENCE_ASSETS];
  }
  return existing;
}

export function saveReferenceAssets(assets) {
  save(KEYS.ASSETS, assets);
}

export function addReferenceAsset({ name, category, text, fileType = "txt", fileName = "" }) {
  const assets = getReferenceAssets();
  const id = `tsa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  assets.unshift({
    id,
    name: name || fileName || "Untitled reference",
    category: category || "system_design",
    fileType,
    fileName,
    text: (text || "").slice(0, 50000),
    uploadedAt: new Date().toISOString(),
    isDemo: false,
  });
  saveReferenceAssets(assets);
  return id;
}

export function updateReferenceAsset(id, updates) {
  const assets = getReferenceAssets().map((a) => (a.id === id ? { ...a, ...updates } : a));
  saveReferenceAssets(assets);
}

export function deleteReferenceAsset(id) {
  saveReferenceAssets(getReferenceAssets().filter((a) => a.id !== id));
}

export function getIndexedPatterns() {
  return load(KEYS.PATTERNS, null);
}

export function saveIndexedPatterns(patterns) {
  save(KEYS.PATTERNS, { ...patterns, indexedAt: new Date().toISOString() });
}

export function getSavedDesigns() {
  return load(KEYS.DESIGNS, []);
}

export function saveDesign(design) {
  const list = getSavedDesigns();
  const id = design.id || `design_${Date.now()}`;
  const entry = { ...design, id, savedAt: new Date().toISOString() };
  const next = [entry, ...list.filter((d) => d.id !== id)].slice(0, 15);
  save(KEYS.DESIGNS, next);
  return entry;
}

export function getSettings() {
  return load(KEYS.SETTINGS, {
    autoIndexOnUpload: true,
    selectedWorkspaceDocId: "",
    requirementsSource: "workspace",
  });
}

export function saveSettings(settings) {
  save(KEYS.SETTINGS, { ...getSettings(), ...settings });
}

export function designToContentHubEntries(design) {
  if (!design) return [];
  const tag = "Technical Solution";
  const entries = [];

  if (design.executiveSummary) {
    entries.push({
      question: `${design.solutionTitle || "Technical Solution"} — Executive Summary`,
      answer: design.executiveSummary,
      tags: [tag, "Architecture", "Executive"],
    });
  }

  for (const section of design.solutionSections || []) {
    entries.push({
      question: `${design.solutionTitle || "Technical Solution"} — ${section.title}`,
      answer: section.content,
      tags: [tag, section.title],
    });
  }

  return entries;
}

// RFP document types for upload template selection
export const RFP_DOCUMENT_TYPES = [
  { id: "solicitation", label: "Solicitation / RFP", description: "Main request for proposals" },
  { id: "rfq", label: "RFQ", description: "Request for Quotations" },
  { id: "rfi", label: "RFI", description: "Request for Information" },
  { id: "amendment", label: "Amendment / Addendum", description: "Changes to solicitation" },
  { id: "qa", label: "Q&A / Questions & Answers", description: "Official Q&A or clarifications" },
  { id: "section_l", label: "Section L", description: "Proposal preparation instructions" },
  { id: "section_m", label: "Section M", description: "Evaluation factors and criteria" },
  { id: "pricing", label: "Pricing / Cost volume", description: "Price or cost requirements" },
  { id: "past_performance", label: "Past Performance", description: "Past performance requirements" },
  { id: "other", label: "Other / General", description: "Other RFP-related document" },
];

// Default tags derived from document type (for Content Hub)
export const DOCUMENT_TYPE_TO_TAGS = {
  solicitation: ["Solicitation", "RFP"],
  rfq: ["RFQ", "Pricing"],
  rfi: ["RFI"],
  amendment: ["Amendment", "Update"],
  qa: ["Q&A", "Clarification"],
  section_l: ["Section L", "Format", "Instructions"],
  section_m: ["Section M", "Evaluation", "Criteria"],
  pricing: ["Pricing", "Cost"],
  past_performance: ["Past Performance", "PP"],
  other: ["General"],
};

// Fact keys we try to extract (for display and storage)
export const RFP_FACT_KEYS = [
  "solicitation_number",
  "proposal_due_date",
  "questions_due_date",
  "naics",
  "agency",
  "set_aside",
  "contract_type",
  "page_limits",
  "evaluation_criteria",
  "period_of_performance",
  "scope_summary",
];

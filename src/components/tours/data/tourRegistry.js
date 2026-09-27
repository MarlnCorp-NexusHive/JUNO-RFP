// Tour Registry - Maps which pages have tours available for each role
// This determines whether the star button shows "Start Tour" or "Tour Coming Soon"

import { PROPOSAL_MANAGER_TOUR_PAGES } from "./proposalManagerTourPages.js";

const proposalManagerTours = Object.fromEntries(
  PROPOSAL_MANAGER_TOUR_PAGES.map((page) => [page, true]),
);

export const tourRegistry = {
  // DIRECTOR ROLE - 12 pages
  director: {
    dashboard: true,
    analytics: true,
    departments: true,
    approvals: true,
    "strategic-planning": true,
    communication: true,
    audit: true,
    calendar: true,
    users: true,
    settings: true,
    workspace: true,
    support: true,
  },

  // MARKETING HEAD ROLE
  "marketing-head": {
    dashboard: true,
    analytics: true,
    campaigns: true,
    leads: true,
    resources: true,
    communication: true,
    training: true,
    content: true,
    social: true,
    events: true,
    budget: true,
    team: true,
    settings: true,
    workspace: true,
    support: true,
  },

  // PROPOSAL MANAGER — capture desk pages (grants, CI, scoring, etc.)
  "proposal-manager": proposalManagerTours,

  // ADMISSION HEAD ROLE
  "admission-head": {
    dashboard: true,
    leads: true,
    applications: true,
    schedule: true,
    communication: true,
    payments: true,
    documents: true,
    search: true,
    tools: true,
    workspace: true,
    "lead-transfer": true,
    courses: true,
    training: true,
    compliance: true,
    support: true,
  },
};

export const hasTour = (role, page) => {
  return tourRegistry[role]?.[page] || false;
};

export const getAvailableTours = (role) => {
  return Object.keys(tourRegistry[role] || {}).filter((page) => tourRegistry[role][page]);
};

export const getTourStatus = (role, page) => {
  if (hasTour(role, page)) {
    return {
      available: true,
      text: "Start Tour",
      icon: "⭐",
      action: "start",
    };
  }
  return {
    available: false,
    text: "Tour Coming Soon",
    icon: "🚧",
    action: "coming-soon",
  };
};

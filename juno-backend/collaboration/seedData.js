import { store, generateId } from "./store.js";

/** Mock users — Bearer token = user `id` after login. */
export const SEED_USERS = [
  {
    id: "user_pm_1",
    email: "jordan@juno",
    password: "pm123",
    name: "Jordan Mitchell",
    role: "proposal_manager",
  },
  {
    id: "user_aud_1",
    email: "aiyana@juno",
    password: "aud123",
    name: "Aiyana Yazzie",
    role: "auditor",
  },
  {
    id: "user_aud_2",
    email: "chayton@juno",
    password: "aud123",
    name: "Chayton Bitsui",
    role: "auditor",
  },
  {
    id: "user_aud_3",
    email: "talise@juno",
    password: "aud123",
    name: "Talise Nez",
    role: "auditor",
  },
  {
    id: "user_aud_4",
    email: "kiona@juno",
    password: "aud123",
    name: "Kiona Tsosie",
    role: "auditor",
  },
];

export function seedUsers() {
  if (store.usersById.size > 0) return;
  for (const u of SEED_USERS) {
    store.usersById.set(u.id, { ...u });
    store.usersByEmail.set(u.email.toLowerCase(), u.id);
  }
}

export function seedQuarterlyItems(workspaceId) {
  const items = [
    {
      id: generateId("qr"),
      workspaceId,
      category: "product_roadmap",
      title: "Product roadmap & release alignment",
      status: null,
      lastReviewedAt: null,
      lastReviewedBy: null,
    },
    {
      id: generateId("qr"),
      workspaceId,
      category: "company_info",
      title: "Company information & positioning",
      status: null,
      lastReviewedAt: null,
      lastReviewedBy: null,
    },
    {
      id: generateId("qr"),
      workspaceId,
      category: "technical_capabilities",
      title: "Technical capabilities & solution architecture",
      status: null,
      lastReviewedAt: null,
      lastReviewedBy: null,
    },
  ];
  store.quarterlyByWorkspace.set(workspaceId, items);
  return items;
}

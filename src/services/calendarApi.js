import API from "./api.js";

const C = "/calendar";

export const calendarApi = {
  listEvents: () => API.get(`${C}/events`),
  teamSummary: () => API.get(`${C}/team-summary`),
  createEvent: (body) => API.post(`${C}/events`, body),
  updateEvent: (id, body) => API.put(`${C}/events/${encodeURIComponent(id)}`, body),
  deleteEvent: (id) => API.delete(`${C}/events/${encodeURIComponent(id)}`),
  syncDeadlines: (events) => API.post(`${C}/sync-deadlines`, { events }),
};

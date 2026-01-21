import React, { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import { directorFeatures } from './directorFeatures';

const overlays = ["HR", "Admissions", "Exams", "Finance", "Academic", "Sports", "Board"];
const meetingTypes = [
  { type: "Strategic Review", icon: "📊" },
  { type: "Academic Meetings", icon: "🏫" },
  { type: "Financial Meetings", icon: "💰" },
  { type: "HR/Admin Meetings", icon: "👥" },
  { type: "Public Relations & Outreach", icon: "📢" },
  { type: "Student-Oriented", icon: "🎓" },
  { type: "Research/Innovation", icon: "📚" },
];
const demoMeetings = [
  { title: "Quarterly Vision Planning", type: "Strategic Review", date: "2026-05-10", time: "10:00", host: "Director", category: "Strategic", color: "#6366f1" },
  { title: "Academic Council", type: "Academic Meetings", date: "2026-05-12", time: "14:00", host: "Dean Science", category: "Academic", color: "#22c55e" },
  { title: "Budget Planning", type: "Financial Meetings", date: "2026-05-15", time: "11:00", host: "Finance Admin", category: "Finance", color: "#f59e42" },
  { title: "HR Policy Review", type: "HR/Admin Meetings", date: "2026-05-18", time: "16:00", host: "HR Head", category: "HR", color: "#a21caf" },
];
const rsvpDemo = [
  { name: "Dean Science", status: "Accepted" },
  { name: "HoD EEE", status: "Pending" },
  { name: "Finance Admin", status: "Accepted" },
  { name: "HR Head", status: "Declined" },
];
const actionItems = [
  { task: "Submit department reports", assigned: "Dean Science", due: "2026-05-20", status: "Open" },
  { task: "Update fee structure", assigned: "Finance Admin", due: "2026-05-25", status: "In Progress" },
];
const analytics = [
  { label: "Strategic Meetings", value: 12 },
  { label: "Operational Meetings", value: 18 },
  { label: "Avg. Attendance", value: "87%" },
  { label: "AI Suggestions", value: 3 },
];
const integrations = [
  { name: "AI Decision Assistant", desc: "Auto-suggest reports/documents before meetings" },
  { name: "Zoom/MS Teams", desc: "Seamless link generation and recording archiving" },
  { name: "HRMS/Finance/Academic", desc: "Pull relevant data for pre-meeting prep" },
  { name: "Email/SMS/Push APIs", desc: "Notify attendees" },
];

export default function MeetingsCalendar() {
  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  const [view, setView] = useState("Month");
  const [activeOverlays, setActiveOverlays] = useState(overlays);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  return (
    <div className="flex min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 h-screen z-30">
        <Sidebar features={directorFeatures} userLabel={user?.displayName || user?.role || "Director"} />
      </div>
      <main className="flex-1 p-4 md:p-6 flex flex-col gap-8 overflow-x-auto">
        {/* 1. Calendar Dashboard */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Calendar Dashboard</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            {["Month", "Week", "Day"].map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1 rounded-lg text-xs font-semibold ${view === v ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}>{v} View</button>
            ))}
            <input type="text" placeholder="Search meetings..." className="ml-auto px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs" style={{ minWidth: 180 }} />
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {overlays.map(o => (
              <button key={o} onClick={() => setActiveOverlays(a => a.includes(o) ? a.filter(x => x !== o) : [...a, o])} className={`px-2 py-1 rounded-full text-xs font-semibold border ${activeOverlays.includes(o) ? "bg-blue-100 border-blue-400 text-blue-700" : "bg-gray-100 border-gray-300 text-gray-500"}`}>{o}</button>
            ))}
          </div>
          <div className="flex gap-2 mb-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#6366f1" }} /> <span className="text-xs">Strategic</span>
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#22c55e" }} /> <span className="text-xs">Academic</span>
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#f59e42" }} /> <span className="text-xs">Finance</span>
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#a21caf" }} /> <span className="text-xs">HR</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {demoMeetings.map((m, i) => (
                <div key={i} className="rounded-lg p-3 cursor-pointer border border-gray-200 dark:border-gray-700 hover:shadow-lg transition" style={{ background: m.color + "11" }} onClick={() => { setSelectedMeeting(m); setShowMeetingModal(true); }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: m.color }} />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{m.type}</span>
                  </div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm mb-1">{m.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-300">{m.date} {m.time} • Host: {m.host}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2. Meeting Management Panel */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Meeting Management Panel</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs" onClick={() => setShowMeetingModal(true)}>+ Schedule New Meeting</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoMeetings.map((m, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-1 border-l-4" style={{ borderColor: m.color }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: m.color }} />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{m.type}</span>
                </div>
                <div className="font-bold text-gray-900 dark:text-white text-sm mb-1">{m.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-300">{m.date} {m.time} • Host: {m.host}</div>
                <div className="flex gap-2 mt-2">
                  <button className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Reschedule</button>
                  <button className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Cancel</button>
                  <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200" onClick={() => { setSelectedMeeting(m); setShowMeetingModal(true); }}>Details</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Meeting Types */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Meeting Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {meetingTypes.map((t, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col items-center gap-1">
                <span className="text-2xl mb-1">{t.icon}</span>
                <span className="font-semibold text-xs text-gray-900 dark:text-white mb-1">{t.type}</span>
                <span className="text-xs text-gray-500 dark:text-gray-300">Example: {demoMeetings.find(m => m.type === t.type)?.title || "-"}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Invitations & Smart Reminders */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Invitations & Smart Reminders</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">RSVP Tracking</span>
              <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Time Conflict Alert</span>
              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">AI Time Suggestion</span>
              <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">Recurring Setup</span>
            </div>
            <table className="w-full text-xs mb-2">
              <thead><tr><th>Name</th><th>Status</th></tr></thead>
              <tbody>
                {rsvpDemo.map((r, i) => <tr key={i}><td>{r.name}</td><td>{r.status}</td></tr>)}
              </tbody>
            </table>
            <div className="bg-yellow-50 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200 rounded-lg p-2 text-xs mb-2">⏱️ Time conflict: Director is double-booked on 2026-05-12 14:00</div>
            <div className="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-200 rounded-lg p-2 text-xs mb-2">🧠 AI Suggestion: Best time for all invitees is 2026-05-15 11:00</div>
          </div>
        </section>

        {/* 5. Post-Meeting Follow-Up */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Post-Meeting Follow-Up</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Minutes Generator</h3>
              <textarea className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs mb-2" rows={3} placeholder="Enter notes or use AI to generate MoM..." defaultValue={"AI: All departments to submit reports by 20th May. Budget review next week."} />
              <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Generate AI Summary</button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-2">Action Item Tracker</h3>
              <ul className="text-xs">
                {actionItems.map((a, i) => <li key={i}>{a.task} – {a.assigned} (Due: {a.due}) <span className={a.status === "Open" ? "text-red-600" : "text-yellow-600"}>[{a.status}]</span></li>)}
              </ul>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4">
            <h3 className="font-semibold mb-2">Outcome Dashboard</h3>
            <div className="flex gap-4">
              <div className="flex flex-col items-center"><span className="text-2xl font-bold text-blue-700 dark:text-blue-300">87%</span><span className="text-xs">Follow-up Complete</span></div>
              <div className="flex flex-col items-center"><span className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">2</span><span className="text-xs">Delays</span></div>
              <div className="flex flex-col items-center"><span className="text-2xl font-bold text-red-700 dark:text-red-300">1</span><span className="text-xs">Escalations</span></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mb-4">
            <h3 className="font-semibold mb-2">Audit Trail</h3>
            <ul className="text-xs">
              <li>2026-05-10: Quarterly Vision Planning – Director, Deans</li>
              <li>2026-05-12: Academic Council – Dean Science, HoDs</li>
              <li>2026-05-15: Budget Planning – Finance Admin, Director</li>
            </ul>
          </div>
        </section>

        {/* 6. Integration */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Integration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {integrations.map(card => (
              <div key={card.name} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-1">
                <div className="font-semibold text-xs mb-1">{card.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{card.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Analytics & Insights */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Analytics & Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-2">
              <h3 className="font-semibold mb-2">Meeting Analytics</h3>
              <div className="flex gap-4">
                {analytics.map((a, i) => (
                  <div key={i} className="flex flex-col items-center"><span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{a.value}</span><span className="text-xs">{a.label}</span></div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex flex-col gap-2">
              <h3 className="font-semibold mb-2">AI Suggestions</h3>
              <div className="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-200 rounded-lg p-2 text-xs mb-2">🧠 Director View: Only critical meetings shown.</div>
              <div className="bg-yellow-50 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200 rounded-lg p-2 text-xs mb-2">📌 Priority: Crisis meeting flagged for Board review.</div>
              <div className="bg-green-50 dark:bg-green-900 text-green-900 dark:text-green-200 rounded-lg p-2 text-xs">🤖 AI Summary: 3-hour meeting condensed to 10 lines.</div>
              <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 mt-2">Export Meeting Pack</button>
            </div>
          </div>
        </section>

        {/* Meeting Details Modal (Demo) */}
        {showMeetingModal && selectedMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setShowMeetingModal(false)} />
            <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-lg">
              <button onClick={() => setShowMeetingModal(false)} className="absolute top-2 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl font-bold" aria-label="Close" style={{ zIndex: 20 }}>&times;</button>
              <h2 className="text-lg font-bold mb-2">{selectedMeeting.title}</h2>
              <div className="text-xs text-gray-500 dark:text-gray-300 mb-2">{selectedMeeting.date} {selectedMeeting.time} • Host: {selectedMeeting.host}</div>
              <div className="mb-2"><span className="font-semibold">Type:</span> {selectedMeeting.type}</div>
              <div className="mb-2"><span className="font-semibold">Agenda:</span> <ul className="list-disc ml-6 text-xs"><li>Review last quarter's outcomes</li><li>Set new goals</li><li>Discuss challenges</li></ul></div>
              <div className="mb-2"><span className="font-semibold">Participants:</span> Director, Deans, HoDs, Finance Admin</div>
              <div className="mb-2"><span className="font-semibold">Documents:</span> <a href="#" className="text-blue-600 underline">Agenda.pdf</a>, <a href="#" className="text-blue-600 underline">Report.xlsx</a></div>
              <div className="mb-2"><span className="font-semibold">Director's Notes:</span> <textarea className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs" rows={2} placeholder="Private notes..." /></div>
              <div className="mb-2"><span className="font-semibold">Linked Analytics:</span> <span className="text-xs">Revenue up 12% QoQ</span></div>
              <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 mt-2">Download Meeting Pack</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 
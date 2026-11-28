import React from "react";
import { Link } from "react-router-dom";

const ROWS = [
  { name: "Netlify", purpose: "Frontend hosting / CDN", data: "Account usage metadata, static assets" },
  { name: "Render", purpose: "Application API hosting & persistent disk", data: "Account, workspace, session data" },
  { name: "OpenAI API", purpose: "AI drafting / extraction (no public-model training)", data: "Prompt/document excerpts (PII-redacted where patterns match)" },
  { name: "Resend", purpose: "Transactional email", data: "Email address, name, confirmation/reset links" },
  { name: "Stripe", purpose: "Payments (when enabled)", data: "Billing contact & payment metadata" },
];

export default function SubprocessorsPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0B1017] flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 md:p-12 text-slate-800 dark:text-slate-100">
        <h1 className="text-3xl font-bold text-[#243F5B] dark:text-white mb-2">Subprocessors</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
          JUNO RFP uses the following subprocessors to deliver the service. Each relationship is covered by signed
          contractual / DPA terms appropriate to GDPR, CCPA/CPRA, PDPL, and PIPEDA obligations.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
              <tr>
                <th className="py-2 pr-3">Vendor</th>
                <th className="py-2 px-2">Purpose</th>
                <th className="py-2 pl-2">Data categories</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ROWS.map((r) => (
                <tr key={r.name}>
                  <td className="py-3 pr-3 font-semibold">{r.name}</td>
                  <td className="py-3 px-2">{r.purpose}</td>
                  <td className="py-3 pl-2 text-slate-600 dark:text-slate-300">{r.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Questions: <a href="mailto:privacy@marlncorp.ai" className="underline">privacy@marlncorp.ai</a> ·{" "}
          <Link to="/privacy-policy" className="underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

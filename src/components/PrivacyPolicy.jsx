import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0B1017] flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 md:p-12 text-slate-800 dark:text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-[#243F5B] dark:text-white">
            Privacy Policy
          </h1>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            Version 2026-11 · GDPR · CCPA/CPRA · PDPL · PIPEDA
          </span>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          JUNO RFP (operated by MARLN Corporation) processes personal data in accordance with the EU/UK{" "}
          <strong>GDPR</strong>, California <strong>CCPA/CPRA</strong>, Saudi Arabia <strong>PDPL</strong>, and
          Canada <strong>PIPEDA</strong> (and substantially similar provincial laws, including Quebec Law 25 where
          applicable). This notice describes what we collect, why, how we protect it, and how you can exercise your
          rights. Our processing activities are backed by signed contractual / compliance documentation with our
          customers and subprocessors.
        </p>

        <section className="mb-6 space-y-2">
          <h2 className="text-xl font-semibold text-[#243F5B] dark:text-white">1. Controller / Privacy Contact</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Privacy Officer / inquiries:{" "}
            <a href="mailto:privacy@marlncorp.ai" className="text-[#2F6BA8] dark:text-sky-400 underline">
              privacy@marlncorp.ai
            </a>
            . We respond to access, correction, deletion, and complaint requests without undue delay and within
            applicable statutory timelines (typically within 30 days, subject to permitted extensions).
          </p>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-xl font-semibold text-[#243F5B] dark:text-white">2. Data We Collect</h2>
          <ul className="list-disc pl-6 text-sm text-slate-700 dark:text-slate-300 space-y-1">
            <li><strong>Account:</strong> name, work email, company, role, encrypted password hash (scrypt), consent records (policy version, timestamp, IP/user-agent).</li>
            <li><strong>Workspace content:</strong> RFPs, proposals, calendars, pricing, collaboration messages you upload or create.</li>
            <li><strong>Security telemetry:</strong> session IDs, login/activity timestamps, masked operational metrics (emails masked in monitoring).</li>
            <li><strong>AI processing inputs/outputs:</strong> excerpts sent to our AI provider for drafting/extraction (with PII pattern redaction applied before send).</li>
          </ul>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-xl font-semibold text-[#243F5B] dark:text-white">3. Purposes &amp; Legal Bases</h2>
          <ul className="list-disc pl-6 text-sm text-slate-700 dark:text-slate-300 space-y-1">
            <li><strong>Contract / service delivery:</strong> account auth, workspace features, support.</li>
            <li><strong>Consent:</strong> signup privacy acceptance; optional non-essential cookies if introduced later.</li>
            <li><strong>Legitimate interests / security (where permitted):</strong> fraud prevention, session timeouts, rate limiting, audit logging.</li>
            <li><strong>Legal obligation:</strong> responding to lawful requests and retaining minimal deletion evidence.</li>
          </ul>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-xl font-semibold text-[#243F5B] dark:text-white">4. AI Processing</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Document excerpts may be processed via OpenAI API over HTTPS. Customer content is <strong>not used to train
            public models</strong> under our API/enterprise terms. High-risk patterns (e.g., SSN, card, phone, email)
            are redacted before AI calls. Avoid uploading unnecessary sensitive personal data.
          </p>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-xl font-semibold text-[#243F5B] dark:text-white">5. CCPA/CPRA — Sale / Share</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>We do not sell personal information</strong> and we do not share personal information for
            cross-context behavioral advertising. If that ever changes, we will provide a clear “Do Not Sell or Share”
            control before enabling it.
          </p>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-xl font-semibold text-[#243F5B] dark:text-white">6. Your Rights (GDPR · CCPA · PDPL · PIPEDA)</h2>
          <ul className="list-disc pl-6 text-sm text-slate-700 dark:text-slate-300 space-y-1">
            <li><strong>Access / Know / Portability:</strong> Settings → Privacy &amp; Data → Download My Data (JSON).</li>
            <li><strong>Correction / Rectification:</strong> update your profile name in Settings; email{" "}
              <a href="mailto:privacy@marlncorp.ai" className="underline">privacy@marlncorp.ai</a> for other corrections.</li>
            <li><strong>Deletion / Erasure:</strong> Settings → Delete My Account &amp; Data (purges eligible account/tenant data).</li>
            <li><strong>Withdraw consent / complaint:</strong> contact the Privacy Officer; you may also complain to your supervisory authority.</li>
          </ul>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-xl font-semibold text-[#243F5B] dark:text-white">7. Retention</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Active account data is kept while your account/tenant is active. Expired trial tenants are automatically
            purged after a grace period (default 30 days). Backups and security logs follow documented rotation windows.
          </p>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-xl font-semibold text-[#243F5B] dark:text-white">8. Security</h2>
          <ul className="list-disc pl-6 text-sm text-slate-700 dark:text-slate-300 space-y-1">
            <li>TLS in transit, HSTS, security headers, CORS allowlisting in production.</li>
            <li>Password hashing (scrypt), rate-limited auth, single-tab sessions, 60-minute absolute / 5-minute idle timeouts.</li>
            <li>Tenant isolation, protected metrics endpoints, PII masking in telemetry, privacy audit log for DSAR events.</li>
          </ul>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-xl font-semibold text-[#243F5B] dark:text-white">9. International Transfers &amp; Subprocessors</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Data may be processed by vetted subprocessors (hosting, AI, email, payments). Transfers are covered by
            contractual safeguards in our signed vendor DPAs / SCCs as applicable. See the{" "}
            <Link to="/subprocessors" className="text-[#2F6BA8] dark:text-sky-400 underline">Subprocessors</Link> page.
          </p>
        </section>

        <section className="mb-6 space-y-2">
          <h2 className="text-xl font-semibold text-[#243F5B] dark:text-white">10. Breach Notification</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            We maintain an incident response process. Where legally required (including GDPR’s 72-hour supervisory
            authority notification rule for qualifying breaches), we will notify affected customers and regulators
            without undue delay.
          </p>
        </section>

        <section className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="space-x-3">
            <Link to="/cookie-policy" className="text-[#2F6BA8] dark:text-sky-400 underline">Cookie Policy</Link>
            <Link to="/subprocessors" className="text-[#2F6BA8] dark:text-sky-400 underline">Subprocessors</Link>
            <Link to="/terms" className="text-[#2F6BA8] dark:text-sky-400 underline">Terms</Link>
          </div>
          <Link
            to="/login"
            className="rounded-lg bg-[#243F5B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2E4F70] transition"
          >
            Back to Sign In
          </Link>
        </section>
      </div>
    </div>
  );
}

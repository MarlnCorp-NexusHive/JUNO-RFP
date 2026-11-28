import React from "react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0B1017] flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 md:p-12 text-slate-800 dark:text-slate-100">
        <h1 className="text-3xl font-bold text-[#243F5B] dark:text-white mb-4">Terms of Service</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          By creating an account or using JUNO RFP, you agree to these Terms and our{" "}
          <Link to="/privacy-policy" className="text-[#2F6BA8] underline">Privacy Policy</Link>. Enterprise customers
          may also be covered by a separately executed Master Service Agreement and Data Processing Agreement (DPA).
        </p>
        <ul className="list-disc pl-6 text-sm text-slate-700 dark:text-slate-300 space-y-2 mb-6">
          <li>You must provide accurate account information and keep credentials confidential.</li>
          <li>You are responsible for content you upload (including ensuring you have rights to process it).</li>
          <li>Do not upload unlawful content or unnecessary sensitive personal data into AI features.</li>
          <li>We provide the service “as available”; AI outputs require human review before reliance.</li>
          <li>Either party may terminate trial access; paid plans follow the commercial agreement.</li>
        </ul>
        <p className="text-xs text-slate-500">
          Legal: <a href="mailto:privacy@marlncorp.ai" className="underline">privacy@marlncorp.ai</a> ·{" "}
          <Link to="/login" className="underline">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}

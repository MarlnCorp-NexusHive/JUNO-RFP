import React from "react";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-[#F6F7FA] flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[#3B2175] mb-6 flex items-center gap-2">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#B388FF"/><path d="M15.5 11.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-6 2a1 1 0 100-2 1 1 0 000 2zm7 3a1 1 0 100-2 1 1 0 000 2z" fill="#7C3AED"/></svg>
          Cookie Policy
        </h1>
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-[#3B2175] mb-2">Introduction</h2>
          <p className="text-gray-700">This Cookie Policy explains how NexusHive uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are, why we use them, and your rights to control our use of them.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-[#3B2175] mb-2">What Are Cookies?</h2>
          <p className="text-gray-700">Cookies are small data files placed on your device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide reporting information and personalize your experience.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-[#3B2175] mb-2">How We Use Cookies</h2>
          <ul className="list-disc pl-6 text-gray-700">
            <li>To remember your preferences and settings</li>
            <li>To keep you signed in</li>
            <li>To analyze site traffic and usage</li>
            <li>To improve our website and services</li>
            <li>To personalize your experience</li>
          </ul>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-[#3B2175] mb-2">Types of Cookies We Use</h2>
          <ul className="list-disc pl-6 text-gray-700">
            <li><span className="font-semibold">Essential Cookies:</span> Necessary for the website to function and cannot be switched off.</li>
            <li><span className="font-semibold">Performance Cookies:</span> Help us understand how visitors interact with our site.</li>
            <li><span className="font-semibold">Functional Cookies:</span> Enable enhanced functionality and personalization.</li>
            <li><span className="font-semibold">Targeting Cookies:</span> Used to deliver relevant ads and track ad campaign effectiveness.</li>
          </ul>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-[#3B2175] mb-2">Managing Cookies</h2>
          <p className="text-gray-700">You can control and manage cookies in your browser settings. Please note that removing or blocking cookies may impact your experience and some features may not be available.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-[#3B2175] mb-2">Changes to This Policy</h2>
          <p className="text-gray-700">We may update this Cookie Policy from time to time. We encourage you to review this page periodically for the latest information.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-[#3B2175] mb-2">Contact Us</h2>
          <p className="text-gray-700">If you have any questions about our use of cookies, please contact us at <a href="mailto:support@nexushive.com" className="text-[#7C3AED] underline">support@nexushive.com</a>.</p>
        </section>
      </div>
    </div>
  );
} 
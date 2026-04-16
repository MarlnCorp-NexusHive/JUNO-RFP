import React from "react";

export default function WorkspaceDocumentPreview({ model }) {
  const title = model?.title || "RFP Response";
  const sections = Array.isArray(model?.sections) ? model.sections : [];

  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900/30 p-3">
      <div className="mx-auto w-full max-w-[760px] min-h-[18rem] bg-white text-black shadow border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-center mb-6">{title}</h1>
        {sections.length === 0 ? (
          <p className="text-sm text-gray-500">No document sections yet.</p>
        ) : (
          <div className="space-y-6">
            {sections.map((section, idx) => (
              <section key={section.id || idx} className="space-y-2">
                <h2 className="text-lg font-semibold">
                  {idx + 1}. {section.question || "Untitled question"}
                </h2>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: section.answerHtml || "<p></p>" }}
                />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

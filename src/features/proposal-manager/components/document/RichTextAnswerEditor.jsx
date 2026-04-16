import React, { useCallback, useEffect, useRef } from "react";
import { FiBold, FiItalic, FiList, FiType } from "react-icons/fi";

function run(cmd, value = null) {
  try {
    document.execCommand(cmd, false, value);
  } catch {
    // no-op
  }
}

function plainToHtml(value) {
  const safe = String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  if (!safe.trim()) return "<p></p>";
  return `<p>${safe.replace(/\n/g, "<br/>")}</p>`;
}

export default function RichTextAnswerEditor({
  valueHtml,
  onChange,
  placeholder = "Write your answer...",
}) {
  const ref = useRef(null);

  useEffect(() => {
    const next = valueHtml && valueHtml.trim() ? valueHtml : "<p></p>";
    if (ref.current && ref.current.innerHTML !== next) {
      ref.current.innerHTML = next;
    }
  }, [valueHtml]);

  const emit = useCallback(() => {
    const html = ref.current?.innerHTML || "<p></p>";
    onChange?.(html);
  }, [onChange]);

  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-1 bg-gray-50 dark:bg-gray-900/30">
        <button
          type="button"
          onClick={() => {
            run("bold");
            emit();
          }}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Bold"
        >
          <FiBold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            run("italic");
            emit();
          }}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Italic"
        >
          <FiItalic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            run("formatBlock", "<h1>");
            emit();
          }}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Heading 1"
        >
          <FiType className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            run("formatBlock", "<h2>");
            emit();
          }}
          className="px-2 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => {
            run("insertUnorderedList");
            emit();
          }}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Bulleted list"
        >
          <FiList className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            run("insertOrderedList");
            emit();
          }}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Numbered list"
        >
          <span className="text-xs font-semibold">1.</span>
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        className="min-h-[14rem] max-h-[38vh] overflow-y-auto px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none prose prose-sm dark:prose-invert max-w-none"
        data-placeholder={placeholder}
      />
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

export function toPlainTextFromHtml(html) {
  const raw = String(html || "");
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function toHtmlFromPlain(value) {
  return plainToHtml(value);
}

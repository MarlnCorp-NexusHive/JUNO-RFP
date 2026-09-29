import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiMessageCircle,
  FiPlus,
  FiSend,
  FiInbox,
  FiZap,
  FiUsers,
  FiTarget,
  FiExternalLink,
  FiTrash2,
  FiStar,
} from "react-icons/fi";
import {
  getCommunicationData,
  subscribeCommunication,
  hydrateCommunicationFromServer,
  listChannels,
  listMessages,
  createChannel,
  postMessage,
  markChannelRead,
  getUnreadCount,
  openOrCreateKickoffChannel,
  deleteChannel,
} from "../services/communicationStore.js";
import { listShortlist, hydrateShortlistFromServer, subscribeShortlist } from "../services/shortlistStore.js";
import { listMembers, hydrateTeamFromServer } from "../services/teamStore.js";
import {
  draftCommunicationKickoff,
  summarizeCommunicationThread,
  coachCommunicationReply,
} from "../../../services/api.js";
import { formatDateTime24, formatTime24 } from "../../../utils/dateTime.js";

const TYPE_LABEL = {
  opportunity: { en: "Opportunity", ar: "فرصة" },
  team: { en: "Team", ar: "فريق" },
  external: { en: "External", ar: "خارجي" },
};

function typeBadgeClass(type) {
  if (type === "opportunity") return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200";
  if (type === "external") return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200";
  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
}

function formatMsgTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  return sameDay ? formatTime24(d) : formatDateTime24(d, { month: "short", day: "numeric" });
}

export default function TrialCommunicationHub({ isArabic = false }) {
  const label = (en, ar) => (isArabic ? ar : en);
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(() => getCommunicationData());
  const [shortlist, setShortlist] = useState(() => listShortlist());
  const [members, setMembers] = useState(() => listMembers());
  const [selectedId, setSelectedId] = useState(null);
  const [composer, setComposer] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", type: "team" });
  const [aiBusy, setAiBusy] = useState("");
  const [aiError, setAiError] = useState("");
  const [summary, setSummary] = useState(null);
  const [replyIdeas, setReplyIdeas] = useState(null);
  const [replyTone, setReplyTone] = useState("clarifying");
  const [selectedMsgId, setSelectedMsgId] = useState(null);
  const messagesEndRef = useRef(null);
  const deepLinkHandled = useRef("");

  useEffect(() => {
    setData(getCommunicationData());
    const unsub = subscribeCommunication(setData);
    void hydrateCommunicationFromServer().then(setData);
    return unsub;
  }, []);

  useEffect(() => {
    setShortlist(listShortlist());
    const unsub = subscribeShortlist(setShortlist);
    void hydrateShortlistFromServer().then(setShortlist);
    return unsub;
  }, []);

  useEffect(() => {
    setMembers(listMembers());
    void hydrateTeamFromServer().then(() => setMembers(listMembers()));
  }, []);

  const channels = useMemo(() => listChannels(), [data]);
  const selected = channels.find((c) => c.id === selectedId) || null;
  const messages = useMemo(
    () => (selectedId ? listMessages(selectedId) : []),
    [data, selectedId],
  );

  // Deep link: ?channel= or ?shortlistId=
  useEffect(() => {
    const channelParam = searchParams.get("channel");
    const shortlistParam = searchParams.get("shortlistId");
    const key = `${channelParam || ""}|${shortlistParam || ""}`;
    if (!key || key === "|" || deepLinkHandled.current === key) return;

    if (channelParam && channels.some((c) => c.id === channelParam)) {
      deepLinkHandled.current = key;
      setSelectedId(channelParam);
      return;
    }
    if (shortlistParam) {
      const item = shortlist.find((s) => s.id === shortlistParam);
      if (!item && shortlist.length === 0) return; // wait for hydrate
      deepLinkHandled.current = key;
      if (item) {
        const result = openOrCreateKickoffChannel(item);
        if (result?.channel) {
          setData(getCommunicationData());
          setSelectedId(result.channel.id);
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete("shortlistId");
              next.set("channel", result.channel.id);
              return next;
            },
            { replace: true },
          );
        }
      }
    }
  }, [searchParams, channels, shortlist, setSearchParams]);

  useEffect(() => {
    if (!selectedId) return;
    markChannelRead(selectedId);
    setSummary(null);
    setReplyIdeas(null);
    setSelectedMsgId(null);
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedId]);

  const mentionHints = members
    .map((m) => m.email || m.name)
    .filter(Boolean)
    .slice(0, 8);

  const handleCreate = (e) => {
    e.preventDefault();
    const name = createForm.name.trim();
    if (!name) return;
    const ch = createChannel({ name, type: createForm.type });
    setData(getCommunicationData());
    setSelectedId(ch.id);
    setCreateForm({ name: "", type: "team" });
    setShowCreate(false);
  };

  const handleSend = (e) => {
    e?.preventDefault?.();
    const body = composer.trim();
    if (!selectedId || !body) return;
    postMessage(selectedId, { body });
    setData(getCommunicationData());
    setComposer("");
  };

  const startKickoff = (item) => {
    const result = openOrCreateKickoffChannel(item);
    if (!result?.channel) return;
    setData(getCommunicationData());
    setSelectedId(result.channel.id);
  };

  const runDraftKickoff = async () => {
    if (!selected) return;
    setAiBusy("kickoff");
    setAiError("");
    try {
      const result = await draftCommunicationKickoff({
        channelName: selected.name,
        opportunity: {
          title: selected.opportunityTitle || selected.name,
          number: selected.opportunityNumber,
          agency: selected.opportunityAgency,
          deadline: selected.opportunityDeadline,
        },
        members: members.map((m) => m.name).filter(Boolean),
      });
      if (result?.body) setComposer(result.body);
    } catch (err) {
      setAiError(err?.response?.data?.error || err?.message || label("AI draft failed", "فشل المسودة"));
    } finally {
      setAiBusy("");
    }
  };

  const runSummarize = async () => {
    if (!selectedId || !messages.length) return;
    setAiBusy("summarize");
    setAiError("");
    setSummary(null);
    try {
      const result = await summarizeCommunicationThread({
        channelName: selected?.name,
        messages: messages.map((m) => ({
          authorName: m.authorName,
          body: m.body,
          createdAt: m.createdAt,
        })),
      });
      setSummary(result);
    } catch (err) {
      setAiError(err?.response?.data?.error || err?.message || label("Summary failed", "فشل التلخيص"));
    } finally {
      setAiBusy("");
    }
  };

  const runReplyCoach = async () => {
    const msg = messages.find((m) => m.id === selectedMsgId) || messages[messages.length - 1];
    if (!msg) return;
    setAiBusy("reply");
    setAiError("");
    setReplyIdeas(null);
    try {
      const result = await coachCommunicationReply({
        message: msg.body,
        tone: replyTone,
        context: selected?.name,
      });
      setReplyIdeas(result);
    } catch (err) {
      setAiError(err?.response?.data?.error || err?.message || label("Reply coach failed", "فشل اقتراح الرد"));
    } finally {
      setAiBusy("");
    }
  };

  const handleDeleteChannel = () => {
    if (!selectedId) return;
    if (!window.confirm(label("Delete this channel and its messages?", "حذف هذه القناة ورسائلها؟"))) return;
    deleteChannel(selectedId);
    setData(getCommunicationData());
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {label("Proposal Communication", "اتصال العروض")}
            <FiMessageCircle className="text-blue-500" />
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {label(
              "Kickoffs, reviews, and team messaging — shared across your company trial.",
              "اجتماعات الانطلاق والمراجعات ورسائل الفريق — مشتركة عبر تجربة شركتك.",
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
        >
          <FiPlus />
          {label("New channel", "قناة جديدة")}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end"
        >
          <label className="flex-1 text-xs font-medium text-gray-600 dark:text-gray-300">
            {label("Channel name", "اسم القناة")}
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              placeholder={label("e.g. Color Team Reviews", "مثال: مراجعات فريق الألوان")}
              autoFocus
            />
          </label>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {label("Type", "النوع")}
            <select
              value={createForm.type}
              onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
            >
              <option value="team">{label("Team", "فريق")}</option>
              <option value="opportunity">{label("Opportunity", "فرصة")}</option>
              <option value="external">{label("External", "خارجي")}</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
          >
            {label("Create", "إنشاء")}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[28rem]">
        {/* Channel list */}
        <aside className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-100">
            {label("Channels", "القنوات")}
          </div>
          <div className="flex-1 overflow-y-auto max-h-[32rem]">
            {channels.length === 0 ? (
              <div className="p-6 text-center">
                <FiInbox className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {label(
                    "No channels yet. Start a kickoff from shortlist or create a team channel.",
                    "لا توجد قنوات بعد. ابدأ انطلاقاً من القائمة المختصرة أو أنشئ قناة فريق.",
                  )}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {channels.map((ch) => {
                  const unread = getUnreadCount(ch.id, data);
                  const active = ch.id === selectedId;
                  return (
                    <li key={ch.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(ch.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                          active ? "bg-blue-50 dark:bg-blue-950/30" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {ch.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {ch.lastMessagePreview || label("No messages yet", "لا رسائل بعد")}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeBadgeClass(ch.type)}`}>
                              {label(TYPE_LABEL[ch.type]?.en || ch.type, TYPE_LABEL[ch.type]?.ar || ch.type)}
                            </span>
                            {unread > 0 && (
                              <span className="text-[10px] font-bold bg-blue-600 text-white rounded-full min-w-[1.25rem] text-center px-1">
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {shortlist.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 p-3">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
                <FiStar className="text-amber-500" />
                {label("Start kickoff from shortlist", "ابدأ انطلاقاً من القائمة المختصرة")}
              </div>
              <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                {shortlist.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => startKickoff(item)}
                      className="w-full text-left text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 truncate"
                      title={item.title}
                    >
                      {item.title || item.number || item.id}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Thread */}
        <section className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col min-h-[28rem]">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <FiUsers className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {label("Select a channel or start a kickoff thread.", "اختر قناة أو ابدأ محادثة انطلاق.")}
              </p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                    {selected.type === "opportunity" ? <FiTarget className="text-blue-500 shrink-0" /> : null}
                    {selected.name}
                  </h2>
                  {selected.opportunityDeadline && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {label("Deadline", "الموعد النهائي")}: {selected.opportunityDeadline}
                      {selected.opportunityAgency ? ` · ${selected.opportunityAgency}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!!aiBusy}
                    onClick={runDraftKickoff}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100 disabled:opacity-50"
                  >
                    <FiZap />
                    {aiBusy === "kickoff"
                      ? label("Drafting…", "جاري الصياغة…")
                      : label("AI kickoff draft", "مسودة انطلاق AI")}
                  </button>
                  <button
                    type="button"
                    disabled={!!aiBusy || messages.length === 0}
                    onClick={runSummarize}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-100 disabled:opacity-50"
                  >
                    {aiBusy === "summarize"
                      ? label("Summarizing…", "جاري التلخيص…")
                      : label("Summarize", "تلخيص")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteChannel}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300"
                    title={label("Delete channel", "حذف القناة")}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              {aiError && (
                <div className="mx-4 mt-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-lg px-3 py-2">
                  {aiError}
                </div>
              )}

              {summary && (
                <div className="mx-4 mt-3 text-xs bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-3 space-y-1">
                  <div className="font-semibold text-blue-900 dark:text-blue-100">
                    {label("Thread summary", "ملخص المحادثة")}
                  </div>
                  <p className="text-gray-700 dark:text-gray-200">{summary.summary}</p>
                  {summary.decisions?.length > 0 && (
                    <div>
                      <span className="font-medium">{label("Decisions", "القرارات")}:</span>{" "}
                      {summary.decisions.join(" · ")}
                    </div>
                  )}
                  {summary.openQuestions?.length > 0 && (
                    <div>
                      <span className="font-medium">{label("Open", "مفتوح")}:</span>{" "}
                      {summary.openQuestions.join(" · ")}
                    </div>
                  )}
                  {summary.owners?.length > 0 && (
                    <div>
                      <span className="font-medium">{label("Owners", "المسؤولون")}:</span>{" "}
                      {summary.owners.join(" · ")}
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[22rem]">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    {label(
                      "No messages yet. Use AI kickoff draft or type below.",
                      "لا رسائل بعد. استخدم مسودة الانطلاق أو اكتب أدناه.",
                    )}
                  </p>
                ) : (
                  messages.map((m) => {
                    const selectedMsg = m.id === selectedMsgId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMsgId(m.id)}
                        className={`w-full text-left rounded-lg px-3 py-2 border transition ${
                          selectedMsg
                            ? "border-blue-400 bg-blue-50/80 dark:bg-blue-950/40"
                            : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/40"
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {m.authorName}
                          </span>
                          <span className="text-[10px] text-gray-400">{formatMsgTime(m.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{m.body}</p>
                      </button>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {replyIdeas?.replies?.length > 0 && (
                <div className="mx-4 mb-2 space-y-2">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {label("Reply suggestions", "اقتراحات الرد")} ({replyIdeas.tone})
                  </div>
                  {replyIdeas.replies.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setComposer(r.body)}
                      className="w-full text-left text-xs rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 hover:border-blue-400"
                    >
                      <span className="font-semibold">{r.label}</span>
                      <p className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{r.body}</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 dark:border-gray-700 p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={replyTone}
                    onChange={(e) => setReplyTone(e.target.value)}
                    className="text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1"
                  >
                    <option value="clarifying">{label("Clarifying", "توضيحي")}</option>
                    <option value="formal">{label("Formal", "رسمي")}</option>
                    <option value="firm">{label("Firm", "حازم")}</option>
                  </select>
                  <button
                    type="button"
                    disabled={!!aiBusy || messages.length === 0}
                    onClick={runReplyCoach}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-600 dark:bg-violet-950/40 dark:text-violet-100 disabled:opacity-50"
                  >
                    <FiExternalLink />
                    {aiBusy === "reply"
                      ? label("Coaching…", "جاري الاقتراح…")
                      : label("Reply coach", "مدرب الرد")}
                  </button>
                  {mentionHints.length > 0 && (
                    <span className="text-[10px] text-gray-400 truncate max-w-[14rem]">
                      @ {mentionHints.slice(0, 3).join(", ")}
                    </span>
                  )}
                </div>
                <form onSubmit={handleSend} className="flex gap-2">
                  <textarea
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    rows={2}
                    placeholder={label("Write a message… Use @email to mention", "اكتب رسالة… استخدم @البريد للإشارة")}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm resize-y min-h-[2.75rem]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!composer.trim()}
                    className="self-end inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2"
                  >
                    <FiSend />
                    {label("Send", "إرسال")}
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

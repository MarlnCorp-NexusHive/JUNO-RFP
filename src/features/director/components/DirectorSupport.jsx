import React from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FiHelpCircle,
  FiMessageCircle,
  FiMail,
  FiPhone,
  FiMessageSquare,
  FiBookOpen,
  FiShield,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiDownload,
  FiExternalLink,
  FiUser,
  FiSettings,
  FiHeadphones,
} from "react-icons/fi";

export default function DirectorSupport() {
  const location = useLocation();
  const isPM = location.pathname.includes("/app/help-support");
  const [activeFaq, setActiveFaq] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const { t, ready, i18n } = useTranslation("director");
  const isArabic = String(i18n?.resolvedLanguage || i18n?.language || "")
    .toLowerCase()
    .startsWith("ar");
  const pmText = (value) => {
    if (!isPM || !isArabic) return value;
    const map = {
      "Loading...": "جارٍ التحميل...",
      "Proposal & RFP Support": "دعم العروض وطلبات تقديم العروض",
      "FAQs, how-tos, and contacts for proposal and RFP processes.":
        "الأسئلة الشائعة، الأدلة العملية، ووسائل التواصل الخاصة بعمليات العروض وطلبات تقديم العروض.",
      Response: "الاستجابة",
      "2-4 hours": "2-4 ساعات",
      Immediate: "فوري",
      "Coming Soon": "قريباً",
      "Real-time": "بالوقت الفعلي",
    };
    return map[value] || value;
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {pmText("Loading...")}
            </h1>
          </div>
        </main>
      </div>
    );
  }

  const supportChannels = [
    {
      type: "email",
      icon: FiMail,
      titleKey: "contact.email",
      value: "contact@marlncorp.com",
      responseTime: "2-4 hours",
      color: "blue",
      ctaEn: "Send email",
      ctaAr: "إرسال بريد",
    },
    {
      type: "phone",
      icon: FiPhone,
      titleKey: "contact.phone",
      value: "+1 (408) 888-9109",
      href: "tel:+14088889109",
      responseTime: "Immediate",
      color: "green",
      ctaEn: "Call now",
      ctaAr: "اتصل الآن",
    },
    {
      type: "liveChat",
      icon: FiMessageSquare,
      titleKey: "contact.liveChat",
      value: "Coming Soon",
      responseTime: "Real-time",
      color: "slate",
      disabled: true,
      blurbEn: "In-app chat is on the way. Use email or phone until then.",
      blurbAr: "الدردشة داخل التطبيق قادمة قريباً. استخدم البريد أو الهاتف حالياً.",
      ctaEn: "Unavailable",
      ctaAr: "غير متاح",
    },
  ];

  const getCategoryColor = (color) => {
    switch (color) {
      case "blue":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400";
      case "green":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400";
      case "purple":
        return "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400";
      case "orange":
        return "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400";
      case "slate":
        return "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  // Proposal Manager: Contact Support only — polished layout
  if (isPM) {
    return (
      <div className="w-full">
        <main className="mx-auto w-full max-w-4xl space-y-8">
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-sky-50 px-6 py-8 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:px-8"
            data-tour="4"
            data-tour-title-en="Contact Support"
            data-tour-title-ar="الاتصال بالدعم"
            data-tour-content-en="Reach support via email, phone, or live chat (coming soon)."
            data-tour-content-ar="تواصل مع الدعم عبر البريد الإلكتروني أو الهاتف أو الدردشة المباشرة (قريباً)."
            data-tour-position="bottom"
          >
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-sky-200/40 blur-2xl dark:bg-sky-500/10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-emerald-200/30 blur-2xl dark:bg-emerald-500/10"
              aria-hidden
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                  {isArabic ? "المساعدة والدعم" : "Help & support"}
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {t("support.contactSupport")}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                  {isArabic
                    ? "تواصل مع فريق JUNO لأسئلة التجربة أو العروض أو الحساب. اختر القناة الأنسب أدناه."
                    : "Reach the JUNO team for trial, proposal, or account questions. Pick the channel that fits below."}
                </p>
              </div>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/25 dark:bg-sky-500">
                <FiHeadphones className="h-8 w-8" aria-hidden />
              </div>
            </div>
          </motion.header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {supportChannels
              .filter((c) => !c.disabled)
              .map((channel, i) => {
                const href =
                  channel.href ||
                  (channel.type === "email"
                    ? `mailto:${channel.value}`
                    : channel.type === "phone"
                      ? `tel:${channel.value}`
                      : "#");
                return (
                  <motion.article
                    key={channel.type}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.08 + i * 0.08 }}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getCategoryColor(channel.color)}`}
                      >
                        <channel.icon className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {t(`support.${channel.titleKey}`)}
                        </h2>
                      </div>
                    </div>
                    {(channel.blurbEn || channel.blurbAr) && (
                      <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {isArabic ? channel.blurbAr : channel.blurbEn}
                      </p>
                    )}
                    <a
                      href={href}
                      className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                    >
                      {channel.value}
                    </a>
                    <a
                      href={href}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
                    >
                      {isArabic ? channel.ctaAr : channel.ctaEn}
                    </a>
                  </motion.article>
                );
              })}
          </div>

          {supportChannels
            .filter((c) => c.disabled)
            .map((channel) => (
              <motion.aside
                key={channel.type}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.28 }}
                className="flex flex-col gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-5 dark:border-slate-600 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getCategoryColor(channel.color)}`}
                  >
                    <channel.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                        {t(`support.${channel.titleKey}`)}
                      </h2>
                      <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {pmText("Coming Soon")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {isArabic ? channel.blurbAr : channel.blurbEn}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-medium text-slate-400 dark:text-slate-500">
                  {isArabic ? channel.ctaAr : channel.ctaEn}
                </span>
              </motion.aside>
            ))}
        </main>
      </div>
    );
  }

  const contactSupportCard = (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
      data-tour="4"
      data-tour-title-en="Contact Support"
      data-tour-title-ar="الاتصال بالدعم"
      data-tour-content-en="Reach support via email, phone, or live chat (coming soon)."
      data-tour-content-ar="تواصل مع الدعم عبر البريد الإلكتروني أو الهاتف أو الدردشة المباشرة (قريباً)."
      data-tour-position="bottom"
    >
      <div className="flex items-center gap-3 mb-6">
        <FiHeadphones className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("support.contactSupport")}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {supportChannels.map((channel, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow ${
              channel.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${getCategoryColor(channel.color)}`}>
                <channel.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t(`support.${channel.titleKey}`)}
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {pmText("Response")}: {pmText(channel.responseTime)}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {channel.disabled ? (
                <span className="text-gray-500 dark:text-gray-400">{channel.value}</span>
              ) : (
                <a
                  href={
                    channel.href ||
                    (channel.type === "email"
                      ? `mailto:${channel.value}`
                      : channel.type === "phone"
                        ? `tel:${channel.value}`
                        : "#")
                  }
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                >
                  {channel.value}
                </a>
              )}
            </div>
            {!channel.disabled && (
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm">
                {t("support.contactNow")}
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );

  const faqs = [
    {
      questionKey: "faqItems.passwordReset.question",
      answerKey: "faqItems.passwordReset.answer",
      category: "account",
      priority: "high",
      icon: FiUser,
    },
    {
      questionKey: "faqItems.itSupport.question",
      answerKey: "faqItems.itSupport.answer",
      category: "technical",
      priority: "medium",
      icon: FiSettings,
    },
    {
      questionKey: "faqItems.complianceReports.question",
      answerKey: "faqItems.complianceReports.answer",
      category: "compliance",
      priority: "high",
      icon: FiShield,
    },
    {
      questionKey: "faqItems.dataExport.question",
      answerKey: "faqItems.dataExport.answer",
      category: "data",
      priority: "medium",
      icon: FiDownload,
    },
    {
      questionKey: "faqItems.userPermissions.question",
      answerKey: "faqItems.userPermissions.answer",
      category: "account",
      priority: "low",
      icon: FiUser,
    },
  ];

  const helpTopics = [
    {
      titleKey: "topics.userManagement.title",
      descKey: "topics.userManagement.description",
      icon: FiUser,
      color: "blue",
      articles: 12,
    },
    {
      titleKey: "topics.dataSecurity.title",
      descKey: "topics.dataSecurity.description",
      icon: FiShield,
      color: "green",
      articles: 8,
    },
    {
      titleKey: "topics.compliance.title",
      descKey: "topics.compliance.description",
      icon: FiCheckCircle,
      color: "purple",
      articles: 15,
    },
    {
      titleKey: "topics.systemSettings.title",
      descKey: "topics.systemSettings.description",
      icon: FiSettings,
      color: "orange",
      articles: 6,
    },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
      case "medium":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low":
        return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      searchQuery === "" ||
      t(`support.${faq.questionKey}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
      t(`support.${faq.answerKey}`).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full">
      <main className="w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          data-tour="1"
          data-tour-title-en="Help & Support Overview"
          data-tour-title-ar="نظرة عامة على المساعدة والدعم"
          data-tour-content-en="Browse help topics, check FAQs, and find contact details."
          data-tour-content-ar="تصفح مواضيع المساعدة، واطلع على الأسئلة الشائعة، واعثر على تفاصيل الاتصال."
          data-tour-position="bottom"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FiHelpCircle className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                {t("support.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{t("support.subtitle")}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Help Articles</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">41</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">FAQs</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">5</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t("support.searchPlaceholder")}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">{t("support.allCategories")}</option>
              <option value="account">{t("support.categories.account")}</option>
              <option value="technical">{t("support.categories.technical")}</option>
              <option value="compliance">{t("support.categories.compliance")}</option>
              <option value="data">{t("support.categories.data")}</option>
            </select>
            <button className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
              <FiDownload className="w-4 h-4" />
              {t("support.downloadGuide")}
            </button>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          data-tour="2"
          data-tour-title-en="Help Topics"
          data-tour-title-ar="مواضيع المساعدة"
          data-tour-content-en="Quick guides on user management, data security, and compliance."
          data-tour-content-ar="أدلة سريعة حول إدارة المستخدمين، أمن البيانات، والامتثال."
          data-tour-position="bottom"
        >
          <div className="flex items-center gap-3 mb-6">
            <FiBookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("support.helpTopics")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {helpTopics.map((topic, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl ${getCategoryColor(topic.color)}`}>
                    <topic.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t(`support.${topic.titleKey}`)}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {topic.articles} articles
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {t(`support.${topic.descKey}`)}
                </p>
                <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1">
                  {t("support.viewArticles")}
                  <FiExternalLink className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          data-tour="3"
          data-tour-title-en="FAQs"
          data-tour-title-ar="الأسئلة الشائعة"
          data-tour-content-en="Toggle common questions to find quick answers."
          data-tour-content-ar="قم بفتح الأسئلة الشائعة للحصول على إجابات سريعة."
          data-tour-position="bottom"
        >
          <div className="flex items-center gap-3 mb-6">
            <FiMessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("support.faqs")} ({filteredFaqs.length})
            </h2>
          </div>

          <div className="space-y-4">
            {filteredFaqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full text-left p-6 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${getCategoryColor("blue")}`}>
                        <faq.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-left">
                          {t(`support.${faq.questionKey}`)}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(faq.priority)}`}
                          >
                            {t(`support.priorities.${faq.priority}`, {
                              defaultValue: faq.priority,
                            })}{" "}
                            priority
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {faq.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {activeFaq === i ? (
                        <FiChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <FiChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>
                {activeFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pb-6"
                  >
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {t(`support.${faq.answerKey}`)}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {contactSupportCard}
      </main>
    </div>
  );
}

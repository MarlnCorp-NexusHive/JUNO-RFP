/**
 * Full Proposal Manager guided-tour definitions (EN + AR).
 * Prefer [data-tour] targets so autoScan + static steps stay aligned.
 */
function step(id, target, titleEn, titleAr, contentEn, contentAr, position = "bottom") {
  return {
    id,
    target,
    title: { en: titleEn, ar: titleAr },
    content: { en: contentEn, ar: contentAr },
    position,
  };
}

export const proposalManagerTourDefinitions = {
  dashboard: {
    autoScan: true,
    title: { en: "Proposal Manager Dashboard", ar: "لوحة مدير العروض" },
    description: {
      en: "Pipeline KPIs, alerts, win-rate charts, and AI forecasts for your capture desk.",
      ar: "مؤشرات خط الأنابيب والتنبيهات ومخططات معدل الفوز وتوقعات الذكاء الاصطناعي لمكتب الاستحواذ.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Dashboard header", "رأس اللوحة", "Page title and context for your JUNO RFP capture desk.", "عنوان الصفحة وسياق مكتب الاستحواذ في JUNO RFP."),
      step(2, '[data-tour="2"]', "Portfolio KPIs", "مؤشرات المحفظة", "Active pipeline, deal size, win rate, and related capture KPIs. Click a card for details.", "خط الأنابيب النشط وحجم الصفقة ومعدل الفوز ومؤشرات الاستحواذ. اضغط على بطاقة للتفاصيل."),
      step(3, '[data-tour="3"]', "Deeper KPI grid", "شبكة مؤشرات أعمق", "Additional metrics with interactive cards—expand any tile for more context.", "مقاييس إضافية ببطاقات تفاعلية—وسّع أي بلاطة لمزيد من السياق."),
      step(4, '[data-tour="3.5"]', "Alerts & notifications", "التنبيهات والإشعارات", "Deadlines, compliance flags, assignments, and messages appear here as work arrives.", "تظهر هنا المواعيد وتنبيهات الامتثال والتعيينات والرسائل عند وصول العمل."),
      step(5, '[data-tour="4"]', "Win-rate charts", "مخططات معدل الفوز", "Charts fill as you upload Source Docs and capture opportunities in Bid Vault.", "تُملأ المخططات عند رفع مستندات المصدر والتقاط الفرص في خزينة العروض."),
      step(6, '[data-tour="7"]', "Risk & compliance", "المخاطر والامتثال", "Elimination risk, FAR conformance, and compliance coverage for active pursuits.", "مخاطر الاستبعاد وتوافق FAR وتغطية الامتثال للمتابعات النشطة."),
      step(7, '[data-tour="8"]', "Pipeline intelligence", "ذكاء خط الأنابيب", "Stage mix and win-rate trend across your proposal pipeline.", "مزيج المراحل واتجاه معدل الفوز عبر خط أنابيب العروض."),
      step(8, '[data-tour="9"]', "RFP alerts", "تنبيهات طلبات العروض", "Submission deadlines, bid approvals, and team assignments.", "مواعيد التقديم وموافقات العروض وتعيينات الفريق."),
      step(9, '[data-tour="10"]', "AI forecasts", "توقعات الذكاء الاصطناعي", "Predictive insights for capture performance and conversion.", "رؤى تنبؤية لأداء الاستحواذ والتحويل."),
    ],
  },

  grants: {
    autoScan: true,
    title: { en: "Grants & funding", ar: "المنح والتمويل" },
    description: {
      en: "Multi-select US funding sources — Grants.gov, private, local/state, SAM, and award intel — each stacked with its own search.",
      ar: "اختيار متعدد لمصادر التمويل الأمريكية — Grants.gov والخاص والمحلي/الولائي وSAM ومعلومات الجوائز — كل منها بلوحة بحث مستقلة.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Opportunity sources", "مصادر الفرص", "Choose a category, then multi-select one or more US funding sources. Selected sources stack below with their own search.", "اختر فئة ثم حدّد مصدر تمويل أمريكي واحداً أو أكثر. المصادر المحددة تُعرض متتابعة أسفل مع بحث خاص لكل منها."),
      step(2, '[data-tour="2"]', "Live federal grants", "المنح الفيدرالية المباشرة", "Browse open (posted) US federal opportunities from Grants.gov — forecasted listings are excluded.", "تصفح الفرص الفيدرالية المفتوحة (المنشورة) من Grants.gov — الفرص المتوقعة مستبعدة."),
      step(3, '[data-tour="3"]', "Search & filters", "البحث والمرشحات", "Filter by keyword, agency, and status, then search for the latest matches.", "صفِّ حسب الكلمة والوكالة والحالة ثم ابحث عن أحدث النتائج."),
    ],
  },

  "company-intelligence": {
    autoScan: true,
    title: { en: "Company Intelligence", ar: "ذكاء الشركات" },
    description: {
      en: "Look up issuer financials and sync them into your pursuit workspace.",
      ar: "ابحث عن البيانات المالية للجهة وزامنها مع مساحة المتابعة.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Company Intelligence", "ذكاء الشركات", "Search any issuer by name or ticker, then review financials and customers from public sources.", "ابحث عن أي جهة بالاسم أو الرمز ثم راجع البيانات المالية والعملاء من مصادر عامة."),
      step(2, '[data-tour="2"]', "Sync to pursuit", "مزامنة مع المتابعة", "Attach the selected issuer to Source Docs and Workspace so the whole company shares the same context.", "اربط الجهة المختارة بمستندات المصدر ومساحة العمل ليشارك الفريق نفس السياق."),
    ],
  },

  "competitive-intelligence": {
    autoScan: true,
    title: { en: "Competitive Intelligence", ar: "الذكاء التنافسي" },
    description: {
      en: "Live competitor lookup and side-by-side datasheets.",
      ar: "بحث المنافسين المباشر ومقارنة أوراق البيانات.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Competitive Intelligence", "الذكاء التنافسي", "Compare competitors side-by-side. Look up any company or pick curated peers.", "قارن المنافسين جنبًا إلى جنب. ابحث عن أي شركة أو اختر نظراء محددين."),
      step(2, '[data-tour="2"]', "Refresh live metrics", "تحديث المقاييس المباشرة", "Pull the latest public metrics and differentiators into the comparison grid.", "اسحب أحدث المقاييس العامة والمميزات إلى شبكة المقارنة."),
    ],
  },

  "source-docs": {
    autoScan: true,
    title: { en: "Source Documents", ar: "المستندات المصدرية" },
    description: {
      en: "Upload RFP packs, review AI synopsis, and share boilerplate with the company.",
      ar: "ارفع حزم طلبات العروض وراجع ملخص الذكاء الاصطناعي وشارك القوالب مع الشركة.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Source Docs overview", "نظرة عامة على المستندات", "Upload and manage Grants/RFP source documents for your company.", "ارفع وأدر مستندات المنح/طلبات العروض لشركتك."),
      step(2, '[data-tour="2"]', "Upload zone", "منطقة الرفع", "Drag and drop an RFP PDF or Word file. Uploads feed deadlines, dashboard insights, and workspace.", "اسحب وأفلت ملف PDF أو Word. يغذي الرفع المواعيد ورؤى اللوحة ومساحة العمل."),
      step(3, '[data-tour="3"]', "Boilerplate library", "مكتبة القوالب", "Share Marln/JUNO capability boilerplate with prospects from this folder.", "شارك قوالب قدرات Marln/JUNO مع العملاء المحتملين من هذا المجلد."),
      step(4, '[data-tour="4"]', "Uploaded documents", "المستندات المرفوعة", "Open, rename, or remove files. Use View synopsis when AI insights are ready.", "افتح أو أعد تسمية أو احذف الملفات. استخدم عرض الملخص عندما تكون رؤى الذكاء جاهزة."),
    ],
  },

  team: {
    autoScan: true,
    title: { en: "Manage Team", ar: "إدارة الفريق" },
    description: {
      en: "Company-wide roster, roles, assignments, and export for your proposal team.",
      ar: "قائمة الشركة والأدوار والتعيينات والتصدير لفريق العروض.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Manage Team", "إدارة الفريق", "Structure, roles, and performance for your proposal team—shared across your company.", "الهيكل والأدوار والأداء لفريق العروض—مشترك عبر شركتك."),
      step(2, '[data-tour="2"]', "Add & export", "إضافة وتصدير", "Add team members and export the roster. Members sync into Team Collab reviewers.", "أضف أعضاء الفريق وصدّر القائمة. يتزامن الأعضاء مع مراجعي تعاون الفريق."),
      step(3, '[data-tour="3"]', "Team structure", "هيكل الفريق", "Review roles, hierarchy, and assignments for the people who will answer RFP questions.", "راجع الأدوار والتسلسل والتعيينات للأشخاص الذين سيجيبون على أسئلة طلبات العروض."),
    ],
  },

  "rfp-collaboration": {
    autoScan: true,
    title: { en: "Team Collab", ar: "تعاون الفريق" },
    description: {
      en: "Create workspaces, assign questions to team members, review answers, and watch the activity log.",
      ar: "أنشئ مساحات عمل وعيّن الأسئلة لأعضاء الفريق وراجع الإجابات وراقب سجل النشاط.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Team Collab hub", "مركز تعاون الفريق", "Company-wide collaboration workspaces for assigning and reviewing RFP questions.", "مساحات تعاون على مستوى الشركة لتعيين ومراجعة أسئلة طلبات العروض."),
      step(2, '[data-tour="2"]', "New workspace", "مساحة عمل جديدة", "Create a workspace from an RFP document or paste requirements, then split questions with AI.", "أنشئ مساحة من مستند طلب عرض أو الصق المتطلبات ثم قسّم الأسئلة بالذكاء الاصطناعي."),
      step(3, '[data-tour="3"]', "Workspaces list", "قائمة المساحات", "Open a workspace to assign questions, review submissions, and follow the live activity log.", "افتح مساحة لتعيين الأسئلة ومراجعة التقديمات ومتابعة سجل النشاط المباشر."),
    ],
  },

  "technical-solutioning": {
    autoScan: true,
    title: { en: "Technical Solutioning", ar: "الحل التقني" },
    description: {
      en: "Build solution architecture from reference designs and RFP requirements.",
      ar: "ابنِ هندسة الحل من التصاميم المرجعية ومتطلبات طلب العرض.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Technical Solutioning", "الحل التقني", "Turn RFP requirements and reference assets into a solution architecture outline.", "حوّل متطلبات طلب العرض والأصول المرجعية إلى مخطط هندسة حل."),
      step(2, '[data-tour="2"]', "Inputs & generate", "المدخلات والتوليد", "Select references and requirements, then generate or refine the architecture with AI.", "اختر المراجع والمتطلبات ثم ولّد أو حسّن الهندسة بالذكاء الاصطناعي."),
      step(3, '[data-tour="3"]', "Architecture output", "مخرجات الهندسة", "Review diagrams, capability mapping, and exportable solution narrative.", "راجع المخططات وتخطيط القدرات والسرد القابل للتصدير."),
    ],
  },

  topology: {
    autoScan: true,
    title: { en: "Topology", ar: "الطوبولوجيا" },
    description: {
      en: "Customer infrastructure topography with a JUNO overlay and RFP legends.",
      ar: "طوبوغرافيا بنية العميل مع طبقة JUNO وأساطير طلب العرض.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Topology overview", "نظرة عامة على الطوبولوجيا", "Map how JUNO sits on the customer environment for this pursuit.", "اعرض كيف تجلس JUNO على بيئة العميل لهذه المتابعة."),
      step(2, '[data-tour="2"]', "Environment layers", "طبقات البيئة", "Toggle infrastructure layers and legends tied to RFP requirements.", "بدّل طبقات البنية والأساطير المرتبطة بمتطلبات طلب العرض."),
    ],
  },

  "bid-vault": {
    autoScan: true,
    title: { en: "Bid Vault", ar: "خزينة العروض" },
    description: {
      en: "Repository for bids, submissions, and historical pursuit artifacts.",
      ar: "مستودع العروض والتقديمات وأرشيف المتابعات.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Bid Vault", "خزينة العروض", "Store and browse bid packages and related analytics for your pursuits.", " خزّن وتصفح حزم العروض والتحليلات المرتبطة بمتابعاتك."),
      step(2, '[data-tour="2"]', "Reports & trends", "التقارير والاتجاهات", "Review win/loss style analytics and historical bid performance.", "راجع تحليلات الفوز/الخسارة وأداء العروض التاريخي."),
    ],
  },

  scoring: {
    autoScan: true,
    title: { en: "Win / Loss Scoring", ar: "تسجيل الفوز/الخسارة" },
    description: {
      en: "Debrief scores, ingest feedback, and track product capability gaps.",
      ar: "درجات الإحاطة واستيعاب الملاحظات وتتبع فجوات القدرات.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Scoring overview", "نظرة عامة على التسجيل", "Capture win/loss outcomes and debrief scores for closed pursuits.", "سجّل نتائج الفوز/الخسارة ودرجات الإحاطة للمتابعات المغلقة."),
      step(2, '[data-tour="2"]', "Samples & gaps", "عينات وفجوات", "Review sample debriefs and product capability gaps that should inform the next bid.", "راجع عينات الإحاطة وفجوات القدرات التي يجب أن توجه العرض التالي."),
    ],
  },

  "win-slide": {
    autoScan: true,
    title: { en: "Win Slide", ar: "شريحة الفوز" },
    description: {
      en: "Post-selection POV, proof points, and who you won or lost against.",
      ar: "وجهة النظر بعد الاختيار ونقاط الإثبات ومن فزت أو خسرت أمامه.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Win Slide", "شريحة الفوز", "Build a concise post-selection narrative for leadership and capture teams.", "ابنِ سردًا موجزًا بعد الاختيار للقيادة وفرق الاستحواذ."),
      step(2, '[data-tour="2"]', "POV & competitors", "وجهة النظر والمنافسون", "Document proof, differentiators, and competitive framing for the win or loss.", "وثّق الإثبات والمميزات والإطار التنافسي للفوز أو الخسارة."),
    ],
  },

  "capture-strategy": {
    autoScan: true,
    title: { en: "Capture Strategy", ar: "استراتيجية الاستحواذ" },
    description: {
      en: "Capture planning, goals, and roadmap for pursuits.",
      ar: "تخطيط الاستحواذ والأهداف وخارطة الطريق للمتابعات.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Capture Strategy", "استراتيجية الاستحواذ", "Plan capture goals, priorities, and multi-year roadmap items for your pursuits.", "خطّط أهداف الاستحواذ والأولويات وبنود خارطة الطريق لعدة سنوات."),
      step(2, '[data-tour="2"]', "Planning tools", "أدوات التخطيط", "Use KPIs, SWOT, and planning grids to keep the capture plan actionable.", "استخدم المؤشرات وتحليل SWOT وشبكات التخطيط لإبقاء الخطة قابلة للتنفيذ."),
    ],
  },

  "content-hub": {
    autoScan: true,
    title: { en: "Content Hub", ar: "مركز المحتوى" },
    description: {
      en: "Reusable Q&A library and proposal content assets shared company-wide.",
      ar: "مكتبة أسئلة وأجوبة وأصول محتوى العروض المشتركة على مستوى الشركة.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Content Hub", "مركز المحتوى", "Browse and maintain reusable answers and boilerplate for faster responses.", "تصفح وحافظ على إجابات وقوالب قابلة لإعادة الاستخدام لتسريع الردود."),
      step(2, '[data-tour="2"]', "Q&A library", "مكتبة الأسئلة والأجوبة", "Answers saved from Workspace upsert into this company library.", "الإجابات المحفوظة من مساحة العمل تُدرج في هذه المكتبة المشتركة."),
    ],
  },

  pricing: {
    autoScan: true,
    title: { en: "Pricing", ar: "التسعير" },
    description: {
      en: "Labor rates, cost proposal analytics, and pricing tabs for pursuits.",
      ar: "معدلات العمالة وتحليلات تكلفة العرض وتبويبات التسعير للمتابعات.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Pricing overview", "نظرة عامة على التسعير", "Model labor and cost proposal views for the active pursuit.", "نمذج العمالة وتكلفة العرض للمتابعة النشطة."),
      step(2, '[data-tour="2"]', "Pricing tabs", "تبويبات التسعير", "Switch between labor, cost, and related analytics views.", "بدّل بين العمالة والتكلفة والتحليلات ذات الصلة."),
    ],
  },

  communication: {
    autoScan: true,
    title: { en: "Communication", ar: "التواصل" },
    description: {
      en: "Internal pursuit messaging and company communication hub.",
      ar: "رسائل المتابعة الداخلية ومركز تواصل الشركة.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Communication hub", "مركز التواصل", "Coordinate internal messages related to pursuits and team updates.", "نسّق الرسائل الداخلية المتعلقة بالمتابعات وتحديثات الفريق."),
      step(2, '[data-tour="2"]', "Threads & AI assist", "المحادثات ومساعدة الذكاء", "Use threads and AI assists to draft clearer internal updates.", "استخدم المحادثات ومساعدات الذكاء لصياغة تحديثات داخلية أوضح."),
    ],
  },

  compliance: {
    autoScan: true,
    title: { en: "Compliance", ar: "الامتثال" },
    description: {
      en: "Audit, compliance, and legal documentation for pursuits.",
      ar: "التدقيق والامتثال والمستندات القانونية للمتابعات.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Compliance desk", "مكتب الامتثال", "Track audit-ready docs and compliance status for active pursuits.", "تتبّع المستندات الجاهزة للتدقيق وحالة الامتثال للمتابعات النشطة."),
      step(2, '[data-tour="2"]', "Evidence & reports", "الأدلة والتقارير", "Upload and review compliance evidence packages shared across the company.", "ارفع وراجع حزم أدلة الامتثال المشتركة عبر الشركة."),
    ],
  },

  "meetings-calendar": {
    autoScan: true,
    title: { en: "Meetings & Calendar", ar: "الاجتماعات والتقويم" },
    description: {
      en: "Deadlines, kickoffs, reviews, and company calendar events.",
      ar: "المواعيد والانطلاقات والمراجعات وأحداث تقويم الشركة.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Meetings & Calendar", "الاجتماعات والتقويم", "See RFP deadlines and pursuit meetings on one company calendar.", "اعرض مواعيد طلبات العروض واجتماعات المتابعة في تقويم واحد للشركة."),
      step(2, '[data-tour="2"]', "Add & sync", "إضافة ومزامنة", "Add events or pull deadlines extracted from Source Docs uploads.", "أضف أحداثًا أو اسحب المواعيد المستخرجة من رفع مستندات المصدر."),
    ],
  },

  "user-management": {
    autoScan: true,
    title: { en: "User Management", ar: "إدارة المستخدمين" },
    description: {
      en: "Company users, roles, and trial member totals.",
      ar: "مستخدمو الشركة والأدوار وإجماليات أعضاء التجربة.",
    },
    steps: [
      step(1, '[data-tour="1"]', "User Management", "إدارة المستخدمين", "See who belongs to your company and their roles.", "اعرض من ينتمي لشركتك وأدوارهم."),
      step(2, '[data-tour="2"]', "Totals & roster", "الإجماليات والقائمة", "Total users stay in sync with Manage Team membership for the tenant.", "يبقى إجمالي المستخدمين متزامنًا مع عضوية إدارة الفريق للمستأجر."),
    ],
  },

  workspace: {
    autoScan: true,
    title: { en: "Response workspace", ar: "مساحة الاستجابة" },
    description: {
      en: "Answer RFP questions, pick the issuer, and ask team members to audit responses.",
      ar: "أجب عن أسئلة طلب العرض واختر الجهة واطلب من أعضاء الفريق تدقيق الردود.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Response workspace", "مساحة الاستجابة", "Build and edit RFP responses for the selected document and issuer.", "ابنِ وعدّل ردود طلب العرض للمستند والجهة المحددين."),
      step(2, '[data-tour="2"]', "Questions & answers", "الأسئلة والإجابات", "Draft answers with AI assist; saved answers update the company Q&A library.", "صغ الإجابات بمساعدة الذكاء؛ الإجابات المحفوظة تحدّث مكتبة الأسئلة والأجوبة."),
      step(3, '[data-tour="3"]', "Ask team member", "اطلب من عضو الفريق", "Assign a question to a company teammate via Team Collab for review.", "عيّن سؤالًا لزمیل في الشركة عبر تعاون الفريق للمراجعة."),
    ],
  },

  "help-support": {
    autoScan: true,
    title: { en: "Help & Support", ar: "المساعدة والدعم" },
    description: {
      en: "Support contacts, handbook links, and troubleshooting for JUNO RFP.",
      ar: "جهات اتصال الدعم وروابط الدليل واستكشاف الأخطاء لـ JUNO RFP.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Help & Support", "المساعدة والدعم", "Find support channels and handbook material for the capture desk.", "اعثر على قنوات الدعم ومواد الدليل لمكتب الاستحواذ."),
      step(2, '[data-tour="2"]', "Contact & resources", "التواصل والموارد", "Use listed contacts and resources when you need help with a pursuit workflow.", "استخدم جهات الاتصال والموارد عند الحاجة لمساعدة في سير المتابعة."),
    ],
  },

  settings: {
    autoScan: true,
    title: { en: "Organization Settings", ar: "إعدادات المؤسسة" },
    description: {
      en: "Company profile from trial signup. Change password from the trial banner when needed.",
      ar: "ملف الشركة من تسجيل التجربة. غيّر كلمة المرور من شريط التجربة عند الحاجة.",
    },
    steps: [
      step(1, '[data-tour="1"]', "Organization settings", "إعدادات المؤسسة", "View company and contact details collected at trial signup.", "اعرض بيانات الشركة والاتصال المجمعة عند تسجيل التجربة."),
      step(2, '[data-tour="2"]', "Password & preferences", "كلمة المرور والتفضيلات", "Change password from the trial banner; update notification and branding preferences here when available.", "غيّر كلمة المرور من شريط التجربة؛ حدّث تفضيلات الإشعارات والعلامة هنا عند توفرها."),
    ],
  },
};

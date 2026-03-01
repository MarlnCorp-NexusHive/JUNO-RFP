import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from "recharts";
import { useTranslation } from 'react-i18next';
import { useLocalization } from '/src/hooks/useLocalization.jsx';
import { FiTarget, FiSearch, FiTrendingUp, FiZap } from 'react-icons/fi';
import MarketingAISearch from '../components/ai/MarketingAISearch';
import MarketingLeadBehaviorAnalysis from '../components/ai/MarketingLeadBehaviorAnalysis';

// Demo data for KPI cards - uses role-specific labels when variant is procurement or sales enablement
const getKPIs = (t, variant) => {
  const kpiNs = variant && ['procurement_manager', 'sales_enablement_manager'].includes(variant)
    ? `kpisByRole.${variant}`
    : 'kpis';
  return [
    { label: t(`${kpiNs}.totalQualifiedLeads`), value: 1240, icon: "🎯", color: "bg-blue-100 text-blue-700" },
    { label: t(`${kpiNs}.conversionRate`), value: "32%", icon: "📈", color: "bg-green-100 text-green-700" },
    { label: t(`${kpiNs}.activeCampaigns`), value: 8, icon: "📢", color: "bg-purple-100 text-purple-700" },
    { label: t(`${kpiNs}.teamMembers`), value: 15, icon: "👥", color: "bg-yellow-100 text-yellow-700" },
    { label: t(`${kpiNs}.roi`), value: "285%", icon: "💰", color: "bg-pink-100 text-pink-700" },
  ];
};

// Demo data for charts
const getLeadTrend = (t) => [
  { month: t('months.jan'), [t('charts.leads')]: 200, [t('charts.conversions')]: 60 },
  { month: t('months.feb'), [t('charts.leads')]: 250, [t('charts.conversions')]: 75 },
  { month: t('months.mar'), [t('charts.leads')]: 300, [t('charts.conversions')]: 90 },
  { month: t('months.apr'), [t('charts.leads')]: 350, [t('charts.conversions')]: 105 },
  { month: t('months.may'), [t('charts.leads')]: 400, [t('charts.conversions')]: 120 },
  { month: t('months.jun'), [t('charts.leads')]: 420, [t('charts.conversions')]: 130 },
];

const getCampaignPerformance = (t) => [
  { name: t('charts.socialMedia'), value: 35 },
  { name: t('charts.email'), value: 25 },
  { name: t('charts.events'), value: 20 },
  { name: t('charts.directOutreach'), value: 15 },
  { name: t('charts.other'), value: 5 },
];

const COLORS = ["#6366f1", "#22c55e", "#f59e42", "#eab308", "#a3a3a3"];

// Procurement-specific demo data
const getProcurementSpendTrend = (t) => [
  { month: t('months.jan'), [t('procurement.spend')]: 42, budget: 50 },
  { month: t('months.feb'), [t('procurement.spend')]: 48, budget: 50 },
  { month: t('months.mar'), [t('procurement.spend')]: 45, budget: 52 },
  { month: t('months.apr'), [t('procurement.spend')]: 55, budget: 55 },
  { month: t('months.may'), [t('procurement.spend')]: 52, budget: 55 },
  { month: t('months.jun'), [t('procurement.spend')]: 58, budget: 58 },
];
const getProcurementSpendByCategory = (t) => [
  { name: t('procurement.categories.it'), value: 85 },
  { name: t('procurement.categories.facilities'), value: 45 },
  { name: t('procurement.categories.marketing'), value: 62 },
  { name: t('procurement.categories.office'), value: 18 },
  { name: t('procurement.categories.services'), value: 40 },
];
const getProcurementPOStatus = (t) => [
  { name: t('procurement.pending'), count: 12, fill: '#94a3b8' },
  { name: t('procurement.approved'), count: 28, fill: '#6366f1' },
  { name: t('procurement.inProgress'), count: 19, fill: '#f59e0b' },
  { name: t('procurement.delivered'), count: 41, fill: '#22c55e' },
];
const getProcurementSavingsData = (t) => [
  { name: t('procurement.budget'), value: 320, fill: '#e2e8f0' },
  { name: t('procurement.spend'), value: 300, fill: '#6366f1' },
  { name: t('procurement.savings'), value: 20, fill: '#22c55e' },
];
const getSupplierMatrixData = (t) => [
  { vendor: 'Tech Solutions Inc.', onTime: 98, quality: 4.8, spend: 125 },
  { vendor: 'Print Services Co.', onTime: 92, quality: 4.5, spend: 89 },
  { vendor: 'Event Equipment Ltd.', onTime: 85, quality: 4.2, spend: 67 },
  { vendor: 'Office Supplies Pro', onTime: 78, quality: 4.0, spend: 34 },
  { vendor: 'Consulting Partners', onTime: 95, quality: 4.7, spend: 105 },
];

// Additional detailed procurement data
const getSpendByCategoryOverTime = (t) => [
  { month: t('months.jan'), it: 14, facilities: 8, marketing: 10, office: 4, services: 6 },
  { month: t('months.feb'), it: 16, facilities: 9, marketing: 11, office: 4, services: 8 },
  { month: t('months.mar'), it: 15, facilities: 9, marketing: 10, office: 5, services: 6 },
  { month: t('months.apr'), it: 18, facilities: 10, marketing: 12, office: 5, services: 10 },
  { month: t('months.may'), it: 17, facilities: 10, marketing: 11, office: 6, services: 8 },
  { month: t('months.jun'), it: 20, facilities: 11, marketing: 13, office: 6, services: 8 },
];
const getTopVendorsBySpend = (t) => [
  { name: 'Tech Solutions Inc.', spend: 125 },
  { name: 'Consulting Partners', spend: 105 },
  { name: 'Print Services Co.', spend: 89 },
  { name: 'Event Equipment Ltd.', spend: 67 },
  { name: 'Office Supplies Pro', spend: 34 },
];
const getSavingsTrend = (t) => [
  { month: t('months.jan'), [t('procurement.savings')]: 2 },
  { month: t('months.feb'), [t('procurement.savings')]: 1 },
  { month: t('months.mar'), [t('procurement.savings')]: 4 },
  { month: t('months.apr'), [t('procurement.savings')]: 0 },
  { month: t('months.may'), [t('procurement.savings')]: 3 },
  { month: t('months.jun'), [t('procurement.savings')]: 5 },
];
const getBudgetVsActualByCategory = (t) => [
  { category: t('procurement.categories.it'), budget: 95, actual: 85 },
  { category: t('procurement.categories.facilities'), budget: 50, actual: 45 },
  { category: t('procurement.categories.marketing'), budget: 70, actual: 62 },
  { category: t('procurement.categories.office'), budget: 25, actual: 18 },
  { category: t('procurement.categories.services'), budget: 80, actual: 40 },
];
const getPOCountByCategory = (t) => [
  { category: t('procurement.categories.it'), count: 24 },
  { category: t('procurement.categories.facilities'), count: 18 },
  { category: t('procurement.categories.marketing'), count: 22 },
  { category: t('procurement.categories.office'), count: 31 },
  { category: t('procurement.categories.services'), count: 15 },
];
const getVendorQuadrantData = () => [
  { vendor: 'Tech Solutions', quality: 4.8, onTime: 98, spend: 125 },
  { vendor: 'Print Services', quality: 4.5, onTime: 92, spend: 89 },
  { vendor: 'Event Equipment', quality: 4.2, onTime: 85, spend: 67 },
  { vendor: 'Office Supplies', quality: 4.0, onTime: 78, spend: 34 },
  { vendor: 'Consulting', quality: 4.7, onTime: 95, spend: 105 },
];
const getContractRenewals = (t) => [
  { vendor: 'Tech Solutions Inc.', expires: t('months.mar'), value: 45 },
  { vendor: 'Print Services Co.', expires: t('months.apr'), value: 22 },
  { vendor: 'Consulting Partners', expires: t('months.may'), value: 38 },
  { vendor: 'Event Equipment Ltd.', expires: t('months.jun'), value: 18 },
];

export default function MarketingHeadDashboard() {
  const { t, ready, i18n } = useTranslation(['dashboard', 'welcome']);
  const { isRTLMode } = useLocalization();
  const [languageVersion, setLanguageVersion] = useState(0);
  
  useEffect(() => {
    setLanguageVersion(prev => prev + 1);
  }, [i18n.language]);

  if (!ready) {
    return <div className="flex items-center justify-center min-h-screen">{t('loading')}</div>;
  }

  const user = JSON.parse(localStorage.getItem('rbac_current_user'));
  const dashboardVariant = ['marketing_head', 'procurement_manager', 'sales_enablement_manager'].includes(user?.username) ? user.username : 'marketing_head';
  const pageTitle = t(`roleTitles.${dashboardVariant}`);
  const welcomeMessage = t(`welcome:${user?.username || 'marketing_head'}`);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  
  // AI Features State
  const [showAISearch, setShowAISearch] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showLeadBehaviorAnalysis, setShowLeadBehaviorAnalysis] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [behaviorAnalysis, setBehaviorAnalysis] = useState(null);
  
  // Refs for auto-scroll functionality
  const aiSearchRef = useRef(null);
  const aiInsightsRef = useRef(null);
  const leadBehaviorRef = useRef(null);

  // Auto-scroll to AI sections
  const scrollToAISection = (sectionRef) => {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  // Handle AI button clicks with auto-scroll
  const handleShowAISearch = () => {
    setShowAISearch(!showAISearch);
    if (!showAISearch) {
      setTimeout(() => scrollToAISection(aiSearchRef), 100);
    }
  };

  const handleShowAIInsights = () => {
    setShowAIInsights(!showAIInsights);
    if (!showAIInsights) {
      setTimeout(() => scrollToAISection(aiInsightsRef), 100);
    }
  };

  const handleShowLeadBehaviorAnalysis = () => {
    setShowLeadBehaviorAnalysis(!showLeadBehaviorAnalysis);
    if (!showLeadBehaviorAnalysis) {
      setTimeout(() => scrollToAISection(leadBehaviorRef), 100);
    }
  };

  const handleCardClick = (content) => {
    setModalContent(content);
    setShowModal(true);
  };

  const Modal = ({ content, onClose }) => {
    if (!content) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4">
          <button
            onClick={onClose}
            className="absolute top-2 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl font-bold"
            aria-label={t('modal.close')}
          >
            &times;
          </button>
          {content}
        </div>
      </div>
    );
  };

  return (
    <div key={`${i18n.language}-${languageVersion}`} className={`flex flex-col gap-8 ${isRTLMode ? 'rtl' : 'ltr'}`}>
      {/* Header Section */}
      <div
        className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isRTLMode ? 'flex-row-reverse' : ''}`}
        data-tour="1"
        data-tour-title-en="Marketing Dashboard Overview"
        data-tour-title-ar="نظرة عامة على لوحة تحكم التسويق"
        data-tour-content-en="Launch campaigns, export reports, and view a quick summary."
        data-tour-content-ar="ابدأ الحملات، صدّر التقارير، واعرض ملخصاً سريعاً."
        data-tour-position="bottom"
      >
        <div className={isRTLMode ? 'text-right' : 'text-left'}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">{welcomeMessage}</p> 
        </div>
        
        <div className={`flex gap-3 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
          {/* AI Features Buttons */}
          <button 
            className={`px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 ${isRTLMode ? 'flex-row-reverse' : ''}`}
            onClick={handleShowAISearch}
          >
            <FiSearch /> 
            {isRTLMode ? 'البحث بالذكاء الاصطناعي' : 'AI Search'}
          </button>
          
          <button 
            className={`px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 ${isRTLMode ? 'flex-row-reverse' : ''}`}
            onClick={handleShowAIInsights}
          >
            <FiZap /> 
            {isRTLMode ? 'رؤى الذكاء الاصطناعي' : 'AI Insights'}
          </button>
          
          <button 
            className={`px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 ${isRTLMode ? 'flex-row-reverse' : ''}`}
            onClick={handleShowLeadBehaviorAnalysis}
          >
            <FiTrendingUp /> 
            {isRTLMode ? 'تحليل سلوك العملاء' : 'Lead Analysis'}
          </button>
          
          {/* Original Buttons */}
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {t('newCampaignLaunch')}
          </button>
          <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
            {t('exportReport')}
          </button>
        </div>
      </div>

      {/* AI Search Section */}
      {showAISearch && (
        <section 
          ref={aiSearchRef}
          className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
          dir={isRTLMode ? 'rtl' : 'ltr'}
        >
          <div className={`flex items-center gap-2 mb-4 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
            <FiSearch className="text-purple-500" />
            <h2 className="text-lg font-semibold">
              {isRTLMode ? 'البحث بالذكاء الاصطناعي' : 'AI Search'}
            </h2>
          </div>
          <MarketingAISearch 
            onSearchResults={(results) => {
              setAiSearchResults(results);
              console.log('AI Search results:', results);
            }}
            onSelectForAIReply={(lead) => {
              console.log('Selected lead for AI reply:', lead);
            }}
          />
        </section>
      )}

      {/* AI Insights Section */}
      {showAIInsights && (
        <section 
          ref={aiInsightsRef}
          className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
          dir={isRTLMode ? 'rtl' : 'ltr'}
        >
          <div className={`flex items-center gap-2 mb-4 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
            <FiZap className="text-green-500" />
            <h2 className="text-lg font-semibold">
              {isRTLMode ? 'رؤى الذكاء الاصطناعي' : 'AI Insights & Recommendations'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <h3 className="font-semibold mb-2">{isRTLMode ? 'توصيات الأداء' : 'Performance Recommendations'}</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                {isRTLMode ? 
                  'حملة وسائل التواصل الاجتماعي تحقق أفضل أداء. اقترح زيادة الميزانية بنسبة 15%.' : 
                  'Social media campaign performing best. Recommend increasing budget by 15%.'
                }
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <h3 className="font-semibold mb-2">{isRTLMode ? 'تحذيرات مبكرة' : 'Early Warnings'}</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {isRTLMode ? 
                  'معدل التحويل في انخفاض. اقترح مراجعة استراتيجية التسويق.' : 
                  'Conversion rate declining. Suggest reviewing marketing strategy.'
                }
              </p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
              <h3 className="font-semibold mb-2">{isRTLMode ? 'فرص جديدة' : 'New Opportunities'}</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {isRTLMode ? 
                  'سوق جديد مفتوح في المنطقة الشرقية. اقترح حملة مستهدفة.' : 
                  'New market opening in Eastern Region. Suggest targeted campaign.'
                }
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <h3 className="font-semibold mb-2">{isRTLMode ? 'تحسينات الفريق' : 'Team Improvements'}</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                {isRTLMode ? 
                  'فريق التسويق يحتاج تدريب إضافي على أدوات الذكاء الاصطناعي.' : 
                  'Marketing team needs additional training on AI tools.'
                }
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Lead Behavior Analysis Section */}
      {showLeadBehaviorAnalysis && (
        <section 
          ref={leadBehaviorRef}
          className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
          dir={isRTLMode ? 'rtl' : 'ltr'}
        >
          <div className={`flex items-center gap-2 mb-4 ${isRTLMode ? 'flex-row-reverse' : ''}`}>
            <FiTrendingUp className="text-blue-500" />
            <h2 className="text-lg font-semibold">
              {isRTLMode ? 'تحليل سلوك العملاء المحتملين' : 'Lead Behavior Analysis'}
            </h2>
          </div>
          <MarketingLeadBehaviorAnalysis 
            leads={[]} // Pass actual leads data here
            onAnalysisComplete={(analysis) => {
              setBehaviorAnalysis(analysis);
              console.log('Lead behavior analysis completed:', analysis);
            }}
          />
        </section>
      )}

      {/* KPI Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
        data-tour="2"
        data-tour-title-en="KPI Summary"
        data-tour-title-ar="ملخص مؤشرات الأداء"
        data-tour-content-en="Track qualified leads, conversion rate, active campaigns, team size, and ROI."
        data-tour-content-ar="تتبع العملاء المحتملين المؤهلين، معدل التحويل، الحملات النشطة، حجم الفريق، والعائد على الاستثمار."
        data-tour-position="bottom"
      >
        {getKPIs(t, dashboardVariant).map((kpi, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${kpi.color} p-4 rounded-xl shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{kpi.icon}</span>
              <span className="text-2xl font-bold">{kpi.value}</span>
            </div>
            <p className="text-sm mt-2">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Procurement-specific: Matrices, Graphs & Visuals */}
      {dashboardVariant === 'procurement_manager' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('procurement.spendOverTime')} &amp; {t('procurement.spendByCategory')}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">{t('procurement.spendOverTime')} (USD K)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getProcurementSpendTrend(t)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey={t('procurement.spend')} stroke="#6366f1" strokeWidth={2} />
                    <Line type="monotone" dataKey="budget" stroke="#94a3b8" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">{t('procurement.spendByCategory')}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getProcurementSpendByCategory(t)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {getProcurementSpendByCategory(t).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">{t('procurement.poStatusBreakdown')}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getProcurementPOStatus(t)} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={70} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]}>
                      {getProcurementPOStatus(t).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">{t('procurement.savingsVsBudget')}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getProcurementSavingsData(t)} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">{t('procurement.supplierMatrix')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('procurement.vendor')}</th>
                    <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('procurement.onTimeDelivery')}</th>
                    <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('procurement.qualityScore')}</th>
                    <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('procurement.totalSpend')} (K)</th>
                    <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('procurement.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {getSupplierMatrixData(t).map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.vendor}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${row.onTime >= 95 ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : row.onTime >= 85 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}>
                          {row.onTime}%
                        </span>
                      </td>
                      <td className="py-3 px-4">{row.quality}/5</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">${row.spend}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                          {t('procurement.approved')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row: Spend by category over time + Budget utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">{t('procurement.spendByCategoryOverTime')} (USD K)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getSpendByCategoryOverTime(t)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="it" stackId="1" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.7} name={t('procurement.categories.it')} />
                    <Area type="monotone" dataKey="facilities" stackId="1" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.7} name={t('procurement.categories.facilities')} />
                    <Area type="monotone" dataKey="marketing" stackId="1" stroke={COLORS[2]} fill={COLORS[2]} fillOpacity={0.7} name={t('procurement.categories.marketing')} />
                    <Area type="monotone" dataKey="office" stackId="1" stroke={COLORS[3]} fill={COLORS[3]} fillOpacity={0.7} name={t('procurement.categories.office')} />
                    <Area type="monotone" dataKey="services" stackId="1" stroke={COLORS[4]} fill={COLORS[4]} fillOpacity={0.7} name={t('procurement.categories.services')} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold mb-4">{t('procurement.budgetUtilization')}</h3>
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-gray-200 dark:text-gray-600" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-emerald-500" stroke="currentColor" strokeWidth="3" strokeDasharray="94 6" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">94%</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('procurement.spend')} vs {t('procurement.budget')}</p>
            </div>
          </div>

          {/* Row: Top vendors + Savings trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">{t('procurement.topVendorsBySpend')} (USD K)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getTopVendorsBySpend(t)} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="spend" fill="#6366f1" radius={[0, 4, 4, 0]} name={t('procurement.totalSpend')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">{t('procurement.savingsTrend')} (USD K)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getSavingsTrend(t)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey={t('procurement.savings')} stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row: Budget vs actual + PO count by category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">{t('procurement.budgetVsActualByCategory')} (USD K)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getBudgetVsActualByCategory(t)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="budget" fill="#94a3b8" radius={[4, 4, 0, 0]} name={t('procurement.budget')} />
                    <Bar dataKey="actual" fill="#6366f1" radius={[4, 4, 0, 0]} name={t('procurement.actual')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">{t('procurement.poCountByCategory')}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getPOCountByCategory(t)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name={t('procurement.status')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Vendor performance quadrant (scatter) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">{t('procurement.vendorQuadrant')} — {t('procurement.qualityScore')} vs {t('procurement.onTimeDelivery')}</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="quality" name={t('procurement.qualityScore')} domain={[3.5, 5]} />
                  <YAxis type="number" dataKey="onTime" name={t('procurement.onTimeDelivery')} domain={[70, 100]} />
                  <ZAxis type="number" dataKey="spend" range={[100, 600]} name={t('procurement.totalSpend')} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => [name === t('procurement.totalSpend') ? `$${value}K` : value, name]} />
                  <Scatter name={t('procurement.vendor')} data={getVendorQuadrantData()} fill="#6366f1" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Bubble size = {t('procurement.totalSpend')}. Top-right = high quality & on-time.</p>
          </div>

          {/* Contract renewals */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">{t('procurement.contractRenewals')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('procurement.vendor')}</th>
                    <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('procurement.expires')}</th>
                    <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{t('procurement.valueK')}</th>
                  </tr>
                </thead>
                <tbody>
                  {getContractRenewals(t).map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.vendor}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{row.expires}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">${row.value}K</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section (marketing / sales enablement only) */}
      {dashboardVariant !== 'procurement_manager' && (
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        data-tour="3"
        data-tour-title-en="Analytics Charts"
        data-tour-title-ar="مخططات التحليلات"
        data-tour-content-en="Analyze lead trends and marketing channel performance."
        data-tour-content-ar="حلّل اتجاهات العملاء وأداء قنوات التسويق."
        data-tour-position="bottom"
      >
        {/* Lead Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{t('charts.leadGenerationActionable')}</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getLeadTrend(t)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={t('charts.leads')} stroke="#6366f1" />
                <Line type="monotone" dataKey={t('charts.conversions')} stroke="#22c55e" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign Performance Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{t('charts.marketingChannelPerformance')}</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getCampaignPerformance(t)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {getCampaignPerformance(t).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      )}

      {/* Recent Activity and Tasks */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        data-tour="4"
        data-tour-title-en="Activity & Follow-ups"
        data-tour-title-ar="النشاط والمتابعات"
        data-tour-content-en="Keep track of team activity and upcoming follow-ups."
        data-tour-content-ar="تابع نشاط الفريق والمتابعات القادمة."
        data-tour-position="bottom"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{t('activityLog.title')}</h2>
          <div className="space-y-4">
            {[
              { action: t('activityLog.newLeadAdded'), time: t('activityLog.twoHoursAgo'), user: t('users.saraKhalid') },
              { action: t('activityLog.marketingInitiativeDeployed'), time: t('activityLog.fiveHoursAgo'), user: t('users.janeSmith') },
              { action: t('activityLog.performanceReportCreated'), time: t('activityLog.oneDayAgo'), user: t('users.mikeJohnson') },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time} {t('activityLog.byUser', { user: activity.user })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{t('upcomingFollowUps.title')}</h2>
          <div className="space-y-4">
            {[
              { task: t('upcomingFollowUps.evaluateMidYearMarketing'), due: t('upcomingFollowUps.june15') },
              { task: t('upcomingFollowUps.teamPerformanceReview'), due: t('upcomingFollowUps.june16') },
              { task: t('upcomingFollowUps.budgetPlanningMeeting'), due: t('upcomingFollowUps.june17') },
            ].map((task, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="rounded text-blue-600" />
                  <span className="text-sm">{task.task}</span>
                </div>
                <span className="text-xs text-gray-500">{task.due}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && <Modal content={modalContent} onClose={() => setShowModal(false)} />}
    </div>
  );
}
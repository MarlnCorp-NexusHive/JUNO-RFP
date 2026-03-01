import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../../../hooks/useLocalization';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as XLSX from 'xlsx';
import {
  FiFileText,
  FiEdit2,
  FiDownload,
  FiChevronRight,
  FiPlus,
  FiTrash2,
  FiMenu,
  FiUpload,
  FiUserPlus,
  FiSend,
} from 'react-icons/fi';

const RFP_ALLOWED_ROLES = ['procurement_manager', 'sales_enablement_manager'];
const RFP_STATUSES = ['draft', 'published', 'closed', 'evaluation', 'awarded'];
const RFP_DEPARTMENTS = ['IT', 'Finance', 'Legal', 'HR', 'Operations', 'Procurement'];
const SECTION_STATUSES = ['not_sent', 'sent_for_response', 'in_progress', 'under_review', 'completed'];
const ANSWER_TYPES = [
  { value: 'text', labelKey: 'answerTypeText' },
  { value: 'longText', labelKey: 'answerTypeLongText' },
  { value: 'yesNo', labelKey: 'answerTypeYesNo' },
  { value: 'number', labelKey: 'answerTypeNumber' },
  { value: 'file', labelKey: 'answerTypeFile' },
  { value: 'multipleChoice', labelKey: 'answerTypeMultipleChoice' },
];

const genId = () => `_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const defaultBasicInfo = {
  projectName: '',
  department: '',
  objective: '',
  budgetRange: '',
  timelineStart: '',
  timelineEnd: '',
  vendorRequirements: '',
  evaluationCriteria: '',
  contactPerson: '',
  contactEmail: '',
  submissionDeadline: '',
  additionalNotes: '',
};

const loadRfpFromStorage = () => {
  const defaultRfp = {
    basicInfo: { ...defaultBasicInfo },
    status: 'draft',
    sections: [],
    questions: [],
    attachments: [],
    invitedVendors: [],
    vendorResponses: {},
  };
  try {
    const raw = localStorage.getItem('rfp_current');
    if (raw) {
      const parsed = JSON.parse(raw);
      const basicInfo = parsed.basicInfo || (parsed.answers ? { ...defaultBasicInfo, ...parsed.answers } : defaultBasicInfo);
      return {
        ...defaultRfp,
        basicInfo,
        status: parsed.status || 'draft',
        sections: Array.isArray(parsed.sections) ? parsed.sections.map((s) => ({ ...s, assignedDepartmentId: s.assignedDepartmentId ?? null, sectionStatus: s.sectionStatus || 'not_sent' })) : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
        invitedVendors: Array.isArray(parsed.invitedVendors) ? parsed.invitedVendors : [],
        vendorResponses: parsed.vendorResponses && typeof parsed.vendorResponses === 'object' ? parsed.vendorResponses : {},
      };
    }
  } catch (_) {}
  return defaultRfp;
};

const saveRfpToStorage = (rfp) => {
  try {
    const toSave = { ...rfp, attachments: rfp.attachments.map(({ id, name, size }) => ({ id, name, size })) };
    localStorage.setItem('rfp_current', JSON.stringify(toSave));
  } catch (_) {}
};

const CONTENT_REPO_KEY = 'rfp_content_repository';
const loadContentRepository = () => {
  try {
    const raw = localStorage.getItem(CONTENT_REPO_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }
  } catch (_) {}
  return [];
};
const saveContentRepository = (entries) => {
  try {
    localStorage.setItem(CONTENT_REPO_KEY, JSON.stringify(entries));
  } catch (_) {}
};

const normalizeForMatch = (s) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
const findRepositoryMatch = (questionText, repository) => {
  if (!questionText || !repository?.length) return null;
  const n = normalizeForMatch(questionText);
  return repository.find((e) => normalizeForMatch(e.questionText) === n) || repository.find((e) => n.includes(normalizeForMatch(e.questionText)) || normalizeForMatch(e.questionText).includes(n)) || null;
};

function SortableSectionItem({ section, questions, isEditable, onEditSection, onDeleteSection, onAddQuestion, onEditQuestion, onDeleteQuestion, onReorderQuestions, onSetSectionDepartment, onSetSectionStatus, t, isRtl }) {
  const [expanded, setExpanded] = useState(true);
  const questionIds = questions.filter((q) => q.sectionId === section.id).sort((a, b) => a.order - b.order).map((q) => q.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const sectionStatus = section.sectionStatus || 'not_sent';
  const statusLabel = t(`rfp.${sectionStatus}`);

  return (
    <div ref={setNodeRef} style={style} className={`rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden ${isDragging ? 'opacity-80 shadow-lg' : ''}`}>
      <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-600 flex-wrap">
        {isEditable && (
          <button type="button" className="p-1 rounded cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" {...attributes} {...listeners}>
            <FiMenu className="w-5 h-5" />
          </button>
        )}
        <button type="button" className="flex-1 min-w-0 text-left font-semibold text-gray-900 dark:text-white truncate" onClick={() => setExpanded(!expanded)}>
          {section.title || t('rfp.sectionTitle')}
        </button>
        {isEditable && (
          <>
            <select
              value={section.assignedDepartmentId ?? ''}
              onChange={(e) => onSetSectionDepartment(section.id, e.target.value || null)}
              className="px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              title={t('rfp.assignedDepartment')}
            >
              <option value="">— {t('rfp.assignedDepartment')}</option>
              {RFP_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <span className={`px-2 py-1 rounded text-xs font-medium ${sectionStatus === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/40' : sectionStatus === 'under_review' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40' : sectionStatus === 'sent_for_response' || sectionStatus === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40' : 'bg-gray-100 text-gray-700 dark:bg-gray-600'}`}>
              {statusLabel}
            </span>
            {section.assignedDepartmentId && sectionStatus !== 'completed' && (
              <button type="button" onClick={() => onSetSectionStatus(section.id, sectionStatus === 'not_sent' ? 'sent_for_response' : sectionStatus === 'sent_for_response' ? 'in_progress' : sectionStatus === 'in_progress' ? 'under_review' : 'completed')} className="px-2 py-1.5 text-xs font-medium rounded-lg bg-[#4f3cc9] text-white hover:bg-[#4330a8]">
                {sectionStatus === 'not_sent' ? t('rfp.sendForResponse') : sectionStatus === 'sent_for_response' ? t('rfp.inProgress') : sectionStatus === 'in_progress' ? t('rfp.sendForReview') : t('rfp.markReviewed')}
              </button>
            )}
            <button type="button" onClick={() => onEditSection(section)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg" title={t('rfp.editSection')}>
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => onDeleteSection(section.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title={t('rfp.deleteSection')}>
              <FiTrash2 className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => onAddQuestion(section.id)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg flex items-center gap-1 text-sm">
              <FiPlus className="w-4 h-4" /> {t('rfp.addQuestion')}
            </button>
          </>
        )}
      </div>
      {expanded && (
        <div className="p-4">
          <SortableQuestionsList
            questionIds={questionIds}
            questions={questions}
            isEditable={isEditable}
            onEditQuestion={onEditQuestion}
            onDeleteQuestion={onDeleteQuestion}
            onReorderQuestions={onReorderQuestions}
            sectionId={section.id}
            t={t}
          />
        </div>
      )}
    </div>
  );
}

function SortableQuestionsList({ questionIds, questions, isEditable, onEditQuestion, onDeleteQuestion, onReorderQuestions, sectionId, t }) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questionIds.indexOf(active.id);
    const newIndex = questionIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorderQuestions(sectionId, arrayMove(questionIds, oldIndex, newIndex));
  };

  if (questionIds.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-2">{t('rfp.noQuestions')}</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {questionIds.map((id) => {
            const q = questions.find((x) => x.id === id);
            if (!q) return null;
            return (
              <SortableQuestionItem
                key={q.id}
                question={q}
                isEditable={isEditable}
                onEdit={() => onEditQuestion(q)}
                onDelete={() => onDeleteQuestion(q.id)}
                t={t}
              />
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableQuestionItem({ question, isEditable, onEdit, onDelete, t }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const typeLabel = ANSWER_TYPES.find((a) => a.value === question.answerType)?.labelKey || question.answerType;

  return (
    <li ref={setNodeRef} style={style} className={`flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 ${isDragging ? 'shadow' : ''}`}>
      {isEditable && (
        <button type="button" className="p-1 cursor-grab active:cursor-grabbing text-gray-500" {...attributes} {...listeners}>
          <FiMenu className="w-4 h-4" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-gray-900 dark:text-white font-medium truncate">{question.text || t('rfp.questionText')}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t(`rfp.${typeLabel}`)} {question.required ? '• ' + t('rfp.required') : ''} {question.weight != null && question.weight !== '' ? `• ${t('rfp.weight')}: ${question.weight}` : ''}
        </p>
      </div>
      {isEditable && (
        <>
          <button type="button" onClick={onEdit} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded" title={t('rfp.editSection')}>
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button type="button" onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
            <FiTrash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </li>
  );
}

export default function RFPPage() {
  const { t } = useTranslation('common');
  const { isRTLMode } = useLocalization();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [rfp, setRfp] = useState(loadRfpFromStorage);
  const [sectionModal, setSectionModal] = useState(null);
  const [questionModal, setQuestionModal] = useState(null);
  const [vendorResponseModal, setVendorResponseModal] = useState(null);
  const [contentRepository, setContentRepository] = useState(loadContentRepository);
  const fileInputRef = useRef(null);
  const printRef = useRef(null);
  useEffect(() => { saveContentRepository(contentRepository); }, [contentRepository]);

  useEffect(() => {
    const user = (() => { try { return JSON.parse(localStorage.getItem('rbac_current_user')); } catch { return null; } })();
    const username = user?.username || '';
    if (!RFP_ALLOWED_ROLES.includes(username)) {
      navigate('/rbac/marketing-head', { replace: true });
    }
  }, [navigate]);

  useEffect(() => { saveRfpToStorage(rfp); }, [rfp]);

  const isDraft = rfp.status === 'draft';
  const isEditable = isDraft;
  const dir = isRTLMode ? 'rtl' : 'ltr';
  const isRtl = isRTLMode;

  const setBasicInfo = (field, value) => setRfp((prev) => ({ ...prev, basicInfo: { ...prev.basicInfo, [field]: value } }));
  const setStatus = (status) => setRfp((prev) => ({ ...prev, status }));

  const addSection = (title) => {
    const id = genId();
    setRfp((prev) => ({
      ...prev,
      sections: [...prev.sections, { id, title: title || t('rfp.sectionTitle'), order: prev.sections.length, assignedDepartmentId: null, sectionStatus: 'not_sent' }],
    }));
    setSectionModal(null);
  };
  const updateSection = (id, updates) => {
    setRfp((prev) => ({ ...prev, sections: prev.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)) }));
    if (updates.title !== undefined) setSectionModal(null);
  };
  const setSectionDepartment = (sectionId, assignedDepartmentId) => updateSection(sectionId, { assignedDepartmentId });
  const setSectionStatus = (sectionId, sectionStatus) => updateSection(sectionId, { sectionStatus });
  const deleteSection = (id) => {
    setRfp((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id), questions: prev.questions.filter((q) => q.sectionId !== id) }));
  };
  const reorderSections = (newSections) => setRfp((prev) => ({ ...prev, sections: newSections.map((s, i) => ({ ...s, order: i })) }));

  const addQuestion = (sectionId, data) => {
    const id = genId();
    const questionsInSection = rfp.questions.filter((q) => q.sectionId === sectionId);
    const order = questionsInSection.length;
    setRfp((prev) => ({
      ...prev,
      questions: [...prev.questions, { id, sectionId, order, text: data.text || '', answerType: data.answerType || 'text', required: !!data.required, weight: data.weight ?? '', choices: data.choices || [] }],
    }));
    setQuestionModal(null);
  };
  const updateQuestion = (id, data) => {
    setRfp((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, ...data } : q)),
    }));
    setQuestionModal(null);
  };
  const deleteQuestion = (id) => setRfp((prev) => ({ ...prev, questions: prev.questions.filter((q) => q.id !== id) }));
  const reorderQuestions = (sectionId, newOrderIds) => {
    setRfp((prev) => {
      const bySection = { ...prev.questions.reduce((acc, q) => ({ ...acc, [q.id]: q }), {}) };
      const reordered = newOrderIds.map((id, i) => (bySection[id] ? { ...bySection[id], order: i } : null)).filter(Boolean);
      const others = prev.questions.filter((q) => q.sectionId !== sectionId);
      return { ...prev, questions: [...others, ...reordered] };
    });
  };

  const handleSectionDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sections = [...rfp.sections].sort((a, b) => a.order - b.order);
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderSections(arrayMove(sections, oldIndex, newIndex));
  };

  const onFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const id = genId();
      const reader = new FileReader();
      reader.onload = () => setRfp((prev) => ({ ...prev, attachments: [...prev.attachments, { id, name: file.name, size: file.size, dataUrl: reader.result }] }));
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  const removeAttachment = (id) => setRfp((prev) => ({ ...prev, attachments: prev.attachments.filter((a) => a.id !== id) }));

  const inviteVendor = (name, email) => {
    const id = genId();
    setRfp((prev) => ({ ...prev, invitedVendors: [...prev.invitedVendors, { id, name, email }] }));
  };
  const removeVendor = (id) => setRfp((prev) => ({ ...prev, invitedVendors: prev.invitedVendors.filter((v) => v.id !== id), vendorResponses: { ...prev.vendorResponses, [id]: undefined } }));

  const saveVendorResponse = (vendorId, answers) => {
    setRfp((prev) => ({ ...prev, vendorResponses: { ...prev.vendorResponses, [vendorId]: answers } }));
    setVendorResponseModal(null);
  };

  const tabs = [
    { id: 'basic', labelKey: 'basicInfo' },
    { id: 'sections', labelKey: 'sectionsAndQuestions' },
    { id: 'repository', labelKey: 'contentRepository' },
    { id: 'attachments', labelKey: 'attachments' },
    { id: 'vendors', labelKey: 'vendors' },
    { id: 'preview', labelKey: 'preview' },
  ];
  const addRepositoryEntry = (questionText, answer, category) => {
    setContentRepository((prev) => [...prev, { id: genId(), questionText: questionText || '', answer: answer || '', category: category || '' }]);
  };
  const updateRepositoryEntry = (id, updates) => {
    setContentRepository((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };
  const deleteRepositoryEntry = (id) => setContentRepository((prev) => prev.filter((e) => e.id !== id));

  return (
    <div className={`min-h-full bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 ${isRtl ? 'rtl' : 'ltr'}`} dir={dir}>
      <header className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FiFileText className="w-8 h-8 text-[#4f3cc9]" />
              {t('rfp.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{rfp.basicInfo?.projectName || t('rfp.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('rfp.status')}:</label>
            <select
              value={rfp.status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {RFP_STATUSES.map((s) => (
                <option key={s} value={s}>{t(`rfp.${s}`)}</option>
              ))}
            </select>
          </div>
        </div>
        {!isDraft && <p className="mt-2 text-amber-600 dark:text-amber-400 text-sm">{t('rfp.editingLocked')}</p>}
        <nav className="flex flex-wrap gap-2 mt-4 border-b border-gray-200 dark:border-gray-600 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === tab.id ? 'bg-[#4f3cc9] text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              {t(`rfp.${tab.labelKey}`)}
            </button>
          ))}
        </nav>
      </header>

      {/* Basic Info */}
      {activeTab === 'basic' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('rfp.basicInfo')}</h2>
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.projectName')} <span className="text-red-500">*</span></label>
                <input type="text" value={rfp.basicInfo?.projectName ?? ''} onChange={(e) => setBasicInfo('projectName', e.target.value)} disabled={!isEditable} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4f3cc9] disabled:opacity-70" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.department')}</label>
                <input type="text" value={rfp.basicInfo?.department ?? ''} onChange={(e) => setBasicInfo('department', e.target.value)} disabled={!isEditable} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4f3cc9] disabled:opacity-70" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.objective')} <span className="text-red-500">*</span></label>
              <textarea value={rfp.basicInfo?.objective ?? ''} onChange={(e) => setBasicInfo('objective', e.target.value)} rows={4} disabled={!isEditable} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4f3cc9] disabled:opacity-70" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.budgetRange')}</label>
                <input type="text" value={rfp.basicInfo?.budgetRange ?? ''} onChange={(e) => setBasicInfo('budgetRange', e.target.value)} disabled={!isEditable} placeholder="e.g. $50,000 - $75,000" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4f3cc9] disabled:opacity-70" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.submissionDeadline')}</label>
                <input type="date" value={rfp.basicInfo?.submissionDeadline ?? ''} onChange={(e) => setBasicInfo('submissionDeadline', e.target.value)} disabled={!isEditable} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4f3cc9] disabled:opacity-70" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.timelineStart')}</label>
                <input type="date" value={rfp.basicInfo?.timelineStart ?? ''} onChange={(e) => setBasicInfo('timelineStart', e.target.value)} disabled={!isEditable} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4f3cc9] disabled:opacity-70" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.timelineEnd')}</label>
                <input type="date" value={rfp.basicInfo?.timelineEnd ?? ''} onChange={(e) => setBasicInfo('timelineEnd', e.target.value)} disabled={!isEditable} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4f3cc9] disabled:opacity-70" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.vendorRequirements')}</label>
              <textarea value={rfp.basicInfo?.vendorRequirements ?? ''} onChange={(e) => setBasicInfo('vendorRequirements', e.target.value)} rows={3} disabled={!isEditable} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4f3cc9] disabled:opacity-70" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.evaluationCriteria')}</label>
              <textarea value={rfp.basicInfo?.evaluationCriteria ?? ''} onChange={(e) => setBasicInfo('evaluationCriteria', e.target.value)} rows={3} disabled={!isEditable} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4f3cc9] disabled:opacity-70" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.contactPerson')}</label>
                <input type="text" value={rfp.basicInfo?.contactPerson ?? ''} onChange={(e) => setBasicInfo('contactPerson', e.target.value)} disabled={!isEditable} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4f3cc9] disabled:opacity-70" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.contactEmail')}</label>
                <input type="email" value={rfp.basicInfo?.contactEmail ?? ''} onChange={(e) => setBasicInfo('contactEmail', e.target.value)} disabled={!isEditable} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4f3cc9] disabled:opacity-70" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.additionalNotes')}</label>
              <textarea value={rfp.basicInfo?.additionalNotes ?? ''} onChange={(e) => setBasicInfo('additionalNotes', e.target.value)} rows={3} disabled={!isEditable} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4f3cc9] disabled:opacity-70" />
            </div>
          </form>
        </div>
      )}

      {/* Sections & Questions */}
      {activeTab === 'sections' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('rfp.sectionsAndQuestions')}</h2>
            {isEditable && (
              <button type="button" onClick={() => setSectionModal({ mode: 'add' })} className="inline-flex items-center gap-2 px-4 py-2 bg-[#4f3cc9] text-white rounded-xl hover:bg-[#4330a8]">
                <FiPlus className="w-5 h-5" /> {t('rfp.addSection')}
              </button>
            )}
          </div>
          <div className="p-6">
            {rfp.sections.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 py-4">{t('rfp.noSections')}</p>
            ) : (
              <DndContext sensors={useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                <SortableContext items={[...rfp.sections].sort((a, b) => a.order - b.order).map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {[...rfp.sections].sort((a, b) => a.order - b.order).map((section) => (
                      <SortableSectionItem
                        key={section.id}
                        section={section}
                        questions={rfp.questions}
                        isEditable={isEditable}
                        onEditSection={(s) => setSectionModal({ mode: 'edit', section: s })}
                        onDeleteSection={deleteSection}
                        onAddQuestion={(sectionId) => setQuestionModal({ mode: 'add', sectionId })}
                        onEditQuestion={(q) => setQuestionModal({ mode: 'edit', question: q })}
                        onDeleteQuestion={deleteQuestion}
                        onReorderQuestions={reorderQuestions}
                        onSetSectionDepartment={setSectionDepartment}
                        onSetSectionStatus={setSectionStatus}
                        t={t}
                        isRtl={isRtl}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      )}

      {/* Content Repository */}
      {activeTab === 'repository' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('rfp.contentRepository')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('rfp.contentRepositoryDesc')}</p>
          </div>
          <div className="p-6">
            <ContentRepositoryEditor entries={contentRepository} onAdd={addRepositoryEntry} onUpdate={updateRepositoryEntry} onDelete={deleteRepositoryEntry} t={t} />
          </div>
        </div>
      )}

      {/* Attachments */}
      {activeTab === 'attachments' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('rfp.attachments')}</h2>
            {isEditable && (
              <>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.xlsx,.xls,.doc,.docx,.txt,image/*" className="hidden" onChange={onFileUpload} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 bg-[#4f3cc9] text-white rounded-xl hover:bg-[#4330a8]">
                  <FiUpload className="w-5 h-5" /> {t('rfp.uploadAttachments')}
                </button>
              </>
            )}
          </div>
          <div className="p-6">
            {rfp.attachments.length === 0 ? <p className="text-gray-500 dark:text-gray-400 py-4">{t('rfp.noAttachments')}</p> : (
              <ul className="space-y-2">
                {rfp.attachments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <span className="text-gray-900 dark:text-white truncate">{a.name}</span>
                    <span className="text-sm text-gray-500">{(a.size / 1024).toFixed(1)} KB</span>
                    {isEditable && (
                      <button type="button" onClick={() => removeAttachment(a.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Vendors */}
      {activeTab === 'vendors' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('rfp.vendors')}</h2>
          </div>
          <div className="p-6 space-y-6">
            {isEditable && <InviteVendorForm onInvite={inviteVendor} t={t} />}
            {rfp.invitedVendors.length === 0 ? <p className="text-gray-500 dark:text-gray-400 py-4">{t('rfp.noVendors')}</p> : (
              <ul className="space-y-3">
                {rfp.invitedVendors.map((v) => (
                  <li key={v.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{v.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{v.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setVendorResponseModal(v)} className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                        <FiSend className="w-4 h-4" /> {Object.keys(rfp.vendorResponses[v.id] || {}).length ? t('rfp.viewResponse') : t('rfp.submitResponse')}
                      </button>
                      {isEditable && (
                        <button type="button" onClick={() => removeVendor(v.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Preview & Download */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className={`flex ${isRtl ? 'flex-row-reverse' : ''} gap-3 flex-wrap`}>
            <button type="button" onClick={() => handleDownload()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4f3cc9] text-white font-semibold rounded-xl hover:bg-[#4330a8]">
              <FiDownload className="w-5 h-5" /> {t('rfp.download')}
            </button>
            <button type="button" onClick={() => handleDownloadExcel()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700">
              <FiDownload className="w-5 h-5" /> {t('rfp.downloadExcel')}
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div ref={printRef} className="p-8 md:p-12 text-gray-900 dark:text-gray-100 space-y-8">
              <div className="border-b-2 border-[#4f3cc9] pb-4">
                <h1 className="text-2xl font-bold">REQUEST FOR PROPOSAL</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{rfp.basicInfo?.projectName || '—'}</p>
                <p className="text-sm text-gray-500 mt-1">{t('rfp.status')}: {t(`rfp.${rfp.status}`)}</p>
              </div>
              <section>
                <h2 className="text-lg font-semibold text-[#4f3cc9] mb-2">1. Project / Initiative</h2>
                <p className="text-gray-700 dark:text-gray-300">{rfp.basicInfo?.projectName || '—'}</p>
                {rfp.basicInfo?.department && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Department: {rfp.basicInfo.department}</p>}
              </section>
              <section>
                <h2 className="text-lg font-semibold text-[#4f3cc9] mb-2">2. Objective & Scope</h2>
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{rfp.basicInfo?.objective || '—'}</p>
              </section>
              <section>
                <h2 className="text-lg font-semibold text-[#4f3cc9] mb-2">3. Budget & Timeline</h2>
                <p><span className="font-medium">Budget range:</span> {rfp.basicInfo?.budgetRange || '—'}</p>
                <p className="mt-1"><span className="font-medium">Start date:</span> {rfp.basicInfo?.timelineStart || '—'}</p>
                <p><span className="font-medium">End date:</span> {rfp.basicInfo?.timelineEnd || '—'}</p>
                <p className="mt-1"><span className="font-medium">Submission deadline:</span> {rfp.basicInfo?.submissionDeadline || '—'}</p>
              </section>
              {[...rfp.sections].sort((a, b) => a.order - b.order).map((sec, idx) => (
                <section key={sec.id}>
                  <h2 className="text-lg font-semibold text-[#4f3cc9] mb-2">{idx + 4}. {sec.title}</h2>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {rfp.questions.filter((q) => q.sectionId === sec.id).sort((a, b) => a.order - b.order).map((q) => (
                      <li key={q.id}>{q.text} {q.required && '*'}</li>
                    ))}
                  </ul>
                </section>
              ))}
              <section>
                <h2 className="text-lg font-semibold text-[#4f3cc9] mb-2">Vendor Requirements & Evaluation</h2>
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{rfp.basicInfo?.vendorRequirements || '—'}</p>
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 mt-2">{rfp.basicInfo?.evaluationCriteria || '—'}</p>
              </section>
              {rfp.basicInfo?.additionalNotes && (
                <section>
                  <h2 className="text-lg font-semibold text-[#4f3cc9] mb-2">Additional Notes</h2>
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{rfp.basicInfo.additionalNotes}</p>
                </section>
              )}
              <section className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-[#4f3cc9] mb-2">Contact</h2>
                <p><span className="font-medium">Name:</span> {rfp.basicInfo?.contactPerson || '—'}</p>
                <p><span className="font-medium">Email:</span> {rfp.basicInfo?.contactEmail || '—'}</p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Section modal */}
      {sectionModal && (
        <SectionModal
          mode={sectionModal.mode}
          section={sectionModal.section}
          onSave={(title) => sectionModal.mode === 'add' ? addSection(title) : updateSection(sectionModal.section.id, { title })}
          onClose={() => setSectionModal(null)}
          t={t}
        />
      )}

      {/* Question modal */}
      {questionModal && (
        <QuestionModal
          mode={questionModal.mode}
          question={questionModal.question}
          sectionId={questionModal.sectionId}
          onSave={(data) => questionModal.mode === 'add' ? addQuestion(questionModal.sectionId, data) : updateQuestion(questionModal.question.id, data)}
          onClose={() => setQuestionModal(null)}
          t={t}
        />
      )}

      {/* Vendor response modal */}
      {vendorResponseModal && (
        <VendorResponseModal
          vendor={vendorResponseModal}
          questions={rfp.questions}
          sections={rfp.sections}
          initialAnswers={rfp.vendorResponses[vendorResponseModal.id] || {}}
          contentRepository={contentRepository}
          onSave={(answers) => saveVendorResponse(vendorResponseModal.id, answers)}
          onClose={() => setVendorResponseModal(null)}
          t={t}
        />
      )}
    </div>
  );

  function handleDownload() {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>RFP - ${rfp.basicInfo?.projectName || 'Request for Proposal'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { border-bottom: 2px solid #333; padding-bottom: 8px; }
            h2 { margin-top: 24px; color: #444; }
            .section { margin-bottom: 20px; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    }, 250);
  }

  function handleDownloadExcel() {
    const wb = XLSX.utils.book_new();
    const basic = rfp.basicInfo || {};
    const basicData = [
      ['Field', 'Value'],
      ['Project / Initiative', basic.projectName || ''],
      ['Department', basic.department || ''],
      ['Objective / Scope', basic.objective || ''],
      ['Budget Range', basic.budgetRange || ''],
      ['Start Date', basic.timelineStart || ''],
      ['End Date', basic.timelineEnd || ''],
      ['Submission Deadline', basic.submissionDeadline || ''],
      ['Vendor Requirements', basic.vendorRequirements || ''],
      ['Evaluation Criteria', basic.evaluationCriteria || ''],
      ['Contact Person', basic.contactPerson || ''],
      ['Contact Email', basic.contactEmail || ''],
      ['Additional Notes', basic.additionalNotes || ''],
      ['Status', rfp.status || ''],
    ];
    const wsBasic = XLSX.utils.aoa_to_sheet(basicData);
    XLSX.utils.book_append_sheet(wb, wsBasic, 'Basic Info');

    const sectionRows = [['Section', 'Question', 'Answer Type', 'Required', 'Weight']];
    [...(rfp.sections || [])].sort((a, b) => a.order - b.order).forEach((sec) => {
      const qs = [...(rfp.questions || [])].filter((q) => q.sectionId === sec.id).sort((a, b) => a.order - b.order);
      qs.forEach((q, i) => {
        sectionRows.push([
          i === 0 ? sec.title : '',
          q.text || '',
          q.answerType || 'text',
          q.required ? 'Yes' : 'No',
          q.weight != null && q.weight !== '' ? String(q.weight) : '',
        ]);
      });
    });
    const wsSections = XLSX.utils.aoa_to_sheet(sectionRows);
    XLSX.utils.book_append_sheet(wb, wsSections, 'Sections & Questions');

    if ((rfp.invitedVendors || []).length > 0) {
      const vendorRows = [['Vendor Name', 'Email']];
      rfp.invitedVendors.forEach((v) => vendorRows.push([v.name || '', v.email || '']));
      const wsVendors = XLSX.utils.aoa_to_sheet(vendorRows);
      XLSX.utils.book_append_sheet(wb, wsVendors, 'Vendors');
    }

    const fileName = `RFP_${(basic.projectName || 'Export').replace(/[^a-zA-Z0-9-_]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
}

function ContentRepositoryEditor({ entries, onAdd, onUpdate, onDelete, t }) {
  const [questionText, setQuestionText] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const handleAdd = (e) => {
    e.preventDefault();
    if (questionText.trim() || answer.trim()) {
      onAdd(questionText.trim(), answer.trim(), category.trim());
      setQuestionText('');
      setAnswer('');
      setCategory('');
    }
  };
  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 space-y-3">
        <h3 className="font-medium text-gray-900 dark:text-white">{t('rfp.addEntry')}</h3>
        <input type="text" value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder={t('rfp.questionPlaceholder')} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2} placeholder={t('rfp.answerPlaceholder')} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('rfp.categoryOptional')} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        <button type="submit" className="px-4 py-2 rounded-xl bg-[#4f3cc9] text-white hover:bg-[#4330a8] font-medium">{t('rfp.addEntry')}</button>
      </form>
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Saved entries</h3>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4">{t('rfp.noRepositoryEntries')}</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id} className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50">
                <div className="flex-1 min-w-0">
                  {editingId === e.id ? (
                    <>
                      <input type="text" defaultValue={e.questionText} onBlur={(ev) => onUpdate(e.id, { questionText: ev.target.value })} className="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm mb-2" />
                      <textarea defaultValue={e.answer} onBlur={(ev) => onUpdate(e.id, { answer: ev.target.value })} rows={2} className="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{e.questionText}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{e.answer}</p>
                      {e.category && <span className="text-xs text-gray-500 mt-1 inline-block">{e.category}</span>}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingId(editingId === e.id ? null : e.id)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded">{editingId === e.id ? 'Done' : <FiEdit2 className="w-4 h-4" />}</button>
                  <button type="button" onClick={() => onDelete(e.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><FiTrash2 className="w-4 h-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SectionModal({ mode, section, onSave, onClose, t }) {
  const [title, setTitle] = useState(section?.title ?? '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{mode === 'add' ? t('rfp.addSection') : t('rfp.editSection')}</h3>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('rfp.sectionTitle')} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4" autoFocus />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button type="button" onClick={() => onSave(title)} className="px-4 py-2 rounded-xl bg-[#4f3cc9] text-white hover:bg-[#4330a8]">Save</button>
        </div>
      </div>
    </div>
  );
}

function QuestionModal({ mode, question, sectionId, onSave, onClose, t }) {
  const [text, setText] = useState(question?.text ?? '');
  const [answerType, setAnswerType] = useState(question?.answerType ?? 'text');
  const [required, setRequired] = useState(question?.required ?? false);
  const [weight, setWeight] = useState(question?.weight ?? '');
  const [choicesText, setChoicesText] = useState((question?.choices || []).join('\n'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{mode === 'add' ? t('rfp.addQuestion') : t('rfp.editQuestion')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.questionText')}</label>
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('rfp.questionText')} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.answerType')}</label>
            <select value={answerType} onChange={(e) => setAnswerType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              {ANSWER_TYPES.map((a) => (
                <option key={a.value} value={a.value}>{t(`rfp.${a.labelKey}`)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="q-required" checked={required} onChange={(e) => setRequired(e.target.checked)} className="rounded border-gray-300 text-[#4f3cc9]" />
            <label htmlFor="q-required" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('rfp.required')}</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.weight')}</label>
            <input type="text" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 10" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          {answerType === 'multipleChoice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.choices')}</label>
              <textarea value={choicesText} onChange={(e) => setChoicesText(e.target.value)} rows={4} placeholder="Option A&#10;Option B" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button type="button" onClick={() => onSave({ text, answerType, required, weight: weight.trim(), choices: choicesText.split('\n').map((s) => s.trim()).filter(Boolean) })} className="px-4 py-2 rounded-xl bg-[#4f3cc9] text-white hover:bg-[#4330a8]">Save</button>
        </div>
      </div>
    </div>
  );
}

function InviteVendorForm({ onInvite, t }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      onInvite(name.trim(), email.trim());
      setName('');
      setEmail('');
    }
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
      <div className="flex-1 min-w-[180px]">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.vendorName')}</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('rfp.vendorName')} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
      </div>
      <div className="flex-1 min-w-[180px]">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('rfp.vendorEmail')}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('rfp.vendorEmail')} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
      </div>
      <button type="submit" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4f3cc9] text-white rounded-xl hover:bg-[#4330a8]">
        <FiUserPlus className="w-5 h-5" /> {t('rfp.inviteVendor')}
      </button>
    </form>
  );
}

function VendorResponseModal({ vendor, questions, sections, initialAnswers, contentRepository, onSave, onClose, t }) {
  const [answers, setAnswers] = useState(initialAnswers);
  const sectionsSorted = [...(sections || [])].sort((a, b) => a.order - b.order);
  const getQuestionInput = (q) => {
    const value = answers[q.id] ?? '';
    const setValue = (v) => setAnswers((prev) => ({ ...prev, [q.id]: v }));
    const repoMatch = findRepositoryMatch(q.text, contentRepository);
    const applyFromRepository = () => { if (repoMatch) setValue(repoMatch.answer); };
    const inputClass = 'w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white';
    switch (q.answerType) {
      case 'longText':
        return (
          <div>
            <textarea value={value} onChange={(e) => setValue(e.target.value)} onFocus={applyFromRepository} rows={3} className={inputClass} />
            {repoMatch && <button type="button" onClick={applyFromRepository} className="mt-1 text-xs text-[#4f3cc9] hover:underline">{t('rfp.insertFromRepository')}</button>}
          </div>
        );
      case 'yesNo':
        return (
          <select value={value} onChange={(e) => setValue(e.target.value)} className={inputClass}>
            <option value="">—</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        );
      case 'number':
        return <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} />;
      case 'multipleChoice':
        const opts = q.choices || [];
        return (
          <select value={value} onChange={(e) => setValue(e.target.value)} className={inputClass}>
            <option value="">—</option>
            {opts.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        );
      case 'file':
        return (
          <div>
            <input type="file" onChange={(e) => setValue(e.target.files?.[0]?.name || '')} className={inputClass} />
            {value && <p className="text-xs text-gray-500 mt-1">Selected: {value}</p>}
          </div>
        );
      default:
        return (
          <div>
            <input type="text" value={value} onChange={(e) => setValue(e.target.value)} onFocus={applyFromRepository} className={inputClass} />
            {repoMatch && <button type="button" onClick={applyFromRepository} className="mt-1 text-xs text-[#4f3cc9] hover:underline">{t('rfp.insertFromRepository')}</button>}
          </div>
        );
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('rfp.submitResponse')} – {vendor.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('rfp.fromRepository')}: focus a field to auto-fill from the content repository, or click “{t('rfp.insertFromRepository')}”.</p>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {sectionsSorted.map((sec) => {
            const secQuestions = questions.filter((q) => q.sectionId === sec.id).sort((a, b) => a.order - b.order);
            if (secQuestions.length === 0) return null;
            return (
              <div key={sec.id}>
                <h4 className="font-medium text-[#4f3cc9] mb-3">{sec.title}</h4>
                <ul className="space-y-3">
                  {secQuestions.map((q) => (
                    <li key={q.id}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{q.text} {q.required && <span className="text-red-500">*</span>}</label>
                      {getQuestionInput(q)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button type="button" onClick={() => onSave(answers)} className="px-4 py-2 rounded-xl bg-[#4f3cc9] text-white hover:bg-[#4330a8]">Save Response</button>
        </div>
      </div>
    </div>
  );
}

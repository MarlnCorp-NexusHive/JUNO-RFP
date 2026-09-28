import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocalization } from "../../../hooks/useLocalization";
import { getTrialSession } from "../../../services/trialAuthSession.js";
import TrialChangePasswordModal from "../../proposal-manager/components/TrialChangePasswordModal.jsx";
import { 
  FiHome,
  FiBookOpen, 
  FiShield, 
  FiBell, 
  FiLock, 
  FiEdit3, 
  FiSave, 
  FiX
} from "react-icons/fi";


export default function DirectorSettings() {
  const location = useLocation();
  const isPM = location.pathname.includes("/rbac/proposal-manager/settings");
  const user = JSON.parse(localStorage.getItem('rbac_current_user') || "null");
  const trialSession = getTrialSession();
  const isTrialUser = Boolean(trialSession?.token || user?.isTrialUser);
  const signupCompany =
    trialSession?.tenantName ||
    user?.tenantName ||
    "";
  const signupContactName =
    trialSession?.user?.name ||
    user?.name ||
    "";
  const [editingField, setEditingField] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const { t, i18n } = useTranslation('director');
  const { t: tCommon } = useTranslation("common");
  const { isRTLMode } = useLocalization();
  const isArabic = String(i18n?.resolvedLanguage || i18n?.language || "").toLowerCase().startsWith("ar");
  const pmText = (value) => {
    if (!isPM || !isArabic) return value;
    const map = {
      "Proposal Manager Settings": "إعدادات مدير العروض",
      "Profile, notifications, and proposal preferences.": "الملف الشخصي، الإشعارات، وتفضيلات العروض.",
      "Save Changes": "حفظ التغييرات",
      Cancel: "إلغاء",
      "Export Settings": "تصدير الإعدادات",
      "Settings Categories": "فئات الإعدادات",
      "Organization information and basic configuration": "معلومات المؤسسة والإعدادات الأساسية",
      "Business policies and fiscal year configuration": "سياسات العمل وإعدادات السنة المالية",
      "User access permissions and role management": "صلاحيات وصول المستخدمين وإدارة الأدوار",
      "Notification preferences and alert settings": "تفضيلات الإشعارات وإعدادات التنبيهات",
      "Data protection and security settings": "إعدادات حماية البيانات والأمان",
      "Enable or disable this feature": "تفعيل أو تعطيل هذه الميزة",
      "Manage user access permissions": "إدارة صلاحيات وصول المستخدمين",
      "Set percentage value (0-100)": "تحديد قيمة النسبة المئوية (0-100)",
      "Configure this setting": "تهيئة هذا الإعداد",
      "Full Access": "وصول كامل",
      Corporation: "مؤسسة",
      Company: "شركة",
      Organization: "منظمة",
      Enterprise: "منشأة",
      Quarter: "ربع سنوي",
      Monthly: "شهري",
      Annual: "سنوي",
      "Project-based": "قائم على المشاريع",
      "1 Year": "سنة واحدة",
      "3 Years": "3 سنوات",
      "5 Years": "5 سنوات",
      "10 Years": "10 سنوات",
      Permanent: "دائم",
      Enabled: "مفعل",
      Disabled: "معطل",
    };
    return map[value] || value;
  };

  const getOptionValue = (option) => {
    if (isPM) {
      if (option.valueKey === "institutionalSettings.nameValue" && signupCompany) {
        return signupCompany;
      }
      if (option.valueKey === "institutionalSettings.contactNameValue" && signupContactName) {
        return signupContactName;
      }
      if (option.valueKey === "institutionalSettings.contactEmailValue") {
        const email = trialSession?.user?.email || user?.email || user?.username || "";
        if (email) return email;
      }
    }
    return t(`settings.${option.valueKey}`);
  };
  
  // Settings categories using translation keys
  const settingsCategories = useMemo(() => {
    const institutionalOptions = [
      { 
        labelKey: "institutionalSettings.name", 
        valueKey: "institutionalSettings.nameValue",
        type: "text",
        editable: true,
        required: true
      },
      ...(isPM
        ? [
            {
              labelKey: "institutionalSettings.contactName",
              valueKey: "institutionalSettings.contactNameValue",
              type: "text",
              editable: true,
            },
            {
              labelKey: "institutionalSettings.contactEmail",
              valueKey: "institutionalSettings.contactEmailValue",
              type: "text",
              editable: true,
            },
          ]
        : []),
      ...(isPM
        ? [
            {
              labelKey: "institutionalSettings.academicYear",
              valueKey: "institutionalSettings.academicYearValue",
              type: "date",
              editable: true,
            },
          ]
        : [
            {
              labelKey: "institutionalSettings.type",
              valueKey: "institutionalSettings.typeValue",
              type: "select",
              editable: true,
              options: ["Corporation", "Company", "Organization", "Enterprise"],
            },
            {
              labelKey: "institutionalSettings.accreditation",
              valueKey: "institutionalSettings.accreditationValue",
              type: "text",
              editable: true,
            },
            {
              labelKey: "institutionalSettings.academicYear",
              valueKey: "institutionalSettings.academicYearValue",
              type: "date",
              editable: true,
            },
          ]),
    ];

    const institutional = {
      nameKey: "categories.institutional",
      name: "institutional",
      icon: FiHome,
      color: "blue",
      description: "Organization information and basic configuration",
      options: institutionalOptions,
    };

    if (isPM) {
      return [institutional];
    }

    return [
    institutional,
    {
      nameKey: "categories.academic",
      name: "academic",
      icon: FiBookOpen,
      color: "green",
      description: "Business policies and fiscal year configuration",
      options: [
        { 
          labelKey: "academicConfiguration.semesterSystem", 
          valueKey: "academicConfiguration.semesterSystemValue",
          type: "select",
          editable: true,
          options: ["Quarter", "Monthly", "Annual", "Project-based"]
        },
        { 
          labelKey: "academicConfiguration.creditTransfer", 
          valueKey: "academicConfiguration.creditTransferValue",
          type: "toggle",
          editable: true
        },
        { 
          labelKey: "academicConfiguration.attendancePolicy", 
          valueKey: "academicConfiguration.attendancePolicyValue",
          type: "percentage",
          editable: true
        },
      ],
    },
    {
      nameKey: "categories.access",
      name: "access",
      icon: FiShield,
      color: "purple",
      description: "User access permissions and role management",
      options: [
        { 
          labelKey: "accessPermissions.director", 
          valueKey: "accessPermissions.directorValue",
          type: "permissions",
          editable: true
        },
        { 
          labelKey: "accessPermissions.dean", 
          valueKey: "accessPermissions.deanValue",
          type: "permissions",
          editable: true
        },
        { 
          labelKey: "accessPermissions.hod", 
          valueKey: "accessPermissions.hodValue",
          type: "permissions",
          editable: true
        },
        { 
          labelKey: "accessPermissions.faculty", 
          valueKey: "accessPermissions.facultyValue",
          type: "permissions",
          editable: true
        },
      ],
    },
    {
      nameKey: "categories.notifications",
      name: "notifications",
      icon: FiBell,
      color: "orange",
      description: "Notification preferences and alert settings",
      options: [
        { 
          labelKey: "notifications.pushNotifications", 
          valueKey: "notifications.pushNotificationsValue",
          type: "toggle",
          editable: true
        },
        { 
          labelKey: "notifications.emailAlerts", 
          valueKey: "notifications.emailAlertsValue",
          type: "toggle",
          editable: true
        },
        { 
          labelKey: "notifications.smsAlerts", 
          valueKey: "notifications.smsAlertsValue",
          type: "toggle",
          editable: true
        },
      ],
    },
    {
      nameKey: "categories.dataPrivacy",
      name: "dataPrivacy",
      icon: FiLock,
      color: "red",
      description: "Data protection and security settings",
      options: [
        { 
          labelKey: "dataPrivacy.dataRetention", 
          valueKey: "dataPrivacy.dataRetentionValue",
          type: "select",
          editable: true,
          options: ["1 Year", "3 Years", "5 Years", "10 Years", "Permanent"]
        },
        { 
          labelKey: "dataPrivacy.encryption", 
          valueKey: "dataPrivacy.encryptionValue",
          type: "toggle",
          editable: true
        },
        { 
          labelKey: "dataPrivacy.twoFactorAuth", 
          valueKey: "dataPrivacy.twoFactorAuthValue",
          type: "toggle",
          editable: true
        },
      ],
    },
  ];
  }, [isPM]);
  const getCategoryIcon = (category) => {
    const IconComponent = category.icon;
    return <IconComponent className="w-5 h-5" />;
  };

  const handleEdit = (fieldKey) => {
    setEditingField(fieldKey);
    setHasChanges(true);
  };

  const handleSave = () => {
    setEditingField(null);
    setHasChanges(false);
    // Here you would typically save the changes to your backend
  };

  const handleCancel = () => {
    setEditingField(null);
    setHasChanges(false);
  };

  const renderFieldValue = (option) => {
    const displayValue = getOptionValue(option);
    if (editingField === option.labelKey) {
      switch(option.type) {
        case 'text':
          return (
            <input 
              type="text" 
              defaultValue={displayValue}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          );
        case 'select':
          return (
            <select 
              defaultValue={displayValue}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {option.options?.map(opt => (
                <option key={opt} value={opt}>{pmText(opt)}</option>
              ))}
            </select>
          );
        case 'toggle':
          return (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked={["Enabled", "مفعل", "مفعلة"].includes(displayValue)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          );
        case 'percentage':
          return (
            <input 
              type="number" 
              min="0" 
              max="100" 
              defaultValue={String(displayValue).replace('%', '')}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-20"
            />
          );
        case 'date':
          return (
            <input 
              type="date" 
              defaultValue={displayValue}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          );
        case 'permissions':
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">{pmText("Full Access")}</span>
              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                <FiEdit3 className="w-4 h-4" />
              </button>
            </div>
          );
        default:
          return <span className="text-sm text-gray-600 dark:text-gray-300">{displayValue}</span>;
      }
    } else {
      switch(option.type) {
        case 'toggle':
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              ["Enabled", "مفعل", "مفعلة"].includes(displayValue)
                ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' 
                : 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {displayValue}
            </span>
          );
        case 'permissions':
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">{pmText("Full Access")}</span>
              <button 
                onClick={() => handleEdit(option.labelKey)}
                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <FiEdit3 className="w-4 h-4" />
              </button>
            </div>
          );
        default:
          return <span className="text-sm text-gray-600 dark:text-gray-300">{displayValue}</span>;
      }
    }
  };

  return (
    <div className="w-full">
      <main className="w-full space-y-8">
        {hasChanges && (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <FiSave className="w-4 h-4" />
              {pmText("Save Changes")}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <FiX className="w-4 h-4" />
              {pmText("Cancel")}
            </button>
          </div>
        )}

        {/* Settings Options */}
        {settingsCategories.map((category, catIdx) => (
          <motion.section
            key={category.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + catIdx * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
            data-tour={catIdx === 0 ? "1" : undefined}
            data-tour-title-en={
              catIdx === 0
                ? isPM
                  ? "Organization"
                  : "Organization settings"
                : undefined
            }
            data-tour-title-ar={
              catIdx === 0 ? (isPM ? "المؤسسة" : "إعدادات المؤسسة") : undefined
            }
            data-tour-content-en={
              catIdx === 0
                ? isPM
                  ? "Your company name, contact name, and email come from trial signup. Other fields are optional organization details."
                  : "Review and adjust organization settings values."
                : undefined
            }
            data-tour-content-ar={
              catIdx === 0
                ? isPM
                  ? "اسم الشركة واسم جهة الاتصال والبريد تأتي من تسجيل التجربة. الحقول الأخرى اختيارية."
                  : "راجع وعدّل قيم إعدادات المؤسسة."
                : undefined
            }
            data-tour-position={catIdx === 0 ? "bottom" : undefined}
          >
            <div className="flex items-center gap-3 mb-6">
              {getCategoryIcon(category)}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t(`settings.${category.nameKey}`)}
                </h2>
              </div>
            </div>
            
            <div className="space-y-4">
              {category.options.map((opt, idx) => {
                const isSignupField =
                  isPM &&
                  (opt.valueKey === "institutionalSettings.nameValue" ||
                    opt.valueKey === "institutionalSettings.contactNameValue" ||
                    opt.valueKey === "institutionalSettings.contactEmailValue");
                const tourAttrs =
                  isSignupField && opt.valueKey === "institutionalSettings.nameValue"
                    ? {
                        "data-tour": "2",
                        "data-tour-title-en": "Company name",
                        "data-tour-title-ar": "اسم الشركة",
                        "data-tour-content-en":
                          "This is the company name you entered when creating your trial account.",
                        "data-tour-content-ar":
                          "هذا هو اسم الشركة الذي أدخلته عند إنشاء حساب التجربة.",
                        "data-tour-position": "bottom",
                      }
                    : isSignupField &&
                        opt.valueKey === "institutionalSettings.contactNameValue"
                      ? {
                          "data-tour": "3",
                          "data-tour-title-en": "Contact name",
                          "data-tour-title-ar": "اسم جهة الاتصال",
                          "data-tour-content-en":
                            "Your signup name appears here for this trial workspace.",
                          "data-tour-content-ar":
                            "يظهر هنا الاسم الذي سجّلت به في مساحة عمل التجربة.",
                          "data-tour-position": "bottom",
                        }
                      : isSignupField &&
                          opt.valueKey === "institutionalSettings.contactEmailValue"
                        ? {
                            "data-tour": "4",
                            "data-tour-title-en": "Contact email",
                            "data-tour-title-ar": "بريد جهة الاتصال",
                            "data-tour-content-en":
                              "The work email used for trial login and confirmation.",
                            "data-tour-content-ar":
                              "البريد المهني المستخدم لتسجيل الدخول وتأكيد التجربة.",
                            "data-tour-position": "bottom",
                          }
                        : {};

                return (
                <div
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
                  {...tourAttrs}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {t(`settings.${opt.labelKey}`)}
                        </h3>
                        {opt.required && (
                          <span className="text-red-500 text-sm">*</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {renderFieldValue(opt)}
                        {!editingField && opt.editable && (
                          <button 
                            onClick={() => handleEdit(opt.labelKey)}
                            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
              {isPM && isTrialUser && catIdx === 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {tCommon("proposalManagerTrial.changePassword")}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {tCommon("proposalManagerTrial.changePasswordHint")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPwOpen(true)}
                      className="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-100 dark:hover:bg-indigo-900"
                    >
                      {tCommon("proposalManagerTrial.changePassword")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        ))}
      </main>
      {isPM && isTrialUser && (
        <TrialChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
      )}
    </div>
  );
}
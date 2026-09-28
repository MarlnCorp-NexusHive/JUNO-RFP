import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '../hooks/useLocalization';
import { 
  FiUsers, FiBarChart2, FiSearch, FiShield,
  FiCheckCircle, FiFileText, FiCpu
} from 'react-icons/fi';

export default function CorporateInfo() {
  const navigate = useNavigate();
  const { t, i18n, ready } = useTranslation('university');
  const { isRTLMode } = useLocalization();
  const [activeTab, setActiveTab] = useState('overview');
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [languageVersion, setLanguageVersion] = useState(0);

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguageVersion(prev => prev + 1);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const handleBack = () => {
    navigate(-1);
  };

  // Show loading state while translations are loading
  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      title: t('marlnCrm.features.opportunityDiscovery.title'),
      description: t('marlnCrm.features.opportunityDiscovery.description'),
      icon: FiSearch,
      benefits: t('marlnCrm.features.opportunityDiscovery.benefits', { returnObjects: true }),
      color: "blue"
    },
    {
      title: t('marlnCrm.features.proposalWorkspace.title'),
      description: t('marlnCrm.features.proposalWorkspace.description'),
      icon: FiFileText,
      benefits: t('marlnCrm.features.proposalWorkspace.benefits', { returnObjects: true }),
      color: "indigo"
    },
    {
      title: t('marlnCrm.features.teamCollaboration.title'),
      description: t('marlnCrm.features.teamCollaboration.description'),
      icon: FiUsers,
      benefits: t('marlnCrm.features.teamCollaboration.benefits', { returnObjects: true }),
      color: "orange"
    },
    {
      title: t('marlnCrm.features.marketIntelligence.title'),
      description: t('marlnCrm.features.marketIntelligence.description'),
      icon: FiBarChart2,
      benefits: t('marlnCrm.features.marketIntelligence.benefits', { returnObjects: true }),
      color: "green"
    },
    {
      title: t('marlnCrm.features.technicalSolutioning.title'),
      description: t('marlnCrm.features.technicalSolutioning.description'),
      icon: FiCpu,
      benefits: t('marlnCrm.features.technicalSolutioning.benefits', { returnObjects: true }),
      color: "purple"
    },
    {
      title: t('marlnCrm.features.compliancePricing.title'),
      description: t('marlnCrm.features.compliancePricing.description'),
      icon: FiShield,
      benefits: t('marlnCrm.features.compliancePricing.benefits', { returnObjects: true }),
      color: "pink"
    }
  ];

  const tabs = ['overview', 'features'];

  return (
    <div key={`${i18n.language}-${languageVersion}`} className={`min-h-screen bg-[#F6F7FA] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 ${isRTLMode ? 'rtl' : 'ltr'}`} dir={isRTLMode ? 'rtl' : 'ltr'}>
      {/* Header with Hero Section */}
      <div className="relative bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        {/* Hero Background */}
        <div className="relative h-96 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-4xl mx-auto px-4">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-7xl font-bold mb-6"
              >
                {t('marlnCrm.title')}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl md:text-2xl mb-8 text-blue-100"
              >
                {t('marlnCrm.subtitle')}
              </motion.p>
            </div>
          </div>
        </div>
        
        {/* Header Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={`flex items-center justify-between ${isRTLMode ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center space-x-4 ${isRTLMode ? 'space-x-reverse' : ''}`}>
              <button
                onClick={handleBack}
                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <svg className={`w-6 h-6 ${isRTLMode ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className={`flex items-center space-x-4 ${isRTLMode ? 'space-x-reverse' : ''}`}>
                <img
                  src="/juno-rfp-logo.png"
                  alt="JUNO RFP"
                  className="h-16 w-auto max-w-[10rem] object-contain"
                />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('marlnCrm.aiPowered')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Completely separate with solid background */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={`flex ${isRTLMode ? 'space-x-reverse space-x-1' : 'space-x-1'} bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg`}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t(`marlnCrm.tabs.${tab}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content with Background Image - Completely separate section */}
      <div className="relative min-h-screen bg-white dark:bg-gray-800 overflow-hidden">
        {/* Background Image with Blur Effect - Only in this section */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://lms-frontend-resources.s3.ap-south-1.amazonaws.com/NexusHiveCRM/Image-2.png)',
            filter: 'blur(8px)',
            transform: 'scale(1.02)'
          }}
        ></div>
        
        {/* Overlay for better content readability */}
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"></div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-12 pt-8">
                {/* About Section */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 shadow-lg">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('marlnCrm.overview.title')}</h2>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      {t('marlnCrm.overview.description1')}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      {t('marlnCrm.overview.description2')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">AI-Powered</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Cloud-Based</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Secure</span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">Scalable</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-8 pt-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">{t('marlnCrm.features.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer ${
                        hoveredFeature === index ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onMouseEnter={() => setHoveredFeature(index)}
                      onMouseLeave={() => setHoveredFeature(null)}
                    >
                      <div className={`w-12 h-12 rounded-lg bg-${feature.color}-100 dark:bg-${feature.color}-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <feature.icon className={`w-6 h-6 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">{feature.description}</p>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <FiCheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
}
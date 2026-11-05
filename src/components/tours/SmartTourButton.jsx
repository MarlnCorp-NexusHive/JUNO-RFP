import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTour } from './TourContext';
import { useLocation } from 'react-router-dom';
import { getProposalManagerTourPage } from './data/proposalManagerTourPages.js';

const SmartTourButton = ({ 
  role, 
  expanded, 
  darkTheme, 
  onTourStart 
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { getTourStatus, startTour, handleTourComingSoon, isLoading } = useTour();
  const [isHovered, setIsHovered] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Add subtle glowing animation for available tours
  useEffect(() => {
    const currentPage = getCurrentPage();
    const tourStatus = getTourStatus(role, currentPage);
    
    if (tourStatus.available && !isLoading) {
      const interval = setInterval(() => {
        setPulseAnimation(true);
        setTimeout(() => setPulseAnimation(false), 1500);
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [role, location.pathname, isLoading]);

  // Extract current page from location
  const getCurrentPage = () => {
    const path = location.pathname;
    const segments = path.split('/');

    const pmPage = getProposalManagerTourPage(path);
    if (pmPage) return pmPage;
    
    // Handle different route patterns
    if (segments.includes('director')) {
      if (segments.includes('analytics')) return 'analytics';
      if (segments.includes('departments')) return 'departments';
      if (segments.includes('approvals')) return 'approvals';
      if (segments.includes('strategic-planning')) return 'strategic-planning';
      if (segments.includes('communication')) return 'communication';
      if (segments.includes('audit')) return 'audit';
      if (segments.includes('calendar')) return 'calendar';
      if (segments.includes('users')) return 'users';
      if (segments.includes('settings')) return 'settings';
      if (segments.includes('workspace')) return 'workspace';
      if (segments.includes('support')) return 'support';
      return 'dashboard'; // Default for director
    }
    
    if (segments.includes('marketing-head')) {
      if (segments.includes('analytics')) return 'analytics';
      if (segments.includes('campaigns')) return 'campaigns';
      if (segments.includes('leads')) return 'leads';
      if (segments.includes('resources')) return 'resources';
      if (segments.includes('communication')) return 'communication';
      if (segments.includes('training')) return 'training';
      if (segments.includes('content')) return 'content';
      if (segments.includes('social')) return 'social';
      if (segments.includes('events')) return 'events';
      if (segments.includes('budget')) return 'budget';
      if (segments.includes('team')) return 'team';
      if (segments.includes('settings')) return 'settings';
      if (segments.includes('workspace')) return 'workspace';
      if (segments.includes('support')) return 'support';
      return 'dashboard'; // Default for marketing-head
    }
    
    if (segments.includes('admission-head')) {
      if (segments.includes('leads')) return 'leads';
      if (segments.includes('applications')) return 'applications';
      if (segments.includes('schedule')) return 'schedule';
      if (segments.includes('communication')) return 'communication';
      if (segments.includes('payments')) return 'payments';
      if (segments.includes('documents')) return 'documents';
      if (segments.includes('search')) return 'search';
      if (segments.includes('tools')) return 'tools';
      if (segments.includes('workspace')) return 'workspace';
      if (segments.includes('lead-transfer')) return 'lead-transfer';
      if (segments.includes('courses')) return 'courses';
      if (segments.includes('training')) return 'training';
      if (segments.includes('compliance')) return 'compliance';
      if (segments.includes('support')) return 'support';
      return 'dashboard'; // Default for admission-head
    }
    
    return 'dashboard';
  };

  const currentPage = getCurrentPage();
  const tourStatus = getTourStatus(role, currentPage);
  const buttonLabel = tourStatus.available
    ? t("sidebar.startTour", { defaultValue: "Start Tour" })
    : tourStatus.text;

  // Handle button click
  const handleClick = () => {
    if (isLoading) return; // prevent multiple clicks while loading
    console.log('Tour button clicked!', { role, currentPage, tourStatus });
    
    if (tourStatus.available) {
      // Start tour
      console.log('Starting tour for:', role, currentPage);
      const success = startTour(role, currentPage);
      console.log('Tour start result:', success);
      if (success && onTourStart) {
        onTourStart(role, currentPage);
      }
    } else {
      // Show coming soon message
      console.log('Tour coming soon for:', role, currentPage);
      handleTourComingSoon();
    }
  };

  // Steel brand treatment — readable in light + dark, no candy yellow
  const getButtonStyles = () => {
    const layout = `flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-all duration-300 w-full active:scale-[0.98] ${
      expanded ? "justify-start" : "justify-center"
    }`;

    if (tourStatus.available) {
      const pulseRing = pulseAnimation
        ? darkTheme
          ? "ring-2 ring-[#B8C5D6]/35 shadow-[0_0_20px_rgba(184,197,214,0.25)]"
          : "ring-2 ring-[#3D4F66]/20 shadow-[0_8px_22px_rgba(61,79,102,0.28)]"
        : darkTheme
          ? "shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
          : "shadow-[0_6px_18px_rgba(61,79,102,0.22)]";

      return `${layout} ${pulseRing} ${
        darkTheme
          ? "bg-gradient-to-b from-[#8FA3B8] to-[#6B7F96] text-[#0B1017] hover:from-[#A8B8C9] hover:to-[#8FA3B8]"
          : "bg-gradient-to-b from-[#4A5F7A] to-[#3D4F66] text-white hover:from-[#5A708C] hover:to-[#4A5F7A]"
      }`;
    }

    return `${layout} opacity-75 hover:opacity-95 ${
      darkTheme
        ? "bg-[#1A2332] text-[#C5D0DE] border border-[#2A3548] hover:bg-[#243044]"
        : "bg-[#E8EEF4] text-[#3D4F66] border border-[#D0D8E2] hover:bg-[#DCE4ED]"
    }`;
  };

  // Get icon based on tour status with enhanced animations
  const getIcon = () => {
    if (isLoading) {
      return (
        <div className="relative">
          <svg width="20" height="20" viewBox="0 0 24 24" className="w-5 h-5 animate-spin">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" fill="none" />
          </svg>
        </div>
      );
    }
    
    if (tourStatus.available) {
      return (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="w-5 h-5">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="currentColor"
          />
        </svg>
      );
    }

    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="w-5 h-5 opacity-80">
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="currentColor"
        />
      </svg>
    );
  };

  return (
    <div className="relative w-full flex items-center justify-center">
      {/* Enhanced tooltip for collapsed mode */}
      {!expanded && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-50 shadow-xl whitespace-nowrap">
          {isLoading ? t("common.loading") : buttonLabel}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black" />
        </div>
      )}
      
      <button
        onClick={handleClick}
        className={`${getButtonStyles()} group relative overflow-hidden`}
        title={buttonLabel}
        disabled={isLoading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span
          className={`flex-shrink-0 transition-transform duration-200 ${
            isHovered && tourStatus.available ? "scale-110" : ""
          }`}
        >
          {getIcon()}
        </span>
        
        {expanded && (
          <span className={`flex-1 text-left min-w-0 font-medium transition-transform duration-200 ${
            isHovered ? "translate-x-0.5" : ""
          }`}>
            {isLoading ? (
              <span className="animate-pulse">{t("common.loading")}</span>
            ) : (
              <span>{buttonLabel}</span>
            )}
          </span>
        )}
        
        {tourStatus.available && !isLoading && (
          <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        )}
        
        {!expanded && tourStatus.available && !isLoading && (
          <div
            className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 ${
              darkTheme
                ? "border-[#0B1017] bg-[#B8C5D6]"
                : "border-white bg-[#8FA3B8]"
            }`}
          />
        )}
      </button>
    </div>
  );
};

export default SmartTourButton; 
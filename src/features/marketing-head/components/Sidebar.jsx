import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocalization } from "../../../hooks/useLocalization";
import SidebarLanguageSwitcher from "../../../components/localization/SidebarLanguageSwitcher";
import SmartTourButton from '../../../components/tours/SmartTourButton';
import ThemeToggleButton from '../../../components/ui/ThemeToggleButton';
import marlnLogo from "../../../assets/MARLN logo.png";

export default function Sidebar({ features, userLabel, expanded, setExpanded }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isRTLMode } = useLocalization();
  // Read initial theme from localStorage or system preference
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      // fallback to system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };
  const [darkTheme, setDarkTheme] = useState(getInitialTheme);

  // Apply theme on mount and when darkTheme changes
  useEffect(() => {
    if (darkTheme) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkTheme]);

  const handleLogout = () => {
    localStorage.removeItem("rbac_current_user");
    navigate("/login");
  };

  const handleThemeToggle = () => {
    setDarkTheme((prev) => !prev);
  };

  const shellClass = darkTheme
    ? "bg-[#0B1410] text-emerald-50 border-r border-[#1a2e24]"
    : "bg-white text-slate-800 border-r border-[#E5E7EB]";
  const labelClass = darkTheme ? "text-emerald-50" : "text-slate-800";
  const navActiveClass = darkTheme
    ? "bg-[#1a2e24] text-emerald-200"
    : "bg-[#E4EDE7] text-[#1A5336]";
  const navHoverClass = darkTheme
    ? "hover:bg-[#122018]"
    : "hover:bg-[#F2F7F4]";
  const footerBorder = darkTheme ? "border-[#1a2e24]" : "border-[#E5E7EB]";
  const footerHover = darkTheme ? "hover:bg-[#122018]" : "hover:bg-[#F2F7F4]";
  const collapseBtn = darkTheme
    ? "bg-[#122018] hover:bg-[#1a2e24] text-emerald-100 border border-[#1a2e24]"
    : "bg-[#F2F7F4] hover:bg-[#E4EDE7] text-[#1A5336] border border-[#E5E7EB]";

  return (
    <aside
      className={`${shellClass} flex flex-col h-screen transition-all duration-300 ${expanded ? 'w-56' : 'w-12'}`}
      style={{ zIndex: 20 }}
    >
      {/* Fixed Logo at Top */}
      <div className="flex items-center justify-center py-6 px-2">
        <button
          onClick={() => navigate('/corporate-info')}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <img
            src={marlnLogo}
            alt={t('sidebar.mbscLogo')}
            className={`transition-all duration-300 ${expanded ? 'w-12 h-12' : 'w-10 h-10'}`}
          />
          {expanded && (
            <span className={`ml-3 text-2xl font-bold tracking-wide ${labelClass}`}>{userLabel || t('roles.marketingHead')}</span>
          )}
        </button>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 scrollbar-thin scrollbar-thumb-[#888] scrollbar-track-transparent">
        <div className="flex flex-col gap-2">
          {features.map((f) => {
            const isActive = location.pathname === f.route;
            return (
              <button
                key={f.label}
                onClick={() => navigate(f.route)}
                className={`group flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 text-lg font-medium text-left relative
                  ${isActive ? navActiveClass : `${labelClass} ${navHoverClass}`}
                  ${expanded ? 'justify-start' : 'justify-center'}
                `}
                title={!expanded ? t(f.label, { defaultValue: f.label }) : undefined}
              >
                <span className={`text-2xl ${isActive ? (darkTheme ? 'text-emerald-300' : 'text-[#1A5336]') : ''}`}>{f.icon}</span>
                {expanded && <span className="whitespace-nowrap">{t(f.label, { defaultValue: f.label })}</span>}
                {/* Tooltip for collapsed */}
                {!expanded && (
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                    {t(f.label, { defaultValue: f.label })}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Fixed Buttons at Bottom */}
      <div className={`flex flex-col items-center gap-2 p-4 border-t ${footerBorder}`}>
        {/* Language Switcher */}
        <SidebarLanguageSwitcher expanded={expanded} darkTheme={darkTheme} />
        
        {/* Theme Toggle Button */}
        <ThemeToggleButton
          darkTheme={darkTheme}
          onToggle={handleThemeToggle}
          expanded={expanded}
        />
        
        <SmartTourButton
          role="marketing-head"
          expanded={expanded}
          darkTheme={darkTheme}
        />
        
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 w-full ${labelClass} ${footerHover} ${
            expanded ? 'justify-start' : 'justify-center'
          }`}
          style={{ background: "transparent" }}
          title={t('sidebar.logout')}
        >
          <span className="text-2xl">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
            </svg>
          </span>
          {expanded && <span className="whitespace-nowrap">{t('sidebar.logout')}</span>}
        </button>
        <button
          onClick={() => setExpanded((e) => !e)}
          className={`${collapseBtn} rounded-full p-2 transition-colors`}
          title={expanded ? t('sidebar.collapseSidebar') : t('sidebar.expandSidebar')}
        >
          {expanded ? (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d={isRTLMode ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d={isRTLMode ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      <style>{`
        /* Custom scrollbar for browsers that don't support Tailwind's scrollbar utilities */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </aside>
  );
}

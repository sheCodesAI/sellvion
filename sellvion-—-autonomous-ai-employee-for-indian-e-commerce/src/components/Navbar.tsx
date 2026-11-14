import React, { useState } from 'react';
import { Moon, Sun, Menu, X, ArrowRight, LogIn, ShieldCheck, Bot } from 'lucide-react';
import { AppLanguage, AppMode, ConsoleTabId } from '../types';
import { t, tr } from '../i18n/translations';

interface NavbarProps {
  onOpenConsole: (tab?: ConsoleTabId) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  pendingCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  appMode: AppMode;
  isAuthenticated: boolean;
  businessName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenConsole,
  onOpenAuth,
  pendingCount,
  theme,
  onToggleTheme,
  language,
  onChangeLanguage,
  appMode,
  isAuthenticated,
  businessName,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: t(language, 'navWorkflows'), href: '#workflows' },
    { label: t(language, 'navCapabilities'), href: '#capabilities' },
    { label: t(language, 'navImpact'), href: '#impact' },
    { label: t(language, 'navPricing'), href: '#pricing' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2E8F0] dark:border-[#1E3A5F] bg-white/95 dark:bg-[#071A35]/95 text-[#071A35] dark:text-white backdrop-blur-md transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <a href="#home" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#071A35] via-[#2563EB] to-[#22D3EE] flex items-center justify-center text-white shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M9 12L11.2 14.2L15.5 9.8"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight text-[#071A35] dark:text-white whitespace-nowrap">
            SELLVION
          </span>
        </a>

        {/* Primary Navigation */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-5">
          <a
            href="#home"
            className="text-sm font-semibold text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-[#22D3EE] transition-colors whitespace-nowrap shrink-0"
          >
            {t(language, 'navHome')}
          </a>

          <a
            href="#teammates"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('teammates');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else onOpenConsole('agents');
            }}
            className="h-8 px-3 rounded-lg bg-[#071A35] dark:bg-[#22D3EE] hover:bg-[#2563EB] dark:hover:bg-[#38BDF8] text-white dark:text-[#071A35] text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Bot className="w-3.5 h-3.5 shrink-0" />
            <span>{t(language, 'navTeammates')}</span>
          </a>

          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-[#22D3EE] transition-colors whitespace-nowrap shrink-0"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Utility & Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            aria-label={tr(language, 'Language', 'भाषा')}
            value={language}
            onChange={(e) => onChangeLanguage(e.target.value as AppLanguage)}
            className="hidden sm:block h-9 px-2.5 rounded-lg border border-[#CBD5E1] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#0B2246] text-xs font-bold text-[#071A35] dark:text-white cursor-pointer"
          >
            <option value="en">EN</option>
            <option value="hi">HI</option>
          </select>

          <button
            onClick={onToggleTheme}
            aria-label={tr(language, 'Toggle color theme', 'थीम बदलें')}
            title={
              theme === 'light'
                ? tr(language, 'Switch to Midnight Navy mode', 'डार्क नेवी मोड चालू करें')
                : tr(language, 'Switch to Light mode', 'सफेद लाइट मोड चालू करें')
            }
            className="h-9 w-9 rounded-lg border border-[#CBD5E1] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#0B2246] flex items-center justify-center text-[#071A35] dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-white hover:border-[#2563EB] dark:hover:border-[#22D3EE]/60 transition-colors cursor-pointer shrink-0"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {!isAuthenticated ? (
            <button
              onClick={() => onOpenAuth('login')}
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#CBD5E1] dark:border-[#1E3A5F] bg-white dark:bg-[#0B2246] text-xs font-semibold text-[#071A35] dark:text-white hover:border-[#2563EB] dark:hover:border-[#22D3EE]/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t(language, 'navLogin')}</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenConsole('dashboard')}
              title={businessName}
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#EFF6FF] dark:bg-[#0E2B57] border border-[#2563EB]/40 text-xs font-semibold text-[#2563EB] dark:text-[#22D3EE] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {appMode === 'live'
                  ? tr(language, 'Live Store', 'लाइव स्टोर')
                  : tr(language, 'Demo Store', 'डेमो स्टोर')}
              </span>
            </button>
          )}

          <button
            onClick={() => (isAuthenticated ? onOpenConsole('dashboard') : onOpenAuth('signup'))}
            className="h-9 px-3.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{isAuthenticated ? t(language, 'navConsole') : t(language, 'startFreeBtn')}</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] tabular-nums">
                {pendingCount}
              </span>
            )}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={tr(language, 'Open menu', 'मेनू खोलें')}
            className="lg:hidden h-9 w-9 rounded-lg border border-[#CBD5E1] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#0B2246] flex items-center justify-center text-[#071A35] dark:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E2E8F0] dark:border-[#1E3A5F] bg-white dark:bg-[#071A35] px-4 py-4 space-y-3">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenConsole('agents');
            }}
            className="w-full h-10 px-3 rounded-xl bg-[#071A35] dark:bg-[#22D3EE] text-white dark:text-[#071A35] text-sm font-extrabold flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span>{t(language, 'navTeammates')}</span>
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <a
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-[#334155] dark:text-[#E2E8F0] hover:bg-[#F8FAFC] dark:hover:bg-[#0B2246]"
            >
              {t(language, 'navHome')}
            </a>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-[#334155] dark:text-[#E2E8F0] hover:bg-[#F8FAFC] dark:hover:bg-[#0B2246]"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#1E3A5F]">
            <select
              aria-label={tr(language, 'Mobile language', 'भाषा चुनें')}
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as AppLanguage)}
              className="h-9 px-2.5 rounded-lg border border-[#CBD5E1] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#0B2246] text-xs font-semibold text-[#071A35] dark:text-white"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
            {!isAuthenticated && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('login');
                }}
                className="flex-1 h-9 rounded-lg border border-[#CBD5E1] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#0B2246] text-xs font-semibold text-[#071A35] dark:text-white cursor-pointer"
              >
                {t(language, 'navLogin')}
              </button>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConsole('dashboard');
              }}
              className="flex-1 h-9 rounded-lg bg-[#2563EB] text-white text-xs font-bold cursor-pointer"
            >
              {t(language, 'navConsole')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

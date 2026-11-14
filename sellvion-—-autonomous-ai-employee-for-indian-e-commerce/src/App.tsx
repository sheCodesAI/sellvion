import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  Check,
  ExternalLink,
  RotateCcw,
  ShieldAlert,
  Users,
  IndianRupee,
  Sliders,
  TrendingUp,
} from 'lucide-react';
import {
  AgentSummary,
  AnalyticsSummaryResponse,
  AppLanguage,
  AppMode,
  ApprovalRecord,
  AuditLogRecord,
  AuthSessionResponse,
  AutonomyPolicyConfig,
  ConsoleTabId,
  CustomerRecord,
  IntegrationStatusView,
  OrderRecord,
  PaymentRecord,
  UdhaarRecord,
  WorkflowRecord,
} from './types';
import { apiRequest, setModeHeader, setStoredToken } from './lib/api';
import { t, tr } from './i18n/translations';
import { Navbar } from './components/Navbar';
import { PeekHero } from './components/PeekHero';
import { CodRiskScorer } from './components/CodRiskScorer';
import { Customer360 } from './components/Customer360';
import { UdhaarLedger } from './components/UdhaarLedger';
import { AutonomySettings } from './components/AutonomySettings';
import { MetricsAndLift } from './components/MetricsAndLift';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import { PartnersSection } from './components/PartnersSection';
import { FaqSection } from './components/FaqSection';
import { AiCopilotModal } from './components/AiCopilotModal';
import { MerchantWorkspace } from './components/workspace/MerchantWorkspace';
import { AuthModal } from './components/workspace/AuthModal';

const DEFAULT_AUTONOMY: AutonomyPolicyConfig = {
  reorderReminders: 'approval_required',
  codPrepayNudges: 'approval_required',
  udhaarReminders: 'approval_required',
  winbackOffers: 'recommendation_only',
  maxDailyMessagesPerCustomer: 1,
  quietHoursStart: '21:00',
  quietHoursEnd: '09:00',
  minConfidenceForAutonomous: 85,
  maxAutonomousDiscountPct: 10,
  dailySpendCapInr: 2500,
  emergencyPauseAll: false,
};

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sellvion-theme') as 'light' | 'dark' | null;
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'light';
  });

  const [language, setLanguage] = useState<AppLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sellvion-lang');
      if (saved === 'en' || saved === 'hi') return saved;
    }
    return 'en';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('sellvion-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sellvion-lang', language);
  }, [language]);

  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleTab, setConsoleTab] = useState<ConsoleTabId>('dashboard');
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'signup' }>({
    open: false,
    mode: 'login',
  });
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [activeFeature, setActiveFeature] = useState<'cod' | 'memory' | 'udhaar' | 'safety'>('cod');

  // Server-backed workspace state
  const [appMode, setAppMode] = useState<AppMode>('demo');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [businessName, setBusinessName] = useState('Mystic Spices & Naturals (Demo Store)');
  const [businessInfo, setBusinessInfo] = useState<AuthSessionResponse['business']>(null);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [udhaarRecords, setUdhaarRecords] = useState<UdhaarRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationStatusView[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummaryResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [autonomyConfig, setAutonomyConfig] = useState<AutonomyPolicyConfig>(DEFAULT_AUTONOMY);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3600);
  }, []);

  const refreshWorkspace = useCallback(async () => {
    try {
      const [
        meRes,
        custRes,
        ordRes,
        udhaarRes,
        appRes,
        agentRes,
        wfRes,
        intRes,
        anaRes,
        auditRes,
      ] = await Promise.all([
        apiRequest<AuthSessionResponse>('/api/auth/me'),
        apiRequest<{ customers: CustomerRecord[] }>('/api/customers?pageSize=100'),
        apiRequest<{ orders: OrderRecord[] }>('/api/orders'),
        apiRequest<{ records: UdhaarRecord[]; payments: PaymentRecord[] }>('/api/udhaar'),
        apiRequest<{ approvals: ApprovalRecord[] }>('/api/approvals'),
        apiRequest<{ agents: AgentSummary[] }>('/api/agents'),
        apiRequest<{ workflows: WorkflowRecord[] }>('/api/workflows'),
        apiRequest<{ integrations: IntegrationStatusView[] }>('/api/integrations'),
        apiRequest<AnalyticsSummaryResponse>(`/api/analytics/summary?range=${range}`),
        apiRequest<{ logs: AuditLogRecord[] }>('/api/audit-logs'),
      ]);

      setIsAuthenticated(meRes.isAuthenticated);
      setAppMode(meRes.mode);
      setBusinessInfo(meRes.business);
      if (meRes.business?.name) setBusinessName(meRes.business.name);
      if (meRes.settings) {
        setAutonomyConfig({
          reorderReminders: meRes.settings.reorder_mode,
          codPrepayNudges: meRes.settings.cod_prepay_mode,
          udhaarReminders: meRes.settings.udhaar_mode,
          winbackOffers: meRes.settings.winback_mode,
          maxDailyMessagesPerCustomer: meRes.settings.max_daily_messages,
          quietHoursStart: meRes.settings.quiet_hours_start,
          quietHoursEnd: meRes.settings.quiet_hours_end,
          minConfidenceForAutonomous: meRes.settings.min_confidence,
          maxAutonomousDiscountPct: meRes.settings.max_discount_pct,
          dailySpendCapInr: meRes.settings.daily_spend_cap_inr,
          emergencyPauseAll: Boolean(meRes.settings.emergency_pause_all),
        });
      }

      setCustomers(custRes.customers);
      setOrders(ordRes.orders);
      setUdhaarRecords(udhaarRes.records);
      setPayments(udhaarRes.payments);
      setApprovals(appRes.approvals);
      setAgents(agentRes.agents);
      setWorkflows(wfRes.workflows);
      setIntegrations(intRes.integrations);
      setAnalytics(anaRes);
      setAuditLogs(auditRes.logs);
    } catch {
      // Keep graceful UI if server restarts momentarily
    }
  }, [range]);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  const openConsoleWithTab = (tab: ConsoleTabId = 'dashboard') => {
    setConsoleTab(tab);
    setIsConsoleOpen(true);
  };

  const handleResetDemo = async () => {
    try {
      await apiRequest('/api/business/reset-demo', { method: 'POST' });
      await refreshWorkspace();
      showToast(
        tr(
          language,
          'Demo sandbox reset to initial sample state.',
          'डेमो डेटा प्रारंभिक स्थिति में रीसेट हो गया।'
        )
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : tr(language, 'Reset failed.', 'रीसेट विफल रहा।'));
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setStoredToken(null);
    setModeHeader('demo');
    await refreshWorkspace();
    showToast(
      tr(language, 'Signed out. Switched back to Demo Mode.', 'लॉगआउट हो गया। डेमो मोड चालू है।')
    );
  };

  const pendingCount = approvals.filter((a) => a.status === 'pending_approval').length;

  return (
    <div className="min-h-screen bg-white dark:bg-[#071A35] text-[#071A35] dark:text-[#F8FAFC] flex flex-col justify-between transition-colors duration-150">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-60 bg-[#071A35] dark:bg-[#2563EB] text-white px-4 py-3 rounded-xl shadow-xl border border-[#22D3EE] text-xs font-semibold flex items-center gap-2 max-w-sm">
          <Check className="w-4 h-4 text-[#22D3EE] shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Compact Workspace Launcher */}
      <div className="hidden sm:block fixed bottom-6 left-6 z-40">
        <button
          onClick={() => openConsoleWithTab('inbox')}
          className="h-11 px-4 rounded-xl bg-[#071A35] hover:bg-[#2563EB] text-white shadow-xl border border-[#1E3A5F] flex items-center gap-2.5 text-xs font-bold transition-colors cursor-pointer"
        >
          <span>{tr(language, 'Open Merchant Workspace', 'व्यापारी वर्कस्पेस खोलें')}</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-[#22D3EE] text-[#071A35] font-extrabold tabular-nums">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Top Navigation */}
      <Navbar
        onOpenConsole={openConsoleWithTab}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        pendingCount={pendingCount}
        theme={theme}
        onToggleTheme={() => setTheme((p) => (p === 'light' ? 'dark' : 'light'))}
        language={language}
        onChangeLanguage={setLanguage}
        appMode={appMode}
        isAuthenticated={isAuthenticated}
        businessName={businessName}
      />

      {/* Hero + Structured Landing Flow */}
      <main className="w-full space-y-20">
        <PeekHero
          language={language}
          customers={customers}
          agents={agents}
          workflows={workflows}
          analytics={analytics}
          onOpenConsole={openConsoleWithTab}
          onActionQueued={(msg) => {
            showToast(msg);
            refreshWorkspace();
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {/* Visual-First Interactive Capabilities Explorer (01-04) */}
          <section id="capabilities" className="space-y-5 scroll-mt-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
              <div className="space-y-1 max-w-2xl">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#22D3EE]">
                  {tr(language, 'Core Capabilities', 'मुख्य क्षमताएं')}
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#071A35] dark:text-white">
                  {tr(
                    language,
                    'Explore Every AI Workflow Visually',
                    'हर AI वर्कफ़्लो को सीधे आज़माएं'
                  )}
                </h2>
                <p className="text-sm text-[#64748B] dark:text-[#CBD5E1]">
                  {tr(
                    language,
                    'Switch between COD risk defense, customer recovery, collections, and safety controls.',
                    'COD जोखिम सुरक्षा, ग्राहक वापसी, उधार वसूली और सुरक्षा नियमों के बीच स्विच करें।'
                  )}
                </p>
              </div>

              <button
                onClick={() =>
                  openConsoleWithTab(
                    activeFeature === 'cod'
                      ? 'cod-risk'
                      : activeFeature === 'memory'
                      ? 'customers'
                      : activeFeature === 'udhaar'
                      ? 'udhaar'
                      : 'inbox'
                  )
                }
                className="h-10 px-4 rounded-xl bg-white dark:bg-[#0B1E40] border border-[#CBD5E1] dark:border-[#1E3A5F] hover:border-[#2563EB] text-xs font-bold text-[#2563EB] dark:text-[#22D3EE] flex items-center gap-1.5 self-start md:self-auto cursor-pointer shrink-0"
              >
                <span>{tr(language, 'Open Full Workspace', 'पूरा वर्कस्पेस खोलें')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(
                [
                  {
                    id: 'cod',
                    icon: ShieldAlert,
                    title: tr(language, '01 · COD Protection', '01 · COD सुरक्षा'),
                    sub: tr(
                      language,
                      'Flag risky parcels before dispatch',
                      'डिस्पैच से पहले जोखिम वाले पार्सल जांचें'
                    ),
                  },
                  {
                    id: 'memory',
                    icon: Users,
                    title: tr(language, '02 · Customer Recovery', '02 · ग्राहक वापसी'),
                    sub: tr(
                      language,
                      'Spot repeat buyers due to reorder',
                      'रीऑर्डर करने वाले नियमित ग्राहक पहचानें'
                    ),
                  },
                  {
                    id: 'udhaar',
                    icon: IndianRupee,
                    title: tr(language, '03 · Collections', '03 · उधार वसूली'),
                    sub: tr(
                      language,
                      'Polite Udhaar & payment tracking',
                      'विनम्र उधार और भुगतान ट्रैकिंग'
                    ),
                  },
                  {
                    id: 'safety',
                    icon: Sliders,
                    title: tr(language, '04 · Safety & Control', '04 · सुरक्षा व नियंत्रण'),
                    sub: tr(
                      language,
                      `Quiet hours & approvals (${pendingCount})`,
                      `शांत घंटे और मंजूरी (${pendingCount})`
                    ),
                  },
                ] as const
              ).map((tab) => {
                const active = activeFeature === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFeature(tab.id)}
                    className={`text-left p-3.5 rounded-2xl border transition-colors cursor-pointer flex items-start gap-3 ${
                      active
                        ? 'bg-[#071A35] dark:bg-[#2563EB] text-white border-[#071A35] dark:border-[#2563EB] shadow-md'
                        : 'bg-white dark:bg-[#0B1E40] text-[#071A35] dark:text-white border-[#E2E8F0] dark:border-[#1E3A5F] hover:border-[#2563EB]'
                    }`}
                  >
                    <tab.icon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        active ? 'text-[#22D3EE]' : 'text-[#2563EB] dark:text-[#22D3EE]'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold truncate">{tab.title}</div>
                      <div
                        className={`text-[11px] mt-0.5 truncate ${
                          active ? 'text-[#CBD5E1]' : 'text-[#64748B] dark:text-[#94A3B8]'
                        }`}
                      >
                        {tab.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {activeFeature === 'cod' && (
              <CodRiskScorer
                language={language}
                orders={orders}
                onRefresh={refreshWorkspace}
                onNotify={showToast}
                compactLanding
              />
            )}

            {activeFeature === 'memory' && (
              <Customer360
                language={language}
                customers={customers}
                onRefresh={refreshWorkspace}
                onNotify={showToast}
                onOpenInbox={() => openConsoleWithTab('inbox')}
                compactLanding
              />
            )}

            {activeFeature === 'udhaar' && (
              <UdhaarLedger
                language={language}
                customers={customers}
                records={udhaarRecords}
                payments={payments}
                onRefresh={refreshWorkspace}
                onNotify={showToast}
                onOpenInbox={() => openConsoleWithTab('inbox')}
                compactLanding
              />
            )}

            {activeFeature === 'safety' && (
              <AutonomySettings
                language={language}
                config={autonomyConfig}
                onSaved={setAutonomyConfig}
                onNotify={showToast}
              />
            )}
          </section>

          {/* Measurable Business Impact */}
          <section id="impact" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
              <div className="space-y-1.5 max-w-2xl">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#22D3EE] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>{tr(language, 'Measurable Business Impact', 'मापने योग्य व्यापार प्रभाव')}</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#071A35] dark:text-white">
                  {tr(
                    language,
                    'Observed Store Outcomes vs Open Opportunities',
                    'दुकान के वास्तविक परिणाम बनाम खुले अवसर'
                  )}
                </h2>
                <p className="text-sm text-[#64748B] dark:text-[#CBD5E1]">
                  {tr(
                    language,
                    'Every action is verified against real store orders, payments, and holdout groups.',
                    'हर कार्य असली ऑर्डर, भुगतान और होल्डआउट समूह से सत्यापित होता है।'
                  )}
                </p>
              </div>

              <button
                onClick={() => openConsoleWithTab('analytics')}
                className="h-10 px-4 rounded-xl bg-white dark:bg-[#0B1E40] border border-[#CBD5E1] dark:border-[#1E3A5F] hover:border-[#2563EB] text-xs font-bold text-[#2563EB] dark:text-[#22D3EE] flex items-center gap-1.5 self-start md:self-auto cursor-pointer shrink-0"
              >
                <span>{tr(language, 'Open Analytics & Audit', 'रिपोर्ट और ऑडिट खोलें')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <MetricsAndLift
              language={language}
              analytics={analytics}
              onNavigateTab={(tab) => openConsoleWithTab(tab)}
            />
          </section>

          {/* Connected Integrations */}
          <PartnersSection
            language={language}
            integrations={integrations}
            onOpenIntegrations={() => openConsoleWithTab('integrations')}
          />

          {/* Pricing & Comparison */}
          <section id="pricing" className="scroll-mt-24">
            <ComparisonMatrix
              language={language}
              onGetStarted={() => setAuthModal({ open: true, mode: 'signup' })}
            />
          </section>

          {/* FAQ */}
          <FaqSection language={language} />

          {/* Bottom CTA */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#071A35] via-[#0E3168] to-[#2563EB] p-8 sm:p-12 text-white shadow-xl border border-[#1E3A5F]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-spatial-grid opacity-25" />
            <div className="relative max-w-2xl space-y-4">
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight">
                {tr(
                  language,
                  'Put Your AI Teammates to Work in Two Minutes',
                  'दो मिनट में अपने AI साथियों को काम पर लगाएं'
                )}
              </h2>
              <p className="text-sm sm:text-base text-[#E2E8F0]">
                {tr(
                  language,
                  'Explore the live AI Teammates workspace or create an isolated Live Store account and import your customer CSV.',
                  'लाइव AI साथी वर्कस्पेस देखें या अपनी दुकान का निजी खाता बनाकर ग्राहक CSV अपलोड करें।'
                )}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setAuthModal({ open: true, mode: 'signup' })}
                  className="h-12 px-6 rounded-xl bg-[#22D3EE] hover:bg-[#38BDF8] text-[#071A35] text-sm font-extrabold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>{tr(language, 'Create Free Store Account', 'मुफ्त दुकान खाता बनाएं')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openConsoleWithTab('agents')}
                  className="h-12 px-5 rounded-xl bg-[#071A35]/80 hover:bg-[#071A35] border border-white/30 text-white text-sm font-bold cursor-pointer transition-colors"
                >
                  {tr(language, 'Explore AI Teammates', 'AI साथी देखें')}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Workspace Overlay */}
      <MerchantWorkspace
        isOpen={isConsoleOpen}
        activeTab={consoleTab}
        onChangeTab={setConsoleTab}
        onClose={() => setIsConsoleOpen(false)}
        appMode={appMode}
        isAuthenticated={isAuthenticated}
        businessName={businessName}
        businessInfo={businessInfo}
        language={language}
        onChangeLanguage={setLanguage}
        customers={customers}
        orders={orders}
        udhaarRecords={udhaarRecords}
        payments={payments}
        approvals={approvals}
        agents={agents}
        workflows={workflows}
        integrations={integrations}
        analytics={analytics}
        auditLogs={auditLogs}
        autonomyConfig={autonomyConfig}
        range={range}
        onChangeRange={setRange}
        onUpdateAutonomy={setAutonomyConfig}
        onRefreshAll={refreshWorkspace}
        onNotify={showToast}
        onResetDemo={handleResetDemo}
        onLogout={handleLogout}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        onOpenCopilot={() => setCopilotOpen(true)}
      />

      {/* Auth Modal */}
      <AuthModal
        language={language}
        isOpen={authModal.open}
        initialMode={authModal.mode}
        onClose={() => setAuthModal((prev) => ({ ...prev, open: false }))}
        onAuthenticated={() => {
          refreshWorkspace();
          openConsoleWithTab('dashboard');
        }}
        onNotify={showToast}
      />

      {/* Store Assistant Modal */}
      <AiCopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        language={language}
      />

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#071A35] py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <div className="space-y-1">
            <div className="font-display font-extrabold text-sm text-[#071A35] dark:text-white">
              SELLVION
            </div>
            <p>
              {tr(
                language,
                'Built as an independent Agentic AI teammate platform for Indian merchants, designed for compatibility with Paytm-style merchant ecosystems.',
                'भारतीय व्यापारियों के लिए स्वतंत्र एजेंटिक AI साथी प्लेटफ़ॉर्म, Paytm जैसे मर्चेंट सिस्टम के अनुकूल।'
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-semibold">
            {appMode === 'demo' && (
              <button
                onClick={handleResetDemo}
                className="text-[#2563EB] dark:text-[#22D3EE] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{tr(language, 'Reset Demo Data', 'डेमो डेटा रीसेट करें')}</span>
              </button>
            )}
            <a href="#workflows" className="hover:text-[#2563EB]">
              {t(language, 'navWorkflows')}
            </a>
            <a href="#capabilities" className="hover:text-[#2563EB]">
              {t(language, 'navCapabilities')}
            </a>
            <a href="#pricing" className="hover:text-[#2563EB]">
              {t(language, 'navPricing')}
            </a>
            <a href="#faq" className="hover:text-[#2563EB]">
              {tr(language, 'FAQ', 'सवाल-जवाब')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  IndianRupee,
  RefreshCw,
  GitBranch,
  Play,
} from 'lucide-react';
import {
  AgentSummary,
  AnalyticsSummaryResponse,
  AppLanguage,
  ConsoleTabId,
  CustomerRecord,
  WorkflowRecord,
} from '../types';
import {
  localizeAgentName,
  localizeAgentRole,
  localizeAgentScope,
  t,
  tr,
} from '../i18n/translations';
import { AgenticHeroCanvas } from './AgenticHeroCanvas';
import { InteractiveWhatsAppSimulator } from './InteractiveWhatsAppSimulator';

interface PeekHeroProps {
  language: AppLanguage;
  customers: CustomerRecord[];
  agents: AgentSummary[];
  workflows: WorkflowRecord[];
  analytics: AnalyticsSummaryResponse | null;
  onOpenConsole: (tab?: ConsoleTabId) => void;
  onActionQueued?: (msg: string) => void;
}

export const PeekHero: React.FC<PeekHeroProps> = ({
  language,
  customers,
  agents,
  workflows,
  analytics,
  onOpenConsole,
  onActionQueued,
}) => {
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  const workflowSteps = [
    {
      step: '01',
      title: tr(language, 'Customer Detected', 'ग्राहक की पहचान'),
      owner: tr(language, 'Customer Intelligence', 'ग्राहक जानकारी एजेंट'),
      detail: tr(
        language,
        'Spots repeat purchase gaps, risky COD addresses, or overdue Khata.',
        'रीऑर्डर गैप, जोखिम वाले COD पते या बकाया उधार को पहचानता है।'
      ),
    },
    {
      step: '02',
      title: tr(language, 'Context Retrieved', 'संदर्भ लोड हुआ'),
      owner: tr(language, 'Customer Intelligence', 'ग्राहक जानकारी एजेंट'),
      detail: tr(
        language,
        'Loads past orders, language preference, opt-out flag, and payment log.',
        'पिछले ऑर्डर, भाषा, ऑप्ट-आउट स्थिति और भुगतान इतिहास लोड करता है।'
      ),
    },
    {
      step: '03',
      title: tr(language, 'Agents Collaborate', 'एजेंट्स का सहयोग'),
      owner: tr(language, 'Orchestrator', 'सेंट्रल ऑर्केस्ट्रेटर'),
      detail: tr(
        language,
        'Prediction scores risk while Engagement writes a polite customer draft.',
        'अनुमान एजेंट जोखिम जांचता है और संवाद एजेंट विनम्र संदेश लिखता है।'
      ),
    },
    {
      step: '04',
      title: tr(language, 'Decision Made', 'निर्णय तय हुआ'),
      owner: tr(language, 'Policy & Safety Guard', 'नीति और सुरक्षा रक्षक'),
      detail: tr(
        language,
        'Verifies quiet hours (9 PM–9 AM IST), daily caps, and discount rules.',
        'शांत घंटे (9 PM–9 AM), दैनिक संदेश सीमा और छूट नियम जांचता है।'
      ),
    },
    {
      step: '05',
      title: tr(language, 'Action Approved', 'मंजूरी मिली'),
      owner: tr(language, 'Merchant / Rule', 'व्यापारी / सुरक्षा नियम'),
      detail: tr(
        language,
        'Waits in Action Center for one-tap approval or autonomous confidence pass.',
        'एक-क्लिक मंजूरी या ऑटो-नियम के लिए मंजूरी केंद्र में तैयार रहता है।'
      ),
    },
    {
      step: '06',
      title: tr(language, 'Action Executed', 'संदेश भेजा गया'),
      owner: tr(language, 'Execution & Measure', 'निष्पादन और परिणाम एजेंट'),
      detail: tr(
        language,
        'Dispatches via WhatsApp with retries and idempotency lock.',
        'रीट्राई और डुप्लीकेट सुरक्षा के साथ WhatsApp पर भेजता है।'
      ),
    },
    {
      step: '07',
      title: tr(language, 'Result Verified', 'परिणाम सत्यापित'),
      owner: tr(language, 'Execution & Measure', 'निष्पादन और परिणाम एजेंट'),
      detail: tr(
        language,
        'Confirms repeat order, prepaid switch, or UPI payment in SQLite.',
        'डेटाबेस में नया ऑर्डर, प्रीपेड बदलाव या UPI भुगतान सत्यापित करता है।'
      ),
    },
  ];

  const outcomeCards = [
    {
      icon: AlertTriangle,
      code: '01',
      title: tr(language, 'COD Return Defense', 'COD रिटर्न सुरक्षा'),
      body: tr(
        language,
        'Spot incomplete addresses and high-risk pincodes before courier pickup.',
        'कूरियर पिकअप से पहले अधूरे पते और जोखिम वाले पिनकोड पहचानें।'
      ),
    },
    {
      icon: RefreshCw,
      code: '02',
      title: tr(language, 'Repeat-Buyer Recovery', 'ग्राहक दोबारा वापसी'),
      body: tr(
        language,
        'Trigger timely replenishment check-ins based on actual buying cadence.',
        'खरीदने के असली अंतराल के आधार पर सही समय पर रीऑर्डर रिमाइंडर भेजें।'
      ),
    },
    {
      icon: IndianRupee,
      code: '03',
      title: tr(language, 'Udhaar Collections', 'उधार और वसूली'),
      body: tr(
        language,
        'Send polite Hindi, Hinglish, or English payment reminders with UPI links.',
        'UPI लिंक के साथ सरल हिन्दी, हिंग्लिश या अंग्रेज़ी में विनम्र भुगतान याद दिलाएं।'
      ),
    },
    {
      icon: ShieldCheck,
      code: '04',
      title: tr(language, 'Human-First Guardrails', 'व्यापारी नियंत्रण नियम'),
      body: tr(
        language,
        'Quiet hours, opt-out compliance, and daily limits enforced on every send.',
        'हर संदेश पर शांत घंटे, ऑप्ट-आउट और दैनिक सीमा की सख्त जांच लागू होती है।'
      ),
    },
  ];

  return (
    <div id="home" className="space-y-20">
      {/* 1. HERO: Approved Multi-Agent Command Graph Identity + Grid Lines Background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-[#F8FAFC] to-[#EFF6FF] dark:from-[#071A35] dark:via-[#092045] dark:to-[#0B2956] text-[#071A35] dark:text-white border-b border-[#E2E8F0] dark:border-[#1E3A5F] transition-colors duration-150">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-spatial-grid opacity-75 dark:opacity-60"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#22D3EE]">
              <Bot className="w-4 h-4 shrink-0" />
              <span>{t(language, 'heroEyebrow')}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#071A35] dark:text-white leading-[1.06]">
              {t(language, 'heroTitle')}
            </h1>

            <p className="text-base text-[#475569] dark:text-[#CBD5E1] max-w-xl leading-relaxed">
              {t(language, 'heroSubtitle')}
            </p>

            {/* Operational Loop Cadence */}
            <div className="text-[11px] font-mono font-semibold text-[#64748B] dark:text-[#94A3B8] tracking-wide">
              {tr(
                language,
                'UNDERSTAND · DECIDE · ACT · VERIFY · MEASURE',
                'समझें · निर्णय लें · कार्य करें · सत्यापित करें · मापें'
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onOpenConsole('agents')}
                className="h-12 px-6 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold flex items-center gap-2 shadow-[0_8px_24px_rgba(37,99,235,0.28)] transition-colors cursor-pointer"
              >
                <span>{t(language, 'tryDemoBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#teammates"
                className="h-12 px-6 rounded-xl border border-[#CBD5E1] dark:border-[#335C8E] bg-white dark:bg-[#0B254B] hover:border-[#2563EB] dark:hover:border-[#22D3EE] text-[#071A35] dark:text-white text-sm font-bold inline-flex items-center justify-center transition-colors"
              >
                {tr(language, 'Meet the 5 Teammates', '5 AI साथियों से मिलें')}
              </a>
            </div>

            {/* Real Store Live Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#E2E8F0] dark:border-[#1E3A5F] text-xs">
              <div>
                <div className="text-xl font-extrabold text-[#071A35] dark:text-white tabular-nums">
                  {analytics?.actualObserved.totalCustomers ?? customers.length}
                </div>
                <div className="text-[#64748B] dark:text-[#94A3B8]">
                  {tr(language, 'Buyers remembered', 'याद रखे गए ग्राहक')}
                </div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-[#2563EB] dark:text-[#22D3EE] tabular-nums">
                  {analytics?.opportunities.pendingApprovals ?? 0}
                </div>
                <div className="text-[#64748B] dark:text-[#94A3B8]">
                  {tr(language, 'Pending your tap', 'मंजूरी बाकी')}
                </div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-[#071A35] dark:text-white tabular-nums">
                  {analytics?.actualObserved.executedActions ?? 0}
                </div>
                <div className="text-[#64748B] dark:text-[#94A3B8]">
                  {tr(language, 'Verified actions', 'सत्यापित कार्य')}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <AgenticHeroCanvas
              language={language}
              agents={agents}
              workflows={workflows}
              onOpenConsole={onOpenConsole}
              onActionQueued={onActionQueued}
            />
          </div>
        </div>
      </section>

      {/* Main Content Container Below Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* 2. 5 TEAMMATES */}
        <section id="teammates" className="space-y-6 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#22D3EE] mb-1 flex items-center gap-1.5">
                <Bot className="w-4 h-4" />
                <span>{tr(language, 'AI Teammate Architecture', 'AI साथी संरचना')}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#071A35] dark:text-white">
                {tr(
                  language,
                  '5 Specialised AI Teammates Around One Central Orchestrator',
                  'एक सेंट्रल ऑर्केस्ट्रेटर के चारों ओर 5 विशेषज्ञ AI साथी'
                )}
              </h2>
              <p className="text-sm text-[#64748B] dark:text-[#CBD5E1] mt-1 max-w-2xl">
                {tr(
                  language,
                  'Each teammate has a focused job, real tool access, and strict permission boundaries.',
                  'हर AI साथी का एक स्पष्ट कार्य, असली टूल एक्सेस और सख्त अनुमति सीमा होती है।'
                )}
              </p>
            </div>
            <button
              onClick={() => onOpenConsole('agents')}
              className="h-10 px-4 rounded-xl bg-[#071A35] hover:bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1.5 self-start md:self-auto cursor-pointer transition-colors shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{tr(language, 'Open AI Teammates Workspace', 'AI साथी वर्कस्पेस खोलें')}</span>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {agents.map((ag, idx) => (
              <div
                key={ag.name}
                onClick={() => onOpenConsole('agents')}
                className="p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#1E3A5F] hover:border-[#2563EB] bg-white dark:bg-[#0B1E40] flex flex-col justify-between gap-3 transition-colors cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2563EB] dark:text-[#22D3EE]">
                    <span>
                      {tr(language, 'Teammate', 'साथी')} 0{idx + 1}
                    </span>
                    <span className="tabular-nums text-[#64748B] dark:text-[#94A3B8]">
                      {ag.totalRuns} {tr(language, 'runs', 'बार')}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#071A35] dark:text-white leading-snug">
                    {localizeAgentName(language, ag.name)}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#CBD5E1] leading-relaxed">
                    {localizeAgentRole(language, ag.name, ag.role)}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#1E3A5F] text-[11px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#22D3EE] shrink-0" />
                  <span className="truncate">
                    {localizeAgentScope(language, ag.name, ag.permissionScope)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. CONNECTED 7-STAGE WORKFLOW + LIVE MESSAGE APPROVAL */}
        <section id="workflows" className="space-y-6 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#22D3EE] mb-1 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4" />
                <span>{tr(language, 'Connected Workflows', 'जुड़े हुए वर्कफ़्लो')}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#071A35] dark:text-white">
                {tr(
                  language,
                  'From Signal Detection to Verified Outcome',
                  'संकेत पहचान से सत्यापित परिणाम तक'
                )}
              </h2>
              <p className="text-sm text-[#64748B] dark:text-[#CBD5E1] mt-1">
                {tr(
                  language,
                  'Click any stage to see which teammate owns it, then draft and queue a live workflow below.',
                  'किसी भी चरण पर क्लिक करके देखें कौन सा AI साथी जिम्मेदार है, फिर नीचे लाइव संदेश तैयार करें।'
                )}
              </p>
            </div>
            <button
              onClick={() => onOpenConsole('inbox')}
              className="h-10 px-4 rounded-xl border border-[#CBD5E1] dark:border-[#1E3A5F] bg-white dark:bg-[#0B1E40] hover:border-[#2563EB] text-xs font-bold text-[#071A35] dark:text-white flex items-center gap-1.5 self-start md:self-auto cursor-pointer shrink-0"
            >
              <span>
                {tr(language, 'Open Action Center', 'मंजूरी केंद्र खोलें')} (
                {analytics?.opportunities.pendingApprovals ?? 0})
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1E3A5F] bg-white dark:bg-[#0B1E40] p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {workflowSteps.map((st, idx) => {
                const active = idx === activeWorkflowStep;
                const passed = idx < activeWorkflowStep;
                return (
                  <button
                    key={st.step}
                    type="button"
                    onClick={() => setActiveWorkflowStep(idx)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      active
                        ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-[#0E2B57] shadow-sm'
                        : passed
                        ? 'border-[#BBF7D0] dark:border-[#14532D] bg-[#F0FDF4] dark:bg-[#052E16]/30'
                        : 'border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#061533]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-[#2563EB] dark:text-[#22D3EE] tabular-nums">
                        {st.step}
                      </span>
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          active
                            ? 'text-[#2563EB] dark:text-[#22D3EE]'
                            : passed
                            ? 'text-[#16A34A]'
                            : 'text-[#CBD5E1] dark:text-[#334155]'
                        }`}
                      />
                    </div>
                    <div className="text-xs font-extrabold text-[#071A35] dark:text-white leading-tight">
                      {st.title}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#061533] border border-[#E2E8F0] dark:border-[#1E3A5F] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-extrabold text-[#071A35] dark:text-white">
                  {tr(language, 'Stage', 'चरण')} {workflowSteps[activeWorkflowStep].step} ·{' '}
                  {workflowSteps[activeWorkflowStep].title}{' '}
                  <span className="text-[#2563EB] dark:text-[#22D3EE]">
                    ({workflowSteps[activeWorkflowStep].owner})
                  </span>
                </div>
                <p className="text-[#64748B] dark:text-[#CBD5E1]">
                  {workflowSteps[activeWorkflowStep].detail}
                </p>
              </div>
              <button
                onClick={() => onOpenConsole('agents')}
                className="h-8 px-3 rounded-lg bg-[#2563EB] text-white font-bold text-xs cursor-pointer shrink-0"
              >
                {tr(language, 'Inspect Live Runs', 'लाइव रन देखें')}
              </button>
            </div>
          </div>

          <InteractiveWhatsAppSimulator
            appLanguage={language}
            customers={customers}
            onActionQueued={onActionQueued}
          />
        </section>

        {/* 4. CORE BUSINESS OUTCOMES STRIP */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {outcomeCards.map((card) => (
            <div
              key={card.title}
              className="p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#1E3A5F] bg-white dark:bg-[#0B1E40] space-y-2.5 hover:border-[#2563EB] transition-colors"
            >
              <card.icon className="w-5 h-5 text-[#2563EB] dark:text-[#22D3EE]" />
              <h3 className="text-sm font-bold text-[#071A35] dark:text-white">{card.title}</h3>
              <p className="text-xs text-[#64748B] dark:text-[#CBD5E1] leading-relaxed">
                {card.body}
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

import React from 'react';
import { Link2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { AppLanguage, IntegrationStatusView } from '../types';
import { tr } from '../i18n/translations';

interface PartnersSectionProps {
  language?: AppLanguage;
  integrations: IntegrationStatusView[];
  onOpenIntegrations: () => void;
}

export const PartnersSection: React.FC<PartnersSectionProps> = ({
  language = 'en',
  integrations,
  onOpenIntegrations,
}) => {
  return (
    <section id="partners" className="space-y-6 scroll-mt-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
        <div className="space-y-1 max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#22D3EE]">
            {tr(language, 'Connected Tools', 'जुड़े हुए टूल्स')}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#071A35] dark:text-white">
            {tr(
              language,
              'Connects With the Tools Indian Merchants Already Use',
              'भारतीय व्यापारियों के मौजूदा टूल्स से सीधे जुड़ता है'
            )}
          </h2>
          <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">
            {tr(
              language,
              'Designed for compatibility with Paytm-style merchant payment workflows, WhatsApp Cloud API, Shopify, Shiprocket, and Razorpay. Connect your live credentials anytime.',
              'Paytm जैसे मर्चेंट पेमेंट वर्कफ़्लो, WhatsApp Cloud API, Shopify, Shiprocket और Razorpay के साथ काम करने के लिए बनाया गया है।'
            )}
          </p>
        </div>
        <button
          onClick={onOpenIntegrations}
          className="h-10 px-4 rounded-xl bg-white dark:bg-[#0B1E40] border border-[#CBD5E1] dark:border-[#1E3A5F] hover:border-[#2563EB] text-xs font-bold text-[#2563EB] dark:text-[#22D3EE] flex items-center gap-1.5 self-start md:self-auto cursor-pointer shrink-0"
        >
          <span>{tr(language, 'Manage Integrations', 'ऐप्स जोड़ें व प्रबंधित करें')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {integrations.map((item) => {
          const isConnected = item.status === 'connected';
          return (
            <div
              key={item.provider}
              className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                isConnected
                  ? 'border-[#16A34A]/40 bg-[#F0FDF4]/60 dark:bg-[#0B2246]'
                  : 'border-[#E2E8F0] dark:border-[#1E3A5F] bg-white dark:bg-[#0B1E40] hover:border-[#2563EB]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-[#061533] border border-[#E2E8F0] dark:border-[#1E3A5F] flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-[#2563EB] dark:text-[#22D3EE]" />
                  </div>
                  <span
                    className={`text-[11px] font-bold flex items-center gap-1 ${
                      isConnected ? 'text-[#16A34A]' : 'text-[#64748B] dark:text-[#94A3B8]'
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />{' '}
                        {tr(language, 'Connected', 'जुड़ा हुआ')}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />{' '}
                        {tr(language, 'Not Configured', 'सेट नहीं')}
                      </>
                    )}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-[#071A35] dark:text-white">
                  {item.label}
                </h3>
                <p className="text-xs text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
                  {item.description}
                </p>
              </div>
              <button
                onClick={onOpenIntegrations}
                className="text-left text-xs font-bold text-[#2563EB] dark:text-[#22D3EE] hover:underline cursor-pointer pt-2 border-t border-[#E2E8F0]/70 dark:border-[#1E3A5F]"
              >
                {isConnected
                  ? tr(language, 'View Status →', 'स्थिति देखें →')
                  : tr(language, 'Configure →', 'जोड़ें →')}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

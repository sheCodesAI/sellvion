import React, { useState } from 'react';
import {
  MessageCircle,
  Sparkles,
  Check,
  Send,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  User,
  ShoppingBag,
  IndianRupee,
  CheckCheck,
} from 'lucide-react';
import { AppLanguage, CustomerRecord } from '../types';
import { apiRequest } from '../lib/api';
import { tr } from '../i18n/translations';

interface SimulatorProps {
  appLanguage: AppLanguage;
  customers: CustomerRecord[];
  onActionQueued?: (msg: string) => void;
}

export const InteractiveWhatsAppSimulator: React.FC<SimulatorProps> = ({
  appLanguage,
  customers,
  onActionQueued,
}) => {
  const sampleCustomers = customers.slice(0, 6);
  const [selectedId, setSelectedId] = useState<string>(sampleCustomers[0]?.id || '');
  const [draftLanguage, setDraftLanguage] = useState<'hinglish' | 'en' | 'hi'>(
    appLanguage === 'hi' ? 'hi' : 'hinglish'
  );
  const [actionType, setActionType] = useState<
    'reorder_reminder' | 'cod_prepay' | 'udhaar_reminder' | 'winback_offer'
  >('reorder_reminder');
  const [draft, setDraft] = useState<string>(
    appLanguage === 'hi'
      ? 'नमस्ते प्रिया जी! 28 दिन पहले मंगाया गया आपका दार्जिलिंग गोल्ड ब्लेंड (1kg) पैक समाप्त होने वाला होगा। क्या हम ताज़ा पैक भेज दें?'
      : 'Namaste Priya ji! Your Darjeeling Gold Blend (1kg) pack from 28 days ago may be finishing soon. Would you like us to dispatch a fresh pack?'
  );
  const [modelUsed, setModelUsed] = useState<string>('ready');
  const [loading, setLoading] = useState(false);
  const [queueing, setQueueing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedCustomer =
    customers.find((c) => c.id === selectedId) || sampleCustomers[0];

  const handleGenerate = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await apiRequest<{
        draft: string;
        model: string;
        isAiGenerated: boolean;
      }>('/api/ai/draft-message', {
        method: 'POST',
        body: JSON.stringify({
          customerName: selectedCustomer.name,
          customerCity: selectedCustomer.city,
          productName: selectedCustomer.last_product_ordered,
          lastOrderDaysAgo: selectedCustomer.days_since_last_order,
          recommendedAction: actionType,
          language: draftLanguage,
          udhaarAmount: selectedCustomer.outstanding_udhaar,
        }),
      });
      setDraft(res.draft);
      setModelUsed(
        res.isAiGenerated
          ? tr(appLanguage, 'AI Draft', 'AI ड्राफ्ट')
          : tr(appLanguage, 'Template Engine', 'टेम्पलेट इंजन')
      );
    } catch {
      setFeedback(
        tr(appLanguage, 'Could not generate draft right now.', 'अभी ड्राफ्ट तैयार नहीं हो सका।')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendToApprovalInbox = async () => {
    if (!selectedCustomer) return;
    setQueueing(true);
    setFeedback(null);
    try {
      const wfType =
        actionType === 'cod_prepay'
          ? 'cod_protection'
          : actionType === 'udhaar_reminder'
          ? 'udhaar_collection'
          : 'reactivation';
      const res = await apiRequest<{ message: string }>('/api/workflows/run', {
        method: 'POST',
        body: JSON.stringify({
          workflowType: wfType,
          targetCustomerId: selectedCustomer.id,
          language: draftLanguage,
        }),
      });
      setFeedback(res.message);
      onActionQueued?.(res.message);
    } catch (err: unknown) {
      setFeedback(
        err instanceof Error
          ? err.message
          : tr(appLanguage, 'Failed to queue action.', 'कार्य कतार में नहीं जुड़ सका।')
      );
    } finally {
      setQueueing(false);
    }
  };

  const isOptedOut = selectedCustomer?.opted_out === 1;
  const hasConsent = selectedCustomer?.consent_whatsapp === 1;

  return (
    <div className="rounded-2xl border border-[#CBD5E1] dark:border-[#1E3A5F] bg-white dark:bg-[#0B1E40] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1E3A5F] flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] dark:bg-[#071A35]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] dark:text-[#22D3EE] flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#071A35] dark:text-white">
              {tr(
                appLanguage,
                'Customer Message Studio · Draft with Context',
                'ग्राहक संदेश स्टूडियो · संदर्भ सहित ड्राफ्ट'
              )}
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              {tr(
                appLanguage,
                'Pick a buyer, inspect their context & consent, then queue for your approval.',
                'ग्राहक चुनें, उनका संदर्भ व सहमति जांचें, और मंजूरी के लिए कतार में जोड़ें।'
              )}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-semibold text-[#64748B] dark:text-[#22D3EE]">
          {modelUsed === 'ready' ? tr(appLanguage, 'engine: ready', 'इंजन: तैयार') : modelUsed}
        </span>
      </div>

      <div className="p-5 grid lg:grid-cols-12 gap-6 items-stretch">
        {/* Guided 3-step controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#071A35] dark:text-white">
              {tr(appLanguage, 'Select Customer Memory Profile', 'ग्राहक प्रोफ़ाइल चुनें')}
            </label>
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#CBD5E1] dark:border-[#1E3A5F] bg-white dark:bg-[#061533] text-sm text-[#071A35] dark:text-white"
            >
              {sampleCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          {selectedCustomer && (
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#061533] border border-[#E2E8F0] dark:border-[#1E3A5F] text-[11px] space-y-2">
              <div className="flex items-center justify-between font-bold text-[#071A35] dark:text-white">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#22D3EE]" />
                  <span>{selectedCustomer.name}</span>
                </span>
                <span
                  className={`flex items-center gap-1 ${
                    isOptedOut || !hasConsent ? 'text-[#DC2626]' : 'text-[#16A34A]'
                  }`}
                >
                  {isOptedOut || !hasConsent ? (
                    <>
                      <ShieldOff className="w-3.5 h-3.5" />
                      <span>
                        {isOptedOut
                          ? tr(appLanguage, 'Opted Out', 'ऑप्ट-आउट')
                          : tr(appLanguage, 'No Consent', 'सहमति नहीं')}
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{tr(appLanguage, 'Policy & Consent OK', 'नीति व सहमति सही')}</span>
                    </>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#E2E8F0] dark:border-[#1E3A5F] text-[#64748B] dark:text-[#94A3B8]">
                <div className="flex items-center gap-1 truncate">
                  <ShoppingBag className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {selectedCustomer.last_product_ordered || tr(appLanguage, 'Regular', 'नियमित')}
                  </span>
                </div>
                <div className="tabular-nums text-center">
                  {selectedCustomer.days_since_last_order}
                  {tr(appLanguage, 'd ago', ' दिन पहले')}
                </div>
                <div className="flex items-center justify-end gap-0.5 tabular-nums font-bold text-[#071A35] dark:text-white">
                  <IndianRupee className="w-3 h-3" />
                  <span>
                    {Number(selectedCustomer.outstanding_udhaar).toLocaleString('en-IN')}{' '}
                    {tr(appLanguage, 'due', 'बाकी')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#071A35] dark:text-white mb-1">
                {tr(appLanguage, 'Purpose', 'उद्देश्य')}
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as typeof actionType)}
                className="w-full h-10 px-3 rounded-xl border border-[#CBD5E1] dark:border-[#1E3A5F] bg-white dark:bg-[#061533] text-xs font-medium text-[#071A35] dark:text-white"
              >
                <option value="reorder_reminder">
                  {tr(appLanguage, 'Reorder Check-in', 'रीऑर्डर याद दिलाएं')}
                </option>
                <option value="cod_prepay">
                  {tr(appLanguage, 'COD Address & UPI', 'COD पता और UPI')}
                </option>
                <option value="udhaar_reminder">
                  {tr(appLanguage, 'Udhaar Reminder', 'उधार रिमाइंडर')}
                </option>
                <option value="winback_offer">
                  {tr(appLanguage, 'Inactive Win-Back', 'ग्राहक वापसी ऑफर')}
                </option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#071A35] dark:text-white mb-1">
                {tr(appLanguage, 'Style', 'भाषा शैली')}
              </label>
              <select
                value={draftLanguage}
                onChange={(e) => setDraftLanguage(e.target.value as typeof draftLanguage)}
                className="w-full h-10 px-3 rounded-xl border border-[#CBD5E1] dark:border-[#1E3A5F] bg-white dark:bg-[#061533] text-xs font-medium text-[#071A35] dark:text-white"
              >
                <option value="hinglish">{tr(appLanguage, 'Hinglish', 'हिंग्लिश')}</option>
                <option value="en">{tr(appLanguage, 'Simple English', 'सरल अंग्रेज़ी')}</option>
                <option value="hi">{tr(appLanguage, 'Hindi', 'हिन्दी')}</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !selectedCustomer}
            className="w-full h-10 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>
              {loading
                ? tr(appLanguage, 'Preparing Draft...', 'ड्राफ्ट बन रहा है...')
                : tr(appLanguage, 'Regenerate AI Draft', 'नया AI ड्राफ्ट बनाएं')}
            </span>
          </button>
        </div>

        {/* WhatsApp Message Preview + Editable Composer */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#061533] overflow-hidden flex flex-col justify-between">
          <div className="px-4 py-3 bg-white dark:bg-[#071A35] border-b border-[#E2E8F0] dark:border-[#1E3A5F] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white font-extrabold flex items-center justify-center text-[11px]">
                {(selectedCustomer?.name || 'C').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-[#071A35] dark:text-white">
                  {selectedCustomer?.name || tr(appLanguage, 'Customer', 'ग्राहक')}
                </div>
                <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                  {tr(appLanguage, 'WhatsApp Business Preview', 'WhatsApp बिज़नेस पूर्वावलोकन')}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#2563EB] dark:text-[#22D3EE]">
              {tr(appLanguage, 'Editable Before Approval', 'मंजूरी से पहले बदलने योग्य')}
            </span>
          </div>

          <div className="p-4 space-y-3 flex-1">
            <div className="max-w-lg ml-auto rounded-2xl rounded-tr-xs bg-[#EFF6FF] dark:bg-[#0E2F5A] border border-[#BFDBFE] dark:border-[#22D3EE]/30 p-3 space-y-2">
              <textarea
                rows={4}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label={tr(appLanguage, 'Editable WhatsApp draft', 'संपादन योग्य WhatsApp ड्राफ्ट')}
                className="w-full rounded-lg bg-white dark:bg-[#071A35] border border-[#CBD5E1] dark:border-[#1E3A5F] p-2.5 text-sm text-[#071A35] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              <div className="flex items-center justify-end gap-1.5 text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                <span>10:30 AM</span>
                <CheckCheck className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#22D3EE]" />
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-white dark:bg-[#071A35] border-t border-[#E2E8F0] dark:border-[#1E3A5F] flex flex-wrap items-center justify-between gap-3">
            {feedback ? (
              <span className="text-xs font-medium text-[#16A34A] dark:text-[#22D3EE] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                {feedback}
              </span>
            ) : (
              <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                {tr(
                  appLanguage,
                  'Checks opt-out, quiet hours (9 PM–9 AM IST), and frequency cap automatically.',
                  'ऑप्ट-आउट, शांत घंटे (9 PM–9 AM) और दैनिक सीमा अपने आप जांचता है।'
                )}
              </span>
            )}
            <button
              onClick={handleSendToApprovalInbox}
              disabled={queueing || !selectedCustomer || isOptedOut}
              className="h-9 px-4 rounded-xl bg-[#2563EB] hover:bg-[#071A35] disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {queueing
                  ? tr(appLanguage, 'Queueing...', 'जोड़ा जा रहा है...')
                  : tr(appLanguage, 'Queue in Action Center', 'मंजूरी केंद्र में भेजें')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

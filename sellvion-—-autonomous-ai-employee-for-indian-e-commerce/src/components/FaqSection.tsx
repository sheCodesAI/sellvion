import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AppLanguage } from '../types';
import { tr } from '../i18n/translations';

interface FaqSectionProps {
  language?: AppLanguage;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ language = 'en' }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: tr(
        language,
        'Does SELLVION message my customers automatically without asking?',
        'क्या SELLVION मुझसे पूछे बिना अपने आप ग्राहकों को संदेश भेजता है?'
      ),
      a: tr(
        language,
        'No. By default, every draft goes into your Action Center so you can review, edit, or reject it with one tap. You only enable auto-send for trusted low-risk reminders if you choose to.',
        'नहीं। डिफ़ॉल्ट रूप से हर ड्राफ्ट आपके मंजूरी केंद्र में आता है ताकि आप एक क्लिक में जांच, बदलाव या अस्वीकार कर सकें। कम जोखिम वाले रिमाइंडर के लिए ऑटो-सेंड तभी चलता है जब आप उसे चालू करें।'
      ),
    },
    {
      q: tr(
        language,
        'What is the difference between Demo Mode and Live Mode?',
        'डेमो मोड और लाइव मोड में क्या अंतर है?'
      ),
      a: tr(
        language,
        'Demo Mode lets anyone explore SELLVION using sample store data and simulated WhatsApp logs. When you create a store account and connect your own WhatsApp, Shopify, or CSV data, Live Mode operates strictly on your private business workspace.',
        'डेमो मोड में आप नमूना दुकान डेटा के साथ सभी AI साथियों को आज़मा सकते हैं। जब आप अपना दुकान खाता बनाकर WhatsApp, Shopify या CSV डेटा जोड़ते हैं, तो लाइव मोड पूरी तरह आपकी निजी दुकान पर काम करता है।'
      ),
    },
    {
      q: tr(
        language,
        'How does SELLVION stop Cash-on-Delivery (COD) return losses?',
        'SELLVION कैश-ऑन-डिलीवरी (COD) रिटर्न नुकसान को कैसे रोकता है?'
      ),
      a: tr(
        language,
        'It checks clear signals on every COD order—such as missing house or flat numbers, first-time buyer history, high order amounts, and pincode return patterns—and prepares a polite address check or optional UPI link before dispatch.',
        'यह हर COD ऑर्डर में अधूरा घर/फ्लैट पता, नया ग्राहक इतिहास, अधिक राशि और पिनकोड रिटर्न पैटर्न जांचता है और शिपिंग से पहले पता पुष्टि या UPI प्रीपे लिंक तैयार करता है।'
      ),
    },
    {
      q: tr(
        language,
        'Can I use SELLVION in Hindi or English or by speaking?',
        'क्या मैं SELLVION को हिन्दी, अंग्रेज़ी या बोलकर चला सकता हूँ?'
      ),
      a: tr(
        language,
        'Yes. Switch languages anytime between English and Hindi across the entire app, and use the Voice Command bar inside your workspace to inspect pending payments or risky orders hands-free.',
        'हाँ। आप कभी भी पूरे ऐप को अंग्रेज़ी और हिन्दी के बीच बदल सकते हैं और वर्कस्पेस में वॉइस कमांड से बकाया भुगतान या जोखिम वाले ऑर्डर देख सकते हैं।'
      ),
    },
    {
      q: tr(
        language,
        'Is my store data isolated from other businesses?',
        'क्या मेरी दुकान का डेटा अन्य व्यवसायों से अलग और सुरक्षित रहता है?'
      ),
      a: tr(
        language,
        'Yes. Every business account has its own isolated records, encrypted integration credentials, and full audit history.',
        'हाँ। हर दुकान खाते का अपना अलग डेटाबेस रिकॉर्ड, एन्क्रिप्टेड API क्रेडेंशियल और पूरा ऑडिट इतिहास होता है।'
      ),
    },
  ];

  return (
    <section id="faq" className="max-w-3xl mx-auto space-y-6 scroll-mt-24">
      <div className="text-center space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#22D3EE]">
          {tr(language, 'Questions & Answers', 'सवाल और जवाब')}
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#071A35] dark:text-white">
          {tr(language, 'Frequently Asked Questions', 'अक्सर पूछे जाने वाले सवाल')}
        </h2>
      </div>

      <div className="space-y-2.5">
        {faqs.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={item.q}
              className="rounded-2xl border border-[#E2E8F0] dark:border-[#1E3A5F] bg-white dark:bg-[#0B1E40] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full px-5 py-4 flex items-center justify-between text-left gap-3 cursor-pointer"
              >
                <span className="text-sm font-bold text-[#071A35] dark:text-white">{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform ${
                    isOpen ? 'rotate-180 text-[#2563EB] dark:text-[#22D3EE]' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-4 text-xs sm:text-sm text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

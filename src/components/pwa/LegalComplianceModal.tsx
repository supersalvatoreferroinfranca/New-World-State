/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * New World State - Multilingual Legal Compliance Modal
 * Supports all 11 official portal languages (IT, EN, FR, ES, PT, RU, HI, BN, ZH, JA, AR)
 * Documents: Privacy Policy (GDPR/CCPA/APP), Cookie Policy, Terms of Service, WCAG Accessibility, CCPA Opt-Out
 */

import React, { useState, useEffect } from 'react';
import { useLegal } from '../../hooks/useLegal';
import { useI18n } from '../../contexts/I18nContext';
import { Language } from '../../constants/translations';
import { LANGUAGES, FlagIcon } from '../common/LanguageSelector';
import { 
  X, 
  Globe, 
  Shield, 
  Scale, 
  FileText, 
  Accessibility, 
  Printer, 
  EyeOff,
  Cookie,
  RotateCcw,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import {
  LEGAL_MODAL_UI,
  PRIVACY_DOC_DATA,
  COOKIES_DOC_DATA,
  TERMS_DOC_DATA,
  ACCESSIBILITY_DOC_DATA,
  CCPA_DOC_DATA
} from '../../data/legalTranslationsData';

interface LegalComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc: 'privacy' | 'cookies' | 'terms' | 'accessibility' | 'ccpa';
  language?: Language;
}

export default function LegalComplianceModal({ isOpen, onClose, initialDoc, language: propLanguage }: LegalComplianceModalProps) {
  const { currentLanguage, setLanguage: setGlobalLanguage } = useI18n();
  const activeLanguage = propLanguage || currentLanguage || 'it';
  
  const { config } = useLegal();
  const [docType, setDocType] = useState<'privacy' | 'cookies' | 'terms' | 'accessibility' | 'ccpa'>(initialDoc);
  const [lang, setLang] = useState<Language>(activeLanguage);
  
  const [ccpaOptOut, setCcpaOptOut] = useState<boolean>(() => {
    return localStorage.getItem('nws_ccpa_optout') !== 'false';
  });

  const handleCcpaToggle = (val: boolean) => {
    setCcpaOptOut(val);
    localStorage.setItem('nws_ccpa_optout', String(val));
  };

  useEffect(() => {
    setDocType(initialDoc);
  }, [initialDoc]);

  useEffect(() => {
    if (activeLanguage) {
      setLang(activeLanguage);
    }
  }, [activeLanguage]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    setGlobalLanguage(newLang);
  };

  const controller = config?.legal_controller_name || 'New World State Authority';
  const address = config?.legal_controller_address || 'Global Decentralized Infrastructure';
  const email = config?.legal_controller_email || 'privacy@newworldstate.org';
  const score = config?.legal_accessibility_score || 'WCAG 2.1 AA Conforming';

  const customPrivacy = lang === 'it' ? config?.legal_custom_privacy_it : config?.legal_custom_privacy_en;
  const customTerms = lang === 'it' ? config?.legal_custom_terms_it : config?.legal_custom_terms_en;

  const currentPrivacy = PRIVACY_DOC_DATA[lang] || PRIVACY_DOC_DATA.it;
  const currentCookies = COOKIES_DOC_DATA[lang] || COOKIES_DOC_DATA.it;
  const currentTerms = TERMS_DOC_DATA[lang] || TERMS_DOC_DATA.it;
  const currentAccess = ACCESSIBILITY_DOC_DATA[lang] || ACCESSIBILITY_DOC_DATA.it;
  const currentCcpa = CCPA_DOC_DATA[lang] || CCPA_DOC_DATA.it;

  const tUI = (key: keyof typeof LEGAL_MODAL_UI) => {
    return LEGAL_MODAL_UI[key]?.[lang] || LEGAL_MODAL_UI[key]?.['en'] || key;
  };

  // Render Document Contents
  const renderDocContent = () => {
    switch (docType) {
      case 'privacy':
        return (
          <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-600 flex items-center justify-between">
              <span>{currentPrivacy.effectiveDate}</span>
              <span className="font-bold text-[#0a1c3e]">{currentPrivacy.badge}</span>
            </div>

            {currentPrivacy.sections.map((sec, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="font-serif font-bold text-[#0a1c3e] text-sm">{sec.heading}</h4>
                <p>{sec.content.replace('{controller}', controller).replace('{address}', address).replace('{email}', email)}</p>
                {sec.list && (
                  <ul className="list-disc pl-5 space-y-1 mt-2 text-slate-600">
                    {sec.list.map((item, lIdx) => (
                      <li key={lIdx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* Interactive Real-Time Consent Management */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 mt-4">
              <h5 className="font-semibold text-slate-800 text-[11px]">
                {lang === 'it' ? 'Gestione Immediata del Consenso' : 'Real-time Consent Revocation'}
              </h5>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    window.dispatchEvent(new Event('nws_reopen_cookie_banner'));
                    onClose();
                  }}
                  className="bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] px-3.5 py-1.5 rounded-lg text-[9px] font-bold uppercase transition cursor-pointer"
                >
                  {lang === 'it' ? 'Personalizza Cookie' : 'Customize Cookies'}
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('nws_cookie_consent');
                    localStorage.removeItem('nws_dismiss_pwa');
                    localStorage.removeItem('nws_access_font_size');
                    localStorage.removeItem('nws_access_contrast');
                    localStorage.removeItem('nws_local_notifications');
                    localStorage.removeItem('nws_notifications_enabled');
                    alert(lang === 'it' ? 'Consenso revocato e preferenze cancellate con successo.' : 'Consent revoked and preferences reset successfully.');
                    window.location.reload();
                  }}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3.5 py-1.5 rounded-lg text-[9px] font-bold uppercase transition cursor-pointer"
                >
                  {lang === 'it' ? 'Resetta Cookie Non Essenziali' : 'Reset Non-Essential Cookies'}
                </button>
              </div>
            </div>

            {customPrivacy && (
              <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-2 mt-4 italic text-slate-600">
                <p className="font-bold font-serif not-italic text-slate-800">
                  {lang === 'it' ? 'Disposizioni Particolari dell’Autorità' : 'Special Administrative Provisions'}
                </p>
                <p className="whitespace-pre-line text-xs">{customPrivacy}</p>
              </div>
            )}
          </div>
        );

      case 'cookies':
        return (
          <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-600 flex items-center justify-between">
              <span>GDPR / ePrivacy Directive</span>
              <span className="font-bold text-[#0a1c3e]">{currentCookies.badge}</span>
            </div>

            <p>{currentCookies.intro}</p>

            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-[10px] text-left font-mono">
                <thead className="bg-slate-50 font-sans text-slate-700 font-semibold">
                  <tr>
                    <th className="px-3 py-2.5">{currentCookies.tableHeaders[0]}</th>
                    <th className="px-3 py-2.5">{currentCookies.tableHeaders[1]}</th>
                    <th className="px-3 py-2.5">{currentCookies.tableHeaders[2]}</th>
                    <th className="px-3 py-2.5">{currentCookies.tableHeaders[3]}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {currentCookies.tableRows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-3 py-2 font-bold text-[#0a1c3e]">{row[0]}</td>
                      <td className="px-3 py-2">{row[1]}</td>
                      <td className="px-3 py-2">{row[2]}</td>
                      <td className="px-3 py-2 font-sans">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h5 className="font-serif font-bold text-slate-800 text-[11px]">{currentCookies.thirdPartyTitle}</h5>
              <p className="text-[11px] text-slate-600">{currentCookies.thirdPartyBody}</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  window.dispatchEvent(new Event('nws_reopen_cookie_banner'));
                  onClose();
                }}
                className="bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <EyeOff className="w-3.5 h-3.5" />
                {lang === 'it' ? 'Riapri Gestione Consenso Cookie' : 'Reopen Cookie Management Banner'}
              </button>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-600 flex items-center justify-between">
              <span>CIVIC TREATY 1.0</span>
              <span className="font-bold text-[#0a1c3e]">{currentTerms.badge}</span>
            </div>

            {currentTerms.sections.map((sec, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="font-serif font-bold text-[#0a1c3e] text-sm">{sec.heading}</h4>
                <p>{sec.content}</p>
              </div>
            ))}

            {customTerms && (
              <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-2 mt-4 italic text-slate-600">
                <p className="font-bold font-serif not-italic text-slate-800">
                  {lang === 'it' ? 'Clausole Integrative dell’Autorità' : 'Additional Civic Clauses'}
                </p>
                <p className="whitespace-pre-line text-xs">{customTerms}</p>
              </div>
            )}
          </div>
        );

      case 'accessibility':
        return (
          <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-600 flex items-center justify-between">
              <span>WCAG 2.1 AA / ADA</span>
              <span className="font-bold text-emerald-700">{score}</span>
            </div>

            <p>{currentAccess.intro}</p>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-[#0a1c3e] text-sm">{currentAccess.standardsTitle}</h4>
              <p>{currentAccess.standardsBody}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-[#0a1c3e] text-sm">{currentAccess.featuresTitle}</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                {currentAccess.features.map((feat, fIdx) => (
                  <li key={fIdx}>{feat}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
              <h5 className="font-serif font-bold text-emerald-900 text-[11px]">{currentAccess.contactTitle}</h5>
              <p className="text-[11px] text-emerald-800">{currentAccess.contactBody}</p>
            </div>
          </div>
        );

      case 'ccpa':
        return (
          <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-600 flex items-center justify-between">
              <span>California Consumer Privacy Act</span>
              <span className="font-bold text-[#0a1c3e]">{currentCcpa.badge}</span>
            </div>

            <p>{currentCcpa.intro}</p>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-[#0a1c3e] text-sm">{currentCcpa.noSellTitle}</h4>
              <p>{currentCcpa.noSellBody}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-[#0a1c3e] text-sm">{currentCcpa.rightsTitle}</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                {currentCcpa.rights.map((r, rIdx) => (
                  <li key={rIdx}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h5 className="font-serif font-bold text-[#0a1c3e] text-[11px]">{currentCcpa.optOutNoticeTitle}</h5>
              <p className="text-[10px] text-slate-600 leading-normal">{currentCcpa.optOutNoticeBody}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <span className="font-semibold text-slate-800 text-[11px] pr-4">{currentCcpa.toggleLabel}</span>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={ccpaOptOut}
                    onChange={(e) => handleCcpaToggle(e.target.checked)}
                  />
                  <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0a1c3e]"></div>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2 text-[9px] font-mono">
                <span className={`inline-block w-2 h-2 rounded-full ${ccpaOptOut ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-slate-600">
                  {ccpaOptOut ? (
                    <strong className="text-emerald-700">{currentCcpa.optedOutText}</strong>
                  ) : (
                    <strong className="text-amber-700">{currentCcpa.optedInText}</strong>
                  )}
                </span>
              </div>
            </div>
          </div>
        );
    }
  };

  const getDocHeaderTitle = () => {
    switch (docType) {
      case 'privacy': return currentPrivacy.title;
      case 'cookies': return currentCookies.title;
      case 'terms': return currentTerms.title;
      case 'accessibility': return currentAccess.title;
      case 'ccpa': return currentCcpa.title;
    }
  };

  const getDocHeaderIcon = () => {
    switch (docType) {
      case 'privacy': return <Shield className="w-5 h-5 text-brand-gold" />;
      case 'cookies': return <EyeOff className="w-5 h-5 text-brand-gold" />;
      case 'terms': return <Scale className="w-5 h-5 text-brand-gold" />;
      case 'accessibility': return <Accessibility className="w-5 h-5 text-brand-gold" />;
      case 'ccpa': return <Globe className="w-5 h-5 text-brand-gold" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-white w-full max-w-4xl h-[92vh] max-h-[850px] rounded-3xl shadow-2xl flex flex-col border border-brand-gold/40 overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="bg-[#0a1c3e] text-white p-4 md:p-6 flex items-center justify-between border-b border-brand-gold/30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-white/10 rounded-xl border border-brand-gold/30 shrink-0">
              {getDocHeaderIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-sm md:text-lg text-brand-gold truncate">
                {getDocHeaderTitle()}
              </h3>
              <p className="text-[9px] uppercase tracking-widest text-slate-300 font-tech truncate">
                New World State • {tUI('officialComplianceProtocol')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Multilingual Selector Dropdown for all 11 languages */}
            <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/15">
              <Globe className="w-3.5 h-3.5 text-brand-gold ml-1 mr-1.5" />
              <select
                value={lang}
                onChange={(e) => handleLangChange(e.target.value as Language)}
                aria-label="Select Legal Document Language"
                className="bg-transparent text-white text-[11px] font-bold focus:outline-none cursor-pointer pr-1"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#0a1c3e] text-white">
                    {l.label} - {l.nativeName}
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={handlePrint}
              title={tUI('printDocument')}
              aria-label={tUI('printDocument')}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button 
              onClick={onClose}
              aria-label="Close dialog"
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div className="p-5 md:p-8 overflow-y-auto bg-[#f7f5f0] flex-1 text-slate-800">
          <div className="bg-white border border-[#c5a880]/20 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
            
            {/* Watermark in background */}
            <div className="absolute right-0 bottom-0 opacity-[0.015] transform translate-x-12 translate-y-12 pointer-events-none">
              <Scale className="w-96 h-96 text-brand-blue" />
            </div>

            {/* Formal Chancellery Header */}
            <div className="border-b border-dashed border-slate-200 pb-4 text-center space-y-1 relative">
              <p className="font-serif font-extrabold tracking-widest text-[#0a1c3e] text-xs uppercase">
                {tUI('chancelleryTitle')}
              </p>
              <p className="text-[8px] text-slate-400 font-mono tracking-widest uppercase">
                {tUI('officialComplianceProtocol')} • {docType.toUpperCase()}
              </p>
              <div className="h-0.5 w-16 bg-brand-gold/40 mx-auto rounded-full mt-1.5" />
            </div>

            {/* Dynamic Content */}
            {renderDocContent()}

            {/* Seal and Signature Footer */}
            <div className="border-t border-slate-100 pt-6 flex flex-col md:flex-row items-center justify-between text-[8px] text-slate-400 font-mono gap-4">
              <div className="text-center md:text-left">
                <p>DOCUMENT CODE: NWS-COMPLIANCE-{docType.toUpperCase()}-2026</p>
                <p>STATUS: {tUI('activeAndVerified')}</p>
              </div>
              <div className="text-center md:text-right border-l md:border-l-0 pl-4 md:pl-0">
                <p className="text-brand-gold font-bold">{tUI('chancelleryTitle')}</p>
                <p>{tUI('decentralizedAuth')}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Document Type Tabs */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 shrink-0 flex justify-center gap-1.5 flex-wrap">
          <button
            onClick={() => setDocType('privacy')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer ${
              docType === 'privacy' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tUI('privacyTab')}
          </button>
          <button
            onClick={() => setDocType('cookies')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer ${
              docType === 'cookies' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tUI('cookiesTab')}
          </button>
          <button
            onClick={() => setDocType('terms')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer ${
              docType === 'terms' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tUI('termsTab')}
          </button>
          <button
            onClick={() => setDocType('accessibility')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer ${
              docType === 'accessibility' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tUI('accessibilityTab')}
          </button>
          <button
            onClick={() => setDocType('ccpa')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer ${
              docType === 'ccpa' ? 'bg-[#0a1c3e] text-white shadow' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tUI('ccpaTab')}
          </button>
        </div>

      </div>
    </div>
  );
}

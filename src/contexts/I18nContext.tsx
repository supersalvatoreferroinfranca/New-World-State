import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { TRANSLATIONS, Language } from '../constants/translations';

// Comprehensive dictionary for standard UI phrases found throughout the portal
const COMMON_PHRASES: Record<string, Record<Language, string>> = {
  "Home/Intro": {
    it: "Home/Intro",
    en: "Home/Intro",
    fr: "Accueil/Intro",
    es: "Inicio/Intro",
    pt: "Início/Intro",
    ru: "Главная/Интро",
    hi: "होम/परिचय",
    bn: "হোম/পরিচিতি",
    zh: "首页/引言",
    ja: "ホーム/イントロ",
    ar: "الرئيسية/مقدمة"
  },
  "Direct Democracy": {
    it: "Democrazia Diretta",
    en: "Direct Democracy",
    fr: "Démocratie Directe",
    es: "Democracia Directa",
    pt: "Democracia Direta",
    ru: "Прямая демократия",
    hi: "प्रत्यक्ष लोकतंत्र",
    bn: "প্রত্যক্ষ গণতন্ত্র",
    zh: "直接民主",
    ja: "直接民主主義",
    ar: "الديمقراطية المباشرة"
  },
  "Constitution": {
    it: "Costituzione",
    en: "Constitution",
    fr: "Constitution",
    es: "Constitución",
    pt: "Constituição",
    ru: "Конституция",
    hi: "संविधान",
    bn: "সংবিধান",
    zh: "宪法",
    ja: "憲法",
    ar: "الدستور"
  },
  "Charter of Rights": {
    it: "Carta dei Diritti",
    en: "Charter of Rights",
    fr: "Charte des Droits",
    es: "Carta de Derechos",
    pt: "Carta de Direitos",
    ru: "Хартия прав",
    hi: "अधिकारों का चार्टर",
    bn: "অধিকার সনদ",
    zh: "权利宪章",
    ja: "権利憲章",
    ar: "ميثاق الحقوق"
  },
  "Governance": {
    it: "Governance",
    en: "Governance",
    fr: "Gouvernance",
    es: "Gobernanza",
    pt: "Governança",
    ru: "Управление",
    hi: "शासन",
    bn: "শাসনপ্রণালী",
    zh: "治理",
    ja: "ガバナンス",
    ar: "الحوكمة"
  },
  "Registration": {
    it: "Registrazione",
    en: "Registration",
    fr: "Inscription",
    es: "Registro",
    pt: "Registro",
    ru: "Регистрация",
    hi: "पंजीकरण",
    bn: "নিবন্ধন",
    zh: "注册",
    ja: "市民登録",
    ar: "التسجيل"
  },
  "Privacy Protocol": {
    it: "Protocollo Privacy",
    en: "Privacy Protocol",
    fr: "Protocole de Confidentialité",
    es: "Protocolo de Privacidad",
    pt: "Protocolo de Privacidade",
    ru: "Протокол конфиденциальности",
    hi: "गोपनीयता प्रोटोकॉल",
    bn: "গোপনীয়তা প্রোটোকল",
    zh: "隐私协议",
    ja: "プライバシー・プロトコル",
    ar: "بروتوكول الخصوصية"
  },
  "Network Status": {
    it: "Stato Network",
    en: "Network Status",
    fr: "Statut du Réseau",
    es: "Estado de la Red",
    pt: "Status da Rede",
    ru: "Статус сети",
    hi: "नेटवर्क की स्थिति",
    bn: "নেটওয়ার্ক স্ট্যাটাস",
    zh: "网络状态",
    ja: "ネットワーク・ステータス",
    ar: "حالة الشبكة"
  },
  "Admin Console": {
    it: "Console Amministratore",
    en: "Admin Console",
    fr: "Console d'Administration",
    es: "Consola de Administración",
    pt: "Console de Administração",
    ru: "Панель администратора",
    hi: "एडमिन कंसोल",
    bn: "অ্যাডমিন কনসোল",
    zh: "管理控制台",
    ja: "管理コンソール",
    ar: "لوحة الإشراف"
  },
  "Federal Chat": {
    it: "Chat Federale",
    en: "Federal Chat",
    fr: "Chat Fédéral",
    es: "Chat Federal",
    pt: "Chat Federal",
    ru: "Федеральный чат",
    hi: "संघीय चैट",
    bn: "ফেডারেল চ্যাট",
    zh: "联邦聊天室",
    ja: "連邦チャット",
    ar: "الدردشة الفيدرالية"
  },
  "Sovereign Navigation": {
    it: "Navigazione Sovrana",
    en: "Sovereign Navigation",
    fr: "Navigation Souveraine",
    es: "Navegación Soberana",
    pt: "Navegação Soberana",
    ru: "Суверенная навигация",
    hi: "संप्रभु नेविगेशन",
    bn: "সার্বভৌম নেভিগেশন",
    zh: "主权导航",
    ja: "主権ナビゲーション",
    ar: "الملاحة السيادية"
  },
  "Apply for Citizenship": {
    it: "Richiedi la Cittadinanza",
    en: "Apply for Citizenship",
    fr: "Demander la citoyenneté",
    es: "Solicitar la ciudadanía",
    pt: "Solicitar cidadania",
    ru: "Подать заявку на гражданство",
    hi: "नागरिकता के लिए आवेदन करें",
    bn: "নাগরিকত্বের জন্য আবেদন করুন",
    zh: "申请公民身份",
    ja: "市民権を申請する",
    ar: "تقديم طلب المواطنة"
  },
  "Register as Citizen": {
    it: "Registrati come Cittadino",
    en: "Register as Citizen",
    fr: "S'inscrire comme citoyen",
    es: "Registrarse como ciudadano",
    pt: "Registrar-se como cidadão",
    ru: "Зарегистрироваться как гражданин",
    hi: "नागरिक के रूप में पंजीकरण करें",
    bn: "নাগরিক হিসেবে নিবন্ধন করুন",
    zh: "注册为公民",
    ja: "市民として登録",
    ar: "التسجيل كمواطن"
  },
  "Next": {
    it: "Avanti",
    en: "Next",
    fr: "Suivant",
    es: "Siguiente",
    pt: "Avançar",
    ru: "Далее",
    hi: "आगे",
    bn: "পরবর্তী",
    zh: "下一步",
    ja: "次へ",
    ar: "التالي"
  },
  "Back": {
    it: "Indietro",
    en: "Back",
    fr: "Retour",
    es: "Atrás",
    pt: "Voltar",
    ru: "Назад",
    hi: "पीछे",
    bn: "পিছনে",
    zh: "返回",
    ja: "戻る",
    ar: "رجوع"
  },
  "Legal compliance brief details based on simulated selection": {
    it: "Impatto della conformità legale in base alla selezione simulata",
    en: "Legal compliance details based on simulated selection",
    fr: "Détails de conformité légale basés sur la sélection simulée",
    es: "Detalles de cumplimiento legal basados en la selección simulada",
    pt: "Detalhes de conformidade legal com base na seleção simulada",
    ru: "Детали соответствия законодательству на основе симуляции",
    hi: "सिम्युलेटेड चयन के आधार पर कानूनी अनुपालन विवरण",
    bn: "সিমুলেটেড সিলেকশনের উপর ভিত্তি করে আইনি সম্মতি বিবরণ",
    zh: "基于模拟选择的法律合规性细节",
    ja: "シミュレートされた選択に基づく法的コンプライアンス詳細",
    ar: "تفاصيل الامتثال القانوني بناءً على التحديد المحاكي"
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
  tText: (english: string, italian?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  // Try to load initial language preference
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('nws_preferred_language') as Language;
    return (saved && TRANSLATIONS[saved]) ? saved : 'it';
  });

  const setLanguage = (lang: Language) => {
    if (TRANSLATIONS[lang]) {
      setLanguageState(lang);
      localStorage.setItem('nws_preferred_language', lang);
      // Dispatch custom event to notify components that language has changed
      window.dispatchEvent(new CustomEvent('nws_language_changed', { detail: lang }));
    }
  };

  useEffect(() => {
    const handleLangChange = (e: any) => {
      if (e.detail && e.detail !== language) {
        setLanguageState(e.detail);
      }
    };
    window.addEventListener('nws_language_changed', handleLangChange as EventListener);
    return () => window.removeEventListener('nws_language_changed', handleLangChange as EventListener);
  }, [language]);

  const t = (key: keyof typeof TRANSLATIONS['en']) => {
    return TRANSLATIONS[language][key] || TRANSLATIONS['en'][key] || key;
  };

  // Ultra-smart translation engine: Looks up a general string, falls back elegantly
  const tText = (english: string, italian?: string): string => {
    if (!english) return '';
    
    // 1. Try to match direct english key in COMMON_PHRASES
    if (COMMON_PHRASES[english] && COMMON_PHRASES[english][language]) {
      return COMMON_PHRASES[english][language];
    }

    // 2. Try to match italian key if provided
    if (italian) {
      // Find inside COMMON_PHRASES by scanning Italian entries
      const foundEntry = Object.values(COMMON_PHRASES).find(entry => entry.it === italian);
      if (foundEntry && foundEntry[language]) {
        return foundEntry[language];
      }
    }

    // 3. Simple fallback logic if not in dictionary
    if (language === 'en') return english;
    if (language === 'it') return italian || english;

    // Return the english term as standard fallback for other languages to avoid blank UI
    return english;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, tText }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

import React, { useState, useEffect } from 'react';
import { 
  Cookie, 
  Shield, 
  Settings, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  FileText,
  Lock,
  ArrowRight,
  Globe
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { Language } from '../../constants/translations';

interface CookieConsentBannerProps {
  onOpenPrivacy: () => void;
  onOpenCookies: () => void;
  onOpenCcpa: () => void;
}

export interface CookiePreferences {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
}

const COOKIE_BANNER_LOCALIZATIONS: Record<string, Record<Language, string>> = {
  title: {
    it: 'Tutela della Privacy & Consenso Cookie',
    en: 'Privacy Protection & Cookie Consent',
    fr: 'Protection de la Vie Privée & Consentement aux Cookies',
    es: 'Protección de la Privacidad y Consentimiento de Cookies',
    pt: 'Proteção de Privacidade e Consentimento de Cookies',
    ru: 'Защита конфиденциальности и согласие на использование файлов cookie',
    hi: 'गोपनीयता संरक्षण और कुकी सहमति',
    bn: 'গোপনীয়তা সুরক্ষা এবং কুকি সম্মতি',
    zh: '隐私保护与 Cookie 授权声明',
    ja: 'プライバシー保護とクッキー同意',
    ar: 'حماية الخصوصية والموافقة على ملفات تعريف الارتباط'
  },
  description: {
    it: 'Utilizziamo cookie tecnici essenziali per garantire il corretto funzionamento del portale anagrafico. Con il tuo consenso, vorremmo abilitare cookie opzionali per memorizzare le tue preferenze d\'interfaccia ed effettuare diagnosi anonime.',
    en: 'We use essential technical cookies to guarantee the correct behavior of the citizenship registry. With your consent, we would also like to enable optional cookies to remember your interface preferences and perform anonymous diagnostics.',
    fr: 'Nous utilisons des cookies techniques indispensables au bon fonctionnement du registre civil. Avec votre accord, nous aimerions activer des cookies optionnels pour enregistrer vos préférences d’interface et réaliser des diagnostics anonymes.',
    es: 'Utilizamos cookies técnicas esenciales para garantizar el correcto funcionamiento del portal. Con su consentimiento, nos gustaría habilitar cookies opcionales para recordar sus preferencias y realizar diagnósticos anónimos.',
    pt: 'Utilizamos cookies técnicos essenciais para o funcionamento do portal. Com o seu consentimento, ativamos cookies opcionais para memorizar preferências de interface e diagnósticos anônimos.',
    ru: 'Мы используем обязательные технические файлы cookie для корректной работы портала. С вашего согласия мы также используем дополнительные файлы для сохранения настроек и анонимной диагностики.',
    hi: 'हम नागरिक पोर्टल के सुचारू संचालन के लिए आवश्यक तकनीकी कुकीज़ का उपयोग करते हैं। आपकी सहमति से, हम इंटरफ़ेस प्राथमिकताओं को सहेजने के लिए वैकल्पिक कुकीज़ सक्षम करना चाहते हैं।',
    bn: 'আমরা নাগরিক পোর্টালের সঠিক কার্যকারিতার জন্য প্রয়োজনীয় প্রযুক্তিগত কুকিজ ব্যবহার করি। আপনার সম্মতিতে ইন্টারফেস পছন্দ মনে রাখতে আমরা ঐচ্ছিক কুকিজ ব্যবহার করতে চাই।',
    zh: '我们使用核心必要的技术 Cookie 来确保户籍政务系统的稳定运行。在您授权的前提下，我们希望启用可选的技术项以记住您的个性化偏好并进行全匿名诊断。',
    ja: '市民台帳ポータルの正常な動作のために不可欠な技術的クッキーを使用しています。同意をいただいた場合のみ、設定記憶や匿名診断のためのオプションクッキーを有効化します。',
    ar: 'نستخدم ملفات تعريف ارتباط تقنية أساسية لضمان عمل البوابة بسلاسة. وبموافقتك، نرغب في تفعيل ملفات اختيارية لحفظ تفضيلاتك وإجراء تشخيصات مجهولة المصدر.'
  },
  manageTitle: {
    it: 'Gestione Preferenze Consenso',
    en: 'Manage Consent Preferences',
    fr: 'Gestion des Préférences',
    es: 'Gestión de Preferencias',
    pt: 'Gestão de Preferências',
    ru: 'Настройка параметров согласия',
    hi: 'सहमति प्राथमिकताएं प्रबंधित करें',
    bn: 'সম্মতি পছন্দসমূহ পরিচালনা করুন',
    zh: '管理知情同意授权偏好',
    ja: 'クッキー同意設定の管理',
    ar: 'إدارة تفضيلات الموافقة'
  },
  cat1Title: {
    it: '1. Cookie Tecnici ed Essenziali',
    en: '1. Technical & Necessary Cookies',
    fr: '1. Cookies Techniques et Nécessaires',
    es: '1. Cookies Técnicas y Esenciales',
    pt: '1. Cookies Técnicos e Necessários',
    ru: '1. Обязательные технические файлы cookie',
    hi: '1. आवश्यक तकनीकी कुकीज़',
    bn: '১. প্রয়োজনীয় প্রযুক্তিগত কুকিজ',
    zh: '1. 系统必备核心技术 Cookie',
    ja: '1. 必須・基盤技術クッキー',
    ar: '1. ملفات تعريف الارتباط التقنية والضرورية'
  },
  alwaysActive: {
    it: 'Sempre Attivi',
    en: 'Always Active',
    fr: 'Toujours Actifs',
    es: 'Siempre Activas',
    pt: 'Sempre Ativos',
    ru: 'Всегда активны',
    hi: 'सदैव सक्रिय',
    bn: 'সর্বদা সক্রিয়',
    zh: '始终启用',
    ja: '常時有効',
    ar: 'نشط دائمًا'
  },
  cat1Desc: {
    it: 'Necessari per mantenere la sessione, la selezione della lingua e la scalatura dell\'accessibilità.',
    en: 'Required to maintain secure sessions, language preferences, and text accessibility scaling.',
    fr: 'Requis pour maintenir la session sécurisée, la langue choisie et l’agrandissement du texte.',
    es: 'Necesarios para mantener sesiones seguras, preferencia de idioma y ampliación accesible.',
    pt: 'Necessários para manter sessões seguras, escolha de idioma e escala de acessibilidade.',
    ru: 'Необходимы для поддержания безопасной сессии, выбора языка и масштабирования шрифта.',
    hi: 'सुरक्षित सत्र, भाषा वरीयता और सुलभता ज़ूम बनाए रखने के लिए आवश्यक।',
    bn: 'নিরাপদ সেশন, ভাষা নির্বাচন এবং ফন্ট স্কেলিং বজায় রাখার জন্য আবশ্যক।',
    zh: '维护安全会话、门户语言切换及无障碍字号缩放所必需的核心要素。',
    ja: 'セッションの維持、表示言語設定、及びアクセシビリティ拡大のために不可欠です。',
    ar: 'مطلوبة للحفاظ على جلسات آمنة وتفضيلات اللغة وإمكانية تكبير النصوص.'
  },
  cat2Title: {
    it: '2. Cookie e Storage di Preferenza',
    en: '2. Preference Cookies & Storage',
    fr: '2. Cookies et Stockage de Préférences',
    es: '2. Cookies y Almacenamiento de Preferencias',
    pt: '2. Cookies e Armazenamento de Preferências',
    ru: '2. Файлы настроек и предпочтений',
    hi: '2. वरीयता कुकीज़ और भंडारण',
    bn: '২. পছন্দসমূহ সংক্রান্ত কুকিজ',
    zh: '2. 界面个性化偏好存储项',
    ja: '2. 設定・カスタマイズ保持クッキー',
    ar: '2. ملفات التفضيلات والتخزين المحلي'
  },
  cat2Desc: {
    it: 'Abilitano la memorizzazione delle preferenze personali, come la dismissione degli avvisi di installazione PWA.',
    en: 'Enable saving personal preferences, such as hiding PWA installation prompts and temporary forms.',
    fr: 'Permettent de sauvegarder vos choix personnels, comme le masquage des invites d’installation.',
    es: 'Permiten guardar preferencias como la ocultación del aviso de instalación de la aplicación.',
    pt: 'Permitem memorizar opções como ocultar o aviso de instalação do aplicativo PWA.',
    ru: 'Позволяют сохранять личные настройки, например скрытие напоминаний об установке приложения.',
    hi: 'व्यक्तिगत प्राथमिकताओं को सहेजते हैं, जैसे कि ऐप इंस्टॉलेशन प्रॉम्प्ट को छिपाना।',
    bn: 'অ্যাপ ইনস্টলেশন নোটিশ আড়াল করার মতো ব্যক্তিগত পছন্দগুলো সংরক্ষণ করে।',
    zh: '用于记住个性化选项，如关闭 Web 应用安装提醒框以及草稿保护。',
    ja: 'PWAインストール促進表示の抑制など、個人の利便性設定を保持します。',
    ar: 'تتيح حفظ التفضيلات الشخصية، مثل إخفاء تنبيهات تثبيت تطبيق الويب.'
  },
  cat3Title: {
    it: '3. Cookie Analitici e Prestazionali',
    en: '3. Analytics & Performance Trackers',
    fr: '3. Mesures de Performance et Diagnostic',
    es: '3. Diagnóstico y Rendimiento Anónimo',
    pt: '3. Diagnósticos e Desempenho Anônimo',
    ru: '3. Аналитические и диагностические файлы',
    hi: '3. विश्लेषिकी और प्रदर्शन निदान',
    bn: '৩. অ্যানালিটিক্স ও পারফরম্যান্স ডায়াগনস্টিক',
    zh: '3. 节点性能与全匿名健康诊断',
    ja: '3. パフォーマンス及び匿名診断クッキー',
    ar: '3. التحليلات وتشخيص الأداء مجهول الهوية'
  },
  cat3Desc: {
    it: 'Consentono di analizzare in modo totalmente anonimo l\'efficienza dei nostri server regionali Edge.',
    en: 'Allow fully anonymous performance diagnosis to optimize our regional Edge servers.',
    fr: 'Permettent une analyse entièrement anonyme pour optimiser la réactivité de nos serveurs.',
    es: 'Permiten diagnosticar de forma 100% anónima el rendimiento de los servidores distribuidos.',
    pt: 'Permitem avaliar de forma totalmente anônima a velocidade dos nossos nós de rede.',
    ru: 'Позволяют проводить полностью анонимную диагностику производительности серверов.',
    hi: 'हमारे क्षेत्रीय सर्वरों के प्रदर्शन का पूरी तरह से गुमनाम विश्लेषण करने की अनुमति देते हैं।',
    bn: 'সার্ভারের গতি ও কর্মক্ষমতা সম্পূর্ণ বেনামে বিশ্লেষণ করতে সহায়তা করে।',
    zh: '仅用于全匿名、零用户画像的方式评估全球边缘服务器节点的响应负载与网络健康。',
    ja: '個人を特定しない完全な匿名形式でサーバー応答速度の最適化診断を行います。',
    ar: 'تتيح تشخيصًا مجهول الهوية تمامًا لتحسين استجابة الخوادم الموزعة وسرعتها.'
  },
  privacyPolicy: {
    it: 'Informativa Privacy',
    en: 'Privacy Policy',
    fr: 'Politique de Confidentialité',
    es: 'Política de Privacidad',
    pt: 'Política de Privacidade',
    ru: 'Политика конфиденциальности',
    hi: 'गोपनीयता नीति',
    bn: 'গোপনীয়তা নীতি',
    zh: '隐私政策',
    ja: 'プライバシーポリシー',
    ar: 'سياسة الخصوصية'
  },
  cookieDetails: {
    it: 'Dettagli Cookie',
    en: 'Cookie Details',
    fr: 'Détails des Cookies',
    es: 'Detalles de Cookies',
    pt: 'Detalhes dos Cookies',
    ru: 'Подробности о cookie',
    hi: 'कुकी विवरण',
    bn: 'কুকি বিবরণ',
    zh: 'Cookie 详细说明',
    ja: 'クッキー詳細',
    ar: 'تفاصيل ملفات تعريف الارتباط'
  },
  doNotSell: {
    it: 'Non Vendere i Miei Dati (CCPA)',
    en: 'Do Not Sell My Personal Info',
    fr: 'Ne Pas Vendre Mes Données (CCPA)',
    es: 'No Vender Mis Datos (CCPA)',
    pt: 'Não Vender Meus Dados (CCPA)',
    ru: 'Не продавать мои данные (CCPA)',
    hi: 'मेरी जानकारी न बेचें (CCPA)',
    bn: 'আমার তথ্য বিক্রি করবেন না (CCPA)',
    zh: '禁止出售我的个人信息 (CCPA)',
    ja: '個人情報を販売しない (CCPA)',
    ar: 'عدم بيع معلوماتي الشخصية (CCPA)'
  },
  hideDetails: {
    it: 'Nascondi Dettagli',
    en: 'Hide Customizer',
    fr: 'Masquer les Détails',
    es: 'Ocultar Detalles',
    pt: 'Ocultar Detalhes',
    ru: 'Скрыть настройки',
    hi: 'विवरण छुपाएं',
    bn: 'বিবরণ লুকান',
    zh: '收起细分设置',
    ja: '詳細設定を閉じる',
    ar: 'إخفاء التفاصيل'
  },
  customize: {
    it: 'Personalizza Scelte',
    en: 'Customize Choices',
    fr: 'Personnaliser les Choix',
    es: 'Personalizar Opciones',
    pt: 'Personalizar Escolhas',
    ru: 'Настроить выбор',
    hi: 'पसंद अनुकूलित करें',
    bn: 'পছন্দসমূহ সাজান',
    zh: '个性化选择',
    ja: '詳細を選択する',
    ar: 'تخصيص الخيارات'
  },
  savePreferences: {
    it: 'Salva Preferenze',
    en: 'Save Preferences',
    fr: 'Enregistrer les Choix',
    es: 'Guardar Preferencias',
    pt: 'Salvar Preferências',
    ru: 'Сохранить выбор',
    hi: 'प्राथमिकताएं सहेजें',
    bn: 'পছন্দসমূহ সংরক্ষণ করুন',
    zh: '保存我的授权选择',
    ja: '設定を保存する',
    ar: 'حفظ التفضيلات'
  },
  rejectAll: {
    it: 'Rifiuta Tutti',
    en: 'Reject All',
    fr: 'Tout Refuser',
    es: 'Rechazar Todo',
    pt: 'Rejeitar Todos',
    ru: 'Отклонить все',
    hi: 'सभी अस्वीकार करें',
    bn: 'সব প্রত্যাখ্যান করুন',
    zh: '仅接受必备项',
    ja: '必須のみに制限する',
    ar: 'رفض الكل'
  },
  acceptAll: {
    it: 'Accetta Tutti',
    en: 'Accept All',
    fr: 'Tout Accepter',
    es: 'Aceptar Todo',
    pt: 'Aceitar Todos',
    ru: 'Принять все',
    hi: 'सभी स्वीकार करें',
    bn: 'সব গ্রহণ করুন',
    zh: '全部信任并同意',
    ja: 'すべて同意する',
    ar: 'قبول الكل'
  }
};

export default function CookieConsentBanner({ onOpenPrivacy, onOpenCookies, onOpenCcpa }: CookieConsentBannerProps) {
  const { language } = useI18n();
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  
  // Consent state
  const [prefs, setPrefs] = useState<CookiePreferences>({
    essential: true,
    preferences: false,
    analytics: false
  });

  // Active simulated jurisdiction state
  const [simulatedJurisdiction, setSimulatedJurisdiction] = useState<string>(() => {
    return localStorage.getItem('nws_simulated_jurisdiction') || 'nws';
  });

  useEffect(() => {
    const handleJurisdictionChange = (e: any) => {
      setSimulatedJurisdiction(e.detail || 'nws');
    };
    window.addEventListener('nws_privacy_jurisdiction_changed', handleJurisdictionChange as EventListener);
    return () => window.removeEventListener('nws_privacy_jurisdiction_changed', handleJurisdictionChange as EventListener);
  }, []);

  useEffect(() => {
    // Check if consent has already been given
    const savedConsent = localStorage.getItem('nws_cookie_consent');
    if (!savedConsent) {
      // Delay slightly for natural overlay emergence
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        setPrefs(parsed);
      } catch (e) {
        setIsVisible(true);
      }
    }
  }, []);

const logConsentEvent = (type: string, currentPrefs: CookiePreferences) => {
  try {
    const logsString = localStorage.getItem('nws_consent_logs');
    const logs = logsString ? JSON.parse(logsString) : [];
    
    // Generate compliant, privacy-preserving obfuscated IP representation for GDPR
    const ipPrefixes = ['151.38', '93.41', '79.12', '82.55', '2.234'];
    const chosenPrefix = ipPrefixes[Math.floor(Math.random() * ipPrefixes.length)];
    const mockObfuscatedIp = `${chosenPrefix}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)} (GDPR Masked)`;
    
    const newLog = {
      id: `CON-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ip: mockObfuscatedIp,
      userAgent: navigator.userAgent,
      action: type,
      preferences: currentPrefs.preferences,
      analytics: currentPrefs.analytics,
      essential: currentPrefs.essential,
      origin: window.location.origin
    };
    
    // Keep last 150 entries to prevent localStorage bloat
    const updatedLogs = [newLog, ...logs].slice(0, 150);
    localStorage.setItem('nws_consent_logs', JSON.stringify(updatedLogs));
    
    // Dispatch event to refresh any listening Admin panels immediately
    window.dispatchEvent(new Event('nws_consent_logs_updated'));
  } catch (e) {
    console.error('Error logging cookie consent preference:', e);
  }
};

  const handleAcceptAll = () => {
    const allPrefs = { essential: true, preferences: true, analytics: true };
    setPrefs(allPrefs);
    localStorage.setItem('nws_cookie_consent', JSON.stringify(allPrefs));
    logConsentEvent('Accept All', allPrefs);
    setIsVisible(false);
  };

  const handleAcceptEssentialOnly = () => {
    const essentialPrefs = { essential: true, preferences: false, analytics: false };
    setPrefs(essentialPrefs);
    localStorage.setItem('nws_cookie_consent', JSON.stringify(essentialPrefs));
    logConsentEvent('Accept Essential Only', essentialPrefs);
    
    // Clear any non-essential cached preferences if blocked
    localStorage.removeItem('nws_dismiss_pwa');
    
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    localStorage.setItem('nws_cookie_consent', JSON.stringify(prefs));
    logConsentEvent('Custom Preferences Saved', prefs);
    
    if (!prefs.preferences) {
      localStorage.removeItem('nws_dismiss_pwa');
    }
    
    setIsVisible(false);
  };

  const togglePref = (key: keyof CookiePreferences) => {
    if (key === 'essential') return; // Cannot disable essential
    setPrefs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Re-open if the user clicks a specific trigger
  useEffect(() => {
    const handleReopen = () => {
      setIsVisible(true);
      setShowCustomizer(true);
    };
    window.addEventListener('nws_reopen_cookie_banner', handleReopen);
    return () => window.removeEventListener('nws_reopen_cookie_banner', handleReopen);
  }, []);

  if (!isVisible) return null;

  const currentLang = (language as Language) || 'it';
  const tC = (key: keyof typeof COOKIE_BANNER_LOCALIZATIONS): string => {
    return COOKIE_BANNER_LOCALIZATIONS[key]?.[currentLang] || COOKIE_BANNER_LOCALIZATIONS[key]?.['en'] || '';
  };

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-xl z-[998] font-sans accessibility-exclude">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xl p-5 md:p-6 space-y-4 animate-fade-in relative overflow-hidden">
        
        {/* Subtle top decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0a1c3e] via-brand-gold to-[#0a1c3e]" />
        
        {/* Header and main text */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#0a1c3e]/5 text-[#0a1c3e] rounded-2xl border border-[#0a1c3e]/10 shrink-0">
            <Cookie className="w-5 h-5 text-brand-gold animate-pulse" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 justify-between">
              <h3 className="text-xs font-serif font-bold text-[#0a1c3e] uppercase tracking-wider flex items-center gap-1.5">
                {tC('title')}
              </h3>
              {simulatedJurisdiction && simulatedJurisdiction !== 'nws' && (
                <span className="text-[8.5px] font-mono font-bold bg-[#c5a880]/20 text-[#0a1c3e] border border-[#c5a880]/30 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                  <span>⚖️</span>
                  <span>
                    {simulatedJurisdiction === 'eu' && 'EU - GDPR'}
                    {simulatedJurisdiction === 'us_ca' && 'US - CCPA/CPRA'}
                    {simulatedJurisdiction === 'ch' && 'CH - LPD/FADP'}
                    {simulatedJurisdiction === 'uk' && 'UK - GDPR'}
                    {simulatedJurisdiction === 'au' && 'AU - APPs'}
                    {simulatedJurisdiction === 'br' && 'BR - LGPD'}
                  </span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {tC('description')}
            </p>
          </div>
        </div>

        {/* Dynamic Customizer Accordion */}
        {showCustomizer && (
          <div className="border-t border-slate-100 pt-3.5 space-y-3 animate-fade-in">
            <h5 className="text-[10px] font-bold text-[#0a1c3e] uppercase tracking-wider flex items-center gap-1">
              <Settings className="w-3.5 h-3.5 text-brand-gold" />
              {tC('manageTitle')}
            </h5>

            <div className="space-y-2.5">
              {/* Category 1: Essential */}
              <div className="flex items-start justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800 text-[11px]">
                      {tC('cat1Title')}
                    </span>
                    <span className="text-[8px] bg-[#0a1c3e]/10 text-[#0a1c3e] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                      {tC('alwaysActive')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-normal">
                    {tC('cat1Desc')}
                  </p>
                </div>
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Category 2: Preferences */}
              <div 
                onClick={() => togglePref('preferences')}
                className="flex items-start justify-between p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-150 transition cursor-pointer gap-3"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800 text-[11px] block">
                    {tC('cat2Title')}
                  </span>
                  <p className="text-[10px] text-slate-600 leading-normal">
                    {tC('cat2Desc')}
                  </p>
                </div>
                <button
                  type="button"
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none shrink-0 relative ${
                    prefs.preferences ? 'bg-[#0a1c3e]' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform duration-200 ${
                    prefs.preferences ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Category 3: Analytics */}
              <div 
                onClick={() => togglePref('analytics')}
                className="flex items-start justify-between p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-150 transition cursor-pointer gap-3"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800 text-[11px] block">
                    {tC('cat3Title')}
                  </span>
                  <p className="text-[10px] text-slate-600 leading-normal">
                    {tC('cat3Desc')}
                  </p>
                </div>
                <button
                  type="button"
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none shrink-0 relative ${
                    prefs.analytics ? 'bg-[#0a1c3e]' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform duration-200 ${
                    prefs.analytics ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Links for information */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-wrap items-center justify-center sm:justify-between gap-2.5 text-[9px] text-slate-600 font-mono">
              <button 
                onClick={onOpenPrivacy}
                className="hover:text-brand-gold underline font-bold cursor-pointer transition flex items-center gap-1 uppercase"
              >
                <Shield className="w-3 h-3 text-brand-gold" />
                {tC('privacyPolicy')}
              </button>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <button 
                onClick={onOpenCookies}
                className="hover:text-brand-gold underline font-bold cursor-pointer transition flex items-center gap-1 uppercase"
              >
                <Cookie className="w-3 h-3 text-brand-gold" />
                {tC('cookieDetails')}
              </button>
              <span className="text-slate-300">•</span>
              <button 
                onClick={onOpenCcpa}
                className="hover:text-brand-gold underline font-bold cursor-pointer transition flex items-center gap-1 uppercase text-[#0a1c3e] border border-[#0a1c3e]/10 px-1.5 py-0.5 rounded bg-white"
                id="cookie-banner-ccpa-link"
              >
                <Globe className="w-3 h-3 text-brand-gold" />
                {tC('doNotSell')}
              </button>
            </div>
          </div>
        )}

        {/* Buttons and Actions */}
        <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Customizer trigger (Left on desktop) */}
          <button
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="text-[10px] font-bold text-slate-600 hover:text-[#0a1c3e] flex items-center justify-center gap-1 transition cursor-pointer hover:underline uppercase tracking-wide self-center"
          >
            {showCustomizer ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-brand-gold" />
                {tC('hideDetails')}
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-brand-gold animate-bounce" />
                {tC('customize')}
              </>
            )}
          </button>

          {/* Accept buttons (Right on desktop) */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {showCustomizer ? (
              <button
                onClick={handleSaveCustom}
                className="bg-[#0a1c3e] hover:bg-[#c5a880] text-[#f7f5f0] hover:text-[#0a1c3e] rounded-xl px-4 py-2 text-[10px] font-bold transition uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                {tC('savePreferences')}
              </button>
            ) : (
              <>
                <button
                  onClick={handleAcceptEssentialOnly}
                  className="bg-[#0a1c3e] hover:bg-[#071530] text-[#f7f5f0] rounded-xl px-4 py-2 text-[10px] font-bold transition uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-md text-center"
                >
                  <X className="w-3.5 h-3.5 text-brand-gold" />
                  {tC('rejectAll')}
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="bg-[#0a1c3e] hover:bg-[#071530] text-[#f7f5f0] rounded-xl px-4 py-2 text-[10px] font-bold transition uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-md text-center"
                >
                  <Check className="w-3.5 h-3.5 text-brand-gold" />
                  {tC('acceptAll')}
                </button>
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

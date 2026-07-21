import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { motion } from 'motion/react';
import { BookOpen, Download, FileText, Globe, Scale, Shield, Landmark } from 'lucide-react';

export interface ConstitutionLink {
  language: string;
  nativeName: string;
  url: string;
  flag: string;
  code: string;
  descriptions: Record<string, string>;
}

const constitutionLinks: ConstitutionLink[] = [
  {
    language: 'English',
    nativeName: 'Constitution EN',
    url: 'https://www.newworldstate.org/costitution/CONSTITUTION-OF-THE-SOVEREIGN-WORLD-STATE.pdf',
    flag: '🇺🇸',
    code: 'EN',
    descriptions: {
      en: 'Official English version of the Sovereign World State Constitution.',
      it: 'Versione ufficiale in lingua inglese della Costituzione dello Stato Mondiale Sovrano.',
      fr: 'Version officielle en anglais de la Constitution de l\'État mondial souverain.',
      es: 'Versión oficial en inglés de la Constitución del Estado Mundial Soberano.',
      pt: 'Versão oficial em inglês da Constituição do Estado Mundial Soberano.',
      ru: 'Официальная английская версия Конституции Суверенного Мирового Государства.',
      hi: 'संप्रभु विश्व राज्य संविधान का आधिकारिक अंग्रेजी संस्करण।',
      bn: 'সার্বভৌম বিশ্ব রাষ্ট্র সংবিধানের অফিসিয়াল ইংরেজি সংস্করণ।',
      zh: '主权世界国家宪法的官方英文版本。',
      ja: '主権世界国家憲法の公式英語版。',
      ar: 'النسخة الإنجليزية الرسمية لدستور الدولة العالمية ذات السيادة.'
    }
  },
  {
    language: 'Italiano',
    nativeName: 'Costituzione',
    url: 'https://www.newworldstate.org/costitution/COSTITUZIONE-E-ATTO-COSTITUTIVO-STATO-MONDIALE.pdf',
    flag: '🇮🇹',
    code: 'IT',
    descriptions: {
      en: 'Official Italian version containing the statute and constitution.',
      it: 'Versione ufficiale in italiano contenente lo statuto e atto costitutivo.',
      fr: 'Version officielle en italien contenant les statuts et la constitution.',
      es: 'Versión oficial en italiano que contiene el estatuto y la constitución.',
      pt: 'Versão oficial em italiano contendo o estatuto e a constituição.',
      ru: 'Официальная итальянская версия, содержащая устав и конституцию.',
      hi: 'आधिकारिक इतालवी संस्करण जिसमें क़ानून और संविधान शामिल हैं।',
      bn: 'অফিসিয়াল ইতালীয় সংস্করণ যাতে সংবিধি এবং সংবিধান রয়েছে।',
      zh: '包含法规和宪法的官方意大利语版本。',
      ja: '憲章と憲法を含む公式イタリア語版。',
      ar: 'النسخة الإيطالية الرسمية التي تحتوي على النظام الأساسي والدستور.'
    }
  },
  {
    language: 'Français',
    nativeName: 'Constitution FR',
    url: 'https://www.newworldstate.org/costitution/CONSTITUTION-DE-LETAT-MONDIAL-SOUVERAIN-Francese.pdf',
    flag: '🇫🇷',
    code: 'FR',
    descriptions: {
      en: 'French translation of the Constitution of the Sovereign World State.',
      it: 'Traduzione in lingua francese della Costituzione dello Stato Mondiale Sovrano.',
      fr: 'Traduction française de la Constitution de l\'État mondial souverain.',
      es: 'Traducción al francés de la Constitución del Estado Mundial Soberano.',
      pt: 'Tradução em francês da Constituição do Estado Mundial Soberano.',
      ru: 'Французский перевод Конституции Суверенного Мирового Государства.',
      hi: 'संप्रभु विश्व राज्य के संविधान का फ्रांसीसी अनुवाद।',
      bn: 'সার্বভৌম বিশ্ব রাষ্ট্রের সংবিধানের ফরাসি অনুবাদ।',
      zh: '主权世界国家宪法的法文翻译。',
      ja: '主権世界国家憲法のフランス語訳。',
      ar: 'الترجمة الفرنسية لدستور الدولة العالمية ذات السيادة.'
    }
  },
  {
    language: 'Español',
    nativeName: 'Constitución',
    url: 'https://www.newworldstate.org/costitution/CONSTITUCION-DEL-ESTADO-MUNDIAL-SOBERANO.pdf',
    flag: '🇪🇸',
    code: 'ES',
    descriptions: {
      en: 'Spanish translation of the Sovereign World State Constitution.',
      it: 'Traduzione in lingua spagnola della Costituzione dello Stato Mondiale Sovrano.',
      fr: 'Traduction espagnole de la Constitution de l\'État mondial souverain.',
      es: 'Traducción al español de la Constitución del Estado Mundial Soberano.',
      pt: 'Tradução em espanhol da Constituição do Estado Mundial Soberano.',
      ru: 'Испанский перевод Конституции Суверенного Мирового Государства.',
      hi: 'संप्रभु विश्व राज्य के संविधान का स्पेनिश अनुवाद।',
      bn: 'সার্বভৌম বিশ্ব রাষ্ট্রের সংবিধানের স্প্যানিশ অনুবাদ।',
      zh: '主权世界国家宪法的西班牙文翻译。',
      ja: '主権世界国家憲法のスペイン語訳。',
      ar: 'الترجمة الإسبانية لدستور الدولة العالمية ذات السيادة.'
    }
  },
  {
    language: 'Português',
    nativeName: 'Constituição',
    url: 'https://www.newworldstate.org/costitution/CONSTITUICAO-DO-ESTADO-SOBERANO-MUNDIAL-Portoghese.pdf',
    flag: '🇵🇹',
    code: 'PT',
    descriptions: {
      en: 'Portuguese translation of the Sovereign World State Constitution.',
      it: 'Traduzione in lingua portoghese della Costituzione dello Stato Mondiale Sovrano.',
      fr: 'Traduction portugaise de la Constitution de l\'État mondial souverain.',
      es: 'Traducción al portugués de la Constitución del Estado Mundial Soberano.',
      pt: 'Tradução em português da Constituição do Estado Mundial Soberano.',
      ru: 'Португальский перевод Конституции Суверенного Мирового Государства.',
      hi: 'संप्रभु विश्व राज्य के संविधान का पुर्तगाली अनुवाद।',
      bn: 'সার্বভৌম বিশ্ব রাষ্ট্রের সংবিধানের পর্তুগিজ অনুবাদ।',
      zh: '主权世界国家宪法的葡萄牙文翻译。',
      ja: '主権世界国家憲法のポルトガル語訳。',
      ar: 'الترجمة البرتغالية لدستور الدولة العالمية ذات السيادة.'
    }
  },
  {
    language: 'Русский',
    nativeName: 'Конституция',
    url: 'https://www.newworldstate.org/costitution/КОНСТИТУЦИЯ-СУВЕРЕННОГО-МИРОВОГО-ГОСУДАРСТВА-Russo.pdf',
    flag: '🇷🇺',
    code: 'RU',
    descriptions: {
      en: 'Russian translation of the Sovereign World State Constitution.',
      it: 'Traduzione in lingua russa della Costituzione dello Stato Mondiale Sovrano.',
      fr: 'Traduction russe de la Constitution de l\'État mondial souverain.',
      es: 'Traducción al ruso de la Constitución del Estado Mundial Soberano.',
      pt: 'Tradução em russo da Constituição do Estado Mundial Soberano.',
      ru: 'Русский перевод Конституции Суверенного Мирового Государства.',
      hi: 'संप्रभु विश्व राज्य के संविधान का रूसी अनुवाद।',
      bn: 'সার্বভৌম বিশ্ব রাষ্ট্রের সংবিধানের রুশ অনুবাদ।',
      zh: '主权世界国家宪法的俄文翻译。',
      ja: '主権世界国家憲法のロシア語訳。',
      ar: 'الترجمة الروسية لدستور الدولة العالمية ذات السيادة.'
    }
  },
  {
    language: 'हिन्दी (Hindi)',
    nativeName: 'संविधान',
    url: 'https://www.newworldstate.org/costitution/संप्रभु-विश्व-राज्य-Hindi.pdf',
    flag: '🇮🇳',
    code: 'HI',
    descriptions: {
      en: 'Hindi translation of the Sovereign World State Constitution.',
      it: 'Traduzione in lingua hindi della Costituzione dello Stato Mondiale Sovrano.',
      fr: 'Traduction en hindi de la Constitution de l\'État mondial souverain.',
      es: 'Traducción al hindi de la Constitución del Estado Mundial Soberano.',
      pt: 'Tradução em hindi da Constituição do Estado Mundial Soberano.',
      ru: 'Перевод Конституции Суверенного Мирового Государства на хинди.',
      hi: 'संप्रभु विश्व राज्य के संविधान का हिंदी अनुवाद।',
      bn: 'সার্বভৌম বিশ্ব রাষ্ট্রের সংবিধানের হিন্দি অনুবাদ।',
      zh: '主权世界国家宪法的印地语翻译。',
      ja: '主権世界国家憲法のヒンディー語訳。',
      ar: 'الترجمة الهندية لدستور الدولة العالمية ذات السيادة.'
    }
  },
  {
    language: 'বাংলা (Bengali)',
    nativeName: 'সংবিধান',
    url: 'https://www.newworldstate.org/costitution/সার্বভৌম-विश्व-राष्ट्र-Bengalese.pdf',
    flag: '🇧🇩',
    code: 'BN',
    descriptions: {
      en: 'Bengali translation of the Sovereign World State Constitution.',
      it: 'Traduzione in lingua bengalese della Costituzione dello Stato Mondiale.',
      fr: 'Traduction bengalie de la Constitution de l\'État mondial souverain.',
      es: 'Traducción al bengalí de la Constitución del Estado Mundial Soberano.',
      pt: 'Tradução em bengali da Constituição do Estado Mundial Soberano.',
      ru: 'Бенгальский перевод Конституции Суверенного Мирового Государства.',
      hi: 'संप्रभु विश्व राज्य के संविधान का बंगाली अनुवाद।',
      bn: 'সার্বভৌম বিশ্ব রাষ্ট্রের সংবিধানের বাংলা অনুবাদ।',
      zh: '主权世界国家宪法的孟加拉语翻译。',
      ja: '主権世界国家憲法のベンガル語訳。',
      ar: 'الترجمة البنغالية لدستور الدولة العالمية ذات السيادة.'
    }
  },
  {
    language: '中文 (Chinese)',
    nativeName: '憲法 / 宪法',
    url: 'https://www.newworldstate.org/costitution/主权世界国家-Cinese.pdf',
    flag: '🇨🇳',
    code: 'ZH',
    descriptions: {
      en: 'Chinese translation of the Sovereign World State Constitution.',
      it: 'Traduzione in lingua cinese della Costituzione dello Stato Mondiale Sovrano.',
      fr: 'Traduction chinoise de la Constitution de l\'État mondial souverain.',
      es: 'Traducción al chino de la Constitución del Estado Mundial Soberano.',
      pt: 'Tradução em chinês da Constituição do Estado Mundial Soberano.',
      ru: 'Китайский перевод Конституции Суверенного Мирового Государства.',
      hi: 'संप्रभु विश्व राज्य के संविधान का चीनी अनुवाद।',
      bn: 'সার্বভৌম বিশ্ব রাষ্ট্রের সংবিধানের চীনা অনুবাদ।',
      zh: '主权世界国家宪法的中文翻译。',
      ja: '主権世界国家憲法の中国語訳。',
      ar: 'الترجمة الصينية لدستور الدولة العالمية ذات السيادة.'
    }
  },
  {
    language: '日本語 (Japanese)',
    nativeName: '憲法',
    url: 'https://www.newworldstate.org/costitution/主権世界国家-Giapponese.pdf',
    flag: '🇯🇵',
    code: 'JA',
    descriptions: {
      en: 'Japanese translation of the Sovereign World State Constitution.',
      it: 'Traduzione in lingua giapponese della Costituzione dello Stato Mondiale Sovrano.',
      fr: 'Traduction japonaise de la Constitution de l\'État mondial souverain.',
      es: 'Traducción al japonés de la Constitución del Estado Mundial Soberano.',
      pt: 'Tradução em japonês da Constituição do Estado Mundial Soberano.',
      ru: 'Японский перевод Конституции Суверенного Мирового Государства.',
      hi: 'संप्रभु विश्व राज्य के संविधान का जापानी अनुवाद।',
      bn: 'সার্বভৌম বিশ্ব রাষ্ট্রের সংবিধানের জাপানি অনুবাদ।',
      zh: '主权世界国家宪法的日本语翻译。',
      ja: '主権世界国家憲法の日本語訳。',
      ar: 'الترجمة اليابانية لدستور الدولة العالمية ذات السيادة.'
    }
  },
  {
    language: 'العربية (Arabic)',
    nativeName: 'دستور',
    url: 'https://www.newworldstate.org/costitution/دستور-الدولة-العالمية-ذات-السيادة-Arabo.pdf',
    flag: '🌍',
    code: 'AR',
    descriptions: {
      en: 'Arabic translation of the Sovereign World State Constitution.',
      it: 'Traduzione in lingua araba della Costituzione dello Stato Mondiale Sovrano.',
      fr: 'Traduction arabe de la Constitution de l\'État mondial souverain.',
      es: 'Traducción al árabe de la Constitución del Estado Mundial Soberano.',
      pt: 'Tradução em árabe da Constituição do Estado Mundial Soberano.',
      ru: 'Арабский перевод Конституции Суверенного Мирового Государства.',
      hi: 'संप्रभु विश्व राज्य के संविधान का अरबी अनुवाद।',
      bn: 'সার্বভৌম বিশ্ব রাষ্ট্রের সংবিধানের আরবি অনুবাদ।',
      zh: '主权世界国家宪法的阿拉伯语翻译。',
      ja: '主権世界国家憲法のアラビア語訳。',
      ar: 'الترجمة العربية الرسمية لدستور الدولة العالمية ذات السيادة.'
    }
  }
];

const LOCAL_TRANSLATIONS: Record<string, Record<string, string>> = {
  title: {
    en: "The Supreme Constitution",
    it: "Costituzione Suprema",
    fr: "La Constitution Suprême",
    es: "La Constitución Suprema",
    pt: "A Constituição Suprema",
    ru: "Высшая Конституция",
    hi: "सर्वोच्च संविधान",
    bn: "সর্বোচ্চ संविधान",
    zh: "至高宪法",
    ja: "至高の憲法",
    ar: "الدستور الأسمى"
  },
  subtitle: {
    en: "Official constitutional documents and international pacts of the sovereign community.",
    it: "Documenti costituzionali ufficiali e patti internazionali della comunità sovrana.",
    fr: "Documents constitutionnels officiels et pactes internationaux de la communauté souveraine.",
    es: "Documentos constitucionales oficiales y pactos internacionales de la comunidad soberana.",
    pt: "Documentos constitucionais oficiais e pactos internacionais da comunidade soberana.",
    ru: "Официальные конституционные документы и международные пакты суверенного сообщества.",
    hi: "संप्रभु समुदाय के आधिकारिक संवैधानिक दस्तावेज और अंतर्राष्ट्रीय समझौते।",
    bn: "সার্বভৌম সম্প্রদায়ের অফিসিয়াল সাংবিধানिक দলিল এবং আন্তর্জাতিক চুক্তি।",
    zh: "主权社区的官方宪法文件和国际公约。",
    ja: "主権共同体の公式憲法文書および国際協定。",
    ar: "الوثائق الدستورية الرسمية والمواثيق الدولية للمجتمع السيادي."
  },
  preambleHeading: {
    en: "Constitutional Fulfillments & Preambles",
    it: "Preambolo e Fondamenti dello Stato",
    fr: "Préambule et fondements de l'État",
    es: "Preámbulo y Fundamentos del Estado",
    pt: "Preâmbulo e Fundamentos do Estado",
    ru: "Преамбула и основы государства",
    hi: "संवैधानिक पूर्ति और प्रस्तावना",
    bn: "সাংবিধানিক পূর্ণতা ও প্রস্তাবনা",
    zh: "宪法履行与序言",
    ja: "憲法の履行と前文",
    ar: "الوفاء الدستوري والمقدمات"
  },
  preambleText: {
    en: "The New World State is established under universal values of peace, preservation of life, and sovereign citizen representation. Our Supreme Constitution represents the common agreement binding all citizens regardless of geography, race, or previous jurisdiction.",
    it: "Lo Stato Mondiale dei Cittadini si fonda sui valori universali della pace, della conservazione della vita e della rappresentanza sovrana del cittadino. La nostra Suprema Costituzione rappresenta l’accordo comune che vincola tutti i cittadini, indipendentemente dalla loro posizione geografica, razza o giurisdizione precedente.",
    fr: "L'État du Nouveau Monde est établi selon les valeurs universelles de paix, de préservation de la vie et de représentation souveraine des citoyens. Notre Constitution suprême représente l'accord commun liant tous les citoyens, indépendamment de la géographie, de la race ou de la juridiction précédente.",
    es: "El Estado del Nuevo Mundo se establece bajo los valores universales de la paz, la preservación de la vida y la representación soberana de los ciudadanos. Nuestra Constitución Suprema representa el acuerdo común que vincula a todos los ciudadanos, independientemente de su geografía, raza o jurisdicción anterior.",
    pt: "O Estado do Novo Mundo é estabelecido sob valores universais de paz, preservação da vida e representação soberana dos cidadãos. Nossa Constituição Suprema representa o acordo comum que vincula todos os cidadãos, independentemente de geografia, raça ou jurisdição anterior.",
    ru: "Новое мировое государство создано на основе универсальных ценностей мира, сохранения жизни и суверенного представительства граждан. Наша Высшая Конституция представляет собой общее соглашение, обязывающее всех граждан, независимо от географии, расы или предыдущей юрисдикции.",
    hi: "नया विश्व राज्य शांति, जीवन के संरक्षण और संप्रभु नागरिक प्रतिनिधित्व के सार्वभौमिक मूल्यों के तहत स्थापित किया गया है। हमारा सर्वोच्च संविधान भूगोल, नस्ल या पिछली न्यायक्षेत्र की परवाह किए बिना सभी नागरिकों को बाध्य करने वाले सामान्य समझौते का प्रतिनिधित्व करता है।",
    bn: "নতুন বিশ্ব রাষ্ট্র শান্তি, জীবন রক্ষা এবং সার্বভৌম নাগরিক প্রতিনিধিত্বের সর্বজনীন মূল্যের অধীনে প্রতিষ্ঠিত। আমাদের সর্বোচ্চ সংবিধান ভৌগোলিক অবস্থান, জাতি বা পূর্ববর্তী এখতিয়ার নির্বিশেষে সকল নাগরিককে আবদ্ধ করার সাধারণ চুক্তির প্রতিনিধিত্ব করে।",
    zh: "新世界国家建立在和平、维护生命和主权公民代表的普遍价值之上。我们的至高宪法代表了约束所有公民的共同协议，无论地理、种族或先前的管辖权如何。",
    ja: "新世界国家は、平和、生命の保存、および主権市民の代表という普遍的な価値の下に設立されています。私たちの至高の憲法は、地理、人種、または以前の管轄区域に関係なく、すべての市民を拘束する共通の合意を表しています。",
    ar: "تأسست الدولة العالمية الجديدة تحت القيم العالمية للسلام، والحفاظ على الحياة، والتمثيل السيادي للمواطنين. يمثل دستورنا الأسمى الاتفاق المشترك الذي يلزم جميع المواطنين بغض النظر عن الجغرافيا أو العرق أو الولاية القضائية السابقة."
  },
  downloadsHeading: {
    en: "Available Translations",
    it: "Traduzioni Disponibili",
    fr: "Traductions Disponibles",
    es: "Traducciones Disponibles",
    pt: "Traduções Disponíveis",
    ru: "Доступные переводы",
    hi: "उपलब्ध अनुवाद",
    bn: "অনুবাদ উপলব্ধ",
    zh: "可用翻译",
    ja: "利用可能な翻訳",
    ar: "الترجمات المتاحة"
  },
  downloadButtonText: {
    en: "Download PDF",
    it: "Scarica PDF",
    fr: "Télécharger le PDF",
    es: "Descargar PDF",
    pt: "Baixar PDF",
    ru: "Скачать PDF",
    hi: "पीडीएफ डाउनलोड करें",
    bn: "পিডিএফ ডাউনলোড করুন",
    zh: "下载 PDF",
    ja: "PDFをダウンロード",
    ar: "تحميل PDF"
  },
  disclaimer: {
    en: "For official inquiries or physical printing, contact the General Secretary Office at info@newworldstate.org. All documents are encrypted and signed digitally.",
    it: "Per richieste ufficiali o stampe tipografiche, contattare l'Ufficio del Segretario Generale a info@newworldstate.org. Tutti i documenti sono firmati digitalmente.",
    fr: "Pour les demandes officielles ou l'impression physique, contactez le Secrétariat général à info@newworldstate.org. Tous les documents sont cryptés et signés numériquement.",
    es: "Para consultas oficiales o impresión física, póngase en contacto con la Oficina del Secretario General en info@newworldstate.org. Todos los documentos están encriptados y firmados digitalmente.",
    pt: "Para consultas oficiais ou impressão física, entre em contato com a Secretaria Geral em info@newworldstate.org. Todos os documentos são criptografados e assinados digitalmente.",
    ru: "Для официальных запросов или печати обращайтесь в офис Генерального секретаря по адресу info@newworldstate.org. Все документы зашифрованы и подписаны цифровой подписью.",
    hi: "आधिकारिक पूछताछ या भौतिक मुद्रण के लिए, info@newworldstate.org पर महासचिव कार्यालय से संपर्क करें। सभी दस्तावेज एन्क्रिप्टेड और डिजिटल रूप से हस्ताक्षरित हैं।",
    bn: "অফিসিয়াল অনুসন্ধান বা শারীরিক মুদ্রণের জন্য, info@newworldstate.org এ জেনারেল সেক্রেটারি অফিসের সাথে যোগাযোগ করুন। সমস্ত নথি এনক্রিপ্ট করা এবং ডিজিটালভাবে স্বাক্ষরিত।",
    zh: "如需官方咨询或纸质印刷，请通过 info@newworldstate.org 联系秘书长办公室。所有文件均已加密并进行数字签名。",
    ja: "公式な問い合わせや印刷については、info@newworldstate.org の事務総長室にお問い合わせください。すべての文書は暗号化され、デジタル署名されています。",
    ar: "للإستفسارات الرسمية أو الطباعة الورقية، اتصل بمكتب الأمين العام على info@newworldstate.org. جميع الوثائق مشفرة وموقعة رقمياً."
  },
  justiceTitle: {
    en: "Universal Justice",
    it: "Giustizia Universale",
    fr: "Justice Universelle",
    es: "Justicia Universal",
    pt: "Justiça Universal",
    ru: "Всеобщее правосудие",
    hi: "सार्वभौमिक न्याय",
    bn: "সর্বজনীন ন্যায়বিচার",
    zh: "普遍正义",
    ja: "普遍的司法",
    ar: "العدالة العالمية"
  },
  justiceDesc: {
    en: "A legal ecosystem guaranteeing freedom, protection of human integrity, and unconditional digital defense.",
    it: "Un ecosistema legale che garantisce libertà, tutela dell’integrità umana ed una difesa digitale incondizionata.",
    fr: "Un écosystème juridique garantissant la liberté, la protection de l'intégrité humaine et une défense numérique inconditionnelle.",
    es: "Un ecosistema legal que garantiza la libertad, la protección de la integridad humana y una defensa digital incondicional.",
    pt: "Um ecossistema legal que garante a liberdade, a proteção da integridade humana e uma defesa digital incondicional.",
    ru: "Правовая экосистема, гарантирующая свободу, защиту человеческой целостности и безусловную цифровую защиту.",
    hi: "स्वतंत्रता, मानवीय अखंडता के संरक्षण और बिना शर्त डिजिटल सुरक्षा की गारंटी देने वाला एक कानूनी पारिस्थितिकी तंत्र।",
    bn: "স্বাধীনতা, মানবিক অখণ্ডতা রক্ষা এবং নিঃশর্ত ডিজিটাল সুরক্ষার গ্যারান্টি দেয় এমন একটি আইনি বাস্তুতন্ত্র।",
    zh: "保障自由、保护人类完整性和无条件数字防御的法律生态系统。",
    ja: "自由、人間の誠実さの保護、および無条件のデジタル防衛を保証する法的なエコシステム。",
    ar: "نظام قانوني يضمن الحرية، وحماية السلامة البشرية، والدفاع الرقمي غير المشروط."
  },
  sovereigntyTitle: {
    en: "Borderless Sovereignty",
    it: "Sovranità Senza Confini",
    fr: "Souveraineté sans frontières",
    es: "Soberanía Sin Fronteras",
    pt: "Soberania Sem Fronteiras",
    ru: "Суверенитет без границ",
    hi: "सीमा रहित संप्रভুता",
    bn: "সীমানাহীন সার্বভৌমত্ব",
    zh: "无国界主权",
    ja: "国境なき主権",
    ar: "سيادة بلا حدود"
  },
  sovereigntyDesc: {
    en: "Direct global citizenship via decentralized systems, decoupling representation from regional limitations.",
    it: "Cittadinanza globale diretta tramite sistemi digitali decentrati, slegando la rappresentanza da confini regionali.",
    fr: "Citoyenneté mondiale directe via des systèmes décentralisés, dissociant la représentation des limites régionales.",
    es: "Ciudadanía global directa a través de sistemas descentralizados, desvinculando la representación de las limitaciones regionales.",
    pt: "Cidadania global direta por meio de sistemas descentralizados, desvinculando a representação de limitações regionais.",
    ru: "Прямое глобальное гражданство через децентрализованные системы, освобождающее представительство от региональных ограничений.",
    hi: "विकेंद्रीकृत प्रणालियों के माध्यम से प्रत्यक्ष वैश्विक नागरिकता, क्षेत्रीय सीमाओं से प्रतिनिधित्व को अलग करना।",
    bn: "বিকেন্দ্রেভুত ব্যবস্থার মাধ্যমে সরাসরি বিশ্বব্যাপী নাগরিকত্ব, প্রতিনিধিত্বকে আঞ্চলিক সীমাবদ্ধতা থেকে মুক্ত করা।",
    zh: "通过去中心化系统实现直接全球公民身份，将代表权与地区限制脱钩。",
    ja: "分散型システムによる直接的なグローバル市民権、地域の制限から代表権を切り離します。",
    ar: "المواطنة العالمية المباشرة عبر الأنظمة اللامركزية، وفصل التمثيل عن القيود الإقليمية."
  },
  heritageTitle: {
    en: "Global Heritage Preservation",
    it: "Preservazione del Patrimonio",
    fr: "Préservation du patrimoine mondial",
    es: "Preservación del Patrimonio Global",
    pt: "Preservação do Patrimônio Global",
    ru: "Сохранение глобального наследия",
    hi: "वैश्विक विरासत संरक्षण",
    bn: "বিশ্ব ঐতিহ্য সংরক্ষণ",
    zh: "全球遗产保护",
    ja: "グローバル遺産の保存",
    ar: "الحفاظ على التراث العالمي"
  },
  heritageDesc: {
    en: "Commitment to human evolution, safe automation guidelines, absolute ecological defense, and collective prosperity.",
    it: "Impegno per l’evoluzione umana, linee guida sull’automazione sicura, difesa ecologica assoluta e progresso collettivo.",
    fr: "Engagement envers l'évolution humaine, directives pour une automatisation sûre, défense écologique absolue et prospérité collective.",
    es: "Compromiso con la evolución humana, pautas para una automatización segura, defensa ecológica absoluta y prosperidad colectiva.",
    pt: "Compromisso com a evolução humana, diretrizes para automação segura, defesa ecológica absoluta e prosperidade coletiva.",
    ru: "Приверженность человеческой эволюции, руководящие принципы безопасной автоматизации, абсолютная экологическая защита и коллективное процветание.",
    hi: "मानव विकास, सुरक्षित स्वचालन दिशानिर्देश, पूर्ण पारिस्थितिक रक्षा और सामूहिक समृद्धि के प्रति प्रतिबद्धता।",
    bn: "মানব বিবর্তন, নিরাপদ অটোমেশন নির্দেশিকা, পরম পরিবেশগত প্রতিরক্ষা এবং যৌথ সমৃদ্ধির প্রতিশ্রুতি।",
    zh: "致力于人类进化、安全自动化指南、绝对生态防御和集体繁荣。",
    ja: "人類の進化、安全な自動化ガイドライン、絶対的な生態学的防御、そして集団の繁栄へのコミットメント。",
    ar: "الالتزام بالتطور البشري، والمبادئ التوجيهية للأتمتة الآمنة، والدفاع البيئي المطلق، والازدهار الجماعي."
  }
};

export default function ConstitutionPage() {
  const { language } = useI18n();

  const getT = (key: string): string => {
    const section = LOCAL_TRANSLATIONS[key];
    if (!section) return '';
    return section[language] || section['en'] || '';
  };

  const titleText = getT('title');
  const subtitleText = getT('subtitle');
  const preambleHeading = getT('preambleHeading');
  const preambleText = getT('preambleText');
  const downloadsHeading = getT('downloadsHeading');
  const downloadButtonText = getT('downloadButtonText');
  const disclaimerText = getT('disclaimer');

  const preambles = [
    {
      icon: <Scale className="w-6 h-6 text-brand-gold shrink-0" />,
      title: getT('justiceTitle'),
      desc: getT('justiceDesc')
    },
    {
      icon: <Globe className="w-6 h-6 text-brand-gold shrink-0" />,
      title: getT('sovereigntyTitle'),
      desc: getT('sovereigntyDesc')
    },
    {
      icon: <Shield className="w-6 h-6 text-brand-gold shrink-0" />,
      title: getT('heritageTitle'),
      desc: getT('heritageDesc')
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-1"
    >
      <div className="bg-white/80 backdrop-blur-xl border border-brand-blue/10 rounded-3xl p-6 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Background Emblem Watermark */}
        <div className="absolute right-0 bottom-0 opacity-[0.02] transform translate-x-24 translate-y-24 pointer-events-none">
          <Landmark className="w-[500px] h-[500px] text-brand-blue" />
        </div>

        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold mb-2">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif text-brand-blue font-bold tracking-tight">
            {titleText}
          </h2>
          <p className="text-sm md:text-md text-muted/90 max-w-xl mx-auto font-light leading-relaxed">
            {subtitleText}
          </p>
          <div className="h-0.5 w-24 bg-brand-gold/30 mx-auto rounded-full" />
        </div>

        {/* Foundations & Preambles Bento Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="md:col-span-3 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-blue font-tech">
              {preambleHeading}
            </h3>
            <p className="text-xs md:text-sm text-brand-blue/80 leading-relaxed max-w-4xl">
              {preambleText}
            </p>
          </div>

          {preambles.map((p, idx) => (
            <div key={idx} className="bg-white border border-brand-blue/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col gap-4">
              <div className="p-3 bg-brand-gold/5 rounded-xl inline-self-start shrink-0">
                {p.icon}
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg text-brand-blue font-bold">{p.title}</h4>
                <p className="text-xs text-muted leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Downloads Grid Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-brand-blue/10 pb-4">
            <LandingIndicator />
            <h3 className="text-lg md:text-xl font-serif text-brand-blue font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-gold" />
              {downloadsHeading}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {constitutionLinks.map((link) => {
              const linkDesc = link.descriptions[language] || link.descriptions['en'] || '';
              return (
                <motion.div 
                  key={link.code}
                  whileHover={{ y: -3 }}
                  className="bg-white hover:bg-brand-parchment/30 rounded-2xl border border-brand-blue/10 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group duration-200"
                >
                  <div className="space-y-4">
                    {/* Language and Flag Tag */}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl" role="img" aria-label={link.language}>
                        {link.flag}
                      </span>
                      <span className="text-[9px] font-bold font-tech bg-brand-blue/5 text-brand-blue/80 px-2.5 py-1 rounded-full uppercase tracking-wider group-hover:bg-[#0A1C3E] group-hover:text-white transition-colors duration-200">
                        {link.code}
                      </span>
                    </div>

                    {/* Text Details */}
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-md text-brand-blue group-hover:text-brand-gold transition-colors duration-150">
                        {link.nativeName}
                      </h4>
                      <p className="text-[10px] uppercase font-tech tracking-wider text-brand-gold/80 font-bold leading-none">
                        {link.language}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-muted leading-normal line-clamp-3">
                      {linkDesc}
                    </p>
                  </div>

                  {/* Download Button */}
                  <div className="pt-5 mt-4 border-t border-gray-50">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-[#0A1C3E] hover:bg-brand-gold text-white hover:text-[#0A1C3E] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloadButtonText}</span>
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Final Disclaimer */}
        <div className="mt-12 p-5 bg-brand-gold/5 rounded-2xl border border-brand-gold/10 text-center text-[11px] text-brand-blue/70">
          <span>{disclaimerText}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Minimal flag/indicator for section titles
function LandingIndicator() {
  return (
    <div className="relative flex items-center justify-center w-6 h-6">
      <span className="absolute inline-flex h-2 w-2 rounded-full bg-brand-gold opacity-75"></span>
    </div>
  );
}


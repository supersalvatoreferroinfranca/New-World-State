/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * New World State - Multilingual Legal & Compliance Documents
 * (GDPR, ePrivacy, CCPA/CPRA, Australian Privacy Principles, WCAG 2.1 AA, Civic Treaty)
 * Covers all 11 official portal languages: it, en, fr, es, pt, ru, hi, bn, zh, ja, ar
 */

import { Language } from '../constants/translations';

export interface LegalDocumentContent {
  title: string;
  badge: string;
  sections: {
    title: string;
    body: string;
    items?: string[];
  }[];
  customDispositionsTitle?: string;
}

export const LEGAL_MODAL_UI: Record<string, Record<Language, string>> = {
  privacyTab: {
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
  cookiesTab: {
    it: 'Informativa Cookie',
    en: 'Cookie Policy',
    fr: 'Politique des Cookies',
    es: 'Política de Cookies',
    pt: 'Política de Cookies',
    ru: 'Политика файлов cookie',
    hi: 'कुकी नीति',
    bn: 'কুকি নীতি',
    zh: 'Cookie 政策',
    ja: 'クッキーポリシー',
    ar: 'سياسة ملفات تعريف الارتباط'
  },
  termsTab: {
    it: 'Termini e Condizioni',
    en: 'Terms & Conditions',
    fr: 'Termes & Conditions',
    es: 'Términos y Condiciones',
    pt: 'Termos e Condições',
    ru: 'Условия и положения',
    hi: 'नियम और शर्तें',
    bn: 'নিয়ম ও শর্তাবলী',
    zh: '条款与条件',
    ja: '利用規約',
    ar: 'الشروط والأحكام'
  },
  accessibilityTab: {
    it: 'Accessibilità WCAG',
    en: 'Accessibility WCAG',
    fr: 'Accessibilité WCAG',
    es: 'Accesibilidad WCAG',
    pt: 'Acessibilidade WCAG',
    ru: 'Доступность WCAG',
    hi: 'सुलभता WCAG',
    bn: 'অ্যাক্সেসযোগ্যতা WCAG',
    zh: '无障碍访问 WCAG',
    ja: 'アクセシビリティ WCAG',
    ar: 'إمكانية الوصول WCAG'
  },
  ccpaTab: {
    it: 'Opt-Out CCPA',
    en: 'CCPA Opt-Out',
    fr: 'Opt-Out CCPA',
    es: 'Opt-Out CCPA',
    pt: 'Opt-Out CCPA',
    ru: 'Отказ CCPA',
    hi: 'CCPA ऑप्ट-आउट',
    bn: 'CCPA অপ্ট-আউট',
    zh: 'CCPA 退出权',
    ja: 'CCPA オプトアウト',
    ar: 'خيار عدم البيع CCPA'
  },
  printDocument: {
    it: 'Stampa Documento',
    en: 'Print Document',
    fr: 'Imprimer le document',
    es: 'Imprimir documento',
    pt: 'Imprimir documento',
    ru: 'Печать документа',
    hi: 'दस्तावेज़ प्रिंट करें',
    bn: 'নথি প্রিন্ট করুন',
    zh: '打印文档',
    ja: '文書を印刷',
    ar: 'طباعة الوثيقة'
  },
  officialComplianceProtocol: {
    it: 'Protocollo Ufficiale di Conformità Legale',
    en: 'Official Legal Compliance Protocol',
    fr: 'Protocole Officiel de Conformité Légale',
    es: 'Protocolo Oficial de Cumplimiento Legal',
    pt: 'Protocolo Oficial de Conformidade Legal',
    ru: 'Официальный протокол правового соответствия',
    hi: 'आधिकारिक कानूनी अनुपालन प्रोटोकॉल',
    bn: 'অফিসিয়াল আইনি সম্মতি প্রোটোকল',
    zh: '官方法律合规规程',
    ja: '公式法的準拠プロトコル',
    ar: 'البروتوكول الرسمي للامتثال القانوني'
  },
  activeAndVerified: {
    it: 'ATTIVO E CERTIFICATO',
    en: 'ACTIVE & VERIFIED',
    fr: 'ACTIF ET VÉRIFIÉ',
    es: 'ACTIVO Y VERIFICADO',
    pt: 'ATIVO E VERIFICADO',
    ru: 'АКТИВЕН И ПРОВЕРЕН',
    hi: 'सक्रिय और सत्यापित',
    bn: 'সক্রিয় এবং যাচাইকৃত',
    zh: '生效并已核验',
    ja: '有効かつ認証済み',
    ar: 'نشط وموثق'
  },
  chancelleryTitle: {
    it: 'CANCELLERIA STATO MONDIALE',
    en: 'NEW WORLD STATE CHANCELLERY',
    fr: 'CHANCELLERIE DE NEW WORLD STATE',
    es: 'CANCILLERÍA DE NEW WORLD STATE',
    pt: 'CHANCELARIA DE NEW WORLD STATE',
    ru: 'КАНЦЕЛЯРИЯ NEW WORLD STATE',
    hi: 'न्यू वर्ल्ड स्टेट चांसलरी',
    bn: 'নিউ ওয়ার্ল্ড স্টেট চ্যান্সেলারি',
    zh: '新世界国家总理官邸法务署',
    ja: '新世界国家法務官房',
    ar: 'مستشارية دولة العالم الجديد'
  },
  decentralizedAuth: {
    it: 'AUTENTICAZIONE CRITTOGRAFICA DECENTRALIZZATA',
    en: 'GENUINE DECENTRALIZED AUTHENTICATION',
    fr: 'AUTHENTIFICATION CRYPTOGRAPHIQUE DÉCENTRALISÉE',
    es: 'AUTENTICACIÓN CRIPTOGRÁFICA DESCENTRALIZADA',
    pt: 'AUTENTICAÇÃO CRIPTOGRÁFICA DESCENTRALIZADA',
    ru: 'ПОДЛИННАЯ ДЕЦЕНТРАЛИЗОВАННАЯ АУТЕНТИФИКАЦИЯ',
    hi: 'वास्तविक विकेंद्रीकृत प्रमाणीकरण',
    bn: 'খাঁটি বিকেন্দ্রীভূত প্রমাণীকরণ',
    zh: '去中心化权威密码学真确认证',
    ja: '真正なる非中央集権暗号認証',
    ar: 'توثيق مشفر لامركزي أصيل'
  }
};

export const PRIVACY_DOC_DATA: Record<Language, {
  title: string;
  badge: string;
  effectiveDate: string;
  sections: {
    heading: string;
    content: string;
    list?: string[];
  }[];
}> = {
  it: {
    title: 'Informativa sulla Privacy (Privacy Policy)',
    badge: 'GDPR / CCPA / APP COMPLIANT',
    effectiveDate: '7 Luglio 2026 (Ultimo aggiornamento)',
    sections: [
      {
        heading: '1. TITOLARE DEL TRATTAMENTO DEI DATI',
        content: `Il Titolare del trattamento dei dati personali raccolti tramite il Registro Mondiale della Cittadinanza del New World State è l'Autorità New World State (Global Decentralized Infrastructure). È possibile inoltrare richieste, domande o esercitare i propri diritti scrivendo direttamente all'Ufficio Privacy all'email: privacy@newworldstate.org.`
      },
      {
        heading: '2. TIPOLOGIA DI DATI TRATTATI E MODALITÀ',
        content: `Raccogliamo ed elaboriamo esclusivamente le seguenti categorie di dati forniti direttamente dall'utente:`,
        list: [
          'Dati Anagrafici e Biografici: Nome, cognome, genere, data e luogo di nascita, paese di origine, indirizzo di residenza fisica.',
          'Dati di Contatto: Indirizzo email, preferenze di localizzazione linguistica.',
          'Dati Biometrici/Identificativi: Foto ritratto per la generazione e validazione crittografica della ID Card e del passaporto ufficiale.',
          'Dati Tecnici di Rete: Indirizzo IP raccolto temporaneamente per scopi di instradamento sicuro e mitigazione anti-DDoS.'
        ]
      },
      {
        heading: '3. BASE GIURIDICA E FINALITÀ DEL TRATTAMENTO',
        content: `Il trattamento si fonda sul consenso esplicito e revocabile (Art. 6.1(a) GDPR), sull'esecuzione di un contratto/accordo per l'erogazione dei servizi civici (Art. 6.1(b) GDPR) e sul legittimo interesse alla sicurezza dell'infrastruttura democratica (Art. 6.1(f) GDPR). È categoricamente esclusa qualunque vendita, profilazione commerciale o cessione di dati a terzi.`
      },
      {
        heading: '4. TRASFERIMENTI DI DATI TRANSFRONTALIERI E SICUREZZA',
        content: `Data la natura globale dell'infrastruttura decentralizzata, i dati sono custoditi su nodi server protetti da crittografia forte AES-256 a riposo e TLS 1.3 in transito, in piena conformità con le Clausole Contrattuali Standard (SCC) della Commissione Europea e gli Australian Privacy Principles (APP 8).`
      },
      {
        heading: '5. DIRITTI FONDAMENTALI DELL’UTENTE',
        content: `In ogni momento puoi esercitare i diritti di accesso (Art. 15 GDPR), rettifica (Art. 16), cancellazione definitiva / diritto all'oblio (Art. 17), limitazione (Art. 18), portabilità dei dati (Art. 20) e opposizione (Art. 21).`
      }
    ]
  },
  en: {
    title: 'Privacy Policy & Citizen Data Protection',
    badge: 'GDPR / CCPA / APP COMPLIANT',
    effectiveDate: 'July 7, 2026 (Last Updated)',
    sections: [
      {
        heading: '1. DATA CONTROLLER',
        content: `The official Data Controller responsible for processing personal records under the New World State Global Citizenship Registry is the New World State Authority (Global Decentralized Infrastructure). For inquiries or rights enforcement, contact: privacy@newworldstate.org.`
      },
      {
        heading: '2. TYPES OF DATA PROCESSED & METHODS',
        content: `We collect and process the following categories of information supplied directly by you during enrollment:`,
        list: [
          'Biographical Information: Legal first name, surname, gender, date and place of birth, country of origin, physical residency address.',
          'Contact Information: Valid email address, regional localization preference.',
          'Biometric / Identification Assets: Facial portrait for identification rendering and security verification.',
          'Technical Diagnostics: Connection IP address retained temporarily for routing safety and DDoS mitigation.'
        ]
      },
      {
        heading: '3. LAWFUL BASIS AND PURPOSES',
        content: `Processing is grounded in explicit, revocable consent (Art. 6.1(a) GDPR), performance of citizenship agreements (Art. 6.1(b) GDPR), and legitimate interest in cyber resilience (Art. 6.1(f) GDPR). Commercial monetization, ad-tracking, or behavioral profiling is constitutionally barred.`
      },
      {
        heading: '4. CROSS-BORDER DATA TRANSFERS & SECURITY',
        content: `All global database nodes enforce AES-256 encryption at rest and TLS 1.3 in transit. Any international transfers comply with EU Standard Contractual Clauses (SCCs) and Australian Privacy Principle 8 (APP 8).`
      },
      {
        heading: '5. YOUR GLOBAL DIGITAL RIGHTS',
        content: `You may at any time exercise your rights to access (Art. 15 GDPR), rectification (Art. 16), complete erasure/forgotten (Art. 17), restriction of processing (Art. 18), data portability (Art. 20), and objection (Art. 21).`
      }
    ]
  },
  fr: {
    title: 'Politique de Confidentialité et Protection des Données',
    badge: 'CONFORME RGPD / CCPA / APP',
    effectiveDate: '7 Juillet 2026 (Dernière mise à jour)',
    sections: [
      {
        heading: '1. RESPONSABLE DU TRAITEMENT DES DONNÉES',
        content: `Le responsable du traitement des données personnelles recueillies par le Registre Mondial de la Citoyenneté est l'Autorité New World State (Infrastructure Mondiale Décentralisée). Contact officiel : privacy@newworldstate.org.`
      },
      {
        heading: '2. CATÉGORIES DE DONNÉES TRAITÉES',
        content: `Nous traitons uniquement les informations fournies volontairement lors de votre inscription :`,
        list: [
          'Données d’état civil : Nom, prénom, genre, date et lieu de naissance, pays d’origine, adresse de résidence.',
          'Coordonnées : Adresse électronique, préférences linguistiques.',
          'Données d’identification : Photographie portrait pour la délivrance de la carte d’identité numérique souveraine.',
          'Données techniques : Adresse IP temporaire pour la sécurité réseau et la protection anti-DDoS.'
        ]
      },
      {
        heading: '3. BASES JURIDIQUES ET FINALITÉS',
        content: `Le traitement repose sur le consentement explicite et révocable (Art. 6.1(a) RGPD), l’exécution des services d’adhésion civique (Art. 6.1(b) RGPD) et l’intérêt légitime de sécurité (Art. 6.1(f) RGPD). Toute commercialisation ou profilage publicitaire est strictement prohibé.`
      },
      {
        heading: '4. TRANSFERTS TRANSFRONTALIERS ET SÉCURITÉ',
        content: `Les serveurs décentralisés appliquent un chiffrement intégral AES-256 au repos et TLS 1.3 en transit, sous le couvert des Clauses Contractuelles Types de la Commission Européenne.`
      },
      {
        heading: '5. VOS DROITS NUMÉRIQUES',
        content: `Vous disposez à tout moment des droits d'accès (Art. 15 RGPD), de rectification (Art. 16), d'effacement / droit à l'oubli (Art. 17), de limitation (Art. 18), de portabilité (Art. 20) et d'opposition (Art. 21).`
      }
    ]
  },
  es: {
    title: 'Política de Privacidad y Protección de Datos Ciudadanos',
    badge: 'CONFORME RGPD / CCPA / APP',
    effectiveDate: '7 de Julio de 2026 (Última actualización)',
    sections: [
      {
        heading: '1. RESPONSABLE DEL TRATAMIENTO DE DATOS',
        content: `El Responsable oficial del tratamiento de datos personales en el Registro Mundial de Ciudadanía es la Autoridad de New World State (Infraestructura Descentralizada Global). Contacto: privacy@newworldstate.org.`
      },
      {
        heading: '2. TIPOS DE DATOS PROCESADOS',
        content: `Recopilamos y procesamos las siguientes categorías suministradas directamente por el ciudadano:`,
        list: [
          'Datos Biográficos: Nombre, apellidos, género, fecha y lugar de nacimiento, país de origen, dirección de residencia.',
          'Datos de Contacto: Correo electrónico válido, preferencia de idioma.',
          'Datos Biométricos e Identificativos: Fotografía retrato para la emisión y verificación criptográfica de la ID Card y pasaporte.',
          'Datos Técnicos: Dirección IP recopilada temporalmente para seguridad de enrutamiento y mitigación anti-DDoS.'
        ]
      },
      {
        heading: '3. BASE LEGAL Y FINALIDADES',
        content: `El tratamiento se fundamenta en el consentimiento explícito y revocable (Art. 6.1(a) RGPD), la ejecución de acuerdos cívicos (Art. 6.1(b) RGPD) y el interés legítimo en la ciberseguridad (Art. 6.1(f) RGPD). Queda terminantemente prohibida cualquier venta o cesión comercial.`
      },
      {
        heading: '4. TRANSFERENCIAS TRANSFRONTERIZAS Y SEGURIDAD',
        content: `Nuestros servidores descentralizados implementan cifrado robusto AES-256 en reposo y TLS 1.3 en tránsito, respetando las Cláusulas Contractuales Tipo de la Comisión Europea.`
      },
      {
        heading: '5. DERECHOS FUNDAMENTALES DEL USUARIO',
        content: `Puede ejercer en cualquier momento sus derechos de acceso (Art. 15 RGPD), rectificación (Art. 16), supresión / derecho al olvido (Art. 17), limitación (Art. 18), portabilidad (Art. 20) y oposición (Art. 21).`
      }
    ]
  },
  pt: {
    title: 'Política de Privacidade e Proteção de Dados Cidadãos',
    badge: 'CONFORME RGPD / LGPD / CCPA',
    effectiveDate: '7 de Julho de 2026 (Última atualização)',
    sections: [
      {
        heading: '1. CONTROLADOR DE DADOS',
        content: `O Controlador oficial responsável pelo tratamento de dados pessoais no Registro Mundial de Cidadania é a Autoridade New World State (Infraestrutura Descentralizada Global). Contato: privacy@newworldstate.org.`
      },
      {
        heading: '2. TIPOS DE DADOS PROCESSADOS',
        content: `Coletamos e processamos exclusivamente os dados fornecidos no cadastro de cidadania:`,
        list: [
          'Dados Biográficos: Nome, sobrenome, gênero, data e local de nascimento, país de origem, endereço residencial.',
          'Dados de Contato: E-mail válido, preferência linguística.',
          'Dados de Identificação: Fotografia retrato para emissão e validação criptográfica do Cartão de Identidade oficial.',
          'Dados Técnicos: Endereço IP retido temporariamente para segurança de tráfego e defesa contra ataques DDoS.'
        ]
      },
      {
        heading: '3. BASE LEGAL E FINALIDADES',
        content: `Processamento baseado em consentimento explícito e revogável, cumprimento de acordos cívicos e legítimo interesse em segurança. É vedada qualquer venda ou monetização de dados.`
      },
      {
        heading: '4. TRANSFERÊNCIAS INTERNACIONAIS E SEGURANÇA',
        content: `Armazenamento seguro com criptografia forte AES-256 em repouso e TLS 1.3 em trânsito, em total conformidade com Cláusulas Contratuais Padrão e LGPD/RGPD.`
      },
      {
        heading: '5. SEUS DIREITOS FUNDAMENTAIS',
        content: `Garantimos acesso irrestrito, correção imediata, eliminação definitiva (direito ao esquecimento), portabilidade e oposição ao tratamento a qualquer momento.`
      }
    ]
  },
  ru: {
    title: 'Политика конфиденциальности и защита данных граждан',
    badge: 'СООТВЕТСТВУЕТ GDPR / CCPA / APP',
    effectiveDate: '7 июля 2026 г. (Последнее обновление)',
    sections: [
      {
        heading: '1. ОПЕРАТОР ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ',
        content: `Официальным оператором обработки данных Всемирного реестра гражданства является Власть New World State (Глобальная децентрализованная инфраструктура). Официальный контакт: privacy@newworldstate.org.`
      },
      {
        heading: '2. КАТЕГОРИИ ОБРАБАТЫВАЕМЫХ ДАННЫХ',
        content: `Мы обрабатываем исключительно сведения, предоставленные гражданином при подаче заявления:`,
        list: [
          'Анкетные данные: Имя, фамилия, пол, дата и место рождения, страна происхождения, адрес проживания.',
          'Контактные данные: Адрес электронной почты, языковые предпочтения.',
          'Идентификационные данные: Портретная фотография для выпуска официального удостоверения личности и биометрического паспорта.',
          'Технические данные: IP-адрес для защиты от кибератак и оптимизации маршрутизации.'
        ]
      },
      {
        heading: '3. ПРАВОВЫЕ ОСНОВАНИЯ И ЦЕЛИ ОБРАБОТКИ',
        content: `Обработка основана на добровольном согласии, выполнении гражданского соглашения и законном интересе в защите системы. Коммерческая продажа или рекламное профилирование данных запрещены.`
      },
      {
        heading: '4. ТРАНСГРАНИЧНАЯ ПЕРЕДАЧА И БЕЗОПАСНОСТЬ',
        content: `Все серверные узлы используют шифрование AES-256 в состоянии покоя и TLS 1.3 при передаче в полном соответствии со Стандартными договорными условиями ЕС.`
      },
      {
        heading: '5. ПРАВА СУБЪЕКТА ДАННЫХ',
        content: `Вы вправе запросить доступ к своим данным, исправление неточностей, полное удаление («право на забвение»), перенос данных и отзыв согласия.`
      }
    ]
  },
  hi: {
    title: 'गोपनीयता नीति और नागरिक डेटा संरक्षण',
    badge: 'GDPR / CCPA / APP अनुरूप',
    effectiveDate: '7 जुलाई 2026 (अंतिम अद्यतन)',
    sections: [
      {
        heading: '1. डेटा नियंत्रक',
        content: `न्यू वर्ल्ड स्टेट ग्लोबल सिटिजनशिप रजिस्ट्री के तहत आधिकारिक डेटा नियंत्रक न्यू वर्ल्ड स्टेट अथॉरिटी (ग्लोबल डिसेंट्रलाइज्ड इंफ्रास्ट्रक्चर) है। संपर्क: privacy@newworldstate.org.`
      },
      {
        heading: '2. संसाधित डेटा की श्रेणियां',
        content: `हम नागरिक पंजीकरण के दौरान स्वेच्छा से प्रदान की गई निम्नलिखित जानकारी एकत्र करते हैं:`,
        list: [
          'व्यक्तिगत विवरण: प्रथम नाम, उपनाम, लिंग, जन्म तिथि व स्थान, मूल देश, निवास का पता।',
          'संपर्क जानकारी: वैध ईमेल पता, भाषा वरीयता।',
          'पहचान डेटा: आधिकारिक डिजिटल आईडी कार्ड निर्माण के लिए पोर्ट्रेट फोटो।',
          'तकनीकी डेटा: नेटवर्क सुरक्षा और DDoS हमलों से सुरक्षा के लिए अस्थायी आईपी पता।'
        ]
      },
      {
        heading: '3. कानूनी आधार और उद्देश्य',
        content: `डेटा प्रसंस्करण नागरिक सहमति और संप्रभु लोकतांत्रिक सेवाओं के संचालन पर आधारित है। व्यक्तिगत डेटा की बिक्री या वाणिज्यिक विज्ञापन पूरी तरह से निषिद्ध है।`
      },
      {
        heading: '4. अंतर्राष्ट्रीय डेटा स्थानांतरण और सुरक्षा',
        content: `सभी सर्वर नोड्स AES-256 और TLS 1.3 एन्क्रिप्शन का उपयोग करते हैं, जो यूरोपीय संघ के मानक संविदात्मक खंडों के अनुरूप हैं।`
      },
      {
        heading: '5. आपके मौलिक डिजिटल अधिकार',
        content: `आप किसी भी समय अपने डेटा तक पहुंच, सुधार, पूर्ण विलोपन (भूल जाने का अधिकार) और सहमति वापस लेने के अधिकार का प्रयोग कर सकते हैं।`
      }
    ]
  },
  bn: {
    title: 'গোপনীয়তা নীতি এবং নাগরিক তথ্য সুরক্ষা',
    badge: 'GDPR / CCPA / APP সম্মত',
    effectiveDate: '৭ জুলাই ২০২৬ (সর্বশেষ আপডেট)',
    sections: [
      {
        heading: '১. ডেটা নিয়ন্ত্রক',
        content: `নিউ ওয়ার্ল্ড স্টেট গ্লোবাল সিটিজেনশিপ রেজিস্ট্রির অধীনে অফিশিয়াল ডেটা নিয়ন্ত্রক হলো নিউ ওয়ার্ল্ড স্টেট অথরিটি। যোগাযোগ: privacy@newworldstate.org.`
      },
      {
        heading: '২. প্রক্রিয়াকৃত তথ্যের ধরন',
        content: `আমরা নাগরিক নিবন্ধনের সময় সরাসরি আপনার দেওয়া তথ্য সংগ্রহ করি:`,
        list: [
          'ব্যক্তিগত বিবরণ: নাম, পদবি, লিঙ্গ, জন্ম তারিখ ও স্থান, আদি দেশ, বসবাসের ঠিকানা।',
          'যোগাযোগের তথ্য: বৈধ ইমেল ঠিকানা, ভাষা পছন্দ।',
          'শনাক্তকরণ তথ্য: সার্বভৌম ডিজিটাল পরিচয়পত্র তৈরির জন্য পোর্ট্রেট ছবি।',
          'প্রযুক্তিগত তথ্য: সাইবার আক্রমণ প্রতিরোধে ব্যবহৃত অস্থায়ী আইপি ঠিকানা।'
        ]
      },
      {
        heading: '৩. প্রক্রিয়াকরণের আইনি ভিত্তি',
        content: `তথ্য প্রক্রিয়াকরণ নাগরিকের সুস্পষ্ট সম্মতি এবং নাগরিক সেবাদানের ভিত্তিতে সম্পন্ন হয়। কোনো বাণিজ্যিক বিজ্ঞাপন বা তথ্য বিক্রি সম্পূর্ণরূপে নিষিদ্ধ।`
      },
      {
        heading: '৪. নিরাপত্তা ও তথ্য স্থানান্তর',
        content: `সকল সার্ভার নোড AES-256 এবং TLS 1.3 শক্তিশালী এনক্রিপশন প্রয়োগ করে আন্তর্জাতিক ডেটা সুরক্ষা নীতি অনুসরণ করে।`
      },
      {
        heading: '৫. আপনার মৌলিক অধিকার',
        content: `আপনি যেকোনো সময় আপনার তথ্য যাচাই, সংশোধন, সম্পূর্ণ মুছে ফেলা (বিস্মৃত হওয়ার অধিকার) এবং সম্মতি প্রত্যাহারের অধিকার সংরক্ষণ করেন।`
      }
    ]
  },
  zh: {
    title: '公民个人信息与绝对隐私保护政策',
    badge: '严格符合 GDPR / CCPA / APP 标准',
    effectiveDate: '2026年7月7日（官方最新修订）',
    sections: [
      {
        heading: '1. 数据控制者与官方责任机构',
        content: `新世界国家（New World State Authority）全球主权公民登记处是个人信息数据控制者。官方合规邮箱：privacy@newworldstate.org。`
      },
      {
        heading: '2. 处理的个人数据类型与范围',
        content: `我们仅处理公民在户籍注册过程中主动提供的以下信息：`,
        list: [
          '身份档案信息：法定姓名、性别、出生日期与地点、国籍归属、实际居住地址。',
          '官方联络信息：有效电子邮箱、界面语言偏好设置。',
          '生物识别与身份凭证：用于生成主权数字公民身份证（ID Card）及防伪护照的免冠面部肖像。',
          '底层网络安全数据：为抵御网络攻击（如DDoS）并优化全球访问速度而临时采集的IP地址。'
        ]
      },
      {
        heading: '3. 合法性基础与数据处理目的',
        content: `数据处理基于公民明确授权的知情同意、履行业务协定以及保障民主选举基础设施的安全。宪法绝对禁止任何形式的商业数据买卖、用户画像分析或向广告商泄露数据。`
      },
      {
        heading: '4. 跨境数据传输与密码学安全防护',
        content: `全网服务器节点实施高规格存储加密（AES-256）与传输加密（TLS 1.3），严格遵守欧盟标准合同条款（SCC）及国际隐私公约。`
      },
      {
        heading: '5. 全球公民数字主权权利',
        content: `公民在任何时刻均享有查阅权（Access）、更正权（Rectification）、彻底销毁记录与被遗忘权（Erasure/Forgotten）、可携权及随时撤回同意的权利。`
      }
    ]
  },
  ja: {
    title: 'プライバシーポリシー及び市民データ保護規約',
    badge: 'GDPR / CCPA / APP 準拠',
    effectiveDate: '2026年7月7日（最終改定）',
    sections: [
      {
        heading: '1. 個人データ管理者',
        content: `世界市民台帳における個人データの公的データ管理者は New World State Authority（グローバル分散インフラストラクチャ）です。連絡先: privacy@newworldstate.org。`
      },
      {
        heading: '2. 取得・処理する情報の種類',
        content: `市民登録においてご提供いただく以下の情報のみを適法に取り扱います:`,
        list: [
          '身元情報: 氏名、性別、生年月日・出生地、出身国、現住所。',
          '連絡先情報: メールアドレス、言語設定。',
          '本人確認資料: 公式市民IDカード及びデジタル旅券の発行・暗号照合のための顔写真。',
          '技術ログ: DDoS攻撃対策および安全なルーティングのための接続IPアドレス。'
        ]
      },
      {
        heading: '3. 処理の法的根拠及び利用目的',
        content: `市民の明示的な同意、市民権サービスの提供、および投票インフラのサイバー防御を根拠とします。データの商用販売や広告トラッキングは憲法により固く禁じられています。`
      },
      {
        heading: '4. 国境を越えたデータ移転と暗号化基準',
        content: `分散サーバーは保存時にAES-256、転送時にTLS 1.3の堅牢な暗号化を適用し、欧州連合の標準契約条項（SCC）に準拠しています。`
      },
      {
        heading: '5. 市民の不可侵の権利',
        content: `自己の個人データに対する開示請求権、訂正権、完全削除権（忘れられる権利）、データポータビリティ権、および同意撤回権を常時行使できます。`
      }
    ]
  },
  ar: {
    title: 'سياسة الخصوصية وحماية بيانات المواطنين السياديين',
    badge: 'متوافق مع GDPR / CCPA / APP',
    effectiveDate: '7 يوليو 2026 (آخر تحديث رسمي)',
    sections: [
      {
        heading: '1. المسؤول عن معالجة البيانات الشخصية',
        content: `المسؤول الرسمي عن معالجة السجلات الشخصية بموجب سجل المواطنة العالمي لدولة العالم الجديد هو هيئة New World State Authority. البريد الرسمي: privacy@newworldstate.org.`
      },
      {
        heading: '2. فئات البيانات التي تتم معالجتها',
        content: `نقوم بمعالجة الفئات الضرورية التالية التي يقدمها المواطن طواعية:`,
        list: [
          'البيانات الشخصية: الاسم القانوني، اللقب، الجنس، تاريخ ومكان الميلاد، بلد المنشأ، عنوان الإقامة.',
          'معلومات الاتصال: عنوان البريد الإلكتروني، تفضيلات اللغة.',
          'أصول الهوية البيومترية: الصورة الشخصية لإصدار بطاقة الهوية الرقمية الرسمية والتحقق منها.',
          'البيانات التقنية: عنوان IP الذي يتم جمعه مؤقتًا لأغراض التوجيه الآمن ومكافحة الهجمات السيبرانية.'
        ]
      },
      {
        heading: '3. الأساس القانوني والأغراض',
        content: `تستند المعالجة إلى الموافقة الصريحة القابلة للإلغاء، وتنفيذ اتفاقيات المواطنة، والمصلحة المشروعة في حماية البنية التحتية الديمقراطية. يُحظر دستوريًا بيع أو تأجير البيانات الشخصية.`
      },
      {
        heading: '4. النقل عبر الحدود والأمان المشفر',
        content: `تعتمد جميع خوادم النظام اللامركزي تشفيرًا قويًا AES-256 أثناء التخزين و TLS 1.3 أثناء النقل، متوافقة تمامًا مع البنود التعاقدية القياسية للاتحاد الأوروبي.`
      },
      {
        heading: '5. حقوق المواطن الرقمية المطلقة',
        content: `يحق للمواطن في أي وقت ممارسة حق الوصول، والتصحيح الفوري، والحذف النهائي (الحق في النسيان)، ونقل البيانات، وسحب الموافقة دون أي عوائق.`
      }
    ]
  }
};

export const COOKIES_DOC_DATA: Record<Language, {
  title: string;
  badge: string;
  intro: string;
  tableHeaders: [string, string, string, string];
  tableRows: [string, string, string, string][];
  thirdPartyTitle: string;
  thirdPartyBody: string;
}> = {
  it: {
    title: 'Informativa Estesa sui Cookie (Cookie Policy)',
    badge: 'CONSENSO INFORMATO GDPR / ePRIVACY',
    intro: `In conformità con il Regolamento Generale sulla Protezione dei Dati (GDPR) e la Direttiva ePrivacy, questa pagina illustra l'utilizzo dei cookie e delle tecnologie di memorizzazione locale nel portale New World State. Non effettuiamo alcuna profilazione commerciale né tracciamento pubblicitario.`,
    tableHeaders: ['Chiave / Cookie', 'Tipologia', 'Durata', 'Finalità'],
    tableRows: [
      ['nws_cookie_consent', 'Essenziale (Prima Parte)', '180 Giorni', 'Memorizza lo stato del consenso dell’utente (essenziali, preferenze, diagnostica).'],
      ['nws_preferred_language', 'Preferenze (Prima Parte)', 'Persistente', 'Conserva la lingua selezionata dal visitatore.'],
      ['nws_access_font_size', 'Accessibilità (Prima Parte)', 'Persistente', 'Conserva la dimensione dei caratteri personalizzata per favorire la leggibilità.'],
      ['nws_access_contrast', 'Accessibilità (Prima Parte)', 'Persistente', 'Conserva la modalità ad alto contrasto preferita.'],
      ['nws_dismiss_pwa', 'Preferenze (Prima Parte)', 'Persistente', 'Ricorda la chiusura del prompt di installazione dell’applicazione.'],
      ['nws_local_notifications', 'Servizio (Prima Parte)', 'Persistente', 'Memorizza la cronologia degli avvisi istituzionali ricevuti via Service Worker.']
    ],
    thirdPartyTitle: 'Fornitori Tecnici Terzi di Sicurezza e Caratteri',
    thirdPartyBody: `Ci avvaliamo di Cloudflare per la difesa anti-DDoS e la distribuzione sicura dei contenuti (CDN), e di Google Fonts per il caricamento dinamico dei caratteri tipografici istituzionali. Nessun dato viene venduto o usato per fini pubblicitari.`
  },
  en: {
    title: 'Extended Cookie & Tracking Technologies Policy',
    badge: 'GDPR / ePRIVACY INFORMED CONSENT',
    intro: `In accordance with the EU General Data Protection Regulation (GDPR) and the ePrivacy Directive, this document outlines how cookies and sandboxed local storage keys operate on the New World State portal. We run zero behavioral advertising and zero commercial surveillance.`,
    tableHeaders: ['Key / Cookie Name', 'Category', 'Retention', 'Operational Purpose'],
    tableRows: [
      ['nws_cookie_consent', 'Essential (First Party)', '180 Days', 'Stores granular consent preferences (essential, preferences, analytics).'],
      ['nws_preferred_language', 'Preferences (First Party)', 'Persistent', 'Preserves visitor’s chosen interface language.'],
      ['nws_access_font_size', 'Accessibility (First Party)', 'Persistent', 'Preserves custom layout font magnification for readability.'],
      ['nws_access_contrast', 'Accessibility (First Party)', 'Persistent', 'Preserves high-contrast theme selection.'],
      ['nws_dismiss_pwa', 'Preferences (First Party)', 'Persistent', 'Remembers dismissal of progressive web app installation notice.'],
      ['nws_local_notifications', 'Service (First Party)', 'Persistent', 'Caches official regional alerts and local broadcast logs.']
    ],
    thirdPartyTitle: 'Third-Party Technical Security & Font Assets',
    thirdPartyBody: `We utilize Cloudflare for edge anti-DDoS mitigation and CDN acceleration, and Google Fonts for rendering official system typography. Neither provider monetizes your visits or tracks you for advertising purposes.`
  },
  fr: {
    title: 'Politique Détaillée des Cookies et Traceurs',
    badge: 'CONSENTEMENT ÉCLAIRÉ RGPD / ePRIVACY',
    intro: `Conformément au Règlement Général sur la Protection des Données (RGPD) et à la directive ePrivacy, ce document précise l'usage des cookies et du stockage local sur New World State. Aucun profilage publicitaire n'est réalisé.`,
    tableHeaders: ['Clé / Nom du Cookie', 'Catégorie', 'Durée', 'Finalité Opérationnelle'],
    tableRows: [
      ['nws_cookie_consent', 'Essentiel (Interne)', '180 Jours', 'Enregistre l’état du consentement de l’utilisateur.'],
      ['nws_preferred_language', 'Préférences (Interne)', 'Persistant', 'Conserve la langue sélectionnée par l’utilisateur.'],
      ['nws_access_font_size', 'Accessibilité (Interne)', 'Persistant', 'Conserve le niveau d’agrandissement du texte pour la lisibilité.'],
      ['nws_access_contrast', 'Accessibilité (Interne)', 'Persistant', 'Mémorise le mode de contraste élevé sélectionné.'],
      ['nws_dismiss_pwa', 'Préférences (Interne)', 'Persistant', 'Mémorise la fermeture de la bannière d’installation de l’application.'],
      ['nws_local_notifications', 'Service (Interne)', 'Persistant', 'Stocke les notifications officielles émises via le Service Worker.']
    ],
    thirdPartyTitle: 'Fournisseurs Tiers de Sécurité et Polices',
    thirdPartyBody: `Nous utilisons Cloudflare pour la protection contre les attaques DDoS et le CDN mondial, ainsi que Google Fonts pour la typographie. Vos données ne sont jamais cédées à des régies publicitaires.`
  },
  es: {
    title: 'Política Extendida de Cookies y Tecnologías de Rastreo',
    badge: 'CONSENTIMIENTO INFORMADO RGPD / ePRIVACY',
    intro: `En cumplimiento del Reglamento General de Protección de Datos (RGPD) y la Directiva ePrivacy, esta política describe el uso de cookies y almacenamiento local. No realizamos ningún seguimiento con fines comerciales o publicitarios.`,
    tableHeaders: ['Clave / Nombre Cookie', 'Categoría', 'Duración', 'Finalidad Operativa'],
    tableRows: [
      ['nws_cookie_consent', 'Esencial (Propia)', '180 Días', 'Almacena el estado de consentimiento otorgado por el usuario.'],
      ['nws_preferred_language', 'Preferencias (Propia)', 'Persistente', 'Conserva el idioma seleccionado para la interfaz.'],
      ['nws_access_font_size', 'Accesibilidad (Propia)', 'Persistente', 'Guarda el tamaño de fuente personalizado para mejor lectura.'],
      ['nws_access_contrast', 'Accesibilidad (Propia)', 'Persistente', 'Conserva el modo de alto contraste para personas con visión reducida.'],
      ['nws_dismiss_pwa', 'Preferencias (Propia)', 'Persistente', 'Recuerda el cierre del banner de instalación PWA.'],
      ['nws_local_notifications', 'Servicio (Propia)', 'Persistente', 'Almacena los avisos y notificaciones institucionales emitidas.']
    ],
    thirdPartyTitle: 'Servicios Técnicos de Terceros (Seguridad y Fuentes)',
    thirdPartyBody: `Empleamos Cloudflare para la mitigación contra ataques DDoS y entrega de contenido seguro (CDN), y Google Fonts para el renderizado tipográfico. Sus datos nunca son vendidos o compartidos con fines comerciales.`
  },
  pt: {
    title: 'Política Estendida de Cookies e Armazenamento Local',
    badge: 'CONSENTIMENTO INFORMADO RGPD / LGPD',
    intro: `Em conformidade com o RGPD e a legislação sobre privacidade digital, detalhamos o uso de cookies e chaves locais no portal New World State. Rejeitamos expressamente qualquer rastreamento comercial ou publicitário.`,
    tableHeaders: ['Chave / Cookie', 'Categoria', 'Validade', 'Finalidade Técnica'],
    tableRows: [
      ['nws_cookie_consent', 'Essencial (Próprio)', '180 Dias', 'Guarda o consentimento selecionado pelo utilizador.'],
      ['nws_preferred_language', 'Preferências (Próprio)', 'Persistente', 'Mantém o idioma escolhido para a navegação.'],
      ['nws_access_font_size', 'Acessibilidade (Próprio)', 'Persistente', 'Mantém o ajuste de escala de texto para facilitar a leitura.'],
      ['nws_access_contrast', 'Acessibilidade (Próprio)', 'Persistente', 'Conserva a configuração de alto contraste visual.'],
      ['nws_dismiss_pwa', 'Preferências (Próprio)', 'Persistente', 'Evita a reexibição do aviso de instalação do aplicativo.'],
      ['nws_local_notifications', 'Serviço (Próprio)', 'Persistente', 'Armazena localmente o histórico de avisos institucionais.']
    ],
    thirdPartyTitle: 'Parceiros de Segurança e Fontes de Sistema',
    thirdPartyBody: `Utilizamos a Cloudflare para mitigação anti-DDoS e entrega global rápida, e o Google Fonts para renderização tipográfica. Nenhum dado é comercializado.`
  },
  ru: {
    title: 'Расширенная политика файлов cookie и локального хранилища',
    badge: 'СООТВЕТСТВУЕТ GDPR И ДИРЕКТИВЕ ePRIVACY',
    intro: `В соответствии с регламентом GDPR и стандартами конфиденциальности данный документ описывает применение файлов cookie на портале New World State. Мы не занимаемся коммерческим трекингом или рекламой.`,
    tableHeaders: ['Имя ключа / Cookie', 'Категория', 'Срок действия', 'Назначение'],
    tableRows: [
      ['nws_cookie_consent', 'Обязательный (Собственный)', '180 дней', 'Хранит статус согласия пользователя на использование технологий.'],
      ['nws_preferred_language', 'Настройки (Собственный)', 'Постоянный', 'Сохраняет выбранный посетителем язык интерфейса.'],
      ['nws_access_font_size', 'Доступность (Собственный)', 'Постоянный', 'Сохраняет масштаб шрифта для слабовидящих.'],
      ['nws_access_contrast', 'Доступность (Собственный)', 'Постоянный', 'Сохраняет режим повышенной контрастности.'],
      ['nws_dismiss_pwa', 'Настройки (Собственный)', 'Постоянный', 'Запоминает закрытие окна установки веб-приложения.'],
      ['nws_local_notifications', 'Служебный (Собственный)', 'Постоянный', 'Локально кэширует официальные системные уведомления.']
    ],
    thirdPartyTitle: 'Сторонние сервисы безопасности и шрифтов',
    thirdPartyBody: `Мы используем Cloudflare для защиты от DDoS-атак и сеть доставки контента (CDN), а также Google Fonts для шрифтов интерфейса. Ваши данные защищены от коммерческой передачи.`
  },
  hi: {
    title: 'विस्तृत कुकी और स्थानीय भंडारण नीति',
    badge: 'GDPR / ePRIVACY सूचित सहमति',
    intro: `यह दस्तावेज न्यू वर्ल्ड स्टेट पोर्टल पर कुकीज़ और स्थानीय भंडारण के उपयोग की रूपरेखा प्रस्तुत करता है। हम किसी भी प्रकार का व्यावसायिक या विज्ञापन ट्रैकिंग नहीं करते हैं।`,
    tableHeaders: ['कुकी का नाम', 'श्रेणी', 'अवधि', 'उद्देश्य'],
    tableRows: [
      ['nws_cookie_consent', 'आवश्यक', '180 दिन', 'उपयोगकर्ता की सहमति प्राथमिकताओं को सहेजता है।'],
      ['nws_preferred_language', 'प्राथमिकताएं', 'स्थायी', 'उपयोगकर्ता द्वारा चुनी गई भाषा को सुरक्षित रखता है।'],
      ['nws_access_font_size', 'सुलभता', 'स्थायी', 'सुगमता के लिए फ़ॉन्ट आकार को सहेजता है।'],
      ['nws_access_contrast', 'सुलभता', 'स्थायी', 'उच्च कंट्रास्ट विज़ुअल मोड को सहेजता है।'],
      ['nws_dismiss_pwa', 'प्राथमिकताएं', 'स्थायी', 'ऐप इंस्टॉलेशन बैनर बंद करने की स्थिति याद रखता है।'],
      ['nws_local_notifications', 'सेवा', 'स्थायी', 'आधिकारिक घोषणाओं को स्थानीय रूप से संग्रहीत करता है।']
    ],
    thirdPartyTitle: 'तृतीय-पक्ष तकनीकी सुरक्षा एवं फ़ॉन्ट्स',
    thirdPartyBody: `हम नेटवर्क सुरक्षा के लिए Cloudflare और टाइपोग्राफी के लिए Google Fonts का उपयोग करते हैं। कोई भी व्यक्तिगत डेटा विज्ञापनों के लिए नहीं बेचा जाता है।`
  },
  bn: {
    title: 'কুকি এবং লোকাল স্টোরেজ ব্যবহারের নির্দেশিকা',
    badge: 'GDPR / ePRIVACY অবহিত সম্মতি',
    intro: `এই নথিতে নিউ ওয়ার্ল্ড স্টেট পোর্টালে ব্যবহৃত কুকিজ ও লোকাল স্টোরেজের পরিধি ব্যাখ্যা করা হয়েছে। আমরা কোনো বাণিজ্যিক বা বিজ্ঞাপনী ট্র্যাকিং চালাই না।`,
    tableHeaders: ['কুকির নাম', 'বিভাগ', 'মেয়াদ', 'ব্যবহারের উদ্দেশ্য'],
    tableRows: [
      ['nws_cookie_consent', 'প্রয়োজনীয়', '১৮০ দিন', 'ব্যবহারকারীর সম্মতি সংরক্ষণ করে।'],
      ['nws_preferred_language', 'পছন্দসমূহ', 'স্থায়ী', 'ব্যবহারকারীর নির্বাচিত ভাষা মনে রাখে।'],
      ['nws_access_font_size', 'অ্যাক্সেসযোগ্যতা', 'স্থায়ী', 'পাঠযোগ্যতার জন্য ফন্ট সাইজ সংরক্ষণ করে।'],
      ['nws_access_contrast', 'অ্যাক্সেসযোগ্যতা', 'স্থায়ী', 'উচ্চ বৈসাদৃশ্য থিম সংরক্ষণ করে।'],
      ['nws_dismiss_pwa', 'পছন্দসমূহ', 'স্থায়ী', 'অ্যাপ ইনস্টলেশন নোটিশের স্থিতি মনে রাখে।'],
      ['nws_local_notifications', 'সার্ভিস', 'স্থায়ী', 'অফিসিয়াল বার্তা লোকাল ক্যাশে সংরক্ষণ করে।']
    ],
    thirdPartyTitle: 'তৃতীয় পক্ষের প্রযুক্তিগত সেবা',
    thirdPartyBody: `আমরা নেটওয়ার্ক সুরক্ষায় Cloudflare এবং সিস্টেম ফন্টের জন্য Google Fonts ব্যবহার করি। কোনো তথ্য বাণিজ্যিক উদ্দেশ্যে বিক্রি করা হয় না।`
  },
  zh: {
    title: 'Cookie 与本地存储技术合规详解政策',
    badge: '严格符合 GDPR / ePRIVACY 知情同意规范',
    intro: `本政策详细向公民说明新世界国家政务门户网站中 Cookie 与本地存储（Local Storage）的具体运用。我们全面抵制任何商业广告追踪与用户画像滥用。`,
    tableHeaders: ['键名 / Cookie标识', '技术分类', '保留期限', '业务运作具体目的'],
    tableRows: [
      ['nws_cookie_consent', '核心必备（第一方）', '180天', '存储公民对必要、偏好及诊断功能的授权细分偏好。'],
      ['nws_preferred_language', '偏好设置（第一方）', '持久本地', '牢记访问者所选定的官方门户语言。'],
      ['nws_access_font_size', '无障碍技术（第一方）', '持久本地', '持久记录视障友善的界面文字放大比例。'],
      ['nws_access_contrast', '无障碍技术（第一方）', '持久本地', '记忆高对比度深浅视觉辅助模式。'],
      ['nws_dismiss_pwa', '偏好设置（第一方）', '持久本地', '记住已关闭的渐进式Web应用（PWA）下载安装提示。'],
      ['nws_local_notifications', '官方服务（第一方）', '持久本地', '在浏览器本地安全缓存接收到的主权政务与公投通知。']
    ],
    thirdPartyTitle: '第三方技术安全防护与字体支撑',
    thirdPartyBody: `本站依托 Cloudflare 实施分布式抗 DDoS 防护与安全加速，并使用 Google Fonts 呈现官方统一字体。绝无任何第三方商业追踪。`
  },
  ja: {
    title: 'クッキー及びローカルストレージ運用規定',
    badge: 'GDPR / ePRIVACY インフォームドコンセント準拠',
    intro: `当ポータルにおけるクッキー及びブラウザローカルストレージの利用目的を詳述します。商業広告目的の追跡やプロファイリングは一切実施しておりません。`,
    tableHeaders: ['キー / クッキー名', '分類', '保存期間', '運用の目的'],
    tableRows: [
      ['nws_cookie_consent', '必須（ファーストパーティ）', '180日', '市民による同意状態を厳格に保持します。'],
      ['nws_preferred_language', '設定（ファーストパーティ）', '永続的', '選択された表示言語設定を保持します。'],
      ['nws_access_font_size', 'アクセシビリティ', '永続的', '視認性向上のためのフォント拡大率を記憶します。'],
      ['nws_access_contrast', 'アクセシビリティ', '永続的', 'ハイコントラストモード設定を維持します。'],
      ['nws_dismiss_pwa', '設定（ファーストパーティ）', '永続的', 'PWAインストール促進モーダルの非表示状態を記憶します。'],
      ['nws_local_notifications', '行政サービス', '永続的', '受領した公式広報・国民投票通知をローカルに保持します。']
    ],
    thirdPartyTitle: 'サードパーティ技術基盤（セキュリティとフォント）',
    thirdPartyBody: `DDoS攻撃対策および高速配信のために Cloudflare を、公式タイポグラフィ描画のために Google Fonts を利用しています。広告利用は行いません。`
  },
  ar: {
    title: 'السياسة الموسعة لملفات تعريف الارتباط والتخزين المحلي',
    badge: 'الموافقة المستنيرة وفق GDPR و ePRIVACY',
    intro: `توضح هذه السياسة كيفية استخدام ملفات تعريف الارتباط وتقنيات التخزين المحلي في بوابة دولة العالم الجديد. لا نقوم بأي تتبع تجاري أو إعلاني على الإطلاق.`,
    tableHeaders: ['اسم الملف / المفتاح', 'الفئة', 'مدة الاحتفاظ', 'الغرض التشغيلي'],
    tableRows: [
      ['nws_cookie_consent', 'أساسي (طرف أول)', '180 يومًا', 'حفظ خيارات الموافقة المحددة من قبل المستخدم.'],
      ['nws_preferred_language', 'التفضيلات (طرف أول)', 'دائم', 'حفظ اللغة المحددة لتصفح البوابة.'],
      ['nws_access_font_size', 'إمكانية الوصول', 'دائم', 'حفظ نسبة تكبير الخط لتسهيل القراءة.'],
      ['nws_access_contrast', 'إمكانية الوصول', 'دائم', 'حفظ وضع التباين العالي.'],
      ['nws_dismiss_pwa', 'التفضيلات (طرف أول)', 'دائم', 'تذكر إغلاق إشعار تثبيت التطبيق.'],
      ['nws_local_notifications', 'الخدمة (طرف أول)', 'دائم', 'تخزين الإخطارات والبيانات الرسمية المستلمة محليًا.']
    ],
    thirdPartyTitle: 'مزودو الخدمات التقنية والأمان',
    thirdPartyBody: `نستخدم شبكة Cloudflare للحماية من الهجمات السيبرانية والتوزيع الآمن، بالإضافة إلى Google Fonts للخطوط الرسمية، دون أي استغلال إعلاني.`
  }
};

export const TERMS_DOC_DATA: Record<Language, {
  title: string;
  badge: string;
  sections: {
    heading: string;
    content: string;
  }[];
}> = {
  it: {
    title: 'Termini e Condizioni Civiche (Trattato Civico 1.0)',
    badge: 'TRATTATO CIVICO 1.0',
    sections: [
      {
        heading: '1. ADESIONE CIVICA DIGITALE',
        content: `L'iscrizione ufficiale all'Anagrafe Mondiale del New World State sancisce la sottoscrizione morale alla Costituzione e alla Carta dei Diritti della nostra comunità globale, fondata sulla pace universale, il progresso scientifico e l'uguaglianza sociale.`
      },
      {
        heading: '2. CREDENZIALI E VALIDITÀ CRITTOGRAFICA',
        content: `I certificati digitali e le ID Card emesse costituiscono attestazione crittografica di appartenenza. È severamente vietata la falsificazione, la cessione o l'uso illecito contrario ai diritti umani.`
      },
      {
        heading: '3. DEMOCRAZIA DIRETTA E PARTECIPAZIONE',
        content: `La cittadinanza conferisce il diritto inviolabile di partecipazione diretta tramite referendum elettronici, petizioni popolari e assemblee legislative digitali.`
      },
      {
        heading: '4. DIVIETO DI ABUSO E RESPONSABILITÀ',
        content: `È vietato l'uso di bot, attività di scraping non autorizzato, vulnerabilità probing o diffusione di contenuti di odio, discriminazione o frode.`
      }
    ]
  },
  en: {
    title: 'Civic Terms & Conditions (Civic Treaty 1.0)',
    badge: 'CIVIC TREATY 1.0',
    sections: [
      {
        heading: '1. DIGITAL CIVIC AFFILIATION',
        content: `Registration in the New World State Global Registry constitutes moral adherence to the Constitution and Charter of Rights, dedicated to global peace, open science, and digital equality.`
      },
      {
        heading: '2. CREDENTIALS AND CRYPTOGRAPHIC VALIDITY',
        content: `Issued digital ID credentials and cryptographic certificates certify sovereign citizenship. Forgery, fraudulent transfers, or misuse counter to fundamental human rights are strictly prohibited.`
      },
      {
        heading: '3. DIRECT DEMOCRACY & PARTICIPATION',
        content: `Citizenship grants the inviolable right of direct democratic participation through electronic referendums, legislative proposals, and popular ballots.`
      },
      {
        heading: '4. PROHIBITED CONDUCT AND LIABILITY',
        content: `Automated bots, scraping, system penetration testing, or distribution of illicit, hateful, or discriminatory content is strictly banned.`
      }
    ]
  },
  fr: {
    title: 'Termes et Conditions Civiques (Traité Civique 1.0)',
    badge: 'TRAITÉ CIVIQUE 1.0',
    sections: [
      {
        heading: '1. ADHÉSION CIVIQUE NUMÉRIQUE',
        content: `L'inscription officielle au Registre Mondial de New World State implique l'adhésion morale à la Constitution et à la Charte des Droits pour la paix et le progrès.`
      },
      {
        heading: '2. CERTIFICATS ET VALIDITÉ CRYPTOGRAPHIQUE',
        content: `Les cartes d'identité numériques et certificats délivrés attestent l'appartenance souveraine. Toute falsification ou utilisation abusive est interdite.`
      },
      {
        heading: '3. DÉMOCRATIE DIRECTE ET PARTICIPATION',
        content: `La citoyenneté confère le droit inaliénable de voter aux référendums mondiaux et de participer à l'élaboration des réformes législatives.`
      },
      {
        heading: '4. USAGES INTERDITS ET RESPONSABILITÉ',
        content: `L'usage de robots automatisés, le piratage, l'extraction de données et la diffusion de haine ou de discrimination sont formellement proscrits.`
      }
    ]
  },
  es: {
    title: 'Términos y Condiciones Cívicas (Tratado Cívico 1.0)',
    badge: 'TRATADO CÍVICO 1.0',
    sections: [
      {
        heading: '1. AFILIACIÓN CÍVICA DIGITAL',
        content: `La inscripción en el Registro Mundial de New World State representa la adhesión ética a la Constitución y la Carta de Derechos para la paz y el progreso universal.`
      },
      {
        heading: '2. CREDENCIALES Y VALIDEZ CRIPTOGRÁFICA',
        content: `Las credenciales y certificados emitidos prueban la membresía ciudadana soberana. Se prohíbe la falsificación o uso ilícito contrario a los derechos humanos.`
      },
      {
        heading: '3. DEMOCRACIA DIRECTA Y PARTICIPACIÓN',
        content: `La ciudadanía otorga el derecho inviolable de votar en consultas populares, referéndums electrónicos y presentar propuestas legislativas.`
      },
      {
        heading: '4. PROHIBICIONES Y RESPONSABILIDAD',
        content: `Queda terminantemente prohibido el uso de bots, ataques informáticos, raspado de datos o difusión de odio y discriminación.`
      }
    ]
  },
  pt: {
    title: 'Termos e Condições Cívicas (Tratado Cívico 1.0)',
    badge: 'TRATADO CÍVICO 1.0',
    sections: [
      {
        heading: '1. FILIAÇÃO CÍVICA DIGITAL',
        content: `O registro no New World State consagra o compromisso moral com a Constituição e a Carta de Direitos em prol da paz e da cooperação mundial.`
      },
      {
        heading: '2. CREDENCIAIS E VALIDADE CRIPTOGRÁFICA',
        content: `Os certificados e identidades digitais conferem prova criptográfica de cidadania. Falsificações e uso indevido são proibidos.`
      },
      {
        heading: '3. DEMOCRACIA DIRETA',
        content: `A condição de cidadão assegura o direito de votar em referendos soberanos e propor leis populares na plataforma digital.`
      },
      {
        heading: '4. NORMAS DE CONDUTA',
        content: `É vedado o uso de robôs, invasão de segurança, extração não autorizada de dados ou veiculação de ódio e preconceito.`
      }
    ]
  },
  ru: {
    title: 'Гражданские условия и положения (Гражданский трактат 1.0)',
    badge: 'ГРАЖДАНСКИЙ ТРАКТАТ 1.0',
    sections: [
      {
        heading: '1. ЦИФРОВОЕ ГРАЖДАНСКОЕ ЧЛЕНСТВО',
        content: `Регистрация во Всемирном реестре New World State означает моральную приверженность Конституции и Хартии прав во имя мира и прогресса.`
      },
      {
        heading: '2. УДОСТОВЕРЕНИЯ И КРИПТОГРАФИЧЕСКАЯ ПОДЛИННОСТЬ',
        content: `Цифровые сертификаты и ID-карты служат доказательством суверенного членства. Подделка и незаконное использование строго караются.`
      },
      {
        heading: '3. ПРЯМАЯ ДЕМОКРАТИЯ',
        content: `Гражданство дает неотъемлемое право прямого участия в электронных референдумах и выдвижении законодательных инициатив.`
      },
      {
        heading: '4. ЗАПРЕТ ЗЛОУПОТРЕБЛЕНИЙ',
        content: `Запрещено использование ботов, несанкционированный скрапинг, попытки взлома и распространение ненависти или дискриминации.`
      }
    ]
  },
  hi: {
    title: 'नागरिक नियम और शर्तें (नागरिक संधि 1.0)',
    badge: 'नागरिक संधि 1.0',
    sections: [
      {
        heading: '1. डिजिटल नागरिक संबद्धता',
        content: `न्यू वर्ल्ड स्टेट रजिस्ट्री में पंजीकरण शांति और सार्वभौमिक समानता के लिए संविधान और अधिकारों के चार्टर के प्रति नैतिक प्रतिबद्धता है।`
      },
      {
        heading: '2. प्रमाण पत्र और वैधता',
        content: `जारी किए गए डिजिटल पहचान पत्र संप्रभु नागरिकता प्रमाणित करते हैं। धोखाधड़ी या मानवाधिकार विरोधी उपयोग प्रतिबंधित है।`
      },
      {
        heading: '3. प्रत्यक्ष लोकतंत्र',
        content: `नागरिकता जनमत संग्रह में मतदान करने और कानून प्रस्तावित करने का लोकतांत्रिक अधिकार प्रदान करती है।`
      },
      {
        heading: '4. निषिद्ध आचरण',
        content: `स्वचालित बॉट्स, अनधिकृत डेटा निष्कर्षण, या घृणा फैलाने वाली सामग्री का प्रसार सख्त वर्जित है।`
      }
    ]
  },
  bn: {
    title: 'নাগরিক নিয়ম ও শর্তাবলী (নাগরিক চুক্তি ১.০)',
    badge: 'নাগরিক চুক্তি ১.০',
    sections: [
      {
        heading: '১. ডিজিটাল নাগরিক অন্তর্ভুক্তি',
        content: `নিউ ওয়ার্ল্ড স্টেট রেজিস্ট্রিতে নাম নথিভুক্তকরণ সংবিধান ও মানবাধিকার সনদের প্রতি নৈতিক আনুগত্যের প্রতীক।`
      },
      {
        heading: '২. পরিচয়পত্রের বৈধতা',
        content: `প্রদত্ত ডিজিটাল সনদপত্র ও আইডি কার্ড নাগরিকত্ব প্রমাণ করে। জালিয়াতি বা অপব্যবহার কঠোরভাবে নিষিদ্ধ।`
      },
      {
        heading: '৩. প্রত্যক্ষ গণতন্ত্র',
        content: `নাগরিকত্ব গণভোটে অংশগ্রহণ এবং ডিজিটাল অ্যাসেম্বলিতে প্রস্তাব পেশ করার অধিকার প্রদান করে।`
      },
      {
        heading: '৪. নিষিদ্ধ আচরণ',
        content: `স্বয়ংক্রিয় বট ব্যবহার, নিরাপত্তা লঙ্ঘন বা বিদ্বেষমূলক তথ্য প্রচার নিষিদ্ধ।`
      }
    ]
  },
  zh: {
    title: '公民条款与宪章公约（民权盟约 1.0）',
    badge: '民权盟约 1.0 官方基石',
    sections: [
      {
        heading: '1. 数字主权公民身份认同',
        content: `在新世界国家全球公民登记册中正式注册，即代表公民对立国宪法与人权宪章的庄严伦理认同，旨在共同缔造无界和平与人本科技。`
      },
      {
        heading: '2. 身份凭证与密码学真确性',
        content: `本系统签发的主权身份证与公证文件系受保护的密码学凭证。严禁伪造、欺诈转让或用于侵犯人权之非法用途。`
      },
      {
        heading: '3. 全民直接民主与治理参与权',
        content: `经核准的公民享有在主权公投中投票、联合提案并发起全民立法表决的不可剥夺之宪法权利。`
      },
      {
        heading: '4. 行为规范与滥用禁止',
        content: `严厉禁止使用自动化爬虫抓取数据、攻击测压、渗透注入，或散布任何仇恨、歧视言论。`
      }
    ]
  },
  ja: {
    title: '市民利用規約（市民盟約 1.0）',
    badge: '市民盟約 1.0',
    sections: [
      {
        heading: '1. デジタル市民権への誓約',
        content: `New World State への登録は、世界平和と人道主義を掲げる憲法および権利憲章への道徳的賛同を意味します。`
      },
      {
        heading: '2. 認証情報と暗号的真正性',
        content: `発行されるデジタルIDおよび証明書は市民権を証明するものです。偽造や権利侵害目的の不正利用は固く禁止されます。`
      },
      {
        heading: '3. 直接民主主義と参政権',
        content: `市民権により、電子国民投票への参加や法案提起など、直接民主制に基づく主権行使が保障されます。`
      },
      {
        heading: '4. 禁止行為と責任',
        content: `自動ボット、不正スクレイピング、脆弱性スキャン、および差別的・有害なコンテンツの発信を厳禁します。`
      }
    ]
  },
  ar: {
    title: 'الشروط والأحكام المدنية (المعاهدة المدنية 1.0)',
    badge: 'المعاهدة المدنية 1.0',
    sections: [
      {
        heading: '1. الانتماء المدني الرقمي',
        content: `يمثل التسجيل الرسمي في دولة العالم الجديد الالتزام الأخلاقي بالدستور وميثاق الحقوق من أجل السلام العالمي والعدالة.`
      },
      {
        heading: '2. وثائق الهوية والصلاحية المشفرة',
        content: `تشكل بطاقات الهوية الرقمية والشهادات الصادرة إثباتًا رسميًا للمواطنة السيادية. يُمنع التزوير أو الاستخدام غير المشروع.`
      },
      {
        heading: '3. الديمقراطية المباشرة والمشاركة',
        content: `تمنح المواطنة الحق غير القابل للتصرف في التصويت في الاستفتاءات الإلكترونية والمشاركة في صياغة القوانين.`
      },
      {
        heading: '4. السلوكيات المحظورة',
        content: `يُحظر استخدام الروبوتات الآلية أو محاولات الاختراق أو نشر خطاب الكراهية والتمييز.`
      }
    ]
  }
};

export const ACCESSIBILITY_DOC_DATA: Record<Language, {
  title: string;
  badge: string;
  intro: string;
  standardsTitle: string;
  standardsBody: string;
  featuresTitle: string;
  features: string[];
  contactTitle: string;
  contactBody: string;
}> = {
  it: {
    title: 'Dichiarazione di Accessibilità Digitale (WCAG 2.1 AA)',
    badge: 'CONFORME WCAG 2.1 AA / ADA / EN 301 549',
    intro: `Il New World State sancisce che l'accesso senza barriere ai servizi digitali e anagrafici sia un diritto civile inalienabile. Ci adoperiamo attivamente per garantire la massima inclusione a tutti i cittadini.`,
    standardsTitle: '1. Standard di Conformità Riconosciuti',
    standardsBody: `Questo portale è sviluppato in rigorosa conformità con le linee guida internazionali WCAG 2.1 Livello AA (Web Content Accessibility Guidelines), l’ADA Title III (USA) e la norma europea EN 301 549.`,
    featuresTitle: '2. Funzionalità di Accessibilità Integrate',
    features: [
      'Lettore Vocale TTS Multi-Lingua: Sintesi vocale con supporto di fallback continuo per tutte le lingue supportate.',
      'Navigazione Tastiera Completa: Ogni pulsante, form e link è accessibile tramite tasto TAB con indicatore di focus ad alto contrasto.',
      'Regolazione Dimensione Caratteri: Supporto fino al 200% di ingrandimento senza alcuna rottura grafica.',
      'Modalità Alto Contrasto: Temi cromatici ad alto contrasto calcolati con rapporto superiore a 4.5:1 per ipovedenti.',
      'Semantica ARIA Strutturata: Compatibilità nativa con tutti i principali Screen Reader (NVDA, JAWS, VoiceOver, TalkBack).'
    ],
    contactTitle: '3. Segnalazioni e Responsabile Accessibilità',
    contactBody: `Per qualsiasi segnalazione di accessibilità o barriere digitali riscontrate, scrivere direttamente a: privacy@newworldstate.org. Risponderemo tempestivamente.`
  },
  en: {
    title: 'Digital Accessibility Statement (WCAG 2.1 AA)',
    badge: 'WCAG 2.1 AA / ADA / EN 301 549 COMPLIANT',
    intro: `The New World State considers barrier-free digital access to citizenship systems an inalienable civil right. We actively implement the highest universal inclusion standards.`,
    standardsTitle: '1. Recognized Conformance Standards',
    standardsBody: `This portal strictly conforms to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA, ADA Title III (USA), and European Standard EN 301 549.`,
    featuresTitle: '2. Integrated Accessibility Capabilities',
    features: [
      'Multilingual TTS Screen Reader: High-fidelity speech synthesis with uninterrupted cloud fallback across all 11 languages.',
      'Full Keyboard Operability: All controls, forms, and dialogs are fully navigable via TAB with distinct high-contrast focus rings.',
      'Font Resizing & Zoom: Native fluid layouts supporting zoom up to 200% without loss of content or functionality.',
      'High-Contrast Modes: Light and Dark high-contrast themes exceeding the 4.5:1 text-to-background contrast ratio.',
      'Strict ARIA Semantics: Formatted for seamless interpretation by NVDA, JAWS, VoiceOver, and TalkBack.'
    ],
    contactTitle: '3. Accessibility Feedback & Assistance',
    contactBody: `If you encounter any accessibility hurdles, please email our Inclusion Desk at: privacy@newworldstate.org. We prioritize rapid resolutions.`
  },
  fr: {
    title: 'Déclaration d’Accessibilité Numérique (WCAG 2.1 AA)',
    badge: 'CONFORME WCAG 2.1 AA / EN 301 549',
    intro: `L'accès sans barrière aux outils civiques est un droit fondamental. New World State met en œuvre les normes d'inclusion les plus exigeantes.`,
    standardsTitle: '1. Normes et Conformité',
    standardsBody: `Ce portail respecte les directives WCAG 2.1 niveau AA et la norme européenne EN 301 549.`,
    featuresTitle: '2. Fonctionnalités d’Accessibilité',
    features: [
      'Synthèse Vocale TTS Multilingue : Lecture vocale fluide dans toutes les langues supportées.',
      'Navigation Complète au Clavier : Déplacement aisé avec la touche TAB et anneau de focus contrasté.',
      'Agrandissement du Texte : Redimensionnement fluide jusqu’à 200 % sans altération de l’interface.',
      'Modes Contraste Élevé : Thèmes clair et sombre respectant le ratio supérieur à 4.5:1.',
      'Sémantique ARIA Intégrée : Compatibilité optimale avec VoiceOver, NVDA, JAWS et TalkBack.'
    ],
    contactTitle: '3. Contact et Assistance',
    contactBody: `Pour signaler une difficulté d'accès, contactez : privacy@newworldstate.org.`
  },
  es: {
    title: 'Declaración de Accesibilidad Digital (WCAG 2.1 AA)',
    badge: 'CONFORME WCAG 2.1 AA / ADA / EN 301 549',
    intro: `El acceso universal sin barreras a los servicios del New World State es un derecho inalienable. Cumplimos con los más rigurosos estándares de inclusión.`,
    standardsTitle: '1. Estándares de Conformidad',
    standardsBody: `Este sitio web cumple con las Pautas de Accesibilidad para el Contenido Web (WCAG 2.1 nivel AA) y normativas internacionales.`,
    featuresTitle: '2. Funciones de Accesibilidad Disponibles',
    features: [
      'Lector de Voz TTS Multilingüe: Lectura de pantalla con respaldo continuo en los 11 idiomas.',
      'Navegación Total por Teclado: Control íntegro con la tecla TAB y resaltado de foco de alto contraste.',
      'Ampliación de Texto: Soporta zoom tipográfico de hasta el 200% sin pérdida funcional.',
      'Modos de Alto Contraste: Paletas de color con ratio superior a 4.5:1 para personas con baja visión.',
      'Semántica ARIA: Compatibilidad nativa con NVDA, JAWS, TalkBack y VoiceOver.'
    ],
    contactTitle: '3. Contacto para Accesibilidad',
    contactBody: `Si experimenta alguna dificultad, por favor escríbanos a: privacy@newworldstate.org.`
  },
  pt: {
    title: 'Declaração de Acessibilidade Digital (WCAG 2.1 AA)',
    badge: 'CONFORME WCAG 2.1 AA / EN 301 549',
    intro: `O New World State garante o acesso inclusivo e sem barreiras a todos os cidadãos, adotando os mais altos padrões mundiais de acessibilidade.`,
    standardsTitle: '1. Padrões Adotados',
    standardsBody: `Portal em conformidade com as Diretrizes WCAG 2.1 Nível AA e normas internacionais de inclusão.`,
    featuresTitle: '2. Recursos de Acessibilidade',
    features: [
      'Leitor de Voz TTS: Síntese de voz com fallback ininterrupto em todos os 11 idiomas.',
      'Navegação por Teclado: Acesso completo via tecla TAB com foco destacado.',
      'Dimensionamento de Texto: Ampliação fluida até 200% sem perda de conteúdo.',
      'Alto Contraste: Modos de visualização com contraste superior a 4.5:1.',
      'Semântica ARIA: Estrutura otimizada para leitores de tela modernos.'
    ],
    contactTitle: '3. Suporte e Contato',
    contactBody: `Dúvidas ou sugestões sobre acessibilidade podem ser enviadas para: privacy@newworldstate.org.`
  },
  ru: {
    title: 'Заявление о цифровой доступности (WCAG 2.1 AA)',
    badge: 'СООТВЕТСТВУЕТ WCAG 2.1 AA / EN 301 549',
    intro: `Доступность цифровых сервисов гражданам является фундаментальным принципом New World State. Мы реализуем передовые стандарты инклюзивности.`,
    standardsTitle: '1. Стандарты соответствия',
    standardsBody: `Портал разработан в полном соответствии с Руководством по обеспечению доступности веб-контента (WCAG 2.1 Уровень AA).`,
    featuresTitle: '2. Возможности доступности',
    features: [
      'Многоязычный голосовой ридер TTS: Озвучивание страниц на всех 11 языках с резервным воспроизведением.',
      'Управление с клавиатуры: Полная навигация клавишей TAB с контрастной подсветкой фокуса.',
      'Масштабирование текста: Увеличение шрифтов до 200% без нарушения структуры.',
      'Высококонтрастные темы: Режимы с контрастностью выше 4.5:1 для слабовидящих.',
      'Поддержка программ чтения с экрана: Оптимизировано для NVDA, JAWS, VoiceOver и TalkBack.'
    ],
    contactTitle: '3. Обратная связь',
    contactBody: `По вопросам доступности обращайтесь по адресу: privacy@newworldstate.org.`
  },
  hi: {
    title: 'डिजिटल सुलभता वक्तव्य (WCAG 2.1 AA)',
    badge: 'WCAG 2.1 AA अनुरूप',
    intro: `न्यू वर्ल्ड स्टेट डिजिटल सेवाओं तक बाधा रहित पहुंच को एक आवश्यक नागरिक अधिकार मानता है।`,
    standardsTitle: '1. सुलभता मानक',
    standardsBody: `यह पोर्टल वेब सामग्री सुलभता दिशानिर्देश (WCAG 2.1 स्तर AA) के अनुरूप है।`,
    featuresTitle: '2. एकीकृत सुलभता सुविधाएं',
    features: [
      'बहुभाषी टीटीएस स्क्रीन रीडर: 11 आधिकारिक भाषाओं में उच्च गुणवत्ता वाला वाक् संश्लेषण।',
      'पूर्ण कीबोर्ड नेविगेशन: TAB कुंजी के माध्यम से पूरी तरह से संचालित।',
      'टेक्स्ट आकार समायोजन: 200% तक ज़ूम समर्थन।',
      'उच्च कंट्रास्ट मोड: 4.5:1 से अधिक कंट्रास्ट अनुपात।',
      'स्क्रीन रीडर अनुकूलता: NVDA, VoiceOver और TalkBack के साथ पूर्णतः संगत।'
    ],
    contactTitle: '3. संपर्क',
    contactBody: `सुलभता संबंधी सहायता के लिए ईमेल करें: privacy@newworldstate.org.`
  },
  bn: {
    title: 'ডিজিটাল অ্যাক্সেসযোগ্যতা বিবৃতি (WCAG 2.1 AA)',
    badge: 'WCAG 2.1 AA আন্তর্জাতিক মান',
    intro: `নিউ ওয়ার্ল্ড স্টেট নিশ্চিত করে যে ডিজিটাল সেবাগুলোতে প্রবেশাধিকার সকলের জন্য উন্মুক্ত ও বাধাহীন।`,
    standardsTitle: '১. সম্মতি মানদণ্ড',
    standardsBody: `এই পোর্টালটি আন্তর্জাতিক WCAG 2.1 লেভেল AA নির্দেশিকা মেনে তৈরি।`,
    featuresTitle: '২. অ্যাক্সেসযোগ্যতার সুবিধাসমূহ',
    features: [
      'বহুভাষিক ভয়েস রিডার (TTS): সকল ভাষায় স্বাচ্ছন্দ্যে শোনার সুবিধা।',
      'কীবোর্ড নেভিগেশন: মাউস ছাড়াই TAB কী দিয়ে সম্পূর্ণ নিয়ন্ত্রণ।',
      'টেক্সট জুম: ২০০% পর্যন্ত ফন্ট বৃদ্ধির সুবিধা।',
      'উচ্চ বৈসাদৃশ্য মোড: দৃষ্টি সহায়ক বিশেষ কালার কন্ট্রাস্ট।',
      'স্ক্রিন রিডার সমর্থন: VoiceOver, NVDA এবং TalkBack সমর্থন।'
    ],
    contactTitle: '৩. সহায়তা',
    contactBody: `অ্যাক্সেসযোগ্যতা সংক্রান্ত প্রশ্নের জন্য যোগাযোগ করুন: privacy@newworldstate.org.`
  },
  zh: {
    title: '数字无障碍访问与信息包容性声明（WCAG 2.1 AA）',
    badge: '严格符合 WCAG 2.1 AA / ADA / EN 301 549 国际无障碍规范',
    intro: `新世界国家庄严宣告：无障碍平等访问数字政务系统是全体公民不可剥夺的基本民权。我们坚决践行最高维度的信息包容性标准。`,
    standardsTitle: '1. 官方遵循的国际无障碍标准',
    standardsBody: `本政务门户网站严格遵照国际万维网联盟《Web 内容无障碍指南》（WCAG 2.1 AA 级标准）、美国残障人士法案（ADA）及欧洲标准 EN 301 549 实施全流程开发。`,
    featuresTitle: '2. 平台内置的全套无障碍支持体系',
    features: [
      '多语言 TTS 语音读屏伴侣：支持跨全部11种语言的实时语音朗读与不间断容灾播放。',
      '全键盘无障碍操作：所有输入框、公投按钮及菜单均支持 TAB 键平滑导航，并配备高对比度焦点环。',
      '界面文本自由缩放：支持页面高达 200% 的字号自由放大，确保布局自适应且无内容截断。',
      '高对比度明暗视觉辅助：严格遵循文本与背景对比度大于 4.5:1 的专业配色，极大缓解视疲劳与弱视障碍。',
      '结构化 ARIA 语义代码：无缝兼容 NVDA、JAWS、VoiceOver 与 TalkBack 等主流读屏辅助软件。'
    ],
    contactTitle: '3. 无障碍监督与反馈专线',
    contactBody: `若您在访问过程中遇到任何无障碍障碍，请直联法务与技术关怀署：privacy@newworldstate.org。我们将在48小时内跟进并予以技术调优。`
  },
  ja: {
    title: 'デジタルアクセシビリティ宣言（WCAG 2.1 AA）',
    badge: 'WCAG 2.1 AA / ADA / EN 301 549 準拠',
    intro: `市民登録及び行政システムへのバリアフリーなアクセスは基本的人権です。最高水準の情報アクセシビリティを提供します。`,
    standardsTitle: '1. 準拠規格',
    standardsBody: `Web Content Accessibility Guidelines (WCAG) 2.1 レベルAA、米国障害者法（ADA）、および欧州規格 EN 301 549 に準拠しています。`,
    featuresTitle: '2. 実装されているアクセシビリティ機能',
    features: [
      '多言語TTS音声リーダー: 11言語すべてに対応した音声朗読とクラウドフォールバック機能。',
      'フルキーボードナビゲーション: TABキーによる完全操作と明瞭な高コントラストフォーカス表示。',
      'フォント拡大機能: レイアウト崩れを起こすことなく最大200%までの拡大に対応。',
      'ハイコントラスト表示モード: 視認性を追求した4.5:1以上のコントラスト比の専用テーマ。',
      'ARIAセマンティクス実装: NVDA、JAWS、VoiceOver、TalkBack等のスクリーンリーダーに完全対応。'
    ],
    contactTitle: '3. お問い合わせと改善要請',
    contactBody: `アクセシビリティに関するご意見や不都合は privacy@newworldstate.org までお寄せください。迅速に対応いたします。`
  },
  ar: {
    title: 'بيان إمكانية الوصول الرقمي الشامل (WCAG 2.1 AA)',
    badge: 'متوافق مع WCAG 2.1 AA و ADA و EN 301 549',
    intro: `تعتبر دولة العالم الجديد الوصول الرقمي الخالي من العوائق حقًا مدنيًا أصيلًا لكل مواطن، وتلتزم بأعلى معايير الشمولية العالمية.`,
    standardsTitle: '1. معايير الامتثال المعتمدة',
    standardsBody: `تم تصميم هذه البوابة وفقًا لإرشادات إمكانية الوصول إلى محتوى الويب (WCAG 2.1 المستوى AA) والمعايير الأوروبية والأمريكية.`,
    featuresTitle: '2. ميزات إمكانية الوصول المدمجة',
    features: [
      'قارئ الشاشة الصوتي TTS متعدد اللغات: قراءة ناطقة متواصلة بجميع اللغات الإحدى عشرة.',
      'التنقل الكامل عبر لوحة المفاتيح: وصول شامل عبر مفتاح TAB مع مؤشر تركيز عالي التباين.',
      'تكبير النصوص والخطوط: دعم تكبير الخطوط حتى 200% دون فقدان أي محتوى.',
      'أوضاع التباين العالي: سمات بصرية تتجاوز نسبة تباين 4.5:1 لضعاف البصر.',
      'دعم برامج قراءة الشاشة: متوافق بشكل كامل مع NVDA و JAWS و VoiceOver و TalkBack.'
    ],
    contactTitle: '3. مكتب المساعدة وإمكانية الوصول',
    contactBody: `إذا واجهت أي عائق في التصفح، يرجى مراسلتنا عبر: privacy@newworldstate.org للتعامل الفوري مع المشكلة.`
  }
};

export const CCPA_DOC_DATA: Record<Language, {
  title: string;
  badge: string;
  intro: string;
  noSellTitle: string;
  noSellBody: string;
  rightsTitle: string;
  rights: string[];
  optOutNoticeTitle: string;
  optOutNoticeBody: string;
  toggleLabel: string;
  optedOutText: string;
  optedInText: string;
}> = {
  it: {
    title: 'Dichiarazione CCPA & Opt-Out (Do Not Sell/Share)',
    badge: 'CALIFORNIA CONSUMER PRIVACY ACT (CCPA/CPRA)',
    intro: `Ai sensi del California Consumer Privacy Act (CCPA) e del California Privacy Rights Act (CPRA), i residenti della California hanno diritti specifici sulla riservatezza dei propri dati.`,
    noSellTitle: '1. Garanzia Assoluta di Nessuna Vendita dei Dati',
    noSellBody: `Il New World State non vende, non affitta e non condivide le tue informazioni personali con inserzionisti o data broker commerciali per finalità pubblicitarie.`,
    rightsTitle: '2. I Tuoi Diritti ai Sensi del CCPA/CPRA',
    rights: [
      'Diritto di Sapere (Right to Know): Sapere quali dati raccogliamo e con quali finalità civiche.',
      'Diritto di Cancellazione (Right to Delete): Chiedere la cancellazione permanente del proprio dossier anagrafico.',
      'Diritto di Rettifica (Right to Correct): Correggere tempestivamente dati inesatti.',
      'Diritto di Opt-Out: Imporre il divieto di vendita o condivisione dei dati personali.'
    ],
    optOutNoticeTitle: '3. Esercizio Esplicito del Diritto di Opt-Out',
    optOutNoticeBody: `Sebbene non vendiamo alcun dato, mettiamo a disposizione questo controllo interattivo per consentire ai cittadini di registrare formalmente la propria preferenza.`,
    toggleLabel: 'Non vendere o condividere le mie informazioni personali (Do Not Sell or Share)',
    optedOutText: 'OPT-OUT ATTIVO (Nessuna vendita autorizzata né effettuata)',
    optedInText: 'STATO REGOLARE (Nessuna vendita effettuata comunque)'
  },
  en: {
    title: 'CCPA Compliance & Opt-Out (Do Not Sell or Share My Personal Information)',
    badge: 'CALIFORNIA CONSUMER PRIVACY ACT (CCPA/CPRA)',
    intro: `Under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA), California residents are entitled to specific personal data protections.`,
    noSellTitle: '1. Strict Zero-Sale & Sharing Policy',
    noSellBody: `The New World State does not sell, lease, rent, or share personal data with commercial advertisers, data brokers, or behavioral analytics corporations.`,
    rightsTitle: '2. Your CCPA/CPRA Legal Rights',
    rights: [
      'Right to Know: Request transparency regarding the categories of data we process.',
      'Right to Delete: Request complete, irreversible removal of your citizenship record.',
      'Right to Correct: Request immediate correction of outdated or inaccurate information.',
      'Right to Opt-Out: Formally command that your personal data never be sold or shared.'
    ],
    optOutNoticeTitle: '3. Interactive Opt-Out Preference Toggle',
    optOutNoticeBody: `Even though we do not sell or monetize personal data, this interactive switch provides formal certification of your non-disclosure preference.`,
    toggleLabel: 'Do Not Sell or Share My Personal Information',
    optedOutText: 'OPT-OUT ACTIVE (Zero sale or sharing authorized)',
    optedInText: 'DEFAULT STATUS (Zero sale performed in any event)'
  },
  fr: {
    title: 'Conformité CCPA & Droit d’Opt-Out (Ne Pas Vendre Mes Données)',
    badge: 'CALIFORNIA CONSUMER PRIVACY ACT (CCPA/CPRA)',
    intro: `En vertu des lois californiennes CCPA et CPRA, les résidents disposent de garanties spécifiques quant à leurs données personnelles.`,
    noSellTitle: '1. Absence Totale de Vente de Données',
    noSellBody: `New World State ne vend, ne loue et ne partage aucune donnée personnelle avec des tiers à des fins publicitaires.`,
    rightsTitle: '2. Vos Droits CCPA / CPRA',
    rights: [
      'Droit d’Accès et de Savoir : Obtenir le détail des données traitées.',
      'Droit à l’Effacement : Demander la suppression totale de vos registres.',
      'Droit de Rectification : Corriger toute information inexacte.',
      'Droit d’Opt-Out : Interdire formellement toute vente ou partage de vos données.'
    ],
    optOutNoticeTitle: '3. Enregistrement de l’Opt-Out',
    optOutNoticeBody: `Bien qu'aucune donnée ne soit commercialisée, cet outil permet d'enregistrer officiellement votre refus de partage.`,
    toggleLabel: 'Ne pas vendre ou partager mes informations personnelles',
    optedOutText: 'OPT-OUT ACTIVÉ (Aucune vente autorisée)',
    optedInText: 'STATUT PAR DÉFAUT (Aucune vente effectuée)'
  },
  es: {
    title: 'Declaración CCPA y Derecho de Exclusión (No Vender Mis Datos)',
    badge: 'CALIFORNIA CONSUMER PRIVACY ACT (CCPA/CPRA)',
    intro: `La legislación CCPA/CPRA otorga a los residentes de California derechos específicos sobre su privacidad digital.`,
    noSellTitle: '1. Compromiso Cero Venta de Datos',
    noSellBody: `New World State no vende, alquila ni comparte información personal con intermediarios de datos o anunciantes comerciales.`,
    rightsTitle: '2. Sus Derechos CCPA / CPRA',
    rights: [
      'Derecho a Saber: Conocer qué categorías de información recopilamos.',
      'Derecho a Eliminar: Solicitar el borrado íntegro de su expediente cívico.',
      'Derecho a Corregir: Enmendar datos erróneos de forma inmediata.',
      'Derecho de Opt-Out: Requerir que sus datos no sean vendidos ni compartidos.'
    ],
    optOutNoticeTitle: '3. Control Interactivo de Exclusión',
    optOutNoticeBody: `Aunque nunca vendemos información, este interruptor le permite dejar constancia explícita de su decisión.`,
    toggleLabel: 'No vender ni compartir mi información personal',
    optedOutText: 'OPT-OUT ACTIVO (Venta y cesión estrictamente bloqueadas)',
    optedInText: 'ESTADO REGULAR (Ninguna venta realizada en todo caso)'
  },
  pt: {
    title: 'Declaração CCPA e Opção de Não Venda de Dados (Opt-Out)',
    badge: 'CALIFORNIA CONSUMER PRIVACY ACT (CCPA/CPRA)',
    intro: `A legislação da Califórnia (CCPA/CPRA) concede direitos específicos de proteção de dados aos cidadãos residentes.`,
    noSellTitle: '1. Política Rígida de Não Venda',
    noSellBody: `O New World State não vende, não aluga e não compartilha dados pessoais com corretores de dados ou redes de anúncios.`,
    rightsTitle: '2. Seus Direitos CCPA/CPRA',
    rights: [
      'Direito de Saber: Conhecer as informações processadas pelo sistema.',
      'Direito de Exclusão: Exigir o cancelamento e eliminação total do seu registro.',
      'Direito de Correção: Retificar dados inexatos sem demora.',
      'Direito de Opt-Out: Proibir a venda ou partilha das suas informações.'
    ],
    optOutNoticeTitle: '3. Controle Interativo de Preferência',
    optOutNoticeBody: `Mesmo não comercializando dados, disponibilizamos este botão para certificar formalmente sua preferência de privacidade.`,
    toggleLabel: 'Não vender ou compartilhar minhas informações pessoais',
    optedOutText: 'OPT-OUT ATIVO (Nenhuma venda autorizada)',
    optedInText: 'STATUS PADRÃO (Nenhuma venda realizada)'
  },
  ru: {
    title: 'Заявление CCPA и право на отказ от продажи данных (Opt-Out)',
    badge: 'CALIFORNIA CONSUMER PRIVACY ACT (CCPA/CPRA)',
    intro: `Закон штата Калифорния о защите прав потребителей (CCPA/CPRA) предоставляет жителям особые права в отношении персональных данных.`,
    noSellTitle: '1. Полный запрет на продажу данных',
    noSellBody: `New World State не продает, не сдает в аренду и не передает личные данные третьим лицам или брокерам данных.`,
    rightsTitle: '2. Ваши права в соответствии с CCPA/CPRA',
    rights: [
      'Право на информирование: Знать, какие данные собираются и обрабатываются.',
      'Право на удаление: Требовать безвозвратного удаления вашей анкеты гражданина.',
      'Право на исправление: Быстро исправлять неточные или устаревшие данные.',
      'Право на отказ (Opt-Out): Запретить продажу или передачу персональной информации.'
    ],
    optOutNoticeTitle: '3. Интерактивный переключатель отказа',
    optOutNoticeBody: `Хотя мы не продаем данные, этот переключатель позволяет официально зарегистрировать ваш выбор.`,
    toggleLabel: 'Не продавать и не передавать мои личные данные',
    optedOutText: 'ОТКАЗ АКТИВЕН (Продажа и передача заблокированы)',
    optedInText: 'СТАНДАРТНЫЙ СТАТУС (Продажа в любом случае не осуществляется)'
  },
  hi: {
    title: 'CCPA अनुपालन और ऑप्ट-आउट (मेरी जानकारी न बेचें)',
    badge: 'CALIFORNIA CONSUMER PRIVACY ACT (CCPA/CPRA)',
    intro: `कैलिफ़ोर्निया कानून (CCPA/CPRA) के तहत नागरिकों को अपने व्यक्तिगत डेटा पर विशिष्ट अधिकार प्राप्त हैं।`,
    noSellTitle: '1. शून्य डेटा बिक्री गारंटी',
    noSellBody: `न्यू वर्ल्ड स्टेट विज्ञापनदाताओं या डेटा दलालों को व्यक्तिगत जानकारी नहीं बेचता है।`,
    rightsTitle: '2. आपके कानूनी अधिकार',
    rights: [
      'जानने का अधिकार: यह जानना कि क्या जानकारी संसाधित की जा रही है।',
      'हटाने का अधिकार: अपने रिकॉर्ड को पूरी तरह से हटाने का अनुरोध करना।',
      'सुधार का अधिकार: गलत जानकारी को तुरंत ठीक करना।',
      'ऑप्ट-आउट अधिकार: व्यक्तिगत जानकारी की बिक्री पर औपचारिक रोक लगाना।'
    ],
    optOutNoticeTitle: '3. ऑप्ट-आउट विकल्प',
    optOutNoticeBody: `यद्यपि हम डेटा नहीं बेचते हैं, यह स्विच आपकी स्पष्ट वरीयता दर्ज करने की सुविधा देता है।`,
    toggleLabel: 'मेरी व्यक्तिगत जानकारी न बेचें या साझा न करें',
    optedOutText: 'ऑप्ट-आउट सक्रिय (कोई बिक्री अधिकृत नहीं)',
    optedInText: 'मानक स्थिति (कोई डेटा नहीं बेचा जाता)'
  },
  bn: {
    title: 'CCPA সম্মতি এবং অপ্ট-আউট (আমার তথ্য বিক্রি করবেন না)',
    badge: 'CALIFORNIA CONSUMER PRIVACY ACT (CCPA/CPRA)',
    intro: `ক্যালিফোর্নিয়া আইন (CCPA/CPRA) নাগরিকদের ব্যক্তিগত তথ্যের উপর বিশেষ অধিকার নিশ্চিত করে।`,
    noSellTitle: '১. কোনো তথ্য বিক্রি না করার নিশ্চয়তা',
    noSellBody: `নিউ ওয়ার্ল্ড স্টেট কোনো বিজ্ঞাপনদাতা বা ব্রোকারের কাছে ব্যক্তিগত তথ্য বিক্রি করে না।`,
    rightsTitle: '২. আপনার আইনি অধিকারসমূহ',
    rights: [
      'জানার অধিকার: কোন তথ্য সংরক্ষণ করা হচ্ছে তা জানা।',
      'মুছে ফেলার অধিকার: নাগরিক রেকর্ড সম্পূর্ণ মুছে ফেলার আবেদন।',
      'সংশোধনের অধিকার: ভুল তথ্য দ্রুত সংশোধন করা।',
      'অপ্ট-আউট অধিকার: তথ্য বিক্রি বা অংশীদারিত্ব পুরোপুরি নিষিদ্ধ করা।'
    ],
    optOutNoticeTitle: '৩. অপ্ট-আউট সুইচ',
    optOutNoticeBody: `যদিও আমরা তথ্য বিক্রি করি না, এই সুইচটি আপনার আনুষ্ঠানিক অপ্ট-আউট সিদ্ধান্ত লিপিবদ্ধ করে।`,
    toggleLabel: 'আমার ব্যক্তিগত তথ্য বিক্রি বা শেয়ার করবেন না',
    optedOutText: 'অপ্ট-আউট সক্রিয় (কোনো তথ্য বিক্রি অনুমোদিত নয়)',
    optedInText: 'স্বাভাবিক স্থিতি (কোনো তথ্য বিক্রি হয় না)'
  },
  zh: {
    title: '加州消费者隐私法案合规与拒绝出售个人信息声明（CCPA/CPRA）',
    badge: 'CALIFORNIA CONSUMER PRIVACY ACT (CCPA/CPRA)',
    intro: `根据美国加利福尼亚州《消费者隐私法案》（CCPA）与《隐私权利法案》（CPRA），公民对自身个人信息享有明确的数字自主权。`,
    noSellTitle: '1. 绝对零出售与零共享承诺',
    noSellBody: `新世界国家郑重声明：我们过去未曾、现在不会、未来也绝对不会向任何商业第三方、广告联盟或数据中间商出售、出租或共享公民的任何个人信息。`,
    rightsTitle: '2. 您享有的法定 CCPA/CPRA 权利',
    rights: [
      '知情权（Right to Know）：随时查明我们收集并处理的个人信息分类。',
      '删除权（Right to Delete）：要求不可撤销地完全清除您的户籍档案。',
      '更正权（Right to Correct）：要求快速纠正任何存在瑕疵的信息。',
      '拒绝权（Right to Opt-Out）：正式发出拒绝出售或共享个人信息的最高法律指令。'
    ],
    optOutNoticeTitle: '3. 交互式拒绝出售偏好设置',
    optOutNoticeBody: `尽管新世界国家从不参与任何数据商业化运作，我们依然提供此交互开关，以便公民正式行使法定退出权（Opt-Out）。`,
    toggleLabel: '禁止出售或共享我的个人信息 (Do Not Sell or Share My Personal Information)',
    optedOutText: '退出权（OPT-OUT）已生效（严禁任何形式的出售与共享）',
    optedInText: '常规主权状态（在任何情况下均绝对不出售任何数据）'
  },
  ja: {
    title: 'CCPA 遵守及び個人情報不販売宣言（Do Not Sell/Share）',
    badge: 'CALIFORNIA CONSUMER PRIVACY ACT (CCPA/CPRA)',
    intro: `米国カリフォルニア州消費者プライバシー法（CCPA/CPRA）に基づき、住民としての市民権保護を定めます。`,
    noSellTitle: '1. 個人情報の完全非売却・非共有方針',
    noSellBody: `New World State は、いかなる個人情報も商業目的で第三者や広告ブローカーに売却・共有・賃貸することはありません。`,
    rightsTitle: '2. CCPA/CPRA に基づく市民の権利',
    rights: [
      '知る権利: 収集・処理される情報の範囲を知る権利。',
      '削除を求める権利: 登録記録の完全消去を請求する権利。',
      '訂正を求める権利: 誤った個人情報を訂正する権利。',
      'オプトアウト権: 個人情報の販売・共有を禁止する命令を出す権利。'
    ],
    optOutNoticeTitle: '3. インタラクティブ・オプトアウト設定',
    optOutNoticeBody: `当ポータルでは情報販売は行っていませんが、市民の明確な意思表示を記録するため本スイッチを提供しています。`,
    toggleLabel: '個人情報を販売・共有しない（Do Not Sell or Share）',
    optedOutText: 'オプトアウト適用中（いかなる販売・共有も認められません）',
    optedInText: '通常状態（いかなる場合も販売・共有は行われません）'
  },
  ar: {
    title: 'بيان الامتثال لقانون CCPA وخيار عدم بيع البيانات الشخصية',
    badge: 'CALIFORNIA CONSUMER PRIVACY ACT (CCPA/CPRA)',
    intro: `بموجب قانون خصوصية المستهلك في كاليفورنيا (CCPA/CPRA)، يتمتع المواطنون بحقوق محددة بشأن حماية بياناتهم الشخصية.`,
    noSellTitle: '1. الالتزام المطلق بعدم بيع أو مشاركة البيانات',
    noSellBody: `تؤكد دولة العالم الجديد أنها لا تبيع ولا تؤجر ولا تشارك أي بيانات شخصية مع أطراف ثالثة أو شركات إعلانية.`,
    rightsTitle: '2. حقوقك بموجب قانون CCPA/CPRA',
    rights: [
      'حق المعرفة: معرفة فئات البيانات التي تتم معالجتها.',
      'حق الحذف: طلب الحذف الكامل وغير القابل للإلغاء للسجلات الشخصية.',
      'حق التصحيح: تصحيح البيانات غير الدقيقة على الفور.',
      'حق الاعتراض (Opt-Out): حظر بيع أو مشاركة البيانات الشخصية بشكل رسمي.'
    ],
    optOutNoticeTitle: '3. مفتاح تفضيل عدم البيع والمشاركة',
    optOutNoticeBody: `على الرغم من أننا لا نبيع البيانات أبدًا، إلا أننا نوفر هذا المفتاح لتوثيق رغبتك بشكل رسمي.`,
    toggleLabel: 'عدم بيع أو مشاركة معلوماتي الشخصية (Do Not Sell/Share)',
    optedOutText: 'خيار عدم البيع نشط (محظور أي بيع أو مشاركة)',
    optedInText: 'الحالة الطبيعية (لا يتم بيع البيانات بأي حال من الأحوال)'
  }
};

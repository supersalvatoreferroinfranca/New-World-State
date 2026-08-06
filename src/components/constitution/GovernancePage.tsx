import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Landmark, 
  Cpu, 
  Scale, 
  Vote, 
  Layers, 
  Users, 
  Award, 
  Network, 
  BookOpen, 
  ArrowRight, 
  CheckCircle,
  ShieldAlert
} from 'lucide-react';

interface Pillar {
  id: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
  borderClass: string;
  titles: Record<string, string>;
  roles: Record<string, string>;
  details: Record<string, string[]>;
}

const statePillars: Pillar[] = [
  {
    id: 'executive',
    icon: <Landmark className="w-6 h-6 text-brand-gold" />,
    bgClass: 'bg-brand-blue/5',
    textClass: 'text-brand-blue',
    borderClass: 'border-brand-blue/15',
    titles: {
      en: 'Federal Executive Council',
      it: 'Consiglio Esecutivo Federale',
      fr: 'Conseil Exécutif Fédéral',
      es: 'Consejo Ejecutivo Federal',
      pt: 'Conselho Executivo Federal',
      ru: 'Федеральный исполнительный совет',
      hi: 'संघीय कार्यकारी परिषद',
      bn: 'ফেডারেল এক্সিকিউটিভ কাউন্সিল',
      zh: '联邦执行委员会',
      ja: '連邦執行評議会',
      ar: 'المجلس التنفيذي الفيدرالي'
    },
    roles: {
      en: 'Responsible for active daily administration, secure state servers, citizen validation protocols, and international representations.',
      it: 'Responsabile per l’amministrazione attiva quotidiana, i server di stato sicuri, la convalida sull’onboarding dei cittadini e la rappresentanza estera.',
      fr: 'Responsable de l\'administration quotidienne active, des serveurs d\'État sécurisés, des protocoles de validation des citoyens et des représentations internationales.',
      es: 'Responsable de la administración diaria activa, servidores estatales seguros, protocolos de validación de ciudadanos y representaciones internacionales.',
      pt: 'Responsável pela administração diária ativa, servidores estaduais seguros, protocolos de validação de cidadãos e representações internacionais.',
      ru: 'Отвечает за активное ежедневное администрирование, безопасность государственных серверов, протоколы подтверждения граждан и международное представительство.',
      hi: 'सक्रिय दैनिक प्रशासन, सुरक्षित राज्य सर्वर, नागरिक सत्यापन प्रोटोकॉल और अंतर्राष्ट्रीय प्रतिनिधित्व के लिए जिम्मेदार।',
      bn: 'সক্রিয় দৈনিক প্রশাসন, সুরক্ষিত রাষ্ট্রীয় সার্ভার, নাগরিক যাচাইকরণ প্রোটোকল এবং আন্তর্জাতিক প্রতিনিধিত্বের জন্য দায়ী।',
      zh: '负责日常行政事务、安全国家服务器、公民验证协议和国际代表。',
      ja: '日常の積極的な行政、安全な国家サーバー、市民認証プロトコル、および国際的な代表者を担当します。',
      ar: 'مسؤول عن الإدارة اليومية النشطة، وخوادم الدولة الآمنة، وبروتوكولات التحقق من المواطنين، والتمثيل الدولي.'
    },
    details: {
      en: [
        'Chaired by Ministers of State appointed by the Assembly.',
        'Implements public digital infrastructure development.',
        'Supervises the General Registry and NWS Uploader engines.'
      ],
      it: [
        'Presieduto da Ministri di Stato nominati dall’Assemblea.',
        'Sviluppa l’infrastruttura digitale e i servizi pubblici.',
        'Supervisiona l’Anagrafe Generale e i motori di caricamento.'
      ],
      fr: [
        'Présidé par des ministres d\'État nommés par l\'Assemblée.',
        'Met en œuvre le développement de l\'infrastructure numérique publique.',
        'Supervise les moteurs du Registre général et du NWS Uploader.'
      ],
      es: [
        'Presidido por Ministros de Estado nombrados por la Asamblea.',
        'Implementa el desarrollo de la infraestructura digital pública.',
        'Supervisa el Registro General y los motores de carga de NWS.'
      ],
      pt: [
        'Presidido por Ministros de Estado nomeados pela Assembleia.',
        'Implementa o desenvolvimento da infraestrutura digital pública.',
        'Supervisiona o Registro Geral e os motores de upload do NWS.'
      ],
      ru: [
        'Под председательством государственных министров, назначаемых Ассамблеей.',
        'Обеспечивает развитие общественной цифровой инфраструктуры.',
        'Курирует Общий реестр и механизмы загрузки NWS.'
      ],
      hi: [
        'विधानसभा द्वारा नियुक्त राज्य मंत्रियों की अध्यक्षता में।',
        'सार्वजनिक डिजिटल बुनियादी ढांचे के विकास को लागू करता है।',
        'सामान्य रजिस्ट्री और NWS अपलोडर इंजन की निगरानी करता है।'
      ],
      bn: [
        'সমাবেশ দ্বারা নিযুক্ত রাজ্য মন্ত্রীদের সভাপতিত্বে।',
        'জনসাধারণের ডিজিটাল অবকাঠামো উন্নয়ন বাস্তবায়ন করে।',
        'জেনারেল রেজিস্ট্রি এবং NWS আপলোডার ইঞ্জিন তদারকি করে।'
      ],
      zh: [
        '由议会任命的国务部长主持。',
        '实施公共数字化基础设施建设。',
        '监管通用注册表和 NWS 上传引擎。'
      ],
      ja: [
        '議会によって任命された国務大臣が議長を務める。',
        '公共デジタルインフラの開発を推進する。',
        '一般登録簿および NWS アップローダーエンジンを監督します。'
      ],
      ar: [
        'برئاسة وزراء الدولة المعينين من قبل الجمعية.',
        'ينفذ تطوير البنية التحتية الرقمية العامة.',
        'يشرف على السجل العام ومحركات تحميل NWS.'
      ]
    }
  },
  {
    id: 'democracy',
    icon: <Vote className="w-6 h-6 text-emerald-600" />,
    bgClass: 'bg-emerald-500/5',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-500/15',
    titles: {
      en: 'Decentralized Assembly',
      it: 'Assemblea Cittadina Decentrata',
      fr: 'Assemblée Décentralisée',
      es: 'Asamblea Descentralizada',
      pt: 'Assembleia Descentralizada',
      ru: 'Децентрализованная ассамблея',
      hi: 'विकेंद्रीकृत विधानसभा',
      bn: 'বিকেন্দ্রীভূত সমাবেশ',
      zh: '去中心化议会',
      ja: '分散型議会',
      ar: 'الجمعية اللامركزية'
    },
    roles: {
      en: 'Represents the legislative body. Every citizen has direct proposing, lobbying, and voting rights for all civil initiatives.',
      it: 'Rappresenta l’organo legislativo sovrano. Ogni cittadino ha diritti diretti di proposta, discussione e voto per tutte le iniziative civiche.',
      fr: 'Représente le corps législatif souverain. Chaque citoyen dispose d\'un droit direct de proposition, de débat et de vote pour toutes les initiatives civiles.',
      es: 'Representa el cuerpo legislativo soberano. Cada ciudadano tiene derecho directo de propuesta, debate y voto para todas las iniciativas civiles.',
      pt: 'Representa o corpo legislativo soberano. Cada cidadão tem direito direto de proposta, debate e voto para todas as iniciativas civis.',
      ru: 'Представляет суверенный законодательный орган. Каждый гражданин имеет прямое право предлагать, обсуждать и голосовать по всем гражданским инициативам.',
      hi: 'संप्रभु विधायी निकाय का प्रतिनिधित्व करता है। प्रत्येक नागरिक को सभी नागरिक पहलों के लिए सीधे प्रस्ताव देने, चर्चा करने और मतदान करने का अधिकार है।',
      bn: 'সার্বভৌম আইনসভার প্রতিনিধিত্ব করে। প্রতিটি নাগরিকের সমস্ত নাগরিক উদ্যোগের জন্য সরাসরি প্রস্তাব, আলোচনা এবং ভোট দেওয়ার অধিকার রয়েছে।',
      zh: '代表主权立法机构。每个公民对所有民事倡议都拥有直接提案、讨论和投票的权利。',
      ja: '主権立法機関を代表します。すべての市民は、すべての市民イニシアチブに対して直接提案、議論、および投票する権利を有します。',
      ar: 'يمثل الهيئة التشريعية السيادية. لكل مواطن حقوق مباشرة في الاقتراح والمناقشة والتصويت لجميع المبادرات المدنية.'
    },
    details: {
      en: [
        '100% direct voting without political intermediaries.',
        'Proposals executed automatically after consensus.',
        'Cryptographically safe citizen voting keys.'
      ],
      it: [
        'Voto diretto al 100% senza intermediazioni partitiche.',
        'Proposte attuate automaticamente al raggiungimento del quorum.',
        'Chiavi di voto crittograficamente sicure per ogni cittadino.'
      ],
      fr: [
        'Vote direct à 100% sans intermédiaires politiques.',
        'Propositions exécutées automatiquement après obtention du quorum.',
        'Clés de vote des citoyens cryptographiquement sécurisées.'
      ],
      es: [
        'Voto directo al 100% sin intermediarios políticos.',
        'Propuestas ejecutadas automáticamente tras alcanzar el quórum.',
        'Claves de voto de los ciudadanos criptográficamente seguras.'
      ],
      pt: [
        'Voto direto a 100% sem intermediários políticos.',
        'Propostas executadas automaticamente após alcançar o quórum.',
        'Chaves de voto dos cidadãos criptograficamente seguras.'
      ],
      ru: [
        '100% прямое голосование без политических посредников.',
        'Предложения выполняются автоматически после достижения консенсуса.',
        'Криптографически безопасные ключи для голосования граждан.'
      ],
      hi: [
        'राजनीतिक मध्यस्थों के बिना 100% प्रत्यक्ष मतदान।',
        'आम सहमति के बाद प्रस्ताव स्वतः निष्पादित हो जाते हैं।',
        'क्रिप्टोग्राफिक रूप से सुरक्षित नागरिक मतदान कुंजी।'
      ],
      bn: [
        'রাজনৈতিক মধ্যস্থতাকারী ছাড়াই ১০০% সরাসরি ভোটদান।',
        'ঐক্যমত্যের পর প্রস্তাবগুলো স্বয়ংক্রিয়ভাবে কার্যকর হয়।',
        'ক্রিপ্টোগ্রাফিকভাবে সুরক্ষিত নাগরিক ভোটদান চাবিকাঠি।'
      ],
      zh: [
        '100% 直接投票，无政治中介。',
        '达成共识后自动执行提案。',
        '密码学安全的公民投票密钥。'
      ],
      ja: [
        '政治的な中間業者を介さない100%直接投票。',
        '合意形成後に提案が自動的に実行されます。',
        '暗号化された安全な市民投票キー。'
      ],
      ar: [
        'تصويت مباشر بنسبة 100% بدون وسطاء سياسيين.',
        'تنفيذ المقترحات تلقائيًا بعد تحقيق التوافق.',
        'مفاتيح تصويت آمنة ومشفّرة للمواطنين.'
      ]
    }
  },
  {
    id: 'judicial',
    icon: <Scale className="w-6 h-6 text-purple-600" />,
    bgClass: 'bg-purple-500/5',
    textClass: 'text-purple-800',
    borderClass: 'border-purple-500/15',
    titles: {
      en: 'Constitutional Justice',
      it: 'Consiglio di Giustizia Costituzionale',
      fr: 'Justice Constitutionnelle',
      es: 'Justicia Constitucional',
      pt: 'Justiça Constitucional',
      ru: 'Конституционное правосудие',
      hi: 'संवैधानिक न्याय',
      bn: 'সাংবিধানিক বিচার',
      zh: '宪法司法',
      ja: '憲法司法',
      ar: 'العدالة الدستورية'
    },
    roles: {
      en: 'The supreme guarantor of the Constitution. Resolves disputes, enforces individual digital immunity, and audits state software integrity.',
      it: 'L’organo garante supremo della Costituzione. Risolve dispute, applica l’immunità digitale individuale e verifica l’integrità dei software di stato.',
      fr: 'Le garant suprême de la Constitution. Résout les litiges, applique l\'immunité numérique individuelle et audite l\'intégrité des logiciels de l\'État.',
      es: 'El garante supremo de la Constitución. Resuelve disputas, aplica la inmunidad digital individual y audita la integridad del software estatal.',
      pt: 'O garante supremo da Constituição. Resolve disputas, aplica a imunidade digital individual e auditoria a integridade do software estatal.',
      ru: 'Высший гарант Конституции. Разрешает споры, обеспечивает индивидуальный цифровой иммунитет и проверяет целостность государственного программного обеспечения.',
      hi: 'संविधान के सर्वोच्च गारंटर। विवादों का समाधान करता है, व्यक्तिगत डिजिटल प्रतिरक्षा लागू करता है और राज्य सॉफ्टवेयर अखंडता का ऑडिट करता है।',
      bn: 'সংবিধানের সর্বোচ্চ গ্যারান্টার। বিরোধ নিষ্পত্তি করে, ব্যক্তিগত ডিজিটাল অনাক্রম্যতা প্রয়োগ করে এবং রাষ্ট্রীয় সফ্টওয়্যারের সততা অডিট করে।',
      zh: '宪法的最高保证人。解决争议、实施个人数字免疫并审计国家软件完整性。',
      ja: '憲法の最高保証人。紛争を解決し、個人のデジタル免疫を強制し、国家ソフトウェアの完全性を監査します。',
      ar: 'الضامن الأسمى للدستور. يحل النزاعات، ويفرض الحصانة الرقمية الفردية، ويدقق في سلامة برمجيات الدولة.'
    },
    details: {
      en: [
        'Acts completely independent of the executive body.',
        'Reviews algorithms for state service transparency.',
        'Abolishes acts violating the Charter of Rights.'
      ],
      it: [
        'Agisce in totale indipendenza rispetto all’organo esecutivo.',
        'Riesamina gli algoritmi per garantire la massima trasparenza.',
        'Annulla i decreti in contrasto con la Carta dei Diritti.'
      ],
      fr: [
        'Agit en totale indépendance vis-à-vis de l\'organe exécutif.',
        'Examine les algorithmes pour la transparence des services de l\'État.',
        'Abroge les actes violant la Charte des droits.'
      ],
      es: [
        'Actúa de forma completamente independiente del órgano ejecutivo.',
        'Revisa algoritmos para la transparencia del servicio estatal.',
        'Abole actos que violen la Carta de Derechos.'
      ],
      pt: [
        'Atua de forma totalmente independente do órgão executivo.',
        'Revisa algoritmos para a transparência do serviço estatal.',
        'Abole atos que violem a Carta de Direitos.'
      ],
      ru: [
        'Действует совершенно независимо от исполнительного органа.',
        'Проверяет алгоритмы прозрачности государственных услуг.',
        'Отменяет акты, нарушающие Хартию прав.'
      ],
      hi: [
        'कार्यकारी निकाय से पूर्णतः स्वतंत्र होकर कार्य करता है।',
        'राज्य सेवा पारदर्शिता के लिए एल्गोरिदम की समीक्षा करता है।',
        'अधिकारों के चार्टर का उल्लंघन करने वाले कृत्यों को समाप्त करता है।'
      ],
      bn: [
        'কার্যনির্বাহী সংস্থা থেকে সম্পূর্ণ স্বাধীনভাবে কাজ করে।',
        'রাষ্ট্রীয় সেবার স্বচ্ছতার জন্য অ্যালগরিদম পর্যালোচনা করে।',
        'অধিকার সনদ লঙ্ঘনকারী আইন বাতিল করে।'
      ],
      zh: [
        '完全独立于执行机构运作。',
        '审查算法以确保国家服务的透明度。',
        '废除违反权利宪章的行为。'
      ],
      ja: [
        '執行機関から完全に独立して行動する。',
        '国家サービスの透明性のためにアルゴリズムをレビューします。',
        '権利憲章に違反する行為を廃止します。'
      ],
      ar: [
        'يعمل بشكل مستقل تمامًا عن الهيئة التنفيذية.',
        'يراجع الخوارزميات لضمان شفافية خدمات الدولة.',
        'يلغي القوانين التي تخالف ميثاق الحقوق.'
      ]
    }
  },
  {
    id: 'infrastructure',
    icon: <Cpu className="w-6 h-6 text-blue-600" />,
    bgClass: 'bg-blue-500/5',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-500/15',
    titles: {
      en: 'Digital State Infrastructure',
      it: 'Infrastruttura Digitale di Stato',
      fr: 'Infrastructure Numérique de l\'État',
      es: 'Infraestructura Digital del Estado',
      pt: 'Infraestrutura Digital do Estado',
      ru: 'Цифровая инфраструктура государства',
      hi: 'डिजिटल राज्य बुनियादी ढांचा',
      bn: 'ডিজিটাল রাষ্ট্রীয় অবকাঠামো',
      zh: '数字化国家基础设施',
      ja: 'デジタル国家インフラ',
      ar: 'البنية التحتية الرقمية للدولة'
    },
    roles: {
      en: 'The technological foundation ensuring absolute data ownership, zero-tracking, and encrypted communication channels.',
      it: 'Il pilastro tecnologico che assicura la proprietà assoluta dei dati, assenza di tracciamento e comunicazioni protette da crittografia.',
      fr: 'Le fondement technologique garantissant la propriété absolue des données, le suivi zéro et les canaux de communication cryptés.',
      es: 'La base tecnológica que garantiza la propiedad absoluta de los datos, el seguimiento cero y canales de comunicación cifrados.',
      pt: 'A base tecnológica que garante a propriedade absoluta dos dados, o rastreamento zero e canais de comunicação criptografados.',
      ru: 'Технологическая основа, обеспечивающая абсолютное владение данными, отсутствие отслеживания и зашифрованные каналы связи.',
      hi: 'पूर्ण डेटा स्वामित्व, शून्य-ट्रैकिंग और एन्क्रिप्टेड संचार चैनल सुनिश्चित करने वाली तकनीकी नींव।',
      bn: 'সম্পূর্ণ ডেটা মালিকানা, শূন্য-ট্র্যাকিং এবং এনক্রিপ্ট করা যোগাযোগ চ্যানেল নিশ্চিত করার প্রযুক্তিগত ভিত্তি।',
      zh: '确保绝对数据所有权、零跟踪和加密通信渠道的技术基础。',
      ja: '絶対的なデータ所有権、ゼロトラッキング、および暗号化された通信チャネルを保証する技術的基盤。',
      ar: 'الأساس التكنولوجي الذي يضمن الملكية المطلقة للبيانات، وعدم التتبع، وقنوات الاتصال المشفّرة.'
    },
    details: {
      en: [
        'Runs on verified sovereign Cloudflare & secure edge endpoints.',
        'Physical ID Card PDF generations at exact metric proportions.',
        'Automatic offline backup rules protect citizen data vaults.'
      ],
      it: [
        'Opera su Cloudflare e nodi distribuiti controllati dal NWS.',
        'Generazione PDF delle ID Card fisiche a proporzioni metriche esatte.',
        'Regole di backup offline automatico per proteggere i dati personali.'
      ],
      fr: [
        'Fonctionne sur Cloudflare vérifié et points de terminaison edge sécurisés.',
        'Générations de PDF de cartes d\'identité physiques à des proportions métriques exactes.',
        'Des règles de sauvegarde hors ligne automatiques protègent les coffres-forts de données des citoyens.'
      ],
      es: [
        'Se ejecuta en Cloudflare verificado y puntos finales perimetrales seguros.',
        'Generaciones de PDF de tarjetas de identificación físicas con proporciones métricas exactas.',
        'Reglas de copia de seguridad automática sin conexión protegen las bóvedas de datos de los ciudadanos.'
      ],
      pt: [
        'Executado em Cloudflare verificado e endpoints seguros.',
        'Gerações de PDF de carteiras de identidade físicas com proporções métricas exatas.',
        'Regras de backup offline automáticas protegem os cofres de dados dos cidadãos.'
      ],
      ru: [
        'Работает на проверенных суверенных конечных точках Cloudflare и безопасных периферийных узлах.',
        'Генерация PDF-файлов физических удостоверений личности в точных метрических пропорциях.',
        'Правила автоматического автономного резервного копирования защищают хранилища данных граждан.'
      ],
      hi: [
        'सत्यापित संप्रभु क्लाउडफ्लेयर और सुरक्षित एज एंडपॉइंट पर चलता है।',
        'सटीक मीट्रिक अनुपात में भौतिक आईडी कार्ड पीडीएफ जनरेशन।',
        'स्वचालित ऑफ़लाइन बैकअप नियम नागरिक डेटा वॉल्ट की रक्षा करते हैं।'
      ],
      bn: [
        'যাচাইকৃত সার্বভৌম ক্লাউডফ্লেয়ার এবং সুরক্ষিত এজ এন্ডপয়েন্টে চলে।',
        'সঠিক মেট্রিক অনুপাতে শারীরিক আইডি কার্ড পিডিএফ জেনারেশন।',
        'স্বয়ংক্রিয় অফলাইন ব্যাকআপ নিয়ম নাগরিক ডেটা ভল্ট রক্ষা করে।'
      ],
      zh: [
        '运行在经过验证的主权 Cloudflare 和安全边缘端点上。',
        '按照精确的度量比例生成实体身份证 PDF。',
        '自动离线备份规则保护公民数据保险库。'
      ],
      ja: [
        '検証済みの主権Cloudflareおよび安全なエッジエンドポイントで実行されます。',
        '正確な測定プロポーションによる物理的なIDカードのPDF生成。',
        '自動オフラインバックアップルールにより、市民のデータ保管庫が保護されます。'
      ],
      ar: [
        'يعمل على نقاط نهاية Cloudflare السيادية المعتمدة والمحمية.',
        'توليد ملفات PDF لبطاقات الهوية الفيزيائية بنسب مترية دقيقة.',
        'تحمي قواعد النسخ الاحتياطي التلقائي غير المتصلة بالإنترنت خزائن بيانات المواطنين.'
      ]
    }
  }
];

const LOCAL_TRANSLATIONS: Record<string, Record<string, string>> = {
  title: {
    en: 'State Governance',
    it: 'Governance dello Stato',
    fr: 'Gouvernance de l\'État',
    es: 'Gobernanza del Estado',
    pt: 'Governança do Estado',
    ru: 'Государственное управление',
    hi: 'राज्य शासन',
    bn: 'রাষ্ট্রীয় শাসন',
    zh: '国家治理',
    ja: '国家ガバナンス',
    ar: 'حوكمة الدولة'
  },
  subtitle: {
    en: 'Discover the digital direct democracy model, institutional organization, and secure state operations.',
    it: 'Scopri il modello di democrazia diretta digitale, l’organizzazione istituzionale e la sicurezza dello Stato.',
    fr: 'Découvrez le modèle de démocratie directe numérique, l\'organisation institutionnelle et la sécurité de l\'État.',
    es: 'Descubra el modelo de democracia directa digital, la organización institucional y la seguridad del Estado.',
    pt: 'Descubra o modelo de democracia direta digital, a organização institucional e a segurança do Estado.',
    ru: 'Откройте для себя модель цифровой прямой демократии, институциональную организацию и безопасную государственную деятельность.',
    hi: 'डिजिटल प्रत्यक्ष लोकतंत्र मॉडल, संस्थागत संगठन और सुरक्षित राज्य संचालन की खोज करें।',
    bn: 'ডিজিটাল প্রত্যক্ষ গণতন্ত্র মডেল, প্রাতিষ্ঠানিক সংগঠন এবং সুরক্ষিত রাষ্ট্রীয় কার্যক্রম আবিষ্কার করুন।',
    zh: '探索数字直接民主模式、机构组织和安全的国家运营。',
    ja: 'デジタル直接民主主義モデル、制度組織、および安全な国家運営を発見してください。',
    ar: 'اكتشف نموذج الديمقراطية المباشرة الرقمية، والتنظيم المؤسسي، وعمليات الدولة الآمنة.'
  },
  horizonTitle: {
    en: 'A New Horizon of Representation',
    it: 'Un Nuovo Orizzonte di Rappresentanza',
    fr: 'Un nouvel horizon de représentation',
    es: 'Un Nuevo Horizonte de Representación',
    pt: 'Um Novo Horizonte de Representação',
    ru: 'Новый горизонт представительства',
    hi: 'प्रतिनिधित्व का एक नया क्षितिज',
    bn: 'প্রতিনিধিত্বের এক নতুন দিগন্ত',
    zh: '代表权的新地平线',
    ja: '代表制の新たな地平線',
    ar: 'أفق جديد للتمثيل'
  },
  horizonDesc: {
    en: 'The New World State transitions from traditional geopolitical representation to we-centric, values-based digital representation. Our governance model eliminates bureaucratic friction, giving maximum power to the sovereign citizen. Every document, law, and administrative ledger is signed digitally to ensure absolute transparency and auditability.',
    it: 'Il New World State passa dai tradizionali sistemi geopolitici a un modello basato sui valori e sulla rappresentanza digitale diretta dei cittadini. Il nostro modello di governance riduce gli attriti burocratici, ponendo il potere reale direttamente nelle mani dei cittadini. Ogni documento, legge e registro amministrativo è firmato digitalmente per garantire la massima trasparenza e ispezionabilità.',
    fr: 'L\'État du Nouveau Monde passe de la représentation géopolitique traditionnelle à une représentation numérique axée sur les valeurs. Notre modèle de gouvernance élimine les frictions bureaucratiques, donnant un pouvoir maximal au citoyen souverain. Chaque document, loi et registre administratif est signé numériquement pour garantir une transparence et une vérifiabilité absolues.',
    es: 'El Estado del Nuevo Mundo pasa de la representación geopolítica tradicional a una representación digital basada en valores. Nuestro modelo de gobernanza elimina la fricción burocrática, otorgando el máximo poder al ciudadano soberano. Cada documento, ley y registro administrativo se firma digitalmente para garantizar una transparencia y auditabilidad absolutas.',
    pt: 'O Estado do Novo Mundo transita da representação geopolítica tradicional para uma representação digital baseada em valores. Nosso modelo de governança elimina o atrito burocrático, dando poder máximo ao cidadão soberano. Cada documento, lei e registro administrativo é assinado digitalmente para garantir absoluta transparência e auditabilidade.',
    ru: 'Новое мировое государство переходит от традиционного геополитического представительства к цифровому представительству, основанному на ценностях. Наша модель управления устраняет бюрократические трения, предоставляя максимальную власть суверенному гражданину. Каждый документ, закон и административная книга подписываются цифровой подписью для обеспечения абсолютной прозрачности и проверяемости.',
    hi: 'नया विश्व राज्य पारंपरिक भू-राजनीतिक प्रतिनिधित्व से मूल्य-आधारित डिजिटल प्रतिनिधित्व की ओर बढ़ता है। हमारा शासन मॉडल नौकरशाही घर्षण को समाप्त करता है, जिससे संप्रभु नागरिक को अधिकतम शक्ति मिलती है। पूर्ण पारदर्शिता और सुलभता सुनिश्चित करने के लिए प्रत्येक दस्तावेज़, कानून और प्रशासनिक बहीखाता पर डिजिटल रूप से हस्ताक्षर किए जाते हैं।',
    bn: 'নতুন বিশ্ব রাষ্ট্র প্রথাগত ভূ-রাজনৈতিক প্রতিনিধিত্ব থেকে মূল্যভিত্তিক ডিজিটাল প্রতিনিধিত্বে রূপান্তরিত হয়। আমাদের শাসন মডেল আমলাতান্ত্রিক ঘর্ষণ দূর করে, সার্বভৌম নাগরিককে সর্বোচ্চ ক্ষমতা দেয়। সম্পূর্ণ স্বচ্ছতা এবং অডিটযোগ্যতা নিশ্চিত করতে প্রতিটি নথি, আইন এবং প্রশাসনিক খাতা ডিজিটালভাবে স্বাক্ষরিত হয়।',
    zh: '新世界国家从传统的地理政治代表转变为基于价值的数字代表。我们的治理模式消除了官僚摩擦，赋予主权公民最大的权力。每份文件、法律和行政账簿均采用数字签名，以确保绝对的透明度和可审计性。',
    ja: '新世界国家は、従来の地政学的な代表制から、価値観に基づいたデジタル代表制へと移行します。私たちのガバナンスモデルは官僚的な摩擦を排除し、主権市民に最大限の力を与えます。すべての文書、法律、および管理台帳はデジタル署名され、絶対的な透明性と監査可能性を保証します。',
    ar: 'تنتقل الدولة العالمية الجديدة من التمثيل الجيوسياسي التقليدي إلى التمثيل الرقمي القائم على القيم. يلغي نموذج الحوكمة لدينا الاحتكاك البيروقراطي، مما يمنح أقصى قدر من القوة للمواطن السيادي. يتم توقيع كل وثيقة وقانون ودفتر إداري رقمياً لضمان الشفافية والمراجعة المطلقة.'
  },
  foundations: {
    en: 'Institutional Foundations',
    it: 'Istituzioni Costituzionali',
    fr: 'Fondations institutionnelles',
    es: 'Fundamentos Institucionales',
    pt: 'Fundamentos Institucionais',
    ru: 'Институциональные основы',
    hi: 'संस्थागत नींव',
    bn: 'প্রাতিষ্ঠানিক ভিত্তি',
    zh: '机构基础',
    ja: '制度的基礎',
    ar: 'المؤسسات الدستورية'
  },
  pillarDetails: {
    en: 'Sovereign Pillar Details',
    it: 'Dettagli Pilastro Sovrano',
    fr: 'Détails du pilier souverain',
    es: 'Detalles del Pilar Soberano',
    pt: 'Detalhes do Pilar Soberano',
    ru: 'Детали суверенного столпа',
    hi: 'संप्रभु स्तंभ विवरण',
    bn: 'সার্বভৌম স্তম্ভের বিবরণ',
    zh: '主权支柱细节',
    ja: '主権ピラーの詳細',
    ar: 'تفاصيل العمود السيادي'
  },
  coreMandate: {
    en: 'Core Mandate',
    it: 'Mandato Principale',
    fr: 'Mandat principal',
    es: 'Mandato Principal',
    pt: 'Mandato Principal',
    ru: 'Основной мандат',
    hi: 'मुख्य जनादेश',
    bn: 'মূল ম্যান্ডেট',
    zh: '核心职责',
    ja: 'コア・マンデート',
    ar: 'الولاية الأساسية'
  },
  operationalProtocols: {
    en: 'Operational Protocols',
    it: 'Protocollo Operativo',
    fr: 'Protocoles opérationnels',
    es: 'Protocolos Operativos',
    pt: 'Protocolos Operacionais',
    ru: 'Операционные протоколы',
    hi: 'परिचालन प्रोटोकॉल',
    bn: 'অপারেশনাল প্রোটোকল',
    zh: '操作规程',
    ja: '運用プロトコル',
    ar: 'البروتوكولات التشغيلية'
  },
  auditStatus: {
    en: 'Audit Status: Fully Verifiable',
    it: 'Stato Audit: Complessivamente Verificabile',
    fr: 'Statut de l\'audit: entièrement vérifiable',
    es: 'Estado de auditoría: totalmente verificable',
    pt: 'Status de auditoria: totalmente verificável',
    ru: 'Статус аудита: полностью проверяемый',
    hi: 'ऑडिट स्थिति: पूरी तरह से सत्यापन योग्य',
    bn: 'অডিট স্ট্যাটাস: সম্পূর্ণ যাচাইযোগ্য',
    zh: '审计状态：完全可验证',
    ja: '監査ステータス：完全に検証可能',
    ar: 'حالة التدقيق: قابلة للتحقق بالكامل'
  },
  activeSovereign: {
    en: 'Active • Sovereign',
    it: 'Attivo • Sovrano',
    fr: 'Actif • Souverain',
    es: 'Activo • Soberano',
    pt: 'Ativo • Soberano',
    ru: 'Активно • Суверенно',
    hi: 'सक्रिय • संप्रभु',
    bn: 'সক্রিয় • সার্বভৌম',
    zh: '活跃 • 主权',
    ja: 'アクティブ・主権',
    ar: 'نشط • سيادي'
  },
  stateMetadata: {
    en: 'STATE METADATA',
    it: 'METADATI DI STATO',
    fr: 'MÉTADONNÉES DE L\'ÉTAT',
    es: 'METADATOS DEL ESTADO',
    pt: 'METADADOS DO ESTADO',
    ru: 'МЕТАДАННЫЕ ГОСУДАРСТВА',
    hi: 'राज्य मेटाडेटा',
    bn: 'রাষ্ট্রীয় মেটাডেটা',
    zh: '国家元数据',
    ja: '国家メタデータ',
    ar: 'بيانات الدولة التعريفية'
  },
  adminFramework: {
    en: 'Administrative Framework',
    it: 'Quadro Amministrativo di Controllo',
    fr: 'Cadre administratif',
    es: 'Marco Administrativo',
    pt: 'Estrutura Administrativa',
    ru: 'Административная структура',
    hi: 'प्रशासनिक ढांचा',
    bn: 'প্রশাসনিক কাঠামো',
    zh: '行政框架',
    ja: '管理フレームワーク',
    ar: 'الإطار الإداري'
  },
  immutableValues: {
    en: 'Immutable administrative values registered under civil consensus rules.',
    it: 'Valori amministrativi immutabili registrati secondo i consensi di ammissione civica.',
    fr: 'Valeurs administratives immuables enregistrées selon les règles du consensus civil.',
    es: 'Valores administrativos inmutables registrados bajo reglas de consenso civil.',
    pt: 'Valores administrativos imutáveis registrados sob regras de consenso civil.',
    ru: 'Неизменяемые административные ценности, зарегистрированные по правилам гражданского консенсуса.',
    hi: 'नागरिक आम सहमति नियमों के तहत पंजीकृत अपरिवर्तनीय प्रशासनिक मूल्य।',
    bn: 'নাগরিক ঐক্যমত নিয়মের অধীনে নিবন্ধিত অপরিবর্তনীয় প্রশাসনিক মূল্যবোধ।',
    zh: '根据民事共识规则注册的不可变行政价值。',
    ja: '市民合意規則に基づいて登録された不変の管理値。',
    ar: 'القيم الإدارية غير القابلة للتغيير والمسجلة بموجب قواعد التوافق المدني.'
  },
  activeMinistries: {
    en: 'Active Ministries',
    it: 'Ministeri Istituiti',
    fr: 'Ministères actifs',
    es: 'Ministerios Activos',
    pt: 'Ministérios Ativos',
    ru: 'Действующие министерства',
    hi: 'सक्रिय मंत्रालय',
    bn: 'সক্রিয় মন্ত্রণালয়',
    zh: '活跃部委',
    ja: '活動的な省庁',
    ar: 'الوزارات النشطة'
  },
  meritManaged: {
    en: 'Meritocratically managed',
    it: 'Gestiti per competenze',
    fr: 'Géré au mérite',
    es: 'Gestionado meritocráticamente',
    pt: 'Gerenciado meritocraticamente',
    ru: 'Меритократическое управление',
    hi: 'योग्यता के आधार पर प्रबंधित',
    bn: 'যোগ্যতার ভিত্তিতে পরিচালিত',
    zh: '精英管理',
    ja: '実力主義による管理',
    ar: 'تدار بجدارة واستحقاق'
  },
  currentTerm: {
    en: 'Current Term',
    it: 'Legislatura Attuale',
    fr: 'Mandat actuel',
    es: 'Término Actual',
    pt: 'Mandato Atual',
    ru: 'Текущий срок',
    hi: 'वर्तमान कार्यकाल',
    bn: 'বর্তমান মেয়াদ',
    zh: '当前任期',
    ja: '現在の任期',
    ar: 'الدورة الحالية'
  },
  fourYearCycle: {
    en: '4-Year Cycle',
    it: 'Ciclo quadriennale',
    fr: 'Cycle de 4 ans',
    es: 'Ciclo de 4 años',
    pt: 'Ciclo de 4 anos',
    ru: '4-летний цикл',
    hi: '4 साल का चक्र',
    bn: '৪ বছরের চক্র',
    zh: '4年周期',
    ja: '4年周期',
    ar: 'دورة مدتها 4 سنوات'
  },
  vestingQuorum: {
    en: 'Vesting Quorum',
    it: 'Quorum Delibere',
    fr: 'Quorum requis',
    es: 'Quórum de Votación',
    pt: 'Quórum de Votação',
    ru: 'Кворум для принятия решений',
    hi: 'निहित कोरम',
    bn: 'নিহিত কোরাম',
    zh: '法定投票人数',
    ja: '決議クオラム',
    ar: 'نصاب اتخاذ القرار'
  },
  activeVoters: {
    en: 'Of active voters',
    it: 'Degli elettori attivi',
    fr: 'Des électeurs actifs',
    es: 'De votantes activos',
    pt: 'De eleitores ativos',
    ru: 'От активных избирателей',
    hi: 'सक्रिय मतदाताओं का',
    bn: 'সক্রিয় ভোটারদের',
    zh: '活跃选民中',
    ja: 'アクティブな有権者の',
    ar: 'من الناخبين النشطين'
  },
  statePlatform: {
    en: 'State Platform',
    it: 'Server di Veridicità',
    fr: 'Plateforme de l\'État',
    es: 'Plataforma del Estado',
    pt: 'Plataforma do Estado',
    ru: 'Государственная платформа',
    hi: 'राज्य मंच',
    bn: 'রাষ্ট্রীয় প্ল্যাটফর্ম',
    zh: '国家平台',
    ja: '国家プラットフォーム',
    ar: 'منصة الدولة'
  },
  zeroTrustArch: {
    en: 'Zero trust architecture',
    it: 'Architettura Zero-Trust',
    fr: 'Architecture Zero Trust',
    es: 'Arquitectura Zero Trust',
    pt: 'Arquitetura Zero Trust',
    ru: 'Архитектура с нулевым доверием',
    hi: 'शून्य विश्वास वास्तुकला',
    bn: 'জিরো ট্রাস্ট আর্কিটেকচার',
    zh: '零信任架构',
    ja: 'ゼロトラストアーキテクチャ',
    ar: 'بنية انعدام الثقة'
  },
  securityWarning: {
    en: 'Security Warning',
    it: 'Avviso di Sicurezza',
    fr: 'Avertissement de sécurité',
    es: 'Aviso de Seguridad',
    pt: 'Aviso de Segurança',
    ru: 'Предупреждение о безопасности',
    hi: 'सुरक्षा चेतावनी',
    bn: 'নিরাপত্তা সতর্কতা',
    zh: '安全警示',
    ja: 'セキュリティ警告',
    ar: 'تحذير أمني'
  },
  warningDesc: {
    en: 'The New World State does not issue administrative accounts via third-party emails. General official inquiries must go directly to info@newworldstate.org.',
    it: 'Il New World State non rilascia account di amministrazione tramite comunicazioni di terze parti. Le richieste ufficiali passano unicamente da info@newworldstate.org.',
    fr: 'L\'État du Nouveau Monde ne délivre pas de comptes administratifs via des e-mails tiers. Les demandes officielles générales doivent être adressées directement à info@newworldstate.org.',
    es: 'El Estado del Nuevo Mundo no emite cuentas administrativas a través de correos electrónicos de terceros. Las consultas oficiales generales deben enviarse directamente a info@newworldstate.org.',
    pt: 'O Estado do Novo Mundo não emite contas administrativas por meio de e-mails de terceiros. As dúvidas oficiais gerais devem ir diretamente para info@newworldstate.org.',
    ru: 'Новое мировое государство не выдает административные учетные записи через сторонние электронные письма. Общие официальные запросы должны направляться непосредственно по адресу info@newworldstate.org.',
    hi: 'नया विश्व राज्य तीसरे पक्ष के ईमेल के माध्यम से प्रशासनिक खाते जारी नहीं करता है। सामान्य आधिकारिक पूछताछ सीधे info@newworldstate.org पर जानी चाहिए।',
    bn: 'নতুন বিশ্ব রাষ্ট্র তৃতীয় পক্ষের ইমেলের মাধ্যমে প্রশাসনিক অ্যাকাউন্ট ইস্যু করে না। সাধারণ অফিসিয়াল অনুসন্ধানগুলি সরাসরি info@newworldstate.org এ যেতে হবে।',
    zh: '新世界国家不通过第三方电子邮件发布管理账户。一般的官方查询必须直接发送至 info@newworldstate.org。',
    ja: '新世界国家は、サードパーティの電子メールを介して管理アカウントを発行しません。一般的な公式のお問い合わせは、直接 info@newworldstate.org にお送りください。',
    ar: 'لا تصدر الدولة العالمية الجديدة حسابات إدارية عبر رسائل بريد إلكتروني تابعة لجهات خارجية. يجب أن تذهب الاستفسارات الرسمية العامة مباشرة إلى info@newworldstate.org.'
  }
};

export default function GovernancePage() {
  const { language } = useI18n();
  const [selectedPillar, setSelectedPillar] = useState<string>('executive');

  const getT = (key: string): string => {
    const section = LOCAL_TRANSLATIONS[key];
    if (!section) return '';
    return section[language] || section['en'] || '';
  };

  const titleText = getT('title');
  const subtitleText = getT('subtitle');

  const activePillar = statePillars.find(p => p.id === selectedPillar) || statePillars[0];

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
          <Layers className="w-[500px] h-[500px] text-brand-blue" />
        </div>

        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold mb-2">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif text-brand-blue font-bold tracking-tight">
            {titleText}
          </h2>
          <p className="text-sm md:text-md text-muted/90 max-w-xl mx-auto font-light leading-relaxed">
            {subtitleText}
          </p>
          <div className="h-0.5 w-24 bg-brand-gold/30 mx-auto rounded-full" />
        </div>

        {/* Main Governance Introduction */}
        <div className="bg-brand-blue/5 border border-brand-blue/10 rounded-2xl p-6 md:p-8 mb-12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-gold/10 rounded-lg text-brand-gold">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-blue font-tech">
              {getT('horizonTitle')}
            </h3>
          </div>
          <p className="text-xs md:text-sm text-brand-blue/80 leading-relaxed">
            {getT('horizonDesc')}
          </p>
        </div>

        {/* Interactive Organigram Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Navigation/Selector */}
          <div className="lg:col-span-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gold font-tech mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {getT('foundations')}
            </h4>
            
            <div className="flex flex-col gap-3">
              {statePillars.map((p) => {
                const isActive = p.id === selectedPillar;
                const pillarTitle = p.titles[language] || p.titles['en'] || '';
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPillar(p.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                      isActive 
                        ? 'bg-[#0A1C3E] text-white border-brand-gold shadow-lg' 
                        : 'bg-white hover:bg-brand-parchment/40 text-brand-blue border-brand-blue/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-brand-gold/10 text-brand-gold' : 'bg-brand-blue/5'}`}>
                        {p.icon}
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider font-tech font-bold opacity-60">
                          {p.id}
                        </span>
                        <h5 className="font-serif font-bold text-sm md:text-base leading-tight mt-0.5">
                          {pillarTitle}
                        </h5>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${
                      isActive ? 'text-brand-gold translate-x-1' : 'text-brand-blue/30 group-hover:translate-x-1'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details Pane */}
          <div className="lg:col-span-7 bg-white border border-brand-blue/10 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPillar}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-start justify-between border-b border-brand-blue/5 pb-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest font-tech font-extrabold text-brand-gold mt-1 block">
                      {getT('pillarDetails')}
                    </span>
                    <h4 className="font-serif font-bold text-2xl text-brand-blue mt-1">
                      {activePillar.titles[language] || activePillar.titles['en'] || ''}
                    </h4>
                  </div>
                  <div className="p-3 bg-brand-gold/5 rounded-xl border border-brand-gold/15">
                    {activePillar.icon}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted font-tech">
                      {getT('coreMandate')}
                    </h5>
                    <p className="text-xs md:text-sm text-brand-blue/80 font-light leading-relaxed mt-1.5">
                      {activePillar.roles[language] || activePillar.roles['en'] || ''}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted font-tech">
                      {getT('operationalProtocols')}
                    </h5>
                    <ul className="space-y-2.5">
                      {(activePillar.details[language] || activePillar.details['en'] || []).map((det, index) => (
                        <li key={index} className="flex items-start gap-3 text-xs text-brand-blue/90">
                          <CheckCircle className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                          <span>{det}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 pt-4 border-t border-brand-blue/5 flex items-center justify-between text-[11px] text-muted">
              <span className="flex items-center gap-1.5 font-tech uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-brand-gold" />
                {getT('auditStatus')}
              </span>
              <span className="font-bold text-emerald-600 uppercase tracking-widest">
                {getT('activeSovereign')}
              </span>
            </div>
          </div>

        </div>

        {/* State Telemetry Dashboard */}
        <div className="border border-brand-blue/10 rounded-2xl bg-gradient-to-br from-brand-blue to-[#06122a] p-6 text-white mb-10 overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
            <Award className="w-96 h-96 text-white" />
          </div>
          
          <div className="max-w-xl space-y-2 mb-6">
            <span className="text-[9px] font-bold font-tech bg-brand-gold/20 text-brand-gold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {getT('stateMetadata')}
            </span>
            <h4 className="font-serif font-bold text-xl md:text-2xl text-brand-gold">
              {getT('adminFramework')}
            </h4>
            <p className="text-xs text-white/70 font-light">
              {getT('immutableValues')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1.5 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-brand-gold/80 font-tech uppercase tracking-wider font-bold">
                {getT('activeMinistries')}
              </p>
              <h5 className="text-2xl font-bold font-serif leading-none text-white">6</h5>
              <p className="text-[9px] text-white/50 leading-none">
                {getT('meritManaged')}
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-brand-gold/80 font-tech uppercase tracking-wider font-bold">
                {getT('currentTerm')}
              </p>
              <h5 className="text-2xl font-bold font-serif leading-none text-white">2024 - 2028</h5>
              <p className="text-[9px] text-white/50 leading-none">
                {getT('fourYearCycle')}
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-brand-gold/80 font-tech uppercase tracking-wider font-bold">
                {getT('vestingQuorum')}
              </p>
              <h5 className="text-2xl font-bold font-serif leading-none text-white">50.1% + 1</h5>
              <p className="text-[9px] text-white/50 leading-none">
                {getT('activeVoters')}
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] text-brand-gold/80 font-tech uppercase tracking-wider font-bold">
                {getT('statePlatform')}
              </p>
              <h5 className="text-xl font-bold font-tech uppercase leading-none text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-gold block shrink-0 animate-pulse" />
                Cloud-Secure
              </h5>
              <p className="text-[9px] text-white/50 leading-none">
                {getT('zeroTrustArch')}
              </p>
            </div>
          </div>
        </div>

        {/* Warning / Call to Action Alert */}
        <div className="p-5 bg-brand-gold/5 rounded-2xl border border-brand-gold/10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs text-brand-blue">
          <div className="flex gap-3 items-start">
            <div className="p-1.5 bg-brand-gold/10 rounded-lg text-brand-gold shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h6 className="font-bold uppercase tracking-wider font-tech text-[10px] mb-0.5">
                {getT('securityWarning')}
              </h6>
              <p className="text-muted leading-relaxed font-light">
                {getT('warningDesc')}
              </p>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

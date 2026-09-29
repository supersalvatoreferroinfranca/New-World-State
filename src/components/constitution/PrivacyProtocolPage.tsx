import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Language } from '../../constants/translations';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  Server, 
  Key, 
  Database, 
  CheckCircle, 
  FileLock, 
  Network,
  Users
} from 'lucide-react';

interface ProtocolSection {
  id: string;
  icon: React.ReactNode;
  titles: Record<Language, string>;
  descriptions: Record<Language, string>;
  details: Record<Language, string[]>;
}

const protocols: ProtocolSection[] = [
  {
    id: 'digital-immunity',
    icon: <Lock className="w-6 h-6 text-brand-gold" />,
    titles: {
      it: 'Carta dell’Immunità Digitale',
      en: 'Digital Immunity Charter',
      fr: 'Charte d’Immunité Numérique',
      es: 'Carta de Inmunidad Digital',
      pt: 'Carta de Imunidade Digital',
      ru: 'Хартия цифрового иммунитета',
      hi: 'डिजिटल प्रतिरक्षा चार्टर',
      bn: 'ডিজিটাল অনাক্রম্যতা সনদ',
      zh: '数字豁免权宪章',
      ja: 'デジタル不可侵憲章',
      ar: 'ميثاق الحصانة الرقمية'
    },
    descriptions: {
      it: 'I dati della tua identità sono considerati una proiezione inviolabile della tua persona biologica. Nessun tracciamento, profilazione o monetizzazione dei record dei cittadini è tecnologicamente possibile o legalmente tollerato.',
      en: 'Your identity data is considered an inviolable projection of your biological person. No tracking, profiling, or monetization of citizen records is technologically possible or legally tolerated.',
      fr: 'Vos données d’identité sont considérées comme une projection inviolable de votre personne. Aucun traçage, profilage ou monétisation n’est toléré ou techniquement permis.',
      es: 'Los datos de su identidad se consideran una proyección inviolable de su persona biológica. Ningún rastreo, creación de perfiles o monetización es posible ni tolerado legalmente.',
      pt: 'Os dados da sua identidade são considerados uma projeção inviolável da sua pessoa. Nenhum rastreamento, criação de perfil ou monetização é permitido.',
      ru: 'Данные вашей личности считаются неотъемлемой проекцией вашей личности. Никакое отслеживание, профилирование или монетизация записей граждан невозможны.',
      hi: 'आपकी पहचान का डेटा आपके जैविक व्यक्तित्व का एक अनुल्लंघनीय हिस्सा माना जाता है। नागरिकों के रिकॉर्ड की कोई ट्रैकिंग या मुद्रीकरण तकनीकी रूप से संभव नहीं है।',
      bn: 'আপনার পরিচয় ডেটা আপনার জৈবিক ব্যক্তির একটি অলঙ্ঘনীয় অংশ হিসাবে বিবেচিত হয়। কোনও ট্র্যাকিং বা নগদীকরণ প্রযুক্তিগতভাবে অনুমোদিত নয়।',
      zh: '您的身份数据被视为您生物个体的神圣不可分割延伸。任何针对公民档案的追踪、画像或商业变现，在技术和法律层面上均被彻底杜绝。',
      ja: '個人の識別データは生体個人の不可侵な延長とみなされます。市民記録の追跡、プロファイリング、収益化は技術的にも法的にも一切排除されています。',
      ar: 'تُعتبر بيانات هويتك امتداداً غير قابل للمساس لشخصيتك. لا يمكن تقنياً ولا يُسمح قانونياً بأي تتبع أو استغلال لسجلات المواطنين.'
    },
    details: {
      it: [
        'Chiavi di controllo crittografiche auto-sovrane possedute esclusivamente dal cittadino.',
        'Assoluta non-cooperazione con motori pubblicitari esterni, tracciamenti o broker di dati.',
        'Domicilio digitale protetto con zero tracciatori analitici esterni.'
      ],
      en: [
        'Self-sovereign cryptographic control keys owned exclusively by the citizen.',
        'Absolute non-cooperation with third-party advertising, profiling engines, or surveillance brokers.',
        'Protected digital domicile with zero external analytics tracking.'
      ],
      fr: [
        'Clés cryptographiques auto-souveraines détenues exclusivement par le citoyen.',
        'Non-coopération absolue avec les régies publicitaires et courtiers en données.',
        'Domicile numérique protégé sans aucun pistage analytique externe.'
      ],
      es: [
        'Claves criptográficas soberanas propiedad exclusiva del ciudadano.',
        'Absoluta no cooperación con redes publicitarias externas o intermediarios de datos.',
        'Domicilio digital protegido con cero rastreadores analíticos externos.'
      ],
      pt: [
        'Chaves criptográficas auto-soberanas de posse exclusiva do cidadão.',
        'Não cooperação absoluta com redes de anúncios ou intermediários de dados.',
        'Domicílio digital protegido sem rastreadores analíticos externos.'
      ],
      ru: [
        'Криптографические ключи суверенного контроля принадлежат исключительно гражданину.',
        'Полный отказ от сотрудничества с рекламными сетями и брокерами данных.',
        'Защищенное цифровое пространство без внешних аналитических трекеров.'
      ],
      hi: [
        'नागरिक के पूर्ण स्वामित्व वाली संप्रभु क्रिप्टोग्राफ़िक कुंजियाँ।',
        'विज्ञापन नेटवर्क या डेटा ब्रोकरों के साथ पूर्ण गैर-सहयोग।',
        'शून्य बाहरी ट्रैकर के साथ संरक्षित डिजिटल आवास।'
      ],
      bn: [
        'নাগরিকের একান্ত মালিকানাধীন সার্বভৌমিক ক্রিপ্টোগ্রাফিক কী।',
        'বিজ্ঞাপন নেটওয়ার্ক বা ডেটা ব্রোকারদের সাথে সম্পূর্ণ অসহযোগিতা।',
        'কোনও বহিরাগত অ্যানালিটিক্স ট্র্যাকার ছাড়া সুরক্ষিত ডিজিটাল পরিবেশ।'
      ],
      zh: [
        '由公民个人自主独占掌控的自主权加密私钥。',
        '坚决拒绝与任何第三方广告网络、用户画像系统或数据交易中介合作。',
        '零外部监控分析跟踪器的绝对安全私密数字居所。'
      ],
      ja: [
        '市民自身が独占的に保持する自己主権型暗号化キー。',
        '外部広告ネットワークやデータブローカーとの完全な非協力。',
        '外部トラッカーを一切排除した保護されたデジタル空間。'
      ],
      ar: [
        'مفاتيح تشفير ذاتية السيادة مملوكة حصرياً للمواطن.',
        'عدم التعاون المطلق مع محركات الإعلانات أو سماسرة البيانات.',
        'موطن رقمي آمن تماماً وخالٍ من أي متتبعات خارجية.'
      ]
    }
  },
  {
    id: 'e2e-encryption',
    icon: <FileLock className="w-6 h-6 text-brand-gold" />,
    titles: {
      it: 'Crittografia End-to-End delle Credenziali',
      en: 'End-to-End Credential Encryption',
      fr: 'Chiffrement de Bout en Bout des Identifiants',
      es: 'Cifrado Extremo a Extremo de Credenciales',
      pt: 'Criptografia de Ponta a Ponta de Credenciais',
      ru: 'Сквозное шифрование учетных данных',
      hi: 'क्रेडेंशियल्स का एंड-टू-एंड एन्क्रिप्शन',
      bn: 'ক্রেডেনশিয়ালের এন্ড-টু-এন্ড এনক্রিপশন',
      zh: '凭证端到端高强度加密',
      ja: '認証情報のエンドツーエンド暗号化',
      ar: 'تشفير شامل لبيانات الاعتماد'
    },
    descriptions: {
      it: 'I dati delle ID Card Sovrane, le fotografie e gli identificativi dei cittadini sono cifrati in transito e sui sistemi di persistenza. La federazione implementa hash standard di alto livello con motori di firma sicuri.',
      en: 'Sovereign ID Card data, photographs, and citizen identifiers are secured at rest and during transit. The federation implements high-level standard hashes with secure signature engines.',
      fr: 'Les données d’identité, photographies et identifiants sont protégés au repos et en transit via des protocoles de signature haute sécurité.',
      es: 'Los datos de la Tarjeta Soberana, fotos e identificadores se protegen en tránsito y en reposo mediante firmas digitales avanzadas.',
      pt: 'Os dados do Cartão Soberano, fotos e identificadores são protegidos em repouso e trânsito com assinaturas seguras.',
      ru: 'Данные суверенной ID-карты, фотографии и идентификаторы зашифрованы при передаче и хранении с использованием криптографических подписей.',
      hi: 'संप्रभु आईडी कार्ड डेटा, तस्वीरें और पहचानकर्ता ट्रांजिट और रेस्ट दोनों में पूरी तरह सुरक्षित हैं।',
      bn: 'সার্বভৌম আইডি কার্ডের তথ্য, ছবি এবং শনাক্তকারী উপাদান নিরাপদ স্বাক্ষরের মাধ্যমে সুরক্ষিত।',
      zh: '主权公民身份证数据、高清照片及公民编码在传输与存储中全程高强度加密，配备安全数字签名引擎。',
      ja: '市民IDカード情報、顔写真、個別識別子は安全な暗号署名エンジンにより送受信・保管の全工程で保護されます。',
      ar: 'بيانات الهوية السيادية والصور والمحددات محمية ومفرزة أثناء النقل والتخزين بأحدث تقنيات التوقيع الإلكتروني.'
    },
    details: {
      it: [
        'Flusso di generazione PDF e foto con paradigma zero-knowledge.',
        'Gli hash di verifica sono separati dai motori di ricerca standard per impedire l’indicizzazione automatica.',
        'Firme digitali crittografate su tutti i certificati approvati.'
      ],
      en: [
        'Zero-knowledge photo and PDF generation flow.',
        'Verification hashes are decoupled from standard search engines to prevent automated indexing.',
        'Encrypted digital signatures on all approved certificates.'
      ],
      fr: [
        'Flux de génération PDF sans connaissance (zero-knowledge).',
        'Empreintes cryptographiques isolées des moteurs de recherche publics.',
        'Signatures numériques chiffrées sur l’ensemble des certificats.'
      ],
      es: [
        'Generación de credenciales con paradigma de conocimiento cero.',
        'Identificadores desvinculados de buscadores para evitar indexación automática.',
        'Firmas digitales cifradas en todos los certificados oficiales.'
      ],
      pt: [
        'Geração de PDF com paradigma de conhecimento zero.',
        'Hashes isolados de motores de busca para impedir indexação indesejada.',
        'Assinaturas digitais criptografadas em todos os certificados.'
      ],
      ru: [
        'Генерация документов по принципу нулевого разглашения.',
        'Хэши проверки изолированы от поисковых систем.',
        'Цифровые криптографические подписи на всех сертификатах.'
      ],
      hi: [
        'ज़ीरो-नॉलेज तकनीक पर आधारित फोटो और पीडीएफ निर्माण।',
        'स्वचालित अनुक्रमण को रोकने के लिए सर्च इंजन से सुरक्षित अलगाव।',
        'सभी आधिकारिक प्रमाणपत्रों पर सुरक्षित डिजिटल हस्ताक्षर।'
      ],
      bn: [
        'জিরো-নলেজ আর্কিটেকচারে সুরক্ষিত পরিচয়পত্র ও নথি প্রণয়ন।',
        'সার্চ ইঞ্জিন কর্তৃক অননুমোদিত ইনডেক্সিং প্রতিরোধে সুরক্ষিত বিচ্ছিন্নতা।',
        'সকল অনুমোদিত সনদে এনক্রিপ্ট করা ডিজিটাল স্বাক্ষর।'
      ],
      zh: [
        '严格遵循零知识验证原则的数字身份证与文书生成链路。',
        '验证凭证哈希与公开搜索引擎物理隔离，杜绝网络爬虫自动索引起底。',
        '所有经审核公民证书均加盖抗量子篡改的权威加密数字水印。'
      ],
      ja: [
        'ゼロ知識証明パラダイムに基づく写真および書類生成。',
        '検索エンジンの自動インデックス化を防ぐ検証ハッシュの隔離。',
        '全承認証明書に対する暗号化デジタル署名の付与。'
      ],
      ar: [
        'إنشاء مستندات وصور بنظام المعرفة الصفرية (Zero-Knowledge).',
        'فصل شفرات التحقق عن محركات البحث لمنع الفهرسة التلقائية.',
        'توقيعات رقمية مشفرة على جميع الشهادات المعتمدة.'
      ]
    }
  },
  {
    id: 'infrastructure-privacy',
    icon: <Server className="w-6 h-6 text-brand-gold" />,
    titles: {
      it: 'Infrastruttura di Confine Sovrana',
      en: 'Sovereign Edge Infrastructure',
      fr: 'Infrastructure de Bordure Souveraine',
      es: 'Infraestructura de Borde Soberana',
      pt: 'Infraestrutura de Borda Soberana',
      ru: 'Суверенная периферийная инфраструктура',
      hi: 'संप्रभु एज इंफ्रास्ट्रक्चर',
      bn: 'সার্বভৌম এজ পরিকাঠামো',
      zh: '主权边缘计算基础设施',
      ja: '主権エッジインフラストラクチャ',
      ar: 'بنية تحتية طرفية سيادية'
    },
    descriptions: {
      it: 'I nostri database e server operano esclusivamente su reti cloud-native protette da difese avanzate e container sicuri a livello regionale con assenza assoluta di backdoor automatizzate.',
      en: 'Our databases and servers run exclusively on cloud-native networks protected by advanced web shields and regional secure containers with zero automated backdoors.',
      fr: 'Nos bases de données fonctionnent exclusivement sur des réseaux souverains protégés contre toute porte dérobée.',
      es: 'Nuestras bases de datos y servidores operan en redes protegidas con contenedores seguros y ausencia absoluta de puertas traseras.',
      pt: 'Nossos servidores operam em redes soberanas protegidas sem qualquer backdoor ou acesso não autorizado.',
      ru: 'Базы данных и серверы работают исключительно в защищенных облачных сетях с нулевым количеством бэкдоров.',
      hi: 'हमारा डेटाबेस और सर्वर उन्नत सुरक्षा शील्ड के साथ क्लाउड-नेटिव नेटवर्क पर सुरक्षित रूप से संचालित होते हैं।',
      bn: 'আমাদের ডেটাবেস এবং সার্ভারগুলি উন্নত সুরক্ষা সহ ক্লাউড-নেটিভ নেটওয়ার্কে নিরাপদে পরিচালিত হয়।',
      zh: '所有数据库与计算节点均部署于具备边缘智能防护的云原生主权集群，容器物理隔离，绝对不存在任何后门。',
      ja: 'データベースおよびサーバーは高度な防壁と地域コンテナにより保護され、バックドアは一切存在しません。',
      ar: 'تعمل قواعد البيانات وخوادمنا حصرياً على شبكات مؤمنة بحاويات إقليمية دون أي ثغرات أو أبواب خلفية.'
    },
    details: {
      it: [
        'Edge worker che eseguono i compiti in sandbox isolate, minimizzando l’impronta dei dati.',
        'Procedure di backup cifrate senza alcun intermediario proprietario esterno.',
        'Controlli automatici di validazione in tempo reale senza memorizzare gli indirizzi IP.'
      ],
      en: [
        'Edge workers execute tasks in sandbox isolation, minimizing data footprints.',
        'Encrypted backup procedures without external proprietary intermediaries.',
        'Real-time automated validation checks without logging IP addresses.'
      ],
      fr: [
        'Edge workers exécutant les calculs en bac à sable hermétique.',
        'Sauvegardes chiffrées sans aucun intermédiaire commercial.',
        'Validations en temps réel sans journalisation des adresses IP.'
      ],
      es: [
        'Edge workers que procesan tareas en entornos aislados minimizando la huella de datos.',
        'Copias de seguridad cifradas sin intermediarios comerciales externos.',
        'Validaciones automáticas en tiempo real sin registro de direcciones IP.'
      ],
      pt: [
        'Edge workers em sandbox isolado reduzindo o rastro de dados.',
        'Backups criptografados sem intermediários proprietários.',
        'Validação em tempo real sem registro de endereços IP.'
      ],
      ru: [
        'Периферийные узлы выполняют задачи в изолированных песочницах.',
        'Резервное шифрованное копирование без коммерческих посредников.',
        'Автоматическая проверка в реальном времени без сохранения IP-адресов.'
      ],
      hi: [
        'डेटा पदचिह्न को कम करते हुए अलग सैंडबॉक्स में कार्यों का निष्पादन।',
        'बिना किसी बाहरी मध्यस्थ के एन्क्रिप्टेड बैकअप प्रक्रियाएं।',
        'आईपी पते को रिकॉर्ड किए बिना वास्तविक समय में स्वचालित सत्यापन।'
      ],
      bn: [
        'বিচ্ছিন্ন স্যান্ডবক্সে কাজ পরিচালনার মাধ্যমে ডেটা ফুটপ্রিন্ট ন্যূনতমকরণ।',
        'কোনও বহিরাগত মধ্যস্থতাকারী ছাড়া এনক্রিপ্ট করা ব্যাকআপ ব্যবস্থা।',
        'আইপি ঠিকানা সংরক্ষণ না করে রিয়েল-টাইম স্বয়ংক্রিয় যাচাইকরণ।'
      ],
      zh: [
        '微服务与边缘计算节点在严密隔离的沙盒内执行，最大程度减少数据驻留痕迹。',
        '全量加密冷热备份机制，杜绝任何外部商业云中介窥探。',
        '实时高并发自动化准入认证，从不在日志中记录留存访客实际真实 IP 地址。'
      ],
      ja: [
        '隔離されたサンドボックス環境でタスクを実行し、データ痕跡を最小化。',
        '外部の商用仲介者を一切介さない暗号化バックアップ体制。',
        'IPアドレスを保存しないリアルタイム自動検証処理。'
      ],
      ar: [
        'معالجة المهام في بيئات معزولة تماماً لتقليل أي أثر للبيانات.',
        'نسخ احتياطية مشفرة بالكامل دون أي وسيط تجاري خارجي.',
        'تحقق آلي في الوقت الفعلي دون تسجيل عناوين الـ IP.'
      ]
    }
  }
];

export default function PrivacyProtocolPage() {
  const { language, tText } = useI18n();
  const lang = (language in protocols[0].titles ? language : 'it') as Language;

  const titleText = {
    it: 'Protocollo della Privacy Sovrana',
    en: 'Sovereign Privacy Protocol',
    fr: 'Protocole de Confidentialité Souveraine',
    es: 'Protocolo de Privacidad Soberana',
    pt: 'Protocolo de Privacidade Soberana',
    ru: 'Протокол суверенной конфиденциальности',
    hi: 'संप्रभु गोपनीयता प्रोटोकॉल',
    bn: 'সার্বভৌম গোপনীয়তা প্রোটোকল',
    zh: '主权级隐私保护最高协议',
    ja: '主権プライバシープロトコル',
    ar: 'بروتوكول الخصوصية والسيادة'
  }[lang] || 'Sovereign Privacy Protocol';

  const subtitleText = {
    it: 'I livelli fondamentali di protezione che regolano i dati dei cittadini globali con sicurezza assoluta e trasparenza crittografica.',
    en: 'The fundamental protection layers governing global citizen data with absolute safety and cryptographic transparency.',
    fr: 'Les couches de protection fondamentales garantissant la sécurité absolue et la transparence cryptographique des citoyens.',
    es: 'Las capas de protección fundamentales que rigen los datos de los ciudadanos globales con absoluta seguridad y transparencia.',
    pt: 'As camadas de proteção fundamentais que governam os dados dos cidadãos com segurança absoluta e transparência.',
    ru: 'Фундаментальные уровни защиты данных граждан с абсолютной безопасностью и криптографической прозрачностью.',
    hi: 'वैश्विक नागरिक डेटा को पूर्ण सुरक्षा और क्रिप्टोग्राफ़िक पारदर्शिता के साथ सुरक्षित रखने वाले सुरक्षा स्तर।',
    bn: 'পরম সুরক্ষা এবং ক্রিপ্টোগ্রাফিক স্বচ্ছতার সাথে বিশ্বব্যাপী নাগরিক ডেটা সুরক্ষার স্তরসমূহ।',
    zh: '以绝对严密的物理与算法安全机制、结合高透明度密码学审计，全天候守护全体主权公民的数字身份。',
    ja: '完全な安全性と暗号化の透明性をもって世界市民のデータを守る基本保護レイヤー。',
    ar: 'طبقات الحماية الأساسية التي تنظم بيانات المواطنين العالميين بأمان مطلق وشفافية مشفرة.'
  }[lang] || 'The fundamental protection layers governing global citizen data with absolute safety and cryptographic transparency.';

  const bannerTitle = {
    it: 'Protocollo di Immunità Universale',
    en: 'Universal Immunity Protocol',
    fr: 'Protocole d’Immunité Universelle',
    es: 'Protocolo de Inmunidad Universal',
    pt: 'Protocolo de Imunidade Universal',
    ru: 'Протокол универсального иммунитета',
    hi: 'सार्वभौमिक प्रतिरक्षा प्रोटोकॉल',
    bn: 'সার্বজনীন অনাক্রম্যতা প্রোটোকল',
    zh: '全球普适性豁免与保护协议',
    ja: '普遍的不可侵プロトコル',
    ar: 'بروتوكول الحصانة العالمية'
  }[lang] || 'Universal Immunity Protocol';

  const bannerText = {
    it: 'Il New World State non raccoglie dati per monitorare, controllare o limitare le sue popolazioni. Invece, l’Anagrafe Mondiale funge da registro protettivo configurato per tutelare l’identità individuale. I tuoi file sono generati dinamicamente, custoditi in sicurezza e i controlli di validazione avvengono sotto rigidi termini di non divulgazione.',
    en: 'The New World State does not collect data to monitor, control, or restrict its populations. Instead, our civil registry serves as a decentralizable repository designed to shield individual identities. Your files are generated dynamically, held securely, and verification checks are governed under rigid zero-disclosure terms.',
    fr: 'Le New World State ne collecte aucune donnée pour surveiller ou restreindre ses citoyens. L’état civil agit comme un bouclier souverain pour protéger l’identité de chaque individu.',
    es: 'El New World State no recopila datos para vigilar o restringir a sus ciudadanos. El registro civil actúa como un escudo protector para salvaguardar la identidad individual con total confidencialidad.',
    pt: 'O New World State não coleta dados para vigiar ou controlar as pessoas. Nosso registro serve para proteger a identidade com segurança e estrita confidencialidade.',
    ru: 'New World State не собирает данные для слежки или контроля граждан. Гражданский реестр создан для надежной защиты суверенной личности с нулевым разглашением.',
    hi: 'न्यू वर्ल्ड स्टेट नागरिकों की निगरानी या नियंत्रण के लिए डेटा एकत्र नहीं करता है। नागरिक रजिस्ट्री व्यक्तिगत पहचान की सुरक्षा के लिए एक सुरक्षात्मक ढाल के रूप में कार्य करती है।',
    bn: 'নিউ ওয়ার্ল্ড স্টেট নাগরিকদের নজরদারি বা নিয়ন্ত্রণের জন্য তথ্য সংগ্রহ করে না। আমাদের সিভিল রেজিস্ট্রি ব্যক্তিগত পরিচয় রক্ষার জন্য তৈরি একটি রক্ষাকবচ।',
    zh: 'New World State 坚决不采集任何用于监控、限制或操纵公民个体的多余数据。全球民政户籍注册中心本质上是一道数字防护盾牌，用以捍卫公民神圣不可侵犯的自由。所有文件动态即时生成、零披露校验、绝对安全。',
    ja: 'New World Stateはいかなる市民も監視や統制のためにデータを収集することはありません。世界市民登録簿は個人の尊厳を守る防壁として機能し、厳格なゼロ開示方針の下で運用されます。',
    ar: 'لا تقوم New World State بجمع البيانات لمراقبة أو تقييد مواطنيها. وبدلاً من ذلك، يعمل السجل المدني كدرع يحمي هوية الأفراد في سرية تامة.'
  }[lang] || 'The New World State does not collect data to monitor, control, or restrict its populations.';

  const metricsTitle = {
    it: 'Verifica dei Sistemi di Stato',
    en: 'State System Auditing',
    fr: 'Audit des Systèmes d’État',
    es: 'Auditoría de Sistemas Estatales',
    pt: 'Auditoria dos Sistemas Estatais',
    ru: 'Аудит государственных систем',
    hi: 'राज्य प्रणाली ऑडिटिंग',
    bn: 'রাষ্ট্রীয় সিস্টেম অডিটিং',
    zh: '主权国家系统密码学审计',
    ja: '国家システム監査',
    ar: 'تدقيق أنظمة الدولة'
  }[lang] || 'State System Auditing';

  const metricsDesc = {
    it: 'Tutti i codici QR stampati sui documenti cartacei sono instradati tramite canali di verifica protetti. Preserviamo l’integrità delle iscrizioni anagrafiche dei nostri cittadini contro manipolazioni esterne.',
    en: 'All verification QR codes printed on physical papers route through decentralized verification paths. We protect the integrity of citizen registration certificates against external manipulation.',
    fr: 'Tous les codes QR de vérification imprimés sur papier transitent par des canaux décentralisés sécurisés.',
    es: 'Todos los códigos QR de verificación impresos se enrutan mediante canales seguros para preservar la integridad de los certificados frente a manipulaciones.',
    pt: 'Todos os QR codes impressos nos certificados passam por canais seguros para evitar qualquer manipulação externa.',
    ru: 'Все проверочные QR-коды защищены децентрализованными алгоритмами проверки, гарантируя подлинность документов.',
    hi: 'दस्तावेजों पर मुद्रित सभी सत्यापन क्यूआर कोड सुरक्षित चैनलों के माध्यम से बाहरी हेरफेर से सुरक्षित रहते हैं।',
    bn: 'মুদ্রিত নথিপত্রের সমস্ত যাচাইকরণ কিউআর কোড বাইরের কারচুপি থেকে নাগরিকদের সনদ সুরক্ষিত রাখে।',
    zh: '印制于纸质身份证件上的防伪二维码均经由去中心化安全通路校验，无缝抵御任何形式的伪造与外部篡改。',
    ja: '証明書等に印刷された検証QRコードは分散型安全経路を経由し、外部の不正改ざんから完全に保護されます。',
    ar: 'تمر جميع رموز التحقق (QR) عبر مسارات آمنة تضمن سلامة شهادات التسجيل ضد أي تلاعب خارجي.'
  }[lang] || 'All verification QR codes printed on physical papers route through decentralized verification paths.';

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
          <EyeOff className="w-[500px] h-[500px] text-brand-blue" />
        </div>

        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold mb-2">
            <EyeOff className="w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif text-brand-blue font-bold tracking-tight">
            {titleText}
          </h2>
          <p className="text-sm md:text-md text-muted/90 max-w-xl mx-auto font-light leading-relaxed">
            {subtitleText}
          </p>
          <div className="h-0.5 w-24 bg-brand-gold/30 mx-auto rounded-full" />
        </div>

        {/* Introductory Banner */}
        <div className="bg-[#0A1C3E] text-white border border-brand-blue/10 rounded-2xl p-6 md:p-8 mb-12 space-y-4 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 opacity-10">
            <ShieldCheck className="w-48 h-48 text-brand-gold" />
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-gold/10 rounded-lg text-brand-gold border border-brand-gold/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-gold font-tech">
              {bannerTitle}
            </h3>
          </div>
          <p className="text-xs md:text-sm text-gray-200 leading-relaxed max-w-4xl relative z-10">
            {bannerText}
          </p>
        </div>

        {/* Protocols Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {protocols.map((section) => (
            <div 
              key={section.id} 
              className="bg-white border border-brand-blue/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-brand-gold/40 transition-colors"
            >
              <div className="space-y-4">
                <div className="p-3 bg-brand-gold/5 rounded-xl border border-brand-gold/15 inline-block">
                  {section.icon}
                </div>
                <h4 className="font-serif font-bold text-xl text-brand-blue">
                  {section.titles[lang] || section.titles.en}
                </h4>
                <p className="text-xs text-muted/90 font-light leading-relaxed">
                  {section.descriptions[lang] || section.descriptions.en}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-brand-blue/5 space-y-2">
                {(section.details[lang] || section.details.en).map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-[11px] text-brand-blue/90 font-light">
                    <CheckCircle className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Cryptographic Standards */}
        <div className="border border-brand-blue/10 rounded-2xl bg-gradient-to-br from-[#0a1c3e] to-[#040c1c] p-6 text-white md:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="space-y-2 max-w-2xl">
              <span className="text-[9px] font-bold font-tech bg-brand-gold/20 text-brand-gold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {tText('ENCRYPTION METRICS', 'METRICHE DI CIFRATURA')}
              </span>
              <h4 className="font-serif font-semibold text-xl md:text-2xl text-brand-gold">
                {metricsTitle}
              </h4>
              <p className="text-xs text-white/70 font-light leading-relaxed">
                {metricsDesc}
              </p>
            </div>

            <div className="flex gap-4 shrink-0 flex-wrap">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center min-w-[110px]">
                <p className="text-[10px] text-brand-gold/80 font-tech uppercase font-bold tracking-wider">{tText('Data Lease', 'Durata Dati')}</p>
                <p className="text-lg font-serif font-bold text-white mt-1">{tText('Sovereign', 'Sovrana')}</p>
                <p className="text-[9px] text-white/40">{tText('Until revocation', 'Fino a revoca')}</p>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center min-w-[110px]">
                <p className="text-[10px] text-brand-gold/80 font-tech uppercase font-bold tracking-wider">{tText('Cookie Profilers', 'Profilatori Cookie')}</p>
                <p className="text-lg font-serif font-bold text-white mt-1">Zero (0)</p>
                <p className="text-[9px] text-white/40">{tText('Fully Blocked', 'Nessun tracciante')}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

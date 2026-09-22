import React, { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { 
  Building2, 
  MapPin, 
  FileText, 
  CreditCard, 
  Copy, 
  Check, 
  ShieldCheck, 
  Globe2, 
  Landmark, 
  HeartHandshake, 
  Scale, 
  Award, 
  BookOpen, 
  Users, 
  ArrowRight, 
  Download, 
  FileCheck, 
  PieChart, 
  Receipt, 
  Search, 
  ArrowDownToLine, 
  Calendar, 
  Filter,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { 
  getFinancialDocuments, 
  downloadFinancialDocument, 
  FinancialDocument, 
  getCategoryLabel 
} from '../../services/transparencyService';

interface AboutPageProps {
  onGoToConstitution?: () => void;
  onGoToCharter?: () => void;
  onGoToDemocracy?: () => void;
}

export default function AboutUsPage({ onGoToConstitution, onGoToCharter, onGoToDemocracy }: AboutPageProps) {
  const { language, tText } = useI18n();
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedCf, setCopiedCf] = useState(false);

  // Financial Transparency & Downloads State
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchDocQuery, setSearchDocQuery] = useState<string>('');

  const loadDocs = () => {
    const all = getFinancialDocuments();
    setDocuments(all.filter(d => d.published));
  };

  useEffect(() => {
    loadDocs();
    const handleUpdate = () => loadDocs();
    window.addEventListener('nws_transparency_updated', handleUpdate);
    return () => window.removeEventListener('nws_transparency_updated', handleUpdate);
  }, []);

  const orgDetails = {
    name: 'New World State Organization',
    address: 'Via San Basilio 12',
    city: 'San Giovanni La Punta (CT)',
    country: 'Italy',
    fullAddress: 'Via San Basilio 12, 95037 San Giovanni La Punta (CT) - Italy',
    fiscalCode: '90076060871',
    iban: 'IT70F0326816900052535344000',
    accountHolder: 'New World State Organization',
    legalForm: 'Ente del Terzo Settore / Organizzazione Internazionale Non-Profit',
    foundedYear: '2014 (MMXIV)'
  };

  const handleCopyIban = () => {
    navigator.clipboard.writeText(orgDetails.iban);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2500);
  };

  const handleCopyCf = () => {
    navigator.clipboard.writeText(orgDetails.fiscalCode);
    setCopiedCf(true);
    setTimeout(() => setCopiedCf(false), 2500);
  };

  // Multilingual translations map for About Page sections
  const content = {
    it: {
      badge: 'PROFILO ISTITUZIONALE & TRASPARENZA',
      heroTitle: 'Chi Siamo',
      heroSubtitle: 'L\'Organizzazione New World State è un ente internazionale dedicato alla promozione dei diritti umani universali, della pace, della democrazia diretta digitale e del progresso etico globale.',
      legalRegistryTitle: 'Dati Legali & Coordinate Istituzionali',
      legalRegistrySubtitle: 'Registro ufficiale, sede legale e riferimenti bancari dell\'organizzazione',
      orgNameLabel: 'Denominazione Ente',
      addressLabel: 'Sede Legale & Operativa',
      cfLabel: 'Codice Fiscale',
      bankLabel: 'Conto Corrente Bancario',
      ibanLabel: 'Codice IBAN',
      accountHolderLabel: 'Intestatario del Conto',
      copySuccess: 'Copiato!',
      copyAction: 'Copia',
      missionTitle: 'La Nostra Missione Fondativa',
      missionDesc: 'Nata nel 2014, l\'Organizzazione New World State persegue la costruzione di un modello di convivenza civile basato sulla sovranità individuale, la neutralità tecnologica e la partecipazione democratica diretta e disintermediata di tutti i cittadini del mondo.',
      pillarsTitle: 'I Pilastri dell\'Organizzazione',
      pillar1Title: 'Democrazia Diretta & Trasparenza',
      pillar1Desc: 'Sviluppiamo protocolli di voto digitale sovrano e consultazione popolare diretta a prova di manomissione.',
      pillar2Title: 'Diritti Umani & Tutela Civica',
      pillar2Desc: 'Promuoviamo la Carta Universale dei Diritti e difendiamo la libertà di espressione, di stampa e di sviluppo umano.',
      pillar3Title: 'Solidarietà & Sostenibilità',
      pillar3Desc: 'Supportiamo missioni di pace, corpi civili di peacekeeper e progetti educativi per la cittadinanza globale.',
      transparencyNoteTitle: 'Impegno per la Trasparenza Finanziaria',
      transparencyNoteText: 'Tutte le donazioni e i contributi devoluti all\'IBAN ufficiale dell\'organizzazione sono impiegati esclusivamente per il mantenimento dell\'infrastruttura informatica democratica, l\'assistenza civica e le missioni istituzionali non-profit stabilite dallo Statuto.',
      exploreConstBtn: 'Leggi la Costituzione',
      exploreCharterBtn: 'Carta dei Diritti',
      exploreDemocracyBtn: 'Accedi alla Democrazia Diretta',
      // Download & Transparency Section
      transparencySectionBadge: 'PORTALE DOWNLOAD & AUDIT CIVICO',
      transparencySectionTitle: 'Trasparenza Finanziaria & Download Estratti Conto',
      transparencySectionSubtitle: 'Per garantire la massima integrità e fiducia a tutti gli iscritti, l\'Organizzazione New World State rende liberamente scaricabili e consultabili gli estratti conto periodici del conto corrente ufficiale, i bilanci e le relazioni analitiche di spesa su come vengono impiegati i fondi.',
      filterAll: 'Tutti i Documenti',
      filterBank: 'Estratti Conto Bancari',
      filterExpenses: 'Rendiconti Spese',
      filterBalance: 'Bilanci d\'Esercizio',
      filterReceipts: 'Giustificativi & Ricevute',
      downloadPdfBtn: 'Scarica PDF Ufficiale',
      howFundsUsed: 'Come vengono impiegati i fondi:',
      searchPlaceholder: 'Cerca per titolo, periodo o parola chiave...',
      emptyDocuments: 'Nessun documento finanziario disponibile per la categoria selezionata.',
      officialIbanBadge: 'Conto Ufficiale IBAN: IT70F0326816900052535344000'
    },
    en: {
      badge: 'INSTITUTIONAL PROFILE & TRANSPARENCY',
      heroTitle: 'About Us',
      heroSubtitle: 'The New World State Organization is an international institution dedicated to promoting universal human rights, global peace, digital direct democracy, and ethical progress.',
      legalRegistryTitle: 'Legal Registry & Institutional Coordinates',
      legalRegistrySubtitle: 'Official registry, registered office, and banking coordinates of the organization',
      orgNameLabel: 'Organization Name',
      addressLabel: 'Registered & Operational Office',
      cfLabel: 'Tax / Fiscal Code',
      bankLabel: 'Institutional Bank Account',
      ibanLabel: 'IBAN Code',
      accountHolderLabel: 'Account Holder',
      copySuccess: 'Copied!',
      copyAction: 'Copy',
      missionTitle: 'Our Founding Mission',
      missionDesc: 'Founded in 2014, the New World State Organization strives to build a civic model rooted in individual sovereignty, technological neutrality, and direct, disintermediated democratic participation for all world citizens.',
      pillarsTitle: 'Organizational Pillars',
      pillar1Title: 'Direct Democracy & Transparency',
      pillar1Desc: 'We engineer sovereign digital voting protocols and tamper-evident citizen consultation tools.',
      pillar2Title: 'Universal Human Rights',
      pillar2Desc: 'We uphold the Universal Charter of Rights, safeguarding freedom of speech, press, and integral human development.',
      pillar3Title: 'Solidarity & Peacebuilding',
      pillar3Desc: 'We deploy civilian peacekeeping corps, humanitarian initiatives, and educational pathways for global citizenship.',
      transparencyNoteTitle: 'Financial Transparency Pledge',
      transparencyNoteText: 'All donations and contributions transferred to the official organizational IBAN are strictly allocated to democratic infrastructure upkeep, civic assistance, and statutory non-profit institutional missions.',
      exploreConstBtn: 'Read Constitution',
      exploreCharterBtn: 'Charter of Rights',
      exploreDemocracyBtn: 'Open Democracy Portal',
      // Download & Transparency Section
      transparencySectionBadge: 'DOWNLOAD PORTAL & CIVIC AUDIT',
      transparencySectionTitle: 'Financial Transparency & Bank Statements Download',
      transparencySectionSubtitle: 'To ensure absolute integrity and public trust, the New World State Organization publishes official bank account statements, certified balance sheets, and itemized expense reports detailing exactly how funds and contributions are spent.',
      filterAll: 'All Documents',
      filterBank: 'Bank Statements',
      filterExpenses: 'Expense Reports',
      filterBalance: 'Balance Sheets',
      filterReceipts: 'Receipts & Proofs',
      downloadPdfBtn: 'Download Official PDF',
      howFundsUsed: 'Fund allocation breakdown:',
      searchPlaceholder: 'Search by title, period, or keyword...',
      emptyDocuments: 'No financial documents found for the selected filter.',
      officialIbanBadge: 'Official Account IBAN: IT70F0326816900052535344000'
    },
    fr: {
      badge: 'PROFIL INSTITUTIONNEL & TRANSPARENCE',
      heroTitle: 'Qui Sommes-Nous',
      heroSubtitle: 'L\'Organisation New World State est une institution internationale œuvrant pour les droits humains universels, la paix, la démocratie directe numérique et le progrès éthique mondial.',
      legalRegistryTitle: 'Registre Légal & Coordonnées Institutionnelles',
      legalRegistrySubtitle: 'Registre officiel, siège social et coordonnées bancaires de l\'organisation',
      orgNameLabel: 'Dénomination de l\'Organisation',
      addressLabel: 'Siège Social & Opérationnel',
      cfLabel: 'Code Fiscal',
      bankLabel: 'Compte Bancaire Institutionnel',
      ibanLabel: 'Code IBAN',
      accountHolderLabel: 'Titulaire du Compte',
      copySuccess: 'Copié !',
      copyAction: 'Copier',
      missionTitle: 'Notre Mission Fondatrice',
      missionDesc: 'Fondée en 2014, l\'Organisation New World State bâtit un modèle civique fondé sur la souveraineté individuelle, la neutralité technologique et la participation démocratique directe de tous les citoyens du monde.',
      pillarsTitle: 'Les Piliers de l\'Organisation',
      pillar1Title: 'Démocratie Directe & Transparence',
      pillar1Desc: 'Développement de protocoles de vote numérique souverain et de consultations populaires infalsifiables.',
      pillar2Title: 'Droits Humains Universels',
      pillar2Desc: 'Défense de la Charte des Droits, de la liberté d\'expression, de la presse et du développement humain intégral.',
      pillar3Title: 'Solidarité & Consolidation de la Paix',
      pillar3Desc: 'Soutien aux missions de paix, aux casques bleus civils et aux projets éducatifs de citoyenneté globale.',
      transparencyNoteTitle: 'Engagement de Transparence Financière',
      transparencyNoteText: 'Tous les dons et cotisations versés sur l\'IBAN officiel sont alloués exclusivement à la maintenance de l\'infrastructure démocratique et aux missions d\'intérêt général.',
      exploreConstBtn: 'Lire la Constitution',
      exploreCharterBtn: 'Charte des Droits',
      exploreDemocracyBtn: 'Accéder à la Démocratie Directe',
      // Download & Transparency Section
      transparencySectionBadge: 'TÉLÉCHARGEMENTS & AUDIT CIVIQUE',
      transparencySectionTitle: 'Transparence Financière & Téléchargement des Relevés',
      transparencySectionSubtitle: 'Pour assurer une transparence absolue, l\'Organisation publie les relevés bancaires officiels, les bilans et les rapports détaillés sur l\'utilisation des fonds.',
      filterAll: 'Tous les Documents',
      filterBank: 'Relevés Bancaires',
      filterExpenses: 'Rapports de Dépenses',
      filterBalance: 'Bilans Financiers',
      filterReceipts: 'Justificatifs & Factures',
      downloadPdfBtn: 'Télécharger le PDF',
      howFundsUsed: 'Affectation des dépenses :',
      searchPlaceholder: 'Rechercher par titre ou période...',
      emptyDocuments: 'Aucun document disponible dans cette catégorie.',
      officialIbanBadge: 'Compte Officiel IBAN: IT70F0326816900052535344000'
    },
    es: {
      badge: 'PERFIL INSTITUCIONAL Y TRANSPARENCIA',
      heroTitle: 'Quiénes Somos',
      heroSubtitle: 'La Organización New World State es una entidad internacional dedicada a promover los derechos humanos universales, la paz, la democracia directa digital y el progreso ético global.',
      legalRegistryTitle: 'Registro Legal y Coordenadas Institucionales',
      legalRegistrySubtitle: 'Registro oficial, sede legal y datos bancarios de la organización',
      orgNameLabel: 'Denominación de la Entidad',
      addressLabel: 'Sede Legal y Operativa',
      cfLabel: 'Código Fiscal',
      bankLabel: 'Cuenta Corriente Bancaria',
      ibanLabel: 'Código IBAN',
      accountHolderLabel: 'Titular de la Cuenta',
      copySuccess: '¡Copiado!',
      copyAction: 'Copiar',
      missionTitle: 'Nuestra Misión Fundacional',
      missionDesc: 'Fundada en 2014, la Organización New World State persigue la construcción de un modelo cívico basado en la soberanía individual, la neutralidad tecnológica y la participación democrática directa de todos los ciudadanos del mundo.',
      pillarsTitle: 'Pilares de la Organización',
      pillar1Title: 'Democracia Directa y Transparencia',
      pillar1Desc: 'Desarrollo de protocolos de voto digital soberano y consultas populares directas e inalterables.',
      pillar2Title: 'Derechos Humanos y Protección Cívica',
      pillar2Desc: 'Promovemos la Carta de Derechos y protegemos la libertad de expresión, prensa y dignidad humana.',
      pillar3Title: 'Solidaridad y Misiones de Paz',
      pillar3Desc: 'Apoyo a cuerpos civiles de pacificadores, iniciativas humanitarias y educación para la ciudadanía mundial.',
      transparencyNoteTitle: 'Compromiso de Transparencia Financiera',
      transparencyNoteText: 'Todas las donaciones e ingresos transferidos al IBAN oficial son destinados estrictamente a la infraestructura democrática y misiones estatutarias sin ánimo de lucro.',
      exploreConstBtn: 'Leer la Constitución',
      exploreCharterBtn: 'Carta de Derechos',
      exploreDemocracyBtn: 'Portal de Democracia',
      // Download & Transparency Section
      transparencySectionBadge: 'DESCARGAS Y AUDITORÍA CÍVICA',
      transparencySectionTitle: 'Transparencia Financiera y Descarga de Extractos',
      transparencySectionSubtitle: 'Para garantizar la máxima confianza, la Organización pone a disposición pública los extractos bancarios periódicos, balances e informes detallados del uso de los fondos.',
      filterAll: 'Todos los Documentos',
      filterBank: 'Extractos Bancarios',
      filterExpenses: 'Informes de Gastos',
      filterBalance: 'Balances de Ejercicio',
      filterReceipts: 'Comprobantes y Facturas',
      downloadPdfBtn: 'Descargar PDF Oficial',
      howFundsUsed: 'Desglose del uso de fondos:',
      searchPlaceholder: 'Buscar por título o período...',
      emptyDocuments: 'No hay documentos financieros disponibles para esta categoría.',
      officialIbanBadge: 'Cuenta Oficial IBAN: IT70F0326816900052535344000'
    },
    pt: {
      badge: 'PERFIL INSTITUCIONAL E TRANSPARÊNCIA',
      heroTitle: 'Quem Somos',
      heroSubtitle: 'A Organização New World State é uma instituição internacional dedicada a promover os direitos humanos universais, a paz, a democracia direta digital e o progresso ético global.',
      legalRegistryTitle: 'Registro Legal e Coordenadas Institucionais',
      legalRegistrySubtitle: 'Registro oficial, sede legal e dados bancários da organização',
      orgNameLabel: 'Denominação da Entidade',
      addressLabel: 'Sede Legal e Operacional',
      cfLabel: 'Código Fiscal',
      bankLabel: 'Conta Corrente Bancária',
      ibanLabel: 'Código IBAN',
      accountHolderLabel: 'Titular da Conta',
      copySuccess: 'Copiado!',
      copyAction: 'Copiar',
      missionTitle: 'Nossa Missão Fundacional',
      missionDesc: 'Fundada em 2014, a New World State constrói um modelo cívico fundamentado na soberania individual, na neutralidade tecnológica e na participação democrática direta de todos os cidadãos mundiais.',
      pillarsTitle: 'Pilares da Organização',
      pillar1Title: 'Democracia Direta e Transparência',
      pillar1Desc: 'Engenharia de votação digital soberana e ferramentas imutáveis de deliberação cidadã.',
      pillar2Title: 'Direitos Humanos Universais',
      pillar2Desc: 'Defesa da Carta de Direitos, da liberdade de imprensa e do pleno florescimento humano.',
      pillar3Title: 'Solidariedade e Paz Global',
      pillar3Desc: 'Corpos civis de manutenção da paz e iniciativas de cidadania global.',
      transparencyNoteTitle: 'Compromisso de Transparência Financeira',
      transparencyNoteText: 'Todos os recursos doados para o IBAN oficial são direcionados integralmente à infraestrutura e projetos cívicos sem fins lucrativos.',
      exploreConstBtn: 'Ler a Constituição',
      exploreCharterBtn: 'Carta de Direitos',
      exploreDemocracyBtn: 'Portal de Democracia',
      // Download & Transparency Section
      transparencySectionBadge: 'PORTAL DE DOWNLOADS & AUDITORIA',
      transparencySectionTitle: 'Transparência Financeira e Extratos Bancários',
      transparencySectionSubtitle: 'Publicação aberta de extratos bancários, balanços patrimoniais e prestação de contas analítica sobre o emprego de cada recurso.',
      filterAll: 'Todos os Documentos',
      filterBank: 'Extratos Bancários',
      filterExpenses: 'Relatórios de Gastos',
      filterBalance: 'Balanços',
      filterReceipts: 'Comprovantes e Recibos',
      downloadPdfBtn: 'Baixar PDF Oficial',
      howFundsUsed: 'Detalhamento do uso dos fundos:',
      searchPlaceholder: 'Buscar documentos...',
      emptyDocuments: 'Nenhum documento encontrado.',
      officialIbanBadge: 'Conta Oficial IBAN: IT70F0326816900052535344000'
    },
    ru: {
      badge: 'ИНСТИТУЦИОНАЛЬНЫЙ ПРОФИЛЬ И ПРОЗРАЧНОСТЬ',
      heroTitle: 'О нас',
      heroSubtitle: 'Организация New World State — международная институция, содействующая всеобщим правам человека, глобальному миру и прямой цифровой демократии.',
      legalRegistryTitle: 'Юридический реестр и банковские реквизиты',
      legalRegistrySubtitle: 'Официальные регистрационные данные и расчетный счет организации',
      orgNameLabel: 'Наименование организации',
      addressLabel: 'Юридический и операционный адрес',
      cfLabel: 'Налоговый код (Fiscal Code)',
      bankLabel: 'Банковский расчетный счет',
      ibanLabel: 'Код IBAN',
      accountHolderLabel: 'Владелец счета',
      copySuccess: 'Скопировано!',
      copyAction: 'Копировать',
      missionTitle: 'Наша основополагающая миссия',
      missionDesc: 'Основанная в 2014 году, Организация строит гражданскую модель, основанную на индивидуальном суверенитете и непосредственном участии граждан.',
      pillarsTitle: 'Опоры организации',
      pillar1Title: 'Прямая демократия и прозрачность',
      pillar1Desc: 'Протоколы суверенного электронного голосования.',
      pillar2Title: 'Всеобщие права человека',
      pillar2Desc: 'Защита Хартии прав и свободы слова.',
      pillar3Title: 'Солидарность и миротворчество',
      pillar3Desc: 'Гражданские миротворческие миссии и гуманитарные инициативы.',
      transparencyNoteTitle: 'Обязательство финансовой прозрачности',
      transparencyNoteText: 'Все взносы и пожертвования направляются исключительно на поддержание инфраструктуры и уставные некоммерческие цели.',
      exploreConstBtn: 'Читать Конституцию',
      exploreCharterBtn: 'Хартия прав',
      exploreDemocracyBtn: 'Портал демократии',
      transparencySectionBadge: 'ПОРТАЛ ЗАГРУЗОК И АУДИТ',
      transparencySectionTitle: 'Финансовая прозрачность и банковские выписки',
      transparencySectionSubtitle: 'Свободный доступ к банковским выпискам, годовым балансам и детальным отчетам о расходах.',
      filterAll: 'Все документы',
      filterBank: 'Банковские выписки',
      filterExpenses: 'Отчеты о расходах',
      filterBalance: 'Годовые балансы',
      filterReceipts: 'Чеки и квитанции',
      downloadPdfBtn: 'Скачать официальный PDF',
      howFundsUsed: 'Детализация расходов:',
      searchPlaceholder: 'Поиск документов...',
      emptyDocuments: 'Документы не найдены.',
      officialIbanBadge: 'Официальный IBAN: IT70F0326816900052535344000'
    },
    hi: {
      badge: 'संस्थागत प्रोफ़ाइल और पारदर्शिता',
      heroTitle: 'हमारे बारे में',
      heroSubtitle: 'न्यू वर्ल्ड स्टेट ऑर्गनाइज़ेशन सार्वभौमिक मानवाधिकारों, शांति और प्रत्यक्ष डिजिटल लोकतंत्र को बढ़ावा देने वाला एक अंतर्राष्ट्रीय संस्थान है।',
      legalRegistryTitle: 'कानूनी रजिस्ट्री और संस्थागत विवरण',
      legalRegistrySubtitle: 'आधिकारिक पंजीकरण, पंजीकृत कार्यालय और बैंक विवरण',
      orgNameLabel: 'संगठन का नाम',
      addressLabel: 'पंजीकृत कार्यालय',
      cfLabel: 'टैक्स कोड',
      bankLabel: 'बैंक खाता',
      ibanLabel: 'IBAN कोड',
      accountHolderLabel: 'खाता धारक',
      copySuccess: 'कॉपी किया गया!',
      copyAction: 'कॉपी करें',
      missionTitle: 'हमारा संस्थापक मिशन',
      missionDesc: '2014 में स्थापित, संगठन व्यक्तिगत संप्रभुता और प्रत्यक्ष लोकतांत्रिक भागीदारी पर आधारित नागरिक मॉडल का निर्माण करता है।',
      pillarsTitle: 'संगठन के स्तंभ',
      pillar1Title: 'प्रत्यक्ष लोकतंत्र और पारदर्शिता',
      pillar1Desc: 'संप्रभु डिजिटल वोटिंग प्रोटोकॉल।',
      pillar2Title: 'मानवाधिकार और नागरिक सुरक्षा',
      pillar2Desc: 'अधिकारों के चार्टर और अभिव्यक्ति की स्वतंत्रता की रक्षा।',
      pillar3Title: 'एकजुटता और शांति स्थापना',
      pillar3Desc: 'नागरिक शांति रक्षक और मानवीय पहल।',
      transparencyNoteTitle: 'वित्तीय पारदर्शिता का संकल्प',
      transparencyNoteText: 'सभी दान केवल लोकतांत्रिक बुनियादी ढांचे और गैर-लाभकारी मिशनों के लिए उपयोग किए जाते हैं।',
      exploreConstBtn: 'संविधान पढ़ें',
      exploreCharterBtn: 'अधिकार चार्टर',
      exploreDemocracyBtn: 'लोकतंत्र पोर्टल',
      transparencySectionBadge: 'डाउनलोड पोर्टल और वित्तीय ऑडिट',
      transparencySectionTitle: 'वित्तीय पारदर्शिता और बैंक विवरण डाउनलोड',
      transparencySectionSubtitle: 'पूर्ण पारदर्शिता के लिए बैंक विवरण, व्यय रिपोर्ट और वित्तीय बैलेंस शीट डाउनलोड करें।',
      filterAll: 'सभी दस्तावेज़',
      filterBank: 'बैंक विवरण',
      filterExpenses: 'व्यय रिपोर्ट',
      filterBalance: 'बैलेंस शीट',
      filterReceipts: 'रसीदें और प्रमाण',
      downloadPdfBtn: 'आधिकारिक PDF डाउनलोड करें',
      howFundsUsed: 'धन का उपयोग:',
      searchPlaceholder: 'दस्तावेज़ खोजें...',
      emptyDocuments: 'कोई दस्तावेज़ उपलब्ध नहीं है।',
      officialIbanBadge: 'आधिकारिक IBAN: IT70F0326816900052535344000'
    },
    bn: {
      badge: 'প্রাতিষ্ঠানিক প্রোফাইল এবং স্বচ্ছতা',
      heroTitle: 'আমাদের সম্পর্কে',
      heroSubtitle: 'নিউ ওয়ার্ল্ড স্টেট অর্গানাইজেশন সার্বজনীন মানবাধিকার, শান্তি এবং প্রত্যক্ষ ডিজিটাল গণতন্ত্রের প্রসারে নিবেদিত একটি আন্তর্জাতিক প্রতিষ্ঠান।',
      legalRegistryTitle: 'আইনি নিবন্ধন ও ব্যাংকিং বিবরণ',
      legalRegistrySubtitle: 'অফিসিয়াল নিবন্ধন এবং প্রাতিষ্ঠানিক ব্যাংক অ্যাকাউন্ট বিবরণ',
      orgNameLabel: 'সংস্থার নাম',
      addressLabel: 'নিবন্ধিত কার্যালয়',
      cfLabel: 'ট্যাক্স কোড',
      bankLabel: 'ব্যাংক অ্যাকাউন্ট',
      ibanLabel: 'IBAN কোড',
      accountHolderLabel: 'হিসাব ধারক',
      copySuccess: 'কপি হয়েছে!',
      copyAction: 'কপি করুন',
      missionTitle: 'আমাদের প্রতিষ্ঠাতা লক্ষ্য',
      missionDesc: '২০১৪ সালে প্রতিষ্ঠিত, সংস্থাটি নাগরিকদের প্রত্যক্ষ অংশগ্রহণের উপর ভিত্তি করে একটি নাগরিক সমাজ গঠন করতে কাজ করে।',
      pillarsTitle: 'সংস্থার মূল স্তম্ভসমূহ',
      pillar1Title: 'প্রত্যক্ষ গণতন্ত্র ও স্বচ্ছতা',
      pillar1Desc: 'সুরক্ষিত ডিজিটাল ভোটিং ব্যবস্থা।',
      pillar2Title: 'সার্বজনীন মানবাধিকার',
      pillar2Desc: 'মানবাধিকার সনদ এবং মত প্রকাশের স্বাধীনতা রক্ষা।',
      pillar3Title: 'সংহতি ও শান্তি বিনির্মাণ',
      pillar3Desc: 'শান্তিরক্ষা ও মানবিক কার্যক্রম।',
      transparencyNoteTitle: 'আর্থিক স্বচ্ছতার অঙ্গীকার',
      transparencyNoteText: 'সকল অনুদান কেবল প্ল্যাটফর্ম রক্ষণাবেক্ষণ ও অলাভজনক নাগরিক সেবায় ব্যয় হয়।',
      exploreConstBtn: 'সংবিধান পড়ুন',
      exploreCharterBtn: 'অধিকার সনদ',
      exploreDemocracyBtn: 'গণতন্ত্র পোর্টাল',
      transparencySectionBadge: 'ডাউনলোড পোর্টাল ও অডিট',
      transparencySectionTitle: 'আর্থিক স্বচ্ছতা ও ব্যাংক স্টেটমেন্ট ডাউনলোড',
      transparencySectionSubtitle: 'নাগরিকদের জন্য ব্যাংক স্টেটমেন্ট, অডিট ও ব্যয়ের বিস্তারিত প্রতিবেদন উন্মুক্ত।',
      filterAll: 'সকল নথি',
      filterBank: 'ব্যাংক স্টেটমেন্ট',
      filterExpenses: 'ব্যয় বিবরণী',
      filterBalance: 'আর্থিক ব্যালেন্স শিট',
      filterReceipts: 'রসিদ ও প্রমাণপত্র',
      downloadPdfBtn: 'অফিসিয়াল PDF ডাউনলোড',
      howFundsUsed: 'তহবিল ব্যবহারের বিবরণ:',
      searchPlaceholder: 'নথি খুঁজুন...',
      emptyDocuments: 'কোনো নথি পাওয়া যায়নি।',
      officialIbanBadge: 'অফিসিয়াল IBAN: IT70F0326816900052535344000'
    },
    zh: {
      badge: '机构概况与财务透明度',
      heroTitle: '关于我们',
      heroSubtitle: '新世界国家组织（New World State Organization）是一家国际机构，致力于促进普遍人权、全球和平与数字直接民主。',
      legalRegistryTitle: '法定登记与银行机构信息',
      legalRegistrySubtitle: '官方注册资料、法定办事处及银行结算账户',
      orgNameLabel: '机构法定名称',
      addressLabel: '法定与运营地址',
      cfLabel: '税号 (Fiscal Code)',
      bankLabel: '官方银行结算账户',
      ibanLabel: 'IBAN 代码',
      accountHolderLabel: '账户所有人',
      copySuccess: '已复制！',
      copyAction: '复制',
      missionTitle: '我们的创始使命',
      missionDesc: '组织成立于2014年，致力于在个人主权与技术中立的基础上建立直接民主与全球公民社会。',
      pillarsTitle: '组织三大支柱',
      pillar1Title: '直接民主与公开透明',
      pillar1Desc: '开发不可篡改的主权数字投票协议。',
      pillar2Title: '普遍人权与公民保护',
      pillar2Desc: '捍卫人权宪章、言论自由与人类尊严。',
      pillar3Title: '团结与和平建设',
      pillar3Desc: '支持民事维和使团与全球公民教育。',
      transparencyNoteTitle: '财务透明承诺',
      transparencyNoteText: '所有汇入官方IBAN的捐款仅用于民主基础设施维护和法定的非营利公益任务。',
      exploreConstBtn: '阅读宪法',
      exploreCharterBtn: '权利宪章',
      exploreDemocracyBtn: '进入直接民主门户',
      transparencySectionBadge: '下载中心与公民审计',
      transparencySectionTitle: '财务透明与官方银行对账单下载',
      transparencySectionSubtitle: '向所有注册公民开放下载定期银行对账单、年度决算及资金使用明细报告。',
      filterAll: '全部文件',
      filterBank: '银行对账单',
      filterExpenses: '支出决算明细',
      filterBalance: '年度资产负债表',
      filterReceipts: '支出凭证与发票',
      downloadPdfBtn: '下载官方 PDF',
      howFundsUsed: '资金使用详细说明：',
      searchPlaceholder: '搜索文件、周期或关键词...',
      emptyDocuments: '所选类别暂无公开文件。',
      officialIbanBadge: '官方银行账户 IBAN: IT70F0326816900052535344000'
    },
    ja: {
      badge: '組織概要と透明性',
      heroTitle: '私たちについて',
      heroSubtitle: 'ニューワールドステート組織は、普遍的人権、世界平和、デジタル直接民主主義を推進する国際非営利機関です。',
      legalRegistryTitle: '法定登録および銀行情報',
      legalRegistrySubtitle: '公式登録情報、所在地、および公式銀行口座情報',
      orgNameLabel: '組織名称',
      addressLabel: '所在地（本部）',
      cfLabel: '納税者番号 (Fiscal Code)',
      bankLabel: '公式銀行口座',
      ibanLabel: 'IBAN コード',
      accountHolderLabel: '口座名義人',
      copySuccess: 'コピー完了！',
      copyAction: 'コピー',
      missionTitle: '私たちの設立理念',
      missionDesc: '2014年に設立され、個人の主権と直接民主的な市民参加に基づく持続可能な社会モデルを追求しています。',
      pillarsTitle: '組織の3つの柱',
      pillar1Title: '直接民主主義と透明性',
      pillar1Desc: '改ざん不可能な主権的電子投票プロトコルの構築。',
      pillar2Title: '普遍的人権の保護',
      pillar2Desc: '権利憲章の推進と表現の自由の擁護。',
      pillar3Title: '連帯と平和構築',
      pillar3Desc: '平和維持活動と人道支援プロジェクトの推進。',
      transparencyNoteTitle: '財務透明性の誓約',
      transparencyNoteText: '公式口座へのすべての寄付は、民主的インフラの維持と非営利の公益活動に厳格に充当されます。',
      exploreConstBtn: '憲法を読む',
      exploreCharterBtn: '権利憲章',
      exploreDemocracyBtn: '直接民主主義ポータル',
      transparencySectionBadge: 'ダウンロード・監査ポータル',
      transparencySectionTitle: '財務透明性と銀行取引明細書のダウンロード',
      transparencySectionSubtitle: '全会員に対し、定期的な公式銀行明細書、決算書、使途明細レポートをPDF形式で公開しています。',
      filterAll: 'すべての文書',
      filterBank: '銀行取引明細書',
      filterExpenses: '支出報告書',
      filterBalance: '決算書',
      filterReceipts: '領収書・証拠書類',
      downloadPdfBtn: '公式PDFをダウンロード',
      howFundsUsed: '資金の具体的な使途：',
      searchPlaceholder: '文書を検索...',
      emptyDocuments: '該当する文書が見つかりませんでした。',
      officialIbanBadge: '公式IBAN口座: IT70F0326816900052535344000'
    },
    ar: {
      badge: 'الملف المؤسسي والشفافية',
      heroTitle: 'من نحن',
      heroSubtitle: 'منظمة دولة العالم الجديد (New World State Organization) هي هيئة دولية غير ربحية مكرسة لتعزيز حقوق الإنسان العالمية والسلام والديمقراطية الرقمية المباشرة.',
      legalRegistryTitle: 'السجل القانوني والبيانات المصرفية للمنظمة',
      legalRegistrySubtitle: 'بيانات التسجيل الرسمي والمقر القانوني والحساب البنكي المعتمد',
      orgNameLabel: 'اسم المنظمة الرسمي',
      addressLabel: 'المقر القانوني والتشغيلي',
      cfLabel: 'الرقم الضريبي (Fiscal Code)',
      bankLabel: 'الحساب الجاري المصرفي',
      ibanLabel: 'رمز الآيبان (IBAN)',
      accountHolderLabel: 'اسم صاحب الحساب',
      copySuccess: 'تم النسخ!',
      copyAction: 'نسخ',
      missionTitle: 'مهمتنا التأسيسية',
      missionDesc: 'تأسست المنظمة عام 2014، وتسعى إلى بناء نموذج مدني قائم على السيادة الفردية والحياد التقني والمشاركة الديمقراطية المباشرة لجميع مواطني العالم.',
      pillarsTitle: 'ركائز المنظمة الأساسية',
      pillar1Title: 'الديمقراطية المباشرة والشفافية',
      pillar1Desc: 'تطوير بروتوكولات تصويت رقمية سيادية غير قابلة للتلاعب.',
      pillar2Title: 'حقوق الإنسان العالمية',
      pillar2Desc: 'الدفاع عن ميثاق الحقوق وحرية التعبير والإعلام والكرامة الإنسانية.',
      pillar3Title: 'التضامن وصنع السلام',
      pillar3Desc: 'دعم فرق حفظ السلام المدنية والبرامج الإنسانية والتعليمية.',
      transparencyNoteTitle: 'الالتزام بالشفافية المالية',
      transparencyNoteText: 'تُخصص جميع التبرعات المودعة في الحساب المصرفي الرسمي حصرياً لصيانة المنصة الديمقراطية والأنشطة غير الربحية المنصوص عليها في النظام الأساسي.',
      exploreConstBtn: 'قراءة الدستور',
      exploreCharterBtn: 'ميثاق الحقوق',
      exploreDemocracyBtn: 'بوابة الديمقراطية',
      transparencySectionBadge: 'مركز التنزيل والتدقيق المدني',
      transparencySectionTitle: 'الشفافية المالية وتنزيل كشوف الحسابات البنكية',
      transparencySectionSubtitle: 'لضمان الثقة والنزاهة، تتيح المنظمة لجميع الأعضاء تنزيل كشوف الحسابات البنكية الدورية والميزانيات وتقارير المصروفات التفصيلية.',
      filterAll: 'جميع الوثائق',
      filterBank: 'كشوف الحسابات البنكية',
      filterExpenses: 'تقارير المصروفات',
      filterBalance: 'الميزانيات العمومية',
      filterReceipts: 'الفواتير والإيصالات',
      downloadPdfBtn: 'تنزيل ملف PDF الرسمي',
      howFundsUsed: 'بيان كيفية إنفاق الأموال:',
      searchPlaceholder: 'البحث عن الوثائق...',
      emptyDocuments: 'لا توجد وثائق متاحة في هذه الفئة.',
      officialIbanBadge: 'الحساب الرسمي IBAN: IT70F0326816900052535344000'
    }
  };

  const curr = content[language as keyof typeof content] || content.en;

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesQuery = !searchDocQuery.trim() || 
      doc.title.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      doc.period.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      doc.notes.toLowerCase().includes(searchDocQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const getDocIcon = (category: FinancialDocument['category']) => {
    switch (category) {
      case 'bank_statement':
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case 'expense_report':
        return <PieChart className="w-5 h-5 text-amber-600" />;
      case 'balance_sheet':
        return <FileCheck className="w-5 h-5 text-blue-600" />;
      case 'receipt_invoice':
        return <Receipt className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-16" id="about-us-page">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0a1c3e] via-[#0f2756] to-[#0a1c3e] border border-brand-gold/30 p-8 md:p-14 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-xs font-mono font-bold tracking-widest uppercase">
            <ShieldCheck className="w-4 h-4 text-brand-gold" />
            <span>{curr.badge}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
            {curr.heroTitle}
          </h1>

          <p className="text-base md:text-lg text-slate-200 leading-relaxed font-sans">
            {curr.heroSubtitle}
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-mono text-brand-gold/90 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl backdrop-blur-xs">
              <Landmark className="w-4 h-4 text-brand-gold" />
              <span>Est. {orgDetails.foundedYear}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-brand-gold/90 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl backdrop-blur-xs">
              <Globe2 className="w-4 h-4 text-brand-gold" />
              <span>Non-Profit Sovereign Entity</span>
            </div>
          </div>
        </div>
      </div>

      {/* OFFICIAL LEGAL REGISTRY & BANKING COORDINATES (CRITICAL SECTION) */}
      <section 
        id="legal-registry-section"
        className="bg-white rounded-3xl border-2 border-brand-gold/40 shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-[#0a1c3e] to-[#122d64] p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brand-gold/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-gold text-xs font-mono uppercase tracking-wider font-bold">
              <Building2 className="w-4 h-4 text-brand-gold" />
              <span>{curr.legalRegistryTitle}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-white">
              {orgDetails.name}
            </h2>
            <p className="text-xs text-slate-300">
              {curr.legalRegistrySubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-mono text-brand-gold">
            <span>{orgDetails.legalForm}</span>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sede Legale */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-2 hover:border-brand-gold/40 transition">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0a1c3e] uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-brand-gold shrink-0" />
                <span>{curr.addressLabel}</span>
              </div>
              <div className="text-sm font-semibold text-slate-900 leading-snug">
                <p className="font-bold text-base text-[#0a1c3e]">{orgDetails.name}</p>
                <p>{orgDetails.address}</p>
                <p>{orgDetails.city} - {orgDetails.country}</p>
              </div>
            </div>

            {/* Codice Fiscale */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-2 hover:border-brand-gold/40 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#0a1c3e] uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-brand-gold shrink-0" />
                  <span>{curr.cfLabel}</span>
                </div>
                <div className="mt-1">
                  <span className="font-mono text-lg font-bold text-[#0a1c3e] tracking-wider selection:bg-brand-gold">
                    {orgDetails.fiscalCode}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCopyCf}
                className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-300 hover:border-brand-gold text-xs font-bold text-[#0a1c3e] transition cursor-pointer shadow-xs"
              >
                {copiedCf ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">{curr.copySuccess}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>{curr.copyAction} {curr.cfLabel}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dati Bancari & IBAN Box */}
          <div className="bg-gradient-to-br from-amber-50/60 via-amber-50/20 to-white rounded-2xl p-6 md:p-8 border-2 border-brand-gold/50 shadow-sm space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-[#0a1c3e] text-brand-gold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#0a1c3e]">
                    {curr.bankLabel}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {curr.accountHolderLabel}: <strong className="text-slate-800">{orgDetails.accountHolder}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* IBAN Display & Copy Area */}
            <div className="bg-white rounded-xl p-4 md:p-5 border border-brand-gold/60 shadow-inner flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  {curr.ibanLabel}
                </span>
                <p className="font-mono text-sm md:text-xl font-bold text-[#0a1c3e] tracking-wider break-all select-all">
                  {orgDetails.iban}
                </p>
              </div>

              <button
                onClick={handleCopyIban}
                id="copy-iban-btn"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer shrink-0 border-b-2 border-brand-gold"
              >
                {copiedIban ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-white font-bold">{curr.copySuccess}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{curr.copyAction} IBAN</span>
                  </>
                )}
              </button>
            </div>

            {/* Note Trasparenza */}
            <div className="bg-white/80 rounded-xl p-4 border border-amber-200/80 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-[#0a1c3e] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>{curr.transparencyNoteTitle}</span>
              </p>
              <p className="leading-relaxed">
                {curr.transparencyNoteText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINANCIAL TRANSPARENCY & STATEMENTS DOWNLOAD SECTION (REQUESTED BY USER) */}
      <section 
        id="financial-transparency-downloads-section"
        className="bg-white rounded-3xl border-2 border-[#0a1c3e]/15 shadow-xl overflow-hidden space-y-8 p-6 md:p-10"
      >
        {/* TOP BALANCED BENTO HEADER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch border-b border-slate-100 pb-8">
          {/* Left Column: Heading, Description, Guarantees */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#0a1c3e] text-brand-gold text-xs font-mono font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-brand-gold" />
                <span>{curr.transparencySectionBadge}</span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#0a1c3e] tracking-tight leading-tight">
                {curr.transparencySectionTitle}
              </h2>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                {curr.transparencySectionSubtitle}
              </p>
            </div>

            {/* 3 Key Trust Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% {tText('Bank Traceability', 'Tracciabilità Bancaria')}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{tText('Public Audit & Balance', 'Bilanci & Audit Pubblici')}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{tText('Open Citizen Access', 'Accesso Libero ai Cittadini')}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Institutional Treasury Audit Card (Fills previously empty space) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0a1c3e] via-[#0f2756] to-[#0a1c3e] rounded-2xl p-5 md:p-6 text-white border border-brand-gold/30 shadow-lg flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-brand-gold" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-gold">
                  {tText('Treasury Audit', 'Controllo Tesoreria')}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-mono text-emerald-300 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {tText('Verified Account', 'Conto Certificato')}
              </span>
            </div>

            {/* Bank details & Copy */}
            <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-xs">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-mono text-[11px] text-brand-gold/90">{orgDetails.name}</span>
                <span className="text-[10px] font-mono text-slate-400">IT • UniCredit</span>
              </div>
              <p className="font-mono text-xs md:text-sm font-bold text-white tracking-wider break-all select-all">
                {orgDetails.iban}
              </p>
              <button
                onClick={handleCopyIban}
                className="w-full mt-1 inline-flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-brand-gold/20 hover:bg-brand-gold text-brand-gold hover:text-[#0a1c3e] text-xs font-bold font-mono transition cursor-pointer border border-brand-gold/40"
              >
                {copiedIban ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{curr.copySuccess}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{curr.copyAction} IBAN</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                <span className="block text-lg font-bold font-mono text-brand-gold">{documents.length}</span>
                <span className="text-[10px] text-slate-300 uppercase tracking-tight">{tText('Documents', 'Documenti')}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                <span className="block text-lg font-bold font-mono text-emerald-400">100%</span>
                <span className="text-[10px] text-slate-300 uppercase tracking-tight">{tText('Public', 'Pubblici')}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                <span className="block text-lg font-bold font-mono text-blue-300">PDF</span>
                <span className="text-[10px] text-slate-300 uppercase tracking-tight">{tText('Format', 'Formato')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* TOOLBAR: Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: curr.filterAll, count: documents.length },
              { id: 'bank_statement', label: curr.filterBank, count: documents.filter(d => d.category === 'bank_statement').length },
              { id: 'expense_report', label: curr.filterExpenses, count: documents.filter(d => d.category === 'expense_report').length },
              { id: 'balance_sheet', label: curr.filterBalance, count: documents.filter(d => d.category === 'balance_sheet').length },
              { id: 'receipt_invoice', label: curr.filterReceipts, count: documents.filter(d => d.category === 'receipt_invoice').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedCategory === tab.id 
                    ? 'bg-[#0a1c3e] text-brand-gold shadow-sm' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === tab.id ? 'bg-brand-gold text-[#0a1c3e]' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72 relative shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchDocQuery}
              onChange={(e) => setSearchDocQuery(e.target.value)}
              placeholder={curr.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-[#0a1c3e] focus:ring-1 focus:ring-[#0a1c3e] bg-slate-50/50 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Documents Cards Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">{curr.emptyDocuments}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDocuments.map(doc => (
              <div 
                key={doc.id}
                className="bg-slate-50/70 hover:bg-white rounded-2xl p-6 border border-slate-200 hover:border-brand-gold/60 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-4">
                  {/* Top Category Badge & Period */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs group-hover:scale-105 transition">
                        {getDocIcon(doc.category)}
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        {getCategoryLabel(doc.category, language === 'it' ? 'it' : 'en')}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {doc.period}
                    </span>
                  </div>

                  {/* Document Title */}
                  <div>
                    <h3 className="text-base md:text-lg font-serif font-bold text-[#0a1c3e] leading-snug">
                      {doc.title}
                    </h3>
                    
                    {doc.totalAmount && (
                      <div className="mt-2 inline-block bg-amber-50/90 border border-brand-gold/40 px-3 py-1 rounded-lg">
                        <span className="font-mono text-xs font-bold text-[#0a1c3e]">
                          {doc.totalAmount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Fund usage description */}
                  {doc.notes && (
                    <div className="text-xs text-slate-600 bg-white p-3.5 rounded-xl border border-slate-100 space-y-1">
                      <p className="font-bold text-[11px] text-slate-800 uppercase font-mono tracking-wider">
                        {curr.howFundsUsed}
                      </p>
                      <p className="leading-relaxed italic">
                        "{doc.notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Card Footer: File details + Download CTA */}
                <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-[11px] font-mono text-slate-400">
                    <span>PDF • {doc.fileSize}</span>
                  </div>

                  <button
                    onClick={() => downloadFinancialDocument(doc)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] text-xs font-bold transition shadow-sm cursor-pointer border-b-2 border-brand-gold active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>{curr.downloadPdfBtn}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FOUNDING MISSION & PHILOSOPHY */}
      <section className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/90 shadow-sm space-y-8">
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest font-bold text-brand-gold bg-[#0a1c3e] px-3 py-1 rounded-md">
            {tText('Vision & Mission', 'Visione & Missione')}
          </span>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#0a1c3e]">
            {curr.missionTitle}
          </h2>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            {curr.missionDesc}
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover:border-brand-gold/50 transition">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center border border-blue-200/60">
              <Scale className="w-5 h-5 text-brand-gold" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#0a1c3e]">
              {curr.pillar1Title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {curr.pillar1Desc}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover:border-brand-gold/50 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center border border-amber-200/60">
              <Award className="w-5 h-5 text-brand-gold" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#0a1c3e]">
              {curr.pillar2Title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {curr.pillar2Desc}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover:border-brand-gold/50 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center border border-emerald-200/60">
              <HeartHandshake className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#0a1c3e]">
              {curr.pillar3Title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {curr.pillar3Desc}
            </p>
          </div>
        </div>

        {/* Action Links */}
        <div className="border-t border-slate-200 pt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            {onGoToConstitution && (
              <button
                onClick={onGoToConstitution}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a1c3e] text-white hover:bg-brand-gold hover:text-[#0a1c3e] text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>{curr.exploreConstBtn}</span>
              </button>
            )}
            {onGoToCharter && (
              <button
                onClick={onGoToCharter}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-brand-gold text-[#0a1c3e] text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-xs"
              >
                <FileText className="w-4 h-4 text-brand-gold" />
                <span>{curr.exploreCharterBtn}</span>
              </button>
            )}
          </div>

          {onGoToDemocracy && (
            <button
              onClick={onGoToDemocracy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gold text-[#0a1c3e] hover:bg-[#0a1c3e] hover:text-brand-gold text-xs font-bold uppercase tracking-wider transition shadow-md cursor-pointer"
            >
              <span>{curr.exploreDemocracyBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

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
  "Welcome, Citizen!": {
    it: "Benvenuto, Cittadino!",
    en: "Welcome, Citizen!",
    fr: "Bienvenue, Citoyen !",
    es: "¡Bienvenido, Ciudadano!",
    pt: "Bem-vindo, Cidadão!",
    ru: "Добро пожаловать, Гражданин!",
    hi: "स्वागत है, नागरिक!",
    bn: "স্বাগতম, নাগরিক!",
    zh: "欢迎，公民！",
    ja: "ようこそ、市民！",
    ar: "مرحباً بك يا مواطن!"
  },
  "Part 1: Individual Identity": {
    it: "Parte 1: Identità Individuale",
    en: "Part 1: Individual Identity",
    fr: "Partie 1: Identité individuelle",
    es: "Parte 1: Identidad individual",
    pt: "Parte 1: Identidade individual",
    ru: "Часть 1: Индивидуальная личность",
    hi: "भाग 1: व्यक्तिगत पहचान",
    bn: "পার্ট ১: ব্যক্তিগত পরিচয়",
    zh: "第一部分：个人身份",
    ja: "パート1: 個人の身元",
    ar: "الجزء 1: الهوية الفردية"
  },
  "Citizenship and Marital Status": {
    it: "Cittadinanza e Stato Civile",
    en: "Citizenship and Marital Status",
    fr: "Citoyenneté et état civil",
    es: "Ciudadanía y estado civil",
    pt: "Cidadania e estado civil",
    ru: "Гражданство и семейное положение",
    hi: "नागरिकता और वैवाहिक स्थिति",
    bn: "নাগরিকত্ব এবং বৈবাহিক অবস্থা",
    zh: "国籍与婚姻状况",
    ja: "市民権と婚姻状況",
    ar: "الجنسية والحالة الاجتماعية"
  },
  "Localization and Residence": {
    it: "Localizzazione e Residenza",
    en: "Localization and Residence",
    fr: "Localisation et résidence",
    es: "Localización y residencia",
    pt: "Localização e residência",
    ru: "Локализация и проживание",
    hi: "स्थानीयकरण और निवास",
    bn: "অবস্থান এবং বাসস্থান",
    zh: "定位与住所",
    ja: "位置情報と住所",
    ar: "الموقع والإقامة"
  },
  "Which option to choose?": {
    it: "Quale modalità scegliere?",
    en: "Which option to choose?",
    fr: "Quelle option choisir ?",
    es: "¿Qué opción elegir?",
    pt: "Qual opção escolher?",
    ru: "Какую опцию wybrać?",
    hi: "कौन सा विकल्प चुनें?",
    bn: "কোন বিকল্পটি বেছে নেবেন?",
    zh: "选择哪个选项？",
    ja: "どちらのオプションを選択しますか？",
    ar: "أي خيار تختار؟"
  },
  "EASIER": {
    it: "PIÙ FACILE",
    en: "EASIER",
    fr: "PLUS FACILE",
    es: "MÁS FÁCIL",
    pt: "MAIS FÁCIL",
    ru: "ПРОЩЕ",
    hi: "आसान",
    bn: "সহজতর",
    zh: "更简单",
    ja: "より簡単",
    ar: "أسهل"
  },
  "MORE PRECISE": {
    it: "PIÙ PRECISA",
    en: "MORE PRECISE",
    fr: "PLUS PRÉCIS",
    es: "MÁS PRECISO",
    pt: "MAIS PRECISO",
    ru: "ТОЧНЕЕ",
    hi: "अधिक सटीक",
    bn: "আরও সঠিক",
    zh: "更精确",
    ja: "より正確",
    ar: "أكثر دقة"
  },
  "RURAL AREAS": {
    it: "AREE RURALI",
    en: "RURAL AREAS",
    fr: "ZONES RURALES",
    es: "ZONAS RURALES",
    pt: "ZONAS RURAIS",
    ru: "СЕЛЬСКАЯ МЕСТНОСТЬ",
    hi: "ग्रामीण क्षेत्र",
    bn: "গ্রামীণ এলাকা",
    zh: "农村地区",
    ja: "農村地域",
    ar: "المناطق الريفية"
  },
  "Verify detected details": {
    it: "Verifica i dati rilevati",
    en: "Verify detected details",
    fr: "Vérifier les détails détectés",
    es: "Verificar detalles detectados",
    pt: "Verificar detalhes detectados",
    ru: "Проверить обнаруженные данные",
    hi: "पता लगाए गए विवरणों को सत्यापित करें",
    bn: "শনাক্ত করা বিবরণ যাচাই করুন",
    zh: "验证检测到的详细信息",
    ja: "検出された詳細を確認する",
    ar: "التحقق من التفاصيل المكتشفة"
  },
  "Official contact information": {
    it: "Informazioni di contatto ufficiali",
    en: "Official contact information",
    fr: "Informations de contact officielles",
    es: "Información oficial de contacto",
    pt: "Informações oficiais de contato",
    ru: "Официальная контактная информация",
    hi: "आधिकारिक संपर्क जानकारी",
    bn: "অফিসিয়াল যোগাযোগের তথ্য",
    zh: "官方联系方式",
    ja: "公式の連絡先情報",
    ar: "معلومات الاتصال الرسمية"
  },
  "Do you have an email address?": {
    it: "Hai un indirizzo email?",
    en: "Do you have an email address?",
    fr: "Avez-vous une adresse e-mail ?",
    es: "¿Tiene una dirección de correo electrónico?",
    pt: "Você tem um endereço de e-mail?",
    ru: "Есть ли у вас адрес электронной почты?",
    hi: "क्या आपके पास ईमेल पता है?",
    bn: "আপনার কি একটি ইমেল ঠিকানা আছে?",
    zh: "您有电子邮件地址吗？",
    ja: "メールアドレスをお持ちですか？",
    ar: "هل لديك بريد إلكتروني؟"
  },
  "Do you have a phone number?": {
    it: "Hai un numero di telefono?",
    en: "Do you have a phone number?",
    fr: "Avez-vous un numéro de téléphone ?",
    es: "¿Tiene un número de teléfono?",
    pt: "Você tem um número de telefone?",
    ru: "Есть ли у вас номер телефона?",
    hi: "क्या आपके पास फ़ोन नंबर है?",
    bn: "আপনার কি फोन नंबर है?",
    zh: "您有电话号码吗？",
    ja: "電話番号をお持ちですか？",
    ar: "هل لديك رقم هاتف؟"
  },
  "Yes": {
    it: "Sì",
    en: "Yes",
    fr: "Oui",
    es: "Sí",
    pt: "Sim",
    ru: "Да",
    hi: "हाँ",
    bn: "হ্যাঁ",
    zh: "是",
    ja: "はい",
    ar: "نعم"
  },
  "No": {
    it: "No",
    en: "No",
    fr: "Non",
    es: "No",
    pt: "Não",
    ru: "Нет",
    hi: "नहीं",
    bn: "না",
    zh: "否",
    ja: "いいえ",
    ar: "لا"
  },
  "Change answer": {
    it: "Cambia risposta",
    en: "Change answer",
    fr: "Modifier la réponse",
    es: "Cambiar respuesta",
    pt: "Mudar resposta",
    ru: "Изменить ответ",
    hi: "उत्तर बदलें",
    bn: "उत्तर परिवर्तन করুন",
    zh: "更改答案",
    ja: "回答を変更する",
    ar: "تغيير الإجابة"
  },
  "Access Credentials": {
    it: "Credenziali di Accesso",
    en: "Access Credentials",
    fr: "Identifiants d'accès",
    es: "Credenciales de acceso",
    pt: "Credenciais de acesso",
    ru: "Учетные данные доступа",
    hi: "क्रेडेंशियल एक्सेस करें",
    bn: "অ্যাক্সেस শংসাপত্র",
    zh: "访问凭证",
    ja: "アクセス資格情報",
    ar: "بيانات الاعتماد"
  },
  "Username": {
    it: "Nome Utente",
    en: "Username",
    fr: "Nom d'utilisateur",
    es: "Nombre de usuario",
    pt: "Nome de usuário",
    ru: "Имя пользователя",
    hi: "यूज़रनेम",
    bn: "ব্যবহারকারীর নাম",
    zh: "用户名",
    ja: "ユーザー名",
    ar: "اسم المستخدم"
  },
  "Password": {
    it: "Password",
    en: "Password",
    fr: "Mot de passe",
    es: "Contraseña",
    pt: "Senha",
    ru: "Пароль",
    hi: "पासवर्ड",
    bn: "পাসওয়ার্ড",
    zh: "密码",
    ja: "パスワード",
    ar: "كلمة المرور"
  },
  "Reserved Citizen Code": {
    it: "Codice Cittadino Riservato",
    en: "Reserved Citizen Code",
    fr: "Code citoyen réservé",
    es: "Código de ciudadano reservado",
    pt: "Código de cidadão reservado",
    ru: "Зарезервированный код гражданина",
    hi: "आरक्षित नागरिक कोड",
    bn: "সংরक्षित नागरिक कोड",
    zh: "专属公民代码",
    ja: "予約済み市民コード",
    ar: "رمز المواطن المخصص"
  },
  "Passport & ID Card Photo": {
    it: "Foto Tessera per Documenti",
    en: "Passport & ID Card Photo",
    fr: "Photo d'identité pour documents",
    es: "Foto de pasaporte y tarjeta de identificación",
    pt: "Foto de passaporte e cartão de identificação",
    ru: "Фотография на паспорт и удостоверение",
    hi: "पासपोर्ट और आईडी कार्ड फोटो",
    bn: "পাসপোর্ট এবং আইডি কার্ড ফটো",
    zh: "护照和身份证照片",
    ja: "パスポート・IDカード用写真",
    ar: "صورة جواز السفر وبطاقة الهوية"
  },
  "Camera Selfie": {
    it: "Autoscatto Camera",
    en: "Camera Selfie",
    fr: "Selfie caméra",
    es: "Selfie con cámara",
    pt: "Selfie da câmera",
    ru: "Селфи на камеру",
    hi: "कैमरा सेल्फी",
    bn: "ক্যামেরা সেলফি",
    zh: "自拍",
    ja: "カメラ自撮り",
    ar: "سيلفي الكاميرا"
  },
  "Upload Photo File": {
    it: "Carica File Foto",
    en: "Upload Photo File",
    fr: "Télécharger le fichier photo",
    es: "Cargar archivo de foto",
    pt: "Carregar arquivo de foto",
    ru: "Загрузить файл фотографии",
    hi: "फोटो फ़ाइल अपलोड करें",
    bn: "ফটো ফাইল আপলোড করুন",
    zh: "上传照片文件",
    ja: "写真ファイルをアップロード",
    ar: "تحميل ملف الصورة"
  },
  "Privacy Notice:": {
    it: "Nota del Garante:",
    en: "Privacy Notice:",
    fr: "Avis de confidentialité :",
    es: "Aviso de privacidad:",
    pt: "Aviso de privacidade:",
    ru: "Уведомление о конфиденциальности:",
    hi: "गोपनीयता सूचना:",
    bn: "গোপনীয়ता বিজ্ঞপ্তি:",
    zh: "隐私声明：",
    ja: "プライバシーに関する通知:",
    ar: "إشعار الخصوصية:"
  },
  "Submitting...": {
    it: "Inviando...",
    en: "Submitting...",
    fr: "Envoi en cours...",
    es: "Enviando...",
    pt: "Enviando...",
    ru: "Отправка...",
    hi: "सबमिट किया जा रहा है...",
    bn: "জमा দেওয়া হচ্ছে...",
    zh: "正在提交...",
    ja: "送信中...",
    ar: "جارٍ الإرسال..."
  },
  "Male": {
    it: "Maschio",
    en: "Male",
    fr: "Homme",
    es: "Hombre",
    pt: "Masculino",
    ru: "Мужчина",
    hi: "पुरुष",
    bn: "पुरुष",
    zh: "男",
    ja: "男性",
    ar: "ذكر"
  },
  "Female": {
    it: "Femmina",
    en: "Female",
    fr: "Femme",
    es: "Mujer",
    pt: "Feminino",
    ru: "Женщина",
    hi: "महिला",
    bn: "মহিলা",
    zh: "女",
    ja: "女性",
    ar: "أنثى"
  },
  "Active Votes": {
    it: "Votazioni Attive",
    en: "Active Votes",
    fr: "Votes actifs",
    es: "Votos activos",
    pt: "Votos ativos",
    ru: "Активные голосования",
    hi: "सक्रिय वोट",
    bn: "সक्रिय ভোট",
    zh: "活跃投票",
    ja: "現在投票中",
    ar: "التصويتات النشطة"
  },
  "Propose Law": {
    it: "Presenta Proposta",
    en: "Propose Law",
    fr: "Proposer une loi",
    es: "Proponer ley",
    pt: "Propor lei",
    ru: "Предложить закон",
    hi: "कानून का प्रस्ताव करें",
    bn: "আইন প্রস্তাব করুন",
    zh: "提案",
    ja: "法案提出",
    ar: "اقتراح قانون"
  },
  "Sovereign Archive": {
    it: "Archivio Referendum",
    en: "Sovereign Archive",
    fr: "Archives souveraines",
    es: "Archivo soberano",
    pt: "Archivo soberano",
    ru: "Суверенный архив",
    hi: "संप्रभु पुरालेख",
    bn: "সার্বভৌম সংরক্ষণাগার",
    zh: "主权档案",
    ja: "主権アーカイブ",
    ar: "الأرشيف السيادي"
  },
  "Official Albo Gazette": {
    it: "Albo delle Votazioni",
    en: "Official Albo Gazette",
    fr: "Gazette officielle",
    es: "Gaceta oficial",
    pt: "Boletim oficial",
    ru: "Официальный бюллетень",
    hi: "आधिकारिक राजपत्र",
    bn: "অফিসিয়াল গেজেট",
    zh: "官方公报",
    ja: "公式官報",
    ar: "الجريدة الرسمية"
  },
  "Invite & Share": {
    it: "Divulga e Invita",
    en: "Invite & Share",
    fr: "Inviter et partager",
    es: "Invitar y compartir",
    pt: "Convidar e compartilhar",
    ru: "Пригласить и поделиться",
    hi: "आमंत्रित करें और साझा करें",
    bn: "আমন্ত্রণ এবং শেয়ার",
    zh: "邀请与分享",
    ja: "招待と共有",
    ar: "الدعوة والمشاركة"
  },
  "Verify Proposes": {
    it: "Verifica Proposte",
    en: "Verify Proposes",
    fr: "Vérifier les propositions",
    es: "Verificar propuestas",
    pt: "Verificar propostas",
    ru: "Проверить предложения",
    hi: "प्रस्तावों को सत्यापित करें",
    bn: "প্রস্তাব যাচাইকরণ",
    zh: "审核提案",
    ja: "提案を審査",
    ar: "التحقق من المقترحات"
  },
  "Open referendums": {
    it: "Iniziative aperte al voto",
    en: "Open referendums",
    fr: "Référendums ouverts",
    es: "Referéndums abiertos",
    pt: "Referendos abertos",
    ru: "Открытые референдумы",
    hi: "खुले जनमत संग्रह",
    bn: "উন্মুক্ত গণভোট",
    zh: "正在进行的公投",
    ja: "実施中の国民投票",
    ar: "الاستفتاءات المفتوحة"
  },
  "Pending parliamentary petitions": {
    it: "Istanze parlamentari in sospeso",
    en: "Pending parliamentary petitions",
    fr: "Pétitions parlementaires en attente",
    es: "Peticiones parlamentarias pendientes",
    pt: "Petições parlamentares pendentes",
    ru: "Ожидающие рассмотрения петиции",
    hi: "लंबित संसदीय याचिकाएँ",
    bn: "মুলতুবি সংসদীয় পিটিশন",
    zh: "待处理的议会请愿书",
    ja: "保留中の議会請願",
    ar: "الالتماسات البرلمانية المعلقة"
  },
  "Sovereign Registry Gazette": {
    it: "Eti democratici registrati",
    en: "Sovereign Registry Gazette",
    fr: "Gazette du registre souverain",
    es: "Gaceta del registro soberano",
    pt: "Boletim do registro soberano",
    ru: "Суверенный реестр бюллетеней",
    hi: "संप्रभु रजिस्ट्री राजपत्र",
    bn: "সার্বভৌম রেজিস্ট্রি গেজেট",
    zh: "主权登记公报",
    ja: "主権登録簿公報",
    ar: "جريدة السجل السيادي"
  },
  "No proposals found matching this filter": {
    it: "Nessuna proposta normativa presente in questa sezione.",
    en: "No proposals found matching this filter",
    fr: "Aucune proposition trouvée avec ce filtre",
    es: "No se encontraron propuestas con este filtro",
    pt: "Nenhuma proposta encontrada com este filtro",
    ru: "Предложений по этому фильтру не найдено",
    hi: "इस फ़िल्टर से मेल खाने वाला कोई प्रस्ताव नहीं मिला",
    bn: "এই ফিল্টারের সাথে মিল থাকা কোনো প্রস্তাব পাওয়া যায়নি",
    zh: "没有找到符合此筛选条件的提案",
    ja: "このフィルターに一致する提案は見つかりませんでした",
    ar: "لم يتم العثور على مقترحات تطابق هذا الفلتر"
  },
  "Proposed by": {
    it: "Proponente",
    en: "Proposed by",
    fr: "Proposé par",
    es: "Propuesto por",
    pt: "Proposto por",
    ru: "Предложено",
    hi: "द्वारा प्रस्तावित",
    bn: "প্রস্তাবকারী",
    zh: "提案人",
    ja: "提案者",
    ar: "مقترح من"
  },
  "sovereign votes cast": {
    it: "voti espressi",
    en: "sovereign votes cast",
    fr: "votes souverains exprimés",
    es: "votos soberanos emitidos",
    pt: "votos soberanos expressos",
    ru: "суверенных голосов подано",
    hi: "संप्रभु वोट डाले गए",
    bn: "সার্বভৌম ভোট প্রদান করা হয়েছে",
    zh: "已投主权票",
    ja: "主権者投票数",
    ar: "أصوات سيادية تم الإدلاء بها"
  },
  "Cast your sovereign vote": {
    it: "Esprimi la tua sovranità popolare",
    en: "Cast your sovereign vote",
    fr: "Exprimez votre vote souverain",
    es: "Emita su voto soberano",
    pt: "Vote soberanamente",
    ru: "Проголосуйте как суверенный гражданин",
    hi: "अपना संप्रभु वोट डालें",
    bn: "আপনার সার্বভৌম ভোট দিন",
    zh: "投下您的主权一票",
    ja: "主権者として投票する",
    ar: "أدلِ بصوتك السيادي"
  },
  "Intermediate Results": {
    it: "Spoglio Parziale Referendario",
    en: "Intermediate Results",
    fr: "Résultats intermédiaires",
    es: "Resultados parciales",
    pt: "Resultados parciais",
    ru: "Промежуточные результаты",
    hi: "मध्यवर्ती परिणाम",
    bn: "अंतर्वर्तीকালীন ফলাফল",
    zh: "中期结果",
    ja: "中間集計結果",
    ar: "النتائج الأولية"
  },
  "Final Referendum Results": {
    it: "Esiti Scrutinio Popolare definitivo",
    en: "Final Referendum Results",
    fr: "Résultats définitifs du référendum",
    es: "Resultados finales del referéndum",
    pt: "Resultados finais do referendo",
    ru: "Окончательные результаты референдума",
    hi: "अंतिम जनमत संग्रह परिणाम",
    bn: "চূড়ান্ত গণভোটের ফলাফল",
    zh: "最终公投结果",
    ja: "国民投票最終結果",
    ar: "نتائج الاستفتاء النهائية"
  },
  "Official Voting Bulletin Notice Board": {
    it: "Albo delle Votazioni convalidate",
    en: "Official Voting Bulletin Notice Board",
    fr: "Tableau d'affichage officiel des votes",
    es: "Tablón oficial de boletines de votación",
    pt: "Quadro de avisos oficial de votação",
    ru: "Официальная доска объявлений голосования",
    hi: "आधिकारिक मतदान बुलेटिन नोटिस बोर्ड",
    bn: "অফিসিয়াল ভোটিং বুলেটিন নোটিশ বোর্ড",
    zh: "官方投票公告栏",
    ja: "公式投票告知掲示板",
    ar: "لوحة إعلانات نشرة التصويت الرسمية"
  },
  "Sovereign Proposal Initiative": {
    it: "Disegna una Nuova Iniziativa Legislativa",
    en: "Sovereign Proposal Initiative",
    fr: "Initiative de proposition souveraine",
    es: "Iniciativa de propuesta soberana",
    pt: "Iniciativa de proposta soberana",
    ru: "Суверенная законодательная инициатива",
    hi: "संप्रभु प्रस्ताव पहल",
    bn: "সার্বভৌম প্রস্তাব উদ্যোগ",
    zh: "主权提案倡议",
    ja: "主権法案イニシアチブ",
    ar: "مبادرة الاقتراح السيادي"
  },
  "Simple Idea": {
    it: "Idea Semplice",
    en: "Simple Idea",
    fr: "Idée simple",
    es: "Idea sencilla",
    pt: "Ideia simples",
    ru: "Простая идея",
    hi: "सरल विचार",
    bn: "সহज ধারণা",
    zh: "简单设想",
    ja: "シンプルなアイデア",
    ar: "فكرة بسيطة"
  },
  "Manual Draft": {
    it: "Bozza Manuale",
    en: "Manual Draft",
    fr: "Brouillon manuel",
    es: "Borrador manual",
    pt: "Rascunho manual",
    ru: "Ручной черновик",
    hi: "मैनुअल ड्राफ्ट",
    bn: "ম্যানুয়াল খসড়া",
    zh: "手动草案",
    ja: "手動ドラフト",
    ar: "مسودة يدويّة"
  },
  "Submit Simple Idea": {
    it: "Sottoscrivi e Deposita Idea Semplice",
    en: "Submit Simple Idea",
    fr: "Soumettre une idée simple",
    es: "Enviar idea sencilla",
    pt: "Enviar ideia simples",
    ru: "Отправить простую идею",
    hi: "सरल विचार प्रस्तुत करें",
    bn: "সহज ধারণা জমা দিন",
    zh: "提交简单设想",
    ja: "シンプルなアイデアを提出",
    ar: "تقديم فكرة بسيطة"
  },
  "Sponsor & Propose Bill": {
    it: "Sottoscrivi e Deposita Testo in Articoli",
    en: "Sponsor & Propose Bill",
    fr: "Soutenir et proposer un projet de loi",
    es: "Patrocinar y proponer proyecto de ley",
    pt: "Apoiar e propor projeto de lei",
    ru: "Поддержать и предложить законопроект",
    hi: "विधेयक का प्रायोजन और प्रस्ताव करें",
    bn: "बिल स्पनसर और प्रस्ताव करें",
    zh: "赞助并提交法案",
    ja: "法案を提出して支持を募る",
    ar: "رعاية واقتراح مشروع قانون"
  },
  "No proposal selected": {
    it: "Nessuna proposta selezionata",
    en: "No proposal selected",
    fr: "Aucune proposition sélectionnée",
    es: "Ninguna propuesta seleccionada",
    pt: "Nenhuma proposta selecionada",
    ru: "Предложение не выбрано",
    hi: "कोई प्रस्ताव नहीं चुना गया",
    bn: "কোনো प्रस्ताव নির্বাচিত হয়নি",
    zh: "未选择任何提案",
    ja: "提案が選択されていません",
    ar: "لم يتم اختيار أي اقتراح"
  },
  "Single": {
    it: "Celibe/Nubile",
    en: "Single",
    fr: "Célibataire",
    es: "Soltero/a",
    pt: "Solteiro/a",
    ru: "Холост/Не замужем",
    hi: "एकल",
    bn: "একক",
    zh: "单身",
    ja: "独身",
    ar: "أعزب/عزباء"
  },
  "Married": {
    it: "Coniugato/a",
    en: "Married",
    fr: "Marié(e)",
    es: "Casado/a",
    pt: "Casado/a",
    ru: "Женат/Замужем",
    hi: "विवाहित",
    bn: "বিবাহित",
    zh: "已婚",
    ja: "既婚",
    ar: "متزوج/ة"
  },
  "Divorced": {
    it: "Divorziato/a",
    en: "Divorced",
    fr: "Divorcé(e)",
    es: "Divorciado/a",
    pt: "Divorciado/a",
    ru: "Разведен/Разведена",
    hi: "तलाकशुदा",
    bn: "তালাকপ্রাপ্ত",
    zh: "离婚",
    ja: "離婚",
    ar: "مطلق/ة"
  },
  "Widowed": {
    it: "Vedovo/a",
    en: "Widowed",
    fr: "Veuf/Veuve",
    es: "Viudo/a",
    pt: "Viúvo/a",
    ru: "Вдовец/Вдова",
    hi: "विधवा / विधुर",
    bn: "বিধবা / বিপত্নীক",
    zh: "丧偶",
    ja: "未亡人/男",
    ar: "أرمل/ة"
  },
  "Civil Union": {
    it: "Unito/a civilmente",
    en: "Civil Union",
    fr: "Union civile",
    es: "Unión civil",
    pt: "União civil",
    ru: "Гражданский союз",
    hi: "नागरिक संघ",
    bn: "সিভিল ইউনিয়ন",
    zh: "民事结合",
    ja: "事実婚",
    ar: "اتحاد مدني"
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
  },
  "Join the sovereign digital state. A borderless community dedicated to universal rights, justice, and the collective advancement of humanity.": {
    it: "Entra a far parte dello stato sovrano digitale. Una comunità senza confini dedicata ai diritti universali, alla giustizia e al progresso collettivo dell'umanità.",
    en: "Join the sovereign digital state. A borderless community dedicated to universal rights, justice, and the collective advancement of humanity.",
    fr: "Rejoignez l'État numérique souverain. Une communauté sans frontières dédiée aux droits universels, à la justice et au progrès collectif de l'humanité.",
    es: "Únete al estado digital soberano. Una comunidad sin fronteras dedicada a los derechos universales, la justicia y el avance colectivo de la humanidad.",
    pt: "Junte-se ao estado digital soberano. Uma comunidade sem fronteiras dedicada aos direitos universais, à justiça e ao avanço coletivo da humanidade.",
    ru: "Присоединяйтесь к суверенному цифровому государству. Сообщество без границ, посвященное всеобщим правам, справедливости и коллективному прогрессу человечества.",
    hi: "संप्रभु डिजिटल राज्य से जुड़ें। सार्वभौमिक अधिकारों, न्याय और मानवता की सामूहिक प्रगति के लिए समर्पित एक सीमाहीन समुदाय।",
    bn: "সার্বভৌম ডিজিটাল রাজ্যে যোগ দিন। সর্বজনীন অধিকার, ন্যায়বিচার এবং মানবজাতির সম্মিলিত অগ্রগতির জন্য নিবেদিত একটি সীমাহীন সম্প্রদায়।",
    zh: "加入主权数字国家。一个致力于普遍权利、正义和人类共同进步的无国界社区。",
    ja: "主権デジタル国家に参加しましょう。普遍的権利、正義、そして人類の集団的進歩に捧げられた国境のないコミュニティ。",
    ar: "انضم إلى الدولة الرقمية السيادية. مجتمع بلا حدود مكرس للحقوق العالمية والعدالة والتقدم الجماعي للبشرية."
  },
  "New World State Official Registry": {
    it: "Registro Ufficiale del New World State",
    en: "New World State Official Registry",
    fr: "Registre Officiel du New World State",
    es: "Registro Oficial del New World State",
    pt: "Registro Oficial do New World State",
    ru: "Официальный реестр New World State",
    hi: "न्यू वर्ल्ड स्टेट आधिकारिक रजिस्ट्री",
    bn: "নিউ ওয়ার্ল্ড স্টেট অফিসিয়াল রেজিস্ট্রি",
    zh: "新世界国家官方登记处",
    ja: "新世界国家公式登録局",
    ar: "السجل الرسمي لدولة العالم الجديد"
  },
  "Citizenship": {
    it: "Cittadinanza",
    en: "Citizenship",
    fr: "Citoyenneté",
    es: "Ciudadanía",
    pt: "Cidadania",
    ru: "Гражданство",
    hi: "नागरिकता",
    bn: "নাগরিকত্ব",
    zh: "公民身份",
    ja: "市民権",
    ar: "المواطنة"
  },
  "World Sovereign": {
    it: "Sovrana Mondiale",
    en: "World Sovereign",
    fr: "Souveraine Mondiale",
    es: "Soberana Mundial",
    pt: "Soberana Mundial",
    ru: "Мирового Суверена",
    hi: "विश्व संप्रभु",
    bn: "বিশ্ব সার্বভৌম",
    zh: "世界主权",
    ja: "世界主権",
    ar: "السيادية العالمية"
  },
  "Start Here/Home": {
    it: "Inizia Qui/Home",
    en: "Start Here/Home",
    fr: "Commencer ici/Accueil",
    es: "Empieza aquí/Inicio",
    pt: "Comece aqui/Início",
    ru: "Начните здесь/Главная",
    hi: "यहाँ से शुरू करें/होम",
    bn: "এখানে শুরু করুন/হোম",
    zh: "从这里开始/首页",
    ja: "ここからスタート/ホーム",
    ar: "ابدأ من هنا/الرئيسية"
  },
  "Authenticity • Integrity • Sovereignty": {
    it: "Autenticità • Integrità • Sovranità",
    en: "Authenticity • Integrity • Sovereignty",
    fr: "Authenticité • Intégrité • Souveraineté",
    es: "Autenticidad • Integridad • Soberanía",
    pt: "Autenticidade • Integridade • Soberania",
    ru: "Подлинность • Целостность • Суверенитет",
    hi: "प्रामाणिकता • अखंडता • संप्रभुता",
    bn: "প্রামাণিকতা • অখণ্ডতা • সার্বভৌমত্ব",
    zh: "真实性 • 完整性 • 主权",
    ja: "真正性 • 誠実性 • 主権",
    ar: "الأصالة • النزاهة • السيادة"
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

import { Language } from '../constants/translations';

export const HERO_DATA: {
  badge: Record<Language, string>;
  titlePart1: Record<Language, string>;
  titlePart2: Record<Language, string>;
  description: Record<Language, string>;
  btnPassport: Record<Language, string>;
  btnDemocracy: Record<Language, string>;
} = {
  badge: {
    it: "La tua Guida Semplificata",
    en: "Sovereign Digital Onboarding",
    fr: "Guide Numérique Souverain",
    es: "Guía Digital Soberana",
    pt: "Guia Digital Soberano",
    ru: "Суверенное цифровое руководство",
    hi: "संप्रभु डिजिटल ऑनबोर्डिंग",
    bn: "সার্বভৌম ডিজিটাল অনবোর্ডিং",
    zh: "主权数字入门指南",
    ja: "主権デジタルオンボーディング",
    ar: "الدليل الرقمي السيادي"
  },
  titlePart1: {
    it: "Benvenuto nel",
    en: "Hello! Welcome to the",
    fr: "Bonjour ! Bienvenue dans le",
    es: "¡Hola! ¡Bienvenido al",
    pt: "Olá! Bem-vindo ao",
    ru: "Привет! Добро пожаловать в",
    hi: "नमस्ते! स्वागत है आपका",
    bn: "হ্যালো! স্বাগতম",
    zh: "你好！欢迎来到",
    ja: "こんにちは！ようこそ",
    ar: "مرحباً بك في"
  },
  titlePart2: {
    it: "New World State",
    en: "New World State",
    fr: "New World State",
    es: "New World State",
    pt: "New World State",
    ru: "New World State",
    hi: "न्यू वर्ल्ड स्टेट में",
    bn: "নিউ ওয়ার্ল্ড স্টেটে",
    zh: "新世界国家",
    ja: "新世界国家へ",
    ar: "دولة العالم الجديد"
  },
  description: {
    it: "Hai mai desiderato una comunità globale senza barriere fisiche, priva di burocrazia complessa e dove la tua voce conta direttamente? Questo è il New World State: uno spazio condiviso, amichevole e sicuro, progettato per includere tutte le generazioni.",
    en: "Have you ever dreamed of a unified digital space where every voice counts directly, without borders or complex bureaucracy? This is New World State: a peaceful and sovereign online community designed for all generations.",
    fr: "Avez-vous déjà rêvé d'un espace numérique unifié où chaque voix compte directement, sans frontières ni bureaucratie complexe ? C'est le New World State : une communauté en ligne pacifique et souveraine conçue pour toutes les générations.",
    es: "¿Alguna vez has soñado con un espacio digital unificado donde cada voz cuente directamente, sin fronteras ni burocracia compleja? Esto es New World State: una comunidad en línea pacífica y soberana diseñada para todas las generaciones.",
    pt: "Você já sonhou com um espaço digital unificado onde cada voz conta diretamente, sem fronteiras ou burocracia complexa? Este é o New World State: uma comunidade online pacífica e soberana projetada para todas as gerações.",
    ru: "Мечтали ли вы когда-нибудь о едином цифровом пространстве, где каждый голос учитывается напрямую, без границ и сложной бюрократии? Это New World State: мирное и суверенное онлайн-сообщество, созданное для всех поколений.",
    hi: "क्या आपने कभी एक ऐसे एकीकृत डिजिटल स्थान का सपना देखा है जहाँ हर आवाज बिना सीमाओं या जटिल नौकरशाही के सीधे मायने रखती है? यह न्यू वर्ल्ड स्टेट है: सभी पीढ़ियों के लिए डिज़ाइन किया गया एक शांतिपूर्ण और संप्रभु ऑनलाइन समुदाय।",
    bn: "আপনি কি কখনো এমন একটি ঐক্যবদ্ধ ডিজিটাল স্পেসের স্বপ্ন দেখেছেন যেখানে প্রতিটি কণ্ঠস্বর সরাসরি গণনা করা হয়, সীমানা বা জটিল আমলাতন্ত্র ছাড়াই? এটি নিউ ওয়ার্ল্ড স্টেট: সমস্ত প্রজন্মের জন্য ডিজাইন করা একটি শান্তিপূর্ণ এবং সার্বভৌম অনলাইন সম্প্রদায়।",
    zh: "您是否曾梦想过一个统一的数字空间，在这里，每个声音都直接计算，没有国界或复杂的官僚机构？这就是新世界国家：一个专为所有世代设计的和平且主权在线社区。",
    ja: "国境や複雑な官僚主義なしに、すべての声が直接反映される、統一されたデジタル空間を夢見たことはありませんか？これが新世界国家（New World State）です。すべての世代のために設計された、平和で主権あるオンラインコミュニティです。",
    ar: "هل حلمت يوماً بمساحة رقمية موحدة حيث يكون لكل صوت قيمة مباشرة، دون حدود أو بيروقراطية معقدة؟ هذه هي دولة العالم الجديد: مجتمع رقمي سلمي وسيادي مصمم لجميع الأجيال."
  },
  btnPassport: {
    it: "Ottieni il Mio Passaporto Gratis 🚀",
    en: "Get My Free Passport Now 🚀",
    fr: "Obtenir Mon Passeport Gratuit 🚀",
    es: "Obtener Mi Pasaporte Gratis 🚀",
    pt: "Obter Meu Passaporte Grátis 🚀",
    ru: "Получить бесплатный паспорт 🚀",
    hi: "मेरा मुफ़्त पासपोर्ट प्राप्त करें 🚀",
    bn: "আমার বিনামূল্যে পাসপোর্ট পান 🚀",
    zh: "立即获取我的免费护照 🚀",
    ja: "無料のパスポートを取得する 🚀",
    ar: "احصل على جواز السفر المجاني 🚀"
  },
  btnDemocracy: {
    it: "Guarda Cosa Votiamo 🗳️",
    en: "See What We Vote 🗳️",
    fr: "Voir ce que nous votons 🗳️",
    es: "Ver lo que votamos 🗳️",
    pt: "Ver o que votamos 🗳️",
    ru: "Посмотреть голосования 🗳️",
    hi: "देखें कि हम क्या मतदान करते हैं 🗳️",
    bn: "আমরা কী ভোট দিই তা দেখুন 🗳️",
    zh: "查看我们的投票提案 🗳️",
    ja: "投票内容を確認する 🗳️",
    ar: "شاهد ما نقتنع به ونعوّت عليه 🗳️"
  }
};

export const TTS_UI_DATA: {
  title: Record<Language, string>;
  readingSegment: Record<Language, string>;
  audioReady: Record<Language, string>;
  voiceLabel: Record<Language, string>;
  speedLabel: Record<Language, string>;
  listenBtn: Record<Language, string>;
  stopBtn: Record<Language, string>;
  resetBtn: Record<Language, string>;
  slower: Record<Language, string>;
  faster: Record<Language, string>;
} = {
  title: {
    it: "Guida Audio Assistita",
    en: "Audio Assistant Guide",
    fr: "Guide Assistant Vocal",
    es: "Guía de Asistente de Audio",
    pt: "Guia Assistente de Áudio",
    ru: "Аудио-помощник",
    hi: "ऑडियो सहायक गाइड",
    bn: "অডিও সহায়ক গাইড",
    zh: "语音助手指南",
    ja: "音声アシスタントガイド",
    ar: "دليل المساعد الصوتي"
  },
  readingSegment: {
    it: "Lettura segmento",
    en: "Reading segment",
    fr: "Lecture du segment",
    es: "Leyendo segmento",
    pt: "Lendo segmento",
    ru: "Чтение фрагмента",
    hi: "खंड पढ़ रहा है",
    bn: "অধ্যায় পড়া হচ্ছে",
    zh: "正在朗读段落",
    ja: "セグメント再生中",
    ar: "قراءة الجزء"
  },
  audioReady: {
    it: "Audio pronto • {count} segmenti",
    en: "Audio ready • {count} segments",
    fr: "Audio prêt • {count} segments",
    es: "Audio listo • {count} segmentos",
    pt: "Áudio pronto • {count} segmentos",
    ru: "Аудио готово • {count} сегментов",
    hi: "ऑडियो तैयार है • {count} खंड",
    bn: "অডিও প্রস্তুত • {count} অংশ",
    zh: "音频已准备好 • {count} 个段落",
    ja: "音声準備完了 • {count} セグメント",
    ar: "الصوت جاهز • {count} أجزاء"
  },
  voiceLabel: {
    it: "Voce",
    en: "Voice",
    fr: "Voix",
    es: "Voz",
    pt: "Voz",
    ru: "Голос",
    hi: "आवाज़",
    bn: "কণ্ঠস্বর",
    zh: "语音",
    ja: "音声",
    ar: "الصوت"
  },
  speedLabel: {
    it: "Velocità",
    en: "Speed",
    fr: "Vitesse",
    es: "Velocidad",
    pt: "Velocidade",
    ru: "Скорость",
    hi: "गति",
    bn: "গতি",
    zh: "语速",
    ja: "速度",
    ar: "السرعة"
  },
  listenBtn: {
    it: "Ascolta Pagina 🎧",
    en: "Listen Page 🎧",
    fr: "Écouter la page 🎧",
    es: "Escuchar página 🎧",
    pt: "Ouvir página 🎧",
    ru: "Слушать страницу 🎧",
    hi: "पृष्ठ सुनें 🎧",
    bn: "পৃষ্ঠা শুনুন 🎧",
    zh: "朗读本页 🎧",
    ja: "ページを聞く 🎧",
    ar: "استمع للصفحة 🎧"
  },
  stopBtn: {
    it: "Ferma Guida",
    en: "Stop Guide",
    fr: "Arrêter la lecture",
    es: "Detener guía",
    pt: "Parar guia",
    ru: "Остановить",
    hi: "रोकें",
    bn: "থামান",
    zh: "停止朗读",
    ja: "停止",
    ar: "إيقاف الدليل"
  },
  resetBtn: {
    it: "Riavvia",
    en: "Reset",
    fr: "Réinitialiser",
    es: "Reiniciar",
    pt: "Reiniciar",
    ru: "Сброс",
    hi: "पुनः आरंभ करें",
    bn: "পুনরায় শুরু করুন",
    zh: "重置",
    ja: "リセット",
    ar: "إعادة ضبط"
  },
  slower: {
    it: "Più lento",
    en: "Slower",
    fr: "Plus lent",
    es: "Más lento",
    pt: "Mais lento",
    ru: "Медленнее",
    hi: "धीमा",
    bn: "ধীর",
    zh: "减速",
    ja: "遅く",
    ar: "أبطأ"
  },
  faster: {
    it: "Più veloce",
    en: "Faster",
    fr: "Plus rapide",
    es: "Más rápido",
    pt: "Mais rápido",
    ru: "Быстрее",
    hi: "तेज़",
    bn: "দ্রুত",
    zh: "加速",
    ja: "速く",
    ar: "أسرع"
  }
};

export const ROADMAP_DATA: {
  badge: Record<Language, string>;
  title: Record<Language, string>;
  subtitle: Record<Language, string>;
  step1Title: Record<Language, string>;
  step1Desc: Record<Language, string>;
  step2Title: Record<Language, string>;
  step2Desc: Record<Language, string>;
  step3Title: Record<Language, string>;
  step3Desc: Record<Language, string>;
} = {
  badge: {
    it: "Un percorso guidato e lineare",
    en: "A Guided and Clear Roadmap",
    fr: "Un parcours guidé et clair",
    es: "Un camino guiado y claro",
    pt: "Um caminho guiado e claro",
    ru: "Понятное и простое руководство",
    hi: "एक निर्देशित और स्पष्ट रोडमैप",
    bn: "একটি নির্দেশিত এবং পরিষ্কার রোডম্যাপ",
    zh: "清晰指引的路线图",
    ja: "分かりやすいロードマップ",
    ar: "خارطة طريق واضحة وموجهة"
  },
  title: {
    it: "Come funziona lo Stato Digitale?",
    en: "How does the Digital State work?",
    fr: "Comment fonctionne l'État Numérique ?",
    es: "¿Cómo funciona el Estado Digital?",
    pt: "Como funciona o Estado Digital?",
    ru: "Как работает Цифровое Государство?",
    hi: "डिजिटल राज्य कैसे काम करता है?",
    bn: "ডিজিটাল স্টেট কীভাবে কাজ করে?",
    zh: "数字国家如何运作？",
    ja: "デジタル国家はどのように機能しますか？",
    ar: "كيف تعمل الدولة الرقمية؟"
  },
  subtitle: {
    it: "Abbiamo ridotto all'essenziale la procedura per renderla accessibile e confortevole a chiunque.",
    en: "We have reduced the process to the essentials to make it accessible and pleasant for everyone.",
    fr: "Nous avons réduit la procédure à l'essentiel pour la rendre accessible et agréable pour tous.",
    es: "Hemos reducido el proceso a lo esencial para que sea accesible y agradable para todos.",
    pt: "Reduzimos o processo ao essencial para torná-lo acessível e agradável para todos.",
    ru: "Мы сократили процесс до самого необходимого, чтобы сделать его доступным и удобным для каждого.",
    hi: "हमने प्रक्रिया को आवश्यक चीज़ों तक सीमित कर दिया है ताकि यह सभी के लिए सुलभ और सुखद हो।",
    bn: "আমরা পদ্ধতিটি সকলের জন্য সহজ এবং সুবিধাজনক করতে প্রক্রিয়াটিকে সহজ করেছি।",
    zh: "我们将流程精简至最核心的步骤，让每个人都能轻松便捷地参与。",
    ja: "誰でも簡単に利用できるよう、手続きをシンプルにまとめました。",
    ar: "لقد بسّطنا الإجراءات لجعلها متاحة ومريحة للجميع."
  },
  step1Title: {
    it: "Ti registri gratis",
    en: "Register for Free",
    fr: "Inscrivez-vous gratuitement",
    es: "Regístrate gratis",
    pt: "Registre-se gratuitamente",
    ru: "Бесплатная регистрация",
    hi: "मुफ़्त पंजीकरण करें",
    bn: "বিনামূল্যে নিবন্ধন করুন",
    zh: "免费注册",
    ja: "無料登録",
    ar: "التسجيل مجاناً"
  },
  step1Desc: {
    it: "Inserisci i tuoi dati anagrafici di base (nome, data di nascita, indirizzo residenziale) e carichi una foto del documento ordinario per confermare la tua identità reale. Richiede solo un paio di minuti!",
    en: "Fill out your basic details (name, date of birth, residential address) and upload a photo of your standard document to confirm your real identity. It only takes two minutes!",
    fr: "Remplissez vos informations de base (nom, date de naissance, adresse) et téléchargez une photo de votre pièce d'identité. Cela ne prend que deux minutes !",
    es: "Rellena tus datos básicos (nombre, fecha de nacimiento, dirección) y sube una foto de tu documento de identidad. ¡Solo toma dos minutos!",
    pt: "Preencha seus dados básicos (nome, data de nascimento, endereço) e envie uma foto do seu documento de identidade. Leva apenas dois minutos!",
    ru: "Заполните основные данные (имя, дата рождения, адрес) и загрузите фото документа для подтверждения личности. Это займет всего две минуты!",
    hi: "अपनी बुनियादी जानकारी (नाम, जन्म तिथि, पता) भरें और अपनी वास्तविक पहचान की पुष्टि करने के लिए दस्तावेज़ की फोटो अपलोड करें। इसमें केवल दो मिनट लगते हैं!",
    bn: "আপনার প্রাথমিক তথ্য পূরণ করুন এবং আসল পরিচয় নিশ্চিত করতে পরিচয়পত্রের ছবি আপলোড করুন। মাত্র দুই মিনিট সময় লাগে!",
    zh: "填写您的基本信息（姓名、出生日期、居住地址）并上传一张证件照片以确认真实身份。仅需两分钟！",
    ja: "基本情報（氏名、生年月日、住所）を入力し、本人確認書類の写真をアップロードします。たった2分で完了します！",
    ar: "أدخل بياناتك الأساسية (الاسم، تاريخ الميلاد، العنوان) وقم برفع صورة وثيقة الهوية لتأكيد شخصيتك الحقيقية. يستغرق الأمر دقيقتين فقط!"
  },
  step2Title: {
    it: "Ricevi il Passaporto",
    en: "Receive Your Passport",
    fr: "Recevez votre passeport",
    es: "Recibe tu pasaporte",
    pt: "Receba seu passaporte",
    ru: "Получите свой паспорт",
    hi: "अपना पासपोर्ट प्राप्त करें",
    bn: "আপনার পাসপোর্ট গ্রহণ করুন",
    zh: "获取您的护照",
    ja: "パスポートを受け取る",
    ar: "احصل على جواز سفرك"
  },
  step2Desc: {
    it: "I funzionari del nostro archivio anagrafico verificano rapidamente i tuoi dati ed emettono il provvedimento d'iscrizione. Riceverai via e-mail il tuo passaporto ufficiale PDF protetto da un codice a 16 cifre.",
    en: "Our registry officers quickly verify your details and issue your membership. You will receive your official signed PDF passport via email protected by a 16-digit code.",
    fr: "Nos agents vérifient rapidement vos informations et émettent votre certificat. Vous recevrez par e-mail votre passeport officiel en PDF protégé par un code à 16 chiffres.",
    es: "Nuestros oficiales verifican tus datos y emiten tu certificado. Recibirás por correo electrónico tu pasaporte oficial en PDF protegido por un código de 16 dígitos.",
    pt: "Nossos oficiais verificam seus dados e emitem seu certificado. Você receberá por e-mail seu passaporte oficial em PDF protegido por um código de 16 dígitos.",
    ru: "Наши сотрудники быстро проверят ваши данные и оформят регистрацию. Вы получите официальный PDF-паспорт с 16-значным кодом на электронную почту.",
    hi: "हमारे रजिस्ट्रार आपके विवरणों की त्वरित जांच करते हैं और आपकी सदस्यता जारी करते हैं। आपको ईमेल द्वारा 16 अंकों के कोड से सुरक्षित आधिकारिक पीडीएफ पासपोर्ट प्राप्त होगा।",
    bn: "আমাদের রেজিস্ট্রেশন কর্মকর্তারা আপনার তথ্য যাচাই করে সদস্যপদ প্রদান করবেন। আপনি ইমেইলে ১৬ ডিজিটের কোড দ্বারা সুরক্ষিত অফিসিয়াল পিডিএফ পাসপোর্ট পাবেন।",
    zh: "我们的户籍官员会快速核实您的信息并颁发成员资格。您将通过电子邮件收到包含16位专属代码的官方PDF护照。",
    ja: "登録担当者が迅速に確認を行い、証明書を発行します。16桁のコードで保護された公式PDFパスポートがメールで届きます。",
    ar: "يقوم موظفو السجل بالتحقق من بياناتك وإصدار شهادة المواطنة. ستتلقى جواز سفرك الرسمي بصيغة PDF المحمي بكود من 16 رقماً عبر البريد الإلكتروني."
  },
  step3Title: {
    it: "Partecipi e decidi",
    en: "Participate and Decide",
    fr: "Participez et décidez",
    es: "Participa y decide",
    pt: "Participe e decida",
    ru: "Участвуйте и решайте",
    hi: "भाग लें और निर्णय लें",
    bn: "অংশগ্রহণ করুন এবং সিদ্ধান্ত নিন",
    zh: "参与并表决",
    ja: "参加して決定する",
    ar: "شارك وقرر"
  },
  step3Desc: {
    it: "Una volta ottenuto il passaporto, sarai a tutti gli effetti un membro deliberante! Potrai votare SI o NO sulle proposte e riforme d'interesse pubblico, esprimendoti su ogni decisione chiave.",
    en: "Once your passport is active, you are a full voting member! You can vote YES or NO on proposals and key public reforms.",
    fr: "Une fois votre passeport actif, vous êtes un membre votant à part entière ! Vous pouvez voter OUI ou NON sur les propositions et réformes clés.",
    es: "¡Una vez activo tu pasaporte, eres un miembro con derecho a voto! Puedes votar SÍ o NO en las propuestas y reformas clave.",
    pt: "Com seu passaporte ativo, você é um membro votante pleno! Pode votar SIM ou NÃO em propostas e reformas cruciais.",
    ru: "Как только ваш паспорт активирован, вы получаете полный голос! Вы можете голосовать ЗА или ПРОТИВ по важным реформам.",
    hi: "एक बार आपका पासपोर्ट सक्रिय हो जाने पर, आप एक पूर्ण मतदान सदस्य बन जाते हैं! आप प्रस्तावों और सुधारों पर हां या ना में वोट कर सकते हैं।",
    bn: "আপনার পাসপোর্ট সক্রিয় হলে, আপনি একজন পূর্ণ ভোটিং সদস্য! আপনি গুরুত্বপূর্ণ সংস্কার ও প্রস্তাবনায় হ্যাঁ বা না ভোট দিতে পারবেন।",
    zh: "护照生效后，您即成为拥有完全表决权的成员！您可以针对重要改革和提案投【赞成】或【反对】票。",
    ja: "パスポートが有効化されると、正式な投票メンバーになります！重要な改革案に対して賛成・反対の投票が可能です。",
    ar: "بمجرد تفعيل جواز سفرك، تصبح عضواً يحق له التصويت! يمكنك التصويت بنعم أو لا على المقترحات والإصلاحات العامة."
  }
};

export const QUIZ_DATA: {
  badge: Record<Language, string>;
  subBadge: Record<Language, string>;
  title: Record<Language, string>;
  subtitle: Record<Language, string>;
  q1Label: Record<Language, string>;
  q1Question: Record<Language, string>;
  q1OptionA: Record<Language, string>;
  q1OptionB: Record<Language, string>;
  q2Label: Record<Language, string>;
  q2Question: Record<Language, string>;
  q2OptionA: Record<Language, string>;
  q2OptionB: Record<Language, string>;
  q3Label: Record<Language, string>;
  q3Question: Record<Language, string>;
  q3OptionA: Record<Language, string>;
  q3OptionB: Record<Language, string>;
  resultTitle: Record<Language, string>;
  resultDesc: Record<Language, string>;
  resultCta: Record<Language, string>;
  resultReset: Record<Language, string>;
} = {
  badge: {
    it: "✨ Autocontrollo",
    en: "✨ Self-Check",
    fr: "✨ Auto-évaluation",
    es: "✨ Autoevaluación",
    pt: "✨ Autoavaliação",
    ru: "✨ Самопроверка",
    hi: "✨ आत्म-परीक्षण",
    bn: "✨ নিজের যাচাই",
    zh: "✨ 自我检测",
    ja: "✨ セルフチェック",
    ar: "✨ اختبار ذاتي"
  },
  subBadge: {
    it: "Test di Sincronia Veloce",
    en: "Quick Alignment Test",
    fr: "Test d'alignement rapide",
    es: "Test de alineación rápida",
    pt: "Teste de alinhamento rápido",
    ru: "Быстрый тест соответствия",
    hi: "त्वरित संरेखण परीक्षण",
    bn: "দ্রুত সারসংক্ষেপ পরীক্ষা",
    zh: "快速契合度测试",
    ja: "クイック適性テスト",
    ar: "اختبار توافق سريع"
  },
  title: {
    it: "Fai il \"Test di Benvenuto\" 🌟",
    en: "Take the \"Welcome Test\" 🌟",
    fr: "Faites le \"Test de Bienvenue\" 🌟",
    es: "Haz el \"Test de Bienvenida\" 🌟",
    pt: "Faça o \"Teste de Boas-Vindas\" 🌟",
    ru: "Пройдите \"Приветственный тест\" 🌟",
    hi: "\"स्वागत परीक्षण\" लें 🌟",
    bn: "\"স্বাগতম পরীক্ষা\" দিন 🌟",
    zh: "参加“欢迎测试” 🌟",
    ja: "「ウェルカムテスト」に挑戦 🌟",
    ar: "خُذ \"اختبار الترحيب\" 🌟"
  },
  subtitle: {
    it: "Tre risposte veloci per capire se la nostra democrazia fa al caso tuo!",
    en: "Three fast questions to help you verify if our digital democracy aligns with your values!",
    fr: "Trois questions rapides pour vérifier si notre démocratie numérique vous convient !",
    es: "¡Tres preguntas rápidas para verificar si nuestra democracia digital se adapta a ti!",
    pt: "Três perguntas rápidas para verificar se nossa democracia digital combina com você!",
    ru: "Три быстрых вопроса, чтобы понять, подходит ли вам наша цифровая демократия!",
    hi: "तीन त्वरित प्रश्न यह देखने के लिए कि क्या हमारी डिजिटल लोकतंत्र आपके अनुकूल है!",
    bn: "আমাদের ডিজিটাল গণতন্ত্র আপনার জন্য উপযুক্ত কিনা তা দেখতে তিনটি দ্রুত প্রশ্ন!",
    zh: "三个快速问题，帮助您了解我们的数字民主是否适合您！",
    ja: "3つの質問で、私たちのデジタル民主主義があなたに合っているか診断します！",
    ar: "ثلاثة أسئلة سريعة لمعرفة ما إذا كانت ديمقراطيتنا الرقمية تناسبك!"
  },
  q1Label: {
    it: "Domanda 1 di 3",
    en: "Question 1 of 3",
    fr: "Question 1 sur 3",
    es: "Pregunta 1 de 3",
    pt: "Pergunta 1 de 3",
    ru: "Вопрос 1 из 3",
    hi: "प्रश्न 1 / 3",
    bn: "প্রশ্ন ১/৩",
    zh: "问题 1 / 3",
    ja: "質問 1 / 3",
    ar: "السؤال 1 من 3"
  },
  q1Question: {
    it: "Ti piace esprimere la tua opinione sulle decisioni di interesse comune? 🗳️",
    en: "Do you like to express your opinion on decisions that impact the common interest? 🗳️",
    fr: "Aimez-vous exprimer votre opinion sur les décisions d'intérêt commun ? 🗳️",
    es: "¿Te gusta expresar tu opinión sobre las decisiones de interés común? 🗳️",
    pt: "Você gosta de expressar sua opinião sobre decisões de interesse comum? 🗳️",
    ru: "Нравится ли вам выражать свое мнение по решениям, затрагивающим общие интересы? 🗳️",
    hi: "क्या आप सामान्य हित के निर्णयों पर अपनी राय व्यक्त करना पसंद करते हैं? 🗳️",
    bn: "আপনি কি সাধারণ স্বার্থের সিদ্ধান্তগুলিতে আপনার মতামত প্রকাশ করতে পছন্দ করেন? 🗳️",
    zh: "您喜欢针对涉及公共利益的决策发表意见吗？ 🗳️",
    ja: "公共の利益に関わる意思決定について意見を言うのが好きですか？ 🗳️",
    ar: "هل تحب التعبير عن رأيك في القرارات التي تهم المصلحة العامة؟ 🗳️"
  },
  q1OptionA: {
    it: "💡 Sì, mi piace partecipare e dire la mia in modo diretto!",
    en: "💡 Yes, I love participating and speaking up directly!",
    fr: "💡 Oui, j'aime participer et m'exprimer directement !",
    es: "💡 ¡Sí, me encanta participar y opinar directamente!",
    pt: "💡 Sim, adoro participar e dar minha opinião diretamente!",
    ru: "💡 Да, я люблю участвовать и напрямую высказывать свое мнение!",
    hi: "💡 हाँ, मुझे सीधे भाग लेना और अपनी बात कहना पसंद है!",
    bn: "💡 হ্যাঁ, আমি সরাসরি অংশগ্রহণ করতে ও বলতে ভালোবাসি!",
    zh: "💡 是的，我喜欢直接参与表达想法！",
    ja: "💡 はい、直接参加して意見を言うのが好きです！",
    ar: "💡 نعم، أحب المشاركة والتعبير عن رأي بشكل مباشر!"
  },
  q1OptionB: {
    it: "😴 Preferisco lasciare che siano gli altri a scegliere per me.",
    en: "😴 I prefer letting other people make those choices for me.",
    fr: "😴 Je préfère laisser les autres choisir à ma place.",
    es: "😴 Prefiero dejar que otros elijan por mí.",
    pt: "😴 Prefiro deixar que outros escolham por mim.",
    ru: "😴 Я предпочитаю, чтобы другие выбирали за меня.",
    hi: "😴 मैं दूसरों को मेरे लिए विकल्प चुनने देना पसंद करता हूँ।",
    bn: "😴 আমি অন্যদের আমার জন্য সিদ্ধান্ত নিতে দিতে পছন্দ করি।",
    zh: "😴 我更喜欢让其他人替我做选择。",
    ja: "😴 他の人に決めてもらう方がいいです。",
    ar: "😴 أفضّل ترك الآخرين يختارون نيابة عني."
  },
  q2Label: {
    it: "Domanda 2 di 3",
    en: "Question 2 of 3",
    fr: "Question 2 sur 3",
    es: "Pregunta 2 de 3",
    pt: "Pergunta 2 de 3",
    ru: "Вопрос 2 из 3",
    hi: "प्रश्न 2 / 3",
    bn: "প্রশ্ন ২/৩",
    zh: "问题 2 / 3",
    ja: "質問 2 / 3",
    ar: "السؤال 2 من 3"
  },
  q2Question: {
    it: "Cosa fai di solito quando noti una regola o una procedura inadeguata nel mondo reale? 🌍",
    en: "What do you usually do when you notice an inadequate rule or procedure in the real world? 🌍",
    fr: "Que faites-vous habituellement quand vous remarquez une règle inadéquate dans le monde réel ? 🌍",
    es: "¿Qué haces habitualmente cuando notas una regla inadecuada en el mundo real? 🌍",
    pt: "O que você costuma fazer quando nota uma regra inadequada no mundo real? 🌍",
    ru: "Что вы обычно делаете, когда замечаете неэффективное правило в реальном мире? 🌍",
    hi: "जब आप वास्तविक दुनिया में किसी अनुचित नियम या प्रक्रिया को देखते हैं तो आप क्या करते हैं? 🌍",
    bn: "বাস্তব জগতে যখন কোনো অনুচিত নিয়ম দেখতে পান তখন আপনি সাধারণত কী করেন? 🌍",
    zh: "当您注意到现实世界中有不合理的规则或流程时，您通常会怎么做？ 🌍",
    ja: "現実世界で不合理なルールや手続きに気づいたとき、どうしますか？ 🌍",
    ar: "ماذا تفعل عادة عندما تلاحظ قاعدة أو إجراء غير مناسب في العالم الحقيقي؟ 🌍"
  },
  q2OptionA: {
    it: "🔥 Vorrei poter proporre soluzioni concrete e partecipare al cambiamento!",
    en: "🔥 I would love to propose concrete solutions and work for change!",
    fr: "🔥 J'aimerais proposer des solutions concrètes et participer au changement !",
    es: "🔥 ¡Me gustaría proponer soluciones concretas y ser parte del cambio!",
    pt: "🔥 Adoraria propor soluções concretas e fazer parte da mudança!",
    ru: "🔥 Я хотел бы предлагать конкретные решения и участвовать в изменениях!",
    hi: "🔥 मैं ठोस समाधान प्रस्तावित करना और बदलाव में भाग लेना चाहूंगा!",
    bn: "🔥 আমি সুনির্দিষ্ট সমাধান প্রস্তাব করতে ও পরিবর্তনে অংশ নিতে চাই!",
    zh: "🔥 我希望能提出具体解决方案并推动改变！",
    ja: "🔥 具体的な解決策を提案し、変革に参加したいです！",
    ar: "🔥 أود تقديم حلول عملية والمشاركة في التغيير!"
  },
  q2OptionB: {
    it: "🪴 Lascio correre perché penso che non si possa cambiare nulla.",
    en: "🪴 I let it slide because I think nothing can ever honestly change.",
    fr: "🪴 Je laisse passer car je pense que rien ne changera jamais.",
    es: "🪴 Lo dejo pasar porque creo que nada puede cambiar realmente.",
    pt: "🪴 Deixo passar porque acho que nada pode realmente mudar.",
    ru: "🪴 Я не обращаю внимания, так как считаю, что ничего нельзя изменить.",
    hi: "🪴 मैं इसे जाने देता हूँ क्योंकि मुझे लगता है कि कुछ भी नहीं बदला जा सकता।",
    bn: "🪴 আমি এড়িয়ে যাই কারণ আমি মনে করি কিছুই পরিবর্তন সম্ভব নয়।",
    zh: "🪴 我选择顺其自然，因为觉得什么都改变不了。",
    ja: "🪴 何も変わらないと思ってあきらめます。",
    ar: "🪴 أتغاضى عن الأمر لأنني أعتقد أن لا شيء يمكن أن يتغير."
  },
  q3Label: {
    it: "Domanda 3 di 3",
    en: "Question 3 of 3",
    fr: "Question 3 sur 3",
    es: "Pregunta 3 de 3",
    pt: "Pergunta 3 de 3",
    ru: "Вопрос 3 из 3",
    hi: "प्रश्न 3 / 3",
    bn: "প্রশ্ন ৩/৩",
    zh: "问题 3 / 3",
    ja: "質問 3 / 3",
    ar: "السؤال 3 من 3"
  },
  q3Question: {
    it: "Ti piacerebbe far parte di uno Stato Digitale pacifico e ricevere un passaporto federale gratuito? 💳",
    en: "Would you like to belong to a peaceful Digital State and obtain a free federal passport? 💳",
    fr: "Aimeriez-vous faire partie d'un État numérique paisible et obtenir un passeport gratuit ? 💳",
    es: "¿Te gustaría pertenecer a un Estado Digital pacífico y obtener un pasaporte federal gratuito? 💳",
    pt: "Gostaria de fazer parte de um Estado Digital pacífico e obter um passaporte gratuito? 💳",
    ru: "Хотели бы вы стать частью мирного Цифрового Государства и получить бесплатный паспорт? 💳",
    hi: "क्या आप एक शांतिपूर्ण डिजिटल राज्य का हिस्सा बनना और एक मुफ़्त पासपोर्ट प्राप्त करना चाहेंगे? 💳",
    bn: "আপনি কি একটি শান্তিপূর্ণ ডিজিটাল স্টেটের অংশ হতে এবং একটি বিনামূল্যে পাসপোর্ট পেতে চান? 💳",
    zh: "您愿意成为和平数字国家的一员并免费获得联邦护照吗？ 💳",
    ja: "平和なデジタル国家に参加し、無料の連邦パスポートを取得したいですか？ 💳",
    ar: "هل ترغب في الانتماء إلى دولة رقمية سلمية والحصول على جواز سفر اتحاد مجاني؟ 💳"
  },
  q3OptionA: {
    it: "😎 Assolutamente sì! È un'idea innovativa ed emozionante.",
    en: "😎 Absolutely yes! It is an innovative and exciting concept.",
    fr: "😎 Absolument oui ! C'est un concept innovant et passionnant.",
    es: "😎 ¡Absolutamente sí! Es un concepto innovador y emocionante.",
    pt: "😎 Com certeza sim! É um conceito inovador e empolgante.",
    ru: "😎 Абсолютно да! Это инновационная и увлекательная идея.",
    hi: "😎 बिल्कुल हाँ! यह एक अभिनव और रोमांचक विचार है।",
    bn: "😎 অবশ্যই হ্যাঁ! এটি একটি উদ্ভাবনী এবং রোমাঞ্চকর ধারণা।",
    zh: "😎 当然想！这是一个充满创意的激动概念。",
    ja: "😎 もちろんです！とても革新的でエキサイティングなアイデアです。",
    ar: "😎 بالتأكيد نعم! إنها فكرة مبتكرة ومثيرة."
  },
  q3OptionB: {
    it: "😢 No, preferisco i vecchi canali e la burocrazia ordinaria.",
    en: "😢 No, I prefer old paths and standard paperwork.",
    fr: "😢 Non, je préfère les voies traditionnelles et la bureaucratie.",
    es: "😢 No, prefiero los métodos antiguos y la burocracia tradicional.",
    pt: "😢 Não, prefiro os canais antigos e a burocracia comum.",
    ru: "😢 Нет, я предпочитаю старые методы и обычную бюрократию.",
    hi: "😢 नहीं, मैं पुराने तरीकों और सामान्य नौकरशाही को पसंद करता हूँ।",
    bn: "😢 না, আমি পুরোনো উপায় এবং সাধারণ আমলাতন্ত্র পছন্দ করি।",
    zh: "😢 不想，我更习惯传统管道和常规手续。",
    ja: "😢 いいえ、従来のやり方と手続きが好みです。",
    ar: "😢 لا، أفضّل الطرق القديمة والبيروقراطية التقليدية."
  },
  resultTitle: {
    it: "RISULTATO: Sei il cittadino ideale! 🌟🎉",
    en: "RESULT: You are the ideal citizen! 🌟🎉",
    fr: "RÉSULTAT : Vous êtes le citoyen idéal ! 🌟🎉",
    es: "RESULTADO: ¡Eres el ciudadano ideal! 🌟🎉",
    pt: "RESULTADO: Você é o cidadão ideal! 🌟🎉",
    ru: "РЕЗУЛЬТАТ: Вы идеальный гражданин! 🌟🎉",
    hi: "परिणाम: आप आदर्श नागरिक हैं! 🌟🎉",
    bn: "ফলাফল: আপনি একজন আদর্শ নাগরিক! 🌟🎉",
    zh: "测试结果：您是理想的公民！ 🌟🎉",
    ja: "診断結果：あなたは理想的な市民です！ 🌟🎉",
    ar: "النتيجة: أنت المواطن المثالي! 🌟🎉"
  },
  resultDesc: {
    it: "Hai risposto perfettamente! Le tue risposte indicano che ami la partecipazione attiva, apprezzi la libertà di pensiero e desideri guardare con fiducia alle nuove opportunità digitali. Sei pronto per far parte del New World State!",
    en: "You answered perfectly! Your choices indicate that you appreciate active participation, value freedom of thought, and look with confidence to new digital opportunities. You are ready to be part of the New World State!",
    fr: "Vous avez répondu parfaitement ! Vos choix montrent que vous appréciez la participation active, la liberté de pensée et les opportunités numériques. Vous êtes prêt à rejoindre le New World State !",
    es: "¡Respondiste perfectamente! Tus elecciones indican que aprecias la participación activa, valoras la libertad de pensamiento y confías en las nuevas oportunidades digitales.",
    pt: "Você respondeu perfeitamente! Suas escolhas mostram que você aprecia a participação ativa, valoriza a liberdade de pensamento e confia nas novas oportunidades digitais.",
    ru: "Вы ответили идеально! Ваш выбор показывает, что вы цените активное участие, свободу мысли и уверены в новых цифровых возможностях. Вы готовы стать частью New World State!",
    hi: "आपने बिल्कुल सही उत्तर दिया! आपकी पसंद दर्शाती है कि आप सक्रिय भागीदारी की सराहना करते हैं और नए डिजिटल अवसरों पर भरोसा करते हैं।",
    bn: "আপনি নিখুঁত উত্তর দিয়েছেন! আপনার পছন্দগুলি ইঙ্গিত করে যে আপনি সক্রিয় অংশগ্রহণ পছন্দ করেন এবং নতুন ডিজিটাল সুযোগের প্রতি আত্মবিশ্বাসী।",
    zh: "您的回答太棒了！这表明您热爱积极参与、重视思想自由，并充满信心拥抱数字新机遇。您已准备好成为新世界国家的一员！",
    ja: "素晴らしい回答です！あなたは主体的参加と自由な思考を大切にし、新しいデジタルの可能性に期待しています。新世界国家へ参加する準備が整いました！",
    ar: "إجاباتك ممتازة! تدل اختياراتك على أنك تقدر المشاركة الفعالة، وتحترم حرية التفكير، وتتطلع بخصوصية للفرص الرقمية الجديدة."
  },
  resultCta: {
    it: "Registrati subito! 🚀",
    en: "Register now! 🚀",
    fr: "Inscrivez-vous maintenant ! 🚀",
    es: "¡Regístrate ahora! 🚀",
    pt: "Registre-se agora! 🚀",
    ru: "Зарегистрироваться сейчас! 🚀",
    hi: "अभी पंजीकरण करें! 🚀",
    bn: "এখনই নিবন্ধন করুন! 🚀",
    zh: "立即注册！ 🚀",
    ja: "今すぐ登録する！ 🚀",
    ar: "سجل الآن! 🚀"
  },
  resultReset: {
    it: "Rifai il test",
    en: "Retake the test",
    fr: "Refaire le test",
    es: "Repetir el test",
    pt: "Refazer o teste",
    ru: "Пройти снова",
    hi: "पुनः परीक्षण लें",
    bn: "পুনরায় পরীক্ষা দিন",
    zh: "重新测试",
    ja: "もう一度テストする",
    ar: "إعادة الاختبار"
  }
};

export const PORTAL_CARDS_DATA: {
  badge: Record<Language, string>;
  title: Record<Language, string>;
  subtitle: Record<Language, string>;
  card1Title: Record<Language, string>;
  card1Desc: Record<Language, string>;
  card2Title: Record<Language, string>;
  card2Desc: Record<Language, string>;
  card3Title: Record<Language, string>;
  card3Desc: Record<Language, string>;
  card4Title: Record<Language, string>;
  card4Desc: Record<Language, string>;
} = {
  badge: {
    it: "La mappa del portale",
    en: "Portal Roadmap",
    fr: "La carte du portail",
    es: "Mapa del portal",
    pt: "Mapa do portal",
    ru: "Карта портала",
    hi: "पोर्टल का रोडमैप",
    bn: "পোর্টালের রোডম্যাপ",
    zh: "国家门户地图",
    ja: "ポータルマップ",
    ar: "خارطة البوابة"
  },
  title: {
    it: "Cosa trovi su questo sito?",
    en: "What can you find here?",
    fr: "Que trouverez-vous ici ?",
    es: "¿Qué puedes encontrar aquí?",
    pt: "O que você encontra aqui?",
    ru: "Что вы найдёте на этом сайте?",
    hi: "यहाँ आपको क्या मिलेगा?",
    bn: "এখানে আপনি কী পাবেন?",
    zh: "您可以在这里看到什么？",
    ja: "このサイトで何ができますか？",
    ar: "ماذا تجد في هذا الموقع؟"
  },
  subtitle: {
    it: "Un riassunto amichevole e immediato delle stanze principali del nostro Stato!",
    en: "A simple and friendly overview of the main areas of our digital environment!",
    fr: "Aperçu simple et convivial des principales sections de notre environnement !",
    es: "¡Un resumen claro y amigable de las secciones principales de nuestro entorno!",
    pt: "Um resumo amigável e direto das principais seções do nosso ambiente!",
    ru: "Простой и понятный обзор главных разделов нашего цифрового государства!",
    hi: "हमारे डिजिटल वातावरण के मुख्य क्षेत्रों का एक सरल और मित्रवत अवलोकन!",
    bn: "আমাদের ডিজিটাল পরিবেশের প্রধান ক্ষেত্রগুলির একটি সহজ সংক্ষেপ!",
    zh: "对我们数字国家主要区域的友好简明概览！",
    ja: "国家ポータルの主要エリアを分かりやすくご紹介します！",
    ar: "ملخص بسيط وودود للأقسام الرئيسية في بيئتنا الرقمية!"
  },
  card1Title: {
    it: "Referendum e Votazioni (Democrazia)",
    en: "Referendum & Voting (Democracy)",
    fr: "Référendum et vote (Démocratie)",
    es: "Referéndum y votación (Democracia)",
    pt: "Referendo e votação (Democracia)",
    ru: "Референдум и голосование (Демократия)",
    hi: "जनमत संग्रह और मतदान (लोकतंत्र)",
    bn: "গণভোট ও ভোটিং (গণতন্ত্র)",
    zh: "全民公投与表决（民主）",
    ja: "国民投票と表决（民主主義）",
    ar: "الاستفتائات والتصويت (الديمقراطية)"
  },
  card1Desc: {
    it: "È il cuore pulsante! Qui vedi le riforme proposte dai cittadini. Puoi leggere i dettagli e votare \"Favorevole\" o \"Contrario\", oppure proporre una tua idea d'interesse collettivo.",
    en: "The heart of our community! Here you can see proposals made by other citizens, view explanation details, vote 'In Favor' or 'Against', or submit your own ideas.",
    fr: "Le cœur de la communauté ! Consultez les propositions des citoyens, lisez les détails, votez 'Pour' ou 'Contre', ou soumettez vos propres idées.",
    es: "¡El corazón de la comunidad! Aquí ves las propuestas de los ciudadanos, lees los detalles, votas 'A Favor' o 'En Contra', o propones tus ideas.",
    pt: "O coração da comunidade! Veja as propostas dos cidadãos, leia os detalhes, vote 'A Favor' ou 'Contra', ou envie suas ideias.",
    ru: "Сердце нашей общины! Здесь вы можете просмотреть предложения граждан, изучить подробности, проголосовать «ЗА» или «ПРОТИВ», или предложить свою идею.",
    hi: "हमारी समुदाय का दिल! यहाँ आप अन्य नागरिकों के प्रस्ताव देख सकते हैं, विवरण पढ़ सकते हैं, 'पक्ष में' या 'विपक्ष में' वोट कर सकते हैं।",
    bn: "আমাদের সম্প্রদায়ের হৃদয়! এখানে আপনি প্রস্তাবগুলি দেখতে পারেন, বিশদ পড়তে পারেন, 'পক্ষে' বা 'বিপক্ষে' ভোট দিতে পারেন।",
    zh: "我们的核心版块！在这里您可以查看其他公民提出的改革提案、研读细则、投【赞成】或【反对】票，或提交您自己的构想。",
    ja: "国家の心臓部です！市民が提案した改革案を確認し、詳細を読んで「賛成」または「反対」を投票できます。",
    ar: "قلب مجتمعنا! هنا يمكنك رؤية المقترحات المقدمة من المواطنين، وقراءة التفاصيل والتصويت بـ 'موافق' أو 'غير موافق'."
  },
  card2Title: {
    it: "Le Regole dello Stato (Costituzione)",
    en: "Rules of the State (Constitution)",
    fr: "Règles de l'État (Constitution)",
    es: "Reglas del Estado (Constitución)",
    pt: "Regras do Estado (Constituição)",
    ru: "Правила Государства (Конституция)",
    hi: "राज्य के नियम (संविधान)",
    bn: "রাষ্ট্রের নিয়মাবলী (সংবিধান)",
    zh: "国家宪章与规则（宪法）",
    ja: "国家のルール（憲法）",
    ar: "قواعد الدولة (الدستور)"
  },
  card2Desc: {
    it: "Nessun linguaggio incomprensibile o polveroso. I nostri principi fondamentali sono scritti in modo chiaro, semplice e trasparente nella Costituzione e nella Carta dei Diritti.",
    en: "No complicated legal jargon. Our fundamental principles are presented in a clean, straightforward, and readable Constitution and Charter of Rights.",
    fr: "Pas de jargon juridique complexe. Nos principes fondamentaux sont rédigés de manière claire et transparente dans notre Constitution et Charte des droits.",
    es: "Sin jerga legal complicada. Nuestros principios fundamentales se presentan de forma clara y transparente en la Constitución y Carta de Derechos.",
    pt: "Sem jargões jurídicos complicados. Nossos princípios fundamentais estão escritos de forma clara na Constituição e Carta dos Direitos.",
    ru: "Никакой сложной юридической терминологии. Наши основные принципы изложены ясно и прозрачно в Конституции и Хартии прав.",
    hi: "कोई जटिल कानूनी शब्दावली नहीं। हमारे मूल सिद्धांत संविधान और अधिकारों के चार्टर में स्पष्ट और पारदर्शी रूप से प्रस्तुत किए गए हैं।",
    bn: "কোনো জটিল আইনি পরিভাষা নেই। আমাদের মৌলিক নীতিগুলি সংবিধান এবং অধিকার সনদে অত্যন্ত স্পষ্টভাবে উপস্থাপিত।",
    zh: "没有晦涩难懂的法律术语。我们的根本原则在《宪法》与《权利宪章》中以清晰直白的文字呈现。",
    ja: "難解な法律用語はありません。私たちの基本原則は、憲法および権利章典に明快かつ透明に記載されています。",
    ar: "لا مصطلحات قانونية معقدة. مبادئنا الأساسية مكتوبة بشكل واضح وشفاف في الدستور وميثاق الحقوق."
  },
  card3Title: {
    it: "Tutela dei tuoi Dati (Privacy)",
    en: "Data Protection & Privacy",
    fr: "Protection des données et confidentialité",
    es: "Protección de Datos y Privacidad",
    pt: "Proteção de Dados e Privacidade",
    ru: "Защита данных и конфиденциальность",
    hi: "डेटा सुरक्षा और गोपनीयता",
    bn: "ডেটা সুরক্ষা এবং গোপনীয়তা",
    zh: "数据保护与隐私安全",
    ja: "データ保護とプライバシー",
    ar: "حماية البيانات والخصوصية"
  },
  card3Desc: {
    it: "La tua sicurezza e la tua privacy sono per noi una priorità assoluta. Usiamo moderni protocolli di tutela per assicurarci che i dati inseriti siano protetti e al riparo da utilizzi impropri.",
    en: "Your safety and privacy are our highest priority. We employ robust protocols to ensure your credentials are fully safeguarded from any misuse.",
    fr: "Votre sécurité et votre vie privée sont notre priorité absolue. Nous utilisons des protocoles modernes pour protéger vos données contre tout abus.",
    es: "Tu seguridad y privacidad son nuestra máxima prioridad. Empleamos protocolos modernos para garantizar que tus datos estén protegidos.",
    pt: "Sua segurança e privacidade são nossa prioridade máxima. Usamos protocolos modernos para garantir que seus dados fiquem protegidos.",
    ru: "Ваша безопасность и конфиденциальность — наш высший приоритет. Мы используем современные протоколы для защиты ваших данных.",
    hi: "आपकी सुरक्षा और गोपनीयता हमारी सर्वोच्च प्राथमिकता है। हम यह सुनिश्चित करने के लिए आधुनिक प्रोटोकॉल का उपयोग करते हैं कि आपका डेटा सुरक्षित रहे।",
    bn: "আপনার নিরাপত্তা এবং গোপনীয়তা আমাদের সর্বোচ্চ অগ্রাধিকার। আপনার তথ্য নিরাপদ রাখতে আমরা আধুনিক প্রোটোকল ব্যবহার করি।",
    zh: "您的安全与隐私是我们的最高优先级。我们采用现代安全协议，确保您的个人数据获得完全保护。",
    ja: "あなたの安全とプライバシーは最優先事項です。最新の保護プロトコルを用いて情報を安全に保護します。",
    ar: "أمانك وخصوصيتك هما أولويتنا القصوى. نستخدم بروتوكولات حماية حديثة لضمان أمان بياناتك بشكل كامل."
  },
  card4Title: {
    it: "Consolle di Amministrazione",
    en: "Administration Console",
    fr: "Console d'Administration",
    es: "Consola de Administración",
    pt: "Console de Administração",
    ru: "Панель администратора",
    hi: "प्रशासन कंसोल",
    bn: "প্রশাসন কনসোল",
    zh: "行政管理控制台",
    ja: "管理コンソール",
    ar: "لوحة الإدارة السريّة"
  },
  card4Desc: {
    it: "L'area riservata ai delegati d'ufficio per l'aggiornamento dell'anagrafe, l'attivazione dei passaporti digitali in formato PDF e il supporto diretto a tutti i cittadini.",
    en: "An area reserved for verified officers to update the civil registry, approve digital PDF passport requests, and offer support to citizens.",
    fr: "Zone réservée aux agents pour la mise à jour du registre civil, l'activation des passeports PDF et l'assistance aux citoyens.",
    es: "Área reservada a oficiales para actualizar el registro civil, aprobar solicitudes de pasaportes PDF y brindar asistencia a los ciudadanos.",
    pt: "Área reservada aos oficiais para atualizar o registro civil, aprovar passaportes em PDF e dar suporte aos cidadãos.",
    ru: "Раздел для уполномоченных сотрудников: обновление реестра, подтверждение запросов на PDF-паспорта и поддержка граждан.",
    hi: "नागरिक पंजी का अद्यतन करने, डिजिटल पीडीएफ पासपोर्ट का अनुमोदन करने और नागरिकों की सहायता के लिए अधिकारियों का आरक्षित क्षेत्र।",
    bn: "নাগরিক পঞ্জি আপডেট করতে, ডিপিএফ পাসপোর্ট অ্যাপ্লিকেশন অনুমোদন করতে এবং নাগরিকদের সহায়তা করতে সংরক্ষিত এলাকা।",
    zh: "专供户籍官员更新民政名册、核发PDF数字护照以及为广大市民提供服务的专属控制台。",
    ja: "登録の更新、PDFパスポートの承認、市民のサポートを迅速に行うための担当者専用エリアです。",
    ar: "منطقة مخصصة للموظفين لتحديث السجل المدني، وتفعيل طلبات جوازات السفر بصيغة PDF وتقديم الدعم للمواطنين."
  }
};

export const FAQ_HEADER_DATA: {
  title: Record<Language, string>;
  subtitle: Record<Language, string>;
} = {
  title: {
    it: "Risposte semplici a domande comuni",
    en: "Simple answers to common questions",
    fr: "Réponses simples aux questions fréquentes",
    es: "Respuestas sencillas a preguntas frecuentes",
    pt: "Respostas simples a perguntas frequentes",
    ru: "Простые ответы на частые вопросы",
    hi: "सामान्य प्रश्नों के सरल उत्तर",
    bn: "সাধারণ প্রশ্নের সহজ উত্তর",
    zh: "常见问题的简单解答",
    ja: "よくある質問へのわかりやすい回答",
    ar: "إجابات بسيطة على الأسئلة الشائعة"
  },
  subtitle: {
    it: "Tutto quello che c'è da sapere, spiegato in totale trasparenza.",
    en: "Everything you need to know, explained in full transparency.",
    fr: "Tout ce que vous devez savoir, expliqué en toute transparence.",
    es: "Todo lo que necesitas saber, explicado con total transparencia.",
    pt: "Tudo o que você precisa saber, explicado com total transparência.",
    ru: "Всё, что вам нужно знать, объяснено с полной прозрачностью.",
    hi: "सब कुछ जो आपको जानना आवश्यक है, पूर्ण पारदर्शिता में समझाया गया है।",
    bn: "আপনার যা কিছু জানা দরকার, সম্পূর্ণ স্বচ্ছতার সাথে ব্যাখ্যা করা হয়েছে।",
    zh: "包含您所需了解的一切，以完全透明的方式呈现。",
    ja: "知っておくべきすべてのことを、完全な透明性で説明します。",
    ar: "كل ما تحتاج إلى معرفته، موضح بجميع مجالات الشفافية."
  }
};

export const FAQS_DATA: Record<Language, Array<{ q: string; a: string }>> = {
  it: [
    {
      q: "Cos'è esattamente il New World State?",
      a: "È una comunità globale e inclusiva. Immagina uno Stato vero e proprio, dotato di Costituzione e passaporti d'adesione, ma interamente digitale: non occorre trasferirsi o lasciare la propria casa! Consente a persone reali di tutto il pianeta di confrontarsi e deliberare pacificamente insieme."
    },
    {
      q: "Ci sono costi d'iscrizione o tasse da pagare?",
      a: "Assolutamente NO! 💸 L'adesione è gratuita al 100% per tutti e lo sarà per sempre. Non ci sono costi nascosti, abbonamenti o annunci pubblicitari di terze parti. Chiediamo soltanto il tuo interesse e la tua partecipazione attiva."
    },
    {
      q: "Perché è necessario caricare la foto di un documento d'identità?",
      a: "Per garantire il massimo livello di trasparenza e sicurezza reciproca. Dobbiamo verificare che ogni iscritto sia effettivamente una persona reale e non un profilo automatizzato o un robot dedito all'invio di posta indesiderata 🤖. I tuoi documenti vengono custoditi d'accordo con severi protocolli di riservatezza e non verranno mai ceduti o condivisi."
    },
    {
      q: "Cosa posso fare una volta completata la registrazione?",
      a: "Potrai consultare e votare nei referendum della democrazia diretta federale, ottenere il tuo passaporto digitale nominale certificato in formato PDF, proporre nuove iniziative popolari e persino essere eletto o designato a incarichi di servizio della nostra comunità."
    }
  ],
  en: [
    {
      q: "What exactly is the New World State?",
      a: "It is a global, inclusive digital community. Imagine a real state with its own Constitution and passports, but entirely digital: you don't need to move or leave your home! It allows real people from all over the world to discuss and vote on important things together."
    },
    {
      q: "Does it cost anything? Are there taxes?",
      a: "Absolutely NOT! 💸 Joining is 100% free and always will be. There are no fees, subscriptions, or third-party advertisements. We only ask for your interest and active participation."
    },
    {
      q: "Why do you require document verification photos?",
      a: "To ensure mutual safety and complete transparency. We must verify that every single member is a real human being and not a computerized bot or spam profile 🤖. Your document photos are secured under strict privacy standards and will never be shared or commercialized."
    },
    {
      q: "What can I do once I become a Citizen?",
      a: "You can view and vote on our direct democracy laws, obtain your officially signed digital Passport in PDF format, submit your own law proposals, and even be assigned to operational service roles in our digital community."
    }
  ],
  fr: [
    {
      q: "Qu'est-ce que le New World State exactement ?",
      a: "C'est une communauté numérique mondiale et inclusive. Imaginez un véritable État avec sa Constitution et ses passeports, mais entièrement virtuel : vous n'avez pas besoin de déménager ! Il permet aux citoyens du monde entier de délibérer ensemble paisiblement."
    },
    {
      q: "Y a-t-il des frais d'inscription ou des taxes ?",
      a: "Absolument NON ! 💸 L'adhésion est 100% gratuite pour tous et le restera toujours. Aucun frais caché, abonnement ou publicité externe. Nous ne demandons que votre participation active."
    },
    {
      q: "Pourquoi faut-il fournir une photo de pièce d'identité ?",
      a: "Pour garantir la transparence et la sécurité réciproque. Nous devons vérifier que chaque membre est une vraie personne et non un robot automatique 🤖. Vos documents sont sécurisés sous de strictes normes de confidentialité."
    },
    {
      q: "Que puis-je faire une fois l'inscription terminée ?",
      a: "Vous pourrez voter aux référendums de la démocratie directe, obtenir votre passeport numérique certifié en PDF, proposer des lois et être élu à des postes de service de la communauté."
    }
  ],
  es: [
    {
      q: "¿Qué es exactamente el New World State?",
      a: "Es una comunidad digital global e inclusiva. Imagina un estado real con Constitución y pasaportes, pero totalmente digital: ¡sin necesidad de mudarte! Permite a personas reales de todo el planeta debatire y votar pacíficamente."
    },
    {
      q: "¿Hay costos de inscripción o impuestos?",
      a: "¡Absolutamente NO! 💸 Unirse es 100% gratuito para todos y siempre lo será. No hay cargos ocultos, suscripciones ni publicidad. Solo pedimos tu interés y participación activa."
    },
    {
      q: "¿Por qué se requiere foto de un documento de identidad?",
      a: "Para garantizar la máxima transparencia y seguridad mutua. Debemos verificar que cada miembro sea una persona real y no un perfil automatizado 🤖. Tus documentos están protegidos bajo estrictas normas de privacidad."
    },
    {
      q: "¿Qué puedo hacer una vez completado el registro?",
      a: "Podrás votar en las consultas populares de democracia directa, obtener tu pasaporte digital firmado en PDF, proponer iniciativas ciudadanas y participar en cargos de servicio comunitario."
    }
  ],
  pt: [
    {
      q: "O que é exatamente o New World State?",
      a: "É uma comunidade digital global e inclusiva. Imagine um Estado real com Constituição e passaportes, mas totalmente digital: sem precisar mudar de casa! Permite que pessoas reais de todo o mundo discutam e votem juntas."
    },
    {
      q: "Há custos de inscrição ou impostos?",
      a: "Absolutamente NÃO! 💸 A adesão é 100% gratuita para todos e sempre será. Não há taxas ocultas, assinaturas ou anúncios. Pedimos apenas seu interesse e participação ativa."
    },
    {
      q: "Por que é necessário enviar foto do documento de identidade?",
      a: "Para garantir segurança e transparência totais. Precisamos verificar se cada membro é uma pessoa real e não um robô automatizado 🤖. Seus documentos são protegidos por rígidos padrões de privacidade."
    },
    {
      q: "O que posso fazer após concluir o registro?",
      a: "Você poderá votar nos referendos da democracia direta, obter seu passaporte digital em PDF certificado, propor projetos de lei e até assumir funções de serviço na comunidade."
    }
  ],
  ru: [
    {
      q: "Что такое New World State?",
      a: "Это глобальное инклюзивное цифровое сообщество. Представьте реальное государство с Конституцией и паспортами, но полностью виртуальное: не нужно никуда переезжать! Оно позволяет людям со всего мира мирно обсуждать и принимать решения вместе."
    },
    {
      q: "Есть ли регистрационные сборы или налоги?",
      a: "Абсолютно НЕТ! 💸 Участие на 100% бесплатно и всегда будет таким. Никаких скрытых платежей, подписок или рекламы. Мы просим лишь интерес и активное участие."
    },
    {
      q: "Зачем нужна фотография удостоверения личности?",
      a: "Для обеспечения полной безопасности и прозрачности. Мы должны убедиться, что каждый участник — реальный человек, а не бот 🤖. Ваши документы защищены строгими протоколами конфиденциальности."
    },
    {
      q: "Что я смогу делать после завершения регистрации?",
      a: "Вы сможете голосовать на прямых референдумах, получить официальный PDF-паспорт, предлагать свои общественные инициативы и занимать должности в сообществе."
    }
  ],
  hi: [
    {
      q: "न्यू वर्ल्ड स्टेट वास्तव में क्या है?",
      a: "यह एक वैश्विक, समावेशी डिजिटल समुदाय है। अपने संविधान और पासपोर्ट के साथ एक वास्तविक राज्य की कल्पना करें, लेकिन पूरी तरह से डिजिटल: आपको अपना घर छोड़ने की आवश्यकता नहीं है! यह दुनिया भर के लोगों को एक साथ शांतिपूर्वक चर्चा करने की अनुमति देता है।"
    },
    {
      q: "क्या कोई पंजीकरण शुल्क या कर है?",
      a: "बिल्कुल नहीं! 💸 सदस्यता सभी के लिए 100% मुफ़्त है और हमेशा रहेगी। कोई छिपा हुआ शुल्क या विज्ञापन नहीं हैं। हम केवल आपकी सक्रिय भागीदारी चाहते हैं।"
    },
    {
      q: "पहचान पत्र की तस्वीर की आवश्यकता क्यों है?",
      a: "आपसी सुरक्षा और पूर्ण पारदर्शिता सुनिश्चित करने के लिए। हमें यह सत्यापित करना होगा कि प्रत्येक सदस्य एक वास्तविक व्यक्ति है, कोई बॉट नहीं 🤖। आपकी दस्तावेज़ तस्वीरें सख्त गोपनीयता मानकों के तहत सुरक्षित हैं।"
    },
    {
      q: "पंजीकरण पूरा होने पर मैं क्या कर सकता हूँ?",
      a: "आप प्रत्यक्ष लोकतंत्र कानूनों पर मतदान कर सकते हैं, पीडीएफ प्रारूप में अपना आधिकारिक डिजिटल पासपोर्ट प्राप्त कर सकते हैं, और अपने स्वयं के प्रस्ताव प्रस्तुत कर सकते हैं।"
    }
  ],
  bn: [
    {
      q: "নিউ ওয়ার্ল্ড স্টেট আসলে কী?",
      a: "এটি একটি বিশ্বব্যাপী, অন্তর্ভুক্তিভিত্তিক ডিজিটাল সম্প্রদায়। নিজস্ব সংবিধান এবং পাসপোর্ট সহ একটি প্রকৃত রাষ্ট্রের কথা চিন্তা করুন, তবে সম্পূর্ণ ডিজিটাল! এটি সারা বিশ্বের মানুষকে একসঙ্গে আলোচনা করতে দেয়।"
    },
    {
      q: "কোনো নিবন্ধন মূল্য বা ট্যাক্স আছে?",
      a: "একদম না! 💸 যোগদান সকলের জন্য ১০০% বিনামূল্যে এবং সর্বদা তাই থাকবে। কোনো লুকানো ফি বা বিজ্ঞাপন নেই। আমরা শুধু আপনার সক্রিয় অংশগ্রহণ চাই।"
    },
    {
      q: "পরিচয়পত্রের ছবি কেন আবশ্যক?",
      a: "সম্পূর্ণ স্বচ্ছতা এবং নিরাপত্তা নিশ্চিত করতে। প্রতিটি সদস্য বোটের বদলে একজন প্রকৃত মানুষ কিনা তা যাচাই করা প্রয়োজন 🤖। আপনার নথি গোপনীয়তার সাথে সুরক্ষিত থাকবে।"
    },
    {
      q: "নিবন্ধন সম্পন্ন হলে আমি কী করতে পারব?",
      a: "আপনি প্রত্যক্ষ গণতন্ত্রের ভোটগুলিতে অংশগ্রহণ করতে পারবেন, আপনার পিডিএফ পাসপোর্ট পেতে পারেন এবং নতুন আইন প্রস্তাব করতে পারবেন।"
    }
  ],
  zh: [
    {
      q: "新世界国家到底是什么？",
      a: "这是一个包容性的全球数字社区。想象一个拥有宪法和护照的真正国家，但完全存在于数字空间：您无需搬家！它让来自世界各地的人们能够和平平等地探讨和共同裁决大事。"
    },
    {
      q: "有注册费用或税费吗？",
      a: "绝对没有！ 💸 加入对所有人100%免费，并且永远保持免费。没有任何隐藏费用、订阅费或第三方广告。我们只期待您的关注与积极参与。"
    },
    {
      q: "为什么需要上传身份证明照片？",
      a: "为了确保相互安全与高度透明。我们必须确认每位公民都是真实的存在，而非自动化机器人或垃圾账号 🤖。您的证件照将严格按照高标准隐私协议予以加密保护。"
    },
    {
      q: "完成注册后我可以做什么？",
      a: "您可以参与联邦直接民主投票、获取专属PDF格式的数字认证护照、提交您的法案提案，甚至被选为社区服务官员。"
    }
  ],
  ja: [
    {
      q: "新世界国家（New World State）とは何ですか？",
      a: "グローバルで包摂的なデジタルコミュニティです。憲法とパスポートを備えた本物の国家を想像してみてください。ただし完全オンラインなので引っ越す必要はありません！世界中の人々が平和に議論し、直接投票できます。"
    },
    {
      q: "登録料や税金はかかりますか？",
      a: "一切かかりません！ 💸 参加は完全に100%無料です。隠れた費用、サブスクリプション、広告はありません。必要なのはあなたの関心と積極的な参加だけです。"
    },
    {
      q: "なぜ本人確認書類の写真が必要なのですか？",
      a: "互いの transparency と安全を確保するためです。すべての登録者が自動ボットではなく実在する人物であることを確認しています 🤖。提出された書類は厳重なプライバシー基準のもとで保護されます。"
    },
    {
      q: "登録が完了すると何ができますか？",
      a: "直接民主主義の国民投票への参加、PDF形式のデジタルパスポートの取得、新ルールの提案、コミュニティでの役割担当などが可能です。"
    }
  ],
  ar: [
    {
      q: "ما هي دولة العالم الجديد (New World State) بالضبط؟",
      a: "إنها مجتمع رقمي عالمي وشامل. تخيل دولة حقيقية لها دستورها وجوازات سفرها، لكنها رقمية بالكامل: لا داعي للانتقال أو ترك منزلك! تسمح للأفراد الحقيقيين من جميع أنحاء العالم بالنقاش والتصويت السلمي معاً."
    },
    {
      q: "هل هناك أي رسوم تسجيل أو ضرائب؟",
      a: "قطعا لا! 💸 الانضمام مجاني 100% للجميع وسيبقى كذلك دائماً. لا توجد رسوم خفية أو اشتراكات أو إعلانات. كل ما نطلبه هو اهتمامك ومشاركتك الفعالة."
    },
    {
      q: "لماذا يتطلب الأمر رفع صورة وثيقة الهوية؟",
      a: "لضمان أقصى درجات الشفافية والأمان المتبادل. يجب أن نتحقق من أن كل عضو هو شخص حقيقي وليس حساباً آلياً أو روبوت 🤖. يتم حفظ وثائقك وفق أعلى معايير الخصوصية."
    },
    {
      q: "ماذا يمكنني أن أفعل بمجرد إكمال التسجيل؟",
      a: "يمكنك المشاركة والتصويت في استفتاءات الديمقراطية المباشرة، والحصول على جواز سفرك الرقمي بصيغة PDF، وتقديم مقترحات قوانين جديدة."
    }
  ]
};

export const FINAL_BANNER_DATA: {
  title: Record<Language, string>;
  desc: Record<Language, string>;
  cta: Record<Language, string>;
  copyright: Record<Language, string>;
} = {
  title: {
    it: "Partecipa a una nuova era digitale",
    en: "Join a New Digital Era",
    fr: "Rejoignez une nouvelle ère numérique",
    es: "Únete a una nueva era digital",
    pt: "Junte-se a uma nova era digital",
    ru: "Присоединяйтесь к новой цифровой эре",
    hi: "एक नए डिजिटल युग में शामिल हों",
    bn: "একটি নতুন ডিজিটাল যুগে যোগ দিন",
    zh: "加入全新的数字时代",
    ja: "新しいデジタル時代に参加しよう",
    ar: "انضم إلى عصر رقمي جديد"
  },
  desc: {
    it: "Bastano soli due minuti per registrare i propri dati in totale sicurezza ed entrare a far parte di questa innovativa rete pacifica e federale.",
    en: "It only takes two minutes to secure your details and register into this peaceful and innovative global community.",
    fr: "Il ne faut que deux minutes pour sécuriser vos données et vous inscrire à cette communauté mondiale pacifique et innovante.",
    es: "Solo toma dos minutos asegurar tus datos e inscribirte en esta comunidad global pacífica e innovadora.",
    pt: "Leva apenas dois minutos para proteger seus dados e se registrar nesta comunidade global pacífica e inovadora.",
    ru: "Регистрация в этом мирном и инновационном сообществе займёт всего две минуты в полной безопасности.",
    hi: "इस शांतिपूर्ण और अभिनव वैश्विक समुदाय में अपने विवरण सुरक्षित करने और पंजीकरण करने में केवल दो मिनट लगते हैं।",
    bn: "এই শান্তিপূর্ণ এবং উদ্ভাবনী বিশ্ব সম্প্রদায়ে আপনার তথ্য সুরক্ষিত করতে এবং নিবন্ধন করতে মাত্র দুই মিনিট সময় লাগে।",
    zh: "仅需两分钟即可安全提交您的资料，正式加入这个充满活力与和平的全新全球社区。",
    ja: "たった2分で安全に情報を登録し、この平和的で革新的なグローバルコミュニティに参加できます。",
    ar: "يستغرق الأمر دقيقتين فقط لتأمين بياناتك والتسجيل في هذا المجتمع العالمي السلمي والمبتكر."
  },
  cta: {
    it: "Inizia la Registrazione Gratuita Ora! ✍️",
    en: "Start Free Registration Now! ✍️",
    fr: "Commencez l'inscription gratuite ! ✍️",
    es: "¡Comienza el registro gratuito ahora! ✍️",
    pt: "Inicie o registro gratuito agora! ✍️",
    ru: "Начать бесплатную регистрацию! ✍️",
    hi: "अब मुफ़्त पंजीकरण शुरू करें! ✍️",
    bn: "এখনই বিনামূল্যে নিবন্ধন শুরু করুন! ✍️",
    zh: "立即开始免费注册！ ✍️",
    ja: "今すぐ無料登録を始める！ ✍️",
    ar: "ابدأ التسجيل المجاني الآن! ✍️"
  },
  copyright: {
    it: "Controllato e garantito dal Protocollo Federale New World State © 2026",
    en: "Secured and verified under the New World State Federal Protocol © 2026",
    fr: "Sécurisé et vérifié sous le protocole fédéral New World State © 2026",
    es: "Garantizado y verificado bajo el Protocolo Federal New World State © 2026",
    pt: "Garantido e verificado sob o Protocolo Federal New World State © 2026",
    ru: "Защищено и проверено Федеральным протоколом New World State © 2026",
    hi: "न्यू वर्ल्ड स्टेट फेडरल प्रोटोकॉल © 2026 के तहत सुरक्षित और सत्यापित",
    bn: "নিউ ওয়ার্ল্ড স্টেট ফেডারেল প্রোটোকল © ২০২৬ এর অধীনে সুরক্ষিত এবং নিবন্ধিত",
    zh: "已通过新世界国家联邦安全协议验证 © 2026",
    ja: "New World State 連邦プロトコルにより安全に管理されています © 2026",
    ar: "محمي ومحقق بموجب بروتوكول دولة العالم الجديد الفيدرالي © 2026"
  }
};

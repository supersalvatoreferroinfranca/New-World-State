import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Send, 
  Mail, 
  Copy, 
  Check, 
  MessageSquare, 
  Sparkles, 
  Users, 
  Heart,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { Language } from '../../constants/translations';

const WIDGET_UI_TEXTS: Record<Language, {
  outreachBadge: string;
  spreadTitle: string;
  spreadDesc: string;
  recipientLabel: string;
  recipientPlaceholder: string;
  chooseToneLabel: string;
  clickShareLabel: string;
  shareWhatsapp: string;
  shareTelegram: string;
  sendEmail: string;
  copyText: string;
  textCopied: string;
  copiedShort: string;
  nativeShare: string;
  livePreview: string;
  costFreeNote: string;
  inviteFriendsTitle: string;
  inviteFriendsDesc: string;
}> = {
  it: {
    outreachBadge: "Diffusione Sovrana",
    spreadTitle: "Divulgazione: Fai conoscere lo Stato",
    spreadDesc: "Offri ai tuoi cari e ai tuoi amici l'opportunità di far parte di una società digitale pacifica e libera. Scegli un messaggio, personalizzalo e condividilo gratuitamente.",
    recipientLabel: "Nome della persona cara (Opzionale)",
    recipientPlaceholder: "es. Maria, Francesco, Mamma",
    chooseToneLabel: "Scegli il tono del messaggio",
    clickShareLabel: "Clicca per inviare all'istante",
    shareWhatsapp: "Invia su WhatsApp",
    shareTelegram: "Invia su Telegram",
    sendEmail: "Invia via Email",
    copyText: "Copia testo invito",
    textCopied: "Testo copiato!",
    copiedShort: "Copiato!",
    nativeShare: "Condividi tramite sistema operativo",
    livePreview: "Anteprima reale del messaggio",
    costFreeNote: "Strumenti a costo zero. I collegamenti sfruttano i link ufficiali protetti per avviare direttamente WhatsApp, Telegram ed Email senza tracciamenti o server intermedi.",
    inviteFriendsTitle: "Invita amici e parenti",
    inviteFriendsDesc: "Fai conoscere il New World State alle persone care! Invia un invito rapido tramite le tue piattaforme preferite."
  },
  en: {
    outreachBadge: "Sovereign Outreach",
    spreadTitle: "Spread the message: Share the State",
    spreadDesc: "Offer your loved ones the chance to join a peaceful and free digital society. Choose a preset, customize it, and share for free.",
    recipientLabel: "Recipient's name (Optional)",
    recipientPlaceholder: "e.g. Marie, John, Mum",
    chooseToneLabel: "Choose message tone",
    clickShareLabel: "Click to share instantly",
    shareWhatsapp: "Share on WhatsApp",
    shareTelegram: "Share on Telegram",
    sendEmail: "Send via Email",
    copyText: "Copy message text",
    textCopied: "Text copied!",
    copiedShort: "Copied!",
    nativeShare: "Share using device tools",
    livePreview: "Live Message Preview",
    costFreeNote: "Cost-free tools. Direct links utilize official secure deep links to trigger native apps on mobile/desktop without any tracking or intermediate servers.",
    inviteFriendsTitle: "Invite friends and family",
    inviteFriendsDesc: "Spread the word about the New World State! Share a quick invite via your favorite platforms."
  },
  fr: {
    outreachBadge: "Diffusion Souveraine",
    spreadTitle: "Partagez le message : Faites connaître l'État",
    spreadDesc: "Offrez à vos proches l'opportunité de rejoindre une société numérique paisible et libre. Choisissez un message, personnalisez-le et partagez-le gratuitement.",
    recipientLabel: "Nom du destinataire (Optionnel)",
    recipientPlaceholder: "ex. Marie, Jean, Maman",
    chooseToneLabel: "Choisissez le ton du message",
    clickShareLabel: "Cliquez pour partager instantanément",
    shareWhatsapp: "Envoyer sur WhatsApp",
    shareTelegram: "Envoyer sur Telegram",
    sendEmail: "Envoyer par e-mail",
    copyText: "Copier le texte d'invitation",
    textCopied: "Texte copié !",
    copiedShort: "Copié !",
    nativeShare: "Partager via les outils du système",
    livePreview: "Aperçu en direct du message",
    costFreeNote: "Outils gratuits. Les liens directs utilisent des liens sécurisés officiels sans aucun suivi ni serveur intermédiaire.",
    inviteFriendsTitle: "Inviter des amis et des proches",
    inviteFriendsDesc: "Faites connaître le New World State ! Envoyez une invitation rapide via vos plateformes préférées."
  },
  es: {
    outreachBadge: "Difusión Soberana",
    spreadTitle: "Difusión: Da a conocer el Estado",
    spreadDesc: "Ofrece a tus seres queridos la oportunidad de formar parte de una sociedad digital pacífica y libre. Elige un mensaje, personalízalo y compártelo gratis.",
    recipientLabel: "Nombre del destinatario (Opcional)",
    recipientPlaceholder: "ej. María, Carlos, Mamá",
    chooseToneLabel: "Elige el tono del mensaje",
    clickShareLabel: "Haz clic para enviar al instante",
    shareWhatsapp: "Enviar por WhatsApp",
    shareTelegram: "Enviar por Telegram",
    sendEmail: "Enviar por Email",
    copyText: "Copiar texto de invitación",
    textCopied: "¡Texto copiado!",
    copiedShort: "¡Copiado!",
    nativeShare: "Compartir usando herramientas del sistema",
    livePreview: "Vista previa en vivo del mensaje",
    costFreeNote: "Herramientas gratuitas. Los enlaces utilizan conexiones seguras oficiales para abrir apps directamente sin rastreo.",
    inviteFriendsTitle: "Invitar a amigos y familiares",
    inviteFriendsDesc: "¡Da a conocer el New World State! Envía una invitación rápida desde tus plataformas favoritas."
  },
  pt: {
    outreachBadge: "Difusão Soberana",
    spreadTitle: "Divulgação: Torne o Estado conhecido",
    spreadDesc: "Ofereça aos seus entes queridos a oportunidade de fazer parte de uma sociedade digital pacífica e livre. Escolha uma mensagem, personalize e compartilhe gratuitamente.",
    recipientLabel: "Nome do destinatário (Opcional)",
    recipientPlaceholder: "ex. Maria, João, Mãe",
    chooseToneLabel: "Escolha o tom da mensagem",
    clickShareLabel: "Clique para enviar instantaneamente",
    shareWhatsapp: "Enviar pelo WhatsApp",
    shareTelegram: "Enviar pelo Telegram",
    sendEmail: "Enviar por E-mail",
    copyText: "Copiar texto do convite",
    textCopied: "Texto copiado!",
    copiedShort: "Copiado!",
    nativeShare: "Compartilhar usando ferramentas do dispositivo",
    livePreview: "Pré-visualização da mensagem",
    costFreeNote: "Ferramentas gratuitas. Os links diretos utilizam conexões oficiais seguras para acionar aplicativos nativos sem rastreamento.",
    inviteFriendsTitle: "Convidar amigos e familiares",
    inviteFriendsDesc: "Espalhe a mensagem sobre o New World State! Compartilhe um convite rápido em suas plataformas favoritas."
  },
  ru: {
    outreachBadge: "Суверенное распространение",
    spreadTitle: "Распространение: Расскажите о Государстве",
    spreadDesc: "Подарите своим близким возможность стать частью мирного и свободного цифрового общества. Выберите сообщение, настройте его и поделитесь бесплатно.",
    recipientLabel: "Имя получателя (Необязательно)",
    recipientPlaceholder: "например, Мария, Александр, Мама",
    chooseToneLabel: "Выберите тон сообщения",
    clickShareLabel: "Нажмите для мгновенной отправки",
    shareWhatsapp: "Отправить в WhatsApp",
    shareTelegram: "Отправить в Telegram",
    sendEmail: "Отправить по Email",
    copyText: "Скопировать текст приглашения",
    textCopied: "Текст скопирован!",
    copiedShort: "Скопировано!",
    nativeShare: "Поделиться через систему",
    livePreview: "Предварительный просмотр сообщения",
    costFreeNote: "Бесплатные инструменты. Прямые ссылки используют официальные защищённые ссылки без отслеживания и промежуточных серверов.",
    inviteFriendsTitle: "Пригласить друзей и близких",
    inviteFriendsDesc: "Расскажите о New World State! Отправьте быстрое приглашение через ваши любимые платформы."
  },
  hi: {
    outreachBadge: "संप्रभु आउटरीच",
    spreadTitle: "प्रचार: राज्य का संदेश फैलाएं",
    spreadDesc: "अपने प्रियजनों को एक शांतिपूर्ण और स्वतंत्र डिजिटल समाज का हिस्सा बनने का अवसर दें। एक संदेश चुनें, उसे अनुकूलित करें और मुफ़्त में साझा करें।",
    recipientLabel: "प्राप्तकर्ता का नाम (वैकल्पिक)",
    recipientPlaceholder: "जैसे राहुल, प्रिया, माँ",
    chooseToneLabel: "संदेश का टोन चुनें",
    clickShareLabel: "तुरंत साझा करने के लिए क्लिक करें",
    shareWhatsapp: "WhatsApp पर भेजें",
    shareTelegram: "Telegram पर भेजें",
    sendEmail: "Email द्वारा भेजें",
    copyText: "निमंत्रण पाठ कॉपी करें",
    textCopied: "पाठ कॉपी किया गया!",
    copiedShort: "कॉपी किया!",
    nativeShare: "डिवाइस टूल द्वारा साझा करें",
    livePreview: "संदेश का लाइव पूर्वावलोकन",
    costFreeNote: "मुफ़्त उपकरण। सीधे लिंक बिना किसी ट्रैकिंग या मध्यस्थ सर्वर के मूल ऐप्स लॉन्च करने के लिए आधिकारिक सुरक्षित लिंक का उपयोग करते हैं।",
    inviteFriendsTitle: "मित्रों और परिवार को आमंत्रित करें",
    inviteFriendsDesc: "न्यू वर्ल्ड स्टेट का संदेश फैलाएं! अपने पसंदीदा प्लेटफार्मों के माध्यम से एक त्वरित निमंत्रण साझा करें।"
  },
  bn: {
    outreachBadge: "সার্বভৌম আউটরিচ",
    spreadTitle: "প্রচার: রাষ্ট্রীয় বার্তা ছড়িয়ে দিন",
    spreadDesc: "আপনার প্রিয়জনদের একটি শান্তিপূর্ণ এবং মুক্ত ডিজিটাল সমাজের অংশ হওয়ার সুযোগ দিন। একটি বার্তা চয়ন করুন, এটি ব্যক্তিগতকরণ করুন এবং বিনামূল্যে ভাগ করুন।",
    recipientLabel: "প্রাপকের নাম (ঐচ্ছিক)",
    recipientPlaceholder: "যেমন রহিম, ফাতেমা, মা",
    chooseToneLabel: "বার্তার টোন চয়ন করুন",
    clickShareLabel: "অবিলম্বে শেয়ার করতে ক্লিক করুন",
    shareWhatsapp: "WhatsApp-এ পাঠান",
    shareTelegram: "Telegram-এ পাঠান",
    sendEmail: "Email মাধ্যমে পাঠান",
    copyText: "আমন্ত্রণ পাঠ্য কপি করুন",
    textCopied: "পাঠ্য কপি করা হয়েছে!",
    copiedShort: "কপি করা হয়েছে!",
    nativeShare: "ডিভাইস টুল দ্বারা শেয়ার করুন",
    livePreview: "লাইভ বার্তার পূর্বরূপ",
    costFreeNote: "বিনামূল্যের সরঞ্জাম। সরাসরি লিঙ্কগুলি ট্রেকিং বা মধ্যবর্তী সার্ভার ছাড়াই অ্যাপ্লিকেশন চালু করার জন্য সুরক্ষিত লিঙ্ক ব্যবহার করে।",
    inviteFriendsTitle: "বন্ধু এবং পরিবারকে আমন্ত্রণ জানান",
    inviteFriendsDesc: "নিউ ওয়ার্ল্ড স্টেট সম্পর্কে সবাইকে জানান! আপনার প্রিয় প্ল্যাটফর্মের মাধ্যমে দ্রুত আমন্ত্রণ শেয়ার করুন।"
  },
  zh: {
    outreachBadge: "主权传播",
    spreadTitle: "推广传播：让更多人了解国家",
    spreadDesc: "给您的亲朋好友一个加入和平自由数字社会的机会。选择预设消息，个性化定制并免费分享。",
    recipientLabel: "接收者姓名（可选）",
    recipientPlaceholder: "例如：张伟、小明、妈妈",
    chooseToneLabel: "选择消息语气",
    clickShareLabel: "点击立即分享",
    shareWhatsapp: "通过 WhatsApp 分享",
    shareTelegram: "通过 Telegram 分享",
    sendEmail: "通过邮件发送",
    copyText: "复制邀请文本",
    textCopied: "文本已复制！",
    copiedShort: "已复制！",
    nativeShare: "使用系统原生工具分享",
    livePreview: "实时消息预览",
    costFreeNote: "完全免费的工具。直接链接使用官方加密直连，无任何追踪或中间服务器。",
    inviteFriendsTitle: "邀请亲朋好友",
    inviteFriendsDesc: "传播新世界国家理念！通过您最喜爱的平台发送快速邀请。"
  },
  ja: {
    outreachBadge: "主権アウトリーチ",
    spreadTitle: "広報：国家のメッセージを広めよう",
    spreadDesc: "愛する人々に、平和で自由なデジタル社会の仲間になる機会を贈りましょう。メッセージを選択・カスタマイズし、無料で共有できます。",
    recipientLabel: "受信者の名前（任意）",
    recipientPlaceholder: "例：太郎、花子、お母さん",
    chooseToneLabel: "メッセージのトーンを選択",
    clickShareLabel: "クリックして今すぐ共有",
    shareWhatsapp: "WhatsAppで共有",
    shareTelegram: "Telegramで共有",
    sendEmail: "メールで送信",
    copyText: "招待テキストをコピー",
    textCopied: "テキストをコピーしました！",
    copiedShort: "コピー完了！",
    nativeShare: "デバイスの共有機能を使用",
    livePreview: "メッセージのライブプレビュー",
    costFreeNote: "完全無料のツール。追跡や中間サーバーを介さず、公式の安全な深層リンクでネイティブアプリを直接起動します。",
    inviteFriendsTitle: "友人や家族を招待する",
    inviteFriendsDesc: "新世界国家のメッセージを広めよう！お気に入りのプラットフォームで迅速に招待できます。"
  },
  ar: {
    outreachBadge: "النشر السيادي",
    spreadTitle: "النشر: عرّف الآخرين بالدولة",
    spreadDesc: "أتح لأحبائك وأصدقائك فرصة أن يكونوا جزءاً من مجتمع رقمي سلمي وحر. اختر رسالة، وخصصها، وشاركها مجاناً.",
    recipientLabel: "اسم المستلم (اختياري)",
    recipientPlaceholder: "مثال: أحمد، سارة، أمي",
    chooseToneLabel: "اختر نبرة الرسالة",
    clickShareLabel: "انقر للمشاركة فوراً",
    shareWhatsapp: "إرسال عبر WhatsApp",
    shareTelegram: "إرسال عبر Telegram",
    sendEmail: "إرسال عبر البريد الإلكتروني",
    copyText: "نسخ نص الدعوة",
    textCopied: "تم نسخ النص!",
    copiedShort: "تم النسخ!",
    nativeShare: "المشاركة عبر أدوات النظام",
    livePreview: "معاينة مباشرة للرسالة",
    costFreeNote: "أدوات مجانية بالكامل. تستخدم الروابط المباشرة روابط رسمية آمنة دون أي تتبع أو خوادم وسيطة.",
    inviteFriendsTitle: "دعوة الأصدقاء والعائلة",
    inviteFriendsDesc: "انشر رسالة دولة العالم الجديد! شارك دعوة سريعة عبر منصاتك المفضلة."
  }
};

export function NWSShareWidget({ className = '', variant = 'standard' }: { className?: string; variant?: 'standard' | 'compact' | 'hero' }) {
  const { language } = useI18n();
  const [recipientName, setRecipientName] = useState('');
  const [messageStyle, setMessageStyle] = useState<'friendly' | 'inspiring' | 'informative'>('friendly');
  const [copied, setCopied] = useState(false);
  const [shareText, setShareText] = useState('');

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://newworldstate.cloud';

  // Preformatted messages for 11 supported languages
  const messages: Record<string, Record<'friendly' | 'inspiring' | 'informative', { title: string; subject: string; body: (name: string) => string }>> = {
    it: {
      friendly: {
        title: "Amichevole & Caldo",
        subject: "Unisciti a me nel New World State! 🌟",
        body: (name: string) => `Ciao${name ? ' ' + name : ''}! volevo farti conoscere un progetto pazzesco a cui ho appena aderito: il New World State. È uno Stato Digitale pacifico e globale, basato sul libero arbitrio e su una Costituzione bellissima. L'adesione è gratuita al 100% e ti rilasciano anche un passaporto digitale nominale in PDF! Dai un'occhiata qui, mi farebbe un sacco piacere se ne facessi parte anche tu. Facciamo passaparola per far crescere la nostra comunità pacifica e libera: ${appUrl}`
      },
      inspiring: {
        title: "Ispiratore & Solenne",
        subject: "Una nuova era di libertà digitale: New World State 🌍",
        body: (name: string) => `Caro${name ? ' ' + name : ' amico'}, ti invito a leggere e aderire alla Costituzione del New World State. Una nazione interamente digitale, pacifica e globale che unisce cittadini di ogni continente per deliberare insieme con la democrazia diretta. Unisciti a questa rivoluzione di libertà e sovranità digitale. L'adesione è gratuita ed aperta a tutti: aiutaci a far crescere la comunità condividendo questo invito con le persone di cui ti fidi! Passa parola: ${appUrl}`
      },
      informative: {
        title: "Informativo & Semplice",
        subject: "Come ottenere il passaporto del New World State 💳",
        body: (name: string) => `Ciao${name ? ' ' + name : ''}! Ti segnalo il New World State, una comunità digitale mondiale. Bastano 2 minuti per registrarsi gratuitamente, ottenere il passaporto digitale verificato in formato PDF e partecipare alle votazioni dei referendum globali. Trovi tutte le informazioni e la registrazione guidata qui. Registrati e fai passaparola per aiutarci ad allargare la nostra rete globale: ${appUrl}`
      }
    },
    en: {
      friendly: {
        title: "Friendly & Casual",
        subject: "Join me in the New World State! 🌟",
        body: (name: string) => `Hi${name ? ' ' + name : ''}! I wanted to share an amazing project I just joined: the New World State. It's a peaceful global Digital State based on human free will and a beautiful Constitution. Joining is 100% free and they even issue a signed digital PDF passport! Take a look, I'd love for you to join me. Let's spread the word to grow our peaceful and free community: ${appUrl}`
      },
      inspiring: {
        title: "Inspiring & Solemn",
        subject: "A new era of digital freedom: New World State 🌍",
        body: (name: string) => `Dear${name ? ' ' + name : ' friend'}, I invite you to discover and join the New World State. An entirely digital, peaceful, global nation connecting citizens from all continents to deliberate together via direct democracy. Join this wave of freedom and digital sovereignty. It is free and open to everyone: help us grow the community by passing this on to people you trust! Spread the word: ${appUrl}`
      },
      informative: {
        title: "Informative & Direct",
        subject: "Get your free New World State Digital Passport 💳",
        body: (name: string) => `Hello${name ? ' ' + name : ''}! Check out the New World State, a global digital community. It takes just 2 minutes to register for free, receive your verified PDF digital passport, and vote on global referendums. Read all details and sign up here. Register and spread the word to help expand our global network: ${appUrl}`
      }
    },
    fr: {
      friendly: {
        title: "Amical & Chaleureux",
        subject: "Rejoins-moi dans le New World State ! 🌟",
        body: (name: string) => `Salut${name ? ' ' + name : ''} ! Je voulais te présenter un projet incroyable auquel je viens d'adhérer : le New World State. C'est un État Numérique pacifique et mondial, fondé sur le libre arbitre et une magnifique Constitution. L'inscription est 100% gratuite et te délivre un passeport numérique PDF nominatif ! Jette un œil ici : ${appUrl}`
      },
      inspiring: {
        title: "Inspirant & Solennel",
        subject: "Une nouvelle ère de liberté numérique : New World State 🌍",
        body: (name: string) => `Cher${name ? ' ' + name : ' ami'}, je t'invite à découvrir la Constitution du New World State. Une nation numérique, pacifique et globale unissant les citoyens du monde entier en démocratie directe. L'adhésion est gratuite et ouverte à tous : ${appUrl}`
      },
      informative: {
        title: "Informatif & Simple",
        subject: "Obtenez votre passeport numérique du New World State 💳",
        body: (name: string) => `Bonjour${name ? ' ' + name : ''} ! Découvrez le New World State, une communauté numérique mondiale. 2 minutes suffisent pour s'inscrire gratuitement et obtenir un passeport numérique PDF vérifié : ${appUrl}`
      }
    },
    es: {
      friendly: {
        title: "Amistoso y Cercano",
        subject: "¡Únete a mí en el New World State! 🌟",
        body: (name: string) => `¡Hola${name ? ' ' + name : ''}! Quería compartir contigo un proyecto increíble al que acabo de unirme: el New World State. Es un Estado Digital pacífico y global basado en el libre albedrío y una hermosa Constitución. ¡El registro es 100% gratuito e incluye un pasaporte digital PDF! Échale un vistazo aquí: ${appUrl}`
      },
      inspiring: {
        title: "Inspirador y Solemne",
        subject: "Una nueva era de libertad digital: New World State 🌍",
        body: (name: string) => `Estimado/a${name ? ' ' + name : ' amigo/a'}, te invito a leer la Constitución del New World State. Una nación digital y pacífica que conecta a ciudadanos de todos los continentes en democracia directa. La adhesión es gratuita: ${appUrl}`
      },
      informative: {
        title: "Informativo y Directo",
        subject: "Obtén tu Pasaporte Digital del New World State 💳",
        body: (name: string) => `¡Hola${name ? ' ' + name : ''}! Te presento el New World State, una comunidad digital mundial. Solo toma 2 minutos registrarse gratis y recibir tu pasaporte digital verificado en PDF: ${appUrl}`
      }
    },
    pt: {
      friendly: {
        title: "Amigável e Caloroso",
        subject: "Junte-se a mim no New World State! 🌟",
        body: (name: string) => `Olá${name ? ' ' + name : ''}! Queria te mostrar um projeto incrível em que acabo de entrar: o New World State. É um Estado Digital pacífico e global baseado no livre-arbítrio e em uma Constituição incrível. A adesão é 100% gratuita e com passaporte digital em PDF! Confira aqui: ${appUrl}`
      },
      inspiring: {
        title: "Inspirador e Solene",
        subject: "Uma nova era de liberdade digital: New World State 🌍",
        body: (name: string) => `Caro(a)${name ? ' ' + name : ' amigo(a)'}, convido você a conhecer a Constituição do New World State. Uma nação digital pacífica e global que une cidadãos em democracia direta. A inscrição é gratuita: ${appUrl}`
      },
      informative: {
        title: "Informativo e Direto",
        subject: "Obtenha seu Passaporte Digital do New World State 💳",
        body: (name: string) => `Olá${name ? ' ' + name : ''}! Conheça o New World State, uma comunidade digital mundial. Leva apenas 2 minutos para se registrar gratuitamente e obter seu passaporte digital PDF verificado: ${appUrl}`
      }
    },
    ru: {
      friendly: {
        title: "Дружелюбный и Теплый",
        subject: "Присоединяйся ко мне в New World State! 🌟",
        body: (name: string) => `Привет${name ? ' ' + name : ''}! Хочу поделиться удивительным проектом: New World State. Это мирное цифровое государство с гарантией прав человека и цифровым паспортом PDF. Вступление 100% бесплатное! Подробнее здесь: ${appUrl}`
      },
      inspiring: {
        title: "Вдохновляющий",
        subject: "Новая эра цифровой свободы: New World State 🌍",
        body: (name: string) => `Дорогой${name ? ' ' + name : ' друг'}, приглашаю тебя изучить Конституцию New World State. Всемирное цифровое государство для прямой демократии и мира. Присоединяйся бесплатно: ${appUrl}`
      },
      informative: {
        title: "Информативный",
        subject: "Получите цифровой паспорт New World State 💳",
        body: (name: string) => `Привет${name ? ' ' + name : ''}! Ознакомься с New World State — мировым цифровым сообществом. Регистрация занимает 2 минуты и дает официальный PDF паспорт: ${appUrl}`
      }
    },
    hi: {
      friendly: {
        title: "मित्रवत और आत्मीय",
        subject: "New World State में मेरे साथ जुड़ें! 🌟",
        body: (name: string) => `नमस्ते${name ? ' ' + name : ''}! मैं आपके साथ एक शानदार प्रोजेक्ट साझा करना चाहता हूँ: New World State। यह एक शांतिपूर्ण वैश्विक डिजिटल राज्य है। जुड़ना 100% मुफ़्त है और डिजिटल पासफ़ोर्ट भी मिलता है! यहाँ देखें: ${appUrl}`
      },
      inspiring: {
        title: "प्रेरणादायक",
        subject: "डिजिटल स्वतंत्रता का एक नया युग: New World State 🌍",
        body: (name: string) => `प्रिय${name ? ' ' + name : ' मित्र'}, मैं आपको New World State के संविधान से जुड़ने के लिए आमंत्रित करता हूँ। यह एक वैश्विक शांतिपूर्ण डिजिटल राष्ट्र है। निःशुल्क शामिल हों: ${appUrl}`
      },
      informative: {
        title: "सूचनात्मक",
        subject: "अपना मुफ़्त डिजिटल पासपोर्ट प्राप्त करें 💳",
        body: (name: string) => `नमस्ते${name ? ' ' + name : ''}! New World State वैश्विक डिजिटल समुदाय को देखें। मुफ़्त पंजीकरण में 2 मिनट लगते हैं और PDF पासपोर्ट मिलता है: ${appUrl}`
      }
    },
    bn: {
      friendly: {
        title: "বান্ধব ও উষ্ণ",
        subject: "New World State-এ আমার সাথে যোগ দিন! 🌟",
        body: (name: string) => `হ্যালো${name ? ' ' + name : ''}! আমি একটি অবিশ্বাস্য প্রজেক্ট শেয়ার করতে চাই: New World State। এটি একটি শান্তিপূর্ণ বৈশ্বিক ডিজিটাল রাষ্ট্র। বিনামূল্যে ডিজিটাল পাসপোর্ট পান! দেখুন: ${appUrl}`
      },
      inspiring: {
        title: "প্রেরণাদায়ক",
        subject: "ডিজিটাল স্বাধীনতার নতুন যুগ: New World State 🌍",
        body: (name: string) => `প্রিয়${name ? ' ' + name : ' বন্ধু'}, আপনাকে New World State সংবিধানে যোগ দিতে আমন্ত্রণ জানাচ্ছি। প্রত্যক্ষ গণতন্ত্রের জন্য একটি বৈশ্বিক ডিজিটাল রাষ্ট্র: ${appUrl}`
      },
      informative: {
        title: "তথ্যবহুল",
        subject: "আপনার বিনামূল্যে ডিজিটাল পাসপোর্ট পান 💳",
        body: (name: string) => `হ্যালো${name ? ' ' + name : ''}! New World State ডিজিটাল রাষ্ট্র দেখুন। বিনামূল্যে নিবন্ধন করুন এবং ২ মিনিটে PDF পাসপোর্ট পান: ${appUrl}`
      }
    },
    zh: {
      friendly: {
        title: "亲切友好",
        subject: "加入我的 New World State 吧！🌟",
        body: (name: string) => `你好${name ? ' ' + name : ''}！想和你分享我刚加入的一个非凡项目：New World State（新世界国家）。这是一个基于和平与自由意志的全球数字国家，100%免费注册并提供专属PDF数字护照！点击查看：${appUrl}`
      },
      inspiring: {
        title: "鼓舞人心",
        subject: "数字自由的新时代：New World State 🌍",
        body: (name: string) => `亲爱的${name ? ' ' + name : '朋友'}，邀请你了解并加入 New World State 宪法。这是一个通过直接民主凝聚全球公民的和平数字国家。免费注册：${appUrl}`
      },
      informative: {
        title: "简洁明了",
        subject: "获取您的 New World State 免费数字护照 💳",
        body: (name: string) => `你好${name ? ' ' + name : ''}！了解一下 New World State 全球数字社区。仅需2分钟免费注册，即可获得官方验证的PDF数字护照：${appUrl}`
      }
    },
    ja: {
      friendly: {
        title: "フレンドリー",
        subject: "New World State に参加しよう！🌟",
        body: (name: string) => `こんにちは${name ? ' ' + name : ''}！私が参加した素晴らしいプロジェクト「New World State（新世界国家）」をご紹介します。自由意志と憲法に基づく平和な全球デジタル国家です。完全無料でPDFデジタルパスポートも発行されます！詳細はこちら：${appUrl}`
      },
      inspiring: {
        title: "インスピレーション",
        subject: "デジタル自由の新時代：New World State 🌍",
        body: (name: string) => `親愛なる${name ? ' ' + name : '友人'}へ、New World State の憲法をご覧ください。直接民主主義によって世界中の市民を結ぶ平和なデジタル国家です。登録は無料です：${appUrl}`
      },
      informative: {
        title: "シンプル＆直接",
        subject: "無料の New World State デジタルパスポートを取得 💳",
        body: (name: string) => `こんにちは${name ? ' ' + name : ''}！New World State グローバルデジタルコミュニティをご案内します。2分で無料登録し、検証済みPDFパスポートを取得できます：${appUrl}`
      }
    },
    ar: {
      friendly: {
        title: "ودود ودافئ",
        subject: "انضم معي في New World State! 🌟",
        body: (name: string) => `مرحباً${name ? ' ' + name : ''}! أود مشاركتك مشروعاً رائعاً انضممت إليه: New World State. إنها دولة رقمية عالمية سلمية قائمة على حرية الإرادة. التسجيل مجاني 100% مع جواز سفر رقمي PDF! تصفح هنا: ${appUrl}`
      },
      inspiring: {
        title: "ملهم ومهيب",
        subject: "عصر جديد من الحرية الرقمية: New World State 🌍",
        body: (name: string) => `عزيزي${name ? ' ' + name : ' الصديق'}، أدعوك لاكتشاف دستور New World State. دولة رقمية سلمية تجمع المواطنين عبر الديمقراطية المباشرة. الانضمام مجاني: ${appUrl}`
      },
      informative: {
        title: "معلوماتي ومباشر",
        subject: "احصل على جواز سفرك الرقمي المجاني 💳",
        body: (name: string) => `مرحباً${name ? ' ' + name : ''}! تعرف على New World State. يستغرق التسجيل المجاني دقيقتين فقط للحصول على جواز سفرك الرقمي الموثق: ${appUrl}`
      }
    }
  };

  const currentLang = (language in messages) ? language : 'en';
  const ui = WIDGET_UI_TEXTS[currentLang as keyof typeof WIDGET_UI_TEXTS] || WIDGET_UI_TEXTS.en;
  const activeMessageData = messages[currentLang]?.[messageStyle] || messages.en[messageStyle];

  useEffect(() => {
    setShareText(activeMessageData.body(recipientName.trim()));
  }, [recipientName, messageStyle, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleShareWhatsApp = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(activeMessageData.body(recipientName.trim()).replace(appUrl, ''))}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(activeMessageData.subject);
    const body = encodeURIComponent(shareText);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeMessageData.subject,
          text: shareText,
          url: appUrl,
        });
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-br from-white to-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm text-left ${className}`} id="nws-share-compact-widget">
        <div className="flex items-center gap-2 mb-3">
          <Share2 className="w-4 h-4 text-brand-gold" />
          <h4 className="font-serif font-bold text-slate-800 text-sm">
            {ui.inviteFriendsTitle}
          </h4>
        </div>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          {ui.inviteFriendsDesc}
        </p>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleShareWhatsApp}
            className="flex-1 min-w-[100px] bg-[#25D366] hover:bg-[#20ba59] text-white py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            WhatsApp
          </button>
          <button 
            onClick={handleShareTelegram}
            className="flex-1 min-w-[100px] bg-[#0088cc] hover:bg-[#0077b3] text-white py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Telegram
          </button>
          <button 
            onClick={handleCopy}
            className="flex-1 min-w-[100px] bg-slate-800 hover:bg-slate-900 text-white py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-brand-gold animate-bounce" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? ui.copiedShort : ui.copyText}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md text-left ${className}`} id="nws-share-full-widget">
      {/* Widget Header with Gold background header or nice brand banner */}
      <div className="bg-[#0a1c3e] text-white p-6 md:p-8 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 left-1/3 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-brand-gold/15 text-amber-200 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-brand-gold/20 mb-1">
              <Users className="w-3 h-3" />
              {ui.outreachBadge}
            </div>
            <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-white">
              {ui.spreadTitle}
            </h3>
            <p className="text-xs text-white/70 max-w-xl">
              {ui.spreadDesc}
            </p>
          </div>
          <div className="hidden lg:flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 text-amber-200">
            <Heart className="w-8 h-8 fill-brand-gold/10 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CONFIGURATION COLUMN */}
          <div className="space-y-4">
            {/* Input name */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-600 tracking-wider mb-1.5">
                {ui.recipientLabel}
              </label>
              <input 
                type="text"
                placeholder={ui.recipientPlaceholder}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-gold rounded-xl px-4 py-3 text-xs outline-none transition text-brand-blue"
              />
            </div>

            {/* Message Style Tab Buttons */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-600 tracking-wider mb-2">
                {ui.chooseToneLabel}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['friendly', 'inspiring', 'informative'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setMessageStyle(style)}
                    className={`px-2.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition ${
                      messageStyle === style 
                        ? 'bg-brand-blue text-white shadow' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {messages[currentLang]?.[style]?.title || messages.en[style].title}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons list */}
            <div className="space-y-2.5 pt-2">
              <label className="block text-[10px] uppercase font-bold text-slate-600 tracking-wider mb-1">
                {ui.clickShareLabel}
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button 
                  onClick={handleShareWhatsApp}
                  className="bg-[#25D366] hover:bg-[#20ba59] text-white p-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>{ui.shareWhatsapp}</span>
                </button>
                
                <button 
                  onClick={handleShareTelegram}
                  className="bg-[#0088cc] hover:bg-[#0077b3] text-white p-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{ui.shareTelegram}</span>
                </button>

                <button 
                  onClick={handleShareEmail}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                >
                  <Mail className="w-4 h-4" />
                  <span>{ui.sendEmail}</span>
                </button>

                <button 
                  onClick={handleCopy}
                  className="bg-brand-blue hover:bg-[#071530] text-white p-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-brand-gold animate-bounce" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? ui.textCopied : ui.copyText}</span>
                </button>
              </div>

              {hasNativeShare && (
                <button 
                  onClick={handleNativeShare}
                  className="w-full bg-brand-gold/15 text-[#0a1c3e] hover:bg-brand-gold/25 border border-brand-gold/30 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{ui.nativeShare}</span>
                </button>
              )}
            </div>
          </div>

          {/* MESSAGE LIVE PREVIEW COLUMN */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 md:p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-600">
                  {ui.livePreview}
                </span>
                <span className="text-[10px] text-slate-600 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-gold" /> {messages[currentLang]?.[messageStyle]?.title || messages.en[messageStyle].title}
                </span>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-xl p-4 min-h-[160px] text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-wrap select-all text-left shadow-inner">
                {shareText}
              </div>
            </div>

            <div className="bg-brand-gold/5 border border-brand-gold/20 rounded-xl p-3 flex items-start gap-3">
              <div className="p-1 rounded-full bg-brand-gold/15 text-brand-gold shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                {ui.costFreeNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

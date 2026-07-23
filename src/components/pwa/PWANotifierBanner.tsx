import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  X, 
  Check, 
  Volume2, 
  Info, 
  Landmark, 
  ShieldCheck,
  Activity,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  ExternalLink,
  Settings,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { 
  getSubscriptionStatus, 
  getBrowserPermission, 
  requestBrowserPermission, 
  unsubscribeFromNotifications, 
  triggerNotification, 
  getLocalNotifications, 
  subscribeToAppNotifications,
  NWSNotification
} from '../../services/notifications';

const PWA_TRANSLATIONS: Record<string, Record<string, string>> = {
  it: {
    installAppTitle: "📱 Installa l'App del Portale",
    installAppDesc: "Accedi alla tua consolle privata in un click direttamente dalla homepage del tuo smartphone. Più veloce, protetta ed attiva anche offline.",
    addToHome: "Aggiungi alla Home",
    hide: "Nascondi",
    pushTitle: "Notifiche Push nel Browser",
    pushDesc: "Avvisi chat in tempo reale, novità sui referendum e aggiornamenti sul passaporto",
    testAlertBtn: "Invia Test",
    activateBtn: "Attiva",
    deactivateBtn: "Disattiva",
    diagnosticDoctorTitle: "🩺 Assistente Diagnostica Notifiche Push",
    refreshBtn: "Ricarica",
    systemIntegrityTitle: "Integrità del Sistema",
    sandboxCheck: "Ambiente Sandbox (iFrame):",
    fullWindow: "Finestra Libera",
    iframeBlocked: "Iframe (Limitato)",
    browserNotificationApi: "API Notifiche Browser:",
    supported: "Supportato",
    unsupported: "Non Supportato",
    permissionStatus: "Stato dei Permessi:",
    authorized: "Concesso (Attivo)",
    blocked: "Negato / Bloccato",
    notRequested: "Chiedi al click",
    bgServiceWorker: "Service Worker in Background:",
    activeLive: "Attivo & Connesso",
    incompatibleBrowser: "Incompatibile",
    waiting: "In attesa",
    chatSynced: "Identità Chat Sincronizzata:",
    unidentified: "Nessuno",
    iframeWarning: "⚠️ Stai visualizzando l'applicazione dentro l'anteprima protetta (Iframe). I browser bloccano la registrazione di Service Worker e l'invio di notifiche native all'interno di iframe sandboxed per sicurezza.",
    openInNewTab: "Apri il Portale in una Nuova Scheda",
    quickDeviceGuides: "Guide Rapide Dispositivi",
    resetPermissions: "Sblocca Permessi",
    forceTestAlert: "Forza Notifica Test",
    howNotifsWork: "COME FUNZIONANO LE NOTIFICHE:",
    howNotifsWorkPoint1: "• Funzionano anche a portale chiuso! Anche se hai chiuso il browser, l'Edge State e il Service Worker in background monitorano nuovi messaggi e notificano istantaneamente sia su desktop che su mobile.",
    howNotifsWorkPoint2: "• Gli aggiornamenti personali (messaggi di chat privata, rilascio passaporto, referendum) vengono recapitati in modo sicuro e cifrato solo sul tuo dispositivo autorizzato.",
    popupsBlockedWarning: "⚠️ Attenzione: Le autorizzazioni sono state disabilitate nel browser. Fai click sull'icona del lucchetto a sinistra dell'URL del sito per riattivare le notifiche.",
    latestFeedTitle: "Feed Notifiche Ricevute",
    clearLog: "Svuota Registro",
    noAlertsReceived: "Nessun messaggio ricevuto finora nel feed locale.",
    notifActivatedTitle: "🔔 Notifiche Browser Attivate!",
    notifActivatedDesc: "Riceverai avvisi istantanei per votazioni NWS e aggiornamenti sul tuo profilo.",
    serviceUpdateTitle: "📢 Comunicazione di Servizio",
    serviceUpdateDesc: "I server della democrazia diretta sono operativi sul Edge. Connessione cifrata verificata.",
    iosGuideAlert: "✨ Per aggiungere il portale alla Home su iOS/Safari:\n1. Tocca il tasto Condividi (icona quadrata con freccia in alto)\n2. Scorri e seleziona 'Aggiungi alla schermata Home' (tasto +)\n3. Potrai accedere alla consolle in un click!"
  },
  en: {
    installAppTitle: "📱 Install Official WebApp",
    installAppDesc: "Access your private citizen console in just one click directly from your smartphone home screen. Faster, secure, offline ready.",
    addToHome: "Add to Home",
    hide: "Hide",
    pushTitle: "Web Push Notifications",
    pushDesc: "Real-time chat alerts, status updates, and active referendum announcements",
    testAlertBtn: "Test Alert",
    activateBtn: "Activate",
    deactivateBtn: "Deactivate",
    diagnosticDoctorTitle: "🩺 Push Notification Diagnostic Doctor",
    refreshBtn: "Refresh",
    systemIntegrityTitle: "System Integrity Check",
    sandboxCheck: "Sandbox Environment:",
    fullWindow: "Full Window",
    iframeBlocked: "Iframe (Blocked)",
    browserNotificationApi: "Browser Notification API:",
    supported: "Supported",
    unsupported: "Unsupported",
    permissionStatus: "Permission Status:",
    authorized: "Authorized",
    blocked: "Blocked",
    notRequested: "Not Requested",
    bgServiceWorker: "Background Service Worker:",
    activeLive: "Registered & Live",
    incompatibleBrowser: "Incompatible Browser",
    waiting: "Not Loaded yet",
    chatSynced: "Active Chat Synced:",
    unidentified: "Unidentified",
    iframeWarning: "⚠️ You are running the app inside a sandboxed Iframe (AI Studio Preview). Browser policies strictly prevent notifications here.",
    openInNewTab: "Open App in New Tab",
    quickDeviceGuides: "Quick Device Guides",
    resetPermissions: "Reset Permissions",
    forceTestAlert: "Force Test Alert",
    howNotifsWork: "HOW BROWSER NOTIFICATIONS WORK:",
    howNotifsWorkPoint1: "• They function outside the portal! Even if you have closed your web browser, our Edge servers can generate direct push alerts for convalidated referendums and new private chat messages.",
    howNotifsWorkPoint2: "• Personal updates (private chat messages, passport releases) will be pushed securely only to your registered device.",
    popupsBlockedWarning: "⚠️ Notice: Browser popups are currently blocked for this site. Click on the lock icon next to the address bar to reset permissions.",
    latestFeedTitle: "Latest alert feed",
    clearLog: "Clear Log",
    noAlertsReceived: "No alerts received yet. They will display dynamically here when pushed.",
    notifActivatedTitle: "🔔 Notifications Activated!",
    notifActivatedDesc: "You will now receive instant alerts for NWS voting and citizen responses.",
    serviceUpdateTitle: "📢 Citizen General Update",
    serviceUpdateDesc: "Direct Democracy servers are operational. Direct feedback loop verified.",
    iosGuideAlert: "✨ To add NWS to your Home Screen on iOS:\n1. Tap the Share button (bottom arrow icon)\n2. Select 'Add to Home Screen' (+ icon)\n3. Fast access is now configured in 1 click!"
  },
  fr: {
    installAppTitle: "📱 Installer l'App Officielle",
    installAppDesc: "Accédez à votre console citoyenne en un clic depuis l'écran d'accueil de votre smartphone. Rapide, sécurisée et disponible hors ligne.",
    addToHome: "Ajouter à l'écran d'accueil",
    hide: "Masquer",
    pushTitle: "Notifications Push Navigateur",
    pushDesc: "Alertes de chat en direct, mises à jour et référendums actifs",
    testAlertBtn: "Test d'Alerte",
    activateBtn: "Activer",
    deactivateBtn: "Désactiver",
    diagnosticDoctorTitle: "🩺 Assistant Diagnostic Notifications Push",
    refreshBtn: "Actualiser",
    systemIntegrityTitle: "Contrôle d'Intégrité Système",
    sandboxCheck: "Environnement Sandbox :",
    fullWindow: "Fenêtre Libérale",
    iframeBlocked: "Iframe (Limité)",
    browserNotificationApi: "API Notifications Navigateur :",
    supported: "Supporté",
    unsupported: "Non supporté",
    permissionStatus: "Statut des Permissions :",
    authorized: "Autorisé",
    blocked: "Bloqué",
    notRequested: "Non demandé",
    bgServiceWorker: "Service Worker en Arrière-plan :",
    activeLive: "Actif et Connecté",
    incompatibleBrowser: "Incompatible",
    waiting: "En attente",
    chatSynced: "Identité Chat Synchronisée :",
    unidentified: "Aucun",
    iframeWarning: "⚠️ Application en cours d'exécution dans un iFrame. Les règles du navigateur bloquent les notifications.",
    openInNewTab: "Ouvrir dans un Nouvel Onglet",
    quickDeviceGuides: "Guides Rapides Appareils",
    resetPermissions: "Débloquer Permissions",
    forceTestAlert: "Forcer Alerte Test",
    howNotifsWork: "FONCTIONNEMENT DES NOTIFICATIONS :",
    howNotifsWorkPoint1: "• Fonctionne même navigateur fermé ! Les serveurs Edge envoient directement les alertes.",
    howNotifsWorkPoint2: "• Les mises à jour personnelles sont transmises de façon sécurisée.",
    popupsBlockedWarning: "⚠️ Attention : Les autorisations sont désactivées dans votre navigateur.",
    latestFeedTitle: "Flux des Dernières Alertes",
    clearLog: "Effacer l'Historique",
    noAlertsReceived: "Aucune alerte reçue pour le moment.",
    notifActivatedTitle: "🔔 Notifications Activées !",
    notifActivatedDesc: "Vous recevrez des alertes instantanées pour les votes NWS.",
    serviceUpdateTitle: "📢 Communication de Service",
    serviceUpdateDesc: "Les serveurs de démocratie directe sont opérationnels.",
    iosGuideAlert: "✨ Pour ajouter NWS à l'écran d'accueil sur iOS :\n1. Appuyez sur Partager\n2. Choisissez 'Sur l'écran d'accueil'"
  },
  es: {
    installAppTitle: "📱 Instalar App Oficial",
    installAppDesc: "Accede a tu consola ciudadana privada en un clic desde la pantalla de inicio de tu smartphone. Rápida, segura y lista sin conexión.",
    addToHome: "Añadir a Inicio",
    hide: "Ocultar",
    pushTitle: "Notificaciones Push en Navegador",
    pushDesc: "Alertas de chat en tiempo real, actualizaciones de estado y referéndums activos",
    testAlertBtn: "Probar Alerta",
    activateBtn: "Activar",
    deactivateBtn: "Desactivar",
    diagnosticDoctorTitle: "🩺 Asistente Diagnóstico de Notificaciones Push",
    refreshBtn: "Actualizar",
    systemIntegrityTitle: "Verificación de Integridad del Sistema",
    sandboxCheck: "Entorno Sandbox:",
    fullWindow: "Ventana Completa",
    iframeBlocked: "Iframe (Bloqueado)",
    browserNotificationApi: "API Notificaciones del Navegador:",
    supported: "Soportado",
    unsupported: "No Soportado",
    permissionStatus: "Estado de Permisos:",
    authorized: "Autorizado",
    blocked: "Bloqueado",
    notRequested: "No Solicitado",
    bgServiceWorker: "Service Worker en Segundo Plano:",
    activeLive: "Activo y En Vivo",
    incompatibleBrowser: "Incompatible",
    waiting: "En espera",
    chatSynced: "Identidad Chat Sincronizada:",
    unidentified: "Ninguno",
    iframeWarning: "⚠️ Ejecutando en iFrame. Las políticas del navegador bloquean notificaciones aquí.",
    openInNewTab: "Abrir en Nueva Pestaña",
    quickDeviceGuides: "Guías Rápidas por Dispositivo",
    resetPermissions: "Restablecer Permisos",
    forceTestAlert: "Forzar Alerta de Prueba",
    howNotifsWork: "CÓMO FUNCIONAN LAS NOTIFICACIONES:",
    howNotifsWorkPoint1: "• ¡Funcionan incluso con el navegador cerrado! Los servidores Edge envían las alertas directo.",
    howNotifsWorkPoint2: "• Tus datos personales se entregan de forma segura e inteligible.",
    popupsBlockedWarning: "⚠️ Aviso: Las notificaciones están bloqueadas en tu navegador.",
    latestFeedTitle: "Historial de Alertas",
    clearLog: "Borrar Registro",
    noAlertsReceived: "No hay alertas recibidas todavía.",
    notifActivatedTitle: "🔔 ¡Notificaciones Activadas!",
    notifActivatedDesc: "Recibirás alertas instantáneas sobre votaciones y actualizaciones NWS.",
    serviceUpdateTitle: "📢 Comunicado de Servicio",
    serviceUpdateDesc: "Los servidores de Democracia Directa están totalmente operativos.",
    iosGuideAlert: "✨ Para añadir NWS a Inicio en iOS:\n1. Toca Compartir\n2. Selecciona 'Añadir a la pantalla de inicio'"
  },
  pt: {
    installAppTitle: "📱 Instalar App Oficial",
    installAppDesc: "Acesse sua console cidadã com um clique na tela inicial do smartphone. Rápida, segura e pronta offline.",
    addToHome: "Adicionar à Tela Inicial",
    hide: "Ocultar",
    pushTitle: "Notificações Push no Navegador",
    pushDesc: "Alertas de chat em tempo real, atualizações de status e referendos",
    testAlertBtn: "Testar Alerta",
    activateBtn: "Ativar",
    deactivateBtn: "Desativar",
    diagnosticDoctorTitle: "🩺 Assistente Diagnóstico de Notificações",
    refreshBtn: "Atualizar",
    systemIntegrityTitle: "Verificação de Integridade",
    sandboxCheck: "Ambiente Sandbox:",
    fullWindow: "Janela Completa",
    iframeBlocked: "Iframe (Bloqueado)",
    browserNotificationApi: "API Notificações Navegador:",
    supported: "Suportado",
    unsupported: "Não Suportado",
    permissionStatus: "Status de Permissões:",
    authorized: "Autorizado",
    blocked: "Bloqueado",
    notRequested: "Não Solicitado",
    bgServiceWorker: "Service Worker em Segundo Plano:",
    activeLive: "Ativo e Conectado",
    incompatibleBrowser: "Incompatível",
    waiting: "Aguardando",
    chatSynced: "Identidade Chat Sincronizada:",
    unidentified: "Nenhum",
    iframeWarning: "⚠️ Executando em iFrame. As políticas do navegador bloqueiam notificações.",
    openInNewTab: "Abrir em Nova Aba",
    quickDeviceGuides: "Guias Rápido do Dispositivo",
    resetPermissions: "Redefinir Permissões",
    forceTestAlert: "Forçar Alerta de Teste",
    howNotifsWork: "COMO FUNCIONAM AS NOTIFICAÇÕES:",
    howNotifsWorkPoint1: "• Funcionam mesmo com o navegador fechado! Servidores Edge enviam alertas diretos.",
    howNotifsWorkPoint2: "• Atualizações pessoais são entregues com total segurança.",
    popupsBlockedWarning: "⚠️ Notificações bloqueadas no navegador.",
    latestFeedTitle: "Feed de Alertas",
    clearLog: "Limpar Registro",
    noAlertsReceived: "Nenhum alerta recebido ainda.",
    notifActivatedTitle: "🔔 Notificações Ativadas!",
    notifActivatedDesc: "Você receberá alertas instantâneos de votações NWS.",
    serviceUpdateTitle: "📢 Atualização Geral",
    serviceUpdateDesc: "Servidores da Democracia Direta estão operacionais.",
    iosGuideAlert: "✨ Para adicionar NWS no iOS:\n1. Toque em Compartilhar\n2. Selecione 'Adicionar à Tela de Início'"
  },
  ru: {
    installAppTitle: "📱 Установить веб-приложение",
    installAppDesc: "Доступ к консоли гражданина в один клик с главного экрана смартфона.",
    addToHome: "Добавить на главный экран",
    hide: "Скрыть",
    pushTitle: "Push-уведомления в браузере",
    pushDesc: "Уведомления чата, обновления статусов и референдумы в реальном времени",
    testAlertBtn: "Тест уведомления",
    activateBtn: "Включить",
    deactivateBtn: "Выключить",
    diagnosticDoctorTitle: "🩺 Диагностика уведомлений Push",
    refreshBtn: "Обновить",
    systemIntegrityTitle: "Проверка системы",
    sandboxCheck: "Песочница iFrame:",
    fullWindow: "Свободное окно",
    iframeBlocked: "Iframe (Ограничен)",
    browserNotificationApi: "API уведомлений браузера:",
    supported: "Поддерживается",
    unsupported: "Не поддерживается",
    permissionStatus: "Статус разрешений:",
    authorized: "Разрешено",
    blocked: "Заблокировано",
    notRequested: "Не запрашивалось",
    bgServiceWorker: "Фоновый Service Worker:",
    activeLive: "Активен и подключен",
    incompatibleBrowser: "Несовместим",
    waiting: "Ожидание",
    chatSynced: "Синхронизация чата:",
    unidentified: "Нет",
    iframeWarning: "⚠️ Приложение работает внутри iFrame. Уведомления заблокированы браузером.",
    openInNewTab: "Открыть в новой вкладке",
    quickDeviceGuides: "Инструкции для устройств",
    resetPermissions: "Сбросить разрешения",
    forceTestAlert: "Тест уведомления",
    howNotifsWork: "КАК РАБОТАЮТ УВЕДОМЛЕНИЯ:",
    howNotifsWorkPoint1: "• Работают даже при закрытом браузере через Edge-серверы.",
    howNotifsWorkPoint2: "• Личные сообщения передаются в зашифрованном виде.",
    popupsBlockedWarning: "⚠️ Уведомления заблокированы в настройках браузера.",
    latestFeedTitle: "Лента уведомлений",
    clearLog: "Очистить историю",
    noAlertsReceived: "Уведомлений пока нет.",
    notifActivatedTitle: "🔔 Уведомления включены!",
    notifActivatedDesc: "Вы будете получать мгновенные оповещения о голосованиях NWS.",
    serviceUpdateTitle: "📢 Сообщение службы",
    serviceUpdateDesc: "Серверы прямой демократии работают стабильно.",
    iosGuideAlert: "✨ На iOS: нажмите 'Поделиться' и выберите 'На экран «Домой»'."
  },
  hi: {
    installAppTitle: "📱 आधिकारिक ऐप इंस्टॉल करें",
    installAppDesc: "स्मार्टफोन की होम स्क्रीन से एक क्लिक में कंसोल एक्सेस करें।",
    addToHome: "होम स्क्रीन में जोड़ें",
    hide: "छिपाएं",
    pushTitle: "वेब पुश नोटिफिकेशन",
    pushDesc: "रियल-टाइम चैट अलर्ट और जनमत संग्रह अपडेट",
    testAlertBtn: "परीक्षण अलर्ट",
    activateBtn: "सक्रिय करें",
    deactivateBtn: "निष्क्रिय करें",
    diagnosticDoctorTitle: "🩺 पुश नोटिफिकेशन निदान सहायक",
    refreshBtn: "पुनः तरोताजा करें",
    systemIntegrityTitle: "सिस्टम अखंडता जांच",
    sandboxCheck: "सैंडबॉक्स वातावरण:",
    fullWindow: "पूर्ण विंडो",
    iframeBlocked: "Iframe (अवरुद्ध)",
    browserNotificationApi: "ब्राउज़र नोटिफिकेशन API:",
    supported: "समर्थित",
    unsupported: "असमर्थित",
    permissionStatus: "अनुमति स्थिति:",
    authorized: "अधिकृत",
    blocked: "अवरुद्ध",
    notRequested: "अनुरोधित नहीं",
    bgServiceWorker: "बैकग्राउंड सर्विस वर्कर:",
    activeLive: "सक्रिय और लाइव",
    incompatibleBrowser: "असंगत",
    waiting: "प्रतीक्षारत",
    chatSynced: "चैट पहचान समन्वयित:",
    unidentified: "कोई नहीं",
    iframeWarning: "⚠️ iFrame में चल रहा है। नोटिफिकेशन अवरुद्ध हैं।",
    openInNewTab: "नये टैब में खोलें",
    quickDeviceGuides: "त्वरित उपकरण गाइड",
    resetPermissions: "अनुमति रीसेट करें",
    forceTestAlert: "बलपूर्वक परीक्षण अलर्ट",
    howNotifsWork: "नोटिफिकेशन कैसे काम करते हैं:",
    howNotifsWorkPoint1: "• ब्राउज़र बंद होने पर भी काम करते हैं!",
    howNotifsWorkPoint2: "• व्यक्तिगत अपडेट सुरक्षित रूप से दिए जाते हैं।",
    popupsBlockedWarning: "⚠️ ध्यान दें: ब्राउज़र पॉपअप अवरुद्ध हैं।",
    latestFeedTitle: "नवीनतम अलर्ट फ़ीड",
    clearLog: "लॉग साफ़ करें",
    noAlertsReceived: "अभी तक कोई अलर्ट प्राप्त नहीं हुआ।",
    notifActivatedTitle: "🔔 नोटिफिकेशन सक्रिय!",
    notifActivatedDesc: "आपको NWS वोटिंग के लिए तत्काल अलर्ट प्राप्त होंगे।",
    serviceUpdateTitle: "📢 सेवा अद्यतन",
    serviceUpdateDesc: "प्रत्यक्ष लोकतंत्र सर्वर चालू हैं।",
    iosGuideAlert: "✨ iOS पर: शेयर बटन दबाएं और 'होम स्क्रीन में जोड़ें' चुनें।"
  },
  bn: {
    installAppTitle: "📱 অফিশিয়াল অ্যাপ ইনস্টল করুন",
    installAppDesc: "স্মার্টফোনের হোম স্ক্রিন থেকে এক ক্লিকে নাগরিক কনসোল প্রবেশ করুন।",
    addToHome: "হোম স্ক্রিনে যোগ করুন",
    hide: "লুকান",
    pushTitle: "ওয়েব পুশ নোটিফিকেশন",
    pushDesc: "রিয়েল-টাইম চ্যাট অ্যালার্ট ও গণভোট আপডেট",
    testAlertBtn: "পরীক্ষা অ্যালার্ট",
    activateBtn: "সক্রিয় করুন",
    deactivateBtn: "নিষ্ক্রিয় করুন",
    diagnosticDoctorTitle: "🩺 নোটিফিকেশন ডায়াগনস্টিক অ্যাসিস্ট্যান্ট",
    refreshBtn: "রিফ্রেশ",
    systemIntegrityTitle: "সিস্টেম অখণ্ডতা পরীক্ষা",
    sandboxCheck: "স্যান্ডবক্স পরিবেশ:",
    fullWindow: "সম্পূর্ণ উইন্ডো",
    iframeBlocked: "Iframe (ব্লক করা)",
    browserNotificationApi: "ব্রাউজার নোটিফিকেশন API:",
    supported: "সমর্থিত",
    unsupported: "অসমর্থিত",
    permissionStatus: "অনুমতি অবস্থা:",
    authorized: "অনুমোদিত",
    blocked: "ব্লক করা",
    notRequested: "অনুরোধ করা হয়নি",
    bgServiceWorker: "ব্যাকগ্রাউন্ড সার্ভিস ওয়ার্কার:",
    activeLive: "সক্রিয় ও লাইভ",
    incompatibleBrowser: "অসামঞ্জস্যপূর্ণ",
    waiting: "অপেক্ষারত",
    chatSynced: "চ্যাট পরিচয় সিঙ্ক হয়েছে:",
    unidentified: "কেউ নয়",
    iframeWarning: "⚠️ iFrame-এ চলছে। ব্রাউজার নীতি নোটিফিকেশন ব্লক করেছে।",
    openInNewTab: "নতুন ট্যাবে খুলুন",
    quickDeviceGuides: "ডিভাইস গাইডসমূহ",
    resetPermissions: "অনুমতি রিসেট করুন",
    forceTestAlert: "টেস্ট অ্যালার্ট পাঠান",
    howNotifsWork: "নোটিফিকেশন কীভাবে কাজ করে:",
    howNotifsWorkPoint1: "• ব্রাউজার বন্ধ থাকলেও কাজ করে!",
    howNotifsWorkPoint2: "• ব্যক্তিগত আপডেটগুলি নিরাপদে পাঠানো হয়।",
    popupsBlockedWarning: "⚠️ ব্রাউজার পপআপ বর্তমানে ব্লক করা আছে।",
    latestFeedTitle: "সর্বশেষ অ্যালার্ট ফিড",
    clearLog: "লগ মুছুন",
    noAlertsReceived: "এখনও কোনও অ্যালার্ট পাওয়া যায়নি।",
    notifActivatedTitle: "🔔 নোটিফিকেশন সক্রিয় হয়েছে!",
    notifActivatedDesc: "আপনি এখন NWS ভোটের জন্য তাত্ক্ষণিক অ্যালার্ট পাবেন।",
    serviceUpdateTitle: "📢 পরিষেবা আপডেট",
    serviceUpdateDesc: "প্রত্যক্ষ গণতন্ত্র সার্ভার সচল আছে।",
    iosGuideAlert: "✨ iOS-এ: শেয়ার বোতাম টিপুন এবং 'হোম স্ক্রিনে যোগ করুন' নির্বাচন করুন।"
  },
  zh: {
    installAppTitle: "📱 安装官方 WebApp",
    installAppDesc: "一键从智能手机主屏幕访问您的私有公民控制台。更快速、更安全、支持离线。",
    addToHome: "添加至主屏幕",
    hide: "隐藏",
    pushTitle: "浏览器网页推送通知",
    pushDesc: "实时聊天提醒、状态更新和公投通知",
    testAlertBtn: "发送测试",
    activateBtn: "开启",
    deactivateBtn: "关闭",
    diagnosticDoctorTitle: "🩺 推送通知诊断助手",
    refreshBtn: "刷新",
    systemIntegrityTitle: "系统完整性检查",
    sandboxCheck: "沙盒环境 (iFrame):",
    fullWindow: "独立窗口",
    iframeBlocked: "Iframe (受限)",
    browserNotificationApi: "浏览器通知 API:",
    supported: "支持",
    unsupported: "不支持",
    permissionStatus: "权限状态:",
    authorized: "已授权",
    blocked: "已拒绝 / 阻止",
    notRequested: "未请求",
    bgServiceWorker: "后台 Service Worker:",
    activeLive: "运行中 & 已连接",
    incompatibleBrowser: "不兼容",
    waiting: "等待中",
    chatSynced: "聊天身份同步:",
    unidentified: "未识别",
    iframeWarning: "⚠️ 当前在 iFrame 预览模式中运行。浏览器安全策略禁用了推送通知功能。",
    openInNewTab: "在新标签页中打开 Portal",
    quickDeviceGuides: "设备快捷设置指南",
    resetPermissions: "重置权限",
    forceTestAlert: "强制测试通知",
    howNotifsWork: "通知工作原理：",
    howNotifsWorkPoint1: "• 即使关闭浏览器也能工作！Edge 服务器直接向设备推送通知。",
    howNotifsWorkPoint2: "• 个人更新将加密发送至您的授权设备。",
    popupsBlockedWarning: "⚠️ 注意：通知已被浏览器拒绝。请点击地址栏左侧锁形图标开启。",
    latestFeedTitle: "通知接收历史",
    clearLog: "清空记录",
    noAlertsReceived: "暂无接收到的通知记录。",
    notifActivatedTitle: "🔔 推送通知已开启！",
    notifActivatedDesc: "您将即时接收 NWS 投票和公民响应通知。",
    serviceUpdateTitle: "📢 服务系统公告",
    serviceUpdateDesc: "直接民主服务器运行正常，加密连接已建立。",
    iosGuideAlert: "✨ 在 iOS 上添加 NWS 至主屏幕：\n1. 点击分享按钮\n2. 选择“添加到主屏幕”"
  },
  ja: {
    installAppTitle: "📱 公式 WebApp をインストール",
    installAppDesc: "スマートフォンホーム画面から1タップで市民コンソールにアクセス。高速・安全・オフライン対応。",
    addToHome: "ホーム画面に追加",
    hide: "非表示",
    pushTitle: "ブラウザプッシュ通知",
    pushDesc: "リアルタイムチャット通知、ステータス更新、国民投票のお知らせ",
    testAlertBtn: "テスト送信",
    activateBtn: "有効化",
    deactivateBtn: "無効化",
    diagnosticDoctorTitle: "🩺 プッシュ通知診断アシスタント",
    refreshBtn: "更新",
    systemIntegrityTitle: "システム整合性チェック",
    sandboxCheck: "サンドボックス環境:",
    fullWindow: "フルウィンドウ",
    iframeBlocked: "iFrame (制限あり)",
    browserNotificationApi: "ブラウザ通知 API:",
    supported: "対応",
    unsupported: "非対応",
    permissionStatus: "通知権限ステータス:",
    authorized: "許可済み",
    blocked: "ブロック済み",
    notRequested: "未リクエスト",
    bgServiceWorker: "バックグラウンド Service Worker:",
    activeLive: "アクティブ & 接続中",
    incompatibleBrowser: "非互換",
    waiting: "待機中",
    chatSynced: "チャットID同期:",
    unidentified: "未登録",
    iframeWarning: "⚠️ iFrame内で実行中です。ブラウザのセキュリティポリシーにより通知が制限されています。",
    openInNewTab: "新しいタブで開く",
    quickDeviceGuides: "端末別クイックガイド",
    resetPermissions: "権限をリセット",
    forceTestAlert: "テスト通知を強制発信",
    howNotifsWork: "通知の仕組み:",
    howNotifsWorkPoint1: "• ブラウザを閉じても機能します！Edgeサーバーから直接プッシュ通知が届きます。",
    howNotifsWorkPoint2: "• 個人通知は暗号化され、登録端末のみに安全に届きます。",
    popupsBlockedWarning: "⚠️ 注意: ブラウザ通知がブロックされています。アドレスバー横の鍵アイコンから許可してください。",
    latestFeedTitle: "受信通知フィード",
    clearLog: "ログを消去",
    noAlertsReceived: "受信した通知はありません。",
    notifActivatedTitle: "🔔 通知が有効になりました！",
    notifActivatedDesc: "NWS投票やアップデート通知をリアルタイムで受け取れます。",
    serviceUpdateTitle: "📢 システムからのお知らせ",
    serviceUpdateDesc: "直接民主主義サーバーは正常に稼働中です。",
    iosGuideAlert: "✨ iOSでホーム画面に追加する手順:\n1. 共有ボタンをタップ\n2. 「ホーム画面に追加」を選択"
  },
  ar: {
    installAppTitle: "📱 تثبيت التطبيق الرسمي",
    installAppDesc: "وصول بنقرة واحدة إلى لوحة المواطن من الشاشة الرئيسية لهاتفك الذكي.",
    addToHome: "إضافة إلى الشاشة الرئيسية",
    hide: "إخفاء",
    pushTitle: "إشعارات المتصفح الفورية",
    pushDesc: "تنبيهات الدردشة المباشرة وتحديثات الاستفتائات الرسمية",
    testAlertBtn: "إرسال تجربة",
    activateBtn: "تفعيل",
    deactivateBtn: "إيقاف",
    diagnosticDoctorTitle: "🩺 مساعد تشخيص الإشعارات",
    refreshBtn: "تحديث",
    systemIntegrityTitle: "فحص سلامة النظام",
    sandboxCheck: "بيئة Sandbox (iFrame):",
    fullWindow: "نافذة مستقلة",
    iframeBlocked: "Iframe (مقيد)",
    browserNotificationApi: "واجهة الإشعارات للمتصفح:",
    supported: "مدعوم",
    unsupported: "غير مدعوم",
    permissionStatus: "حالة الأذونات:",
    authorized: "مسموح",
    blocked: "محظور",
    notRequested: "لم يطلب بعد",
    bgServiceWorker: "عامل الخدمة في الخلفية:",
    activeLive: "نشط ومتصل",
    incompatibleBrowser: "غير متوافق",
    waiting: "في الانتظار",
    chatSynced: "هوية الدردشة المزامنة:",
    unidentified: "غير معرف",
    iframeWarning: "⚠️ التطبيق يعمل داخل iFrame. سياسات المتصفح تمنع الإشعارات هنا.",
    openInNewTab: "فتح البوابة في تبويب جديد",
    quickDeviceGuides: "دليل الأجهزة السريع",
    resetPermissions: "إعادة ضبط الأذونات",
    forceTestAlert: "إرسال إشعار تجريبي",
    howNotifsWork: "كيف تعمل الإشعارات:",
    howNotifsWorkPoint1: "• تعمل حتى عند إغلاق المتصفح! خوادم Edge ترسل التنبيهات مباشرة.",
    howNotifsWorkPoint2: "• التحديثات الشخصية ترسل بشكل مشفر وآمن.",
    popupsBlockedWarning: "⚠️ تنبيه: الإشعارات محظورة في المتصفح. انقر على رمز القفل بجانب الرابط للتمكين.",
    latestFeedTitle: "سجل الإشعارات المستلمة",
    clearLog: "مسح السجل",
    noAlertsReceived: "لا توجد إشعارات مستلمة حتى الآن.",
    notifActivatedTitle: "🔔 تم تفعيل الإشعارات!",
    notifActivatedDesc: "ستتلقى تنبيهات فورية للتصويت والتحديثات في NWS.",
    serviceUpdateTitle: "📢 تحديث الخدمة",
    serviceUpdateDesc: "خوادم الديمقراطية المباشرة تعمل بكفاءة.",
    iosGuideAlert: "✨ للـ iOS: اضغط زر المشاركة ثم اختر 'إضافة إلى الشاشة الرئيسية'."
  }
};

export default function PWANotifierBanner() {
  const { language } = useI18n();
  const currentLang = (language in PWA_TRANSLATIONS) ? language : 'en';
  const txt = PWA_TRANSLATIONS[currentLang] || PWA_TRANSLATIONS.en;
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [notifHistory, setNotifHistory] = useState<NWSNotification[]>([]);
  const [dismissPwaCard, setDismissPwaCard] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nws_dismiss_pwa') === 'true';
    }
    return false;
  });

  // Diagnostic states
  const [isIframe, setIsIframe] = useState(false);
  const [swStatus, setSwStatus] = useState<'active' | 'missing' | 'unsupported'>('missing');
  const [activeName, setActiveName] = useState('');
  const [activeCode, setActiveCode] = useState('');
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [showDoctor, setShowDoctor] = useState(false);
  const [checkingSW, setCheckingSW] = useState(false);

  const checkSWAndDetails = () => {
    setCheckingSW(true);
    // Detect iframe
    try {
      setIsIframe(window.self !== window.top);
    } catch (_) {
      setIsIframe(true);
    }

    // Check service worker support & registration
    if (typeof window === 'undefined') return;
    
    if (!('serviceWorker' in navigator)) {
      setSwStatus('unsupported');
      setCheckingSW(false);
    } else {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          setSwStatus('active');
        } else {
          setSwStatus('missing');
        }
        setCheckingSW(false);
      }).catch(() => {
        setSwStatus('missing');
        setCheckingSW(false);
      });
    }

    // Extract citizen details for sync visual indicator
    try {
      const cachedCitizen = localStorage.getItem('nws_democracy_citizen') || localStorage.getItem('nws_citizen_profile') || localStorage.getItem('registered_citizen');
      if (cachedCitizen) {
        const citizen = JSON.parse(cachedCitizen);
        setActiveName(`${citizen.firstName || ''} ${citizen.surname || ''}`.trim());
        setActiveCode(citizen.citizenCode || '');
      } else {
        const adminPass = localStorage.getItem('nws_admin_password');
        if (adminPass) {
          setActiveName('Console Centrale');
          setActiveCode('NWS-ADM-001');
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    setIsSubscribed(getSubscriptionStatus());
    setNotifPermission(getBrowserPermission());
    setNotifHistory(getLocalNotifications());
    checkSWAndDetails();

    // Register PWA installation triggers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Subscribe to new incoming reactive notifications
    const unsubscribe = subscribeToAppNotifications((newNotif) => {
      setNotifHistory(prev => [newNotif, ...prev]);
    });

    // Detect if already launched in standalone mode
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsInstalled(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      unsubscribe();
    };
  }, []);

  const handleToggleSubscription = async () => {
    if (isSubscribed) {
      unsubscribeFromNotifications();
      setIsSubscribed(false);
      setNotifPermission('default');
    } else {
      const permission = await requestBrowserPermission();
      setNotifPermission(permission);
      setIsSubscribed(true);
      
      // Welcome user immediately via dynamic system alert
      setTimeout(() => {
        triggerNotification(
          txt.notifActivatedTitle,
          txt.notifActivatedDesc,
          'news'
        );
      }, 500);
    }
  };

  const handleInstallPWA = async () => {
    if (!installPrompt) {
      // Guide iPhone/Safari manually
      alert(txt.iosGuideAlert);
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  const clearNotificationCache = () => {
    localStorage.removeItem('nws_local_notifications');
    setNotifHistory([]);
  };

  const triggerTestAlert = () => {
    triggerNotification(
      txt.serviceUpdateTitle,
      txt.serviceUpdateDesc,
      'news'
    );
  };

  const handleDismissPwaCard = () => {
    localStorage.setItem('nws_dismiss_pwa', 'true');
    setDismissPwaCard(true);
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="w-full space-y-6" id="pwa-notif-control-panel">
      {/* 1. TOP PWA PROMPT BANNER */}
      {!isInstalled && !dismissPwaCard && (
        <div className="bg-gradient-to-r from-[#0a1c3e] to-[#152b54] text-[#f7f5f0] p-5 rounded-2xl border border-brand-gold/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden animate-fade-in">
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-brand-gold/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3.5 relative">
            <div className="p-3 bg-brand-gold/15 text-brand-gold rounded-xl border border-brand-gold/25 mt-0.5">
              <Smartphone className="w-5 h-5 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-sm font-bold text-[#f7f5f0] uppercase tracking-wide flex items-center gap-1.5">
                {txt.installAppTitle}
                <span className="text-[9px] bg-brand-gold text-[#0a1c3e] font-bold font-mono px-1.5 py-0.5 rounded uppercase">PWA 1.0</span>
              </h3>
              <p className="text-xs text-slate-350 leading-relaxed max-w-xl">
                {txt.installAppDesc}
              </p>
            </div>
          </div>
          <div className="flex gap-2.5 shrink-0 relative">
            <button
              onClick={handleInstallPWA}
              className="bg-brand-gold hover:bg-brand-gold/90 text-[#0a1c3e] rounded-xl px-4 py-2 text-xs font-bold transition hover:scale-105 active:scale-95 shadow cursor-pointer uppercase tracking-wider"
            >
              {txt.addToHome}
            </button>
            <button
              onClick={handleDismissPwaCard}
              className="p-2 hover:bg-white/10 rounded-xl transition text-slate-400 hover:text-white cursor-pointer"
              title={txt.hide}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. NOTIFICATION CONTROL INTERFACE */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${isSubscribed ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              {isSubscribed ? <Bell className="w-5 h-5 animate-pulse" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-[#0a1c3e] uppercase tracking-tight flex items-center gap-1.5">
                {txt.pushTitle}
                {isSubscribed && (
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                )}
              </h3>
              <p className="text-[11px] text-slate-600">
                {txt.pushDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSubscribed && (
              <button
                onClick={triggerTestAlert}
                className="bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                {txt.testAlertBtn}
              </button>
            )}
            <button
              onClick={handleToggleSubscription}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition uppercase tracking-wider cursor-pointer shadow ${
                isSubscribed 
                  ? 'bg-[#ef4444]/10 hover:bg-[#ef4444]/25 text-[#ef4444]' 
                  : 'bg-[#0a1c3e] hover:bg-[#152b54] text-[#f7f5f0]'
              }`}
            >
              {isSubscribed ? txt.deactivateBtn : txt.activateBtn}
            </button>
            <button
              onClick={() => {
                checkSWAndDetails();
                setShowDoctor(!showDoctor);
              }}
              className={`p-2 rounded-xl border transition cursor-pointer ${showDoctor ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-250 hover:bg-slate-200'}`}
              title={txt.diagnosticDoctorTitle}
            >
              <Settings className={`w-4 h-4 ${showDoctor ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3. DIAGNOSTICS & DOCTOR PANEL (Expanded when showDoctor is true) */}
        {showDoctor && (
          <div className="p-5 border-b border-slate-100 bg-amber-50/20 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-600 animate-pulse" />
                <h4 className="font-serif text-xs font-bold uppercase text-[#0a1c3e] tracking-wider">
                  {txt.diagnosticDoctorTitle}
                </h4>
              </div>
              <button 
                onClick={checkSWAndDetails} 
                disabled={checkingSW}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition flex items-center gap-1 text-[10px] font-bold uppercase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingSW ? 'animate-spin' : ''}`} />
                {txt.refreshBtn}
              </button>
            </div>

            {/* Grid of issues */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Diagnostics Checks */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                <h5 className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500">
                  {txt.systemIntegrityTitle}
                </h5>

                {/* Check 1: Sandboxed iframe */}
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-600 font-medium">{txt.sandboxCheck}</span>
                  {isIframe ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      {txt.iframeBlocked}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {txt.fullWindow}
                    </span>
                  )}
                </div>

                {/* Check 2: Browser APIs */}
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-600 font-medium">{txt.browserNotificationApi}</span>
                  {typeof window !== 'undefined' && 'Notification' in window ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {txt.supported}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {txt.unsupported}
                    </span>
                  )}
                </div>

                {/* Check 3: Notification permission status */}
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-600 font-medium">{txt.permissionStatus}</span>
                  {notifPermission === 'granted' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {txt.authorized}
                    </span>
                  ) : notifPermission === 'denied' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 animate-pulse">
                      <ShieldAlert className="w-3 h-3" />
                      {txt.blocked}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {txt.notRequested}
                    </span>
                  )}
                </div>

                {/* Check 4: Service worker registration */}
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-600 font-medium">{txt.bgServiceWorker}</span>
                  {swStatus === 'active' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {txt.activeLive}
                    </span>
                  ) : swStatus === 'unsupported' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {txt.incompatibleBrowser}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {txt.waiting}
                    </span>
                  )}
                </div>

                {/* Check 5: Live Chat Sync Link */}
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="text-slate-600 font-medium">{txt.chatSynced}</span>
                  {activeName ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0a1c3e]/15 text-[#0a1c3e]">
                      🟢 {activeName.split(' ')[0]} ({activeCode || 'GUEST'})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                      ⚪ {txt.unidentified}
                    </span>
                  )}
                </div>

                {/* Critical Iframe warning message */}
                {isIframe && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-200 text-amber-950 text-[11px] rounded-lg leading-relaxed space-y-2">
                    <p>{txt.iframeWarning}</p>
                    <button 
                      onClick={handleOpenNewTab}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1.5 rounded text-[10px] uppercase transition flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {txt.openInNewTab}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Interactive Setup Guides */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500">
                    {txt.quickDeviceGuides}
                  </h5>
                  
                  {/* Selector tabs */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setActiveTab('android')}
                      className={`py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${activeTab === 'android' ? 'bg-white text-[#0a1c3e] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Android
                    </button>
                    <button 
                      onClick={() => setActiveTab('ios')}
                      className={`py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${activeTab === 'ios' ? 'bg-white text-[#0a1c3e] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Apple iOS
                    </button>
                    <button 
                      onClick={() => setActiveTab('desktop')}
                      className={`py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${activeTab === 'desktop' ? 'bg-white text-[#0a1c3e] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Desktop
                    </button>
                  </div>

                  {/* Guides Content */}
                  <div className="text-[11px] text-slate-600 leading-normal min-h-[100px] flex items-center">
                    {activeTab === 'android' && (
                      <div className="space-y-1.5">
                        <strong className="text-slate-900 block font-serif">Google Chrome / Samsung Internet:</strong>
                        <p>1. {txt.activateBtn} - Click notifications toggle above.</p>
                        <p>2. Ensure "Notifications" permission is set to "Allow".</p>
                      </div>
                    )}
                    {activeTab === 'ios' && (
                      <div className="space-y-1.5">
                        <strong className="text-slate-900 block font-serif">Apple Safari (iPhone / iPad):</strong>
                        <p className="text-amber-700 font-medium">⚠️ iOS PWA Push requires Home Screen installation.</p>
                        <p>1. Tap Share button in Safari (📤).</p>
                        <p>2. Select "Add to Home Screen" (+).</p>
                      </div>
                    )}
                    {activeTab === 'desktop' && (
                      <div className="space-y-1.5">
                        <strong className="text-slate-900 block font-serif">Mac / Windows (Chrome, Safari, Edge, Firefox, Opera, Brave):</strong>
                        <p>1. Click the lock icon 🔒 in address bar.</p>
                        <p>2. Set "Notifications" permission to "Allow".</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={async () => {
                      const perm = await requestBrowserPermission();
                      setNotifPermission(perm);
                      setIsSubscribed(perm === 'granted');
                    }}
                    className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg py-1.5 text-[10px] font-bold uppercase transition text-center cursor-pointer"
                  >
                    {txt.resetPermissions}
                  </button>
                  <button
                    onClick={triggerTestAlert}
                    className="w-full bg-[#0a1c3e] hover:bg-[#152b54] text-white rounded-lg py-1.5 text-[10px] font-bold uppercase transition text-center cursor-pointer"
                  >
                    {txt.forceTestAlert}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. EXTRA INFO PANEL / ALERTS LOG */}
        <div className="p-5 space-y-4">
          <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50/80 p-3.5 border border-slate-100 rounded-xl leading-normal">
            <div className="flex items-center gap-1.5 font-bold text-[#0a1c3e] mb-1 text-[11px]">
              <Info className="w-4 h-4 text-brand-gold shrink-0" />
              <span>{txt.howNotifsWork}</span>
            </div>
            <p>{txt.howNotifsWorkPoint1}</p>
            <p>{txt.howNotifsWorkPoint2}</p>
            {notifPermission === 'denied' && (
              <p className="text-rose-600 font-semibold mt-1">
                {txt.popupsBlockedWarning}
              </p>
            )}
          </div>

          {/* HISTORIC LOG OF ALERTS IN-APP VIEW */}
          {isSubscribed && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 font-mono">
                  {txt.latestFeedTitle}
                </h4>
                {notifHistory.length > 0 && (
                  <button 
                    onClick={clearNotificationCache}
                    className="text-[9px] text-[#ef4444] hover:underline font-bold uppercase tracking-wider cursor-pointer"
                  >
                    {txt.clearLog}
                  </button>
                )}
              </div>

              {notifHistory.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-150 rounded-xl bg-slate-50/15">
                  <p className="text-xs text-slate-400">
                    {txt.noAlertsReceived}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 animate-fade-in">
                  {notifHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 border rounded-xl text-xs transition-colors flex items-start gap-2.5 ${
                        item.type === 'personal' 
                          ? 'bg-amber-500/5 border-amber-200/50' 
                          : item.type === 'referendum'
                            ? 'bg-emerald-500/5 border-emerald-200/50'
                            : 'bg-slate-50 border-slate-150'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.type === 'personal' ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        ) : item.type === 'referendum' ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        )}
                      </div>
                      <div className="space-y-0.5 w-full" data-readable="true">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <strong className="text-[#0a1c3e] font-serif block" data-readable="true">{item.title}</strong>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString(language === 'en' ? 'en-US' : 'it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed" data-readable="true">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

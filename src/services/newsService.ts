import { NewsArticle, NewsCategory, NewsMedia, ArticleStatus, ArticleTranslation, NewsLanguage } from '../types/news';
import { Language } from '../constants/translations';
import { triggerNotification } from './notifications';
import { safeFetch } from './api';

const ARTICLES_STORAGE_KEY = 'nws_news_articles_v1';
const CATEGORIES_STORAGE_KEY = 'nws_news_categories_v1';

export const DEFAULT_CATEGORIES: NewsCategory[] = [
  {
    id: 'cat-politica',
    name: 'Politica & Sovranità',
    slug: 'politica-sovranita',
    description: 'Notizie ufficiali su riforme istituzionali, democrazia diretta e stato di diritto.',
    color: '#0a1c3e',
    icon: 'Landmark',
    isSystem: true
  },
  {
    id: 'cat-economia',
    name: 'Economia & Finanza',
    slug: 'economia-finanza',
    description: 'Progetti di sostenibilità, fondi comunitari e sistemi monetari equo-solidali.',
    color: '#c5a880',
    icon: 'TrendingUp',
    isSystem: true
  },
  {
    id: 'cat-diritti',
    name: 'Diritti & Costituzione',
    slug: 'diritti-costituzione',
    description: 'Garanzie dei cittadini, privacy digitale, libertà fondamentali e tutela legale.',
    color: '#10b981',
    icon: 'ShieldCheck',
    isSystem: true
  },
  {
    id: 'cat-tecnologia',
    name: 'Tecnologia & Innovazione',
    slug: 'tecnologia-innovazione',
    description: 'Tecnologie decentralizzate, intelligenza artificiale etica e infrastrutture sovrane.',
    color: '#6366f1',
    icon: 'Cpu',
    isSystem: true
  },
  {
    id: 'cat-cultura',
    name: 'Cultura & Società',
    slug: 'cultura-societa',
    description: 'Eventi comunitari, arte, istruzione libera e patrimonio della comunità sovrana.',
    color: '#ec4899',
    icon: 'Globe',
    isSystem: true
  }
];

export const INITIAL_ARTICLES: NewsArticle[] = [
  {
    id: 'art-111',
    title: "Il Flagello Silente: La Piaga dello Sfruttamento Minorile e l'Impegno Globale del New World State",
    slug: 'il-flagello-silente-la-piaga-dello-sfruttamento-minorile-e-limpegno-globale-del-new-world-state',
    categoryId: 'cat-diritti',
    intro: "Un'inchiesta approfondita sulle drammatiche dinamiche del lavoro forzato e dello sfruttamento minorile nel mondo, con il manifesto d'azione e le tutele universali promosse dal New World State per restituire futuro e dignità all'infanzia.",
    content: `Oltre 160 milioni di bambini nel mondo sono oggi intrappolati nelle maglie del lavoro minorile, costretti a sacrificare istruzione, salute e dignità in contesti di estrema vulnerabilità economica e geopolitica. Dalle miniere di cobalto e coltan dell'Africa subsahariana alle filiere tessili del Sud-Est asiatico, fino alle piantagioni agricole dell'America Latina e alle periferie invisibili delle metropoli occidentali, lo sfruttamento dell'infanzia rappresenta una delle ferite più profonde e intollerabili dell'ordine economico contemporaneo.

## La dimensione invisibile dell'emergenza globale

I dati delle organizzazioni internazionali certificano una battuta d'arresto senza precedenti nella lotta globale allo sfruttamento dei minori. Quasi la metà dei bambini impiegati nel lavoro forzato si trova in condizioni di lavoro pericoloso, esposta a sostanze tossiche, macchinari pesanti e orari disumani. Non si tratta di una fatalità geografica o culturale, ma della conseguenza diretta di catene di fornitura globalizzate strutturate sulla compressione spietata dei costi di produzione e sulla deregolamentazione selvaggia.

> "Un modello economico che fonda il proprio profitto o la propria competitività industriale sul lavoro forzato di un solo bambino è un modello intrinsecamente fallimentare e moralmente illegittimo. La sovranità dei popoli inizia dalla tutela incondizionata dell'infanzia."
> — Manifesto per la Dignità Umana, Assemblea Generale New World State

## Catene di fornitura opache e la responsabilità delle multinazionali

Mentre le grandi multinazionali tecnologiche, energetiche e dell'alta moda presentano bilanci di sostenibilità patinati, le materie prime essenziali per batterie, smartphone e abbigliamento low-cost continuano a essere estratte e lavorate da mani infantili lungo catene di subappalto intenzionalmente frammentate per eludere responsabilità penali e civili.

I meccanismi di certificazione volontaria e di audit aziendale si sono dimostrati inadeguati:
* Mancanza di ispezioni indipendenti senza preavviso nei siti estrattivi e manifatturieri remoti.
* Complice connivenza dei governi locali in cerca di investimenti esteri a qualsiasi costo sociale.
* Assenza di tracciabilità inviolabile dal punto di estrazione della materia prima al prodotto finito al consumo.
* Impunità giuridica transnazionale favorita dalla frammentazione giurisdizionale degli stati tradizionali.

## La Carta dei Diritti dell'Infanzia e l'Azione Diretta del New World State

Di fronte all'inerzia delle diplomazie convenzionali, il New World State 1.0 dichiara lo sfruttamento minorile un crimine contro la famiglia umana universale e attiva una serie di misure vincolanti per la propria comunità sovrana:

1. **Tracciabilità Crittografica Sovrana delle Filiere**: Ogni bene scambiato o certificato all'interno della rete economica del New World State deve disporre di un passaporto digitale con attestazione notarile decentralizzata che certifichi l'assoluta assenza di manodopera minorile lungo tutti i livelli della filiera.
2. **Fondo Sovrano di Riscatto e Istruzione Libera**: Stanziamento immediato di risorse a sostegno di borse di studio, centri educativi comunitari e reddito di dignità per le famiglie a basso reddito, per consentire ai minori di abbandonare il lavoro e rientrare stabilmente nei percorsi formativi.
3. **Blacklist Internazionale Pubblica delle Corporation Complici**: Istituzione di un registro pubblico immutabile accessibile ai cittadini globali in cui vengono segnalate e boicottate le aziende che beneficiano direttamente o indirettamente del lavoro forzato minorile.
4. **Accademia dei Custodi dell'Infanzia**: Una rete permanente di volontari, cronisti investigativi e giuristi sovrani impegnata sul campo nella documentazione e nel soccorso tempestivo di minori in condizioni di schiavitù o tratta.

## Un Patto Fondativo per il Futuro delle Nuove Generazioni

Proteggere i bambini non è un atto di carità, ma il pilastro irrinunciabile su cui costruire un nuovo ordine sociale basato sulla giustizia, sull'armonia universale e sulla pace duratura. La Costituzione Fondativa del New World State sancisce il diritto di ogni fanciullo a giocare, studiare, sognare e crescere libero da ogni forma di violenza e ricatto economico. Invitiamo tutti i cittadini, le comunità indipendenti e le organizzazioni etiche a unire le forze in questa battaglia di civiltà.`,
    images: [
      {
        type: 'image',
        source: 'url',
        url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
        caption: "Tutela dell'infanzia, diritto all'istruzione e dignità inviolabile nel New World State."
      }
    ],
    videos: [],
    tags: ['#DirittiUmani', '#Infanzia', '#GiustiziaSociale', '#NewWorldState', '#Solidarietà'],
    relatedArticleIds: ['art-102', 'art-101'],
    authorId: 1004,
    authorName: 'Elenor Vance (Cronista Capo)',
    authorRole: 'Cronista Diritti Umani',
    status: 'pubblicato',
    createdAt: '2026-08-26T09:00:00.000Z',
    publishedAt: '2026-08-26T10:00:00.000Z',
    updatedAt: '2026-08-26T10:00:00.000Z',
    isFeatured: true,
    viewsCount: 2180,
    translations: {
      en: {
        title: "The Silent Scourge: The Plague of Child Labour and the Global Commitment of the New World State",
        intro: "An in-depth investigation into the tragic dynamics of forced child labour around the world, presenting the manifesto of action and universal safeguards promoted by the New World State to restore dignity and a future to children.",
        content: `Over 160 million children worldwide are currently trapped in child labour, forced to sacrifice education, health, and human dignity in contexts of severe economic and geopolitical vulnerability. From the cobalt and coltan mines of sub-Saharan Africa to the textile sweatshops of South-East Asia, from agricultural plantations across Latin America to the invisible peripheries of Western metropolises, the exploitation of childhood remains one of the deepest and most intolerable wounds of the contemporary global economy.

## The Invisible Dimension of the Global Emergency

Data from international organizations confirm an unprecedented setback in the global fight against child exploitation. Nearly half of all children engaged in forced labour endure hazardous conditions, exposed to toxic chemicals, heavy machinery, and inhumane working hours. This is not a geographical or cultural inevitability, but the direct consequence of globalized supply chains engineered for ruthless cost compression and deregulation.

> "An economic model that builds its profit or industrial competitiveness on the forced labour of a single child is an inherently bankrupt and morally illegitimate model. People's sovereignty begins with the unconditional protection of childhood."
> — Manifesto for Human Dignity, New World State General Assembly

## Opaque Supply Chains and Corporate Responsibility

While major multinational technology, energy, and fast-fashion corporations publish glossy sustainability reports, essential raw materials for batteries, smartphones, and low-cost apparel continue to be extracted and processed by children's hands along subcontracting chains intentionally fragmented to evade criminal and civil liability.

Voluntary corporate certification and auditing mechanisms have proven thoroughly inadequate:
* Lack of unannounced, independent inspections in remote mining and manufacturing hubs.
* Complicity of local authorities seeking foreign investments at any social cost.
* Absence of tamper-proof traceability from the raw material extraction point to final retail consumption.
* Transnational legal impunity enabled by the jurisdictional fragmentation of traditional nation-states.

## The Charter of Children's Rights and Direct Action by the New World State

Faced with the inertia of conventional diplomacies, New World State 1.0 declares child exploitation a crime against the universal human family and enacts binding measures for its sovereign community:

1. **Sovereign Cryptographic Supply Chain Traceability**: Every good exchanged or certified within the New World State economic network must hold a digital passport with decentralized notarization certifying the complete absence of child labour across every supply tier.
2. **Sovereign Redemption and Free Education Fund**: Immediate allocation of resources to fund scholarships, community educational centers, and dignity allowances for low-income families, enabling children to leave hazardous work and return permanently to education.
3. **Public International Blacklist of Complicit Corporations**: Establishment of an immutable, publicly accessible registry alerting citizens to corporations directly or indirectly benefiting from forced child labour.
4. **Academy of Childhood Custodians**: A permanent network of volunteers, investigative journalists, and sovereign jurists dedicated to documenting violations and securing immediate rescue for children in conditions of slavery or trafficking.

## A Foundational Pact for the Future of Rising Generations

Protecting children is not an act of charity, but the essential cornerstone upon which to build a new social order founded on justice, universal harmony, and lasting peace. The Foundational Constitution of the New World State guarantees every child the right to play, learn, dream, and grow free from violence and economic extortion. We invite all sovereign citizens, independent communities, and ethical organizations to unite in this historic civil battle.`
      },
      fr: {
        title: "Le Fléau Silencieux : Le Ravage du Travail des Enfants et l'Engagement Mondial du New World State",
        intro: "Une enquête approfondie sur les dynamiques dramatiques du travail forcé des enfants dans le monde, avec le manifeste d'action et les protections universelles du New World State.",
        content: `Plus de 160 millions d'enfants dans le monde sont aujourd'hui pris au piège du travail forcé, contraints de sacrifier éducation, santé et dignité humaine dans des contextes d'extrême vulnérabilité économique et géopolitique. Des mines de cobalt et de coltan d'Afrique subsaharienne aux ateliers textiles d'Asie du Sud-Est, des plantations agricoles d'Amérique latine aux périphéries invisibles des métropoles occidentales, l'exploitation de l'enfance demeure l'une des blessures les plus intolérables de l'économie mondiale contemporaine.

## La dimension invisible de l'urgence mondiale

Les données des organisations internationales confirment un recul sans précédent dans la lutte contre l'exploitation des mineurs. Près de la moitié des enfants astreints au travail forcé subissent des conditions dangereuses, exposés à des produits chimiques toxiques, à des machines lourdes et à des horaires inhumains. Il ne s'agit pas d'une fatalité géographique, mais de la conséquence directe de chaînes d'approvisionnement mondialisées conçues pour la compression impitoyable des coûts.

> "Un modèle économique qui fonde son profit ou sa compétitivité industrielle sur le travail forcé d'un seul enfant est un modèle intrinsèquement en faillite et moralement illégitime. La souveraineté des peuples commence par la protection inconditionnelle de l'enfance."
> — Manifeste pour la Dignité Humaine, Assemblée Générale du New World State

## Chaînes d'approvisionnement opaques et responsabilité des multinationales

Alors que les grandes multinationales de la technologie, de l'énergie et de la mode rapide publient des rapports de durabilité soignés, les matières premières indispensables continuent d'être extraites et transformées par des mains d'enfants le long de filières de sous-traitance fragmentées pour échapper aux poursuites civiles et pénales.

Les mécanismes d'audit d'entreprise et de certification volontaire ont démontré leur inefficacité totale :
* Absence d'inspections indépendantes et inopinées sur les sites isolés.
* Complicité des gouvernements locaux en quête d'investissements à tout prix.
* Absence de traçabilité infalsifiable du point d'extraction au consommateur final.
* Impunité juridique transnationale favorisée par le morcellement juridictionnel.

## La Charte des Droits de l'Enfance et l'Action Directe du New World State

Face à l'inertie des diplomaties traditionnelles, New World State 1.0 déclare l'exploitation infantile crime contre l'humanité universelle et adopte des mesures contraignantes :

1. **Traçabilité Cryptographique Souveraine des Filières** : Passeport numérique décentralisé obligatoire certifiant l'absence absolue de travail des enfants à chaque échelon de production.
2. **Fonds Souverain de Rachat et Éducation Gratuite** : Allocation directe de bourses et d'un revenu de dignité pour permettre aux enfants de quitter le travail et de retrouver l'école.
3. **Blacklist Internationale Publique des Entreprises Complices** : Registre public immuable signalant et boycottant les firmes tirant profit du travail des enfants.
4. **Académie des Gardiens de l'Enfance** : Réseau permanent de juristes, volontaires et journalistes d'investigation pour le secours immédiat des mineurs exploités.

## Un Pacte Fondateur pour l'Avenir des Nouvelles Générations

Protéger les enfants n'est pas un acte de charité, mais le pilier fondamental d'un nouvel ordre social fondé sur la justice et la paix. La Constitution du New World State garantit à chaque enfant le droit de jouer, d'apprendre, de rêver et de grandir à l'abri de toute violence.`
      },
      es: {
        title: "El Flagelo Silente: La Plaga del Trabajo Infantil y el Compromiso Global del New World State",
        intro: "Una investigación profunda sobre la dramática realidad del trabajo infantil forzado en el mundo, con el manifiesto de acción y garantías universales del New World State.",
        content: `Más de 160 millones de niños en el mundo están hoy atrapados en las redes del trabajo infantil, obligados a sacrificar educación, salud y dignidad humana en contextos de extrema vulnerabilidad económica y geopolítica. Desde las minas de cobalto y coltán del África subsahariana hasta los talleres textiles del Sudeste Asiático, las plantaciones agrícolas de América Latina y las periferias invisibles de las metrópolis occidentales, la explotación de la infancia representa una de las heridas más profundas e intolerables de la economía global contemporánea.

## La dimensión invisible de la emergencia global

Los datos de los organismos internacionales certifican un retroceso sin precedentes en la lucha contra la explotación de menores. Casi la mitad de los niños sometidos a trabajos forzados sufren condiciones de alto riesgo, expuestos a sustancias tóxicas, maquinaria pesada y jornadas extenuantes. No es una fatalidad cultural, sino la consecuencia directa de cadenas de suministro globales diseñadas para abaratar costes sin escrúpulos.

> "Un modelo económico que basa su beneficio o su competitividad en el trabajo forzado de un solo niño es intrínsecamente ilegítimo y moralmente quebrado. La soberanía de los pueblos comienza con la protección incondicional de la infancia."
> — Manifiesto por la Dignidad Humana, Asamblea General del New World State

## Cadenas de suministro opacas y responsabilidad corporativa

Mientras grandes corporaciones publican lujosos informes de sostenibilidad, las materias primas fundamentales para baterías, teléfonos móviles y moda rápida siguen extrayéndose y procesándose con manos infantiles mediante cadenas de subcontratación fragmentadas para evadir responsabilidades legales.

Los sistemas tradicionales de auditoría voluntaria han fracasado:
* Carencia de inspecciones independientes e imprevistas en áreas mineras remotas.
* Complicidad de autoridades locales interesadas en captar inversiones a cualquier coste.
* Inexistencia de trazabilidad inmutable desde el yacimiento hasta el consumidor.
* Impunidad jurídica transnacional propiciada por la división de fronteras convencionales.

## La Carta de Derechos de la Infancia y la Acción Directa del New World State

Ante la inacción de la diplomacia tradicional, New World State 1.0 declara la explotación infantil un crimen contra la familia humana universal e instaura medidas de obligado cumplimiento:

1. **Trazabilidad Criptográfica Soberana de la Cadena de Suministro**: Pasaporte digital inmutable que certifica el origen limpio de cualquier producto dentro del circuito económico soberano.
2. **Fondo Soberano de Rescate y Educación Gratuita**: Recursos directos para becas, comedores escolares y rentas de dignidad para apartar a los menores del trabajo.
3. **Lista Negra Internacional de Corporaciones Cómplices**: Registro público accesible a toda la ciudadanía mundial para boicotear a las empresas infractoras.
4. **Academia de Custodios de la Infancia**: Red de juristas, periodistas y voluntarios dedicada al rescate e integración de menores en situación de esclavitud.

## Un Pacto Fundacional para el Futuro de las Nuevas Generaciones

Proteger a la infancia no es caridad, sino el cimiento indispensable de un orden mundial justo y fraterno. La Constitución del New World State garantiza el derecho de cada niño a educarse, jugar y soñar libre de violencia.`
      },
      pt: {
        title: "O Flagelo Silencioso: A Chaga do Trabalho Infantil e o Compromisso Global do New World State",
        intro: "Uma investigação aprofundada sobre a exploração infantil no mundo, com o manifesto de ação e salvaguardas universais do New World State para devolver dignidade às crianças.",
        content: `Mais de 160 milhões de crianças no mundo estão hoje encurraladas no trabalho infantil forçado, sacrificando educação, saúde e dignidade humana. Desde as minas de cobalto na África até os setores têxteis na Ásia e lavouras na América Latina, a exploração infantil é uma chaga intolerável da economia contemporânea.

## A dimensão invisível da emergência global

Organizações internacionais apontam um retrocesso alarmante. Metade dessas crianças trabalham em condições perigosas, manipulando químicos tóxicos e maquinários pesados sob jornadas desumanas. Isso decorre diretamente da precarização das cadeias globais de suprimentos.

> "Um modelo produtivo que obtém lucro com o trabalho forçado de uma única criança é falho e moralmente ilegítimo."
> — Manifesto da Dignidade Humana, New World State

## Cadeias de suprimento opacas e ação soberana

Grandes corporações continuam a usar subcontratações obscuras para escapar da fiscalização e da responsabilidade jurídica.

O New World State 1.0 estabelece medidas diretas e irrevogáveis:
1. **Rastreabilidade Criptográfica Soberana**: Passaportes digitais auditáveis via blockchain para certificar a ausência total de mão de obra infantil.
2. **Fundo Soberano de Educação Gratuita**: Rendas de dignidade para as famílias e bolsas de estudo para garantir o regresso das crianças à escola.
3. **Lista Pública de Boicote a Empresas Cúmplices**: Registro aberto para transparência global.
4. **Guardiões da Infância**: Força-tarefa jurídica e humanitária de proteção ativa aos menores.`
      },
      ru: {
        title: "Безмолвное бедствие: бремя детского труда и глобальные обязательства New World State",
        intro: "Глубокое расследование проблемы детского труда и эксплуатации в мире, с манифестом действий и универсальными гарантиями New World State.",
        content: `Более 160 миллионов детей по всему миру вовлечены в принудительный детский труд, лишаясь права на образование, здоровье и человеческое достоинство. От кобальтовых шахт Африки до швейных производств Азии и плантаций Латинской Америки — эксплуатация детей остается одной из самых тяжелых ран мировой экономики.

## Невидимый масштаб кризиса

Почти половина работающих детей трудятся в опасных условиях: с токсичными веществами, тяжелой техникой и изнурительным графиком. Это прямой результат погони транснациональных корпораций за снижением издержек.

> "Экономическая система, строящая свою прибыль на принудительном труде хотя бы одного ребенка, является банкротом и морально нелегитимна."
> — Манифест человеческого достоинства, New World State

## План прямого действия New World State 1.0

1. **Криптографическая суверенная прослеживаемость**: Цифровые паспорта продукции, гарантирующие отсутствие детского труда по всей цепочке поставок.
2. **Суверенный фонд бесплатного образования**: Выплата стипендий и пособий семьям для возвращения детей в школы.
3. **Международный публичный реестр корпораций-нарушителей**: Открытый реестр для гражданского бойкота недобросовестных компаний.
4. **Академия защитников детства**: Сеть юристов и волонтеров для оперативного спасения детей из рабства.`
      },
      hi: {
        title: "मूक विपत्ति: बाल श्रम का अभिशाप और New World State की वैश्विक प्रतिबद्धता",
        intro: "दुनिया भर में बाल श्रम के शोषण पर गहन जांच और बच्चों के भविष्य व सम्मान की रक्षा के लिए New World State का वैश्विक घोषणापत्र।",
        content: `विश्व भर में 16 करोड़ से अधिक बच्चे बाल श्रम में फंसे हुए हैं, जो अत्यधिक आर्थिक और भू-राजनीतिक संकट के बीच शिक्षा, स्वास्थ्य और मानवीय गरिमा का त्याग करने को मजबूर हैं। अफ्रीका की खदानों से लेकर एशिया के कपड़ा कारखानों और लैटिन अमेरिका के खेतों तक, बाल शोषण आधुनिक वैश्विक अर्थव्यवस्था का एक असहनीय घाव है।

## वैश्विक आपातकाल का अनदेखा पहलू

जबरन श्रम में लगे लगभग आधे बच्चे खतरनाक परिस्थितियों में काम करते हैं, जहां वे जहरीले रसायनों और अमानवीय कामकाजी घंटों के शिकार होते हैं। यह लागत कम करने के लिए बनाई गई अनियंत्रित आपूर्ति श्रृंखलाओं का सीधा परिणाम है।

> "जो आर्थिक मॉडल एक भी बच्चे के बंधुआ श्रम पर अपना लाभ खड़ा करता है, वह नैतिक रूप से अवैध है।"
> — मानव गरिमा घोषणापत्र, New World State महासभा

## New World State 1.0 की प्रत्यक्ष कार्ययोजना

1. **संप्रभु क्रिप्टोग्राफिक आपूर्ति श्रृंखला ट्रैकिंग**: आपूर्ति श्रृंखला में बाल श्रम की पूर्ण अनुपस्थिति प्रमाणित करने के लिए विकेंद्रीकृत डिजिटल पासपोर्ट।
2. **मुफ्त शिक्षा एवं गरिमा कोष**: बच्चों को श्रम से मुक्त कर स्कूल वापस लाने हेतु परिवारों के लिए छात्रवृत्ति और वित्तीय सहायता।
3. **दोषी बहुराष्ट्रीय कंपनियों की सार्वजनिक ब्लैकलिस्ट**: बाल श्रम से लाभ कमाने वाली कंपनियों के खिलाफ खुला वैश्विक रजिस्टर।
4. **बाल संरक्षक अकादमी**: बाल तस्करी और शोषण के खिलाफ कानूनी और मानवीय सुरक्षा नेटवर्क।`
      },
      bn: {
        title: "নীরব সংকট: শিশুশ্রমের অভিশাপ এবং New World State-এর বৈশ্বিক অঙ্গীকার",
        intro: "বিশ্বজুড়ে জবরদস্তিমূলক শিশুশ্রম এবং চরম শোষণের বিরুদ্ধে একটি গভীর অনুসন্ধানী প্রতিবেদন, যাতে শিশুদের মর্যাদা ও ভবিষ্যৎ পুনরুদ্ধারে New World State-এর সার্বজনীন কর্মপরিকল্পনা ও সুরক্ষা রূপরেখা তুলে ধরা হয়েছে।",
        content: `বর্তমানে বিশ্বজুড়ে ১৬ কোটিরও বেশি শিশু জোরপূর্বক শ্রমে নিযুক্ত রয়েছে, যারা চরম অর্থনৈতিক ও ভূ-রাজনৈতিক ঝুঁকির মুখে শিক্ষা, স্বাস্থ্য এবং মৌলিক মানবিক মর্যাদা বিসর্জন দিতে বাধ্য হচ্ছে। সাব-সাহারান আফ্রিকার কোবাল্ট ও কোল্টান খনি থেকে শুরু করে দক্ষিণ-পূর্ব এশিয়ার পোশাক কারখানা, ল্যাটিন আমেরিকার কৃষিখামার থেকে পশ্চিমা মহানগরীর অদৃশ্য বস্তি এলাকা পর্যন্ত—শিশুদের এই শোষণ সমসাময়িক বৈশ্বিক অর্থনীতির সবচেয়ে বেদনাদায়ক ও অসহনীয় ক্ষতগুলোর একটি।

## বৈশ্বিক জরুরি পরিস্থিতির অদৃশ্য রূপ

আন্তর্জাতিক সংস্থাগুলোর সাম্প্রতিক তথ্য নিশ্চিত করে যে শিশুশ্রম নির্মূলে বৈশ্বিক লড়াইয়ে অভূতপূর্ব স্থবিরতা নেমে এসেছে। জবরদস্তিমূলক শ্রমে নিয়োজিত শিশুদের প্রায় অর্ধেকেরও বেশি বিপজ্জনক পরিবেশে কাজ করে, যেখানে তারা বিষাক্ত রাসায়নিক, ভারী যন্ত্রপাতি এবং অমানবিক কর্মঘণ্টার শিকার হয়। এটি কোনো ভৌগোলিক বা সাংস্কৃতিক নিয়তি নয়, বরং উৎপাদন খরচ কমানো এবং অনিয়ন্ত্রিত বাণিজ্যের জন্য নির্মিত বৈশ্বিক সরবরাহ শৃঙ্খলের সরাসরি পরিণতি।

> "যে অর্থনৈতিক ব্যবস্থা একটি একক শিশুর জবরদস্তিমূলক শ্রমের ওপর ভিত্তি করে মুনাফা বা শিল্প প্রতিযোগিতা গড়ে তোলে, তা নীতিগতভাবে দেউলিয়া এবং নৈতিকভাবে অবৈধ। জনগণের প্রকৃত সার্বভৌমত্ব শুরু হয় শৈশবের নিঃশর্ত সুরক্ষার মধ্য দিয়ে।"
> — মানব মর্যাদার ঘোষণাপত্র, New World State সাধারণ পরিষদ

## অস্বচ্ছ সরবরাহ শৃঙ্খল এবং বহুজাতিক কর্পোরেশনের দায়

যদিও শীর্ষস্থানীয় প্রযুক্তি, জ্বালানি ও ফ্যাশন কর্পোরেশনগুলো চকচকে টেকসই প্রতিবেদন প্রকাশ করে, তবুও ব্যাটারি, স্মার্টফোন এবং সস্তা পোশাক তৈরির কাঁচামাল শিশুদের হাতেই উত্তোলিত ও প্রক্রিয়াজাত হচ্ছে। আইনি দায় এড়াতে উপ-চুক্তিগুলোর শৃঙ্খল ইচ্ছাকৃতভাবে খণ্ড-বিখণ্ড করে রাখা হয়েছে।

কর্পোরেট স্বেচ্ছাসেবী নিরীক্ষা এবং সার্টিফিকেশন ব্যবস্থা সম্পূর্ণ ব্যর্থ প্রমাণিত হয়েছে:
* প্রত্যন্ত খনি ও উৎপাদন কেন্দ্রে পূর্বঘোষণা ছাড়া স্বাধীন পরিদর্শনের চরম অভাব।
* যে কোনো মূল্যে বিদেশি বিনিয়োগ আকর্ষণের জন্য স্থানীয় কর্তৃপক্ষের পরোক্ষ যোগসাজশ।
* কাঁচামাল উত্তোলন থেকে চূড়ান্ত ভোক্তা পর্যন্ত অপরিবর্তনীয় ডিজিটাল ট্র্যাকিং ব্যবস্থার অনুপস্থিতি।
* ঐতিহ্যবাহী রাষ্ট্রগুলোর আঞ্চলিক সীমানার কারণে সৃষ্ট আন্তর্জাতিক আইনি দায়মুক্তি।

## শিশুদের অধিকার সনদ এবং New World State-এর প্রত্যক্ষ পদক্ষেপ

প্রচলিত কূটনৈতিক নিষ্ক্রিয়তার মুখে, New World State 1.0 শিশুশ্রম ও শোষণকে সমগ্র মানবজাতির বিরুদ্ধে অপরাধ হিসেবে ঘোষণা করেছে এবং নিজস্ব সার্বভৌম নাগরিক সমাজের জন্য বাধ্যতামূলক পদক্ষেপ গ্রহণ করেছে:

1. **সার্বভৌম ক্রিপ্টোগ্রাফিক সরবরাহ শৃঙ্খল নজরদারি**: New World State অর্থনৈতিক নেটওয়ার্কের আওতায় সমস্ত পণ্যের জন্য বিকেন্দ্রীভূত ডিজিটাল পাসপোর্ট থাকা বাধ্যতামূলক, যা সরবরাহ শৃঙ্খলের প্রতিটি ধাপে শিশুশ্রমের সম্পূর্ণ অনুপস্থিতি নিশ্চিত করবে।
2. **সার্বভৌম মুক্তি ও অবৈতনিক শিক্ষা তহবিল**: নিম্ন আয়ের পরিবারগুলোর জন্য বৃত্তি, সামাজিক শিক্ষা কেন্দ্র এবং মর্যাদা ভাতা প্রদানের লক্ষ্যে তাৎক্ষণিক তহবিল বরাদ্দ, যাতে শিশুরা বিপজ্জনক কাজ ছেড়ে স্থায়ীভাবে বিদ্যালয়ে ফিরতে পারে।
3. **জড়িত বহুজাতিক প্রতিষ্ঠানের আন্তর্জাতিক গণ-তালিকা (Blacklist)**: একটি অপরিবর্তনীয় উন্মুক্ত পাবলিক রেজিস্ট্রি, যা শিশুশ্রম থেকে প্রত্যক্ষ বা পরোক্ষভাবে লাভবান হওয়া সংস্থাগুলোর বিরুদ্ধে বিশ্ববাসীকে সতর্ক ও সচেতন করবে।
4. **শৈশব রক্ষক একাডেমি (Custodians of Childhood)**: স্বেচ্ছাসেবক, অনুসন্ধানী সাংবাদিক এবং আন্তর্জাতিক আইনবিদদের একটি স্থায়ী নেটওয়ার্ক, যা দাসত্ব বা পাচারের শিকার শিশুদের তাৎক্ষণিক উদ্ধার ও আইনি সহায়তা প্রদানে নিবেদিত।

## নতুন প্রজন্মের ভবিষ্যতের জন্য একটি মৌলিক চুক্তি

শিশুদের সুরক্ষা প্রদান কোনো করুণার বিষয় নয়, বরং ন্যায়বিচার, সার্বজনীন সম্প্রীতি এবং স্থায়ী শান্তির ওপর ভিত্তি করে একটি নতুন সামাজিক ব্যবস্থা গড়ে তোলার অপরিহার্য ভিত্তিস্তম্ভ। New World State-এর সংবিধান প্রতিটি শিশুর খেলাধুলা, শিক্ষা, স্বপ্ন দেখা এবং সহিংসতা ও অর্থনৈতিক শোষণমুক্ত পরিবেশে বেড়ে ওঠার অধিকার নিশ্চিত করে। আমরা সমস্ত সার্বভৌম নাগরিক, মুক্ত সম্প্রদায় ও নৈতিক সংস্থাকে এই ঐতিহাসিক মানবিক সংগ্রামে ঐক্যবদ্ধ হওয়ার আহ্বান জানাই।`
      },
      zh: {
        title: "无声的祸患：童工剥削问题与新世界国家的全球承诺",
        intro: "关于全球童工与强迫劳动现状的深入调查报告，以及新世界国家为捍卫儿童权益所采取的全球行动宣言。",
        content: `全球有超过1.6亿儿童被迫卷入童工劳动，在严酷的地缘政治与经济环境下失去了接受教育、保障健康和基本尊严的权利。从非洲的矿区到亚洲的制衣厂和拉美的农田，童工剥削依然是当代全球经济中最沉痛的伤疤。

## 隐蔽的全球危机

被迫劳动的儿童中，近半数处于高危工作环境，面临有毒有害化学品和非人道工时的折磨。这并非自然宿命，而是跨国企业为压缩成本而构建的全球供应链所造成的恶果。

> “任何将利润建立在强迫童工基础之上的经济模式，在道德上都是非法的。”
> — 新世界国家人权宣言

## 新世界国家的直接行动举措

1. **主权加密供应链溯源**：强制推行去中心化数字护照，确保认证产品全链条无童工参与。
2. **主权教育救援基金**：为贫困家庭提供尊严补贴和全额助学金，让孩子们彻底重返校园。
3. **涉事跨国企业全球公开黑名单**：设立不可篡改的公共登记册，抵制从童工劳动中获利的企业。
4. **儿童守护者学院**：由法学家和志愿者组成的常设救援网络。`
      },
      ja: {
        title: "静かなる災禍：児童労働の惨禍と新世界国家のグローバルな誓約",
        intro: "世界的な児童労働の過酷な現実に迫る徹底調査と、子どもの尊厳と未来を守るための新世界国家の行動指針。",
        content: `現在、世界で1億6千万人を超える子どもたちが児童労働を強いられ、教育、健康、そして人間の尊厳を奪われています。鉱山から縫製工場、農園に至るまで、子どもの搾取は現代のグローバル経済における最も許されざる悲劇です。

## 新世界国家の主権的アクションプラン

1. **主権的暗号化サプライチェーン追跡**：児童労働の完全な不在を保証する分散型デジタル証明。
2. **教育支援と救済基金**：子どもたちが労働から解放され学校へ復帰するための無償支援。
3. **加担企業のグローバル・ブラックリスト**：児童労働から利益を得る企業を公表しボイコット。
4. **児童守護団ネットワーク**：法学者と有志による緊急救出・保護体制。`
      },
      ar: {
        title: "الكارثة الصامتة: آفة عمالة الأطفال والالتزام العالمي لـ New World State",
        intro: "تحقيق معمق حول الاستغلال والعمل القسري للأطفال حول العالم، مع ميثاق العمل والضمانات الشاملة التي ترعاها New World State.",
        content: `يعاني أكثر من 160 مليون طفل حول العالم من العمل القسري، حيث يُحرمون من التعليم والصحة والكرامة الإنسانية. من مناجم الكوبالت في إفريقيا إلى مصانع النسيج في آسيا ومزارع أمريكا اللاتينية، يبقى استغلال الطفولة وصمة عار في جبين الاقتصاد العالمي.

## خطة عمل New World State 1.0

1. **التتبع الرقمي السيادي لسلاسل الإمداد**: اعتماد جوازات سفر رقمية لا مركزية تضمن خلو المنتجات تماماً من عمالة الأطفال.
2. **صندوق الفداء السيادي والتعليم المجاني**: منح دراسية ومساعدات كرامة للأسر لتمكين الأطفال من العودة الدائمة إلى المدارس.
3. **القائمة السوداء الدولية للشركات المتورطة**: سجل عام لحظر ومقاطعة المؤسسات المستفيدة من استغلال الأطفال.
4. **أكاديمية حماة الطفولة**: شبكة دائمة من الحقوقيين والإعلاميين لإغاثة الأطفال ضحايا الاستعباد والاتجار.`
      }
    }
  },
  {
    id: 'art-104',
    title: 'L\'Impotenza Strategica: Analisi delle Cause Profonde della Paralisi ONU nei Conflitti Attuali',
    slug: 'limpotenza-strategica-analisi-delle-cause-profonde-della-paralisi-onu-nei-conflictti-attuali',
    categoryId: 'cat-politica',
    intro: 'Analisi di approfondimento geopolitico sulla paralisi del Consiglio di Sicurezza ONU nei conflitti contemporanei e sulla necessità di nuove strutture di governance globale decentralizzata.',
    content: `Il sistema di sicurezza collettiva nato nel 1945 mostra crepe strutturali non più rinviabili. Di fronte all'escalation delle crisi internazionali e al ricorso sistematico al diritto di veto da parte dei membri permanenti del Consiglio di Sicurezza, le Nazioni Unite si trovano in uno stato di sostanziale paralisi operativa.

Questo reportage speciale del Giornale Sovrano New World State analizza le ragioni storiche, giuridiche e diplomatiche del blocco istituzionale, proponendo la transizione verso un modello federale di democrazia diretta digitale e risoluzione pacifica delle controversie.

"Senza una riforma radicale che superi i privilegi del dopoguerra," sottolinea il centro studi NWS, "la diplomazia tradizionale continuerà ad arrestarsi di fronte agli interessi particolari delle grandi potenze."`,
    images: [
      {
        type: 'image',
        source: 'url',
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        caption: 'Assemblea e Consiglio di Sicurezza delle Nazioni Unite'
      }
    ],
    videos: [],
    tags: ['#ONU', '#Geopolitica', '#Diplomazia', '#Pace', '#Sovranità'],
    relatedArticleIds: ['art-101'],
    authorId: 1004,
    authorName: 'Elenor Vance (Cronista Capo)',
    authorRole: 'Cronista Ufficiale',
    status: 'pubblicato',
    createdAt: '2026-08-25T09:09:23.871Z',
    publishedAt: '2026-08-25T09:09:23.871Z',
    updatedAt: '2026-08-25T09:09:23.871Z',
    isFeatured: true,
    viewsCount: 1420
  },
  {
    id: 'art-103',
    title: 'Infrastrutture Decentralizzate: Test del Nodo di Rete e Ridondanza dei Server',
    slug: 'infrastrutture-decentralizzate-test-nodo-rete-ridondanza',
    categoryId: 'cat-tecnologia',
    intro: 'Test di resilienza completato con successo su 12 nodi distribuiti globalmente per garantire l\'operatività ininterrotta del portale.',
    content: `Nelle ultime 48 ore la squadra di tecnici e custodi della rete ha condotto uno stress test sulle infrastrutture di calcolo e memoria distribuita. Il sistema ha dimostrato una tolleranza ai guasti del 99.98%, mantenendo attiva la sincronizzazione dei dati anche durante picchi di affluenza contemporanea.

Il piano di espansione prevede l'integrazione di ulteriori 8 nodi comunitari gestiti direttamente dalle delegazioni regionali con protocolli crittografici a chiave asimmetrica.`,
    images: [
      {
        type: 'image',
        source: 'url',
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        caption: 'Rete di nodi e connettività globale dello Stato Sovrano.'
      }
    ],
    videos: [],
    tags: ['#Tecnologia', '#ReteDecentralizzata', '#Cloud', '#Resilienza'],
    relatedArticleIds: ['art-101', 'art-102'],
    authorId: 1003,
    authorName: 'Sophia Chen',
    authorRole: 'Cronista Tecnologico',
    status: 'pubblicato',
    createdAt: '2026-08-24T09:09:23.871Z',
    publishedAt: '2026-08-25T09:09:23.871Z',
    updatedAt: '2026-08-25T09:09:23.871Z',
    isFeatured: false,
    viewsCount: 615
  },
  {
    id: 'art-102',
    title: 'Protocollo di Trasparenza Finanziaria e Tutela della Privacy dei Cittadini',
    slug: 'protocollo-trasparenza-finanziaria-tutela-privacy',
    categoryId: 'cat-diritti',
    intro: 'Approvato a maggioranza qualificata il nuovo disciplinare a protezione dei dati biometrici e per la riservatezza delle transazioni comunitarie.',
    content: `Il Corpo dei Custodi Digitali ha ratificato il nuovo Protocollo di Trasparenza Finanziaria e Protezione della Riservatezza. Questo regolamento garantisce che nessuna informazione personale sensibile venga ceduta o profilata da soggetti terzi.

Tutti i registri di voto e le transazioni amministrative impiegano firme crittografiche asimmetriche, assicurando che l'identità del singolo cittadino rimanga tutelata e protetta da ingerenze esterne.

I cronisti e i cittadini possono verificare autonomamente i registri di audit tramite il pannello di controllo della rete sovrana.`,
    images: [
      {
        type: 'image',
        source: 'url',
        url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
        caption: 'Crittografia e protezione della privacy nel sistema New World State.'
      }
    ],
    videos: [],
    tags: ['#Privacy', '#Crittografia', '#Sicurezza', '#CustodiDigitali'],
    relatedArticleIds: ['art-101'],
    authorId: 1002,
    authorName: 'Marcus Thorne',
    authorRole: 'Cronista di Stato',
    status: 'pubblicato',
    createdAt: '2026-08-22T09:09:23.871Z',
    publishedAt: '2026-08-23T09:09:23.871Z',
    updatedAt: '2026-08-23T09:09:23.871Z',
    isFeatured: false,
    viewsCount: 890
  },
  {
    id: 'art-101',
    title: 'Inaugurazione del Registro Globale e del Portale di Democrazia Diretta 1.0',
    slug: 'inaugurazione-registro-globale-democrazia-diretta-10',
    categoryId: 'cat-politica',
    intro: 'L\'Assemblea Fondativa annuncia l\'apertura del portale sovrano decentralizzato. Tutti i cittadini hanno ora diritto di voto diretto sui referendum federali.',
    content: `Oggi segna una tappa fondamentale nella storia della governance sovrana contemporanea. Con il lancio ufficiale del Registro Globale della Cittadinanza e del Portale di Democrazia Diretta, la nostra comunità digitale stabilisce un nuovo punto di riferimento per l'autodeterminazione, la trasparenza istituzionale e la partecipazione popolare diretta.

I cittadini registrati hanno la facoltà di consultare la Costituzione Fondativa, votare sui referendum attivi e proporre nuove leggi d'iniziativa popolare con tracciabilità crittografica e verifica d'identità in tempo reale.

"La sovranità appartiene alla comunità dei cittadini organizzati in rete," dichiara la nota congiunta del Consiglio di Presidenza e del Corpo dei Custodi Digitali. "Ogni decisione legislativa sarà da oggi discussa apertamente con audit pubblici trasparenti."`,
    images: [
      {
        type: 'image',
        source: 'url',
        url: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sessione di apertura dell\'Assemblea Fondativa e del Registro Globale.'
      }
    ],
    videos: [
      {
        type: 'video',
        source: 'url',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        caption: 'Video di presentazione del Registro Sovrano della Cittadinanza.'
      }
    ],
    tags: ['#Democrazia', '#Sovranità', '#Assemblea', '#Costituzione'],
    relatedArticleIds: [],
    authorId: 1001,
    authorName: 'Elenor Vance (Cronista Capo)',
    authorRole: 'Cronista Ufficiale',
    status: 'pubblicato',
    createdAt: '2026-08-20T09:09:23.871Z',
    publishedAt: '2026-08-21T09:09:23.871Z',
    updatedAt: '2026-08-21T09:09:23.871Z',
    isFeatured: true,
    viewsCount: 1240
  },
  {
    id: 'art-105',
    title: 'Fondo Sovrano di Sostegno Comunitario e Finanza Etica Distribuita',
    slug: 'fondo-sovrano-sostegno-comunitario-finanza-etica-distribuita',
    categoryId: 'cat-economia',
    intro: 'Istituito il Fondo Sovrano d\'Investimento Solidale per finanziare progetti di autosufficienza energetica e sviluppo agroalimentare sostenibile.',
    content: `L'Assemblea Federale ha approvato il primo stanziamento programmatico per il Fondo Sovrano di Sostegno Comunitario. Il fondo, gestito con trasparenza su registri crittografici aperti, destina risorse a tasso zero per lo sviluppo di comunità autosufficienti, cooperative di lavoro e infrastrutture ad energia rinnovabile.

Ogni spesa e rendicontazione trimestrale è soggetta ad approvazione diretta da parte dei cittadini attraverso il Portale di Democrazia Diretta, eliminando intermediazioni bancarie speculative e garantendo un impatto sociale reale.`,
    images: [
      {
        type: 'image',
        source: 'url',
        url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
        caption: 'Finanza etica e modelli economici comunitari sostenibili.'
      }
    ],
    videos: [],
    tags: ['#Economia', '#FinanzaEtica', '#FondoSovrano', '#Sostenibilita'],
    relatedArticleIds: ['art-101'],
    authorId: 1002,
    authorName: 'Marcus Thorne',
    authorRole: 'Cronista di Stato',
    status: 'pubblicato',
    createdAt: '2026-08-23T11:00:00.000Z',
    publishedAt: '2026-08-24T08:00:00.000Z',
    updatedAt: '2026-08-24T08:00:00.000Z',
    isFeatured: true,
    viewsCount: 750
  },
  {
    id: 'art-106',
    title: 'Accademia dei Custodi e Diritto Naturale: Programma Educativo Universale',
    slug: 'accademia-dei-custodi-diritto-naturale-programma-educativo-universale',
    categoryId: 'cat-cultura',
    intro: 'Aperte le iscrizioni per i corsi internazionali liberi su sovranità personale, diritti inalienabili e autodeterminazione dei popoli.',
    content: `La Sovrintendenza Culturale di New World State annuncia l'avvio dell'Accademia dei Custodi, un polo didattico aperto e gratuito dedicato alla divulgazione del diritto naturale, della filosofia politica della sovranità e delle pratiche di democrazia partecipativa.

I moduli formativi sono tradotti in 11 lingue ufficiali e guidati da giuristi, filosofi e studiosi indipendenti per fornire ad ogni cittadino gli strumenti teorici e pratici per esercitare consapevolmente la propria sovranità civica.`,
    images: [
      {
        type: 'image',
        source: 'url',
        url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80',
        caption: 'Insegnamento e cultura della sovranità condivisa.'
      }
    ],
    videos: [],
    tags: ['#Cultura', '#Educazione', '#DirittoNaturale', '#Accademia'],
    relatedArticleIds: ['art-101', 'art-102'],
    authorId: 1001,
    authorName: 'Elenor Vance (Cronista Capo)',
    authorRole: 'Cronista Ufficiale',
    status: 'pubblicato',
    createdAt: '2026-08-22T14:30:00.000Z',
    publishedAt: '2026-08-23T10:00:00.000Z',
    updatedAt: '2026-08-23T10:00:00.000Z',
    isFeatured: false,
    viewsCount: 580
  },
  {
    id: 'art-107',
    title: 'Carta dei Diritti Digitali e Inviolabilità della Sovranità Individuale',
    slug: 'carta-diritti-digitali-inviolabilita-sovranita-individuale',
    categoryId: 'cat-diritti',
    intro: 'Risoluzione fondamentale approvata dal Consiglio dei Garanti sulla tutela dell\'integrità biologica e dell\'identità digitale sovrana.',
    content: `La Carta dei Diritti Digitali sancisce il principio di inviolabilità dell'essere umano di fronte all'ingerenza tecnologica incontrollata e al controllo biometrico centralizzato. Nessuna entità esterna ha il diritto di confiscare, profilare o monetizzare l'identità o i dati essenziali dei cittadini sovrani.

Questo testo fondamentale costituisce il pilastro su cui si fonda ogni applicazione e servizio sviluppato all'interno della rete New World State.`,
    images: [
      {
        type: 'image',
        source: 'url',
        url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
        caption: 'Tutela costituzionale e garanzie dei diritti fondamentali.'
      }
    ],
    videos: [],
    tags: ['#Diritti', '#Costituzione', '#CartaDeiDiritti', '#Liberta'],
    relatedArticleIds: ['art-102'],
    authorId: 1002,
    authorName: 'Marcus Thorne',
    authorRole: 'Cronista di Stato',
    status: 'pubblicato',
    createdAt: '2026-08-21T09:00:00.000Z',
    publishedAt: '2026-08-22T08:00:00.000Z',
    updatedAt: '2026-08-22T08:00:00.000Z',
    isFeatured: false,
    viewsCount: 920
  },
  {
    id: 'art-108',
    title: 'Economia Circolare e Moneta di Comunità: Superare l\'Usura Bancaria Tradizionale',
    slug: 'economia-circolare-moneta-comunita-superare-usura-bancaria',
    categoryId: 'cat-economia',
    intro: 'Reportage economico sui circuiti di credito reciproco e sull\'adozione di unità di scambio ancorate al valore del lavoro reale.',
    content: `In un panorama globale dominato da bolle debitorie e svalutazione monetaria, New World State promuove l'adozione di modelli di credito reciproco privi di interesse usuraio. Basati sulla reale capacità produttiva dei membri e su accordi di mutuo soccorso, i circuiti di scambio sovrani proteggono le piccole economie locali dalle oscillazioni speculative internazionali.

L'esperienza pilota ha dimostrato una crescita della fiducia commerciale e una riduzione dell'indebitamento tra le comunità aderenti.`,
    images: [
      {
        type: 'image',
        source: 'url',
        url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
        caption: 'Circuiti di credito reciproco ed economia sovrana.'
      }
    ],
    videos: [],
    tags: ['#Economia', '#CreditoReciproco', '#MonetaSovrana', '#Lavoro'],
    relatedArticleIds: ['art-105'],
    authorId: 1003,
    authorName: 'Sophia Chen',
    authorRole: 'Cronista Tecnologico',
    status: 'pubblicato',
    createdAt: '2026-08-20T16:00:00.000Z',
    publishedAt: '2026-08-21T12:00:00.000Z',
    updatedAt: '2026-08-21T12:00:00.000Z',
    isFeatured: false,
    viewsCount: 670
  },
  {
    id: 'art-109',
    title: 'Intelligenza Artificiale Etica e Sovranità dei Dati nell\'Assemblea Digitale',
    slug: 'intelligenza-artificiale-etica-sovranita-dati-assemblea-digitale',
    categoryId: 'cat-tecnologia',
    intro: 'Linee guida per l\'impiego di modelli linguistici aperti al servizio della sintesi legislativa e della trasparenza amministrativa.',
    content: `L'innovazione tecnologica deve rimanere uno strumento al servizio dell'essere umano e mai un organo di governo non eletto. Nel portale New World State, l'intelligenza artificiale viene impiegata unicamente per la traduzione istantanea, la generazione di bozze di proposte popolari e la trascrizione accessibile degli atti legislativi.

Tutti gli algoritmi impiegati sono aperti a verifica pubblica per garantire l'assenza di filtri ideologici e pregiudizi informativi.`,
    images: [
      {
        type: 'image',
        source: 'url',
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        caption: 'Trasparenza algoritmica e intelligenza artificiale etica.'
      }
    ],
    videos: [],
    tags: ['#Tecnologia', '#IntelligenzaArtificiale', '#Etica', '#Trasparenza'],
    relatedArticleIds: ['art-103'],
    authorId: 1003,
    authorName: 'Sophia Chen',
    authorRole: 'Cronista Tecnologico',
    status: 'pubblicato',
    createdAt: '2026-08-19T10:00:00.000Z',
    publishedAt: '2026-08-20T09:00:00.000Z',
    updatedAt: '2026-08-20T09:00:00.000Z',
    isFeatured: true,
    viewsCount: 1100
  },
  {
    id: 'art-110',
    title: 'Patrimonio Culturale Mondiale e Rete delle Biblioteche Sovrane Aperte',
    slug: 'patrimonio-culturale-mondiale-rete-biblioteche-sovrane-aperte',
    categoryId: 'cat-cultura',
    intro: 'Iniziativa per la conservazione digitale permanente dei testi storici, filosofici e scientifici liberi da copyright restrittivo.',
    content: `La salvaguardia del sapere universale richiede infrastrutture decentralizzate immuni a censura e revisionismo storico. La Rete delle Biblioteche Sovrane Aperte mette a disposizione della comunità globale decine di migliaia di trattati, manoscritti costituzionali e documenti storici liberamente consultabili e scaricabili in formato aperto.

La cultura è un bene comune inalienabile della famiglia umana e come tale viene protetta e tramandata alle future generazioni.`,
    images: [
      {
        type: 'image',
        source: 'url',
        url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80',
        caption: 'Conservazione della memoria storica e del patrimonio universale.'
      }
    ],
    videos: [],
    tags: ['#Cultura', '#PatrimonioMondiale', '#Biblioteche', '#ConoscenzaLibera'],
    relatedArticleIds: ['art-106'],
    authorId: 1001,
    authorName: 'Elenor Vance (Cronista Capo)',
    authorRole: 'Cronista Ufficiale',
    status: 'pubblicato',
    createdAt: '2026-08-18T12:00:00.000Z',
    publishedAt: '2026-08-19T08:00:00.000Z',
    updatedAt: '2026-08-19T08:00:00.000Z',
    isFeatured: false,
    viewsCount: 830
  }
];

// Helper to generate clean slugs from title
export function generateSlug(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars
    .replace(/\s+/g, '-') // Replace spaces with hyphen
    .replace(/-+/g, '-') // Replace multiple hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens
}

// LocalStorage helpers
export function getCategories(): NewsCategory[] {
  try {
    const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('[NEWS-SERVICE] Error reading categories:', e);
  }
  // Save defaults
  saveCategories(DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
}

export function saveCategories(categories: NewsCategory[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new CustomEvent('nws_news_categories_updated'));
  } catch (e) {
    console.error('[NEWS-SERVICE] Error saving categories:', e);
  }
}

export function addCategory(category: Omit<NewsCategory, 'id' | 'slug'>): NewsCategory {
  const current = getCategories();
  const slug = generateSlug(category.name);
  const newCat: NewsCategory = {
    ...category,
    id: `cat-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    slug: slug || `categoria-${Date.now()}`
  };
  const updated = [newCat, ...current];
  saveCategories(updated);
  return newCat;
}

export function updateCategory(id: string, updates: Partial<NewsCategory>): void {
  const current = getCategories();
  const updated = current.map(cat => {
    if (cat.id === id) {
      const newName = updates.name !== undefined ? updates.name : cat.name;
      return {
        ...cat,
        ...updates,
        slug: generateSlug(newName)
      };
    }
    return cat;
  });
  saveCategories(updated);
}

export function deleteCategory(id: string): void {
  const current = getCategories();
  const filtered = current.filter(cat => cat.id !== id && !cat.isSystem);
  saveCategories(filtered);
}

// Articles Management
export function getArticles(): NewsArticle[] {
  try {
    const saved = localStorage.getItem(ARTICLES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('[NEWS-SERVICE] Error reading articles:', e);
  }
  saveArticles(INITIAL_ARTICLES);
  return INITIAL_ARTICLES;
}

export function saveArticles(articles: NewsArticle[]): void {
  try {
    localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(articles));
    window.dispatchEvent(new CustomEvent('nws_news_articles_updated'));

    // Asynchronously sync authoritative articles with server for social preview generation & real-time SEO sitemaps
    safeFetch('/api/news/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles, replaceAll: true })
    }).catch(err => console.warn('[NEWS-SERVICE] Server sync error:', err));
  } catch (e) {
    console.error('[NEWS-SERVICE] Error saving articles:', e);
  }
}

let inFlightSync: Promise<NewsArticle[]> | null = null;
let lastSyncTimestamp = 0;

export async function syncArticlesWithServer(force = false): Promise<NewsArticle[]> {
  const now = Date.now();
  if (!force && now - lastSyncTimestamp < 30000) {
    return getArticles();
  }

  if (inFlightSync) {
    return inFlightSync;
  }

  inFlightSync = (async () => {
    try {
      lastSyncTimestamp = Date.now();
      const res = await safeFetch('/api/news/articles');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.articles) && data.articles.length > 0) {
          const local = getArticles();
          const localJson = JSON.stringify(local);
          const map = new Map<string, NewsArticle>();
          
          // Add server articles first
          data.articles.forEach((a: NewsArticle) => {
            if (a && a.id) map.set(a.id, a);
          });
          
          // Add or update with local articles if local exists and is newer
          local.forEach((a: NewsArticle) => {
            if (a && a.id) {
              const existing = map.get(a.id);
              if (!existing || new Date(a.updatedAt || 0).getTime() >= new Date(existing.updatedAt || 0).getTime()) {
                map.set(a.id, a);
              }
            }
          });

          const merged = Array.from(map.values()).sort((a, b) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );

          const mergedJson = JSON.stringify(merged);
          if (mergedJson !== localJson) {
            localStorage.setItem(ARTICLES_STORAGE_KEY, mergedJson);
            window.dispatchEvent(new CustomEvent('nws_news_articles_updated'));

            // Push back merged state to server
            safeFetch('/api/news/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ articles: merged })
            }).catch(() => {});
          }

          return merged;
        }
      }
    } catch (err) {
      // Quiet fail on network or offline
    } finally {
      inFlightSync = null;
    }
    return getArticles();
  })();

  return inFlightSync;
}

export function getPublishedArticles(): NewsArticle[] {
  return getArticles()
    .filter(a => a.status === 'pubblicato')
    .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
}

export function getLatest3Articles(): NewsArticle[] {
  const published = getPublishedArticles();
  // Put featured first, then sorted by date
  const featured = published.filter(a => a.isFeatured);
  const nonFeatured = published.filter(a => !a.isFeatured);
  const combined = [...featured, ...nonFeatured];
  return combined.slice(0, 3);
}

export function getArticlesPendingModeration(): NewsArticle[] {
  return getArticles()
    .filter(a => a.status === 'in_moderazione')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getArticlesByAuthor(authorId: number | string): NewsArticle[] {
  return getArticles()
    .filter(a => String(a.authorId) === String(authorId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createArticle(articleData: {
  title: string;
  slug?: string;
  categoryId: string;
  intro: string;
  content: string;
  translations?: Partial<Record<NewsLanguage, ArticleTranslation>>;
  images: NewsMedia[];
  videos: NewsMedia[];
  tags: string[];
  relatedArticleIds: string[];
  authorId: number | string;
  authorName: string;
  authorEmail?: string;
  authorRole?: string;
  submitForModeration?: boolean;
  status?: ArticleStatus;
  publishedAt?: string;
}): NewsArticle {
  const articles = getArticles();
  const slug = articleData.slug || generateSlug(articleData.title);
  
  const initialStatus: ArticleStatus = articleData.status 
    ? articleData.status 
    : (articleData.submitForModeration ? 'in_moderazione' : 'bozza');

  const newArticle: NewsArticle = {
    id: `art-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: articleData.title,
    slug: slug || `articolo-${Date.now()}`,
    categoryId: articleData.categoryId,
    intro: articleData.intro,
    content: articleData.content,
    translations: articleData.translations || {},
    images: articleData.images || [],
    videos: articleData.videos || [],
    tags: articleData.tags || [],
    relatedArticleIds: articleData.relatedArticleIds || [],
    authorId: articleData.authorId,
    authorName: articleData.authorName,
    authorEmail: articleData.authorEmail,
    authorRole: articleData.authorRole || 'Cronista',
    status: initialStatus,
    createdAt: new Date().toISOString(),
    publishedAt: articleData.publishedAt || (initialStatus === 'pubblicato' ? new Date().toISOString() : undefined),
    updatedAt: new Date().toISOString(),
    viewsCount: 0
  };

  const updated = [newArticle, ...articles];
  saveArticles(updated);

  if (newArticle.status === 'in_moderazione') {
    triggerNotification(
      'Nuovo Articolo in Moderazione',
      `L'articolo "${newArticle.title}" redatto da ${newArticle.authorName} richiede la revisione del Custode Digitale.`,
      'news',
      '/news'
    );
  }

  // Se l'articolo è pubblicato direttamente e non ha ancora traduzioni, avvia la traduzione automatica in background
  if (newArticle.status === 'pubblicato' && (!newArticle.translations || Object.keys(newArticle.translations).length === 0)) {
    triggerBackgroundTranslation(newArticle.id);
  }

  return newArticle;
}

export function updateArticle(id: string, articleData: Partial<NewsArticle>): NewsArticle | null {
  const articles = getArticles();
  let updatedArticle: NewsArticle | null = null;

  const updatedList = articles.map(art => {
    if (art.id === id) {
      const newTitle = articleData.title !== undefined ? articleData.title : art.title;
      const newSlug = articleData.slug !== undefined ? articleData.slug : generateSlug(newTitle);
      
      updatedArticle = {
        ...art,
        ...articleData,
        title: newTitle,
        slug: newSlug,
        updatedAt: new Date().toISOString()
      };
      return updatedArticle;
    }
    return art;
  });

  if (updatedArticle) {
    saveArticles(updatedList);
  }

  return updatedArticle;
}

export function deleteArticle(id: string): void {
  const articles = getArticles();
  const filtered = articles.filter(a => a.id !== id);
  saveArticles(filtered);

  // Directly call server delete endpoint for immediate elimination from all sitemaps and cache
  safeFetch('/api/news/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  }).catch(() => {});
}

// Moderation Actions by Custodi Digitali
export function moderateArticle(
  id: string,
  action: 'approve' | 'reject' | 'request_changes' | 'toggle_featured',
  moderatorNotes?: string
): NewsArticle | null {
  const articles = getArticles();
  let targetArticle = articles.find(a => a.id === id);

  if (!targetArticle) return null;

  let newStatus: ArticleStatus = targetArticle.status;
  let newPublishedAt = targetArticle.publishedAt;
  let newFeatured = targetArticle.isFeatured;

  if (action === 'approve') {
    newStatus = 'pubblicato';
    newPublishedAt = new Date().toISOString();
  } else if (action === 'reject') {
    newStatus = 'rifiutato';
  } else if (action === 'request_changes') {
    newStatus = 'in_revisione';
  } else if (action === 'toggle_featured') {
    newFeatured = !newFeatured;
  }

  const updatedArticle: NewsArticle = {
    ...targetArticle,
    status: newStatus,
    publishedAt: newPublishedAt,
    isFeatured: newFeatured,
    moderatorNotes: moderatorNotes !== undefined ? moderatorNotes : targetArticle.moderatorNotes,
    updatedAt: new Date().toISOString()
  };

  const updatedList = articles.map(a => a.id === id ? updatedArticle : a);
  saveArticles(updatedList);

  // Directly send moderation event to server to ensure instant approval & sitemap registration
  safeFetch('/api/news/moderate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action, moderatorNotes })
  }).catch(() => {});

  if (action === 'approve') {
    triggerNotification(
      'Notizia Pubblicata',
      `L'articolo "${updatedArticle.title}" è stato approvato dai Custodi Digitali ed è ora pubblico.`,
      'news',
      `/news?slug=${updatedArticle.slug}`
    );

    // All'approvazione dell'articolo, avvia la traduzione automatica in tutte le 11 lingue se non già presente
    if (!updatedArticle.translations || Object.keys(updatedArticle.translations).length < 5) {
      triggerBackgroundTranslation(updatedArticle.id);
    }
  } else if (action === 'reject' || action === 'request_changes') {
    triggerNotification(
      'Aggiornamento Moderazione Articolo',
      `I Custodi Digitali hanno inviato un commento sull'articolo "${updatedArticle.title}".`,
      'news',
      '/news'
    );
  }

  return updatedArticle;
}

export function incrementArticleViews(id: string): void {
  const articles = getArticles();
  const updated = articles.map(art => {
    if (art.id === id) {
      return {
        ...art,
        viewsCount: (art.viewsCount || 0) + 1
      };
    }
    return art;
  });
  saveArticles(updated);
}

export interface ReliableNewsSource {
  id: string;
  name: string;
  code: string;
  description: string;
  category: 'vatican' | 'international' | 'sovereign' | 'national';
  defaultSelected: boolean;
}

export const RELIABLE_NEWS_SOURCES: ReliableNewsSource[] = [
  {
    id: 'vatican_news',
    name: 'Fonti Vaticane / Vatican News',
    code: 'Vatican.va • Sala Stampa Santa Sede',
    description: 'Dichiarazioni diplomatiche, encicliche e comunicati ufficiali della Santa Sede',
    category: 'vatican',
    defaultSelected: true
  },
  {
    id: 'reuters',
    name: 'Reuters',
    code: 'Thomson Reuters',
    description: 'Agenzia di stampa multimediale internazionale per reportistica geopolitica ed economica',
    category: 'international',
    defaultSelected: true
  },
  {
    id: 'ap',
    name: 'Associated Press (AP)',
    code: 'AP News Wire',
    description: 'Agenzia di notizie globale indipendente per fatti di cronaca e affari internazionali',
    category: 'international',
    defaultSelected: true
  },
  {
    id: 'afp',
    name: 'Agence France-Presse (AFP)',
    code: 'AFP Global',
    description: 'Agenzia mondiale per verifiche sul campo, diplomazia e affari di stato',
    category: 'international',
    defaultSelected: true
  },
  {
    id: 'ansa',
    name: 'ANSA',
    code: 'Agenzia Nazionale Stampa Associata',
    description: 'Principale agenzia d’informazione primario e relazioni euro-mediterranee',
    category: 'national',
    defaultSelected: true
  },
  {
    id: 'bbc',
    name: 'BBC News / World Service',
    code: 'BBC World Service',
    description: 'Giornalismo d’inchiesta e reportage di approfondimento internazionale',
    category: 'international',
    defaultSelected: false
  },
  {
    id: 'dw',
    name: 'Deutsche Welle (DW)',
    code: 'DW Media',
    description: 'Emittente d’informazione per analisi di diritto internazionale e politiche europee',
    category: 'international',
    defaultSelected: false
  },
  {
    id: 'nws_press',
    name: 'Ufficio Stampa & Gazzetta Sovrana NWS',
    code: 'New World State Official Press',
    description: 'Organo di Stampa Sovrano, comunicati di governo e atti legislativi ed economici',
    category: 'sovereign',
    defaultSelected: true
  }
];

export interface AiArticleGenerationResponse {
  title: string;
  intro: string;
  content: string;
  tags: string[];
  suggestedCategory?: string;
  usedSources?: string[];
}

export async function generateArticleWithAI(
  topic: string,
  categoryName?: string,
  tone?: string,
  sources?: string[]
): Promise<AiArticleGenerationResponse> {
  const response = await safeFetch('/api/news/ai-generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ topic, categoryName, tone, sources })
  });

  const resData = await response.json();
  if (!response.ok || !resData.success) {
    throw new Error(resData.message || 'Errore durante la generazione dell\'articolo con AI.');
  }

  return resData.data;
}

export interface MediaSearchResult {
  id: string;
  type: 'image' | 'video';
  sourcePlatform: 'unsplash' | 'pexels' | 'pixabay' | 'youtube' | 'wikimedia' | 'flickr';
  url: string;
  previewUrl?: string;
  sourceUrl?: string;
  title: string;
  author?: string;
}

export interface MediaSearchProviderDebug {
  name: string;
  platform: string;
  endpoint?: string;
  status: string;
  count: number;
  latencyMs: number;
  details?: string;
  error?: string;
}

export interface MediaSearchDebugInfo {
  query: string;
  platform: string;
  timestamp: string;
  totalTimeMs?: number;
  totalResultsCount?: number;
  providers: MediaSearchProviderDebug[];
  logs?: string[];
}

export function sanitizeMediaPlatform(item: MediaSearchResult): MediaSearchResult {
  const combined = (String(item.sourceUrl || '') + ' ' + String(item.url || '') + ' ' + String(item.previewUrl || '')).toLowerCase();
  let verifiedPlatform: MediaSearchResult['sourcePlatform'] = item.sourcePlatform;

  if (combined.includes('flickr') || combined.includes('staticflickr.com') || combined.includes('flic.kr')) {
    verifiedPlatform = 'flickr';
  } else if (combined.includes('wikimedia') || combined.includes('wikipedia.org')) {
    verifiedPlatform = 'wikimedia';
  } else if (combined.includes('youtube.com') || combined.includes('youtu.be') || combined.includes('ytimg.com')) {
    verifiedPlatform = 'youtube';
  } else if (combined.includes('unsplash.com')) {
    verifiedPlatform = 'unsplash';
  } else if (combined.includes('pexels.com')) {
    verifiedPlatform = 'pexels';
  } else if (combined.includes('pixabay.com')) {
    verifiedPlatform = 'pixabay';
  }

  // Clean author name
  let cleanAuthor = String(item.author || '').trim();
  const parenMatch = cleanAuthor.match(/\(["']?([^"')]+)["']?\)/);
  if (parenMatch && parenMatch[1] && parenMatch[1].trim().length >= 2) {
    cleanAuthor = parenMatch[1].trim();
  }
  cleanAuthor = cleanAuthor
    .replace(/<[^>]*>?/gm, '')
    .replace(/nobody@flickr\.com/gi, '')
    .replace(/http[s]?:\/\/\S+/gi, '')
    .replace(/mailto:\S+/gi, '')
    .replace(/["()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanAuthor || cleanAuthor.toLowerCase().includes('nobody@') || cleanAuthor.length < 2) {
    cleanAuthor = `${verifiedPlatform.charAt(0).toUpperCase() + verifiedPlatform.slice(1)} Contributor`;
  }

  return {
    ...item,
    sourcePlatform: verifiedPlatform,
    author: cleanAuthor
  };
}

export async function searchArticleMedia(
  query: string,
  platform: string = 'all'
): Promise<{ results: MediaSearchResult[]; debug?: MediaSearchDebugInfo }> {
  const response = await safeFetch('/api/news/search-media', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, platform })
  });

  const resData = await response.json();
  if (!response.ok || !resData.success) {
    throw new Error(resData.message || 'Impossibile completare la ricerca media.');
  }

  const rawResults: MediaSearchResult[] = resData.results || resData.data || [];
  const results = rawResults.map(sanitizeMediaPlatform);

  return {
    results,
    debug: resData.debug
  };
}

/**
 * Traduce un articolo di giornale in tutte le 11 lingue ufficiali dello Stato (o nelle lingue richieste)
 * utilizzando l'API di intelligenza artificiale Gemini.
 */
export async function translateArticleWithAI(articleData: {
  id?: string;
  title: string;
  intro?: string;
  content: string;
  tags?: string[];
  targetLangs?: string[];
}): Promise<Record<NewsLanguage, ArticleTranslation>> {
  const response = await safeFetch('/api/news/translate-article', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      articleId: articleData.id,
      title: articleData.title,
      intro: articleData.intro || '',
      content: articleData.content,
      tags: articleData.tags || [],
      targetLangs: articleData.targetLangs
    })
  });

  const resData = await response.json();
  if (!response.ok || !resData.success) {
    throw new Error(resData.message || 'Impossibile completare la traduzione automatica AI.');
  }

  const translations = resData.translations || {};

  // Se è stato specificato l'ID articolo, aggiorna anche la copia nel localStorage del client
  if (articleData.id) {
    const articles = getArticles();
    const updated = articles.map(art => {
      if (String(art.id) === String(articleData.id) || art.slug === articleData.id) {
        return {
          ...art,
          translations: {
            ...(art.translations || {}),
            ...translations
          },
          updatedAt: new Date().toISOString()
        };
      }
      return art;
    });
    saveArticles(updated);
  }

  return translations;
}

/**
 * Restituisce i campi localizzati dell'articolo (titolo, intro, contenuto e tag)
 * in base alla lingua attiva dell'utente. Se la lingua è 'it' o la traduzione
 * non è ancora disponibile, restituisce i campi originali con isTranslated = false.
 */
export function getLocalizedArticle(
  article: NewsArticle | null | undefined,
  lang: Language
): {
  title: string;
  intro: string;
  content: string;
  tags: string[];
  isTranslated: boolean;
  hasTranslation: boolean;
} {
  if (!article) {
    return {
      title: '',
      intro: '',
      content: '',
      tags: [],
      isTranslated: false,
      hasTranslation: false
    };
  }

  if (lang === 'it') {
    return {
      title: article.title,
      intro: article.intro,
      content: article.content,
      tags: article.tags || [],
      isTranslated: false,
      hasTranslation: true
    };
  }

  const translation = article.translations?.[lang as NewsLanguage];
  if (translation && (translation.title || translation.content || translation.intro)) {
    const isFullyTranslated = !!(translation.title && translation.content);
    return {
      title: translation.title || article.title,
      intro: translation.intro || article.intro,
      content: translation.content || article.content,
      tags: translation.tags && translation.tags.length > 0 ? translation.tags : (article.tags || []),
      isTranslated: true,
      hasTranslation: isFullyTranslated
    };
  }

  // Fallback all'originale italiano
  return {
    title: article.title,
    intro: article.intro,
    content: article.content,
    tags: article.tags || [],
    isTranslated: false,
    hasTranslation: false
  };
}

/**
 * Traccia le richieste di traduzione già in corso per evitare chiamate duplicate
 */
const pendingTranslations = new Set<string>();

/**
 * Traduce automaticamente un articolo on-demand in background se non è ancora disponibile nella lingua richiesta.
 */
export async function autoTranslateArticleOnDemand(
  articleId: string,
  lang: Language
): Promise<NewsArticle | null> {
  if (lang === 'it') return null;

  const key = `${articleId}:${lang}`;
  if (pendingTranslations.has(key)) return null;

  const articles = getArticles();
  const target = articles.find(a => String(a.id) === String(articleId) || a.slug === articleId);
  if (!target) return null;

  // Già tradotto completamente sia titolo che contenuto esteso
  if (target.translations?.[lang as NewsLanguage]?.title && target.translations?.[lang as NewsLanguage]?.content) {
    return target;
  }

  pendingTranslations.add(key);

  try {
    const translations = await translateArticleWithAI({
      id: target.id,
      title: target.title,
      intro: target.intro,
      content: target.content,
      tags: target.tags,
      targetLangs: [lang]
    });

    const updatedArticles = getArticles();
    const updatedTarget = updatedArticles.find(a => String(a.id) === String(target.id) || a.slug === target.slug);
    const result: NewsArticle = updatedTarget || {
      ...target,
      translations: {
        ...(target.translations || {}),
        ...translations
      },
      updatedAt: new Date().toISOString()
    };
    return result;
  } catch (err) {
    console.warn(`[AutoTranslate] Traduzione on-demand per ${articleId} in ${lang} fallita:`, err);
    return null;
  } finally {
    pendingTranslations.delete(key);
  }
}

/**
 * Avvia la traduzione completa di un articolo in background in tutte le lingue ufficiali
 */
export function triggerBackgroundTranslation(articleId: string): void {
  setTimeout(async () => {
    try {
      const articles = getArticles();
      const target = articles.find(a => a.id === articleId || a.slug === articleId);
      if (!target) return;

      await translateArticleWithAI({
        id: target.id,
        title: target.title,
        intro: target.intro,
        content: target.content,
        tags: target.tags
      });
      console.log(`[NEWS-I18N] Traduzione automatica completata per articolo: ${target.title}`);
    } catch (err) {
      console.warn(`[NEWS-I18N] Errore traduzione automatica background per ${articleId}:`, err);
    }
  }, 500);
}

import { NewsArticle, NewsCategory, NewsMedia, ArticleStatus } from '../types/news';
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
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    publishedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    isFeatured: true,
    viewsCount: 1240
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
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isFeatured: false,
    viewsCount: 890
  },
  {
    id: 'art-103',
    title: 'Infrastrutture Decentralizzate: Test del Nodo di Rete e Ridondanza dei Server',
    slug: 'infrastrutture-decentralizzate-test-nodo-rete-ridondanza',
    categoryId: 'cat-tecnologia',
    intro: 'Test di resilienza completato con successo su 12 nodi distribuiti globalmente per garantire l\'operatività ininterrotta del portale.',
    content: `Nelle ultime 48 ore la squadra di tecnici e custodi della rete ha condotto uno stress test sulle infrastrutture di calcolo e memoria distribuita. Il sistema ha dimostrato una tolleranza ai guasti del 99.98%, mantenendo attiva la sincronizzazione dei dati anche durante picchi di affluenza contemporanea.

Il piano di espansione prevede l'integrazione di ulteriori 8 nodi comunitari gestiti direttamente dalle delegazioni regionali.`,
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
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFeatured: true,
    viewsCount: 615
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
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFeatured: true,
    viewsCount: 1420
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

    // Asynchronously sync articles with server for social preview generation & SEO
    safeFetch('/api/news/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles })
    }).catch(err => console.warn('[NEWS-SERVICE] Server sync error:', err));
  } catch (e) {
    console.error('[NEWS-SERVICE] Error saving articles:', e);
  }
}

export async function syncArticlesWithServer(): Promise<NewsArticle[]> {
  try {
    const res = await safeFetch('/api/news/articles');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.articles) && data.articles.length > 0) {
        const local = getArticles();
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

        localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('nws_news_articles_updated'));

        // Push back merged state to server
        safeFetch('/api/news/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articles: merged })
        }).catch(() => {});

        return merged;
      }
    }
  } catch (err) {
    console.warn('[NEWS-SERVICE] Could not sync with server:', err);
  }
  return getArticles();
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
  images: NewsMedia[];
  videos: NewsMedia[];
  tags: string[];
  relatedArticleIds: string[];
  authorId: number | string;
  authorName: string;
  authorRole?: string;
  submitForModeration?: boolean;
}): NewsArticle {
  const articles = getArticles();
  const slug = articleData.slug || generateSlug(articleData.title);
  
  const newArticle: NewsArticle = {
    id: `art-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: articleData.title,
    slug: slug || `articolo-${Date.now()}`,
    categoryId: articleData.categoryId,
    intro: articleData.intro,
    content: articleData.content,
    images: articleData.images || [],
    videos: articleData.videos || [],
    tags: articleData.tags || [],
    relatedArticleIds: articleData.relatedArticleIds || [],
    authorId: articleData.authorId,
    authorName: articleData.authorName,
    authorRole: articleData.authorRole || 'Cronista',
    status: articleData.submitForModeration ? 'in_moderazione' : 'bozza',
    createdAt: new Date().toISOString(),
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

  if (action === 'approve') {
    triggerNotification(
      'Notizia Pubblicata',
      `L'articolo "${updatedArticle.title}" è stato approvato dai Custodi Digitali ed è ora pubblico.`,
      'news',
      `/news?slug=${updatedArticle.slug}`
    );
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

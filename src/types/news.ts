export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string; // Tailwind color class or hex
  icon?: string;
  isSystem?: boolean;
}

export type ArticleStatus = 'bozza' | 'in_moderazione' | 'pubblicato' | 'rifiutato' | 'in_revisione';

export interface NewsMedia {
  type: 'image' | 'video';
  source: 'upload' | 'url';
  url: string; // Data URL or external link
  fileName?: string;
  caption?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  intro: string; // Testo introduttivo
  content: string; // Testo esteso
  images: NewsMedia[]; // Multi o singola immagine
  videos: NewsMedia[]; // Multi o singolo video
  tags: string[]; // Lista di tag
  relatedArticleIds: string[]; // Collegamento ad altri articoli
  authorId: number | string;
  authorName: string;
  authorEmail?: string;
  authorRole: string; // 'Cronista Ufficiale' ecc.
  status: ArticleStatus;
  moderatorNotes?: string;
  createdAt: string;
  publishedAt?: string;
  updatedAt: string;
  isFeatured?: boolean; // In evidenza
  viewsCount?: number;
}

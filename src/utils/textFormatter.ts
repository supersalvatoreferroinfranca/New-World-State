/**
 * Utility module for text formatting, SEO optimization, and symbol cleaning.
 * Ensures articles appear free of raw formatting symbols, clearly laid out,
 * light, readable, and optimized for SEO & AI search indexing.
 */

/**
 * Strips all markdown syntax and raw HTML tags, returning clean plain text.
 * Ideal for titles, intros, card previews, meta descriptions, and Speech Synthesis (TTS).
 */
export function stripFormattingSymbols(text: string | null | undefined): string {
  if (!text) return '';

  return text
    // Remove HTML tags
    .replace(/<[^>]*>?/gm, '')
    // Remove markdown headers (###, ##, #)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italic markdown (**bold**, *italic*, __bold__, _italic_)
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove inline code or backticks (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links [title](url) -> title
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove blockquote symbol >
    .replace(/^\s*>\s*/gm, '')
    // Remove bullet points symbol (* item, - item)
    .replace(/^\s*[\*\-]\s+/gm, '')
    // Replace multiple newlines or double spaces with clean single spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts raw content (whether markdown or unformatted text) into clean,
 * semantic HTML with spacious, readable typography (<h3>, <p>, <ul>, <li>, <blockquote>).
 * Removes stray markdown artifacts and orphan symbols.
 */
export function formatArticleContentToHtml(content: string | null | undefined): string {
  if (!content) return '';

  let text = content.trim();

  // If text already has HTML paragraph tags or headers, polish and clean stray symbols
  const containsHtml = /<[a-z][\s\S]*>/i.test(text);

  if (containsHtml) {
    return text
      // Replace any React JSX className with HTML class
      .replace(/\bclassName=/g, 'class=')
      // Clean up markdown bold inside HTML tags: **text** -> <strong>text</strong>
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Clean up markdown italic inside HTML tags: *text* -> <em>$1</em>
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Clean up markdown headers inside HTML tags if present: ### text -> <h3>text</h3>
      .replace(/###\s*(.+)/g, '<h3 class="font-serif text-xl font-bold text-[#0a1c3e] mt-8 mb-3 tracking-tight">$1</h3>')
      .replace(/##\s*(.+)/g, '<h2 class="font-serif text-2xl font-bold text-[#0a1c3e] mt-10 mb-4 tracking-tight">$1</h2>')
      // Ensure <p> tags without custom classes get proper article paragraph classes
      .replace(/<p(?![^>]*class=)/gi, '<p class="article-p leading-relaxed text-slate-700 text-base md:text-lg mb-6 font-sans"')
      // Remove any orphan backticks or markdown hashtags
      .replace(/```[a-z]*/gi, '')
      .replace(/```/g, '');
  }

  // Convert pure Markdown or raw text into clean semantic HTML with paragraph blocks
  const rawBlocks = text.split(/\n\s*\n+/);
  const formattedBlocks: string[] = [];

  for (const block of rawBlocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    // Check if block starts with heading
    if (trimmedBlock.startsWith('### ')) {
      const headerText = stripFormattingSymbols(trimmedBlock.replace(/^###\s+/, ''));
      formattedBlocks.push(`<h3 class="font-serif text-xl font-bold text-[#0a1c3e] mt-8 mb-3 tracking-tight">${headerText}</h3>`);
      continue;
    }
    if (trimmedBlock.startsWith('## ') || trimmedBlock.startsWith('# ')) {
      const headerText = stripFormattingSymbols(trimmedBlock.replace(/^#+\s*/, ''));
      formattedBlocks.push(`<h2 class="font-serif text-2xl font-bold text-[#0a1c3e] mt-10 mb-4 tracking-tight">${headerText}</h2>`);
      continue;
    }

    // Check if block is a blockquote
    if (trimmedBlock.startsWith('> ')) {
      const quoteText = stripFormattingSymbols(trimmedBlock.replace(/^>\s*/gm, ''));
      formattedBlocks.push(`<blockquote class="border-l-4 border-brand-gold bg-amber-50/70 p-5 my-6 rounded-r-2xl italic text-slate-800 text-base leading-relaxed">${quoteText}</blockquote>`);
      continue;
    }

    // Check if block is a list
    const lines = trimmedBlock.split('\n');
    const isList = lines.every(l => {
      const tl = l.trim();
      return !tl || tl.startsWith('* ') || tl.startsWith('- ') || /^\d+\.\s+/.test(tl);
    });

    if (isList) {
      const isOrdered = /^\d+\.\s+/.test(lines[0].trim());
      const tag = isOrdered ? 'ol' : 'ul';
      const listClass = isOrdered ? 'list-decimal list-outside space-y-2.5 my-6 text-slate-700 pl-7 font-sans' : 'list-disc list-outside space-y-2.5 my-6 text-slate-700 pl-7 font-sans';
      const items = lines.map(l => {
        const tl = l.trim();
        if (!tl) return '';
        let itemContent = tl.replace(/^[\*\-]\s+/, '').replace(/^\d+\.\s+/, '');
        itemContent = itemContent
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>');
        return `<li class="leading-relaxed text-slate-700 text-base md:text-lg font-sans my-1.5">${itemContent}</li>`;
      }).filter(Boolean).join('\n');
      formattedBlocks.push(`<${tag} class="${listClass}">\n${items}\n</${tag}>`);
      continue;
    }

    // Standard Paragraph - join lines with a space to prevent chopped sentences, then parse markdown formatting
    let paragraphText = lines.map(l => l.trim()).filter(Boolean).join(' ')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');

    formattedBlocks.push(`<p class="article-p leading-relaxed text-slate-700 text-base md:text-lg mb-6 font-sans">${paragraphText}</p>`);
  }

  return formattedBlocks.join('\n\n');
}

/**
 * Calculates SEO and AI readability readiness for an article.
 */
export interface SeoAnalysis {
  score: number;
  label: string;
  wordCount: number;
  readingTimeMinutes: number;
  titleCharCount: number;
  introCharCount: number;
  suggestions: string[];
}

export function analyzeArticleSeoAndAi(
  title: string,
  intro: string,
  content: string,
  tags: string[] = []
): SeoAnalysis {
  const cleanTitle = stripFormattingSymbols(title);
  const cleanIntro = stripFormattingSymbols(intro);
  const cleanContent = stripFormattingSymbols(content);

  const words = cleanContent.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const titleCharCount = cleanTitle.length;
  const introCharCount = cleanIntro.length;

  const suggestions: string[] = [];
  let score = 100;

  // Title checks
  if (titleCharCount < 30) {
    score -= 15;
    suggestions.push('Il titolo è troppo breve. Un titolo SEO ideale è tra 40 e 70 caratteri.');
  } else if (titleCharCount > 80) {
    score -= 10;
    suggestions.push('Il titolo è un po\' lungo per i motori di ricerca (ottimale: 40-70 caratteri).');
  }

  // Intro checks
  if (introCharCount < 60) {
    score -= 15;
    suggestions.push('L\'introduzione/meta description è breve. Aggiungi dettagli per catturare l\'attenzione (80-160 caratteri).');
  } else if (introCharCount > 220) {
    score -= 10;
    suggestions.push('L\'introduzione supera i 200 caratteri e potrebbe essere troncata nei risultati Google/AI.');
  }

  // Word count check
  if (wordCount < 150) {
    score -= 25;
    suggestions.push('Il contenuto ha meno di 150 parole. Articoli più approfonditi (300+ parole) si posizionano meglio su Google ed LLM.');
  } else if (wordCount < 300) {
    score -= 10;
    suggestions.push('Consigliato estendere il testo a 300+ parole per una migliore indicizzazione.');
  }

  // Tags check
  if (tags.length === 0) {
    score -= 15;
    suggestions.push('Non sono presenti tag/parole chiave. Aggiungi 3-5 tag per categorizzare l\'articolo.');
  } else if (tags.length < 3) {
    score -= 5;
    suggestions.push('Aggiungi almeno 3 tag rilevanti per la ricerca.');
  }

  score = Math.max(20, Math.min(100, score));

  let label = 'Ottimo (SEO & AI Ready)';
  if (score < 60) label = 'Da migliorare';
  else if (score < 85) label = 'Buono';

  return {
    score,
    label,
    wordCount,
    readingTimeMinutes,
    titleCharCount,
    introCharCount,
    suggestions
  };
}

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
 * semantic HTML with light, readable typography (<h3>, <p>, <ul>, <li>, <blockquote>).
 * Removes stray markdown artifacts and orphan symbols.
 */
export function formatArticleContentToHtml(content: string | null | undefined): string {
  if (!content) return '';

  let text = content.trim();

  // If text already has HTML paragraph tags or headers, polish and clean stray symbols
  const containsHtml = /<[a-z][\s\S]*>/i.test(text);

  if (containsHtml) {
    return text
      // Clean up markdown bold inside HTML tags: **text** -> <strong>text</strong>
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Clean up markdown italic inside HTML tags: *text* -> <em>text</em>
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Clean up markdown headers inside HTML tags if present: ### text -> <h3>text</h3>
      .replace(/###\s*(.+)/g, '<h3 className="font-serif text-lg font-bold text-[#0a1c3e] mt-6 mb-2">$1</h3>')
      .replace(/##\s*(.+)/g, '<h2 className="font-serif text-xl font-bold text-[#0a1c3e] mt-6 mb-3">$1</h2>')
      // Remove any orphan backticks or markdown hashtags
      .replace(/```[a-z]*/gi, '')
      .replace(/```/g, '');
  }

  // Convert pure Markdown or raw text into clean semantic HTML
  const lines = text.split('\n');
  const formattedBlocks: string[] = [];
  let inList = false;

  lines.forEach((line) => {
    let trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        formattedBlocks.push('</ul>');
        inList = false;
      }
      return;
    }

    // Convert markdown headers
    if (trimmed.startsWith('### ')) {
      if (inList) { formattedBlocks.push('</ul>'); inList = false; }
      const headerText = stripFormattingSymbols(trimmed.slice(4));
      formattedBlocks.push(`<h3 class="font-serif text-lg font-bold text-[#0a1c3e] mt-6 mb-2 tracking-tight">${headerText}</h3>`);
      return;
    }

    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      if (inList) { formattedBlocks.push('</ul>'); inList = false; }
      const headerText = stripFormattingSymbols(trimmed.replace(/^#+\s*/, ''));
      formattedBlocks.push(`<h2 class="font-serif text-xl font-bold text-[#0a1c3e] mt-6 mb-3 tracking-tight">${headerText}</h2>`);
      return;
    }

    // Convert blockquotes
    if (trimmed.startsWith('> ')) {
      if (inList) { formattedBlocks.push('</ul>'); inList = false; }
      const quoteText = stripFormattingSymbols(trimmed.slice(2));
      formattedBlocks.push(`<blockquote class="border-l-4 border-brand-gold bg-amber-50/70 p-4 my-4 rounded-r-2xl italic text-slate-800 text-sm leading-relaxed">${quoteText}</blockquote>`);
      return;
    }

    // Convert list items (* or -)
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (!inList) {
        formattedBlocks.push('<ul class="list-disc list-inside space-y-1.5 my-3 text-slate-700 pl-2">');
        inList = true;
      }
      let itemText = trimmed.slice(2);
      itemText = itemText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      formattedBlocks.push(`<li>${itemText}</li>`);
      return;
    }

    if (inList) {
      formattedBlocks.push('</ul>');
      inList = false;
    }

    // Paragraph conversion
    let paragraphText = trimmed
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');

    formattedBlocks.push(`<p class="leading-relaxed text-slate-700 text-sm md:text-base my-3 font-sans">${paragraphText}</p>`);
  });

  if (inList) {
    formattedBlocks.push('</ul>');
  }

  return formattedBlocks.join('\n');
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

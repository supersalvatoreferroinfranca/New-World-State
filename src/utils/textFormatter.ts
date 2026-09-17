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
    .replace(/<[^>]*>?/gm, ' ')
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
 * Converts raw content (whether markdown, mixed HTML, or unformatted text) into clean,
 * semantic HTML with spacious, readable typography (<h3>, <p>, <ul>, <li>, <blockquote>).
 * Guarantees that headings and paragraphs are never fused together.
 */
export function formatArticleContentToHtml(content: string | null | undefined): string {
  if (!content) return '';

  let text = content.trim();

  // If text already has HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(text);

  if (hasHtmlTags) {
    // 1. Normalize JSX className
    let sanitized = text.replace(/\bclassName=/g, 'class=');

    // 2. Convert markdown bold/italic inside HTML
    sanitized = sanitized
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
      .replace(/```[a-z]*/gi, '')
      .replace(/```/g, '');

    // 3. Fix merged headers (e.g. <h3>Heading Text Long Paragraph...</h3>)
    // If an <h3> or <h2> contains more than 160 characters or multiple sentences, split it
    sanitized = sanitized.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, innerText) => {
      const cleanInner = innerText.trim();
      // If innerText is short, keep as heading
      if (cleanInner.length <= 120 && !cleanInner.includes('\n')) {
        return `<${tag} class="font-serif text-xl font-bold text-[#0a1c3e] mt-8 mb-3 tracking-tight">${cleanInner}</${tag}>`;
      }
      
      // If innerText has newlines, split at first newline
      if (cleanInner.includes('\n')) {
        const parts = cleanInner.split('\n').map((p: string) => p.trim()).filter(Boolean);
        const headerPart = parts[0];
        const restParagraphs = parts.slice(1).map((p: string) => `<p class="article-p leading-relaxed text-slate-700 text-base md:text-lg mb-6 font-sans">${p}</p>`).join('\n');
        return `<${tag} class="font-serif text-xl font-bold text-[#0a1c3e] mt-8 mb-3 tracking-tight">${headerPart}</${tag}>\n${restParagraphs}`;
      }

      // If innerText is long without newlines, check for colon or first sentence
      const splitMatch = cleanInner.match(/^([^:?!\.\n]{15,90}[:?!\.]|\b[A-Z0-9\s]{10,60}\b)\s+([A-Z].+)$/);
      if (splitMatch && cleanInner.length > 140) {
        return `<${tag} class="font-serif text-xl font-bold text-[#0a1c3e] mt-8 mb-3 tracking-tight">${splitMatch[1]}</${tag}>\n<p class="article-p leading-relaxed text-slate-700 text-base md:text-lg mb-6 font-sans">${splitMatch[2]}</p>`;
      }

      return `<${tag} class="font-serif text-xl font-bold text-[#0a1c3e] mt-8 mb-3 tracking-tight">${cleanInner}</${tag}>`;
    });

    // 4. Ensure <p> tags have standard styling
    sanitized = sanitized.replace(/<p(?![^>]*class=)/gi, '<p class="article-p leading-relaxed text-slate-700 text-base md:text-lg mb-6 font-sans"');

    // 5. Convert standalone markdown headers inside HTML
    sanitized = sanitized
      .replace(/###\s+(.+?)(?=(<|\n|$))/g, '<h3 class="font-serif text-xl font-bold text-[#0a1c3e] mt-8 mb-3 tracking-tight">$1</h3>')
      .replace(/##\s+(.+?)(?=(<|\n|$))/g, '<h2 class="font-serif text-2xl font-bold text-[#0a1c3e] mt-10 mb-4 tracking-tight">$1</h2>');

    return sanitized;
  }

  // Pure Markdown parsing - Line by line processor
  const lines = text.split('\n');
  const blocks: string[] = [];
  let currentParagraphLines: string[] = [];
  let currentListLines: string[] = [];
  let currentListIsOrdered = false;
  let currentQuoteLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      let pText = currentParagraphLines.join(' ').trim();
      pText = pText
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">$1</a>');
      if (pText) {
        blocks.push(`<p class="article-p leading-relaxed text-slate-700 text-base md:text-lg mb-6 font-sans">${pText}</p>`);
      }
      currentParagraphLines = [];
    }
  };

  const flushList = () => {
    if (currentListLines.length > 0) {
      const tag = currentListIsOrdered ? 'ol' : 'ul';
      const listClass = currentListIsOrdered 
        ? 'list-decimal list-outside space-y-2.5 my-6 text-slate-700 pl-7 font-sans' 
        : 'list-disc list-outside space-y-2.5 my-6 text-slate-700 pl-7 font-sans';
      
      const items = currentListLines.map(item => {
        let cleanItem = item
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/__([^_]+)__/g, '<strong>$1</strong>')
          .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">$1</a>');
        return `<li class="leading-relaxed text-slate-700 text-base md:text-lg font-sans my-1.5">${cleanItem}</li>`;
      }).join('\n');

      blocks.push(`<${tag} class="${listClass}">\n${items}\n</${tag}>`);
      currentListLines = [];
    }
  };

  const flushQuote = () => {
    if (currentQuoteLines.length > 0) {
      let quoteText = currentQuoteLines.join(' ').trim();
      quoteText = quoteText
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
      blocks.push(`<blockquote class="border-l-4 border-brand-gold bg-amber-50/70 p-5 my-6 rounded-r-2xl italic text-slate-800 text-base leading-relaxed">${quoteText}</blockquote>`);
      currentQuoteLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Empty line
    if (!line) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    // Heading 3: ###
    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      flushQuote();
      const hText = line.replace(/^###\s+/, '').replace(/[\*\_`]/g, '').trim();
      blocks.push(`<h3 class="font-serif text-xl font-bold text-[#0a1c3e] mt-8 mb-3 tracking-tight">${hText}</h3>`);
      continue;
    }

    // Heading 2 or 1: ## or #
    if (line.startsWith('## ') || line.startsWith('# ')) {
      flushParagraph();
      flushList();
      flushQuote();
      const hText = line.replace(/^#{1,2}\s+/, '').replace(/[\*\_`]/g, '').trim();
      blocks.push(`<h2 class="font-serif text-2xl font-bold text-[#0a1c3e] mt-10 mb-4 tracking-tight">${hText}</h2>`);
      continue;
    }

    // Blockquote: >
    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      currentQuoteLines.push(line.replace(/^>\s*/, ''));
      continue;
    }

    // Unordered List item: * or -
    if (line.startsWith('* ') || line.startsWith('- ')) {
      flushParagraph();
      flushQuote();
      currentListIsOrdered = false;
      currentListLines.push(line.replace(/^[\*\-]\s+/, ''));
      continue;
    }

    // Ordered List item: 1. or 2.
    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      flushQuote();
      currentListIsOrdered = true;
      currentListLines.push(line.replace(/^\d+\.\s+/, ''));
      continue;
    }

    // Standard text line
    if (currentQuoteLines.length > 0) {
      currentQuoteLines.push(line);
    } else if (currentListLines.length > 0) {
      currentListLines[currentListLines.length - 1] += ' ' + line;
    } else {
      currentParagraphLines.push(line);
    }
  }

  flushParagraph();
  flushList();
  flushQuote();

  return blocks.join('\n\n');
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

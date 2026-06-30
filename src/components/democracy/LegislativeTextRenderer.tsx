import React from 'react';

interface LegislativeTextRendererProps {
  content: string;
  title?: string;
  className?: string;
}

export function formatLegislativeText(text: string): string {
  if (!text) return '';
  
  // Normalize line endings
  let formatted = text.replace(/\r\n/g, '\n');

  // Insert header markers '###' for Articolo if not present
  // E.g., if we see "Articolo 1 - Oggetto e Finalità", make it "### Articolo 1 - Oggetto e Finalità"
  formatted = formatted.replace(/(?<!###\s)(Articolo\s+\d+)/gi, '### $1');

  // If there's no PREAMBOLO header, let's make it a header
  formatted = formatted.replace(/(?<!###\s)(PREAMBOLO)/gi, '### $1');

  // Add newlines before "###" headers if they are bunched up
  formatted = formatted.replace(/([^\n])\s*(###)/g, '$1\n\n$2');

  // Format list items like "1. ", "2. " to be on their own line with spacing
  formatted = formatted.replace(/(?<!\n)(\b\d+\.\s+)/g, '\n$1');

  // Clean up extra spaces/newlines
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  return formatted.trim();
}

export function LegislativeTextRenderer({ content, title, className = '' }: LegislativeTextRendererProps) {
  const formatted = formatLegislativeText(content);
  const lines = formatted.split('\n');

  const renderTextWithBold = (text: string) => {
    // Split by ** to find bold text
    const parts = text.split(/\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <strong key={index} className="font-semibold text-slate-900 border-b border-slate-100 pb-0.5">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  const elements: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      const listKey = `list-${elements.length}`;
      elements.push(
        <ol key={listKey} className="space-y-4 my-5 pl-1">
          {currentListItems}
        </ol>
      );
      currentListItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Check if it's a heading
    if (trimmedLine.startsWith('###')) {
      flushList();
      const headingText = trimmedLine.replace(/^###\s*/, '');
      const isArticle = headingText.toLowerCase().startsWith('articolo');
      const isPreamble = headingText.toLowerCase() === 'preambolo';
      const isAnalysis = headingText.toLowerCase().includes('impatto') || headingText.toLowerCase().includes('sostenibilità');

      elements.push(
        <h3
          key={`h3-${index}`}
          className={`font-sans tracking-tight text-slate-900 font-bold ${
            isPreamble 
              ? 'text-lg uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 mt-8 mb-4' 
              : isArticle 
              ? 'text-base text-slate-800 mt-8 mb-4 border-l-4 border-brand-gold pl-3' 
              : 'text-sm text-slate-800 mt-6 mb-3'
          }`}
        >
          {headingText}
        </h3>
      );
    }
    // Check if it's an ordered list item (e.g. "1. La presente Legge...")
    else if (/^\d+\.\s+/.test(trimmedLine)) {
      const match = trimmedLine.match(/^(\d+)\.\s+(.*)$/);
      if (match) {
        const num = match[1];
        const text = match[2];
        currentListItems.push(
          <li key={`li-${index}`} className="flex items-start gap-4">
            <span className="font-mono text-slate-400 font-medium select-none shrink-0 w-6 text-right">
              {num}.
            </span>
            <span className="text-slate-600 leading-relaxed font-sans flex-1 text-left">
              {renderTextWithBold(text)}
            </span>
          </li>
        );
      } else {
        currentListItems.push(
          <li key={`li-${index}`} className="text-slate-600 leading-relaxed font-sans text-left pl-10">
            {renderTextWithBold(trimmedLine)}
          </li>
        );
      }
    }
    // Check if it's a bullet list item (e.g. "- Un impatto...")
    else if (/^[-*+]\s+/.test(trimmedLine)) {
      flushList();
      const text = trimmedLine.replace(/^[-*+]\s+/, '');
      elements.push(
        <div key={`bullet-${index}`} className="flex items-start gap-3 my-2.5 pl-6 text-left">
          <span className="text-brand-gold shrink-0 mt-1.5 select-none text-[8px]">●</span>
          <span className="text-slate-600 leading-relaxed font-sans text-sm flex-1">
            {renderTextWithBold(text)}
          </span>
        </div>
      );
    }
    // Otherwise, it's a regular paragraph
    else {
      flushList();
      elements.push(
        <p key={`p-${index}`} className="text-slate-600 leading-relaxed font-sans text-sm my-4 text-left">
          {renderTextWithBold(trimmedLine)}
        </p>
      );
    }
  });

  // Flush any remaining list items
  flushList();

  return (
    <div className={`legislative-doc-container bg-white border border-slate-100 rounded-2xl p-6 md:p-8 text-left shadow-sm max-w-4xl mx-auto font-sans ${className}`}>
      {title && (
        <h2 className="text-xl md:text-2xl font-extrabold font-sans tracking-tight text-brand-blue border-b border-slate-100 pb-5 mb-6 uppercase text-left leading-snug">
          {title}
        </h2>
      )}
      <div className="space-y-2">
        {elements}
      </div>
    </div>
  );
}

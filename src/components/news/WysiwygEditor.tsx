import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { formatArticleContentToHtml } from '../../utils/textFormatter';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Link as LinkIcon, 
  Eraser, 
  Code, 
  Eye, 
  Image as ImageIcon 
} from 'lucide-react';

interface WysiwygEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function WysiwygEditor({
  value,
  onChange,
  placeholder = 'Scrivi qui il tuo testo con la formattazione WYSIWYG...',
  minHeight = '180px'
}: WysiwygEditorProps) {
  const { tText } = useI18n();
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync value into contentEditable when not focused or initially
  useEffect(() => {
    if (editorRef.current) {
      const formattedHtml = formatArticleContentToHtml(value || '');
      if (editorRef.current.innerHTML !== formattedHtml && !editorRef.current.contains(document.activeElement)) {
        editorRef.current.innerHTML = formattedHtml;
      }
    }
  }, [value, isHtmlMode]);

  const execCommand = (command: string, arg: string | undefined = undefined) => {
    if (isHtmlMode) return;
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleAddLink = () => {
    const url = prompt(tText('Enter the link URL (http://...):', 'Inserisci l\'URL del link (http://...):'));
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#0a1c3e] transition">
      {/* WYSIWYG Toolbar */}
      <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-1 text-slate-700 select-none">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            disabled={isHtmlMode}
            title={tText('Bold', 'Grassetto')}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-40"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('italic')}
            disabled={isHtmlMode}
            title={tText('Italic', 'Corsivo')}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-40"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('underline')}
            disabled={isHtmlMode}
            title={tText('Underline', 'Sottolineato')}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-40"
          >
            <Underline className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('strikeThrough')}
            disabled={isHtmlMode}
            title={tText('Strikethrough', 'Barrato')}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-40"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h3>')}
            disabled={isHtmlMode}
            title={tText('Heading 3', 'Intestazione H3')}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-40"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            disabled={isHtmlMode}
            title={tText('Bullet List', 'Elenco Puntato')}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-40"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            disabled={isHtmlMode}
            title={tText('Numbered List', 'Elenco Numerato')}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-40"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<blockquote>')}
            disabled={isHtmlMode}
            title={tText('Quote', 'Citazione')}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-40"
          >
            <Quote className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={handleAddLink}
            disabled={isHtmlMode}
            title={tText('Insert Link', 'Inserisci Link')}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-40"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand('removeFormat')}
            disabled={isHtmlMode}
            title={tText('Clear Formatting', 'Rimuovi Formattazione')}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-40"
          >
            <Eraser className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Toggle Mode: Visual vs HTML */}
        <button
          type="button"
          onClick={() => setIsHtmlMode(!isHtmlMode)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 border ${
            isHtmlMode
              ? 'bg-[#0a1c3e] text-brand-gold border-[#0a1c3e]'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'
          }`}
        >
          {isHtmlMode ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>{tText('Visual Editor', 'Vista Visuale')}</span>
            </>
          ) : (
            <>
              <Code className="w-3.5 h-3.5" />
              <span>{tText('HTML Code', 'Codice HTML')}</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Body */}
      {isHtmlMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={7}
          className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-900 text-emerald-400 outline-none resize-none"
          style={{ minHeight }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          data-placeholder={placeholder}
          className="p-4 text-xs text-slate-800 leading-relaxed outline-none min-h-[160px] prose prose-slate max-w-none focus:outline-none"
          style={{ minHeight }}
        />
      )}
    </div>
  );
}

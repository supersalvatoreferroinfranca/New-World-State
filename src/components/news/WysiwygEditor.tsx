import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { formatArticleContentToHtml, stripFormattingSymbols } from '../../utils/textFormatter';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Subscript, 
  Superscript, 
  Heading2, 
  Heading3, 
  Heading4, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  Indent, 
  Outdent, 
  Quote, 
  Link as LinkIcon, 
  Unlink, 
  Eraser, 
  Code, 
  Eye, 
  Undo, 
  Redo, 
  Palette, 
  Highlighter, 
  Minus, 
  Table as TableIcon, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  ChevronDown,
  Type
} from 'lucide-react';

interface WysiwygEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  showWordCount?: boolean;
}

export default function WysiwygEditor({
  value,
  onChange,
  placeholder = 'Scrivi qui il tuo testo con la formattazione avanzata...',
  minHeight = '180px',
  maxHeight = '380px',
  showWordCount = true
}: WysiwygEditorProps) {
  const { tText } = useI18n();
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showHeadingPicker, setShowHeadingPicker] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);
  const headingPickerRef = useRef<HTMLDivElement>(null);
  const tablePickerRef = useRef<HTMLDivElement>(null);

  // Sync value into contentEditable when not focused or initially
  useEffect(() => {
    if (editorRef.current) {
      const formattedHtml = formatArticleContentToHtml(value || '');
      if (editorRef.current.innerHTML !== formattedHtml && !editorRef.current.contains(document.activeElement)) {
        editorRef.current.innerHTML = formattedHtml;
      }
    }
  }, [value, isHtmlMode]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(e.target as Node)) {
        setShowHighlightPicker(false);
      }
      if (headingPickerRef.current && !headingPickerRef.current.contains(e.target as Node)) {
        setShowHeadingPicker(false);
      }
      if (tablePickerRef.current && !tablePickerRef.current.contains(e.target as Node)) {
        setShowTablePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const execCommand = (command: string, arg: string | undefined = undefined) => {
    if (isHtmlMode) return;
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleAddLink = () => {
    const url = prompt(tText('Enter the link URL (https://...):', 'Inserisci l\'URL del link (https://...):'));
    if (url) {
      execCommand('createLink', url);
    }
  };

  const handleRemoveLink = () => {
    execCommand('unlink');
  };

  const handleInsertCallout = () => {
    const calloutHtml = `
      <div class="nws-callout" style="border-left: 4px solid #c5a059; background: linear-gradient(to right, rgba(197, 168, 128, 0.15), rgba(197, 168, 128, 0.04)); padding: 16px 20px; border-radius: 0 12px 12px 0; margin: 20px 0; color: #1e293b; font-style: italic;">
        <strong>📌 NOTA ISTITUZIONALE NEW WORLD STATE:</strong> Inserisci qui un appunto o approfondimento chiave...
      </div>
      <p><br></p>
    `;
    if (document.queryCommandSupported('insertHTML')) {
      execCommand('insertHTML', calloutHtml);
    } else {
      execCommand('formatBlock', '<blockquote>');
    }
  };

  const handleInsertTable = (rows: number, cols: number) => {
    let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; border: 1px solid #cbd5e1;"><thead><tr>`;
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th style="background-color: #0a1c3e; color: #ffffff; padding: 8px 12px; border: 1px solid #1e293b; text-align: left;">Intestazione ${c}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 1; r <= rows; r++) {
      tableHtml += `<tr>`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td style="padding: 8px 12px; border: 1px solid #e2e8f0; background-color: ${r % 2 === 0 ? '#f8fafc' : '#ffffff'};">Dato ${r}.${c}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br></p>`;
    
    if (document.queryCommandSupported('insertHTML')) {
      execCommand('insertHTML', tableHtml);
    }
    setShowTablePicker(false);
  };

  const handleSetHeading = (tag: string) => {
    if (tag === 'p') {
      execCommand('formatBlock', '<p>');
    } else {
      execCommand('formatBlock', `<${tag}>`);
    }
    setShowHeadingPicker(false);
  };

  const handleSetTextColor = (color: string) => {
    execCommand('foreColor', color);
    setShowColorPicker(false);
  };

  const handleSetHighlight = (color: string) => {
    execCommand('hiliteColor', color);
    setShowHighlightPicker(false);
  };

  // Metrics computation
  const plainText = stripFormattingSymbols(value || '');
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const charCount = plainText.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 180));

  const effectiveMaxHeight = isExpanded ? '650px' : maxHeight;

  return (
    <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#0a1c3e] focus-within:border-[#0a1c3e] transition text-slate-900 flex flex-col">
      {/* RICH WYSIWYG TOOLBAR */}
      <div className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-sm border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-1 text-slate-900 select-none shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        <div className="flex flex-wrap items-center gap-1">
          {/* History: Undo / Redo */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => execCommand('undo')}
              disabled={isHtmlMode}
              title={tText('Undo (Ctrl+Z)', 'Annulla (Ctrl+Z)')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition cursor-pointer disabled:opacity-30"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('redo')}
              disabled={isHtmlMode}
              title={tText('Redo (Ctrl+Y)', 'Ripristina (Ctrl+Y)')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition cursor-pointer disabled:opacity-30"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-5 bg-slate-300 mx-0.5 hidden sm:block" />

          {/* Heading / Block Style Dropdown */}
          <div className="relative" ref={headingPickerRef}>
            <button
              type="button"
              onClick={() => !isHtmlMode && setShowHeadingPicker(!showHeadingPicker)}
              disabled={isHtmlMode}
              title={tText('Typography & Headings', 'Stili e Intestazioni')}
              className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-30 shadow-2xs"
            >
              <Type className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">{tText('Format', 'Formato')}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showHeadingPicker && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => handleSetHeading('p')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>{tText('Normal Paragraph', 'Paragrafo Normale')}</span>
                  <span className="text-[10px] text-slate-400 font-mono">&lt;p&gt;</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetHeading('h2')}
                  className="w-full text-left px-3 py-1.5 text-sm font-bold text-[#0a1c3e] hover:bg-slate-100 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5"><Heading2 className="w-3.5 h-3.5 text-brand-gold" /> {tText('Heading 2', 'Titolo Principale (H2)')}</span>
                  <span className="text-[10px] text-slate-400 font-mono">&lt;h2&gt;</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetHeading('h3')}
                  className="w-full text-left px-3 py-1.5 text-xs font-semibold text-[#0a1c3e] hover:bg-slate-100 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5"><Heading3 className="w-3.5 h-3.5 text-brand-gold" /> {tText('Heading 3', 'Sottotitolo (H3)')}</span>
                  <span className="text-[10px] text-slate-400 font-mono">&lt;h3&gt;</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetHeading('h4')}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5"><Heading4 className="w-3.5 h-3.5 text-slate-500" /> {tText('Heading 4', 'Sezione (H4)')}</span>
                  <span className="text-[10px] text-slate-400 font-mono">&lt;h4&gt;</span>
                </button>
              </div>
            )}
          </div>

          {/* Inline Text Styles: B, I, U, S, Sub, Sup */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => execCommand('bold')}
              disabled={isHtmlMode}
              title={tText('Bold', 'Grassetto (Ctrl+B)')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-800 hover:text-black font-bold transition cursor-pointer disabled:opacity-30"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => execCommand('italic')}
              disabled={isHtmlMode}
              title={tText('Italic', 'Corsivo (Ctrl+I)')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-800 hover:text-black transition cursor-pointer disabled:opacity-30"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => execCommand('underline')}
              disabled={isHtmlMode}
              title={tText('Underline', 'Sottolineato (Ctrl+U)')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-800 hover:text-black transition cursor-pointer disabled:opacity-30"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => execCommand('strikeThrough')}
              disabled={isHtmlMode}
              title={tText('Strikethrough', 'Barrato')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-800 hover:text-black transition cursor-pointer disabled:opacity-30"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => execCommand('subscript')}
              disabled={isHtmlMode}
              title={tText('Subscript', 'Pedice')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30 hidden md:inline-flex"
            >
              <Subscript className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => execCommand('superscript')}
              disabled={isHtmlMode}
              title={tText('Superscript', 'Apice')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30 hidden md:inline-flex"
            >
              <Superscript className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-5 bg-slate-300 mx-0.5 hidden sm:block" />

          {/* Text Color Picker */}
          <div className="relative" ref={colorPickerRef}>
            <button
              type="button"
              onClick={() => !isHtmlMode && setShowColorPicker(!showColorPicker)}
              disabled={isHtmlMode}
              title={tText('Text Color', 'Colore Testo')}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition cursor-pointer disabled:opacity-30 flex items-center gap-0.5 shadow-2xs"
            >
              <Palette className="w-3.5 h-3.5 text-[#0a1c3e]" />
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-xl shadow-xl border border-slate-200 z-30 grid grid-cols-4 gap-1.5 w-40">
                <button
                  type="button"
                  onClick={() => handleSetTextColor('#0f172a')}
                  className="w-7 h-7 rounded-md bg-[#0f172a] hover:scale-110 transition cursor-pointer border border-slate-300"
                  title="Nero / Slate"
                />
                <button
                  type="button"
                  onClick={() => handleSetTextColor('#0A1C3E')}
                  className="w-7 h-7 rounded-md bg-[#0A1C3E] hover:scale-110 transition cursor-pointer border border-slate-300"
                  title="Blu Istituzionale NWS"
                />
                <button
                  type="button"
                  onClick={() => handleSetTextColor('#C5A059')}
                  className="w-7 h-7 rounded-md bg-[#C5A059] hover:scale-110 transition cursor-pointer border border-slate-300"
                  title="Oro NWS"
                />
                <button
                  type="button"
                  onClick={() => handleSetTextColor('#dc2626')}
                  className="w-7 h-7 rounded-md bg-[#dc2626] hover:scale-110 transition cursor-pointer border border-slate-300"
                  title="Rosso / Bordeaux"
                />
                <button
                  type="button"
                  onClick={() => handleSetTextColor('#16a34a')}
                  className="w-7 h-7 rounded-md bg-[#16a34a] hover:scale-110 transition cursor-pointer border border-slate-300"
                  title="Verde Smeraldo"
                />
                <button
                  type="button"
                  onClick={() => handleSetTextColor('#2563eb')}
                  className="w-7 h-7 rounded-md bg-[#2563eb] hover:scale-110 transition cursor-pointer border border-slate-300"
                  title="Blu Elettrico"
                />
                <button
                  type="button"
                  onClick={() => handleSetTextColor('#9333ea')}
                  className="w-7 h-7 rounded-md bg-[#9333ea] hover:scale-110 transition cursor-pointer border border-slate-300"
                  title="Viola"
                />
                <button
                  type="button"
                  onClick={() => handleSetTextColor('#d97706')}
                  className="w-7 h-7 rounded-md bg-[#d97706] hover:scale-110 transition cursor-pointer border border-slate-300"
                  title="Ambra / Bronzo"
                />
              </div>
            )}
          </div>

          {/* Highlight Background Color Picker */}
          <div className="relative" ref={highlightPickerRef}>
            <button
              type="button"
              onClick={() => !isHtmlMode && setShowHighlightPicker(!showHighlightPicker)}
              disabled={isHtmlMode}
              title={tText('Highlighter', 'Evidenziatore Testo')}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition cursor-pointer disabled:opacity-30 flex items-center gap-0.5 shadow-2xs"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-500" />
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-xl shadow-xl border border-slate-200 z-30 grid grid-cols-4 gap-1.5 w-40">
                <button
                  type="button"
                  onClick={() => handleSetHighlight('transparent')}
                  className="w-7 h-7 rounded-md bg-white hover:scale-110 transition cursor-pointer border border-slate-300 text-[10px] flex items-center justify-center font-bold text-slate-500"
                  title="Nessuno"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={() => handleSetHighlight('#fef08a')}
                  className="w-7 h-7 rounded-md bg-[#fef08a] hover:scale-110 transition cursor-pointer border border-amber-300"
                  title="Giallo Evidenziatore"
                />
                <button
                  type="button"
                  onClick={() => handleSetHighlight('#fef3c7')}
                  className="w-7 h-7 rounded-md bg-[#fef3c7] hover:scale-110 transition cursor-pointer border border-amber-300"
                  title="Oro Tenue NWS"
                />
                <button
                  type="button"
                  onClick={() => handleSetHighlight('#dcfce7')}
                  className="w-7 h-7 rounded-md bg-[#dcfce7] hover:scale-110 transition cursor-pointer border border-emerald-300"
                  title="Verde Tenue"
                />
                <button
                  type="button"
                  onClick={() => handleSetHighlight('#e0f2fe')}
                  className="w-7 h-7 rounded-md bg-[#e0f2fe] hover:scale-110 transition cursor-pointer border border-sky-300"
                  title="Azzurro Tenue"
                />
                <button
                  type="button"
                  onClick={() => handleSetHighlight('#fce7f3')}
                  className="w-7 h-7 rounded-md bg-[#fce7f3] hover:scale-110 transition cursor-pointer border border-pink-300"
                  title="Rosa Tenue"
                />
                <button
                  type="button"
                  onClick={() => handleSetHighlight('#f3e8ff')}
                  className="w-7 h-7 rounded-md bg-[#f3e8ff] hover:scale-110 transition cursor-pointer border border-purple-300"
                  title="Lavanda"
                />
                <button
                  type="button"
                  onClick={() => handleSetHighlight('#ffedd5')}
                  className="w-7 h-7 rounded-md bg-[#ffedd5] hover:scale-110 transition cursor-pointer border border-orange-300"
                  title="Pesca / Albicocca"
                />
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-slate-300 mx-0.5 hidden sm:block" />

          {/* Alignment Group */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => execCommand('justifyLeft')}
              disabled={isHtmlMode}
              title={tText('Align Left', 'Allinea a Sinistra')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('justifyCenter')}
              disabled={isHtmlMode}
              title={tText('Align Center', 'Allinea al Centro')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('justifyRight')}
              disabled={isHtmlMode}
              title={tText('Align Right', 'Allinea a Destra')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('justifyFull')}
              disabled={isHtmlMode}
              title={tText('Justify', 'Giustificato')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-5 bg-slate-300 mx-0.5 hidden sm:block" />

          {/* Lists and Indents */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => execCommand('insertUnorderedList')}
              disabled={isHtmlMode}
              title={tText('Bullet List', 'Elenco Puntato')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('insertOrderedList')}
              disabled={isHtmlMode}
              title={tText('Numbered List', 'Elenco Numerato')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('outdent')}
              disabled={isHtmlMode}
              title={tText('Decrease Indent', 'Riduci Rientro')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30 hidden md:inline-flex"
            >
              <Outdent className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCommand('indent')}
              disabled={isHtmlMode}
              title={tText('Increase Indent', 'Aumenta Rientro')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30 hidden md:inline-flex"
            >
              <Indent className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-5 bg-slate-300 mx-0.5 hidden sm:block" />

          {/* Special Elements: Quote, Callout, Divider, Table, Link */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => execCommand('formatBlock', '<blockquote>')}
              disabled={isHtmlMode}
              title={tText('Quote Block', 'Citazione / Blockquote')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleInsertCallout}
              disabled={isHtmlMode}
              title={tText('Institutional Callout Box', 'Box in Evidenza Istituzionale')}
              className="p-1.5 rounded-md hover:bg-amber-50 text-amber-700 transition cursor-pointer disabled:opacity-30"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => execCommand('insertHorizontalRule')}
              disabled={isHtmlMode}
              title={tText('Horizontal Divider', 'Linea Divisoria Orizzontale')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Table Dropdown */}
            <div className="relative" ref={tablePickerRef}>
              <button
                type="button"
                onClick={() => !isHtmlMode && setShowTablePicker(!showTablePicker)}
                disabled={isHtmlMode}
                title={tText('Insert Table', 'Inserisci Tabella')}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>

              {showTablePicker && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {tText('Select Table Size', 'Dimensione Tabella')}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInsertTable(2, 2)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                  >
                    <span>2 Colonne x 2 Righe</span>
                    <span className="text-slate-400 font-mono">2x2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTable(3, 3)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                  >
                    <span>3 Colonne x 3 Righe</span>
                    <span className="text-slate-400 font-mono">3x3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTable(4, 3)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                  >
                    <span>3 Colonne x 4 Righe</span>
                    <span className="text-slate-400 font-mono">3x4</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddLink}
              disabled={isHtmlMode}
              title={tText('Insert Link', 'Inserisci Link')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleRemoveLink}
              disabled={isHtmlMode}
              title={tText('Remove Link', 'Rimuovi Link')}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 hover:text-black transition cursor-pointer disabled:opacity-30"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => execCommand('removeFormat')}
              disabled={isHtmlMode}
              title={tText('Clear Formatting', 'Rimuovi Formattazione (Gomma)')}
              className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600 transition cursor-pointer disabled:opacity-30"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Section: Expand Height & HTML/Visual Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? tText('Reduce Height', 'Riduci Altezza Editor') : tText('Expand Height', 'Espandi Altezza Editor')}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-2xs"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsHtmlMode(!isHtmlMode)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
              isHtmlMode
                ? 'bg-[#0a1c3e] text-brand-gold border-[#0a1c3e]'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {isHtmlMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tText('Visual View', 'Vista Visuale')}</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5" />
                <span>{tText('HTML Code', 'Codice HTML')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* EDITOR BODY WITH PERSISTENT VERTICAL SCROLLBAR & COMFORTABLE WRITING CANVAS */}
      <div className="relative flex-1 bg-white">
        {isHtmlMode ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={12}
            className="editor-scroll-container-dark w-full p-4 font-mono text-xs bg-slate-950 text-emerald-300 placeholder-slate-500 outline-none resize-none selection:bg-emerald-800 selection:text-white overflow-y-auto block"
            style={{ 
              minHeight, 
              maxHeight: effectiveMaxHeight,
              height: isExpanded ? '600px' : 'auto'
            }}
          />
        ) : (
          <div
            className="editor-scroll-container overflow-y-auto overflow-x-hidden bg-white text-slate-900"
            style={{ 
              minHeight, 
              maxHeight: effectiveMaxHeight,
              height: isExpanded ? '600px' : 'auto'
            }}
          >
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onBlur={handleInput}
              data-placeholder={placeholder}
              className="editor-body p-5 text-[16px] text-slate-900 leading-relaxed outline-none focus:outline-none font-sans min-h-full selection:bg-amber-100 selection:text-slate-900"
              style={{ minHeight }}
            />
          </div>
        )}
      </div>

      {/* BOTTOM STATUS & METRICS FOOTER */}
      {showWordCount && (
        <div className="bg-slate-50 border-t border-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-500 select-none">
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-700">
              📝 <strong>{wordCount}</strong> {tText('words', 'parole')}
            </span>
            <span className="text-slate-400">•</span>
            <span>
              <strong>{charCount}</strong> {tText('characters', 'caratteri')}
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-600">
              ⏱️ ~{readingTime} {tText('min read', 'min di lettura')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="hidden md:inline font-mono text-[10px] text-slate-500">
              ↕ Barra di scorrimento attiva
            </span>
            {isExpanded && (
              <span className="text-[10px] font-bold text-brand-blue bg-amber-100/80 px-1.5 py-0.5 rounded">
                Espanso
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

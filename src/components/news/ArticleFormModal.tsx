import React, { useState, useEffect } from 'react';
import { NewsArticle, NewsCategory, NewsMedia } from '../../types/news';
import WysiwygEditor from './WysiwygEditor';
import { 
  getCategories, 
  getArticles, 
  createArticle, 
  updateArticle, 
  generateSlug 
} from '../../services/newsService';
import { useI18n } from '../../contexts/I18nContext';
import { 
  X, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Upload, 
  Link as LinkIcon, 
  Tag as TagIcon, 
  FileText, 
  RefreshCw, 
  Check, 
  Send, 
  Save, 
  Layers, 
  Sparkles, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ArticleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleToEdit?: NewsArticle | null;
  authorId: number | string;
  authorName: string;
  authorRole?: string;
  onSaved?: () => void;
}

export default function ArticleFormModal({
  isOpen,
  onClose,
  articleToEdit,
  authorId,
  authorName,
  authorRole = 'Cronista Ufficiale',
  onSaved
}: ArticleFormModalProps) {
  const { tText } = useI18n();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugCustom, setIsSlugCustom] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [intro, setIntro] = useState('');
  const [content, setContent] = useState('');
  
  // Media State
  const [images, setImages] = useState<NewsMedia[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');

  const [videos, setVideos] = useState<NewsMedia[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoCaption, setNewVideoCaption] = useState('');

  // Tags State
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Related Articles State
  const [relatedIds, setRelatedIds] = useState<string[]>([]);

  // System & Category Lists
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cats = getCategories();
      setCategories(cats);
      const arts = getArticles().filter(a => articleToEdit ? a.id !== articleToEdit.id : true);
      setAllArticles(arts);

      if (articleToEdit) {
        setTitle(articleToEdit.title);
        setSlug(articleToEdit.slug);
        setIsSlugCustom(true);
        setCategoryId(articleToEdit.categoryId);
        setIntro(articleToEdit.intro);
        setContent(articleToEdit.content);
        setImages(articleToEdit.images || []);
        setVideos(articleToEdit.videos || []);
        setTags(articleToEdit.tags || []);
        setRelatedIds(articleToEdit.relatedArticleIds || []);
      } else {
        // Reset defaults
        setTitle('');
        setSlug('');
        setIsSlugCustom(false);
        setCategoryId(cats[0]?.id || '');
        setIntro('');
        setContent('');
        setImages([]);
        setVideos([]);
        setTags(['#NotizieSovrane', '#Cronaca']);
        setRelatedIds([]);
      }
      setError(null);
    }
  }, [isOpen, articleToEdit]);

  if (!isOpen) return null;

  // Real-time automatic slug generation on title change
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugCustom) {
      setSlug(generateSlug(val));
    }
  };

  const handleRegenerateSlug = () => {
    setSlug(generateSlug(title));
    setIsSlugCustom(false);
  };

  // Tag Builder
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    let formatted = tagInput.trim();
    if (!formatted.startsWith('#')) {
      formatted = `#${formatted}`;
    }
    if (!tags.includes(formatted)) {
      setTags([...tags, formatted]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Image Upload or URL Addition to Aruba Space
  const handleFileUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(tText('Please select a valid image file (JPG, PNG, WebP, GIF).', 'Per favore seleziona un file immagine valido (JPG, PNG, WebP, GIF).'));
      return;
    }

    setIsUploadingMedia(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        const res = await fetch('/api/upload-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: dataUrl,
            fileName: file.name,
            fileType: file.type,
            authorName
          })
        });
        const data = await res.json();
        const uploadedUrl = (data.success && data.url) ? data.url : dataUrl;

        setImages(prev => [
          ...prev,
          {
            type: 'image',
            source: 'upload',
            url: uploadedUrl,
            fileName: file.name,
            caption: newImageCaption || file.name
          }
        ]);
        setNewImageCaption('');
      } catch (err) {
        console.warn('Fallback to direct dataUrl:', err);
        setImages(prev => [
          ...prev,
          {
            type: 'image',
            source: 'upload',
            url: dataUrl,
            fileName: file.name,
            caption: newImageCaption || file.name
          }
        ]);
      } finally {
        setIsUploadingMedia(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setImages([
      ...images,
      {
        type: 'image',
        source: 'url',
        url: newImageUrl.trim(),
        caption: newImageCaption.trim() || tText('Attached Image', 'Immagine allegata')
      }
    ]);
    setNewImageUrl('');
    setNewImageCaption('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Video Upload or URL Addition to Aruba Space
  const handleFileUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert(tText('Please select a valid video file (MP4, WebM, MOV).', 'Per favore seleziona un file video valido (MP4, WebM, MOV).'));
      return;
    }

    setIsUploadingMedia(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        const res = await fetch('/api/upload-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: dataUrl,
            fileName: file.name,
            fileType: file.type,
            authorName
          })
        });
        const data = await res.json();
        const uploadedUrl = (data.success && data.url) ? data.url : dataUrl;

        setVideos(prev => [
          ...prev,
          {
            type: 'video',
            source: 'upload',
            url: uploadedUrl,
            fileName: file.name,
            caption: newVideoCaption || file.name
          }
        ]);
        setNewVideoCaption('');
      } catch (err) {
        console.warn('Fallback video url:', err);
        const videoObjectUrl = URL.createObjectURL(file);
        setVideos(prev => [
          ...prev,
          {
            type: 'video',
            source: 'upload',
            url: videoObjectUrl,
            fileName: file.name,
            caption: newVideoCaption || file.name
          }
        ]);
      } finally {
        setIsUploadingMedia(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddVideoUrl = () => {
    if (!newVideoUrl.trim()) return;
    setVideos([
      ...videos,
      {
        type: 'video',
        source: 'url',
        url: newVideoUrl.trim(),
        caption: newVideoCaption.trim() || tText('Attached Video', 'Video allegato')
      }
    ]);
    setNewVideoUrl('');
    setNewVideoCaption('');
  };

  const handleRemoveVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  // Toggle Related Articles
  const handleToggleRelated = (artId: string) => {
    if (relatedIds.includes(artId)) {
      setRelatedIds(relatedIds.filter(id => id !== artId));
    } else {
      setRelatedIds([...relatedIds, artId]);
    }
  };

  // Submit Handler
  const handleSubmit = (submitForModeration: boolean) => {
    if (!title.trim()) {
      setError(tText('Article title is required.', 'Il titolo dell\'articolo è obbligatorio.'));
      return;
    }
    if (!intro.trim()) {
      setError(tText('Introductory abstract is required.', 'Il testo introduttivo (abstract) è obbligatorio.'));
      return;
    }
    if (!content.trim()) {
      setError(tText('Extended article body is required.', 'Il testo esteso dell\'articolo è obbligatorio.'));
      return;
    }
    if (!categoryId) {
      setError(tText('Please select an article category.', 'Seleziona una categoria per l\'articolo.'));
      return;
    }

    if (articleToEdit) {
      updateArticle(articleToEdit.id, {
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        categoryId,
        intro: intro.trim(),
        content: content.trim(),
        images,
        videos,
        tags,
        relatedArticleIds: relatedIds,
        status: submitForModeration ? 'in_moderazione' : articleToEdit.status,
        authorName,
        authorRole
      });
    } else {
      createArticle({
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        categoryId,
        intro: intro.trim(),
        content: content.trim(),
        images,
        videos,
        tags,
        relatedArticleIds: relatedIds,
        authorId,
        authorName,
        authorRole,
        submitForModeration
      });
    }

    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white border border-[#c5a880]/40 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 animate-fade-in flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0a1c3e] text-white px-6 py-5 flex items-center justify-between border-b border-[#c5a880]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-brand-gold leading-tight">
                {articleToEdit ? tText('Edit Reporter Article', 'Modifica Articolo Cronista') : tText('Write New Reporter Article', 'Redazione Nuovo Articolo')}
              </h2>
              <p className="text-[10px] text-slate-300 font-tech tracking-wider uppercase">
                {tText('Author', 'Autore')}: <span className="text-brand-gold font-bold">{authorName}</span> ({authorRole})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Slug */}
          <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div>
              <label className="block text-xs font-bold text-[#0a1c3e] mb-1 uppercase tracking-wider">
                {tText('Article Title', 'Titolo dell\'Articolo')} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="es. Riforma della Trasparenza Digitale e Nuove Tutele per i Cittadini"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0a1c3e] focus:ring-2 focus:ring-[#0a1c3e] outline-none"
                required
              />
            </div>

            {/* Automatic Slug */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                  <span>{tText('Automatic Slug (Permanent URL)', 'Slug Automatico (URL Permanente)')}</span>
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateSlug}
                  className="text-[10px] text-[#0a1c3e] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{tText('Regenerate from Title', 'Rigenera da Titolo')}</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 select-none">
                  /notizie/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsSlugCustom(true);
                  }}
                  placeholder="slug-generato-automaticamente"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-700 focus:ring-2 focus:ring-[#0a1c3e] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-[#0a1c3e] mb-1 uppercase tracking-wider">
                {tText('Article Category', 'Categoria dell\'Articolo')} *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0a1c3e] focus:ring-2 focus:ring-[#0a1c3e] outline-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Builder */}
            <div>
              <label className="block text-xs font-bold text-[#0a1c3e] mb-1 uppercase tracking-wider">
                {tText('Article Tags', 'Tags dell\'Articolo')}
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <TagIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Aggiungi tag (es. #Riforme)"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-[#0a1c3e] outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-[#0a1c3e] text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-brand-gold hover:text-[#0a1c3e] transition cursor-pointer"
                >
                  + Tag
                </button>
              </div>

              {/* Tags Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-red-600 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Testo Introduttivo (Excerpt / Summary) */}
          <div>
            <label className="block text-xs font-bold text-[#0a1c3e] mb-1 uppercase tracking-wider">
              {tText('Introductory Abstract', 'Testo Introduttivo (Abstract / Sommario)')} *
            </label>
            <p className="text-[11px] text-slate-500 mb-1">
              {tText('Brief summary appearing in homepage previews.', 'Breve introduzione che apparirà nell\'anteprima della homepage e nella lista notizie.')}
            </p>
            <WysiwygEditor
              value={intro}
              onChange={setIntro}
              placeholder={tText('Scrivi un testo introduttivo chiaro e sintetico...', 'Write a clear, concise introductory text...')}
              minHeight="120px"
            />
          </div>

          {/* Testo Esteso (Full Content) */}
          <div>
            <label className="block text-xs font-bold text-[#0a1c3e] mb-1 uppercase tracking-wider">
              {tText('Full Article Content', 'Testo Esteso dell\'Articolo')} *
            </label>
            <p className="text-[11px] text-slate-500 mb-1">
              {tText('Main body of the news article.', 'Corpo principale dell\'articolo di giornale.')}
            </p>
            <WysiwygEditor
              value={content}
              onChange={setContent}
              placeholder={tText('Scrivi il testo completo dell\'articolo qui...', 'Write the full news article body here...')}
              minHeight="240px"
            />
          </div>

          {isUploadingMedia && (
            <div className="p-3 bg-brand-gold/10 border border-brand-gold/30 rounded-2xl flex items-center gap-3 text-xs text-[#0a1c3e] font-bold animate-pulse">
              <Loader2 className="w-4 h-4 text-brand-gold animate-spin" />
              <span>{tText('Uploading media file to Aruba Web Space...', 'Caricamento file nello spazio web Aruba in corso...')}</span>
            </div>
          )}

          {/* MEDIA SECTION: IMAGES */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="font-serif text-sm font-bold text-[#0a1c3e] uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand-gold" />
              <span>{tText('Article Images', 'Immagini dell\'Articolo')}</span>
            </h3>

            {/* Options to upload or paste URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PC Upload */}
              <div className="bg-white border border-dashed border-slate-300 rounded-xl p-3 text-center hover:border-[#0a1c3e] transition">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-[#0a1c3e] mb-1">
                  {tText('Upload Image from PC', 'Carica Immagine dal PC')}
                </p>
                <p className="text-[10px] text-slate-500 mb-2">JPG, PNG, WebP (Max 5MB)</p>
                <label className="inline-block bg-[#0a1c3e] text-white hover:bg-brand-gold hover:text-[#0a1c3e] text-[11px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer">
                  {tText('Browse Files...', 'Sfoglia File...')}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUploadImage}
                    className="hidden"
                  />
                </label>
              </div>

              {/* URL Input */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-[#0a1c3e]">
                  {tText('Attach Image via External URL', 'Allegare Immagine tramite URL Esterno')}
                </p>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://esempio.com/immagine.jpg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white"
                />
                <input
                  type="text"
                  value={newImageCaption}
                  onChange={(e) => setNewImageCaption(e.target.value)}
                  placeholder="Didascalia / Titolo dell'immagine"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={!newImageUrl.trim()}
                  className="w-full bg-[#0a1c3e] text-white disabled:opacity-50 text-[11px] font-bold py-1.5 rounded-lg hover:bg-brand-gold hover:text-[#0a1c3e] transition cursor-pointer"
                >
                  + {tText('Add from URL', 'Aggiungi da URL')}
                </button>
              </div>
            </div>

            {/* Images Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-300 bg-black/5 aspect-video">
                    <img
                      src={img.url}
                      alt={img.caption || 'Media'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-between text-white">
                      <p className="text-[10px] line-clamp-2">{img.caption}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="bg-red-600 text-white p-1 rounded-md text-[10px] self-end cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MEDIA SECTION: VIDEOS */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="font-serif text-sm font-bold text-[#0a1c3e] uppercase tracking-wider flex items-center gap-2">
              <VideoIcon className="w-4 h-4 text-brand-gold" />
              <span>{tText('Article Videos', 'Video dell\'Articolo')}</span>
            </h3>

            {/* Options to upload or paste URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PC Upload */}
              <div className="bg-white border border-dashed border-slate-300 rounded-xl p-3 text-center hover:border-[#0a1c3e] transition">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-[#0a1c3e] mb-1">
                  {tText('Upload Video from PC', 'Carica Video dal PC')}
                </p>
                <p className="text-[10px] text-slate-500 mb-2">MP4, WebM, MOV</p>
                <label className="inline-block bg-[#0a1c3e] text-white hover:bg-brand-gold hover:text-[#0a1c3e] text-[11px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer">
                  {tText('Browse Videos...', 'Sfoglia Video...')}
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUploadVideo}
                    className="hidden"
                  />
                </label>
              </div>

              {/* URL Input */}
              <div className="bg-[#white] border border-slate-200 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-[#0a1c3e]">
                  {tText('Attach Video via URL (YouTube / Direct MP4)', 'Allegare Video tramite URL (YouTube / Direct MP4)')}
                </p>
                <input
                  type="url"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... o URL file .mp4"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white"
                />
                <input
                  type="text"
                  value={newVideoCaption}
                  onChange={(e) => setNewVideoCaption(e.target.value)}
                  placeholder="Descrizione del video"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddVideoUrl}
                  disabled={!newVideoUrl.trim()}
                  className="w-full bg-[#0a1c3e] text-white disabled:opacity-50 text-[11px] font-bold py-1.5 rounded-lg hover:bg-brand-gold hover:text-[#0a1c3e] transition cursor-pointer"
                >
                  + {tText('Add Video from URL', 'Aggiungi Video da URL')}
                </button>
              </div>
            </div>

            {/* Videos List */}
            {videos.length > 0 && (
              <div className="space-y-2 pt-2">
                {videos.map((vid, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-[#0a1c3e]/10 text-[#0a1c3e] flex items-center justify-center shrink-0">
                        <VideoIcon className="w-4 h-4" />
                      </div>
                      <div className="truncate text-xs">
                        <p className="font-bold text-[#0a1c3e] truncate">{vid.caption || tText('Attached Video', 'Video allegato')}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{vid.url}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(idx)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RELATED ARTICLES LINKING */}
          {allArticles.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <h3 className="font-serif text-sm font-bold text-[#0a1c3e] uppercase tracking-wider flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-brand-gold" />
                <span>{tText('Link to Previously Written Articles', 'Collega ad Articoli Redatti in Precedenza')}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {tText('Select other articles to link as "Related Articles" at the end of reading.', 'Seleziona altri articoli per collegarli come "Articoli Correlati" al termine della lettura.')}
              </p>

              <div className="max-h-40 overflow-y-auto space-y-2 bg-white border border-slate-200 rounded-xl p-3">
                {allArticles.map((art) => {
                  const isSelected = relatedIds.includes(art.id);
                  return (
                    <label
                      key={art.id}
                      className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition ${
                        isSelected ? 'bg-brand-gold/10 border border-brand-gold/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRelated(art.id)}
                        className="mt-0.5 rounded text-[#0a1c3e] focus:ring-[#0a1c3e]"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-[#0a1c3e]">{art.title}</p>
                        <p className="text-[10px] text-slate-500">
                          {art.authorName} • {new Date(art.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            {tText('Cancel', 'Annulla')}
          </button>

          <div className="flex items-center gap-3">
            {/* Save Draft */}
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-200 text-slate-700 hover:bg-slate-300 transition cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{tText('Save Draft', 'Salva Bozza')}</span>
            </button>

            {/* Submit to Moderation (Custodi Digitali) */}
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#0a1c3e] text-white hover:bg-brand-gold hover:text-[#0a1c3e] transition cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <Send className="w-4 h-4" />
              <span>{tText('Submit for Moderation (Custodians)', 'Invia a Moderazione (Custodi)')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

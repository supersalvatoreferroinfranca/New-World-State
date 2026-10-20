import React, { useState, useEffect } from 'react';
import { NewsArticle, NewsCategory, NewsMedia, ArticleStatus, ArticleSourceReference } from '../../types/news';
import WysiwygEditor from './WysiwygEditor';
import { 
  getCategories, 
  getArticles, 
  createArticle, 
  updateArticle, 
  generateSlug, 
  generateArticleWithAI, 
  translateArticleWithAI, 
  searchArticleMedia, 
  getPexelsApiKey, 
  setPexelsApiKey, 
  testPexelsApiKey, 
  MediaSearchResult, 
  MediaSearchDebugInfo, 
  RELIABLE_NEWS_SOURCES, 
  AiArticleGenerationResponse 
} from '../../services/newsService';
import { MediaDebuggerModal } from './MediaDebuggerModal';
import { VideoPreviewModal } from './VideoPreviewModal';
import { useI18n } from '../../contexts/I18nContext';
import { formatArticleContentToHtml, stripFormattingSymbols, analyzeArticleSeoAndAi } from '../../utils/textFormatter';
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
  Loader2,
  Search,
  Film,
  Play,
  ExternalLink,
  Eye,
  Globe,
  Camera,
  Bug,
  Activity,
  CheckSquare,
  Square,
  ShieldCheck,
  Star,
  Key,
  BookOpen,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  ArrowDown
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

function cleanAuthorRoleDisplay(role?: string): string {
  if (!role) return 'Cronista Ufficiale';
  const trimmed = role.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const roleMap: Record<number | string, string> = {
          1: 'Cittadino Sovrano',
          2: 'Ambasciatore di Pace',
          3: 'Custode Digitale',
          4: 'Cronista Ufficiale',
          5: 'Magistrato Costituzionale',
          6: 'Garante della Trasparenza',
          7: 'Delegato Territoriale',
          8: 'Membro dell\'Assemblea'
        };
        const roleNames = parsed
          .map((r: any) => {
            const id = r.roleId || r.ROLEID || r.id;
            return roleMap[id] || (typeof r === 'string' ? r : null);
          })
          .filter(Boolean);
        if (roleNames.length > 0) {
          return Array.from(new Set(roleNames)).join(' • ');
        }
      }
    } catch (_) {}
    return 'Cronista Ufficiale';
  }
  return trimmed;
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

  // Sources & References State
  const [sources, setSources] = useState<ArticleSourceReference[]>([]);
  const [referenceNotes, setReferenceNotes] = useState<string>('');
  const [photoCredits, setPhotoCredits] = useState<string>('');
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourcePublisher, setNewSourcePublisher] = useState('');
  const [newSourceNotes, setNewSourceNotes] = useState('');
  const [showAddSourceForm, setShowAddSourceForm] = useState(false);

  // AI Generator States
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('Giornalistico Solenne, Ufficiale ed Elegante');
  const [selectedSources, setSelectedSources] = useState<string[]>(
    RELIABLE_NEWS_SOURCES.filter(s => s.defaultSelected).map(s => s.name)
  );
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGenerationStage, setAiGenerationStage] = useState<number>(0);
  const [aiGeneratedPreview, setAiGeneratedPreview] = useState<AiArticleGenerationResponse | null>(null);
  const [showFullAiBodyPreview, setShowFullAiBodyPreview] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [showAiBox, setShowAiBox] = useState(true);

  const handleToggleSource = (sourceName: string) => {
    if (selectedSources.includes(sourceName)) {
      setSelectedSources(selectedSources.filter(s => s !== sourceName));
    } else {
      setSelectedSources([...selectedSources, sourceName]);
    }
  };

  const handleToggleAllSources = () => {
    if (selectedSources.length === RELIABLE_NEWS_SOURCES.length) {
      setSelectedSources([]);
    } else {
      setSelectedSources(RELIABLE_NEWS_SOURCES.map(s => s.name));
    }
  };

  const handleSetAsCoverImage = (indexToSet: number) => {
    if (indexToSet <= 0 || indexToSet >= images.length) return;
    setImages(prev => {
      const selected = prev[indexToSet];
      const remaining = prev.filter((_, i) => i !== indexToSet);
      return [selected, ...remaining];
    });
  };

  // Automatic Media Search States (Unsplash, Pexels, Pixabay, Wikimedia, Flickr, YouTube)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'unsplash' | 'pexels' | 'pixabay' | 'wikimedia' | 'flickr' | 'youtube'>('all');
  const [isSearchingMedia, setIsSearchingMedia] = useState(false);
  const [mediaSearchResults, setMediaSearchResults] = useState<MediaSearchResult[]>([]);
  const [mediaSearchError, setMediaSearchError] = useState<string | null>(null);
  const [previewMediaItem, setPreviewMediaItem] = useState<MediaSearchResult | null>(null);
  const [searchDebugInfo, setSearchDebugInfo] = useState<MediaSearchDebugInfo | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isDebuggerModalOpen, setIsDebuggerModalOpen] = useState(false);
  const [previewingVideo, setPreviewingVideo] = useState<{ url: string; title: string; sourceUrl?: string } | null>(null);

  // Pexels API Key Configuration States
  const [pexelsKey, setPexelsKey] = useState<string>('');
  const [showPexelsModal, setShowPexelsModal] = useState<boolean>(false);
  const [pexelsKeyInput, setPexelsKeyInput] = useState<string>('');
  const [isTestingPexelsKey, setIsTestingPexelsKey] = useState<boolean>(false);
  const [pexelsTestFeedback, setPexelsTestFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const savedKey = getPexelsApiKey();
    setPexelsKey(savedKey);
    setPexelsKeyInput(savedKey);
  }, []);

  const handleOpenPexelsModal = () => {
    const current = getPexelsApiKey();
    setPexelsKeyInput(current);
    setPexelsTestFeedback(null);
    setShowPexelsModal(true);
  };

  const handleTestPexelsKey = async () => {
    if (!pexelsKeyInput.trim()) {
      setPexelsTestFeedback({ success: false, message: 'Inserisci una chiave API prima di testare.' });
      return;
    }
    setIsTestingPexelsKey(true);
    setPexelsTestFeedback(null);
    try {
      const res = await testPexelsApiKey(pexelsKeyInput.trim());
      setPexelsTestFeedback(res);
    } catch (e: any) {
      setPexelsTestFeedback({ success: false, message: 'Errore durante la verifica: ' + e.message });
    } finally {
      setIsTestingPexelsKey(false);
    }
  };

  const handleSavePexelsKey = () => {
    const clean = pexelsKeyInput.trim();
    setPexelsApiKey(clean);
    setPexelsKey(clean);
    setShowPexelsModal(false);
  };

  const handleSearchMedia = async (overrideQuery?: string, overridePlatform?: string) => {
    const targetQ = (overrideQuery !== undefined ? overrideQuery : (searchQuery || title || aiTopic || '')).trim();
    const targetPlatform = overridePlatform || selectedPlatform;
    if (!targetQ) {
      setError(tText('Please specify a topic or title to search media.', 'Inserisci un argomento o un titolo per la ricerca automatica di foto e filmati.'));
      return;
    }
    
    // Pulisci rigorosamente i risultati della ricerca precedente e azzera gli errori
    setMediaSearchResults([]);
    setIsSearchingMedia(true);
    setMediaSearchError(null);
    setSearchQuery(targetQ);
    if (overridePlatform) setSelectedPlatform(overridePlatform as any);

    try {
      const { results, debug } = await searchArticleMedia(targetQ, targetPlatform);
      setMediaSearchResults(results || []);
      if (debug) setSearchDebugInfo(debug);
      if (!results || results.length === 0) {
        setMediaSearchError(tText(
          `No media found for "${targetQ}". Try different keywords or select "All Channels".`,
          `Nessun elemento multimediale trovato per "${targetQ}". Prova con altre parole chiave o seleziona "Tutti i Canali".`
        ));
      }
    } catch (err: any) {
      console.error('[MEDIA-SEARCH-ERR]', err);
      setMediaSearchError(err.message || tText('Failed to search media.', 'Errore durante la ricerca media.'));
    } finally {
      setIsSearchingMedia(false);
    }
  };

  const handleToggleDebugPanel = async () => {
    const nextShow = !showDebugPanel;
    setShowDebugPanel(nextShow);
    if (nextShow && (!searchDebugInfo || !searchDebugInfo.providers)) {
      const q = (searchQuery || title || aiTopic || (articleToEdit ? articleToEdit.title : '')).trim();
      if (q) {
        handleSearchMedia(q, selectedPlatform);
      }
    }
  };

  const handleAttachMediaItem = (item: MediaSearchResult) => {
    if (item.type === 'image') {
      if (!images.some(img => img.url === item.url)) {
        setImages(prev => [
          ...prev,
          {
            type: 'image',
            source: 'url',
            url: item.url,
            caption: item.title || `${item.sourcePlatform.toUpperCase()} - ${item.author || ''}`
          }
        ]);
      }
    } else {
      if (!videos.some(vid => vid.url === item.url)) {
        setVideos(prev => [
          ...prev,
          {
            type: 'video',
            source: 'url',
            url: item.url,
            caption: item.title || `Video ${item.sourcePlatform.toUpperCase()}`
          }
        ]);
      }
    }
  };

  const handleBatchImportTopMedia = () => {
    if (mediaSearchResults.length === 0) return;
    const topImages = mediaSearchResults.filter(m => m.type === 'image').slice(0, 3);
    const topVideos = mediaSearchResults.filter(m => m.type === 'video').slice(0, 1);

    topImages.forEach(img => handleAttachMediaItem(img));
    topVideos.forEach(vid => handleAttachMediaItem(vid));
  };

  const handleGenerateAIArticle = async () => {
    if (!aiTopic.trim()) {
      setError(tText('Please specify the topic or prompt for the article.', 'Inserisci l\'argomento o il tema dell\'articolo per la generazione AI.'));
      return;
    }
    setIsGeneratingAi(true);
    setAiGenerationStage(1);
    setError(null);
    setAiSuccessMessage(null);
    setAiGeneratedPreview(null);

    // Dynamic timer to advance progress stages with visual feedback
    const stageTimer = setInterval(() => {
      setAiGenerationStage(prev => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 2800);

    try {
      const selectedCat = categories.find(c => c.id === categoryId);
      const result = await generateArticleWithAI(
        aiTopic.trim(),
        selectedCat?.name,
        aiTone,
        selectedSources
      );

      clearInterval(stageTimer);
      setAiGenerationStage(5);

      if (!result || !result.title || !result.content) {
        throw new Error(tText('The AI generated an empty response. Please try again with a more detailed topic.', 'L\'Intelligenza Artificiale non ha restituito il testo dell\'articolo. Verifica l\'argomento inserito e riprova.'));
      }

      const cleanTitle = stripFormattingSymbols(result.title);
      setTitle(cleanTitle);
      setSlug(generateSlug(cleanTitle));
      setIsSlugCustom(false);

      if (result.intro) {
        setIntro(stripFormattingSymbols(result.intro));
      }
      if (result.content) {
        setContent(formatArticleContentToHtml(result.content));
      }
      if (result.tags && result.tags.length > 0) {
        setTags(result.tags.map(t => stripFormattingSymbols(t)));
      }
      if (result.suggestedCategory) {
        const matchingCat = categories.find(c => 
          c.name.toLowerCase().includes(result.suggestedCategory!.toLowerCase()) ||
          result.suggestedCategory!.toLowerCase().includes(c.name.toLowerCase())
        );
        if (matchingCat) {
          setCategoryId(matchingCat.id);
        }
      }

      // Populate sources, reference notes & photo credits
      if (result.sources && Array.isArray(result.sources) && result.sources.length > 0) {
        setSources(result.sources);
      }
      if (result.referenceNotes) {
        setReferenceNotes(result.referenceNotes);
      }
      if (result.photoCredits) {
        setPhotoCredits(result.photoCredits);
      }

      // Set immediate visual preview
      setAiGeneratedPreview(result);
      setAiSuccessMessage(tText('Article and verified source cards generated successfully! Immediate preview available below.', 'Articolo e fonti verificate generati con successo! Anteprima immediata disponibile di seguito.'));

      // Trigger automatic media search and attach top matches automatically
      try {
        const queryForMedia = aiTopic.trim() || result.title;
        setSearchQuery(queryForMedia);
        const { results: mediaResults, debug: mediaDebug } = await searchArticleMedia(queryForMedia, 'all');
        setMediaSearchResults(mediaResults || []);
        if (mediaDebug) setSearchDebugInfo(mediaDebug);

        // Auto-attach top 2 photos & top 1 video
        const topImages = (mediaResults || []).filter(m => m.type === 'image').slice(0, 2);
        const topVideo = (mediaResults || []).filter(m => m.type === 'video').slice(0, 1);

        topImages.forEach(img => {
          setImages(prev => {
            if (!prev.some(i => i.url === img.url)) {
              return [...prev, {
                type: 'image',
                source: 'url',
                url: img.url,
                caption: img.title
              }];
            }
            return prev;
          });
        });

        topVideo.forEach(vid => {
          setVideos(prev => {
            if (!prev.some(v => v.url === vid.url)) {
              return [...prev, {
                type: 'video',
                source: 'url',
                url: vid.url,
                caption: vid.title
              }];
            }
            return prev;
          });
        });

      } catch (mErr) {
        console.warn('Auto media search warning:', mErr);
      }

    } catch (err: any) {
      clearInterval(stageTimer);
      setError(err.message || tText('Failed to generate article with AI.', 'Impossibile generare l\'articolo con l\'AI.'));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddCustomSource = () => {
    if (!newSourceTitle.trim()) {
      setError(tText('Please provide a title for the source.', 'Inserisci un titolo per la fonte da aggiungere.'));
      return;
    }
    let domain = '';
    if (newSourceUrl.trim()) {
      try {
        const u = new URL(newSourceUrl.trim());
        domain = u.hostname.replace(/^www\./, '');
      } catch (e) {}
    }

    const newSource: ArticleSourceReference = {
      title: newSourceTitle.trim(),
      url: newSourceUrl.trim() || undefined,
      publisher: newSourcePublisher.trim() || (domain ? domain.toUpperCase() : 'Fonte Verificata'),
      notes: newSourceNotes.trim() || undefined,
      date: new Date().getFullYear().toString()
    };

    setSources(prev => [...prev, newSource]);
    setNewSourceTitle('');
    setNewSourceUrl('');
    setNewSourcePublisher('');
    setNewSourceNotes('');
    setShowAddSourceForm(false);
    setError(null);
  };

  const handleRemoveSource = (indexToRemove: number) => {
    setSources(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCopyAiDraft = () => {
    if (!aiGeneratedPreview) return;
    const cleanContent = aiGeneratedPreview.content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    const sourcesSummary = (sources || [])
      .map((s, i) => `[${i + 1}] ${s.title} (${s.publisher || 'Web'})${s.url ? ' - ' + s.url : ''}`)
      .join('\n');

    const fullText = `TITOLO: ${title}\n\nSOMMARIO:\n${intro}\n\nTESTO:\n${cleanContent}\n\nFONTI CONSULTATE:\n${sourcesSummary}`;
    navigator.clipboard.writeText(fullText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  const handleScrollToEditor = () => {
    const el = document.getElementById('article-editor-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOptimizeSeoAndAi = () => {
    setTitle(prev => stripFormattingSymbols(prev));
    setIntro(prev => stripFormattingSymbols(prev));
    setContent(prev => formatArticleContentToHtml(prev));
    setTags(prev => prev.map(t => stripFormattingSymbols(t)));
    setAiSuccessMessage(tText('Article cleaned from symbol artifacts and formatted for optimal SEO & AI readability!', 'Articolo ripulito da simboli di formattazione e organizzato con layout chiaro, leggero e leggibile ottimizzato SEO & IA!'));
  };

  useEffect(() => {
    if (isOpen) {
      const cats = getCategories();
      setCategories(cats);
      const arts = getArticles().filter(a => articleToEdit ? a.id !== articleToEdit.id : true);
      setAllArticles(arts);

      // Reset AI states
      setAiTopic('');
      setAiSuccessMessage(null);
      setShowAiBox(true);
      setAiGeneratedPreview(null);
      setAiGenerationStage(0);

      if (articleToEdit) {
        setTitle(articleToEdit.title);
        setSearchQuery(articleToEdit.title);
        setSlug(articleToEdit.slug);
        setIsSlugCustom(true);
        setCategoryId(articleToEdit.categoryId);
        setIntro(articleToEdit.intro);
        setContent(articleToEdit.content);
        setImages(articleToEdit.images || []);
        setVideos(articleToEdit.videos || []);
        setTags(articleToEdit.tags || []);
        setRelatedIds(articleToEdit.relatedArticleIds || []);
        
        // Load sources and references
        const initialSources: ArticleSourceReference[] = (articleToEdit.sources || []).map(s => {
          if (typeof s === 'string') {
            return {
              title: s,
              url: s.startsWith('http') ? s : undefined,
              publisher: 'Fonte Ufficiale'
            };
          }
          return s;
        });
        setSources(initialSources);
        setReferenceNotes(articleToEdit.referenceNotes || '');
        setPhotoCredits(articleToEdit.photoCredits || '');
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
        setSources([]);
        setReferenceNotes('');
        setPhotoCredits('');
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
  const handleSubmit = (action: 'draft' | 'moderation' | 'publish' | 'save' | boolean) => {
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

    let targetStatus: ArticleStatus = 'in_moderazione';
    if (action === true || action === 'moderation') {
      targetStatus = 'in_moderazione';
    } else if (action === 'publish') {
      targetStatus = 'pubblicato';
    } else if (action === 'save' && articleToEdit) {
      targetStatus = articleToEdit.status;
    } else if (action === 'draft' || action === false) {
      targetStatus = 'bozza';
    }

    let finalArticleId = '';
    let finalTitle = title.trim();
    let finalIntro = intro.trim();
    let finalContent = content.trim();
    let finalTags = tags;

    if (articleToEdit) {
      finalArticleId = articleToEdit.id;
      updateArticle(articleToEdit.id, {
        title: finalTitle,
        slug: slug.trim() || generateSlug(title),
        categoryId,
        intro: finalIntro,
        content: finalContent,
        images,
        videos,
        tags: finalTags,
        relatedArticleIds: relatedIds,
        sources,
        referenceNotes: referenceNotes.trim() || undefined,
        photoCredits: photoCredits.trim() || undefined,
        status: targetStatus,
        publishedAt: targetStatus === 'pubblicato' ? (articleToEdit.publishedAt || new Date().toISOString()) : articleToEdit.publishedAt,
        authorId: articleToEdit.authorId || authorId,
        authorName: articleToEdit.authorName || authorName,
        authorRole: articleToEdit.authorRole || authorRole
      });
    } else {
      const created = createArticle({
        title: finalTitle,
        slug: slug.trim() || generateSlug(title),
        categoryId,
        intro: finalIntro,
        content: finalContent,
        images,
        videos,
        tags: finalTags,
        relatedArticleIds: relatedIds,
        sources,
        referenceNotes: referenceNotes.trim() || undefined,
        photoCredits: photoCredits.trim() || undefined,
        authorId,
        authorName,
        authorRole,
        submitForModeration: targetStatus === 'in_moderazione',
        status: targetStatus,
        publishedAt: targetStatus === 'pubblicato' ? new Date().toISOString() : undefined
      });
      finalArticleId = created.id;
    }

    if (targetStatus === 'pubblicato') {
      setTimeout(async () => {
        try {
          const translations = await translateArticleWithAI({
            id: finalArticleId,
            title: finalTitle,
            intro: finalIntro,
            content: finalContent,
            tags: finalTags
          });
          updateArticle(finalArticleId, { translations });
        } catch (e) {
          console.warn('[Auto-Translate] failed', e);
        }
      }, 500);
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
                {tText('Author', 'Autore')}: <span className="text-brand-gold font-bold">{authorName}</span> ({cleanAuthorRoleDisplay(authorRole)})
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

          {/* AI Article Generation Engine Box */}
          <div className="bg-gradient-to-r from-[#0a1c3e] to-[#16326c] text-white rounded-2xl p-5 border border-[#c5a880]/50 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-brand-gold/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-gold/20 text-brand-gold border border-brand-gold/40 shadow-inner">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-brand-gold flex items-center gap-2">
                    <span>{tText('AI Editorial Assistant', 'Redazione Assistita con IA Motore Sovrano')}</span>
                    <span className="text-[9px] font-tech uppercase tracking-widest bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded-full border border-brand-gold/30">
                      Gemini 3.6
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    {tText('Enter an article subject or topic to generate a full professional news draft automatically.', 'Inserisci l\'argomento o il tema per generare automaticamente la bozza dell\'articolo con il motore AI.')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiBox(!showAiBox)}
                className="text-xs text-brand-gold font-bold hover:underline cursor-pointer shrink-0 ml-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15"
              >
                {showAiBox ? tText('Collapse', 'Riduci Motore AI') : tText('Expand AI Engine', 'Espandi Motore AI')}
              </button>
            </div>

            {showAiBox && (
              <div className="space-y-3 relative z-10 mt-4 pt-3 border-t border-white/15 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-brand-gold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>{tText('Article Topic / Prompt', 'Argomento / Tema dell\'Articolo')} *</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {tText('Provide key facts, topic, or press release details', 'Fornisci dettagli, fatti chiave o bozza di comunicato')}
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder={tText('e.g. Inauguration of the sovereign digital business registry with tax relief for community members and open audit systems...', 'es. Apertura delle iscrizioni al nuovo registro delle imprese digitali con incentivi per la sostenibilità e controlli trasparenti...')}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-gold outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Trustworthy News Sources Checkboxes Box */}
                <div className="bg-white/10 border border-white/20 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">
                        {tText('Trustworthy & Accredited Information Sources', 'Fonti Informative Accreditate & Affidabili')}
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                        {selectedSources.length}/{RELIABLE_NEWS_SOURCES.length} {tText('Active', 'Attive')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleAllSources}
                      className="text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1.5 cursor-pointer bg-white/10 px-2.5 py-1 rounded-lg border border-amber-300/30 transition self-start sm:self-auto"
                    >
                      {selectedSources.length === RELIABLE_NEWS_SOURCES.length ? (
                        <>
                          <Square className="w-3.5 h-3.5 text-amber-300" />
                          <span>{tText('Deselect All Sources', 'Deseleziona Tutte')}</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3.5 h-3.5 text-amber-300" />
                          <span>{tText('Select All Sources', 'Seleziona Tutte')}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-normal">
                    {tText('Select which accredited media agencies, Vatican press offices, and sovereign press organs the AI will analyze to draft the article with accuracy and diplomatic rigor.', 'Seleziona le fonti e le agenzie di stampa accreditate (es. Fonti Vaticane, Reuters, AP, ANSA, AFP, etc.) da cui l\'IA attingerà per elaborare l\'articolo con il massimo rigore informativo.')}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                    {RELIABLE_NEWS_SOURCES.map((source) => {
                      const isSelected = selectedSources.includes(source.name);
                      return (
                        <label
                          key={source.id}
                          onClick={() => handleToggleSource(source.name)}
                          className={`group flex items-start gap-2.5 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                            isSelected
                              ? 'bg-amber-400/20 border-amber-300/80 text-white shadow-sm'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                          }`}
                        >
                          <div className="pt-0.5 shrink-0">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-300" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-white group-hover:text-amber-200 leading-tight">
                              {source.name}
                            </p>
                            <p className="text-[9px] font-mono text-amber-300/90 leading-tight">
                              {source.code}
                            </p>
                            <p className="text-[9px] text-slate-300/80 line-clamp-2 leading-tight font-sans">
                              {source.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      {tText('Editorial Style & Tone', 'Stile & Tono Giornalistico')}
                    </label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full bg-[#0a1c3e] border border-white/20 text-xs text-white rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-brand-gold cursor-pointer"
                    >
                      <option value="Giornalistico Solenne, Ufficiale ed Elegante">Giornalistico Solenne & Ufficiale</option>
                      <option value="Divulgativo, Semplice e Comprensibile">Divulgativo & Chiara Lettura</option>
                      <option value="Inchiesta e Analisi Approfondita">Analisi Politica & Inchiesta</option>
                      <option value="Comunicato Stampa Istituzionale">Comunicato Stampa Istituzionale</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={isGeneratingAi || !aiTopic.trim()}
                    onClick={handleGenerateAIArticle}
                    className="mt-auto px-5 py-2.5 rounded-xl bg-brand-gold text-[#0a1c3e] font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-[#0a1c3e] transition cursor-pointer flex items-center justify-center gap-2 shadow-lg border border-brand-gold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#0a1c3e]" />
                        <span>{tText('Generating Article...', 'Generazione in Corso...')}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#0a1c3e]" />
                        <span>{tText('Generate Article with AI', 'Genera Articolo con IA')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* VISUAL PIPELINE PROGRESS TRACKER (When Generating) */}
                {isGeneratingAi && (
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-[#0c234b] to-[#122b5d] border border-brand-gold/50 shadow-xl space-y-3.5 animate-fade-in">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 font-bold text-amber-200">
                        <Loader2 className="w-4 h-4 animate-spin text-brand-gold shrink-0" />
                        <span>
                          {aiGenerationStage === 1 && tText('Phase 1/5: Editorial Planning & Focus Setting...', 'Fase 1/5: Pianificazione editoriale e analisi dell\'argomento...')}
                          {aiGenerationStage === 2 && tText('Phase 2/5: Real-Time Web Search & Fact Retrieval...', 'Fase 2/5: Ricerca web in tempo reale (Google Search Grounding)...')}
                          {aiGenerationStage === 3 && tText('Phase 3/5: Fact-Checking & Exact Sources Verification...', 'Fase 3/5: Fact-checking ed estrazione dei link alle fonti esatte...')}
                          {aiGenerationStage === 4 && tText('Phase 4/5: Drafting Article Body with NWS Standards...', 'Fase 4/5: Stesura corpo articolo e formattazione semantica...')}
                          {aiGenerationStage >= 5 && tText('Phase 5/5: Finalizing Article & Attaching Media...', 'Fase 5/5: Finalizzazione articolo e collegamento multimediale...')}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-amber-300 font-bold px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-300/30">
                        {aiGenerationStage === 1 ? '20%' : aiGenerationStage === 2 ? '45%' : aiGenerationStage === 3 ? '70%' : aiGenerationStage === 4 ? '90%' : '100%'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 via-brand-gold to-yellow-200 rounded-full transition-all duration-700 ease-out shadow-sm"
                        style={{ 
                          width: `${aiGenerationStage === 1 ? 20 : aiGenerationStage === 2 ? 45 : aiGenerationStage === 3 ? 70 : aiGenerationStage === 4 ? 90 : 100}%` 
                        }}
                      />
                    </div>

                    {/* Stage Steps */}
                    <div className="grid grid-cols-5 gap-1.5 pt-1 text-[10px]">
                      {[
                        { num: 1, label: 'Argomento' },
                        { num: 2, label: 'Ricerca Web' },
                        { num: 3, label: 'Fonti Esatte' },
                        { num: 4, label: 'Redazione' },
                        { num: 5, label: 'Media' }
                      ].map((step) => {
                        const isDone = aiGenerationStage > step.num;
                        const isCurrent = aiGenerationStage === step.num;
                        return (
                          <div 
                            key={step.num}
                            className={`p-1.5 rounded-lg border text-center transition-all ${
                              isDone 
                                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200' 
                                : isCurrent 
                                  ? 'bg-amber-400/20 border-amber-300 text-amber-200 font-bold ring-1 ring-amber-300/60 animate-pulse'
                                  : 'bg-white/5 border-white/10 text-slate-400'
                            }`}
                          >
                            <div className="font-mono text-[9px] mb-0.5">{isDone ? '✓' : step.num}</div>
                            <div className="truncate">{step.label}</div>
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-slate-300/90 italic leading-snug">
                      {tText(
                        'Live web grounding in progress. Consulting authoritative news wires to guarantee factual accuracy and verified link extraction.',
                        'Ricerca web e fact-checking in tempo reale in corso. La redazione consulta le agenzie accreditate per garantire dati verificati, assenza di allucinazioni e link reali.'
                      )}
                    </p>
                  </div>
                )}

                {aiSuccessMessage && !isGeneratingAi && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="font-medium">{aiSuccessMessage}</span>
                  </div>
                )}

                {/* IMMEDIATE PREVIEW & SUMMARY CARD */}
                {aiGeneratedPreview && !isGeneratingAi && (
                  <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0a1c3e] to-[#0f244a] border-2 border-brand-gold/60 shadow-2xl space-y-4 animate-fade-in text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-400/20 text-brand-gold border border-brand-gold/40">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-sm text-brand-gold uppercase tracking-wider flex items-center gap-2">
                            <span>{tText('Immediate AI Generation Preview', 'Anteprima Immediata Bozza Generata dall\'IA')}</span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/40 font-sans font-bold">
                              Verificato
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-300">
                            {tText('Content and authentic source links ready for review.', 'Bozza editoriale e collegamenti esatti alle fonti verificati e pronti.')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleScrollToEditor}
                          className="px-3 py-1.5 rounded-lg bg-brand-gold hover:bg-white text-[#0a1c3e] font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                          <span>{tText('Edit in Fields Below', 'Modifica nei Campi')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyAiDraft}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-white/20"
                        >
                          {copyFeedback ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">{tText('Copied!', 'Copiato!')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{tText('Copy Draft', 'Copia Tutto')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Stats bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Categoria</span>
                        <span className="font-semibold text-amber-200 truncate block">
                          {aiGeneratedPreview.suggestedCategory || 'Attualità'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Parole Stimate</span>
                        <span className="font-mono text-emerald-300 font-bold">
                          ~{aiGeneratedPreview.content.replace(/<[^>]*>?/gm, ' ').split(/\s+/).filter(Boolean).length} parole
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Tempo Lettura</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          ~{Math.max(1, Math.round(aiGeneratedPreview.content.replace(/<[^>]*>?/gm, ' ').split(/\s+/).filter(Boolean).length / 200))} min
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Fonti Consultate</span>
                        <span className="font-mono text-amber-300 font-bold">
                          {sources.length} fonti con link
                        </span>
                      </div>
                    </div>

                    {/* Generated Title & Intro Display */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-brand-gold">
                          Titolo Generato:
                        </span>
                        <h3 className="font-serif text-lg md:text-xl font-bold text-white mt-0.5 leading-snug">
                          {title}
                        </h3>
                      </div>
                      {intro && (
                        <div className="pt-2 border-t border-white/10">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            Sommario / Abstract:
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed mt-0.5 font-sans">
                            {intro}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* EXACT VERIFIED SOURCES CARDS LIST */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-brand-gold" />
                          <h5 className="font-serif text-xs font-bold text-amber-200 uppercase tracking-wider">
                            {tText('Exact Consulted Sources & Web Page Links', 'Elenco Esatto Link e Fonti Consultate')}
                          </h5>
                          <span className="text-[10px] bg-brand-gold/20 text-brand-gold font-mono px-2 py-0.5 rounded-full border border-brand-gold/30">
                            {sources.length} pagine estratte
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 italic">
                          Schede con link diretto alla pagina di riferimento
                        </span>
                      </div>

                      {sources.length === 0 ? (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 italic text-center">
                          Nessuna fonte esterna rilevata.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5">
                          {sources.map((src, sIdx) => {
                            let domain = (src as any).domain || '';
                            if (!domain && src.url) {
                              try {
                                const u = new URL(src.url);
                                domain = u.hostname.replace(/^www\./, '');
                              } catch (e) {}
                            }

                            return (
                              <div
                                key={sIdx}
                                className="bg-white/10 hover:bg-white/15 border border-white/15 hover:border-brand-gold/60 rounded-xl p-3.5 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm group"
                              >
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-brand-gold font-mono font-bold text-xs">
                                      [{sIdx + 1}]
                                    </span>
                                    <span className="font-bold text-white text-xs md:text-sm group-hover:text-amber-200 transition">
                                      {src.title}
                                    </span>
                                    {domain && (
                                      <span className="inline-flex items-center gap-1 bg-[#0a1c3e] text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-md border border-amber-400/30">
                                        <Globe className="w-2.5 h-2.5 text-amber-300" />
                                        <span>{domain}</span>
                                      </span>
                                    )}
                                    {src.publisher && (
                                      <span className="bg-slate-800 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-700">
                                        {src.publisher}
                                      </span>
                                    )}
                                    {src.date && (
                                      <span className="text-slate-400 text-[10px] font-mono">
                                        ({src.date})
                                      </span>
                                    )}
                                  </div>
                                  {src.notes && (
                                    <p className="text-[11px] text-slate-300 italic leading-snug">
                                      {src.notes}
                                    </p>
                                  )}
                                  {src.url && (
                                    <p className="text-[10px] font-mono text-slate-400 truncate max-w-xl">
                                      URL: {src.url}
                                    </p>
                                  )}
                                </div>

                                {src.url ? (
                                  <a
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="self-start md:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-gold hover:bg-white text-[#0a1c3e] font-bold text-xs uppercase tracking-wider transition shrink-0 shadow-sm"
                                  >
                                    <span>Apri Pagina ↗</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic self-start md:self-center">
                                    Archivio Interno
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Collapsible Body Preview */}
                    <div className="pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowFullAiBodyPreview(!showFullAiBodyPreview)}
                        className="text-xs text-brand-gold font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showFullAiBodyPreview ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Nascondi Testo Esteso</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Mostra Anteprima Testo Esteso dell'Articolo</span>
                          </>
                        )}
                      </button>

                      {showFullAiBodyPreview && (
                        <div className="mt-3 p-4 rounded-xl bg-black/30 border border-white/10 max-h-72 overflow-y-auto text-xs text-slate-200 leading-relaxed font-sans space-y-2">
                          <div dangerouslySetInnerHTML={{ __html: content }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
                <span className="text-xs font-mono text-slate-400 select-none shrink-0">
                  /?notizia=
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
              maxHeight="240px"
            />
          </div>

          {/* Testo Esteso (Full Content) */}
          <div id="article-editor-section">
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
              minHeight="260px"
              maxHeight="480px"
            />
          </div>

          {/* SEO & AI OPTIMIZATION PANEL */}
          {(() => {
            const seo = analyzeArticleSeoAndAi(title, intro, content, tags);
            return (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>SEO & AI Score: {seo.score}/100</span>
                    </div>
                    <span className="text-xs font-medium text-slate-600">({seo.label})</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleOptimizeSeoAndAi}
                    className="px-4 py-2 rounded-xl bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{tText('✨ Optimize SEO & Clean Symbols', '✨ Ottimizza SEO & Pulisci Simboli')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-600 pt-1 border-t border-slate-200">
                  <div><strong>Parole:</strong> {seo.wordCount}</div>
                  <div><strong>Tempo lettura:</strong> ~{seo.readingTimeMinutes} min</div>
                  <div><strong>Titolo:</strong> {seo.titleCharCount} car.</div>
                  <div><strong>Intro:</strong> {seo.introCharCount} car.</div>
                </div>

                {seo.suggestions.length > 0 && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-amber-900">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Consigli per l'ottimizzazione SEO & AI:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-800 font-sans">
                      {seo.suggestions.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}

          {/* DEDICATED SOURCES & FACT-CHECKING SECTION */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-[#0a1c3e] border border-blue-200">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#0a1c3e] uppercase tracking-wider flex items-center gap-2">
                    <span>{tText('Consulted Sources & Verifications', 'Fonti Consultate & Collegamenti Ipertestuali')}</span>
                    <span className="text-[10px] bg-brand-gold/20 text-[#0a1c3e] px-2 py-0.5 rounded-full font-mono font-bold border border-brand-gold/40">
                      {sources.length} fonti
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {tText('Exact URLs and news agencies consulted to guarantee truthfulness and absence of hallucinations.', 'Elenco esatto dei link e dei report consultati per garantire trasparenza fattuale e assenza di allucinazioni.')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddSourceForm(!showAddSourceForm)}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddSourceForm ? tText('Close Form', 'Chiudi') : tText('Add Custom Source', 'Aggiungi Fonte Manuale')}</span>
              </button>
            </div>

            {/* Form per nuova fonte manuale */}
            {showAddSourceForm && (
              <div className="p-4 rounded-xl bg-white border border-brand-gold/50 shadow-sm space-y-3 animate-fade-in">
                <h4 className="text-xs font-bold text-[#0a1c3e] uppercase tracking-wider">
                  {tText('Add New Reference Source', 'Aggiungi Nuova Fonte di Riferimento')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {tText('Article or Document Title', 'Titolo della Notizia / Report')} *
                    </label>
                    <input
                      type="text"
                      value={newSourceTitle}
                      onChange={(e) => setNewSourceTitle(e.target.value)}
                      placeholder="es. Bollettino Ufficiale sulle Negoziazioni di Pace"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#0a1c3e] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {tText('Exact Web Page Link (URL)', 'Link Esatto alla Pagina (URL)')}
                    </label>
                    <input
                      type="url"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="https://www.reuters.com/world/..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:ring-1 focus:ring-[#0a1c3e] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {tText('Publisher / News Agency', 'Testata / Agenzia')}
                    </label>
                    <input
                      type="text"
                      value={newSourcePublisher}
                      onChange={(e) => setNewSourcePublisher(e.target.value)}
                      placeholder="es. Reuters, ANSA, Vatican News"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#0a1c3e] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {tText('Extracted Facts / Notes', 'Evidenze Estratte / Note')}
                    </label>
                    <input
                      type="text"
                      value={newSourceNotes}
                      onChange={(e) => setNewSourceNotes(e.target.value)}
                      placeholder="es. Dati statistici ed estratti documentali accertati"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#0a1c3e] outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddSourceForm(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomSource}
                    className="px-4 py-1.5 rounded-lg bg-[#0a1c3e] hover:bg-brand-gold text-white hover:text-[#0a1c3e] text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Salva Fonte
                  </button>
                </div>
              </div>
            )}

            {/* Lista delle schede delle fonti */}
            {sources.length === 0 ? (
              <div className="p-4 rounded-xl bg-white border border-dashed border-slate-300 text-center text-xs text-slate-500">
                <BookOpen className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                <p>Nessuna fonte ancora associata all'articolo.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Usa il generatore IA in alto per estrarle in automatico con ricerca web, oppure aggiungine una manualmente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {sources.map((src, idx) => {
                  let domain = (src as any).domain || '';
                  if (!domain && src.url) {
                    try {
                      const u = new URL(src.url);
                      domain = u.hostname.replace(/^www\./, '');
                    } catch (e) {}
                  }

                  return (
                    <div
                      key={idx}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-brand-gold/60 transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#0a1c3e] text-xs md:text-sm">
                            [{idx + 1}] {src.title}
                          </span>
                          {domain && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0a1c3e] text-[10px] font-mono px-2 py-0.5 rounded-md border border-blue-200">
                              <Globe className="w-2.5 h-2.5 text-blue-600" />
                              <span>{domain}</span>
                            </span>
                          )}
                          {src.publisher && (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                              {src.publisher}
                            </span>
                          )}
                          {src.date && (
                            <span className="text-slate-400 text-[11px] font-mono">
                              ({src.date})
                            </span>
                          )}
                        </div>
                        {src.notes && (
                          <p className="text-slate-600 text-[11px] italic leading-snug">
                            {src.notes}
                          </p>
                        )}
                        {src.url && (
                          <p className="text-[10px] font-mono text-slate-400 truncate max-w-xl">
                            URL: {src.url}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#0a1c3e] hover:bg-brand-gold hover:text-[#0a1c3e] font-bold text-[11px] border border-blue-200/80 transition"
                          >
                            <span>Consulta Fonte</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveSource(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                          title="Rimuovi Fonte"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Note Redazionali e Crediti Fotografici */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-bold text-[#0a1c3e] mb-1 uppercase tracking-wider">
                  {tText('Editorial Reference Note (Footer)', 'Nota Redazionale di Riferimento (in calce)')}
                </label>
                <textarea
                  value={referenceNotes}
                  onChange={(e) => setReferenceNotes(e.target.value)}
                  placeholder="es. Articolo redatto e verificato attraverso le agenzie di stampa accreditate internazionali..."
                  rows={2}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#0a1c3e] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0a1c3e] mb-1 uppercase tracking-wider">
                  {tText('General Photographic & Visual Credits', 'Crediti Fotografici & Iconografici')}
                </label>
                <input
                  type="text"
                  value={photoCredits}
                  onChange={(e) => setPhotoCredits(e.target.value)}
                  placeholder="es. Foto: Archivio Documentale New World State / Licenza Editoriale Libera"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#0a1c3e] outline-none mt-1"
                />
              </div>
            </div>
          </div>

          {isUploadingMedia && (
            <div className="p-3 bg-brand-gold/10 border border-brand-gold/30 rounded-2xl flex items-center gap-3 text-xs text-[#0a1c3e] font-bold animate-pulse">
              <Loader2 className="w-4 h-4 text-brand-gold animate-spin" />
              <span>{tText('Uploading media file to Aruba Web Space...', 'Caricamento file nello spazio web Aruba in corso...')}</span>
            </div>
          )}

          {/* AUTOMATIC MEDIA SEARCH BOX (Unsplash, Pexels, Pixabay, YouTube) */}
          <div className="bg-gradient-to-r from-slate-900 via-[#0a1c3e] to-slate-900 text-white rounded-2xl p-5 border border-[#c5a880]/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Search className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-brand-gold flex items-center gap-2">
                    <span>{tText('Automatic Media Search', 'Ricerca Automatica Foto & Filmati')}</span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-mono border border-amber-400/30">
                      Unsplash • Pexels • Pixabay • YouTube
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    {tText('Automatically find high-resolution photos and video clips relevant to your news article subject.', 'Cerca automaticamente foto ad alta risoluzione e filmati video pertinenti all\'argomento del tuo articolo.')}
                  </p>
                </div>
              </div>

              {mediaSearchResults.length > 0 && (
                <button
                  type="button"
                  onClick={handleBatchImportTopMedia}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 text-[#0a1c3e] font-extrabold text-xs uppercase tracking-wider hover:bg-white transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-[#0a1c3e]" />
                  <span>{tText('Import Top 4 Media', 'Importa i Migliori 4 Media')}</span>
                </button>
              )}
            </div>

            {/* Search Control Bar */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchMedia();
                      }
                    }}
                    placeholder={tText('Search photos or videos by subject (e.g. Geopolitics, Economy, Space, Rights...)', 'Cerca foto o video per argomento (es. Geopolitica, Economia, Spazio, Diritti...)')}
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-24 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                  {(title || aiTopic) && (
                    <button
                      type="button"
                      onClick={() => {
                        const q = title || aiTopic;
                        setSearchQuery(q);
                        handleSearchMedia(q);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-300 hover:text-white bg-white/10 px-2 py-1 rounded-lg border border-amber-300/30 transition cursor-pointer"
                    >
                      {tText('Use Title', 'Usa Titolo')}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isSearchingMedia}
                  onClick={() => handleSearchMedia()}
                  className="px-5 py-2.5 bg-brand-gold text-[#0a1c3e] font-extrabold text-xs uppercase tracking-wider hover:bg-white rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border border-brand-gold shrink-0 disabled:opacity-50"
                >
                  {isSearchingMedia ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#0a1c3e]" />
                      <span>{tText('Searching...', 'Ricerca in corso...')}</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>{tText('Search Media', 'Cerca Media')}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Platform Filters */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                    {tText('Source Filter:', 'Filtra Fonte:')}
                  </span>
                  {[
                    { id: 'all', label: tText('All Channels', 'Tutti i Canali'), icon: Globe },
                    { id: 'unsplash', label: 'Unsplash', icon: ImageIcon },
                    { id: 'pexels', label: 'Pexels', icon: ImageIcon },
                    { id: 'pixabay', label: 'Pixabay', icon: ImageIcon },
                    { id: 'wikimedia', label: 'Wikimedia', icon: Globe },
                    { id: 'flickr', label: 'Flickr', icon: Camera },
                    { id: 'youtube', label: 'YouTube', icon: Film }
                  ].map((p) => {
                    const Icon = p.icon;
                    const isActive = selectedPlatform === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlatform(p.id as any);
                          if (searchQuery || title || aiTopic) {
                            handleSearchMedia(undefined, p.id);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                          isActive
                            ? 'bg-amber-400 text-[#0a1c3e] border-amber-300 font-extrabold shadow'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/15'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Debug Panel & Pexels Config Toggle Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenPexelsModal}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer border ${
                      pexelsKey
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-sm'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/40'
                    }`}
                    title="Configura la tua chiave API personale di Pexels per l'accesso diretto a foto HD"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{pexelsKey ? '🔑 Pexels API: Attiva' : '⚙️ Configura Chiave Pexels'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDebuggerModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-sky-500 hover:bg-sky-400 text-white border border-sky-300 shadow transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bug className="w-3.5 h-3.5 text-white animate-pulse" />
                    <span>🛠️ Open Media Debugger Console</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleDebugPanel}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer border ${
                      showDebugPanel
                        ? 'bg-slate-700 text-sky-200 border-sky-400'
                        : 'bg-slate-800/80 text-sky-300 border-sky-500/30 hover:bg-slate-700'
                    }`}
                  >
                    <span>{showDebugPanel ? 'In-page Log ▲' : 'In-page Log ▼'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Diagnostic Debug Panel */}
            {showDebugPanel && (
              <div className="p-3.5 bg-slate-900/95 border border-sky-500/40 rounded-xl space-y-3 text-xs shadow-xl animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between border-b border-sky-500/20 pb-2.5 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-bold text-sky-200 text-sm">
                      Console di Diagnostica & Monitoraggio API Media
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const q = (searchQuery || title || aiTopic || (articleToEdit ? articleToEdit.title : '')).trim();
                        if (q) handleSearchMedia(q, selectedPlatform);
                      }}
                      disabled={isSearchingMedia}
                      className="px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold flex items-center gap-1 transition shadow cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSearchingMedia ? 'animate-spin' : ''}`} />
                      <span>{isSearchingMedia ? 'Test in corso...' : 'Esegui Test Diagnostico'}</span>
                    </button>
                  </div>
                </div>

                {searchDebugInfo && searchDebugInfo.providers ? (
                  <div className="space-y-2.5">
                    {/* Header Summary Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                      <span className="text-slate-400">
                        Argomento Cercato: <strong className="text-amber-300">"{searchDebugInfo.query}"</strong>
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">
                        Filtro Canale: <strong className="text-sky-300">{searchDebugInfo.platform.toUpperCase()}</strong>
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">
                        Latenza Totale: <strong className="text-emerald-300">{searchDebugInfo.totalTimeMs || 0}ms</strong>
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">
                        Risultati Restituiti: <strong className="text-purple-300">{searchDebugInfo.totalResultsCount || mediaSearchResults.length}</strong>
                      </span>
                    </div>

                    {/* Providers Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {searchDebugInfo.providers.map((p, idx) => {
                        const isOk = p.status.includes('200') || p.status.toLowerCase().includes('ok');
                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg border text-[11px] flex flex-col justify-between space-y-1.5 ${
                              isOk
                                ? 'bg-slate-800/70 border-emerald-500/30 text-emerald-100'
                                : 'bg-red-950/40 border-red-500/40 text-red-200'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-white text-[12px]">{p.name}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                                  isOk ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'
                                }`}
                              >
                                {p.status}
                              </span>
                            </div>

                            {p.endpoint && (
                              <div className="text-[9px] font-mono text-slate-400 bg-black/40 px-1.5 py-0.5 rounded truncate">
                                GET {p.endpoint}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-300 pt-0.5">
                              <span>Elementi Trovati: <strong className="text-amber-300">{p.count}</strong></span>
                              <span>Latenza API: <strong className="text-sky-300">{p.latencyMs}ms</strong></span>
                            </div>

                            {p.details && (
                              <p className="text-[9.5px] text-slate-300 line-clamp-2 italic bg-slate-900/50 p-1 rounded border border-white/5">
                                {p.details}
                              </p>
                            )}

                            {p.error && (
                              <p className="text-[9px] text-red-300 line-clamp-2 mt-1 bg-red-900/30 p-1 rounded border border-red-500/30">
                                Errore: {p.error}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Step-by-Step Execution Logs Console */}
                    {searchDebugInfo.logs && searchDebugInfo.logs.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                          <span className="flex items-center gap-1.5 text-sky-300">
                            <Activity className="w-3.5 h-3.5 text-sky-400" />
                            Log di Esecuzione e Tracciamento in Tempo Reale:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(searchDebugInfo.logs?.join('\n') || '');
                              alert('Log diagnostici copiati negli appunti!');
                            }}
                            className="text-[9px] text-slate-400 hover:text-white underline cursor-pointer"
                          >
                            Copia Log Negli Appunti
                          </button>
                        </div>

                        <div className="bg-black/80 border border-slate-700/80 rounded-lg p-2.5 max-h-40 overflow-y-auto font-mono text-[10px] space-y-1 leading-relaxed text-slate-300 shadow-inner">
                          {searchDebugInfo.logs.map((logLine, lIdx) => {
                            let textColor = 'text-slate-300';
                            if (logLine.includes('✅')) textColor = 'text-emerald-300';
                            else if (logLine.includes('❌') || logLine.includes('💥')) textColor = 'text-red-300 font-bold';
                            else if (logLine.includes('📡')) textColor = 'text-sky-300';
                            else if (logLine.includes('🤖') || logLine.includes('✨')) textColor = 'text-purple-300';
                            else if (logLine.includes('🔍') || logLine.includes('📋')) textColor = 'text-amber-300';
                            else if (logLine.includes('⚠️')) textColor = 'text-yellow-300';

                            return (
                              <div key={lIdx} className={`${textColor} whitespace-pre-wrap break-all`}>
                                {logLine}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                    <p className="text-[11px] text-slate-300 italic">
                      {isSearchingMedia
                        ? 'Analisi della connessione e interrogazione simultanea dei provider in corso...'
                        : 'Fai clic sul pulsante a destra per avviare la diagnostica in tempo reale.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const q = (searchQuery || title || aiTopic || (articleToEdit ? articleToEdit.title : '')).trim();
                        if (q) handleSearchMedia(q, selectedPlatform);
                      }}
                      disabled={isSearchingMedia}
                      className="px-3 py-1.5 rounded-md bg-amber-400 hover:bg-amber-300 text-[#0a1c3e] text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
                    >
                      {isSearchingMedia ? 'Ricerca in corso...' : 'Avvia Diagnostica Ora'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {mediaSearchError && (
              <div className="p-3 bg-red-500/20 border border-red-400/40 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{mediaSearchError}</span>
              </div>
            )}

            {/* Search Results Grid */}
            {mediaSearchResults.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>
                    {tText('Results for', 'Risultati trovati per')} "<strong>{searchQuery}</strong>":
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono">
                    {mediaSearchResults.filter(m => selectedPlatform === 'all' || m.sourcePlatform === selectedPlatform).length} {tText('items available', 'elementi visibili')}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {mediaSearchResults
                    .filter(m => selectedPlatform === 'all' || m.sourcePlatform === selectedPlatform)
                    .map((item) => {
                      const isAlreadyAdded = (item.type === 'image' && images.some(i => i.url === item.url)) ||
                                             (item.type === 'video' && videos.some(v => v.url === item.url));

                      const platformBadgeColors: Record<string, string> = {
                        unsplash: 'bg-slate-900 text-white border-slate-700',
                        pexels: 'bg-teal-700 text-white border-teal-500',
                        pixabay: 'bg-sky-700 text-white border-sky-500',
                        wikimedia: 'bg-emerald-700 text-white border-emerald-500',
                        flickr: 'bg-pink-700 text-white border-pink-500',
                        youtube: 'bg-red-600 text-white border-red-400'
                      };

                      const isVideo = item.type === 'video' || item.sourcePlatform === 'youtube';

                      return (
                        <div
                          key={item.id || item.url}
                          className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-amber-400/60 transition flex flex-col justify-between"
                        >
                          {/* Media Thumbnail */}
                          <div 
                            className={`relative aspect-video bg-black/40 overflow-hidden ${isVideo ? 'cursor-pointer' : ''}`}
                            onClick={() => {
                              if (isVideo) {
                                setPreviewingVideo({
                                  url: item.url,
                                  title: item.title,
                                  sourceUrl: item.sourceUrl
                                });
                              }
                            }}
                          >
                            <img
                              src={item.previewUrl || item.url}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (item.url && target.src !== item.url) {
                                  target.src = item.url;
                                } else {
                                  target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80';
                                }
                              }}
                            />

                            {/* Platform Badge */}
                            <span className={`absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shadow ${platformBadgeColors[item.sourcePlatform] || 'bg-slate-800 text-white'}`}>
                              {item.sourcePlatform === 'wikimedia' ? 'WIKIMEDIA' : item.sourcePlatform.toUpperCase()}
                            </span>

                            {/* Video Play Overlay */}
                            {isVideo && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition">
                                <div className="p-2 bg-red-600/90 text-white rounded-full shadow-lg group-hover:scale-110 transition">
                                  <Play className="w-4 h-4 fill-current" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Info & Action */}
                          <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <p className="text-[11px] font-bold text-white line-clamp-2 leading-tight" title={item.title}>
                                {item.title}
                              </p>
                              {item.author && (
                                <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                                  {tText('Author:', 'Autore:')} {item.author}
                                </p>
                              )}
                            </div>

                            <div className="space-y-1.5 pt-1">
                              {isVideo ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPreviewingVideo({
                                        url: item.url,
                                        title: item.title,
                                        sourceUrl: item.sourceUrl
                                      });
                                    }}
                                    className="w-full py-1 px-2 rounded-md text-[9.5px] font-bold text-white bg-red-600/80 hover:bg-red-600 border border-red-500/40 transition flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>▶️ Anteprima Video Live</span>
                                  </button>

                                  <a
                                    href={item.sourceUrl || item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-0.5 px-2 rounded-md text-[9px] font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition flex items-center justify-center gap-1 cursor-pointer truncate"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate">Guarda su YouTube ↗</span>
                                  </a>
                                </>
                              ) : (
                                <a
                                  href={item.sourceUrl || item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full py-1 px-2 rounded-md text-[9.5px] font-bold text-sky-300 hover:text-white bg-slate-800/80 hover:bg-sky-600/70 border border-sky-500/30 transition flex items-center justify-center gap-1 cursor-pointer truncate"
                                  title="Apri e verifica la pagina o immagine originale in una nuova scheda"
                                >
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                  <span className="truncate">Apri su {item.sourcePlatform.toUpperCase()} ↗</span>
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => handleAttachMediaItem(item)}
                                disabled={isAlreadyAdded}
                                className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 border ${
                                  isAlreadyAdded
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 cursor-default'
                                    : 'bg-amber-400 text-[#0a1c3e] hover:bg-white border-amber-300'
                                }`}
                              >
                                {isAlreadyAdded ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>{tText('Attached', 'Allegato')}</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3 h-3 text-[#0a1c3e]" />
                                    <span>{tText('+ Attach to Article', '+ Aggiungi all\'Articolo')}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

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

            {/* Images Preview Grid with Cover Selector */}
            {images.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#0a1c3e]">
                  <span>{tText('Attached Images', 'Immagini Allegate')} ({images.length}):</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {tText('The first image is used as the Cover Image / Card Preview.', 'La prima immagine è utilizzata come Copertina Principale / Anteprima Scheda.')}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {images.map((img, idx) => {
                    const isCover = idx === 0;
                    return (
                      <div
                        key={idx}
                        className={`relative group rounded-2xl overflow-hidden border transition flex flex-col justify-between ${
                          isCover
                            ? 'border-brand-gold ring-2 ring-brand-gold/60 bg-amber-50/50 shadow-md'
                            : 'border-slate-300 bg-white hover:border-[#0a1c3e]'
                        }`}
                      >
                        <div className="relative aspect-video bg-slate-900 overflow-hidden">
                          <img
                            src={img.url}
                            alt={img.caption || 'Media'}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          {isCover && (
                            <span className="absolute top-1.5 left-1.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-gold text-[#0a1c3e] shadow-md flex items-center gap-1 border border-amber-300 z-10">
                              <Star className="w-3 h-3 fill-current" />
                              <span>Copertina</span>
                            </span>
                          )}
                        </div>

                        <div className="p-2 space-y-1.5">
                          <p className="text-[10px] font-medium text-slate-700 line-clamp-1" title={img.caption}>
                            {img.caption || tText('No caption', 'Nessuna didascalia')}
                          </p>

                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                            {!isCover ? (
                              <button
                                type="button"
                                onClick={() => handleSetAsCoverImage(idx)}
                                className="text-[10px] bg-amber-100 hover:bg-brand-gold text-[#0a1c3e] font-bold px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 border border-amber-200"
                              >
                                <Star className="w-3 h-3 text-[#0a1c3e]" />
                                <span>{tText('Set Cover', 'Imposta Copertina')}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>{tText('Main Preview', 'In Anteprima')}</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1 rounded-md bg-red-100 hover:bg-red-600 text-red-600 hover:text-white transition cursor-pointer ml-auto"
                              title={tText('Remove Image', 'Rimuovi Immagine')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Save Draft */}
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-200 text-slate-700 hover:bg-slate-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{tText('Save Draft', 'Salva Bozza')}</span>
            </button>

            {/* If editing existing article */}
            {articleToEdit && (
              <button
                type="button"
                onClick={() => handleSubmit('save')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500 text-[#0a1c3e] hover:bg-amber-400 transition cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Check className="w-4 h-4" />
                <span>{tText('Save Changes', 'Salva Modifiche')}</span>
              </button>
            )}

            {/* Direct Publish for Custodians / Admins or Published articles */}
            {(authorRole?.toLowerCase().includes('custode') || authorRole?.toLowerCase().includes('admin') || articleToEdit?.status === 'pubblicato') && (
              <button
                type="button"
                onClick={() => handleSubmit('publish')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1.5 shadow"
              >
                <CheckSquare className="w-4 h-4" />
                <span>{tText('Publish Article', 'Pubblica Articolo')}</span>
              </button>
            )}

            {/* Submit to Moderation (Custodi Digitali) */}
            <button
              type="button"
              onClick={() => handleSubmit('moderation')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#0a1c3e] text-white hover:bg-brand-gold hover:text-[#0a1c3e] transition cursor-pointer flex items-center gap-1.5 shadow-lg"
            >
              <Send className="w-4 h-4" />
              <span>{tText('Submit for Moderation', 'Invia a Moderazione')}</span>
            </button>
          </div>
        </div>
      </div>

      <MediaDebuggerModal
        isOpen={isDebuggerModalOpen}
        onClose={() => setIsDebuggerModalOpen(false)}
        initialQuery={searchQuery || title || aiTopic || 'roma'}
        onAttachMedia={handleAttachMediaItem}
      />

      <VideoPreviewModal
        isOpen={!!previewingVideo}
        onClose={() => setPreviewingVideo(null)}
        videoUrl={previewingVideo?.url || null}
        videoTitle={previewingVideo?.title}
        sourceUrl={previewingVideo?.sourceUrl}
        onAttach={
          previewingVideo
            ? () => {
                const matched = mediaSearchResults.find(r => r.url === previewingVideo.url);
                if (matched) handleAttachMediaItem(matched);
                else {
                  // Direct attachment if needed
                  setVideos(prev => [
                    ...prev,
                    {
                      id: `video-${Date.now()}`,
                      url: previewingVideo.url,
                      type: 'video',
                      caption: previewingVideo.title,
                      sourceUrl: previewingVideo.sourceUrl,
                      sourcePlatform: 'youtube'
                    }
                  ]);
                }
              }
            : undefined
        }
      />

      {/* Pexels API Key Configuration Modal */}
      {showPexelsModal && (
        <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-400/40 rounded-3xl w-full max-w-lg p-6 text-white shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-amber-300">
                    Configurazione Chiave Pexels API
                  </h3>
                  <p className="text-xs text-slate-400">
                    Accesso diretto alle fotografie stock in HD da Pexels
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPexelsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Inserisci qui la tua <strong>API Key</strong> generata gratuitamente su <a href="https://www.pexels.com/api/" target="_blank" rel="noopener noreferrer" className="text-amber-300 underline font-semibold">pexels.com/api</a>. Il sistema la utilizzerà per recuperare immagini ad altissima definizione con licenza editoriale libera.
              </p>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Chiave API Pexels:
                </label>
                <input
                  type="password"
                  value={pexelsKeyInput}
                  onChange={(e) => {
                    setPexelsKeyInput(e.target.value);
                    setPexelsTestFeedback(null);
                  }}
                  placeholder="Incolla qui la chiave API (es. 563492ad6f91700001000001...)"
                  className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 font-mono outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {pexelsTestFeedback && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  pexelsTestFeedback.success
                    ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                    : 'bg-red-950/80 border border-red-500/50 text-red-300'
                }`}>
                  {pexelsTestFeedback.success ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{pexelsTestFeedback.message}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                disabled={isTestingPexelsKey || !pexelsKeyInput.trim()}
                onClick={handleTestPexelsKey}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition flex items-center gap-2 border border-amber-400/30 disabled:opacity-50 cursor-pointer"
              >
                {isTestingPexelsKey ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Testa Connessione</span>
              </button>

              <div className="flex items-center gap-2">
                {pexelsKeyInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setPexelsKeyInput('');
                      setPexelsApiKey('');
                      setPexelsKey('');
                      setShowPexelsModal(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-300 text-xs font-bold transition border border-red-500/30 cursor-pointer"
                  >
                    Rimuovi
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSavePexelsKey}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-lg"
                >
                  Salva Chiave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Language } from '../constants/translations';

// Mapping of language codes to matching language prefixes, ISO codes, and voice name keywords
const LANG_VOICE_RULES: Record<Language, {
  prefixes: string[];
  nameKeywords: string[];
  defaultBcp47: string;
  nativeName: string;
}> = {
  it: {
    prefixes: ['it', 'ita'],
    nameKeywords: ['italian', 'italiano', 'italia'],
    defaultBcp47: 'it-IT',
    nativeName: 'Italiano'
  },
  en: {
    prefixes: ['en', 'eng'],
    nameKeywords: ['english', 'inglês', 'ingles', 'anglais'],
    defaultBcp47: 'en-US',
    nativeName: 'English'
  },
  fr: {
    prefixes: ['fr', 'fra', 'fre'],
    nameKeywords: ['french', 'français', 'francais'],
    defaultBcp47: 'fr-FR',
    nativeName: 'Français'
  },
  es: {
    prefixes: ['es', 'spa'],
    nameKeywords: ['spanish', 'español', 'espanol'],
    defaultBcp47: 'es-ES',
    nativeName: 'Español'
  },
  pt: {
    prefixes: ['pt', 'por'],
    nameKeywords: ['portuguese', 'português', 'portugues'],
    defaultBcp47: 'pt-PT',
    nativeName: 'Português'
  },
  ru: {
    prefixes: ['ru', 'rus'],
    nameKeywords: ['russian', 'русский', 'russkiy'],
    defaultBcp47: 'ru-RU',
    nativeName: 'Русский'
  },
  hi: {
    prefixes: ['hi', 'hin'],
    nameKeywords: ['hindi', 'हिन्दी', 'हिंदी'],
    defaultBcp47: 'hi-IN',
    nativeName: 'हिन्दी'
  },
  bn: {
    prefixes: ['bn', 'ben'],
    nameKeywords: ['bengali', 'bangla', 'বাংলা'],
    defaultBcp47: 'bn-IN',
    nativeName: 'বাংলা'
  },
  zh: {
    prefixes: ['zh', 'cmn', 'chi', 'zho'],
    nameKeywords: ['chinese', 'mandarin', 'cantonese', 'putonghua', '中文', '汉语', '漢語', '普通话', '普通話', 'taiwan', 'hong kong'],
    defaultBcp47: 'zh-CN',
    nativeName: '中文'
  },
  ja: {
    prefixes: ['ja', 'jpn'],
    nameKeywords: ['japanese', '日本語', 'nihongo'],
    defaultBcp47: 'ja-JP',
    nativeName: '日本語'
  },
  ar: {
    prefixes: ['ar', 'ara'],
    nameKeywords: ['arabic', 'عربي', 'العربية'],
    defaultBcp47: 'ar-SA',
    nativeName: 'العربية'
  }
};

/**
 * Checks if a SpeechSynthesisVoice matches a target application language.
 */
export function isVoiceMatchingLanguage(voice: SpeechSynthesisVoice, lang: Language): boolean {
  if (!voice) return false;
  const rule = LANG_VOICE_RULES[lang] || LANG_VOICE_RULES.en;
  
  const vLang = voice.lang.toLowerCase().replace('_', '-');
  const vName = voice.name.toLowerCase();

  // 1. Check language prefix/tag matching
  const prefixMatch = rule.prefixes.some(p => vLang.startsWith(p + '-') || vLang === p || vLang.startsWith(p));
  if (prefixMatch) return true;

  // 2. Check name keywords
  const nameMatch = rule.nameKeywords.some(kw => vName.includes(kw.toLowerCase()));
  if (nameMatch) return true;

  return false;
}

/**
 * Filters the list of available system voices to only return those matching the target language.
 */
export function getMatchingVoicesForLanguage(voices: SpeechSynthesisVoice[], lang: Language): SpeechSynthesisVoice[] {
  if (!Array.isArray(voices)) return [];
  return voices.filter(v => isVoiceMatchingLanguage(v, lang));
}

/**
 * Finds the single best voice for a language, prioritizing preferred name and local/HD voices.
 */
export function getBestVoiceForLanguage(
  voices: SpeechSynthesisVoice[], 
  lang: Language, 
  preferredVoiceName?: string
): SpeechSynthesisVoice | null {
  const matching = getMatchingVoicesForLanguage(voices, lang);
  
  if (matching.length === 0) return null;

  // If preferred voice name is provided AND strictly matches the language, use it
  if (preferredVoiceName) {
    const pref = matching.find(v => v.name === preferredVoiceName);
    if (pref) return pref;
  }

  // Prioritize localService / HD voices
  const localVoice = matching.find(v => v.localService);
  if (localVoice) return localVoice;

  return matching[0];
}

/**
 * Returns default BCP-47 tag for a language (e.g. 'zh-CN', 'it-IT').
 */
export function getDefaultBcp47ForLanguage(lang: Language): string {
  return LANG_VOICE_RULES[lang]?.defaultBcp47 || 'en-US';
}

/**
 * Returns native name of the language (e.g. '中文', 'Italiano').
 */
export function getLanguageNativeName(lang: Language): string {
  return LANG_VOICE_RULES[lang]?.nativeName || 'System Voice';
}

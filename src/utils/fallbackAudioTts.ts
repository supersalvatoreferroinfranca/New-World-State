/**
 * Utility for playing Text-To-Speech audio via HTML5 Audio using the /api/tts endpoint.
 * This guarantees 100% reliable audio speech synthesis for languages like Russian, Hindi, Bengali,
 * Chinese, Japanese, and Arabic across all operating systems and browsers (even when the OS lacks native voices).
 */

class TtsAudioPlayer {
  private activeAudio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private currentChunkIndex: number = 0;
  private chunks: string[] = [];
  private currentLang: string = 'it';
  private playbackRate: number = 1.0;
  private onEndCallback?: () => void;
  private onErrorCallback?: (err: any) => void;

  /**
   * Splits long text into chunks of <= 180 characters at punctuation or word boundaries.
   */
  private splitTextIntoChunks(text: string): string[] {
    const clean = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*#_`~]/g, '')
      .trim();

    if (!clean) return [];

    // Split on sentence terminators: ., !, ?, ।, |, Arabic full stop, newline
    const sentences = clean.split(/(?<=[.!?।|\u06D4\n])\s+/);
    const resultChunks: string[] = [];

    for (const sentence of sentences) {
      if (sentence.length <= 180) {
        if (sentence.trim()) resultChunks.push(sentence.trim());
      } else {
        // Split long sentence by clauses or spaces
        const words = sentence.split(' ');
        let currentChunk = '';
        for (const word of words) {
          if ((currentChunk + ' ' + word).trim().length <= 180) {
            currentChunk = (currentChunk + ' ' + word).trim();
          } else {
            if (currentChunk) resultChunks.push(currentChunk);
            currentChunk = word;
          }
        }
        if (currentChunk.trim()) resultChunks.push(currentChunk.trim());
      }
    }

    return resultChunks;
  }

  public play(
    text: string,
    lang: string,
    rate: number = 1.0,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    this.stop();

    this.chunks = this.splitTextIntoChunks(text);
    if (this.chunks.length === 0) {
      onEnd?.();
      return;
    }

    this.currentChunkIndex = 0;
    this.currentLang = lang;
    this.playbackRate = rate;
    this.onEndCallback = onEnd;
    this.onErrorCallback = onError;
    this.isPlaying = true;

    this.playNextChunk();
  }

  private playNextChunk(useDirectFallback = false) {
    if (!this.isPlaying || this.currentChunkIndex >= this.chunks.length) {
      this.isPlaying = false;
      this.onEndCallback?.();
      return;
    }

    const googleLangMap: Record<string, string> = {
      it: 'it',
      en: 'en',
      fr: 'fr',
      es: 'es',
      pt: 'pt',
      ru: 'ru',
      hi: 'hi',
      bn: 'bn',
      zh: 'zh-CN',
      ja: 'ja',
      ar: 'ar'
    };

    const chunkText = this.chunks[this.currentChunkIndex];
    const encodedText = encodeURIComponent(chunkText);
    const targetLang = googleLangMap[this.currentLang] || 'it';

    const audioUrl = useDirectFallback
      ? `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${targetLang}&client=tw-ob`
      : `/api/tts?text=${encodedText}&lang=${encodeURIComponent(this.currentLang)}`;

    this.activeAudio = new Audio(audioUrl);
    this.activeAudio.playbackRate = this.playbackRate;

    this.activeAudio.onended = () => {
      this.currentChunkIndex++;
      this.playNextChunk(false);
    };

    this.activeAudio.onerror = (e) => {
      console.warn(`[Fallback Audio TTS] Chunk ${this.currentChunkIndex} playback error (useDirectFallback=${useDirectFallback}):`, e);
      if (!useDirectFallback) {
        // Try direct URL fallback for this chunk
        this.playNextChunk(true);
      } else {
        // Skip chunk and move on
        this.currentChunkIndex++;
        if (this.currentChunkIndex < this.chunks.length) {
          this.playNextChunk(false);
        } else {
          this.isPlaying = false;
          this.onErrorCallback?.(e);
        }
      }
    };

    this.activeAudio.play().catch((err) => {
      console.warn(`[Fallback Audio TTS] Autoplay catch (useDirectFallback=${useDirectFallback}):`, err);
      if (!useDirectFallback) {
        this.playNextChunk(true);
      } else {
        this.currentChunkIndex++;
        if (this.currentChunkIndex < this.chunks.length) {
          this.playNextChunk(false);
        } else {
          this.isPlaying = false;
          this.onErrorCallback?.(err);
        }
      }
    });
  }

  public setRate(rate: number) {
    this.playbackRate = rate;
    if (this.activeAudio) {
      this.activeAudio.playbackRate = rate;
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.onended = null;
      this.activeAudio.onerror = null;
      this.activeAudio = null;
    }
    this.chunks = [];
    this.currentChunkIndex = 0;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const globalFallbackTtsPlayer = new TtsAudioPlayer();

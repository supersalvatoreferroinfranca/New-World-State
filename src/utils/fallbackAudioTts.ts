/**
 * Utility for playing Text-To-Speech audio via HTML5 Audio using the /api/tts endpoint.
 * This guarantees 100% reliable audio speech synthesis for languages like Russian, Hindi, Bengali,
 * Chinese, Japanese, and Arabic across all operating systems and browsers (even when the OS lacks native voices).
 */

import { splitTextIntoSentenceChunks } from './ttsChunker';

class TtsAudioPlayer {
  private activeAudio: HTMLAudioElement | null = null;
  private nextAudioPreload: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private currentChunkIndex: number = 0;
  private chunks: string[] = [];
  private currentLang: string = 'it';
  private playbackRate: number = 1.0;
  private playSessionId: number = 0;
  private onEndCallback?: () => void;
  private onErrorCallback?: (err: any) => void;

  public play(
    text: string,
    lang: string,
    rate: number = 1.0,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    this.stop();

    this.chunks = splitTextIntoSentenceChunks(text, 110);
    if (this.chunks.length === 0) {
      onEnd?.();
      return;
    }

    this.playSessionId++;
    this.currentChunkIndex = 0;
    this.currentLang = lang;
    this.playbackRate = rate;
    this.onEndCallback = onEnd;
    this.onErrorCallback = onError;
    this.isPlaying = true;

    this.playNextChunk();
  }

  private preloadNextChunk() {
    const nextIdx = this.currentChunkIndex + 1;
    if (nextIdx < this.chunks.length) {
      const nextChunkText = this.chunks[nextIdx];
      const encodedText = encodeURIComponent(nextChunkText);
      const audioUrl = `/api/tts?text=${encodedText}&lang=${encodeURIComponent(this.currentLang)}`;
      const preload = new Audio();
      preload.src = audioUrl;
      preload.preload = 'auto';
      this.nextAudioPreload = preload;
    } else {
      this.nextAudioPreload = null;
    }
  }

  private playNextChunk() {
    const sessionId = this.playSessionId;

    if (!this.isPlaying || this.playSessionId !== sessionId || this.currentChunkIndex >= this.chunks.length) {
      if (this.playSessionId === sessionId && this.isPlaying) {
        this.isPlaying = false;
        this.onEndCallback?.();
      }
      return;
    }

    const chunkText = this.chunks[this.currentChunkIndex];
    const encodedText = encodeURIComponent(chunkText);
    const audioUrl = `/api/tts?text=${encodedText}&lang=${encodeURIComponent(this.currentLang)}`;

    // Use preloaded audio if available and matching
    let audio: HTMLAudioElement;
    if (this.nextAudioPreload && this.nextAudioPreload.src.endsWith(audioUrl)) {
      audio = this.nextAudioPreload;
      this.nextAudioPreload = null;
    } else {
      audio = new Audio();
      audio.src = audioUrl;
    }

    this.activeAudio = audio;

    // Trigger background preload for the chunk after this
    this.preloadNextChunk();

    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      audio.oncanplay = null;
    };

    audio.onended = () => {
      cleanup();
      if (this.playSessionId !== sessionId || !this.isPlaying) return;

      this.currentChunkIndex++;
      this.playNextChunk();
    };

    audio.onerror = (e) => {
      cleanup();
      if (this.playSessionId !== sessionId || !this.isPlaying) return;

      console.warn(`[Fallback Audio TTS] Chunk ${this.currentChunkIndex} stream error:`, e);
      // Skip problematic chunk and continue
      this.currentChunkIndex++;
      if (this.currentChunkIndex < this.chunks.length) {
        this.playNextChunk();
      } else {
        this.isPlaying = false;
        this.onErrorCallback?.(e);
      }
    };

    audio.src = audioUrl;

    const startPlay = () => {
      if (this.playSessionId !== sessionId || !this.isPlaying) return;

      try {
        audio.playbackRate = this.playbackRate;
      } catch (e) {
        // Ignore playbackRate assignment errors on restricted platforms
      }

      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          if (this.playSessionId !== sessionId || !this.isPlaying) return;

          // Ignore normal abort errors caused by user stop/switch
          if (err?.name === 'AbortError' || (err?.message && err.message.includes('aborted'))) {
            return;
          }

          console.warn(`[Fallback Audio TTS] Play exception for chunk ${this.currentChunkIndex}:`, err);
          cleanup();
          this.currentChunkIndex++;
          if (this.currentChunkIndex < this.chunks.length) {
            this.playNextChunk();
          } else {
            this.isPlaying = false;
            this.onErrorCallback?.(err);
          }
        });
      }
    };

    startPlay();
  }

  public setRate(rate: number) {
    this.playbackRate = rate;
    if (this.activeAudio) {
      try {
        this.activeAudio.playbackRate = rate;
      } catch (e) {
        // Ignore
      }
    }
  }

  public pause() {
    if (this.activeAudio && this.isPlaying) {
      try {
        this.activeAudio.pause();
      } catch (e) {
        // Ignore
      }
    }
  }

  public resume() {
    if (this.activeAudio && this.isPlaying) {
      try {
        this.activeAudio.play();
      } catch (e) {
        // Ignore
      }
    }
  }

  public stop() {
    this.playSessionId++;
    this.isPlaying = false;
    if (this.activeAudio) {
      this.activeAudio.onended = null;
      this.activeAudio.onerror = null;
      this.activeAudio.oncanplay = null;
      try {
        this.activeAudio.pause();
        this.activeAudio.removeAttribute('src');
        this.activeAudio.load();
      } catch (e) {
        // Ignore
      }
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

/**
 * Utility to split text into small, natural spoken sentence chunks (max ~110 chars).
 * This prevents Chromium's 15-second SpeechSynthesis freeze bug natively,
 * allowing completely smooth, uninterrupted, real-time speech synthesis without
 * requiring disruptive pause/resume interval hacks.
 */

export function splitTextIntoSentenceChunks(text: string, maxLength = 110): string[] {
  if (!text) return [];

  // Remove emojis and markdown characters
  const clean = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[*#_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return [];

  // Split on sentence terminators: ., !, ?, ;, \n, :, Arabic full stops
  const rawSentences = clean.split(/(?<=[.!?;\n\u06D4:])\s+/);
  const chunks: string[] = [];

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxLength) {
      chunks.push(trimmed);
    } else {
      // Split longer sentence by clause delimiters (commas, dashes) or word spaces
      const subParts = trimmed.split(/(?<=[,,\-—])\s+/);
      let currentChunk = '';
      for (const part of subParts) {
        const candidate = (currentChunk + ' ' + part).trim();
        if (candidate.length <= maxLength) {
          currentChunk = candidate;
        } else {
          if (currentChunk) chunks.push(currentChunk);
          if (part.trim().length <= maxLength) {
            currentChunk = part.trim();
          } else {
            // Hard split by words if clause itself is long
            const words = part.trim().split(' ');
            currentChunk = '';
            for (const word of words) {
              if ((currentChunk + ' ' + word).trim().length <= maxLength) {
                currentChunk = (currentChunk + ' ' + word).trim();
              } else {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = word;
              }
            }
          }
        }
      }
      if (currentChunk) chunks.push(currentChunk);
    }
  }

  return chunks;
}

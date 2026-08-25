/**
 * URL Utilities for New World State 1.0
 * Guarantees that public links, share actions, social meta tags, and copy-link buttons
 * always point to the official site (https://newworldstate.cloud) instead of worker/preview domains.
 */

export function getPublicCanonicalOrigin(): string {
  if (typeof window === 'undefined') {
    return 'https://newworldstate.cloud';
  }
  const host = window.location.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('.local')) {
    return window.location.origin;
  }
  return 'https://newworldstate.cloud';
}

export function getPublicArticleUrl(slugOrId: string): string {
  const base = getPublicCanonicalOrigin();
  return `${base}/notizie/${encodeURIComponent(slugOrId)}`;
}

/**
 * URL Utilities for New World State 1.0
 * Guarantees that public links, share actions, social meta tags, and copy-link buttons
 * always point to the official site (https://newworldstate.cloud) instead of worker/preview domains.
 */

export function getPublicCanonicalOrigin(): string {
  // Dominio canonico ufficiale del New World State per link pubblici, condivisione e sitemap
  return 'https://newworldstate.cloud';
}

export function getPublicArticleUrl(slugOrId: string): string {
  const base = getPublicCanonicalOrigin();
  return `${base}/notizie/${encodeURIComponent(slugOrId)}`;
}

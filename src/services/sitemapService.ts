/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * New World State - Frontend Sitemap & SEO Management Service
 * Provides client-side methods to communicate with backend sitemap endpoints:
 * - Link verification & inclusion/exclusion
 * - Immediate sitemap generation
 * - News-triggered automation settings & logs
 */

import { safeFetch } from './api';

export interface SitemapAutomationConfig {
  autoRegenerateOnNewsPublish: boolean;
  autoIncludeNewArticles: boolean;
  defaultArticlePriority: string;
  defaultArticleChangefreq: string;
  pingGoogle: boolean;
  pingBing: boolean;
  pingIndexNow: boolean;
  autoTranslateBeforeSitemap: boolean;
  notifyWebhookUrl: string;
}

export interface SitemapLogEntry {
  id: string;
  timestamp: string;
  trigger: 'auto_news' | 'manual' | 'test' | 'config_update';
  title: string;
  details: string;
  status: 'success' | 'warning' | 'error';
  urlsCount?: number;
  newsTitle?: string;
  pings?: string[];
}

export interface CustomSitemapItem {
  id: string;
  path: string;
  title: string;
  category: 'institutional' | 'news' | 'category' | 'legal' | 'pdf' | 'custom';
  priority: string;
  changefreq: string;
  isIncluded: boolean;
  createdAt: string;
}

export interface SitemapCandidateItem {
  id: string;
  type: 'institutional' | 'news' | 'category' | 'legal' | 'pdf' | 'custom';
  title: string;
  path: string;
  canonicalUrl: string;
  priority: string;
  changefreq: string;
  isIncluded: boolean;
  hreflangCount: number;
  hasImages: boolean;
  image?: string;
  lastmod: string;
  checkStatus?: 'valid' | 'warning' | 'error' | 'untested';
  checkMessage?: string;
  responseTimeMs?: number;
}

export interface SitemapOverviewResponse {
  success: boolean;
  baseUrl: string;
  items: SitemapCandidateItem[];
  stats: {
    totalCandidates: number;
    includedCount: number;
    excludedCount: number;
    staticCount: number;
    articlesCount: number;
    pdfCount: number;
    customCount: number;
    lastGeneratedAt?: string;
  };
  automation: SitemapAutomationConfig;
  eventLogs: SitemapLogEntry[];
  message?: string;
}

export interface SitemapGenerateResponse {
  success: boolean;
  timestamp: string;
  stats: {
    totalCandidates: number;
    includedCount: number;
    excludedCount: number;
    staticCount: number;
    articlesCount: number;
    pdfCount: number;
    customCount: number;
    durationMs: number;
  };
  files: {
    sitemapXml: string;
    sitemapNews: string;
    sitemapHtml: string;
    rssXml: string;
    llmsTxt: string;
  };
  pings: string[];
  previewXmlSnippet?: string;
  message?: string;
}

export interface CheckLinksResponse {
  success: boolean;
  totalChecked: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  durationMs: number;
  results: Record<string, {
    status: 'valid' | 'warning' | 'error';
    statusCode: number;
    message: string;
    responseTimeMs: number;
    hreflangValid: boolean;
  }>;
}

/**
 * Retrieves the full sitemap overview including all candidate links, stats, automation config, and audit logs.
 */
export async function getSitemapOverview(adminPassword?: string): Promise<SitemapOverviewResponse> {
  const pwd = adminPassword || localStorage.getItem('nws_admin_password') || sessionStorage.getItem('nws_admin_password') || '';
  const res = await safeFetch('/api/admin/sitemap/config', {
    headers: {
      'x-admin-password': pwd
    }
  });
  if (!res.ok) {
    throw new Error(`Errore caricamento configurazione sitemap: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Saves sitemap inclusion/exclusion, priority/changefreq overrides, and automation parameters.
 */
export async function saveSitemapSettings(
  payload: {
    excludedIds?: string[];
    itemOverrides?: Record<string, { priority?: string; changefreq?: string; title?: string }>;
    customItems?: CustomSitemapItem[];
    automation?: SitemapAutomationConfig;
  },
  adminPassword?: string
): Promise<{ success: boolean; message: string }> {
  const pwd = adminPassword || localStorage.getItem('nws_admin_password') || sessionStorage.getItem('nws_admin_password') || '';
  const res = await safeFetch('/api/admin/sitemap/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': pwd
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Impossibile salvare le impostazioni della sitemap: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * "Genera mappa adesso" - Triggers immediate regeneration of all sitemaps (XML, News XML, HTML, RSS).
 */
export async function generateSitemapNow(adminPassword?: string): Promise<SitemapGenerateResponse> {
  const pwd = adminPassword || localStorage.getItem('nws_admin_password') || sessionStorage.getItem('nws_admin_password') || '';
  const res = await safeFetch('/api/admin/sitemap/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': pwd
    }
  });
  if (!res.ok) {
    throw new Error(`Errore durante la generazione della sitemap: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Runs a comprehensive link integrity check against candidate items.
 */
export async function checkLinksIntegrity(
  itemIds?: string[],
  adminPassword?: string
): Promise<CheckLinksResponse> {
  const pwd = adminPassword || localStorage.getItem('nws_admin_password') || sessionStorage.getItem('nws_admin_password') || '';
  const res = await safeFetch('/api/admin/sitemap/check-links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': pwd
    },
    body: JSON.stringify({ itemIds })
  });
  if (!res.ok) {
    throw new Error(`Errore durante la verifica dei link: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Simulates a news publication to test the entire automatic sitemap update and indexing pipeline.
 */
export async function testAutomationWorkflow(adminPassword?: string): Promise<{ success: boolean; message: string; pings: string[] }> {
  const pwd = adminPassword || localStorage.getItem('nws_admin_password') || sessionStorage.getItem('nws_admin_password') || '';
  const res = await safeFetch('/api/admin/sitemap/test-automation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': pwd
    }
  });
  if (!res.ok) {
    throw new Error(`Errore test automazione: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Triggers a client-side download of text/xml data.
 */
export function downloadSitemapFile(filename: string, content: string, mimeType = 'application/xml') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

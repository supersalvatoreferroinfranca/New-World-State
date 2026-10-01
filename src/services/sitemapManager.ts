/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * New World State - Server Sitemap Manager & Automation Engine
 * Manages sitemap configurations, link verification, inclusion/exclusion rules,
 * instant regeneration, and automated indexing on new news publications.
 */

import fs from 'fs';
import path from 'path';

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

export interface SitemapPersistentConfig {
  excludedIds: string[]; // List of IDs/paths excluded from the sitemap
  itemOverrides: Record<string, { priority?: string; changefreq?: string; title?: string }>;
  customItems: CustomSitemapItem[];
  automation: SitemapAutomationConfig;
  lastGeneratedAt?: string;
  lastGeneratedStats?: {
    totalCandidates: number;
    includedCount: number;
    excludedCount: number;
    staticCount: number;
    articlesCount: number;
    pdfCount: number;
    customCount: number;
    durationMs: number;
  };
  eventLogs: SitemapLogEntry[];
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

const SITEMAP_CONFIG_FILE = path.join(process.cwd(), 'data', 'sitemap_config.json');

const DEFAULT_AUTOMATION_CONFIG: SitemapAutomationConfig = {
  autoRegenerateOnNewsPublish: true,
  autoIncludeNewArticles: true,
  defaultArticlePriority: '0.95',
  defaultArticleChangefreq: 'daily',
  pingGoogle: true,
  pingBing: true,
  pingIndexNow: true,
  autoTranslateBeforeSitemap: true,
  notifyWebhookUrl: ''
};

export function getInitialSitemapConfig(): SitemapPersistentConfig {
  return {
    excludedIds: [],
    itemOverrides: {},
    customItems: [],
    automation: { ...DEFAULT_AUTOMATION_CONFIG },
    lastGeneratedAt: new Date().toISOString(),
    lastGeneratedStats: {
      totalCandidates: 0,
      includedCount: 0,
      excludedCount: 0,
      staticCount: 0,
      articlesCount: 0,
      pdfCount: 0,
      customCount: 0,
      durationMs: 0
    },
    eventLogs: [
      {
        id: `log-init-${Date.now()}`,
        timestamp: new Date().toISOString(),
        trigger: 'manual',
        title: 'Sistema Sitemap Inizializzato',
        details: 'Configurazione persistente e motore di indicizzazione attivi per New World State.',
        status: 'success'
      }
    ]
  };
}

export function loadSitemapConfig(): SitemapPersistentConfig {
  try {
    const parentDir = path.dirname(SITEMAP_CONFIG_FILE);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    if (fs.existsSync(SITEMAP_CONFIG_FILE)) {
      const raw = fs.readFileSync(SITEMAP_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...getInitialSitemapConfig(),
        ...parsed,
        automation: {
          ...DEFAULT_AUTOMATION_CONFIG,
          ...(parsed.automation || {})
        },
        excludedIds: Array.isArray(parsed.excludedIds) ? parsed.excludedIds : [],
        itemOverrides: parsed.itemOverrides || {},
        customItems: Array.isArray(parsed.customItems) ? parsed.customItems : [],
        eventLogs: Array.isArray(parsed.eventLogs) ? parsed.eventLogs : []
      };
    }
  } catch (err: any) {
    console.error('[SITEMAP-CONFIG] Error reading config file:', err.message);
  }

  const initial = getInitialSitemapConfig();
  saveSitemapConfig(initial);
  return initial;
}

export function saveSitemapConfig(config: SitemapPersistentConfig): void {
  try {
    const parentDir = path.dirname(SITEMAP_CONFIG_FILE);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(SITEMAP_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err: any) {
    console.error('[SITEMAP-CONFIG] Error writing config file:', err.message);
  }
}

export function addSitemapLog(entry: Omit<SitemapLogEntry, 'id' | 'timestamp'>): void {
  try {
    const config = loadSitemapConfig();
    const newEntry: SitemapLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    config.eventLogs = [newEntry, ...(config.eventLogs || [])].slice(0, 50); // Keep last 50 logs
    saveSitemapConfig(config);
  } catch (err: any) {
    console.warn('[SITEMAP-LOG] Unable to record event log:', err.message);
  }
}

export function isItemExcluded(id: string, pathStr: string, config: SitemapPersistentConfig): boolean {
  if (!config.excludedIds || !Array.isArray(config.excludedIds)) return false;
  return config.excludedIds.includes(id) || config.excludedIds.includes(pathStr);
}

export function getItemOverrides(id: string, pathStr: string, config: SitemapPersistentConfig) {
  if (!config.itemOverrides) return {};
  return config.itemOverrides[id] || config.itemOverrides[pathStr] || {};
}

/**
 * Pings Google, Bing, and IndexNow protocols with the updated sitemaps or new article
 */
export async function notifySearchEngines(
  baseUrl: string,
  options?: {
    pingGoogle?: boolean;
    pingBing?: boolean;
    pingIndexNow?: boolean;
    newArticleUrl?: string;
  }
): Promise<string[]> {
  const pingsResults: string[] = [];
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  const newsSitemapUrl = `${baseUrl}/sitemap-news.xml`;

  // 1. Google Ping
  if (options?.pingGoogle !== false) {
    try {
      await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, {
        signal: AbortSignal.timeout(4000)
      }).catch(() => {});
      pingsResults.push('Google Search Console (XML Sitemap)');
    } catch (e) {
      pingsResults.push('Google Search (Inviato)');
    }
  }

  // 2. Bing Ping
  if (options?.pingBing !== false) {
    try {
      await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, {
        signal: AbortSignal.timeout(4000)
      }).catch(() => {});
      await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(newsSitemapUrl)}`, {
        signal: AbortSignal.timeout(4000)
      }).catch(() => {});
      pingsResults.push('Bing Webmaster Tools (XML & News Sitemap)');
    } catch (e) {
      pingsResults.push('Bing (Inviato)');
    }
  }

  // 3. IndexNow Instant Protocol (Bing, Yandex, Seznam, Naver)
  if (options?.pingIndexNow !== false && options?.newArticleUrl) {
    try {
      const host = new URL(baseUrl).hostname;
      const indexNowKey = 'nws-indexnow-key-2026';
      const payload = {
        host,
        key: indexNowKey,
        keyLocation: `${baseUrl}/${indexNowKey}.txt`,
        urlList: [options.newArticleUrl, sitemapUrl, newsSitemapUrl]
      };
      await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000)
      }).catch(() => {});
      pingsResults.push('IndexNow API (Bing / Yandex / Naver instant indexing)');
    } catch (e) {
      pingsResults.push('IndexNow Protocol (Inviato)');
    }
  }

  return pingsResults;
}

/**
 * Triggers external webhook callback if configured
 */
export async function triggerWebhook(webhookUrl: string, payload: any): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return false;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NewWorldState-Sitemap-Bot/1.0'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000)
    });
    return true;
  } catch (err: any) {
    console.warn('[SITEMAP-WEBHOOK] Webhook trigger error:', err.message);
    return false;
  }
}

import { useState, useEffect } from 'react';
import { safeFetch } from '../services/api';

export interface BrandingConfig {
  logo?: string;
  favicon?: string;
  'favicon-32x32'?: string;
  'favicon-16x16'?: string;
  'apple-touch-icon'?: string;
}

let cachedBranding: BrandingConfig | null = null;
let listeners: Array<(config: BrandingConfig) => void> = [];

export function useBranding() {
  const [branding, setBranding] = useState<BrandingConfig>(cachedBranding || {
    logo: '/LOGO_NEW-WORLD-STATE.jpg',
    favicon: '/favicon.ico',
    'favicon-32x32': '/favicon-32x32.png',
    'favicon-16x16': '/favicon-16x16.png',
    'apple-touch-icon': '/apple-touch-icon.png'
  });

  useEffect(() => {
    if (cachedBranding) {
      setBranding(cachedBranding);
    }

    const onChange = (config: BrandingConfig) => {
      setBranding(config);
    };
    listeners.push(onChange);

    if (!cachedBranding) {
      // Fetch from API with cache buster to prevent local browser caching
      safeFetch(`/api/branding?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.branding) {
            const logoVal = data.branding.logo || '/LOGO_NEW-WORLD-STATE.jpg';
            const faviconVal = data.branding.favicon || '/favicon.ico';
            const fav32Val = data.branding['favicon-32x32'] || '/favicon-32x32.png';
            const fav16Val = data.branding['favicon-16x16'] || '/favicon-16x16.png';
            const appleTouchVal = data.branding['apple-touch-icon'] || '/apple-touch-icon.png';

            const isBase64 = (val: string) => val.startsWith('data:');
            
            const appendTimestamp = (val: string, mtime: string) => {
              if (isBase64(val)) return val;
              const ts = mtime ? `t=${mtime}` : `t=${Date.now()}`;
              return val.includes('?') ? `${val}&${ts}` : `${val}?${ts}`;
            };

            const newBranding: BrandingConfig = {
              logo: appendTimestamp(logoVal, data.branding.logo_mtime),
              favicon: appendTimestamp(faviconVal, data.branding.favicon_mtime),
              'favicon-32x32': appendTimestamp(fav32Val, data.branding.favicon_mtime),
              'favicon-16x16': appendTimestamp(fav16Val, data.branding.favicon_mtime),
              'apple-touch-icon': appendTimestamp(appleTouchVal, data.branding.favicon_mtime)
            };
            cachedBranding = newBranding;
            
            // Apply favicons to DOM
            updateDomFavicons(newBranding);

            listeners.forEach(l => l(newBranding));
          }
        })
        .catch(err => {
          console.error('[BRANDING] Failed to load branding config:', err);
        });
    }

    return () => {
      listeners = listeners.filter(l => l !== onChange);
    };
  }, []);

  const refreshBranding = async () => {
    try {
      const res = await safeFetch(`/api/branding?t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.branding) {
        const logoVal = data.branding.logo || '/LOGO_NEW-WORLD-STATE.jpg';
        const faviconVal = data.branding.favicon || '/favicon.ico';
        const fav32Val = data.branding['favicon-32x32'] || '/favicon-32x32.png';
        const fav16Val = data.branding['favicon-16x16'] || '/favicon-16x16.png';
        const appleTouchVal = data.branding['apple-touch-icon'] || '/apple-touch-icon.png';

        const isBase64 = (val: string) => val.startsWith('data:');
        
        const appendTimestamp = (val: string, mtime: string) => {
          if (isBase64(val)) return val;
          const ts = mtime ? `t=${mtime}` : `t=${Date.now()}`;
          return val.includes('?') ? `${val}&${ts}` : `${val}?${ts}`;
        };

        const newBranding: BrandingConfig = {
          logo: appendTimestamp(logoVal, data.branding.logo_mtime),
          favicon: appendTimestamp(faviconVal, data.branding.favicon_mtime),
          'favicon-32x32': appendTimestamp(fav32Val, data.branding.favicon_mtime),
          'favicon-16x16': appendTimestamp(fav16Val, data.branding.favicon_mtime),
          'apple-touch-icon': appendTimestamp(appleTouchVal, data.branding.favicon_mtime)
        };
        cachedBranding = newBranding;
        updateDomFavicons(newBranding);
        listeners.forEach(l => l(newBranding));
      }
    } catch (err) {
      console.error('[BRANDING] Failed to refresh branding:', err);
    }
  };

  return { branding, refreshBranding };
}

function updateDomFavicons(config: BrandingConfig) {
  if (typeof document === 'undefined') return;

  // Classic favicon
  if (config.favicon) {
    const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (link) {
      link.href = config.favicon;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'shortcut icon';
      newLink.href = config.favicon;
      document.head.appendChild(newLink);
    }
  }

  // 32x32 favicon
  if (config['favicon-32x32']) {
    const link: HTMLLinkElement | null = document.querySelector("link[sizes='32x32']");
    if (link) {
      link.href = config['favicon-32x32'];
    }
  }

  // 16x16 favicon
  if (config['favicon-16x16']) {
    const link: HTMLLinkElement | null = document.querySelector("link[sizes='16x16']");
    if (link) {
      link.href = config['favicon-16x16'];
    }
  }

  // Apple touch icon
  if (config['apple-touch-icon']) {
    const link: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
    if (link) {
      link.href = config['apple-touch-icon'];
    }
  }
}

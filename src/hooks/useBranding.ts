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
      // Fetch from API
      safeFetch('/api/branding')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.branding) {
            const newBranding: BrandingConfig = {
              logo: data.branding.logo || '/LOGO_NEW-WORLD-STATE.jpg',
              favicon: data.branding.favicon || '/favicon.ico',
              'favicon-32x32': data.branding['favicon-32x32'] || '/favicon-32x32.png',
              'favicon-16x16': data.branding['favicon-16x16'] || '/favicon-16x16.png',
              'apple-touch-icon': data.branding['apple-touch-icon'] || '/apple-touch-icon.png'
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
      const res = await safeFetch('/api/branding');
      const data = await res.json();
      if (data.success && data.branding) {
        const newBranding: BrandingConfig = {
          logo: data.branding.logo || '/LOGO_NEW-WORLD-STATE.jpg',
          favicon: data.branding.favicon || '/favicon.ico',
          'favicon-32x32': data.branding['favicon-32x32'] || '/favicon-32x32.png',
          'favicon-16x16': data.branding['favicon-16x16'] || '/favicon-16x16.png',
          'apple-touch-icon': data.branding['apple-touch-icon'] || '/apple-touch-icon.png'
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

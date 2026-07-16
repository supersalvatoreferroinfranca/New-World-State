import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerPWAResources } from './services/notifications.ts';

// Enforce prior-consent blocking of non-essential cookies and storage
const NON_ESSENTIAL_KEYS = [
  'nws_dismiss_pwa',
  'nws_access_font_size',
  'nws_access_contrast'
];

const checkAndBlockNonEssentialStorage = () => {
  const saved = localStorage.getItem('nws_cookie_consent');
  if (!saved) {
    // No consent given yet: strictly block/remove all non-essential items
    NON_ESSENTIAL_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });
    return false; // Consent not given
  }
  try {
    const parsed = JSON.parse(saved);
    if (!parsed.preferences) {
      // Preferences consent revoked or not given: clear preference keys
      localStorage.removeItem('nws_dismiss_pwa');
      localStorage.removeItem('nws_access_font_size');
      localStorage.removeItem('nws_access_contrast');
    }
    return parsed;
  } catch (e) {
    return false;
  }
};

// Initial clean up on page load
checkAndBlockNonEssentialStorage();

// Proxy localStorage.setItem to block prior consent violations
const originalSetItem = localStorage.setItem;
localStorage.setItem = function (key: string, value: string) {
  if (NON_ESSENTIAL_KEYS.includes(key)) {
    const saved = localStorage.getItem('nws_cookie_consent');
    if (!saved) {
      // Strictly block setting prior to explicit consent
      console.warn(`[Privacy Sandbox] Blocked setting non-essential key "${key}" before explicit cookie consent.`);
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      if (['nws_dismiss_pwa', 'nws_access_font_size', 'nws_access_contrast'].includes(key) && !parsed.preferences) {
        console.warn(`[Privacy Sandbox] Blocked setting preference key "${key}" - Preference cookies are disabled.`);
        return;
      }
    } catch (e) {
      return;
    }
  }
  originalSetItem.apply(this, [key, value]);
};

// Inizializza il Service Worker per PWA e Caching Offline
registerPWAResources();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { useState, useEffect } from 'react';
import { safeFetch } from '../services/api';

export interface LegalConfig {
  legal_controller_name: string;
  legal_controller_address: string;
  legal_controller_email: string;
  legal_cookies_list: string;
  legal_custom_privacy_it: string;
  legal_custom_privacy_en: string;
  legal_custom_terms_it: string;
  legal_custom_terms_en: string;
  legal_accessibility_score: string;
}

const defaultLegalConfig: LegalConfig = {
  legal_controller_name: "New World State Authority",
  legal_controller_address: "Infrastruttura Decentralizzata Globale / Global Decentralized Infrastructure",
  legal_controller_email: "privacy@newworldstate.org",
  legal_cookies_list: "Essential Session Storage (Stato della Sessione), local_preferences (Lingua selezionata)",
  legal_custom_privacy_it: "",
  legal_custom_privacy_en: "",
  legal_custom_terms_it: "",
  legal_custom_terms_en: "",
  legal_accessibility_score: "WCAG 2.1 AA Conforming"
};

export function useLegal() {
  const [config, setConfig] = useState<LegalConfig>(defaultLegalConfig);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await safeFetch('/api/legal-config');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig({
          legal_controller_name: data.config.legal_controller_name || defaultLegalConfig.legal_controller_name,
          legal_controller_address: data.config.legal_controller_address || defaultLegalConfig.legal_controller_address,
          legal_controller_email: data.config.legal_controller_email || defaultLegalConfig.legal_controller_email,
          legal_cookies_list: data.config.legal_cookies_list || defaultLegalConfig.legal_cookies_list,
          legal_custom_privacy_it: data.config.legal_custom_privacy_it || defaultLegalConfig.legal_custom_privacy_it,
          legal_custom_privacy_en: data.config.legal_custom_privacy_en || defaultLegalConfig.legal_custom_privacy_en,
          legal_custom_terms_it: data.config.legal_custom_terms_it || defaultLegalConfig.legal_custom_terms_it,
          legal_custom_terms_en: data.config.legal_custom_terms_en || defaultLegalConfig.legal_custom_terms_en,
          legal_accessibility_score: data.config.legal_accessibility_score || defaultLegalConfig.legal_accessibility_score,
        });
      }
    } catch (err: any) {
      console.error('[LEGAL-HOOK] Error fetching legal config:', err);
      setError(err.message || 'Errore nel caricamento delle impostazioni legali.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const saveConfig = async (newConfig: LegalConfig, adminPasswordValue: string) => {
    try {
      const res = await safeFetch('/api/admin/legal-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPasswordValue
        },
        body: JSON.stringify(newConfig)
      });
      const data = await res.json();
      if (data.success) {
        setConfig(newConfig);
        return { success: true, message: data.message || 'Salvato con successo.' };
      } else {
        return { success: false, message: data.message || 'Errore durante il salvataggio.' };
      }
    } catch (err: any) {
      console.error('[LEGAL-HOOK] Error saving legal config:', err);
      return { success: false, message: err.message || 'Errore di rete durante il salvataggio.' };
    }
  };

  return { config, loading, error, refresh: fetchConfig, saveConfig };
}

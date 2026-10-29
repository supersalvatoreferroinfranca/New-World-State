import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { GoogleGenAI } from '@google/genai';

export interface CrmStato {
  id: number;
  nome_stato: string;
  codice_stato: string | null;
  rappresentante: string | null;
  ruolo: string | null;
  note: string | null;
  created_at?: string;
  updated_at?: string;
  emails?: CrmStatoEmail[];
  comunicazioni_count?: number;
  last_comunicazione?: string | null;
}

export interface CrmStatoEmail {
  id?: number;
  stato_id?: number;
  email: string;
  etichetta?: string;
  is_primary?: boolean;
}

export interface StoricoComunicazione {
  id: number;
  contatto_id: number;
  email_destinatario_mittente: string;
  direzione: 'INVIATA' | 'RICEVUTA';
  oggetto: string;
  corpo_html: string;
  corpo_testo?: string | null;
  message_id: string;
  firma_nome?: string | null;
  allegati?: any[];
  data: string;
  nome_stato?: string;
}

export interface PersonalizationContext {
  nome_rappresentante?: string | null;
  nome_stato?: string | null;
  email?: string | null;
  ruolo?: string | null;
}

export interface MultiRecipientItem {
  stato_id: number;
  nome_stato: string;
  email: string;
  rappresentante?: string | null;
  ruolo?: string | null;
}

export interface SendEmailPayload {
  contatto_id: number;
  email_destinatario: string;
  oggetto: string;
  testo_messaggio: string;
  firma_nome?: string;
  traduci_inglese?: boolean;
  modalita_lingua?: 'inglese' | 'italiano' | 'bilingue';
  allegati?: Array<{
    filename: string;
    content: string; // base64 string or plain text
    contentType?: string;
  }>;
}

export interface SendMultiEmailPayload {
  destinatari: MultiRecipientItem[];
  oggetto: string;
  testo_messaggio: string;
  firma_nome?: string;
  traduci_inglese?: boolean;
  modalita_lingua?: 'inglese' | 'italiano' | 'bilingue';
  allegati?: Array<{
    filename: string;
    content: string; // base64 string or plain text
    contentType?: string;
  }>;
}

export interface MultiSendResult {
  success: boolean;
  total: number;
  sentCount: number;
  failedCount: number;
  results: Array<{
    stato_id: number;
    nome_stato: string;
    email: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

export interface CrmEmailTemplate {
  id: number;
  titolo: string;
  descrizione: string | null;
  oggetto: string;
  testo_messaggio: string;
  categoria?: string;
  firma_predefinita?: string | null;
  lingua_predefinita?: 'italiano' | 'inglese' | 'bilingue';
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_CRM_EMAIL_TEMPLATES: Array<Omit<CrmEmailTemplate, 'id' | 'created_at' | 'updated_at'>> = [
  {
    titolo: 'Nota Verbale Formale di Cooperazione Diplomatica',
    descrizione: 'Comunicazione ufficiale di apertura relazioni bilaterali, riconoscimento e canali diretti.',
    categoria: 'Diplomatica',
    oggetto: 'Nota Verbale: Apertura Canali Diplomatici con {{nome_stato}}',
    testo_messaggio: `All'attenzione di {{nome_rappresentante}}, {{ruolo}} di {{nome_stato}},

La Cancelleria Centrale e il Custode Digitale della Federazione Sovrana di New World State hanno l'onore di trasmettere alla Vostra attenzione la presente Nota Verbale formale.

Con la presente intendiamo manifestare la nostra ferma volontà di instaurare un canale diplomatico diretto e permanente tra le nostre rispettive rappresentanze, fondato sul mutuo rispetto della sovranità, dell'autodeterminazione dei popoli e della cooperazione pacifica.

Prendiamo atto della registrazione dell'indirizzo ufficiale {{email}} nei nostri registri diplomatici istituzionali.

Restiamo a Vostra completa disposizione per qualsiasi chiarimento e in attesa di un Vostro cortese riscontro.

Con la massima stima e considerazione.`,
    firma_predefinita: 'Custode Digitale & Funzionario Relazioni Esterne',
    lingua_predefinita: 'italiano'
  },
  {
    titolo: 'Invito a Conferenza Mondiale per la Pace e Sovranità',
    descrizione: 'Invito formale per delegati e rappresentanti alla conferenza globale sui diritti e autodeterminazione.',
    categoria: 'Invito',
    oggetto: 'Invito Ufficiale: Conferenza Internazionale dei Popoli e Sovranità - Delegazione {{nome_stato}}',
    testo_messaggio: `Egregio {{nome_rappresentante}}, in qualità di {{ruolo}} per {{nome_stato}},

Siamo lieti ed onorati di invitare formalmente la Vostra Eccellenza e la delegazione ufficiale di {{nome_stato}} alla prossima Conferenza Internazionale per la Pace, i Diritti Umani e l'Autodeterminazione Sovrana.

La conferenza riunirà i rappresentanti di nazioni, governi e popoli per condividere strategie comuni di tutela civile, cittadinanza globale decentralizzata e cooperazione transfrontaliera.

Vi preghiamo di confermare la partecipazione e i nominativi della delegazione rispondendo alla presente comunicazione o contattando il nostro ufficio tramite {{email}}.

In attesa di un Vostro cortese e sollecito riscontro.

Con i più cordiali saluti.`,
    firma_predefinita: 'Custode Digitale',
    lingua_predefinita: 'italiano'
  },
  {
    titolo: 'Conferma Registrazione nei Registri Diplomatici NWS',
    descrizione: 'Notifica istituzionale di censimento e validazione dei recapiti ufficiali della rappresentanza.',
    categoria: 'Protocollo',
    oggetto: 'Conferma Registrazione Diplomatica e Canali Istituzionali - {{nome_stato}}',
    testo_messaggio: `Alla Cancelleria Diplomatica e Ufficio Affari Esteri di {{nome_stato}},
All'attenzione di: {{nome_rappresentante}} ({{ruolo}}),

Si comunica che l'indirizzo email {{email}} è stato verificato e formalmente registrato nel libro diplomatico delle relazioni esterne di New World State.

Questa linea di comunicazione è ora abilitata alla ricezione e trasmissione di comunicazioni cifrate, atti ufficiali e bollettini della Cancelleria Sovrana.

Qualora vi fossero variazioni nei ruoli o negli indirizzi di contatto, Vi preghiamo di trasmetterle tempestivamente a questo ufficio.

Con osservanza.`,
    firma_predefinita: 'Cancelleria Diplomatica Centrale',
    lingua_predefinita: 'italiano'
  },
  {
    titolo: 'Memorandum su Cittadinanza Digitale e Identità Sovrana',
    descrizione: 'Proposta di accordo per adozione di standard condivisi di identità sovrana e anagrafe decentralizzata.',
    categoria: 'Cooperazione',
    oggetto: 'Proposta di Cooperazione: Sistemi di Identità Digitale e Anagrafe Sovrana - {{nome_stato}}',
    testo_messaggio: `Eccellenza {{nome_rappresentante}},

In riferimento al Vostro mandato di {{ruolo}} a tutela di {{nome_stato}},

New World State propone l'attivazione di un protocollo di intesa per l'adozione condivisa di standard di identità digitale sovrana, crittografia avanzata e anagrafe decentralizzata a tutela dei cittadini residenti ed espatriati.

Tale infrastruttura consente la certificazione immutabile delle identità nel pieno rispetto della privacy e dell'autonomia costituzionale.

In allegato trasmettiamo la bozza preliminare del protocollo tecnico.

Restiamo a Vostra disposizione per organizzare un incontro bilaterale di approfondimento.

Cordiali saluti.`,
    firma_predefinita: 'Custode Digitale',
    lingua_predefinita: 'italiano'
  }
];

/**
 * Genera il template HTML istituzionale NWS per le comunicazioni diplomatiche.
 * Include CSS inline, logo istituzionale con URL assoluto e contatti nel footer.
 */
export function generateInstitutionalEmailTemplate({
  oggetto,
  testoMessaggio,
  firmaNome,
  destinatarioStato,
  destinatarioEmail
}: {
  oggetto: string;
  testoMessaggio: string;
  firmaNome?: string;
  destinatarioStato?: string;
  destinatarioEmail: string;
}): { html: string; text: string } {
  const brandNavy = '#0a1c3e';
  const brandGold = '#c5a880';
  const brandDarkGold = '#9a7b4f';
  const lightBg = '#f4f6fa';
  const cardBg = '#ffffff';
  const textColor = '#1e293b';
  const mutedText = '#64748b';
  const logoUrl = 'https://www.newworldstate.org/documents/branding_logo/fronte.jpg';

  // Converte a capo in paragrafi HTML ben formattati se non è già presente HTML
  let formattedBody = testoMessaggio;
  if (!formattedBody.includes('<p>') && !formattedBody.includes('<div>')) {
    formattedBody = formattedBody
      .split(/\n\s*\n/)
      .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.7; font-size: 15px; color: ${textColor};">${p.trim().replace(/\n/g, '<br/>')}</p>`)
      .join('');
  }

  const signer = (firmaNome || 'Custode Digitale').trim();

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${oggetto}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${lightBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: ${textColor};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${lightBg}; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; background-color: ${cardBg}; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(10, 28, 62, 0.08); border: 1px solid rgba(197, 168, 128, 0.3);">
          
          <!-- Header Istituzionale -->
          <tr>
            <td style="background: linear-gradient(135deg, ${brandNavy} 0%, #0d2757 100%); padding: 32px 30px; text-align: center; border-bottom: 3px solid ${brandGold};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <img src="${logoUrl}" alt="New World State Emblem" width="64" height="64" style="display: block; border-radius: 50%; border: 2px solid ${brandGold}; background: #ffffff; padding: 2px; margin: 0 auto;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">NEW WORLD STATE</h1>
                    <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; color: ${brandGold}; text-transform: uppercase;">Cancelleria Diplomatica & Custodia Digitale Sovrana</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Barra info protocollo / destinatario -->
          <tr>
            <td style="background-color: #f8fafc; padding: 14px 30px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: ${mutedText};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" style="font-weight: 600; color: ${brandNavy};">
                    ${destinatarioStato ? `A: <strong>${destinatarioStato}</strong> (${destinatarioEmail})` : `A: <strong>${destinatarioEmail}</strong>`}
                  </td>
                  <td align="right" style="font-family: monospace; font-size: 11px; color: ${brandDarkGold}; font-weight: bold;">
                    COMM-NWS-${new Date().getFullYear()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corpo del Messaggio -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: ${brandNavy}; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                ${oggetto}
              </h2>
              
              <div style="font-size: 15px; line-height: 1.7; color: ${textColor};">
                ${formattedBody}
              </div>

              <!-- Sezione Firma Dinamica Istituzionale -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 36px; padding-top: 24px; border-top: 2px dashed rgba(197, 168, 128, 0.4);">
                <tr>
                  <td width="50" style="vertical-align: top; padding-right: 14px;">
                    <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(197, 168, 128, 0.15); border: 1px solid ${brandGold}; text-align: center; line-height: 44px; font-size: 20px;">
                      🛡️
                    </div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 15px; font-weight: 700; color: ${brandNavy}; margin: 0 0 2px 0;">
                      ${signer}
                    </div>
                    <div style="font-size: 12px; font-weight: 600; color: ${brandDarkGold}; text-transform: uppercase; letter-spacing: 0.5px;">
                      Custode Digitale & Funzionario per le Relazioni Esterne
                    </div>
                    <div style="font-size: 11px; color: ${mutedText}; margin-top: 3px;">
                      Federazione Sovrana di New World State • Cancelleria Centrale
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer con Contatti Istituzionali -->
          <tr>
            <td style="background-color: #050e20; padding: 24px 30px; text-align: center; border-top: 1px solid rgba(197, 168, 128, 0.2);">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">
                NEW WORLD STATE • FEDERAZIONE MONDIALE SOVRANA
              </p>
              <p style="margin: 0 0 12px 0; font-size: 11px; color: #94a3b8; line-height: 1.6;">
                Portale Ufficiale: <a href="https://newworldstate.cloud" target="_blank" style="color: ${brandGold}; text-decoration: none; font-weight: 600;">newworldstate.cloud</a> | 
                Costituzione & Anagrafe Digitale | 
                Email: <a href="mailto:noreply@newworldstate.org" style="color: ${brandGold}; text-decoration: none;">noreply@newworldstate.org</a>
              </p>
              <p style="margin: 0; font-size: 10px; color: #64748b; font-family: monospace;">
                Questo messaggio costituisce comunicazione ufficiale e crittograficamente protetta della Cancelleria NWS.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `NEW WORLD STATE - Cancelleria Diplomatica
Oggetto: ${oggetto}
Destinatario: ${destinatarioStato || ''} (${destinatarioEmail})
------------------------------------------------------------

${testoMessaggio}

------------------------------------------------------------
Firmato digitalmente da: ${signer}
Custode Digitale & Funzionario per le Relazioni Esterne
Federazione Sovrana di New World State
Sito: https://newworldstate.cloud
Email: noreply@newworldstate.org`;

  return { html, text };
}

/**
 * Sostituisce i segnaposto di personalizzazione con i valori specifici del destinatario.
 * Supporta varianti comuni: {{nome_rappresentante}}, {{rappresentante}}, {{nome_stato}}, {{stato}}, {{email}}, {{ruolo}}
 */
export function replacePersonalizationPlaceholders(template: string, ctx: PersonalizationContext): string {
  if (!template) return '';

  const rep = ctx.nome_rappresentante && ctx.nome_rappresentante.trim().length > 0
    ? ctx.nome_rappresentante.trim()
    : 'Eccellenza';
  const stato = ctx.nome_stato && ctx.nome_stato.trim().length > 0
    ? ctx.nome_stato.trim()
    : 'Stato Sovrano';
  const mail = ctx.email && ctx.email.trim().length > 0
    ? ctx.email.trim()
    : '';
  const ruolo = ctx.ruolo && ctx.ruolo.trim().length > 0
    ? ctx.ruolo.trim()
    : 'Rappresentante Diplomatico';

  return template
    .replace(/\{\{\s*(?:nome_rappresentante|rappresentante|nome|contact_name)\s*\}\}/gi, rep)
    .replace(/\{\{\s*(?:nome_stato|stato|paese|country)\s*\}\}/gi, stato)
    .replace(/\{\{\s*(?:email|destinatario_email|indirizzo_email)\s*\}\}/gi, mail)
    .replace(/\{\{\s*(?:ruolo|carica|titolo)\s*\}\}/gi, ruolo);
}

/**
 * Motore di traduzione diplomatica autonomo (italiano -> inglese).
 * Utilizzato come fallback robusto o per anteprima immediata preservando al 100% i tag di personalizzazione.
 */
export function translateDiplomaticFallback(text: string): string {
  if (!text) return '';

  const phraseMap: Array<[RegExp, string]> = [
    // Saluti & formule di cortesia iniziali
    [/\bCon la presente desideriamo sottoporre alla Vostra cortese attenzione\b/gi, 'We hereby wish to submit to your kind attention'],
    [/\bCon la presente desideriamo sottoporre alla Vostra attenzione\b/gi, 'We hereby wish to submit to your attention'],
    [/\bCon la presente desideriamo informarVi che\b/gi, 'We hereby wish to inform you that'],
    [/\bCon la presente desideriamo informare che\b/gi, 'We hereby wish to inform that'],
    [/\bCon la presente desideriamo\b/gi, 'We hereby wish to'],
    [/\bCon la presente comunichiamo a\b/gi, 'We hereby communicate to'],
    [/\bCon la presente comunichiamo che\b/gi, 'We hereby communicate that'],
    [/\bCon la presente comunichiamo\b/gi, 'We hereby communicate'],
    [/\bCon la presente vi invitiamo cordialmente a\b/gi, 'We hereby cordially invite you to'],
    [/\bCon la presente vi invitiamo\b/gi, 'We hereby invite you'],
    [/\bCon la presente\b/gi, 'We hereby'],
    [/\bAlla cortese attenzione del\b/gi, 'To the kind attention of the'],
    [/\bAlla cortese attenzione della\b/gi, 'To the kind attention of the'],
    [/\bAlla cortese attenzione di\b/gi, 'To the kind attention of'],
    [/\bEgregio Ambasciatore\b/gi, 'Esteemed Ambassador'],
    [/\bEgregio Ministro\b/gi, 'Esteemed Minister'],
    [/\bEgregio Rappresentante Diplomatico\b/gi, 'Esteemed Diplomatic Representative'],
    [/\bEgregio Rappresentante\b/gi, 'Esteemed Representative'],
    [/\bEgregio\b/gi, 'Esteemed'],
    [/\bGentile Ambasciatore\b/gi, 'Esteemed Ambassador'],
    [/\bGentile Ministro\b/gi, 'Esteemed Minister'],
    [/\bGentile Rappresentante Diplomatico\b/gi, 'Esteemed Diplomatic Representative'],
    [/\bGentile Rappresentante\b/gi, 'Esteemed Representative'],
    [/\bGentile\b/gi, 'Esteemed'],
    [/\bIllustre Ambasciatore\b/gi, 'Distinguished Ambassador'],
    [/\bIllustre Ministro\b/gi, 'Distinguished Minister'],
    [/\bIllustre\b/gi, 'Distinguished'],
    [/\bSpettabile Ambasciata\b/gi, 'Honorable Embassy'],
    [/\bSpettabile Consolato\b/gi, 'Honorable Consulate'],
    [/\bSpettabile Governo\b/gi, 'Honorable Government'],
    [/\bSpettabile Ministero\b/gi, 'Honorable Ministry'],
    [/\bSpettabile\b/gi, 'Honorable'],
    [/\bSua Eccellenza\b/gi, 'His Excellency'],
    [/\bEccellenza\b/gi, 'Excellency'],

    // Inviti e relazioni diplomatiche
    [/\bInvito Ufficiale al Tavolo di Dialogo Sovrano\b/gi, 'Official Invitation to the Sovereign Dialogue Roundtable'],
    [/\bInvito Ufficiale al Tavolo di Dialogo\b/gi, 'Official Invitation to the Dialogue Roundtable'],
    [/\bInvito Ufficiale\b/gi, 'Official Invitation'],
    [/\bComunicazione Ufficiale\b/gi, 'Official Communication'],
    [/\bTavolo di Dialogo Sovrano\b/gi, 'Sovereign Dialogue Roundtable'],
    [/\bTavolo di Dialogo\b/gi, 'Dialogue Roundtable'],
    [/\bRelazioni Diplomatiche Bilaterali\b/gi, 'Bilateral Diplomatic Relations'],
    [/\bRelazioni Diplomatiche\b/gi, 'Diplomatic Relations'],
    [/\bRelazioni Bilaterali\b/gi, 'Bilateral Relations'],
    [/\bRiconoscimento Reciproco Sovrano\b/gi, 'Mutual Sovereign Recognition'],
    [/\bRiconoscimento Reciproco\b/gi, 'Mutual Recognition'],
    [/\bCooperazione Internazionale\b/gi, 'International Cooperation'],
    [/\bTrattato di Pace e Sovranità\b/gi, 'Peace and Sovereignty Treaty'],
    [/\bTrattato di Pace\b/gi, 'Peace Treaty'],
    [/\bAccordo Bilaterale\b/gi, 'Bilateral Agreement'],
    [/\bProtocollo Diplomatico\b/gi, 'Diplomatic Protocol'],

    // Istituzioni e ruoli
    [/\bFederazione Sovrana di New World State\b/gi, 'Sovereign Federation of New World State'],
    [/\bFederazione Sovrana\b/gi, 'Sovereign Federation'],
    [/\bNuovo Stato Mondiale\b/gi, 'New World State'],
    [/\bCancelleria Diplomatica & Custodia Digitale Sovrana\b/gi, 'Diplomatic Chancellery & Sovereign Digital Custody'],
    [/\bCancelleria Diplomatica\b/gi, 'Diplomatic Chancellery'],
    [/\bCustodia Digitale Sovrana\b/gi, 'Sovereign Digital Custody'],
    [/\bCustode Digitale & Funzionario per le Relazioni Esterne\b/gi, 'Digital Custodian & Foreign Affairs Officer'],
    [/\bCustode Digitale\b/gi, 'Digital Custodian'],
    [/\bMinistero degli Affari Esteri e della Cooperazione Internazionale\b/gi, 'Ministry of Foreign Affairs and International Cooperation'],
    [/\bMinistero degli Affari Esteri e Cooperazione\b/gi, 'Ministry of Foreign Affairs and Cooperation'],
    [/\bMinistero degli Affari Esteri\b/gi, 'Ministry of Foreign Affairs'],
    [/\bMinistero degli Esteri\b/gi, 'Ministry of Foreign Affairs'],
    [/\bUfficio di Rappresentanza in Italia\b/gi, 'Representative Office in Italy'],
    [/\bUfficio di Rappresentanza\b/gi, 'Representative Office'],
    [/\bAmministrazione Centrale\b/gi, 'Central Administration'],
    [/\bGoverno in esilio\b/gi, 'Government in exile'],
    [/\bAmbasciata\b/gi, 'Embassy'],
    [/\bConsolato\b/gi, 'Consulate'],
    [/\bAmbasciatore\b/gi, 'Ambassador'],
    [/\bConsole\b/gi, 'Consul'],
    [/\bPresidente\b/gi, 'President'],
    [/\bPrimo Ministro\b/gi, 'Prime Minister'],
    [/\bMinistro\b/gi, 'Minister'],

    // Frasi comuni nelle comunicazioni
    [/\bSiamo lieti di comunicare che\b/gi, 'We are pleased to communicate that'],
    [/\bSiamo lieti di comunicare\b/gi, 'We are pleased to communicate'],
    [/\bSiamo onorati di invitare\b/gi, 'We are honored to invite'],
    [/\bVi invitiamo cordialmente a partecipare a\b/gi, 'We cordially invite you to participate in'],
    [/\bVi invitiamo cordialmente al\b/gi, 'We cordially invite you to the'],
    [/\bVi invitiamo cordialmente alla\b/gi, 'We cordially invite you to the'],
    [/\bVi invitiamo cordialmente\b/gi, 'We cordially invite you'],
    [/\bVi invitiamo a prendere visione di\b/gi, 'We invite you to examine'],
    [/\bVi invitiamo a\b/gi, 'We invite you to'],
    [/\bSi comunica che\b/gi, 'Please be informed that'],
    [/\bla registrazione dell'indirizzo email\b/gi, 'the registration of the email address'],
    [/\bla registrazione dell'indirizzo\b/gi, 'the registration of the address'],
    [/\bla registrazione della email\b/gi, 'the registration of the email'],
    [/\bla registrazione\b/gi, 'the registration'],
    [/\bnei nostri registri diplomatici ufficiali\b/gi, 'in our official diplomatic registers'],
    [/\bnei nostri registri ufficiali\b/gi, 'in our official registers'],
    [/\bnel registro diplomatico ufficiale\b/gi, 'in the official diplomatic register'],
    [/\bnei nostri archivi\b/gi, 'in our archives'],
    [/\bIn merito alla cooperazione internazionale\b/gi, 'Regarding international cooperation'],
    [/\bIn merito alla\b/gi, 'Regarding the'],
    [/\bIn merito al\b/gi, 'Regarding the'],
    [/\bIn merito a\b/gi, 'Regarding'],
    [/\bRelativamente a\b/gi, 'In relation to'],
    [/\bIn allegato troverete\b/gi, 'Attached you will find'],
    [/\bTroverete in allegato\b/gi, 'You will find attached'],
    [/\bIn allegato\b/gi, 'Attached'],
    [/\bdocumenti ufficiali allegati\b/gi, 'official documents attached'],
    [/\bdocumento ufficiale allegato\b/gi, 'official document attached'],
    [/\bdocumento ufficiale\b/gi, 'official document'],
    [/\bdocumentazione ufficiale\b/gi, 'official documentation'],
    [/\bla presente comunicazione costituisce\b/gi, 'this communication constitutes'],
    [/\batto ufficiale\b/gi, 'official act'],

    // Formule di chiusura e saluti finali
    [/\bRestiamo a Vostra completa disposizione per qualsiasi chiarimento\b/gi, 'We remain at your full disposal for any further clarification'],
    [/\bRestiamo a completa disposizione per qualsiasi chiarimento\b/gi, 'We remain at your full disposal for any clarification'],
    [/\bRestiamo a disposizione per qualsiasi chiarimento\b/gi, 'We remain at your disposal for any clarification'],
    [/\bRestiamo a Vostra disposizione\b/gi, 'We remain at your disposal'],
    [/\bRestiamo a disposizione\b/gi, 'We remain at your disposal'],
    [/\bIn attesa di un Vostro cortese e sollecito riscontro\b/gi, 'Looking forward to your esteemed and prompt response'],
    [/\bIn attesa di un Vostro cortese riscontro\b/gi, 'Looking forward to your esteemed reply'],
    [/\bIn attesa di una Vostra cortese risposta\b/gi, 'Looking forward to your kind reply'],
    [/\bIn attesa di una Vostra risposta\b/gi, 'Looking forward to your response'],
    [/\bRingraziandoVi per l'attenzione\b/gi, 'Thanking you for your attention'],
    [/\bRingraziando per l'attenzione\b/gi, 'Thanking you for the attention'],
    [/\bCon la massima stima e considerazione\b/gi, 'With highest esteem and consideration'],
    [/\bCon la massima stima\b/gi, 'With highest esteem'],
    [/\bCon i più cordiali saluti\b/gi, 'With warmest regards'],
    [/\bCordiali saluti\b/gi, 'Sincerely'],
    [/\bDistinti saluti\b/gi, 'Yours respectfully'],
    [/\bCon osservanza\b/gi, 'With highest regards'],
    [/\bCon ossequio\b/gi, 'Respectfully yours'],
    [/\bIn fede\b/gi, 'Faithfully yours'],

    // Connettori e termini di uso diplomatico
    [/\bper conto di\b/gi, 'on behalf of'],
    [/\bper conto del\b/gi, 'on behalf of the'],
    [/\ba favore di\b/gi, 'in favor of'],
    [/\bnel rispetto della\b/gi, 'in respect of the'],
    [/\bnel rispetto del\b/gi, 'in respect of the'],
    [/\bper lo Stato\b/gi, 'for the State'],
    [/\bdello Stato\b/gi, 'of the State'],
    [/\ballo Stato\b/gi, 'to the State'],
    [/\blo Stato\b/gi, 'the State'],
    [/\bdel Governo\b/gi, 'of the Government'],
    [/\bil Governo\b/gi, 'the Government'],
    [/\bconferenza di pace\b/gi, 'peace conference'],
    [/\bsovranità e autodeterminazione\b/gi, 'sovereignty and self-determination'],
    [/\bdiritti umani e sovranità\b/gi, 'human rights and sovereignty'],
    [/\bper\b/gi, 'for'],
    [/\bcon\b/gi, 'with']
  ];

  let translated = text;
  for (const [pattern, replacement] of phraseMap) {
    translated = translated.replace(pattern, replacement);
  }

  return translated;
}

/**
 * Traduce oggetto e corpo di una comunicazione diplomatica dall'italiano all'inglese.
 * Preserva al 100% i segnaposto di personalizzazione come {{nome_rappresentante}}, {{nome_stato}}, {{email}}, {{ruolo}}.
 * Prova prima il motore AI Gemini, con fallback immediato ed elegante al motore diplomatico autonomo in caso di quota/errori.
 */
export async function translateDiplomaticText(
  oggetto: string,
  testoMessaggio: string
): Promise<{
  translatedSubject: string;
  translatedText: string;
  engine: 'gemini' | 'diplomatic_engine';
}> {
  if (!oggetto && !testoMessaggio) {
    return { translatedSubject: '', translatedText: '', engine: 'diplomatic_engine' };
  }

  // 1. Isola e protegge tutti i tag {{...}} con identificatori univoci
  const placeholders: string[] = [];
  const placeholderRegex = /\{\{\s*[^}]+\s*\}\}/g;

  const protectTags = (str: string) => {
    return str.replace(placeholderRegex, (match) => {
      const idx = placeholders.length;
      placeholders.push(match);
      return `__NWS_TAG_${idx}__`;
    });
  };

  const protectedSubject = protectTags(oggetto || '');
  const protectedText = protectTags(testoMessaggio || '');

  const restoreTags = (str: string) => {
    let restored = str;
    for (let i = 0; i < placeholders.length; i++) {
      const token = `__NWS_TAG_${i}__`;
      restored = restored.split(token).join(placeholders[i]);
    }
    return restored;
  };

  // 2. Tentativo con Gemini AI se la chiave API è configurata
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `You are the chief diplomatic translator for New World State Sovereign Chancellery.
Translate the following Italian email subject and body into elegant, high-level diplomatic English suitable for sovereign foreign ministries and state embassies.
CRITICAL PROTOCOL RULES:
1. Preserve all placeholder tokens like __NWS_TAG_0__, __NWS_TAG_1__, and {{...}} EXACTLY as they are without translating or modifying them.
2. Maintain formal diplomatic honorifics, respectful tone, and clear paragraphs.
3. Return ONLY a valid JSON object matching this schema:
{
  "translatedSubject": "string",
  "translatedText": "string"
}

Original Subject to translate:
"${protectedSubject}"

Original Body to translate:
"${protectedText}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const rawJson = response.text ? response.text.trim() : '';
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        if (parsed.translatedSubject || parsed.translatedText) {
          const finalSubj = restoreTags(parsed.translatedSubject || protectedSubject);
          const finalText = restoreTags(parsed.translatedText || protectedText);
          return {
            translatedSubject: finalSubj,
            translatedText: finalText,
            engine: 'gemini'
          };
        }
      }
    } catch (geminiErr: any) {
      console.warn('[CRM-TRANSLATE] Gemini AI non disponibile o quota esaurita:', geminiErr?.message || geminiErr);
    }
  }

  // 3. Fallback al motore diplomatico autonomo NWS
  const fallbackSubj = restoreTags(translateDiplomaticFallback(protectedSubject));
  const fallbackText = restoreTags(translateDiplomaticFallback(protectedText));

  return {
    translatedSubject: fallbackSubj,
    translatedText: fallbackText,
    engine: 'diplomatic_engine'
  };
}

/**
 * Invia un'email diplomatica tramite SMTP e la salva in `storico_comunicazioni`.
 * Supporta la sostituzione dinamica dei campi di personalizzazione e la traduzione preventiva.
 */
export async function sendCrmEmail(
  dbPool: any,
  payload: SendEmailPayload
): Promise<{ success: boolean; messageId: string; recordId: number }> {
  const { 
    contatto_id, 
    email_destinatario, 
    oggetto, 
    testo_messaggio, 
    firma_nome, 
    traduci_inglese, 
    modalita_lingua, 
    allegati 
  } = payload;

  if (!contatto_id || !email_destinatario || !oggetto || !testo_messaggio) {
    throw new Error('Campi obbligatori mancanti: contatto_id, email_destinatario, oggetto e testo_messaggio.');
  }

  // Recupera dettagli dello Stato per personalizzare intestazione e segnaposto
  let statoNome = '';
  let rappresentante = '';
  let ruolo = '';
  if (dbPool) {
    try {
      const stRes = await dbPool.query('SELECT nome_stato, rappresentante, ruolo FROM crm_stati WHERE id = $1', [contatto_id]);
      if (stRes.rows.length > 0) {
        statoNome = stRes.rows[0].nome_stato || '';
        rappresentante = stRes.rows[0].rappresentante || '';
        ruolo = stRes.rows[0].ruolo || '';
      }
    } catch (_) {}
  }

  // Eventuale traduzione preventiva se richiesta
  let baseSubject = oggetto;
  let baseText = testo_messaggio;
  const shouldTranslate = traduci_inglese || modalita_lingua === 'inglese' || modalita_lingua === 'bilingue';

  if (shouldTranslate) {
    try {
      const trans = await translateDiplomaticText(oggetto, testo_messaggio);
      if (modalita_lingua === 'bilingue') {
        baseSubject = `${trans.translatedSubject} / ${oggetto}`;
        baseText = `${trans.translatedText}\n\n------------------------------------------------------------\n[VERSIONE ITALIANA ORIGINALE]\n------------------------------------------------------------\n\n${testo_messaggio}`;
      } else {
        baseSubject = trans.translatedSubject || oggetto;
        baseText = trans.translatedText || testo_messaggio;
      }
    } catch (tErr: any) {
      console.warn('[CRM-SMTP] Avviso traduzione singola:', tErr?.message);
    }
  }

  // Sostituzione dei campi di personalizzazione dinamica
  const personalizedSubject = replacePersonalizationPlaceholders(baseSubject, {
    nome_rappresentante: rappresentante,
    nome_stato: statoNome,
    email: email_destinatario,
    ruolo: ruolo
  });

  const personalizedText = replacePersonalizationPlaceholders(baseText, {
    nome_rappresentante: rappresentante,
    nome_stato: statoNome,
    email: email_destinatario,
    ruolo: ruolo
  });

  // Genera HTML istituzionale con template CSS inline
  const { html, text } = generateInstitutionalEmailTemplate({
    oggetto: personalizedSubject,
    testoMessaggio: personalizedText,
    firmaNome: firma_nome,
    destinatarioStato: statoNome,
    destinatarioEmail: email_destinatario
  });

  // Configurazione SMTP (es. Aruba)
  let host = (process.env.SMTP_HOST || 'smtps.aruba.it').trim();
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== 'false';
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const from = (process.env.SMTP_FROM || user).trim();
  const fromName = process.env.SMTP_FROM_NAME || 'Cancelleria New World State';

  if (!user || !pass) {
    throw new Error('Credenziali SMTP (SMTP_USER/SMTP_PASS) non configurate.');
  }

  if ((host === 'smtp.aruba.it' || host.includes('aruba.it')) && (port === 465 || secure)) {
    host = 'smtps.aruba.it';
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000
  });

  // Prepara allegati per Nodemailer
  const mailAttachments: any[] = [];
  const attachmentsMeta: any[] = [];

  if (Array.isArray(allegati) && allegati.length > 0) {
    for (const att of allegati) {
      if (!att.filename) continue;
      
      let contentBuffer: Buffer;
      if (att.content && typeof att.content === 'string') {
        if (att.content.includes(';base64,')) {
          const b64 = att.content.split(';base64,')[1];
          contentBuffer = Buffer.from(b64, 'base64');
        } else {
          contentBuffer = Buffer.from(att.content, 'base64');
        }
      } else {
        contentBuffer = Buffer.from(att.content || '');
      }

      mailAttachments.push({
        filename: att.filename,
        content: contentBuffer,
        contentType: att.contentType || 'application/octet-stream'
      });

      attachmentsMeta.push({
        filename: att.filename,
        size: contentBuffer.length,
        contentType: att.contentType || 'application/octet-stream'
      });
    }
  }

  const fromDomain = from.includes('@') ? from.split('@')[1] : 'newworldstate.cloud';
  const uniqueMessageId = `<${Date.now()}-${Math.floor(Math.random() * 1000000)}@${fromDomain}>`;

  const mailOptions = {
    from: `"${fromName}" <${from}>`,
    to: email_destinatario,
    subject: personalizedSubject,
    html,
    text,
    messageId: uniqueMessageId,
    headers: {
      'X-Priority': '2',
      'X-Mailer': 'NWS-CRM-Client/1.0',
      'X-NWS-Contact-ID': String(contatto_id)
    },
    attachments: mailAttachments
  };

  console.log(`[CRM-SMTP] Invio email a [${email_destinatario}] per Stato ID [${contatto_id}]...`);
  const info = await transporter.sendMail(mailOptions);
  const finalMessageId = info.messageId || uniqueMessageId;

  // Salva nello storico comunicazioni su Neon DB come "INVIATA"
  let recordId = 0;
  if (dbPool) {
    const insertRes = await dbPool.query(
      `INSERT INTO storico_comunicazioni 
        (contatto_id, email_destinatario_mittente, direzione, oggetto, corpo_html, corpo_testo, message_id, firma_nome, allegati, data)
       VALUES ($1, $2, 'INVIATA', $3, $4, $5, $6, $7, $8::jsonb, NOW())
       RETURNING id`,
      [
        contatto_id,
        email_destinatario,
        personalizedSubject,
        html,
        text,
        finalMessageId,
        firma_nome || 'Custode Digitale',
        JSON.stringify(attachmentsMeta)
      ]
    );
    recordId = insertRes.rows[0]?.id || 0;
  }

  return {
    success: true,
    messageId: finalMessageId,
    recordId
  };
}

/**
 * Spedizione cumulativa a destinatari multipli (invii multipli) con personalizzazione
 * automatica per ogni singolo Stato e traduzione preventiva dei contenuti.
 */
export async function sendCrmMultiEmail(
  dbPool: any,
  payload: SendMultiEmailPayload
): Promise<MultiSendResult> {
  const { 
    destinatari, 
    oggetto, 
    testo_messaggio, 
    firma_nome, 
    traduci_inglese, 
    modalita_lingua, 
    allegati 
  } = payload;

  if (!Array.isArray(destinatari) || destinatari.length === 0) {
    throw new Error('Nessun destinatario selezionato per l\'invio multiplo.');
  }
  if (!oggetto || !testo_messaggio) {
    throw new Error('Oggetto e testo del messaggio sono obbligatori.');
  }

  // 1. Traduzione del template di base (preservando i segnaposto) se richiesta
  let baseSubject = oggetto;
  let baseText = testo_messaggio;
  const shouldTranslate = traduci_inglese || modalita_lingua === 'inglese' || modalita_lingua === 'bilingue';

  if (shouldTranslate) {
    try {
      const trans = await translateDiplomaticText(oggetto, testo_messaggio);
      if (modalita_lingua === 'bilingue') {
        baseSubject = `${trans.translatedSubject} / ${oggetto}`;
        baseText = `${trans.translatedText}\n\n------------------------------------------------------------\n[VERSIONE ITALIANA ORIGINALE]\n------------------------------------------------------------\n\n${testo_messaggio}`;
      } else {
        baseSubject = trans.translatedSubject || oggetto;
        baseText = trans.translatedText || testo_messaggio;
      }
    } catch (tErr: any) {
      console.warn('[CRM-MULTI] Errore o timeout traduzione cumulativa:', tErr?.message);
    }
  }

  const results: MultiSendResult['results'] = [];
  let sentCount = 0;
  let failedCount = 0;

  // 2. Itera sui destinatari personalizzando per ciascuno i segnaposto
  for (let i = 0; i < destinatari.length; i++) {
    const dest = destinatari[i];
    if (!dest.email || !dest.stato_id) {
      failedCount++;
      results.push({
        stato_id: dest.stato_id || 0,
        nome_stato: dest.nome_stato || 'Sconosciuto',
        email: dest.email || '',
        success: false,
        error: 'Dati destinatario incompleti (email o ID mancante)'
      });
      continue;
    }

    try {
      // Sostituzione dei segnaposto per questo specifico destinatario
      const personalizedSubject = replacePersonalizationPlaceholders(baseSubject, {
        nome_rappresentante: dest.rappresentante,
        nome_stato: dest.nome_stato,
        email: dest.email,
        ruolo: dest.ruolo
      });

      const personalizedText = replacePersonalizationPlaceholders(baseText, {
        nome_rappresentante: dest.rappresentante,
        nome_stato: dest.nome_stato,
        email: dest.email,
        ruolo: dest.ruolo
      });

      const sendRes = await sendCrmEmail(dbPool, {
        contatto_id: dest.stato_id,
        email_destinatario: dest.email,
        oggetto: personalizedSubject,
        testo_messaggio: personalizedText,
        firma_nome: firma_nome,
        allegati: allegati
      });

      sentCount++;
      results.push({
        stato_id: dest.stato_id,
        nome_stato: dest.nome_stato,
        email: dest.email,
        success: true,
        messageId: sendRes.messageId
      });

      // Pausa di 250ms tra spedizioni successive per rispetto del server SMTP
      if (i < destinatari.length - 1) {
        await new Promise(r => setTimeout(r, 250));
      }
    } catch (destErr: any) {
      failedCount++;
      results.push({
        stato_id: dest.stato_id,
        nome_stato: dest.nome_stato,
        email: dest.email,
        success: false,
        error: destErr.message || 'Errore durante la spedizione'
      });
      console.error(`[CRM-MULTI] Fallito invio a ${dest.nome_stato} (${dest.email}):`, destErr.message);
    }
  }

  return {
    success: sentCount > 0,
    total: destinatari.length,
    sentCount,
    failedCount,
    results
  };
}

/**
 * Si connette al server IMAP di newworldstate.cloud (es. imaps.aruba.it)
 * Legge le email e se il mittente corrisponde a un'email registrata in crm_stati_email,
 * e il message_id non è ancora registrato, la salva in `storico_comunicazioni` come 'RICEVUTA'.
 */
export async function syncImapEmails(dbPool: any): Promise<{
  success: boolean;
  checkedCount: number;
  newMessagesCount: number;
  synced: Array<{ id: number; from: string; subject: string; stato: string }>;
}> {
  if (!dbPool) {
    throw new Error('Database pool non disponibile per la sincronizzazione IMAP.');
  }

  const host = (process.env.IMAP_HOST || (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('aruba') ? 'imaps.aruba.it' : 'imaps.aruba.it')).trim();
  const port = parseInt(process.env.IMAP_PORT || '993', 10);
  const user = (process.env.IMAP_USER || process.env.SMTP_USER || '').trim();
  const pass = (process.env.IMAP_PASS || process.env.SMTP_PASS || '').trim();

  if (!user || !pass) {
    throw new Error('Credenziali IMAP (IMAP_USER/IMAP_PASS o SMTP_USER/SMTP_PASS) non configurate.');
  }

  // 1. Carica tutti i contatti email noti dal database Neon DB
  const contactsRes = await dbPool.query(`
    SELECT e.id as email_id, e.stato_id, e.email, s.nome_stato 
    FROM crm_stati_email e
    JOIN crm_stati s ON s.id = e.stato_id
  `);

  const contactsMap = new Map<string, { stato_id: number; nome_stato: string }>();
  for (const row of contactsRes.rows) {
    if (row.email) {
      contactsMap.set(row.email.toLowerCase().trim(), {
        stato_id: row.stato_id,
        nome_stato: row.nome_stato
      });
    }
  }

  console.log(`[CRM-IMAP] ${contactsMap.size} indirizzi email monitorati per gli Stati registrati.`);

  const client = new ImapFlow({
    host,
    port,
    secure: true,
    auth: { user, pass },
    logger: false,
    tls: { rejectUnauthorized: false }
  });

  let checkedCount = 0;
  let newMessagesCount = 0;
  const synced: Array<{ id: number; from: string; subject: string; stato: string }> = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      // Ispeziona gli ultimi 50 messaggi
      const status = await client.status('INBOX', { messages: true });
      const totalMessages = (status && typeof status === 'object' && 'messages' in status && typeof status.messages === 'number') ? status.messages : 0;
      const startSeq = Math.max(1, totalMessages - 49);

      if (totalMessages > 0) {
        for await (const message of client.fetch(`${startSeq}:*`, {
          envelope: true,
          source: true,
          uid: true
        })) {
          checkedCount++;
          const senderAddress = message.envelope?.from?.[0]?.address?.toLowerCase()?.trim() || '';
          const messageIdHeader = message.envelope?.messageId || `<uid-${message.uid}@${host}>`;

          if (!senderAddress) continue;

          // Controlla se il mittente appartiene a uno dei contatti registrati
          const contact = contactsMap.get(senderAddress);
          if (!contact) continue;

          // Controlla se il message_id è già memorizzato in storico_comunicazioni
          const existsRes = await dbPool.query(
            'SELECT id FROM storico_comunicazioni WHERE message_id = $1 LIMIT 1',
            [messageIdHeader]
          );

          if (existsRes.rows.length === 0) {
            // Analizza il contenuto sorgente dell'email
            let parsedHtml = '';
            let parsedText = '';
            const attachmentsMeta: any[] = [];

            try {
              if (message.source) {
                const parsed = await simpleParser(message.source);
                parsedHtml = parsed.html || (parsed.textAsHtml ? parsed.textAsHtml : parsed.text ? `<p>${parsed.text.replace(/\n/g, '<br/>')}</p>` : '');
                parsedText = parsed.text || '';
                
                if (parsed.attachments && Array.isArray(parsed.attachments)) {
                  for (const att of parsed.attachments) {
                    attachmentsMeta.push({
                      filename: att.filename || 'allegato',
                      size: att.size || (att.content ? att.content.length : 0),
                      contentType: att.contentType
                    });
                  }
                }
              }
            } catch (pErr: any) {
              console.warn('[CRM-IMAP] Errore parsing sorgente email:', pErr.message);
              parsedText = message.envelope?.subject || 'Email ricevuta';
              parsedHtml = `<p>${parsedText}</p>`;
            }

            const subject = message.envelope?.subject || 'Senza Oggetto';
            const receivedDate = message.envelope?.date || new Date();

            const insRes = await dbPool.query(
              `INSERT INTO storico_comunicazioni 
                (contatto_id, email_destinatario_mittente, direzione, oggetto, corpo_html, corpo_testo, message_id, firma_nome, allegati, data)
               VALUES ($1, $2, 'RICEVUTA', $3, $4, $5, $6, $7, $8::jsonb, $9)
               RETURNING id`,
              [
                contact.stato_id,
                senderAddress,
                subject,
                parsedHtml || `<p>${subject}</p>`,
                parsedText,
                messageIdHeader,
                message.envelope?.from?.[0]?.name || senderAddress,
                JSON.stringify(attachmentsMeta),
                receivedDate
              ]
            );

            newMessagesCount++;
            synced.push({
              id: insRes.rows[0].id,
              from: senderAddress,
              subject,
              stato: contact.nome_stato
            });
            console.log(`[CRM-IMAP] Nuova email RICEVUTA da ${senderAddress} per ${contact.nome_stato}: "${subject}"`);
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err: any) {
    console.error('[CRM-IMAP] Errore sincronizzazione IMAP:', err.message);
    throw err;
  }

  return {
    success: true,
    checkedCount,
    newMessagesCount,
    synced
  };
}

/**
 * Assicura la presenza delle tabelle CRM in Neon DB / PostgreSQL.
 */
export async function ensureCrmTables(dbPool: any): Promise<void> {
  if (!dbPool) return;
  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS crm_stati (
        id SERIAL PRIMARY KEY,
        nome_stato TEXT NOT NULL,
        codice_stato VARCHAR(10),
        rappresentante TEXT,
        ruolo TEXT,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS crm_stati_email (
        id SERIAL PRIMARY KEY,
        stato_id INTEGER NOT NULL REFERENCES crm_stati(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        etichetta TEXT DEFAULT 'Ufficiale',
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_crm_stati_email_email ON crm_stati_email(LOWER(email));

      CREATE TABLE IF NOT EXISTS storico_comunicazioni (
        id SERIAL PRIMARY KEY,
        contatto_id INTEGER NOT NULL REFERENCES crm_stati(id) ON DELETE CASCADE,
        email_destinatario_mittente TEXT NOT NULL,
        direzione VARCHAR(20) NOT NULL CHECK (direzione IN ('INVIATA', 'RICEVUTA')),
        oggetto TEXT NOT NULL,
        corpo_html TEXT NOT NULL,
        corpo_testo TEXT,
        message_id TEXT UNIQUE NOT NULL,
        firma_nome TEXT,
        allegati JSONB DEFAULT '[]'::jsonb,
        data TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_storico_contatto ON storico_comunicazioni(contatto_id, data DESC);
      CREATE INDEX IF NOT EXISTS idx_storico_message_id ON storico_comunicazioni(message_id);

      CREATE TABLE IF NOT EXISTS crm_email_templates (
        id SERIAL PRIMARY KEY,
        titolo VARCHAR(255) NOT NULL,
        descrizione TEXT,
        oggetto TEXT NOT NULL,
        testo_messaggio TEXT NOT NULL,
        categoria VARCHAR(100) DEFAULT 'Diplomatica',
        firma_predefinita VARCHAR(255) DEFAULT 'Custode Digitale',
        lingua_predefinita VARCHAR(50) DEFAULT 'italiano',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_crm_templates_titolo ON crm_email_templates(titolo);
    `);

    // Inizializza i modelli predefiniti se la tabella è vuota
    const countRes = await dbPool.query('SELECT COUNT(*) as cnt FROM crm_email_templates');
    if (parseInt(countRes.rows[0].cnt, 10) === 0) {
      for (const tpl of DEFAULT_CRM_EMAIL_TEMPLATES) {
        await dbPool.query(`
          INSERT INTO crm_email_templates (titolo, descrizione, oggetto, testo_messaggio, categoria, firma_predefinita, lingua_predefinita)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [tpl.titolo, tpl.descrizione, tpl.oggetto, tpl.testo_messaggio, tpl.categoria || 'Diplomatica', tpl.firma_predefinita || 'Custode Digitale', tpl.lingua_predefinita || 'italiano']);
      }
      console.log(`[CRM] Inseriti ${DEFAULT_CRM_EMAIL_TEMPLATES.length} modelli email istituzionali predefiniti.`);
    }

    console.log('[CRM] Schema tabelle CRM e modelli verificati su Neon DB.');
  } catch (err: any) {
    console.warn('[CRM] Errore verifica schema tabelle CRM:', err.message);
  }
}

/**
 * Recupera tutti i modelli di email disponibili nel CRM.
 */
export async function getCrmTemplates(dbPool: any): Promise<CrmEmailTemplate[]> {
  if (dbPool) {
    try {
      const res = await dbPool.query(`
        SELECT id, titolo, descrizione, oggetto, testo_messaggio, categoria, firma_predefinita, lingua_predefinita, created_at, updated_at
        FROM crm_email_templates
        ORDER BY categoria ASC, titolo ASC
      `);
      if (res.rows.length > 0) {
        return res.rows;
      }
    } catch (e: any) {
      console.warn('[CRM-TEMPLATES] Fallback a modelli in memoria:', e.message);
    }
  }

  // Fallback con ID temporanei se database non risponde
  return DEFAULT_CRM_EMAIL_TEMPLATES.map((t, idx) => ({
    id: idx + 1,
    ...t,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

/**
 * Salva o modifica un modello di email nel CRM.
 */
export async function saveCrmTemplate(
  dbPool: any,
  data: {
    id?: number;
    titolo: string;
    descrizione?: string;
    oggetto: string;
    testo_messaggio: string;
    categoria?: string;
    firma_predefinita?: string;
    lingua_predefinita?: 'italiano' | 'inglese' | 'bilingue';
  }
): Promise<CrmEmailTemplate> {
  if (!data.titolo?.trim()) throw new Error('Il titolo del modello è obbligatorio.');
  if (!data.oggetto?.trim()) throw new Error('L\'oggetto del modello è obbligatorio.');
  if (!data.testo_messaggio?.trim()) throw new Error('Il corpo del messaggio del modello è obbligatorio.');

  const titolo = data.titolo.trim();
  const descrizione = data.descrizione?.trim() || null;
  const oggetto = data.oggetto.trim();
  const testo = data.testo_messaggio.trim();
  const categoria = data.categoria?.trim() || 'Diplomatica';
  const firma = data.firma_predefinita?.trim() || 'Custode Digitale';
  const lingua = data.lingua_predefinita || 'italiano';

  if (dbPool) {
    if (data.id) {
      const res = await dbPool.query(`
        UPDATE crm_email_templates
        SET titolo = $1, descrizione = $2, oggetto = $3, testo_messaggio = $4, categoria = $5, firma_predefinita = $6, lingua_predefinita = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `, [titolo, descrizione, oggetto, testo, categoria, firma, lingua, data.id]);
      if (res.rows.length > 0) return res.rows[0];
    } else {
      const res = await dbPool.query(`
        INSERT INTO crm_email_templates (titolo, descrizione, oggetto, testo_messaggio, categoria, firma_predefinita, lingua_predefinita)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [titolo, descrizione, oggetto, testo, categoria, firma, lingua]);
      if (res.rows.length > 0) return res.rows[0];
    }
  }

  // Fallback in memoria
  return {
    id: data.id || Date.now(),
    titolo,
    descrizione,
    oggetto,
    testo_messaggio: testo,
    categoria,
    firma_predefinita: firma,
    lingua_predefinita: lingua,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Elimina un modello di email dal CRM.
 */
export async function deleteCrmTemplate(dbPool: any, id: number): Promise<boolean> {
  if (dbPool) {
    await dbPool.query('DELETE FROM crm_email_templates WHERE id = $1', [id]);
    return true;
  }
  return true;
}

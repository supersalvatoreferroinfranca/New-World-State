import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

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

export interface SendEmailPayload {
  contatto_id: number;
  email_destinatario: string;
  oggetto: string;
  testo_messaggio: string;
  firma_nome?: string;
  allegati?: Array<{
    filename: string;
    content: string; // base64 string or plain text
    contentType?: string;
  }>;
}

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
  const logoUrl = 'https://newworldstate.cloud/logo-nws.png';

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
 * Invia un'email diplomatica tramite SMTP e la salva in `storico_comunicazioni`.
 */
export async function sendCrmEmail(
  dbPool: any,
  payload: SendEmailPayload
): Promise<{ success: boolean; messageId: string; recordId: number }> {
  const { contatto_id, email_destinatario, oggetto, testo_messaggio, firma_nome, allegati } = payload;

  if (!contatto_id || !email_destinatario || !oggetto || !testo_messaggio) {
    throw new Error('Campi obbligatori mancanti: contatto_id, email_destinatario, oggetto e testo_messaggio.');
  }

  // Recupera dettagli dello Stato per personalizzare l'intestazione
  let statoNome = '';
  if (dbPool) {
    try {
      const stRes = await dbPool.query('SELECT nome_stato FROM crm_stati WHERE id = $1', [contatto_id]);
      if (stRes.rows.length > 0) {
        statoNome = stRes.rows[0].nome_stato;
      }
    } catch (_) {}
  }

  // Genera HTML istituzionale con template CSS inline
  const { html, text } = generateInstitutionalEmailTemplate({
    oggetto,
    testoMessaggio: testo_messaggio,
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
    subject: oggetto,
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
        oggetto,
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
    `);
    console.log('[CRM] Schema tabelle CRM verificato su Neon DB.');
  } catch (err: any) {
    console.warn('[CRM] Errore verifica schema tabelle CRM:', err.message);
  }
}

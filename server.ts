import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

// Fix for __dirname in both ESM and CJS bundled environments
let __filename_val: string;
let __dirname_val: string;

try {
  __filename_val = fileURLToPath(import.meta.url);
  __dirname_val = path.dirname(__filename_val);
} catch (e) {
  // Fallback for CJS environments where import.meta is not available
  __filename_val = '';
  __dirname_val = process.cwd();
}

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;
    const distPath = path.resolve(process.cwd(), 'dist');

    console.log(`[SERVER] Starting - Mode: ${isProd ? 'Production' : 'Development'}`);
    console.log(`[SERVER] Static assets path: ${distPath}`);

    // Logging middleware
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
      });
      next();
    });

    app.use(express.json({ limit: '10mb' }));

    // Helper per inviare email tramite SMTP (es. Aruba)
    async function sendLocalSmtpEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }) {
      const host = process.env.SMTP_HOST || 'smtps.aruba.it';
      const port = parseInt(process.env.SMTP_PORT || '465', 10);
      const secure = process.env.SMTP_SECURE !== 'false'; // di default true per la porta 465
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      // For SPF/DKIM alignment with Aruba servers, we default the From address strictly to the SMTP authenticated user
      const from = process.env.SMTP_FROM || user;
      const fromName = process.env.SMTP_FROM_NAME || 'Anagrafe New World State';

      if (!user || !pass) {
        throw new Error('Le credenziali SMTP (SMTP_USER/SMTP_PASS) non sono state configurate nel file .env');
      }

      console.log(`[SMTP] Spedizione a [${to}] via [${host}:${port}] (SSL: ${secure}) usando [${user}]...`);

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Genera una versione in testo semplice pulito se non fornita per bypassare i filtri antispam (SPF/DKIM/MIME check)
      const plainTextFallback = text || html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const mailOptions = {
        from: `"${fromName}" <${from}>`,
        to,
        subject,
        html,
        text: plainTextFallback,
        headers: {
          'List-Unsubscribe': `<mailto:${from}?subject=unsubscribe>`,
          'Precedence': 'bulk',
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
        }
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Email inviata con successo! MessageId: ${info.messageId}`);
      return info;
    }

    // API Router
    const apiRouter = express.Router();

    apiRouter.get('/ping', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'Express server is responding' });
    });

    apiRouter.get('/debug', (req, res) => {
      const routes: string[] = [];
      app._router.stack.forEach((middleware: any) => {
        if (middleware.route) { // routes registered directly on the app
          routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
        } else if (middleware.name === 'router') { // router middleware
          middleware.handle.stack.forEach((handler: any) => {
            if (handler.route) {
              const path = handler.route.path;
              routes.push(`${Object.keys(handler.route.methods).join(',').toUpperCase()} /api${path}`);
            }
          });
        }
      });
      res.json({
        isProd,
        nodeEnv: process.env.NODE_ENV,
        cwd: process.cwd(),
        distPath,
        routes
      });
    });

    apiRouter.get('/db-status', async (req, res) => {
      console.log('[API] Processing /api/db-status');
      const WORKER_URL = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev/api/db-status';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const workerRes = await fetch(WORKER_URL, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        console.log(`[API] Worker responded with status: ${workerRes.status}`);
        
        if (workerRes.ok) {
          const data = await workerRes.json();
          return res.json({ 
            status: 'connected', 
            message: 'Connesso al Database Worker (NWS-WK).',
            worker_data: data
          });
        } else {
          return res.status(workerRes.status).json({ 
            status: 'error', 
            message: `Il Worker Database ha risposto con codice ${workerRes.status}.` 
          });
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error('[API] Error reaching worker status:', err.name === 'AbortError' ? 'Timeout' : err.message);
        return res.status(502).json({ 
          status: 'error', 
          message: err.name === 'AbortError' ? 'Timeout comunicazione worker' : 'Impossibile raggiungere il Worker Database (NWS-WK).', 
          details: err.message 
        });
      }
    });

    apiRouter.get('/lookup/location', async (req, res) => {
      const { q, type, lat, lon } = req.query;
      if (!q && (!lat || !lon)) return res.status(400).json({ error: 'Query parameter q or (lat and lon) is required' });

      try {
        let url: string;
        if (q) {
          url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q as string)}&addressdetails=1&limit=5`;
          if (lat && lon) {
            url += `&viewbox=${Number(lon)-0.5},${Number(lat)+0.5},${Number(lon)+0.5},${Number(lat)-0.5}`;
          }
          if (type === 'country') url += '&featuretype=country';
          if (type === 'city') url += '&featuretype=city';
        } else {
          url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
        }

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'WorldRegistrationApp/1.0 (contact: supersalvatoreferroinfranca@gmail.com)', 
            'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'application/json'
          }
        });

        const contentType = response.headers.get('content-type');
        if (!response.ok || !contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Nominatim proxy error response:', {
            status: response.status,
            statusText: response.statusText,
            body: text.slice(0, 200)
          });
          return res.status(response.status).json({ error: 'Nominatim service error', details: text.slice(0, 100) });
        }

        const data = await response.json();
        res.json(data);
      } catch (err) {
        console.error('Nominatim proxy error:', err);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
      }
    });

    apiRouter.post('/register', async (req, res) => {
      const WORKER_URL = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev/api/register';
      console.log('--- PROXYING REGISTRAZIONE AL WORKER ---');
      try {
        const workerRes = await fetch(WORKER_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(req.body),
        });

        const contentType = workerRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await workerRes.json();
          console.log(`[API] Worker registration reply: ${workerRes.status}`);

          // Se la registrazione sul Worker ha successo e l'ambiente locale ha anch'esso SMTP/Uploader,
          // eseguiamo un backup locale, altrimenti il Worker gestirà il flusso primario.
          if (data.success) {
            const {
              documentFrontData,
              documentFrontName,
              documentBackData,
              documentBackName,
              ...serializablePayload
            } = req.body;

            let arubaFrontUrl = '';
            let arubaBackUrl = '';

            // Se l'uploader di Aruba è configurato, carichiamo i file fisici dello spazio infinito tramite il bridge PHP
            if (process.env.ARUBA_UPLOADER_URL && process.env.ARUBA_UPLOADER_KEY && documentFrontData) {
              console.log('[ARUBA-UPLOADER] Tentativo di caricamento file sul server fisico Aruba tramite bridge...');
              try {
                const uploaderRes = await fetch(process.env.ARUBA_UPLOADER_URL, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.ARUBA_UPLOADER_KEY}`
                  },
                  body: JSON.stringify({
                    key: process.env.ARUBA_UPLOADER_KEY,
                    username: serializablePayload.username || 'unknown',
                    documentFrontData,
                    documentFrontName,
                    documentBackData,
                    documentBackName
                  })
                });

                if (uploaderRes.ok) {
                  const uploaderData: any = await uploaderRes.json();
                  if (uploaderData.success && uploaderData.files) {
                    arubaFrontUrl = uploaderData.files.front || '';
                    arubaBackUrl = uploaderData.files.back || '';
                    console.log('[ARUBA-UPLOADER] Documenti memorizzati correttamente su Aruba:', uploaderData.files);
                  } else {
                    console.error('[ARUBA-UPLOADER] Errore risposta bridge PHP:', uploaderData.message);
                  }
                } else {
                  console.error('[ARUBA-UPLOADER] Errore di comunicazione HTTP:', uploaderRes.status, await uploaderRes.text());
                }
              } catch (upErr: any) {
                console.error('[ARUBA-UPLOADER] Eccezione riscontrata durante il caricamento:', upErr.message);
              }
            }

            if (process.env.SMTP_USER) {
              console.log('[SMTP] Registro inserito. Avvio spedizione email via SMTP...');
              try {
                const citizenId = data.id || 'N/A';
                const { 
                  surname, firstName, gender, birthDate, birthPlace, birthCountry,
                  citizenship, maritalStatus, residenceAddress, residenceNumber, residenceZip, 
                  residenceCity, residenceProvince, residenceCountry, email, phonePrefix, phoneNumber,
                  username, password, documentHash, documentType,
                  plusCode, locationDescription, latitude, longitude,
                  isAmbassador, isPeacekeeper 
                } = serializablePayload;

                const adminEmail = process.env.ADMIN_EMAIL || 'supersalvatoreferroinfranca@gmail.com';
                const brandColor = '#0a1c3e';
                const lightBg = '#f8fafc';
                const normalizedUsername = username ? username.toLowerCase().replace(/\s/g, '') : 'Registrato con email/tel';

                const adminHtml = `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: ${lightBg}; border-radius: 16px;">
                    <div style="background-color: ${brandColor}; padding: 30px; border-radius: 12px; text-align: center; color: white;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: white;">Nuovo Cittadino Registrato</h1>
                      <p style="margin: 5px 0 0 0; color: #93c5fd; font-size: 14px;">Richiesta id #${citizenId} (Aruba SMTP Direct)</p>
                    </div>
                    
                    <div style="padding: 24px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                      <h2 style="font-size: 18px; color: ${brandColor}; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 0;">Anagrafica Richiedente</h2>
                      
                      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; line-height: 1.8;">
                        <tr><td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Cognome e Nome:</strong></td><td style="padding: 6px 0; font-weight: 600;">${surname || ''} ${firstName || ''}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Sesso:</strong></td><td style="padding: 6px 0;">${gender || ''}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Data di Nascita:</strong></td><td style="padding: 6px 0;">${birthDate || 'Non fornito'}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Luogo di Nascita:</strong></td><td style="padding: 6px 0;">${birthPlace || ''} (${birthCountry || ''})</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Cittadinanza Attuale:</strong></td><td style="padding: 6px 0;">${citizenship || ''}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Stato Civile:</strong></td><td style="padding: 6px 0;">${maritalStatus || ''}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Email del Cittadino:</strong></td><td style="padding: 6px 0; font-weight: 600; color: #2563eb;"><a href="mailto:${email || ''}">${email || 'Nessuna'}</a></td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Telefono:</strong></td><td style="padding: 6px 0;">${phonePrefix || ''} ${phoneNumber || 'Nessuno'}</td></tr>
                      </table>
  
                      <h2 style="font-size: 18px; color: ${brandColor}; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 24px;">Localizzazione Geografica</h2>
                      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; line-height: 1.8;">
                        <tr><td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Indirizzo Residenza:</strong></td><td style="padding: 6px 0;">${residenceAddress || ''}, ${residenceNumber || ''}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>CAP / Città:</strong></td><td style="padding: 6px 0;">${residenceZip || ''} - ${residenceCity || ''} (${residenceProvince || ''})</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Stato Residenza:</strong></td><td style="padding: 6px 0;">${residenceCountry || ''}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Coordinate:</strong></td><td style="padding: 6px 0; font-family: monospace; font-size: 13px;">lat: ${latitude || 0}, lon: ${longitude || 0}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Plus Code:</strong></td><td style="padding: 6px 0; font-family: monospace; color: #0f766e; font-weight: 600;">${plusCode || ''}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Descrizione Luogo:</strong></td><td style="padding: 6px 0; font-style: italic;">"${locationDescription || ''}"</td></tr>
                      </table>
  
                      <h2 style="font-size: 18px; color: ${brandColor}; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 24px;">Credenziali ed Opzioni</h2>
                      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; line-height: 1.8;">
                        <tr><td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Username:</strong></td><td style="padding: 6px 0; font-family: monospace;">${normalizedUsername}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Hash Documento:</strong></td><td style="padding: 6px 0; font-family: monospace; font-size: 11px; word-break: break-all;">${documentHash || ''}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Tipo Documento:</strong></td><td style="padding: 6px 0;">${documentType || ''}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>File Fisici su Aruba:</strong></td><td style="padding: 6px 0;">
                          ${arubaFrontUrl ? `<a href="${arubaFrontUrl}" target="_blank" style="color: #2563eb; font-weight: bold; text-decoration: underline; margin-right: 12px;">Visualizza Fronte</a>` : ''}
                          ${arubaBackUrl ? `<a href="${arubaBackUrl}" target="_blank" style="color: #2563eb; font-weight: bold; text-decoration: underline;">Visualizza Retro</a>` : ''}
                          ${!arubaFrontUrl && !arubaBackUrl ? '<span style="color: #94a3b8; font-style: italic;">Nessuno (Uploader non config.)</span>' : ''}
                        </td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Candidato Ambasciatore:</strong></td><td style="padding: 6px 0; font-weight: 600; color: ${isAmbassador ? '#15803d' : '#64748b'};">${isAmbassador ? 'SÌ' : 'NO'}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;"><strong>Candidato Peacekeeper:</strong></td><td style="padding: 6px 0; font-weight: 600; color: ${isPeacekeeper ? '#15803d' : '#64748b'};">${isPeacekeeper ? 'SÌ' : 'NO'}</td></tr>
                      </table>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8;">
                      Questo è un messaggio automatico generato dal server di New World State.
                    </div>
                  </div>
                `;

              const citizenHtml = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: ${lightBg}; border-radius: 16px;">
                  <div style="background-color: ${brandColor}; padding: 40px 30px; border-radius: 12px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; color: white;">Richiesta Registrata!</h1>
                    <p style="margin: 10px 0 0 0; color: #93c5fd; font-size: 16px;">Benvenuto nel registro mondiale del New World State</p>
                  </div>
                  
                  <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; line-height: 1.6;">
                    <p style="font-size: 16px; margin-top: 0;">Caro/a <strong>${firstName || ''} ${surname || ''}</strong>,</p>
                    
                    <p style="font-size: 15px;">Siamo felici di comunicarti che la tua richiesta per ottenere la cittadinanza del <strong>New World State</strong> è stata correttamente acquisita dal nostro sistema anagrafico.</p>
                    
                    <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin: 24px 0;">
                      <h3 style="margin: 0 0 5px 0; color: #14532d; font-size: 14px; font-weight: 700;">PROSSIMO PASSO: VALIDAZIONE</h3>
                      <p style="margin: 0; color: #166534; font-size: 13px;">Un cittadino incaricato (Validatore NWS) verificherà la conformità delle informazioni fornite e l'hash di firma del documento di identità da te registrato.</p>
                    </div>

                    <h3 style="font-size: 15px; color: ${brandColor}; margin-top: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Riepilogo Dati Registrati</h3>
                    <ul style="padding-left: 20px; margin: 10px 0; font-size: 14px; color: #475569;">
                      <li><strong>Plus Code Posizione:</strong> <span style="font-family: monospace; color: #0f766e; font-weight: 600;">${plusCode || '-'}</span></li>
                      <li><strong>Luogo e Nazione:</strong> ${birthPlace || ''} (${birthCountry || ''})</li>
                      <li><strong>Stato Cittadinanza Richiesta:</strong> ${citizenship || ''}</li>
                      <li><strong>Indirizzo Residenza:</strong> ${residenceAddress || ''}, ${residenceNumber || ''} - ${residenceCity || ''}</li>
                      <li><strong>Tipologia Documento Fornito:</strong> ${documentType || '-'}</li>
                    </ul>
                    
                    <p style="font-size: 14px; margin-top: 24px;">Al termine della procedura di verifica dei dati, riceverai una seconda comunicazione email di inserimento definitivo nel registro, contenente il link per scaricare il tuo <strong>Certificato di Cittadinanza Digitale</strong>.</p>
                    
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                    
                    <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
                      <em>"Uniti nello spazio, legati per diritto."</em><br/>
                      <strong>Ufficio dell'Anagrafe Federale del New World State</strong>
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8;">
                    Ricevi questa email perché hai espresso la volontà di registrarti sul portale ufficiale di New World State. Se non eri tu, puoi ignorare questo messaggio.
                  </div>
                </div>
              `;

              const citizenText = `
Caro/a ${firstName || ''} ${surname || ''},

Siamo felici di comunicarti che la tua richiesta per ottenere la cittadinanza del New World State è stata correttamente acquisita dal nostro sistema anagrafico.

=== PROSSIMO PASSO: VALIDAZIONE ===
Un cittadino incaricato (Validatore NWS) verificherà la conformità delle informazioni fornite e l'hash di firma del documento di identità da te registrato.

RIEPILOGO DATI REGISTRATI:
- Plus Code Posizione: ${plusCode || '-'}
- Luogo e Nazione di Nascita: ${birthPlace || ''} (${birthCountry || ''})
- Stato Cittadinanza Richiesta: ${citizenship || ''}
- Indirizzo Residenza: ${residenceAddress || ''}, ${residenceNumber || ''} - ${residenceCity || ''}
- Tipologia Documento Fornito: ${documentType || '-'}

Al termine della procedura di verifica dei dati, riceverai una seconda comunicazione email di inserimento definitivo nel registro, contenente il link per scaricare il tuo Certificato di Cittadinanza Digitale.

"Uniti nello spazio, legati per diritto."
Ufficio dell'Anagrafe Federale del New World State
`;

              // Invio simultaneo delle email
              const emailPromises = [];
              
              // Invia all'amministratore
              emailPromises.push(
                sendLocalSmtpEmail({
                  to: adminEmail,
                  subject: `[NWS-ANAGRAFE] Nuova richiesta di cittadinanza: ${surname} ${firstName}`,
                  html: adminHtml
                })
              );

              // Invia al cittadino registrato
              if (email && email.includes('@')) {
                emailPromises.push(
                  sendLocalSmtpEmail({
                    to: email.trim(),
                    subject: 'Registrazione ricevuta - New World State',
                    html: citizenHtml,
                    text: citizenText
                  })
                );
              }

              await Promise.all(emailPromises);
              console.log('[SMTP] Entrambe le email sono state inoltrate con successo.');
            } catch (smtpErr: any) {
              console.error('[SMTP] Errore riscontrato durante l\'invio SMTP da Express:', smtpErr.message);
              // Non blocchiamo la risposta HTTP se l'email fallisce, poiché l'utente si è registrato con successo nel database
            }
          }

          } // Chiusura di if (data.success)

          return res.status(workerRes.status).json(data);
        } else {
          const text = await workerRes.text();
          console.error(`[API] Worker registration returned non-JSON: ${text.slice(0, 200)}`);
          return res.status(workerRes.status).json({ 
            success: false, 
            message: 'Risposta worker non valida (non JSON)', 
            details: text.slice(0, 100) 
          });
        }
      } catch (error: any) {
        console.error('Registration Proxy Error:', error.message);
        return res.status(502).json({ 
          success: false, 
          message: 'Errore durante la comunicazione con il Database Worker.',
          details: error.message
        });
      }
    });

    apiRouter.get('/test-email', async (req, res) => {
      // In ambiente locale/Express, se abbiamo configurato Aruba SMTP, eseguiamo direttamente l'invio locale!
      if (process.env.SMTP_USER) {
        console.log('[SMTP] Test Email diretta via Aruba/SMTP...');
        try {
          const adminEmail = process.env.ADMIN_EMAIL || 'supersalvatoreferroinfranca@gmail.com';
          const testHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; line-height: 1.6;">
              <h1 style="color: #0a1c3e; font-size: 20px; margin-top: 0;">Test Server SMTP Aruba</h1>
              <p>Congratulazioni! Questo messaggio conferma che l'integrazione SMTP con il tuo server di posta di Aruba è configurato correttamente.</p>
              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 13px; margin: 15px 0;">
                <strong style="display: block; margin-bottom: 5px; color: #0a1c3e;">Configurazione Rilevata da Express:</strong>
                <ul style="margin: 0; padding-left: 20px; color: #475569;">
                  <li><strong>Host:</strong> ${process.env.SMTP_HOST || 'smtps.aruba.it'}</li>
                  <li><strong>Porta:</strong> ${process.env.SMTP_PORT || '465'}</li>
                  <li><strong>Mittente:</strong> ${process.env.SMTP_FROM || process.env.SMTP_USER}</li>
                  <li><strong>Livello di Sicurezza:</strong> ${process.env.SMTP_SECURE !== 'false' ? 'SSL/TLS' : 'Nessuno/STARTTLS'}</li>
                </ul>
              </div>
              <p style="color: #16a34a; font-weight: bold; margin-bottom: 0;">Il tuo portale anagrafico è ora in grado di spedire notifiche email in tempo reale!</p>
            </div>
          `;

          await sendLocalSmtpEmail({
            to: adminEmail,
            subject: 'Test Aruba SMTP - New World State',
            html: testHtml
          });

          return res.json({ 
            success: true, 
            message: `Servizio Aruba SMTP funzionante! Email spedita con successo a ${adminEmail}.` 
          });
        } catch (smtpErr: any) {
          console.error('[SMTP] Errore test-email via Nodemailer:', smtpErr.message);
          return res.status(500).json({ 
            success: false, 
            message: `Errore SMTP: ${smtpErr.message}` 
          });
        }
      }

      const WORKER_URL = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev/api/test-email';
      console.log('--- PROXYING TEST EMAIL AL WORKER ---');
      try {
        const workerRes = await fetch(WORKER_URL);
        const contentType = workerRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await workerRes.json();
          return res.status(workerRes.status).json(data);
        } else {
          const text = await workerRes.text();
          return res.status(workerRes.status).json({ success: false, message: text });
        }
      } catch (error: any) {
        console.error('Test Email Proxy Error:', error.message);
        return res.status(502).json({ 
          success: false, 
          message: 'Errore durante la comunicazione con il Database Worker per email di test.',
          details: error.message
        });
      }
    });

    // Catch-all for unknown API routes
    apiRouter.all('*', (req, res) => {
      console.warn(`[API] Unmatched route: ${req.method} ${req.url}`);
      res.status(404).json({ error: 'API route not found', path: req.url });
    });

    // Mount API Router before static/fallback
    app.use('/api', apiRouter);

    // Static file serving logic
    if (!isProd) {
      console.log('[SERVER] Starting Vite in middleware mode...');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      console.log(`[SERVER] Serving static files from: ${distPath}`);
      
      app.use(express.static(distPath, {
        index: false
      }));
      
      app.get('*', (req, res, next) => {
        // Skip API routes properly
        if (req.path.startsWith('/api')) {
          console.warn(`[SERVER] API route reached SPA fallback: ${req.method} ${req.path}`);
          return next();
        }
        
        const indexPath = path.join(distPath, 'index.html');
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.error(`[SERVER] Error sending index.html: ${err.message}`);
            res.status(500).send('Errore nel caricamento dell\'applicazione.');
          }
        });
      });
    }

    // Final catch-all for anything else
    app.use((req, res) => {
      console.warn(`[SERVER] Final catch-all hit: ${req.method} ${req.url}`);
      if (req.path.startsWith('/api')) {
        res.status(404).json({ 
          error: 'Not Found', 
          message: `Endpoint ${req.path} non trovato.`,
          path: req.path 
        });
      } else {
        res.status(404).send('Not Found');
      }
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT} (Prod: ${isProd})`);
    });

  } catch (err: any) {
    console.error('--- FATAL SERVER ERROR ---');
    console.error(err);
  }
}

startServer();

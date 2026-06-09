import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import pg from 'pg';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const { Pool } = pg;

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

// Initialize PostgreSQL Connection Pool if DATABASE_URL is available
let dbPool: pg.Pool | null = null;
if (process.env.DATABASE_URL) {
  try {
    const rawUrl = process.env.DATABASE_URL.trim();
    // Clean query parameters from database url to ensure node-postgres SSL works properly
    const cleanUrl = rawUrl.split('?')[0];
    dbPool = new Pool({
      connectionString: cleanUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
    console.log('[DB] PostgreSQL Pool initialized successfully with clean URL.');
    
    // Run self-healing database schema migrations
    runMigrations();
  } catch (err: any) {
    console.error('[DB] Failed to initialize PostgreSQL Pool:', err.message);
  }
} else {
  console.log('[DB] WARNING: DATABASE_URL is not defined. Falling back to memory storage for admin features.');
}

// In-Memory Fallback Database for registered citizens
const memoryCitizens: any[] = [];

async function runMigrations() {
  if (!dbPool) return;
  try {
    console.log('[MIGRATION] Checking schema for citizens table...');
    const client = await dbPool.connect();
    try {
      // Create citizenCode alfanumerico se assente
      await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS "citizenCode" TEXT UNIQUE`);
      // Create rejectionReason se assente
      await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT`);
      // Ensure status column exists
      await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'`);
      // Ensure aruba columns exist for persistent document links
      await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS "arubaFrontUrl" TEXT`);
      await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS "arubaBackUrl" TEXT`);
      await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS "arubaPhotoUrl" TEXT`);
      console.log('[MIGRATION] PostgreSQL Table checked and updated successfully.');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[MIGRATION] Database self-healing warning:', err.message);
  }
}

// Genera un documento PDF ad alta risoluzione con le dimensioni esatte di una ID card (85,60 mm x 53,98 mm)
function generateCitizenIdCardPdf(citizen: any, baseUrl: string = 'https://www.newworldstate.org'): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // 85.60 mm x 53.98 mm in PostScript points. 1 mm = 72 / 25.4 = 2.83464567 points
      const width = 85.60 * 2.83464567; // ~242.65
      const height = 53.98 * 2.83464567; // ~153.01

      const doc = new PDFDocument({
        size: [width, height],
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      const brandColor = '#0a1c3e';
      const goldColor = '#c5a880';
      const lightGray = '#94a3b8';

      // Background color of the card
      doc.rect(0, 0, width, height).fill(brandColor);

      // Gold border
      doc.rect(2, 2, width - 4, height - 4).lineWidth(1.2).stroke(goldColor);

      // Header top bar (nested slightly darker blue rect)
      doc.rect(2, 2, width - 4, 25).fill('#071530');

      // Attempt to load and draw the official logo
      const logoPath = path.join(process.cwd(), 'src', 'components', 'layout', 'logo-nws.png');
      let drawLogo = false;
      try {
        if (fs.existsSync(logoPath)) {
          drawLogo = true;
        }
      } catch (_) {}

      if (drawLogo) {
        try {
          // Centered vertically in the 25pt header space (2pt margin, starts at 5, height 16)
          doc.image(logoPath, 8, 5, { height: 16 });
        } catch (logoErr) {
          console.warn('[PDF] Failed to draw header logo:', logoErr);
          drawLogo = false;
        }
      }

      const textLeftMargin = drawLogo ? 36 : 8;
      
      // Header text
      doc.fillColor(goldColor)
         .fontSize(6)
         .font('Helvetica-Bold')
         .text('NEW WORLD STATE', textLeftMargin, 6, { characterSpacing: 0.5 });
         
      doc.fillColor(lightGray)
         .fontSize(4.2)
         .font('Helvetica')
         .text('SOVEREIGN GLOBAL CITIZENSHIP', textLeftMargin, 14, { characterSpacing: 0.3 });

      doc.fillColor(goldColor)
         .fontSize(8.5)
         .font('Helvetica-Bold')
         .text('ID CARD', width - 60, 8, { width: 52, align: 'right' });

      // Gold line below header
      doc.moveTo(2, 27).lineTo(width - 2, 27).lineWidth(0.8).stroke(goldColor);

      // Left column details (Surname, First Name, Birth, Nationality)
      const textX = 8;
      let textY = 32;
      const colWidth = width * 0.65; // ~157pt

      // Helper to draw text block
      const writeField = (label: string, value: string, fontSize: number, bold: boolean, spacingAfter: number, color: string = 'white') => {
        doc.fillColor(lightGray)
           .fontSize(3.8)
           .font('Helvetica')
           .text(label, textX, textY);
        textY += 4.5;

        doc.fillColor(color)
           .fontSize(fontSize)
           .font(bold ? 'Helvetica-Bold' : 'Helvetica')
           .text(value, textX, textY, { width: colWidth, lineGap: 0, ellipsis: true });
        textY += spacingAfter;
      };

      writeField('COGNOME / SURNAME', (citizen.surname || '').toUpperCase(), 6.5, true, 8);
      writeField('NOME / GIVEN NAMES', (citizen.firstName || 'CITTADINO').toUpperCase(), 6.5, true, 8);
      
      const bDate = citizen.birthDate || 'N/A';
      const bPlace = citizen.birthPlace || '';
      const bCountry = citizen.birthCountry || '';
      const placeString = bPlace ? `${bPlace}${bCountry ? ` (${bCountry})` : ''}` : bCountry || '';
      const birthStr = placeString ? `${bDate} - ${placeString}` : bDate;
      writeField('DATA E LUOGO DI NASCITA / DATE & PLACE OF BIRTH', birthStr.toUpperCase(), 5, false, 7.5);
      
      writeField('CITTADINANZA / NATIONALITY', 'NEW WORLD STATE • SOVEREIGN', 5, true, 4, goldColor);

      // Photo on the right
      const photoWidth = 56;
      const photoHeight = 71;
      const photoX = width - photoWidth - 8; // width - 64
      const photoY = 33;

      doc.rect(photoX, photoY, photoWidth, photoHeight).lineWidth(0.8).stroke(goldColor);
      doc.rect(photoX + 1, photoY + 1, photoWidth - 2, photoHeight - 2).fill('#071530');

      let imageAttached = false;
      const photoUrl = citizen.arubaPhotoUrl || citizen.arubaphotourl;
      if (photoUrl && photoUrl.startsWith('http')) {
        try {
          console.log(`[PDF] Fetching photo for PDF ID Card: ${photoUrl}`);
          const baseWithoutExt = photoUrl.substring(0, photoUrl.lastIndexOf('.'));
          const ext = photoUrl.substring(photoUrl.lastIndexOf('.')).toLowerCase();
          
          const urlsToTry = [photoUrl];
          if (ext === '.jpg') {
            urlsToTry.push(baseWithoutExt + '.png');
            urlsToTry.push(baseWithoutExt + '.jpeg');
          } else if (ext === '.png') {
            urlsToTry.push(baseWithoutExt + '.jpg');
            urlsToTry.push(baseWithoutExt + '.jpeg');
          } else if (ext === '.jpeg') {
            urlsToTry.push(baseWithoutExt + '.jpg');
            urlsToTry.push(baseWithoutExt + '.png');
          } else {
            urlsToTry.push(baseWithoutExt + '.jpg');
            urlsToTry.push(baseWithoutExt + '.png');
            urlsToTry.push(baseWithoutExt + '.jpeg');
          }
          
          const uniqueUrls = [...new Set(urlsToTry)];
          for (const url of uniqueUrls) {
            try {
              console.log(`[PDF] Trial load: ${url}`);
              const imgRes = await fetch(url, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
                },
                signal: AbortSignal.timeout(4000)
              });
              if (imgRes.ok) {
                const arrayBuffer = await imgRes.arrayBuffer();
                const imgBuffer = Buffer.from(arrayBuffer);
                doc.image(imgBuffer, photoX + 1.5, photoY + 1.5, {
                  width: photoWidth - 3,
                  height: photoHeight - 3,
                  fit: [photoWidth - 3, photoHeight - 3],
                  align: 'center',
                  valign: 'center'
                });
                imageAttached = true;
                console.log(`[PDF] Loaded valid photo from: ${url}`);
                break;
              } else {
                console.warn(`[PDF] Fetch failed for ${url} with status: ${imgRes.status}`);
              }
            } catch (fetchErr: any) {
              console.warn(`[PDF] Fetch exception for ${url}:`, fetchErr.message);
            }
          }
        } catch (imgErr: any) {
          console.error('[PDF] Failed to fetch photo for PDF, falling back to text:', imgErr.message);
        }
      }

      if (!imageAttached) {
        doc.fillColor(lightGray)
           .fontSize(4)
           .font('Helvetica-Bold')
           .text('FOTO', photoX, photoY + 25, { width: photoWidth, align: 'center' });
        doc.text('VALIDATA', photoX, photoY + 31, { width: photoWidth, align: 'center' });
      }

      // Dashed separator line near bottom
      const dashY = 114;
      doc.moveTo(4, dashY).lineTo(width - 4, dashY).lineWidth(0.5).dash(2, { space: 2 }).stroke('rgba(197,168,128,0.4)');
      doc.undash();

      // Bottom bar info
      const codeX = 8;
      const codeY = 119;
      doc.fillColor(lightGray)
         .fontSize(3.8)
         .font('Helvetica')
         .text('CODICE CITTADINO / CITIZEN CODE', codeX, codeY);
      
      const citizenCode = citizen.citizenCode || 'N/A';
      doc.fillColor(goldColor)
         .fontSize(8)
         .font('Helvetica-Bold')
         .text(citizenCode, codeX, codeY + 4.5, { characterSpacing: 0.5 });

      // Generate verification QR code linking to database record
      let qrBuffer: Buffer | null = null;
      try {
        const verifyUrl = `${baseUrl}/verify?id=${encodeURIComponent(citizenCode)}`;
        console.log(`[PDF] Generating verification QR code for URL: ${verifyUrl}`);
        qrBuffer = await QRCode.toBuffer(verifyUrl, {
          margin: 1,
          width: 80,
          color: {
            dark: '#071530',
            light: '#ffffff'
          }
        });
      } catch (qrErr: any) {
        console.error('[PDF] Failed to generate validation QR code:', qrErr.message);
      }

      const qrX = width - 33;
      const qrY = 116;
      const qrSize = 25;

      if (qrBuffer) {
        try {
          // Draw neat gold border representing authentication security stamp
          doc.rect(qrX - 0.5, qrY - 0.5, qrSize + 1, qrSize + 1).lineWidth(0.5).stroke(goldColor);
          // Draw white background block underneath
          doc.rect(qrX, qrY, qrSize, qrSize).fill('white');
          // Draw the actual code
          doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
        } catch (drawQrErr: any) {
          console.error('[PDF] Failed to draw QR on PDF:', drawQrErr.message);
        }
      }

      // Digital federal stamp signature (shifted left of the QR code stamp)
      const sigX = width - 142;
      const sigY = 126;
      const docHash = citizen.documentHash || 'VALIDATED';
      const cleanHash = docHash.slice(0, 16).toUpperCase();
      doc.fillColor('#64748b')
         .fontSize(4)
         .font('Courier-Bold')
         .text(`NWS SIGNATURE: ${cleanHash}`, sigX, sigY, { width: 104, align: 'right' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

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
    async function sendLocalSmtpEmail({ to, subject, html, text, attachments }: { to: string; subject: string; html: string; text?: string; attachments?: any[] }) {
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

      const fromDomain = from.includes('@') ? from.split('@')[1] : 'newworldstate.org';
      const cleanMessageId = `<${Date.now()}-${Math.floor(Math.random() * 100000)}@${fromDomain}>`;

      const mailOptions = {
        from: `"${fromName}" <${from}>`,
        to,
        subject,
        html,
        text: plainTextFallback,
        messageId: cleanMessageId,
        headers: {
          'X-Priority': '3',
          'X-Mailer': 'NWS-Federal-Mailer',
        },
        attachments: attachments || []
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
                documentPhotoData,
                documentPhotoName,
                ...serializablePayload
              } = req.body;

              let arubaFrontUrl = '';
              let arubaBackUrl = '';
              let arubaPhotoUrl = '';

              const uploaderUrl = process.env.ARUBA_UPLOADER_URL ? process.env.ARUBA_UPLOADER_URL.trim() : '';
              const uploaderKey = process.env.ARUBA_UPLOADER_KEY ? process.env.ARUBA_UPLOADER_KEY.trim() : '';

              const arubaUsername = data.id ? String(data.id) : (serializablePayload.username || 'unknown');

              // Se l'uploader di Aruba è configurato, carichiamo i file fisici dello spazio infinito tramite il bridge PHP
              if (uploaderUrl && uploaderKey && documentFrontData) {
                console.log('[ARUBA-UPLOADER] Tentativo di caricamento file sul server fisico Aruba tramite bridge...');
                try {
                  const separator = uploaderUrl.includes('?') ? '&' : '?';
                  const targetUrlWithKey = `${uploaderUrl}${separator}key=${encodeURIComponent(uploaderKey)}`;
                  const uploaderRes = await fetch(targetUrlWithKey, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${uploaderKey}`,
                      'X-Aruba-Key': uploaderKey
                    },
                    body: JSON.stringify({
                      key: uploaderKey,
                      username: arubaUsername,
                      documentFrontData,
                      documentFrontName,
                      documentBackData,
                      documentBackName,
                      documentPhotoData,
                      documentPhotoName
                    })
                  });

                  if (uploaderRes.ok) {
                    const uploaderData: any = await uploaderRes.json();
                    if (uploaderData.success && uploaderData.files) {
                      arubaFrontUrl = uploaderData.files.front || '';
                      arubaBackUrl = uploaderData.files.back || '';
                      arubaPhotoUrl = uploaderData.files.photo || '';
                      console.log('[ARUBA-UPLOADER] Documenti e foto memorizzati correttamente su Aruba:', uploaderData.files);
                    }
                  }
                } catch (upErr: any) {
                  console.error('[ARUBA-UPLOADER] Eccezione riscontrata durante il caricamento:', upErr.message);
                }
              }

              const citizenId = data.id || `mem-${Date.now()}`;
              const citizenCode = serializablePayload.citizenCode || 'N/A';
              const normalizedUsername = serializablePayload.username ? serializablePayload.username.toLowerCase().replace(/\s/g, '') : 'cittadino';

              // Sincronizza DB locale PostgreSQL se configurato
              if (dbPool) {
                try {
                  const columns = [
                    '"surname"', '"firstName"', '"gender"', '"birthDate"', '"birthPlace"', '"birthCountry"',
                    '"citizenship"', '"maritalStatus"', '"residenceAddress"', '"residenceNumber"', '"residenceZip"',
                    '"residenceCity"', '"residenceProvince"', '"residenceCountry"', '"email"', '"phonePrefix"',
                    '"phoneNumber"', '"username"', '"password"', '"documentHash"', '"documentType"',
                    '"plusCode"', '"locationDescription"', '"isAmbassador"', '"isPeacekeeper"', 'status', '"citizenCode"',
                    '"arubaFrontUrl"', '"arubaBackUrl"', '"arubaPhotoUrl"'
                  ];
                  
                  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                  const params = [
                    serializablePayload.surname || '',
                    serializablePayload.firstName || '',
                    serializablePayload.gender || 'M',
                    serializablePayload.birthDate || null,
                    serializablePayload.birthPlace || '',
                    serializablePayload.birthCountry || '',
                    serializablePayload.citizenship || '',
                    serializablePayload.maritalStatus || 'Single',
                    serializablePayload.residenceAddress || '',
                    serializablePayload.residenceNumber || '',
                    serializablePayload.residenceZip || '',
                    serializablePayload.residenceCity || '',
                    serializablePayload.residenceProvince || '',
                    serializablePayload.residenceCountry || '',
                    serializablePayload.email || null,
                    serializablePayload.phonePrefix || '+39',
                    serializablePayload.phoneNumber || '',
                    normalizedUsername,
                    serializablePayload.password || '',
                    serializablePayload.documentHash || '',
                    serializablePayload.documentType || 'ID_CARD',
                    serializablePayload.plusCode || '',
                    serializablePayload.locationDescription || '',
                    !!serializablePayload.isAmbassador,
                    !!serializablePayload.isPeacekeeper,
                    'pending',
                    citizenCode,
                    arubaFrontUrl || null,
                    arubaBackUrl || null,
                    arubaPhotoUrl || null
                  ];
                  
                  const qText = `INSERT INTO citizens (${columns.join(', ')}) VALUES (${placeholders}) RETURNING id`;
                  const qRes = await dbPool.query(qText, params);
                  if (qRes.rows[0]) {
                    console.log(`[DB-LOCAL-SYNC] Salvato nel DB locale. ID assegnato: ${qRes.rows[0].id}`);
                    data.id = qRes.rows[0].id; // Usa ID locale per rintracciabilità
                  }
                } catch (localDbErr: any) {
                  console.error('[DB-LOCAL-SYNC-ERR] Eccezione nel salvataggio locale SQL (provo ad aggiornare):', localDbErr.message);
                  try {
                    // Se la riga esiste già (inserita nel worker), proviamo a salvare i link delle foto con un UPDATE
                    const updateQuery = `
                      UPDATE citizens SET
                        "arubaFrontUrl" = COALESCE("arubaFrontUrl", $1),
                        "arubaBackUrl" = COALESCE("arubaBackUrl", $2),
                        "arubaPhotoUrl" = COALESCE("arubaPhotoUrl", $3),
                        "citizenCode" = COALESCE("citizenCode", $4)
                      WHERE "email" = $5 OR "documentHash" = $6
                    `;
                    await dbPool.query(updateQuery, [
                      arubaFrontUrl || null,
                      arubaBackUrl || null,
                      arubaPhotoUrl || null,
                      citizenCode,
                      serializablePayload.email || '',
                      serializablePayload.documentHash || ''
                    ]);
                    console.log('[DB-LOCAL-SYNC-UPDATE] Aggiornato con successo il record esistente con i link fisici Aruba.');
                  } catch (upErr: any) {
                    console.error('[DB-LOCAL-SYNC-UPDATE-ERR] Errore riscontrato durante l\'aggiornamento del record esistente:', upErr.message);
                  }
                }
              }

              // Salva sempre nello store in-memory fallback
              const memoryRecord = {
                id: data.id || citizenId,
                surname: serializablePayload.surname || '',
                firstName: serializablePayload.firstName || '',
                gender: serializablePayload.gender || 'M',
                birthDate: serializablePayload.birthDate || '',
                birthPlace: serializablePayload.birthPlace || '',
                birthCountry: serializablePayload.birthCountry || '',
                citizenship: serializablePayload.citizenship || '',
                maritalStatus: serializablePayload.maritalStatus || 'Single',
                residenceAddress: serializablePayload.residenceAddress || '',
                residenceNumber: serializablePayload.residenceNumber || '',
                residenceZip: serializablePayload.residenceZip || '',
                residenceCity: serializablePayload.residenceCity || '',
                residenceProvince: serializablePayload.residenceProvince || '',
                residenceCountry: serializablePayload.residenceCountry || '',
                email: serializablePayload.email || '',
                phonePrefix: serializablePayload.phonePrefix || '',
                phoneNumber: serializablePayload.phoneNumber || '',
                username: normalizedUsername,
                password: serializablePayload.password || '',
                documentHash: serializablePayload.documentHash || '',
                documentType: serializablePayload.documentType || 'ID_CARD',
                plusCode: serializablePayload.plusCode || '',
                locationDescription: serializablePayload.locationDescription || '',
                isAmbassador: !!serializablePayload.isAmbassador,
                isPeacekeeper: !!serializablePayload.isPeacekeeper,
                citizenCode: citizenCode,
                status: 'pending',
                arubaFrontUrl,
                arubaBackUrl,
                arubaPhotoUrl,
                createdAt: new Date().toISOString()
              };
              memoryCitizens.push(memoryRecord);
              console.log(`[MEM] Registrato in memoria localmente. Totale record: ${memoryCitizens.length}`);

              if (process.env.SMTP_USER) {
                console.log('[SMTP] Registro inserito. Avvio spedizione email via SMTP...');
                try {
                  const finalId = data.id || citizenId;
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
                  const baseUrl = `${req.protocol}://${req.get('host')}`;

                  const adminHtml = `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: ${lightBg}; border-radius: 16px;">
                      <div style="background-color: ${brandColor}; padding: 30px; border-radius: 12px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: white;">Nuovo Cittadino Registrato</h1>
                        <p style="margin: 5px 0 0 0; color: #93c5fd; font-size: 14px;">Richiesta ID #${finalId} (Aruba SMTP Direct)</p>
                      </div>
                      
                      <div style="padding: 24px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                        <h2 style="font-size: 18px; color: ${brandColor}; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 0;">Anagrafica Richiedente</h2>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; line-height: 1.8;">
                          <tr><td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Codice Identificativo:</strong></td><td style="padding: 6px 0; font-weight: bold; font-family: monospace; color: #b45309; font-size: 15px;">${citizenCode}</td></tr>
                          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Cognome e Nome:</strong></td><td style="padding: 6px 0; font-weight: 600;">${surname || ''} ${firstName || ''}</td></tr>
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
                            ${arubaBackUrl ? `<a href="${arubaBackUrl}" target="_blank" style="color: #2563eb; font-weight: bold; text-decoration: underline; margin-right: 12px;">Visualizza Retro</a>` : ''}
                            ${arubaPhotoUrl ? `<a href="${arubaPhotoUrl}" target="_blank" style="color: #10b981; font-weight: bold; text-decoration: underline;">Visualizza Foto Tessera</a>` : ''}
                            ${!arubaFrontUrl && !arubaBackUrl && !arubaPhotoUrl ? '<span style="color: #94a3b8; font-style: italic;">Nessuno (Uploader non config.)</span>' : ''}
                          </td></tr>
                          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Candidato Ambasciatore:</strong></td><td style="padding: 6px 0; font-weight: 600; color: ${isAmbassador ? '#15803d' : '#64748b'};">${isAmbassador ? 'SÌ' : 'NO'}</td></tr>
                          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Candidato Peacekeeper:</strong></td><td style="padding: 6px 0; font-weight: 600; color: ${isPeacekeeper ? '#15803d' : '#64748b'};">${isPeacekeeper ? 'SÌ' : 'NO'}</td></tr>
                        </table>

                        <h2 style="font-size: 18px; color: ${brandColor}; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 24px;">VALIDAZIONE RICHIESTA</h2>
                        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; text-align: center; border: 1px dashed #cbd5e1; margin-top: 10px;">
                          <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569; line-height: 1.5;">Come Amministratore di New World State, puoi convalidare o rifiutare la richiesta del cittadino direttamente tramite i pulsanti di controllo integrati:</p>
                          <div style="display: inline-block; width: 100%;">
                            <a href="${baseUrl}/admin/action?action=approve&id=${finalId}" target="_blank" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 8px; font-size: 13px; margin: 5px; box-shadow: 0 4px 6px rgba(16,185,129,0.15);">APPROVA RICHIESTA</a>
                            <a href="${baseUrl}/admin/action?action=reject&id=${finalId}" target="_blank" style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 8px; font-size: 13px; margin: 5px; box-shadow: 0 4px 6px rgba(239,68,68,0.15);">RIFIUTA RICHIESTA</a>
                          </div>
                        </div>
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
                        
                        <div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 16px; border-radius: 8px; margin: 24px 0;">
                          <h3 style="margin: 0 0 5px 0; color: #78350f; font-size: 14px; font-weight: 750;">CODICE IDENTIFICATIVO RISERVATO</h3>
                          <p style="margin: 0; font-family: monospace; font-size: 15px; font-weight: bold; color: #b45309; letter-spacing: 1px;">${citizenCode}</p>
                        </div>

                        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin: 24px 0;">
                          <h3 style="margin: 0 0 5px 0; color: #14532d; font-size: 14px; font-weight: 700;">PROSSIMO PASSO: VALIDAZIONE</h3>
                          <p style="margin: 0; color: #166534; font-size: 13px;">Un cittadino incaricato (Validatore NWS) verificherà la conformità delle informazioni fornite e l'hash di firma del documento di identità da te registrato.</p>
                        </div>

                        <h3 style="font-size: 15px; color: ${brandColor}; margin-top: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Riepilogo Dati Registrati</h3>
                        <ul style="padding-left: 20px; margin: 10px 0; font-size: 14px; color: #475569;">
                          <li><strong>Codice Identificativo:</strong> <span style="font-family: monospace; color: #b45309; font-weight: bold;">${citizenCode}</span></li>
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

Siamo felici di comunicarti che la tua richiesta per ottenere la cittadinanza del New World State è stata correttamente acquisita dal nostro sistema anagrafico col codice ${citizenCode}.

=== PROSSIMO PASSO: VALIDAZIONE ===
Un cittadino incaricato (Validatore NWS) verificherà la conformità delle informazioni fornite e l'hash di firma del documento di identità da te registrato.

RIEPILOGO DATI REGISTRATI:
- Codice Identificativo: ${citizenCode}
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
                }
              }
            }

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

    // --- ENPOINTS DI AMMINISTRAZIONE LOCALE E VALIDAZIONE ---
    
    // Helper to augment citizen data with self-healing Aruba URLs if missing from DB columns
    function getCitizenWithArubaUrls(cit: any) {
      if (!cit) return cit;
      
      const front = cit.arubaFrontUrl || cit.arubafronturl;
      const back = cit.arubaBackUrl || cit.arubabackurl;
      const photo = cit.arubaPhotoUrl || cit.arubaphotourl;
      
      let arubaBase = 'https://www.newworldstate.org/';
      if (process.env.ARUBA_UPLOADER_URL) {
        const cleanUrl = process.env.ARUBA_UPLOADER_URL.replace(/nws-uploader\.php.*/, '').replace(/uploader\.php.*/, '');
        if (cleanUrl.includes('newworldstate.cloud')) {
          arubaBase = 'https://www.newworldstate.org/';
        } else {
          arubaBase = cleanUrl;
        }
      }
      if (!arubaBase.endsWith('/')) arubaBase += '/';

      const citizenId = cit.id;
      
      const arubaFrontUrl = front || `${arubaBase}documents/${citizenId}/fronte.png`;
      const arubaBackUrl = back || `${arubaBase}documents/${citizenId}/retro.png`;
      const arubaPhotoUrl = photo || `${arubaBase}documents/${citizenId}/foto.jpg`;

      return {
        ...cit,
        arubaFrontUrl,
        arubaBackUrl,
        arubaPhotoUrl,
        arubafronturl: arubaFrontUrl,
        arubabackurl: arubaBackUrl,
        arubaphotourl: arubaPhotoUrl
      };
    }

    // Helper search function
    async function findCitizenById(id: string | number) {
      if (dbPool) {
        try {
          const qRes = await dbPool.query('SELECT * FROM citizens WHERE id = $1', [id]);
          if (qRes.rows.length > 0) {
            return getCitizenWithArubaUrls(qRes.rows[0]);
          }
        } catch (e: any) {
          console.error('[DB-LOCAL-GET-ERR] Fallback to memory search:', e.message);
        }
      }
      const parsedId = String(id);
      const found = memoryCitizens.find(c => String(c.id) === parsedId);
      return found ? getCitizenWithArubaUrls(found) : null;
    }

    // Helper search function by Citizen Code or ID (for verification / QR code validation)
    async function findCitizenByCodeOrId(key: string) {
      const cleanKey = String(key).trim().toUpperCase();
      if (!cleanKey) return null;
      
      // Try searching by ID if it's a numeric digit
      if (/^\d+$/.test(cleanKey)) {
        const byId = await findCitizenById(cleanKey);
        if (byId) return byId;
      }

      if (dbPool) {
        try {
          const qRes = await dbPool.query(
            'SELECT * FROM citizens WHERE UPPER("citizenCode") = $1 OR UPPER(citizen_code) = $1 OR UPPER(citizencode) = $1 OR id::text = $1', 
            [cleanKey]
          );
          if (qRes.rows.length > 0) {
            return getCitizenWithArubaUrls(qRes.rows[0]);
          }
        } catch (e: any) {
          console.error('[DB-LOCAL-GET-BY-CODE-ERR] Fallback to memory search:', e.message);
        }
      }

      // Fallback memory search
      const found = memoryCitizens.find(c => {
        const cCode = c.citizenCode || c.citizencode || c.citizen_code;
        return (cCode && String(cCode).trim().toUpperCase() === cleanKey) || String(c.id) === cleanKey;
      });
      return found ? getCitizenWithArubaUrls(found) : null;
    }

    // Helper status update function
    async function updateCitizenStatus(id: string | number, status: 'approved' | 'rejected', rejectionReason?: string) {
      let updatedRecord: any = null;
      const parsedId = String(id);
      
      // Check if registration already has code
      const existing = await findCitizenById(id);
      let targetCitizenCode = existing?.citizenCode || existing?.citizencode || existing?.citizen_code;

      if (status === 'approved' && (!targetCitizenCode || targetCitizenCode === 'N/A' || targetCitizenCode === 'N/D')) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let newCode = '';
        for (let i = 0; i < 16; i++) {
          if (i > 0 && i % 4 === 0) newCode += '-';
          newCode += chars[Math.floor(Math.random() * chars.length)];
        }
        targetCitizenCode = newCode;
      }
      
      if (dbPool) {
        try {
          // Check if rejectionReason column exists, if not run migration dynamically
          let qRes;
          if (status === 'approved' && targetCitizenCode) {
            qRes = await dbPool.query(
              'UPDATE citizens SET status = $1, "rejectionReason" = $2, "citizenCode" = COALESCE("citizenCode", $3) WHERE id = $4 RETURNING *',
              [status, rejectionReason || null, targetCitizenCode, id]
            );
          } else {
            qRes = await dbPool.query(
              'UPDATE citizens SET status = $1, "rejectionReason" = $2 WHERE id = $3 RETURNING *',
              [status, rejectionReason || null, id]
            );
          }
          if (qRes.rows.length > 0) {
            updatedRecord = qRes.rows[0];
          }
        } catch (e: any) {
          console.error('[DB-LOCAL-UPDATE-ERR] Direct memory update backup:', e.message);
        }
      }
      
      // Update memory store anyway to keep in sync
      const memIdx = memoryCitizens.findIndex(c => String(c.id) === parsedId);
      if (memIdx !== -1) {
        memoryCitizens[memIdx].status = status;
        if (targetCitizenCode) {
          memoryCitizens[memIdx].citizenCode = targetCitizenCode;
        }
        if (rejectionReason) {
          memoryCitizens[memIdx].rejectionReason = rejectionReason;
        } else {
          memoryCitizens[memIdx].rejectionReason = null;
        }
        updatedRecord = memoryCitizens[memIdx];
      } else {
        // If not in memory but we updated DB, save it to memory as fallback
        if (updatedRecord) {
          if (targetCitizenCode) {
            updatedRecord.citizenCode = targetCitizenCode;
          }
          memoryCitizens.push(updatedRecord);
        }
      }
      
      return getCitizenWithArubaUrls(updatedRecord);
    }

    // List all registered citizens
    apiRouter.get('/admin/citizens', async (req, res) => {
      console.log('[API] Processing /api/admin/citizens request - Augmenting with self-healing Aruba URLs');
      if (dbPool) {
        try {
          const qRes = await dbPool.query('SELECT * FROM citizens ORDER BY id DESC');
          const augmented = qRes.rows.map(row => getCitizenWithArubaUrls(row));
          return res.json({ success: true, count: qRes.rows.length, data: augmented });
        } catch (dbErr: any) {
          console.error('[DB-LOCAL-LIST] SQL direct list error, using memory backup:', dbErr.message);
        }
      }
      const augmented = memoryCitizens.map(row => getCitizenWithArubaUrls(row));
      return res.json({ success: true, count: memoryCitizens.length, data: augmented });
    });

    // Approve a citizen & send beautiful sovereign digital ID card via email
    apiRouter.post('/admin/approve', async (req, res) => {
      const { id } = req.body;
      if (!id) return res.status(400).json({ success: false, message: 'ID cittadino mancante.' });

      console.log(`[API] Processing approval for ID: ${id}`);
      const citizen = await findCitizenById(id);
      if (!citizen) return res.status(404).json({ success: false, message: 'Cittadino non trovato.' });

      const updated = await updateCitizenStatus(id, 'approved');
      if (!updated) return res.status(500).json({ success: false, message: 'Impossibile aggiornare lo stato di validazione.' });

      // Determine the real arubaPhotoUrl that actually exists on the Aruba server
      let realPhotoUrl = updated.arubaPhotoUrl || updated.arubaphotourl;
      if (realPhotoUrl && realPhotoUrl.startsWith('http')) {
        const citizenId = updated.id;
        let arubaBase = 'https://www.newworldstate.org/';
        if (process.env.ARUBA_UPLOADER_URL) {
          const cleanUrl = process.env.ARUBA_UPLOADER_URL.replace(/nws-uploader\.php.*/, '').replace(/uploader\.php.*/, '');
          arubaBase = cleanUrl.includes('newworldstate.cloud') ? 'https://www.newworldstate.org/' : cleanUrl;
        }
        if (!arubaBase.endsWith('/')) arubaBase += '/';
        
        const baseNoExt = `${arubaBase}documents/${citizenId}/foto`;
        const testUrls = [baseNoExt + '.png', baseNoExt + '.jpg', baseNoExt + '.jpeg'];
        for (const testUrl of testUrls) {
          try {
            const hRes = await fetch(testUrl, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
            if (hRes.ok) {
              realPhotoUrl = testUrl;
              console.log(`[REAL-PHOTO] Found actual photo URL on Aruba: ${realPhotoUrl}`);
              break;
            }
          } catch (_) {}
        }
        // Save the correct photo URL to database and object for maximum persistence/reproducibility
        updated.arubaPhotoUrl = realPhotoUrl;
        updated.arubaphotourl = realPhotoUrl;
        if (dbPool) {
          try {
            await dbPool.query('UPDATE citizens SET "arubaPhotoUrl" = $1 WHERE id = $2', [realPhotoUrl, id]);
          } catch (dbErr: any) {
            console.error('[DB-ERR] Failed to save corrected photo URL:', dbErr.message);
          }
        }
      }

      // Invia email di benvenuto formattando una splendida ID card
      if (process.env.SMTP_USER) {
        const email = updated.email;
        if (email && email.includes('@')) {
          try {
            const brandColor = '#0a1c3e';
            const goldColor = '#c5a880';
            const code = updated.citizenCode || 'N/A';

            // Genera la ID card fisica come PDF allegato di precisione al millimetro
            console.log('[PDF] Avvio generazione ID Card ufficiale in formato PDF...');
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const pdfBuffer = await generateCitizenIdCardPdf(updated, baseUrl);
            console.log('[PDF] Generazione completata con successo! Dimensione del buffer:', pdfBuffer.length);

            const welcomeHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
                <div style="background-color: ${brandColor}; padding: 40px 30px; border-radius: 12px; text-align: center; color: white; border-bottom: 4px solid ${goldColor};">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: white;">Benvenuto, Cittadino!</h1>
                  <p style="margin: 10px 0 0 0; color: ${goldColor}; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px;">Cittadinanza NWS Approvata</p>
                </div>
                
                <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; line-height: 1.6;">
                  <p style="font-size: 16px; margin-top: 0;">Gentile <strong>${updated.firstName || ''} ${updated.surname || ''}</strong>,</p>
                  
                  <p style="font-size: 15px;">Siamo onorati di darti il benvenuto ufficiale nel <strong>New World State</strong>. Il nostro comitato di validatori ha completato con successo la verifica della tua anagrafica e dei tuoi documenti.</p>
                  
                  <p style="font-size: 15px;">La tua registrazione è ora formalmente inserita nel Registro Fedele della Federazione Mondiale di NWS.</p>
                  
                  <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 18px; border-radius: 8px; margin: 24px 0;">
                    <h4 style="margin: 0 0 5px 0; color: #14532d; font-size: 14px; font-weight: bold; text-transform: uppercase;">CERTIFICATO / ID CARD PDF DA STAMPARE ALLEGATO</h4>
                    <p style="margin: 0; color: #166534; font-size: 13.5px;">
                      In allegato a questa comunicazione trovi la tua <strong>Sovereign ID Card ufficiale in formato PDF pronto per la stampa</strong>. Il file è stato rigidamente formattato per rispettare le proporzioni internazionali standard dello spazio di stampa delle schede tascabili: <strong>Larghezza: 85,60 mm e Altezza: 53,98 mm</strong> (ID-1).
                    </p>
                  </div>

                  <!-- TABELLA DOCUMENTO DI IDENTITA DIGITALE (IDENTITY CARD VISUAL MOCKUP) -->
                  <div style="margin: 30px 0; background-color: ${brandColor}; color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(10,28,62,0.25); border: 2px solid ${goldColor};">
                    <div style="padding: 16px 20px; background-color: #071530; border-bottom: 1.5px solid ${goldColor}; display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: ${goldColor};">NEW WORLD STATE</div>
                        <div style="font-size: 8px; color: #94a3b8; text-transform: uppercase;">Sovereign Global Citizenship</div>
                      </div>
                      <div style="font-size: 18px; color: ${goldColor}; font-weight: bold; text-align: right;">ID CARD PREVIEW</div>
                    </div>
                    
                    <div style="padding: 24px 20px; background-color: ${brandColor}; position: relative;">
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="width: 70%; vertical-align: top; font-size: 12px; font-family: sans-serif;">
                            <table style="width: 100%;">
                              <tr><td style="color: #94a3b8; font-size: 8px; text-transform: uppercase; padding: 1px 0;">Cognome / Surname</td></tr>
                              <tr><td style="font-weight: bold; color: white; font-size: 14px; padding-bottom: 6px;">${updated.surname || ''}</td></tr>
                              
                              <tr><td style="color: #94a3b8; font-size: 8px; text-transform: uppercase; padding: 1px 0;">Nome / Given Names</td></tr>
                              <tr><td style="font-weight: bold; color: white; font-size: 14px; padding-bottom: 6px;">${updated.firstName || ''}</td></tr>
                              
                              <tr><td style="color: #94a3b8; font-size: 8px; text-transform: uppercase; padding: 1px 0;">Data e Luogo di Nascita / Date & Place of Birth</td></tr>
                              <tr><td style="color: white; font-size: 11px; padding-bottom: 6px;">${updated.birthDate || 'N/A'} - ${updated.birthPlace || ''} (${updated.birthCountry || ''})</td></tr>
                              
                              <tr><td style="color: #94a3b8; font-size: 8px; text-transform: uppercase; padding: 1px 0;">Cittadinanza / Nationality</td></tr>
                              <tr><td style="color: ${goldColor}; font-weight: bold; font-size: 11px; padding-bottom: 6px; text-transform: uppercase;">NEW WORLD STATE ● SOVEREIGN</td></tr>
                            </table>
                          </td>
                          <td style="width: 30%; vertical-align: middle; text-align: center;">
                            <div style="border: 2px solid ${goldColor}; width: 85px; height: 105px; background-color: #071530; border-radius: 8px; overflow: hidden; display: inline-block;">
                              ${updated.arubaPhotoUrl ? `<img src="${updated.arubaPhotoUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Foto" />` : `<div style="padding-top: 35px; font-size: 9px; color: #475569; text-align: center;">FOTO<br/>VALIDA</div>`}
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <div style="margin-top: 15px; border-top: 1px dashed rgba(197,168,128,0.3); padding-top: 15px;">
                        <table style="width: 100%;">
                          <tr>
                            <td>
                              <div style="color: #94a3b8; font-size: 8px; text-transform: uppercase;">Codice Cittadino / Citizen Code</div>
                              <div style="font-family: monospace; font-size: 15px; font-weight: bold; color: ${goldColor}; letter-spacing: 1px; margin-top: 4px;">${code}</div>
                            </td>
                            <td style="vertical-align: bottom; text-align: right;">
                              <div style="font-family: monospace; font-size: 8px; color: #64748b; word-break: break-all;">NWS SIGNATURE HASH: ${updated.documentHash ? updated.documentHash.slice(0, 16).toUpperCase() : 'VALIDATED'}</div>
                            </td>
                          </tr>
                        </table>
                      </div>
                    </div>
                  </div>

                  <p style="font-size: 14px; margin-top: 24px;">Il documento digitale allegato rappresenta il tuo identificativo provvisorio valido ed idoneo per l'esercizio di tutti i diritti federati e per la stampa fisica.</p>
                  
                  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                  
                  <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
                    <em>"Uniti nello spazio, legati per diritto."</em><br/>
                    <strong>Ufficio dell'Anagrafe Federale del New World State</strong>
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8;">
                  Ricevi questa email perché la tua domanda di cittadinanza è stata accolta favorevolmente dal Comitato.
                </div>
              </div>
            `;

            await sendLocalSmtpEmail({
              to: email.trim(),
              subject: 'CONGRATULAZIONI! La tua cittadinanza New World State è approvata',
              html: welcomeHtml,
              attachments: [
                {
                  filename: `ID_Card_NWS_${code}.pdf`,
                  content: pdfBuffer,
                  contentType: 'application/pdf'
                }
              ]
            });
            console.log(`[SMTP] Inviata email di benvenuto e ID Card PDF allegata a ${email}`);
          } catch (smtpErr: any) {
            console.error('[SMTP-APPROVE-ERR] Eccezione nell\'invio email approvazione prima scelta (tentativo fallback):', smtpErr.message);
            // Fallback ad invio senza allegato PDF per garantire la massima tolleranza alle esclusioni
            try {
              const brandColor = '#0a1c3e';
              const goldColor = '#c5a880';
              const code = updated.citizenCode || 'N/A';
              const fallbackHtml = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
                  <div style="background-color: ${brandColor}; padding: 40px 30px; border-radius: 12px; text-align: center; color: white; border-bottom: 4px solid ${goldColor};">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: white;">Benvenuto, Cittadino!</h1>
                    <p style="margin: 10px 0 0 0; color: ${goldColor}; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px;">Cittadinanza NWS Approvata</p>
                  </div>
                  
                  <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; line-height: 1.6;">
                    <p style="font-size: 16px; margin-top: 0;">Gentile <strong>${updated.firstName || ''} ${updated.surname || ''}</strong>,</p>
                    
                    <p style="font-size: 15px;">Siamo onorati di darti il benvenuto ufficiale nel <strong>New World State</strong>. Il nostro comitato di validatori ha completato con successo la verifica della tua anagrafica e dei tuoi documenti.</p>
                    
                    <p style="font-size: 15px;">La tua ID Card è disponibile e convalidata nel nostro archivio centrale.</p>

                    <!-- TABELLA INTERNA PREVIEW -->
                    <div style="margin: 30px 0; background-color: ${brandColor}; color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(10,28,62,0.25); border: 2px solid ${goldColor};">
                      <div style="padding: 16px 20px; background-color: #071530; border-bottom: 1.5px solid ${goldColor}; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: ${goldColor};">NEW WORLD STATE</div>
                          <div style="font-size: 8px; color: #94a3b8; text-transform: uppercase;">Sovereign Global Citizenship</div>
                        </div>
                        <div style="font-size: 18px; color: ${goldColor}; font-weight: bold; text-align: right;">ID CARD</div>
                      </div>
                      
                      <div style="padding: 24px 20px; background-color: ${brandColor}; position: relative;">
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="width: 70%; vertical-align: top; font-size: 12px; font-family: sans-serif;">
                              <table style="width: 100%;">
                                <tr><td style="color: #94a3b8; font-size: 8px; text-transform: uppercase; padding: 1px 0;">Cognome / Surname</td></tr>
                                <tr><td style="font-weight: bold; color: white; font-size: 14px; padding-bottom: 6px;">${updated.surname || ''}</td></tr>
                                
                                <tr><td style="color: #94a3b8; font-size: 8px; text-transform: uppercase; padding: 1px 0;">Nome / Given Names</td></tr>
                                <tr><td style="font-weight: bold; color: white; font-size: 14px; padding-bottom: 6px;">${updated.firstName || ''}</td></tr>
                                
                                <tr><td style="color: #94a3b8; font-size: 8px; text-transform: uppercase; padding: 1px 0;">Data e Luogo di Nascita / Date & Place of Birth</td></tr>
                                <tr><td style="color: white; font-size: 11px; padding-bottom: 6px;">${updated.birthDate || 'N/A'} - ${updated.birthPlace || ''} (${updated.birthCountry || ''})</td></tr>
                                
                                <tr><td style="color: #94a3b8; font-size: 8px; text-transform: uppercase; padding: 1px 0;">Cittadinanza / Nationality</td></tr>
                                <tr><td style="color: ${goldColor}; font-weight: bold; font-size: 11px; padding-bottom: 6px; text-transform: uppercase;">NEW WORLD STATE ● SOVEREIGN</td></tr>
                              </table>
                            </td>
                            <td style="width: 30%; vertical-align: middle; text-align: center;">
                              <div style="border: 2px solid ${goldColor}; width: 85px; height: 105px; background-color: #071530; border-radius: 8px; overflow: hidden; display: inline-block;">
                                ${updated.arubaPhotoUrl ? `<img src="${updated.arubaPhotoUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Foto" />` : `<div style="padding-top: 35px; font-size: 9px; color: #475569; text-align: center;">FOTO<br/>VALIDA</div>`}
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <div style="margin-top: 15px; border-top: 1px dashed rgba(197,168,128,0.3); padding-top: 15px;">
                          <table style="width: 100%;">
                            <tr>
                              <td>
                                <div style="color: #94a3b8; font-size: 8px; text-transform: uppercase;">Codice Cittadino / Citizen Code</div>
                                <div style="font-family: monospace; font-size: 15px; font-weight: bold; color: ${goldColor}; letter-spacing: 1px; margin-top: 4px;">${code}</div>
                              </td>
                              <td style="vertical-align: bottom; text-align: right;">
                                <div style="font-family: monospace; font-size: 8px; color: #64748b; word-break: break-all;">NWS SIGNATURE HASH: ${updated.documentHash ? updated.documentHash.slice(0, 16).toUpperCase() : 'VALIDATED'}</div>
                              </td>
                            </tr>
                          </table>
                        </div>
                      </div>
                    </div>

                    <p style="font-size: 14px; margin-top: 24px;">La ID card digitale generata qui sopra rappresenta l'identificativo valido provvisorio idoneo per l'esercizio di tutti i diritti federati.</p>
                    
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                    
                    <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
                      <em>"Uniti nello spazio, legati per diritto."</em><br/>
                      <strong>Ufficio dell'Anagrafe Federale del New World State</strong>
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8;">
                    Ricevi questa email perché la tua domanda di cittadinanza è stata accolta favorevolmente dal Comitato.
                  </div>
                </div>
              `;
              await sendLocalSmtpEmail({
                to: email.trim(),
                subject: 'CONGRATULAZIONI! La tua cittadinanza New World State è approvata',
                html: fallbackHtml
              });
            } catch (fallbackErr: any) {
              console.error('[SMTP-FALLBACK-ERR] Impossibile inviare email anche senza allegato:', fallbackErr.message);
            }
          }
        }
      }

      return res.json({ success: true, message: 'Cittadino approvato con successo e ID card spedita via email!', citizen: updated });
    });

    // Scarica o visualizza al volo la ID card PDF per qualsiasi cittadino approvato (con logo e qrcode)
    apiRouter.get('/admin/citizen-card', async (req, res) => {
      const { id } = req.query;
      if (!id) return res.status(400).send('ID cittadino mancante.');

      const citizen = await findCitizenById(id as string);
      if (!citizen) return res.status(404).send('Cittadino non trovato.');

      if (citizen.status !== 'approved') {
        return res.status(400).send('La carta d\'identità può essere stampata solo per i cittadini approvati.');
      }

      try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const pdfBuffer = await generateCitizenIdCardPdf(citizen, baseUrl);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="ID_Card_NWS_${citizen.citizenCode || citizen.id}.pdf"`);
        return res.send(pdfBuffer);
      } catch (err: any) {
        console.error('[PDF-LIVE-GET-ERR]', err.message);
        return res.status(500).send(`Impossibile generare la carta d'identità: ${err.message}`);
      }
    });

    // Reject a citizen, set reason & email notification explaining the rejection
    apiRouter.post('/admin/reject', async (req, res) => {
      const { id, reason } = req.body;
      if (!id) return res.status(400).json({ success: false, message: 'ID cittadino mancante.' });
      if (!reason) return res.status(400).json({ success: false, message: 'Fornire una motivazione per il rifiuto.' });

      console.log(`[API] Processing rejection for ID: ${id}. Reason: ${reason}`);
      const citizen = await findCitizenById(id);
      if (!citizen) return res.status(404).json({ success: false, message: 'Cittadino non trovato.' });

      const updated = await updateCitizenStatus(id, 'rejected', reason);
      if (!updated) return res.status(500).json({ success: false, message: 'Impossibile aggiornare lo stato di validazione.' });

      // Invia email di rifiuto spiegandone i motivi
      if (process.env.SMTP_USER) {
        const email = updated.email;
        if (email && email.includes('@')) {
          try {
            const textHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
                <div style="background-color: #ef4444; padding: 30px; border-radius: 12px; text-align: center; color: white;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: white;">Aggiornamento Registrazione</h1>
                  <p style="margin: 5px 0 0 0; color: #fee2e2; font-size: 15px;">Domanda di Cittadinanza Respinta</p>
                </div>
                
                <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; line-height: 1.6;">
                  <p style="font-size: 16px; margin-top: 0;">Gentile <strong>${updated.firstName || ''} ${updated.surname || ''}</strong>,</p>
                  
                  <p style="font-size: 15px;">Ti informiamo che, a seguito di un controllo attento da parte del comitato d'esame dell'Anagrafe del New World State, la tua richiesta di iscrizione <strong>non è stata accolta</strong>.</p>
                  
                  <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 18px; border-radius: 8px; margin: 24px 0;">
                    <h4 style="margin: 0 0 5px 0; color: #991b1b; font-size: 13px; font-weight: bold; text-transform: uppercase;">MOTIVAZIONE DEL RIFIUTO / REJECTION REASONS</h4>
                    <p style="margin: 0; color: #b91c1c; font-size: 14px; font-style: italic; white-space: pre-line;">"${reason}"</p>
                  </div>

                  <p style="font-size: 14px;">La discrepanza riscontrata deve essere risolta affinché l'iscrizione possa procedere. Puoi ricompilare il modulo di registrazione sul portale correggendo le incongruenze evidenziate.</p>
                  
                  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                  
                  <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
                    <em>"Uniti nello spazio, legati per diritto."</em><br/>
                    <strong>Ufficio dell'Anagrafe Federale del New World State</strong>
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8;">
                  Ricevi questa email in conformità alle norme di revisione e trasparenza anagrafica di New World State.
                </div>
              </div>
            `;

            await sendLocalSmtpEmail({
              to: email.trim(),
              subject: 'Stato domanda di cittadinanza New World State (Non accetta)',
              html: textHtml
            });
            console.log(`[SMTP] Inviata email di rifiuto con motivazione a ${email}`);
          } catch (smtpErr: any) {
            console.error('[SMTP-REJECT-ERR] Eccezione nell\'invio email di rifiuto:', smtpErr.message);
          }
        }
      }

      return res.json({ success: true, message: 'Stato cittadino impostato su respinto con successo.', citizen: updated });
    });

    apiRouter.get('/test-aruba', async (req, res) => {
      const uploaderUrl = process.env.ARUBA_UPLOADER_URL ? process.env.ARUBA_UPLOADER_URL.trim() : '';
      const uploaderKey = process.env.ARUBA_UPLOADER_KEY ? process.env.ARUBA_UPLOADER_KEY.trim() : '';

      if (!uploaderUrl) {
        // Se non configurato localmente, proviamo a inoltrare al Worker per vedere se è configurato lì!
        const WORKER_URL = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev/api/test-aruba';
        console.log('--- PROXYING TEST ARUBA AL WORKER ---');
        try {
          const workerRes = await fetch(WORKER_URL);
          const contentType = workerRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await workerRes.json();
            return res.status(workerRes.status).json(data);
          } else {
            const text = await workerRes.text();
            return res.status(workerRes.status).json({ 
              success: false, 
              message: 'Nessun URL Aruba configurato nel file .env locale dell\'app del browser, e la chiamata inoltrata al Cloudflare Worker ha restituito una risposta non JSON.',
              details: text.slice(0, 150)
            });
          }
        } catch (error: any) {
          return res.status(502).json({
            success: false,
            message: 'Variabile d\'ambiente ARUBA_UPLOADER_URL non definita localmente e la connessione al Cloudflare Worker è fallita.',
            details: error.message
          });
        }
      }

      console.log(`[ARUBA-TEST] Test completo di lettura/scrittura a Aruba: ${uploaderUrl}`);
      try {
        const separator = uploaderUrl.includes('?') ? '&' : '?';
        const targetUrlWithKey = `${uploaderUrl}${separator}key=${encodeURIComponent(uploaderKey)}`;

        // 1. Controllo di stato
        const uploaderRes = await fetch(targetUrlWithKey, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${uploaderKey}`,
            'X-Aruba-Key': uploaderKey
          },
          body: JSON.stringify({
            action: 'status',
            key: uploaderKey
          })
        });

        if (uploaderRes.redirected) {
          return res.status(400).json({
            success: false,
            source: 'Local Express Server',
            message: `Reindirizzamento rilevato (HTTP Redirect)! Il server Aruba ha reindirizzato da ${targetUrlWithKey} a ${uploaderRes.url}. Questo di solito rimuove il corpo POST. Per favore aggiorna la variabile d'ambiente ARUBA_UPLOADER_URL impostando l'URL finale esatto: ${uploaderRes.url}`,
          });
        }

        let statusResponse: any = { success: true, message: 'Attivo' };
        if (!uploaderRes.ok) {
          const text = await uploaderRes.text();
          let isOldPhpWithoutStatus = false;
          try {
            const parsed = JSON.parse(text);
            if (uploaderRes.status === 400 && parsed.message && parsed.message.includes('Nessun file decodificato')) {
              isOldPhpWithoutStatus = true;
            }
          } catch (e) {}

          if (!isOldPhpWithoutStatus) {
            return res.status(uploaderRes.status).json({
              success: false,
              source: 'Local Express Server',
              message: `L'uploader di Aruba ha risposto con errore HTTP ${uploaderRes.status} al controllo di stato.`,
              details: text.slice(0, 2000)
            });
          } else {
            console.log('[ARUBA-TEST] Rilevato file PHP precedente su Aruba (autorizzazione OK ma nessun supporto per status API). Procedo direttamente con test di scrittura.');
            statusResponse = { success: true, message: 'Attivo (File PHP precedente rilevato, procedo al test di scrittura)' };
          }
        } else {
          statusResponse = await uploaderRes.json();
        }

        // 2. Test di Scrittura Attiva (Caricamento di un mini file di test PNG Base64)
        let writeData: any = null;
        let usedFallback = false;

        const writeRes = await fetch(targetUrlWithKey, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${uploaderKey}`,
            'X-Aruba-Key': uploaderKey
          },
          body: JSON.stringify({
            key: uploaderKey,
            username: 'diagnostics_test_user',
            documentFrontData: 'data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            documentFrontName: 'test_write.png'
          })
        });

        if (writeRes.redirected) {
          return res.status(400).json({
            success: false,
            source: 'Local Express Server',
            message: `Reindirizzamento rilevato (HTTP Redirect) durante la scrittura! Il server Aruba ha reindirizzato a ${writeRes.url}. Corpo POST rimosso. Aggiorna la variabile d'ambiente ARUBA_UPLOADER_URL impostando l'URL finale esatto: ${writeRes.url}`,
          });
        }

        if (!writeRes.ok) {
          const text = await writeRes.text();
          let parsed: any = null;
          try {
            parsed = JSON.parse(text);
          } catch (e) {}

          const looksLikeEmptyRawInput = writeRes.status === 400 && (!parsed || (parsed.debug && parsed.debug.raw_input_empty) || text.includes('decodificato'));

          if (looksLikeEmptyRawInput) {
            console.log('[ARUBA-TEST] Tentativo JSON fallito con body vuoto o errore. Eseguo fallback resiliente su form-urlencoded...');
            const urlEncodedBody = new URLSearchParams();
            urlEncodedBody.append('key', uploaderKey);
            urlEncodedBody.append('username', 'diagnostics_test_user');
            urlEncodedBody.append('documentFrontData', 'data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
            urlEncodedBody.append('documentFrontName', 'test_write.png');

            const fallbackRes = await fetch(targetUrlWithKey, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${uploaderKey}`,
                'X-Aruba-Key': uploaderKey
              },
              body: urlEncodedBody
            });

            if (!fallbackRes.ok) {
              const fallbackText = await fallbackRes.text();
              return res.status(fallbackRes.status).json({
                success: false,
                source: 'Local Express Server (Fallback x-www-form-urlencoded)',
                message: `La scrittura di test su Aruba è fallita anche tramite form-urlencoded (Errore HTTP ${fallbackRes.status})`,
                details: fallbackText.slice(0, 2000)
              });
            }

            writeData = await fallbackRes.json();
            usedFallback = true;
          } else {
            return res.status(writeRes.status).json({
              success: false,
              source: 'Local Express Server',
              message: `La scrittura di test su Aruba è fallita (Errore HTTP ${writeRes.status})`,
              details: text.slice(0, 2000)
            });
          }
        } else {
          writeData = await writeRes.json();
        }

        if (!writeData || !writeData.success || !writeData.files || !writeData.files.front) {
          return res.status(400).json({
            success: false,
            source: 'Local Express Server',
            message: 'Il bridge Aruba non ha potuto salvare o restituire il link del file di test.',
            details: writeData ? (writeData.message || JSON.stringify(writeData)) : 'Controlla i permessi di scrittura della directory documents/'
          });
        }

        const fileUrl = writeData.files.front;

        // 3. Test di Lettura Attiva
        const readRes = await fetch(fileUrl);
        if (!readRes.ok) {
          return res.status(400).json({
            success: false,
            source: 'Local Express Server',
            message: `Il file è stato scritto ma la lettura pubblica ha fallito con HTTP ${readRes.status}`,
            details: `Non è possibile scaricare il documento tramite ${fileUrl}`
          });
        }

        return res.json({
          success: true,
          source: 'Local Express Server',
          message: 'Test di Lettura e Scrittura su Aruba completato correttamente!',
          statusCheck: statusResponse,
          writeTest: { ok: true, fileName: 'test_write.png' },
          readTest: { ok: true, url: fileUrl }
        });

      } catch (err: any) {
        return res.status(550).json({
          success: false,
          source: 'Local Express Server',
          message: `Impossibile completare il test ad Aruba all'URL: ${uploaderUrl}`,
          details: err.message
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

    // Servizio Centrale di Verifica per Carta d'Identità Sovereign NWS (Anti-Counterfeiting System)
    app.get('/verify', async (req, res) => {
      const { id, code } = req.query;
      const key = ((id || code || '') as string).trim();

      if (!key) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>NWS Identity Verification Center</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;550&display=swap" rel="stylesheet">
              <style>
                body { font-family: 'Inter', sans-serif; }
                .font-display { font-family: 'Space Grotesk', sans-serif; }
                .font-mono-tech { font-family: 'JetBrains Mono', monospace; }
              </style>
            </head>
            <body class="bg-[#050d1e] min-h-screen text-slate-100 flex flex-col justify-between">
              <header class="border-b border-[#c5a880]/20 bg-[#071328]/80 backdrop-blur py-5 px-6 sticky top-0 z-50">
                <div class="max-w-4xl mx-auto flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-[#c5a880] flex items-center justify-center font-display font-bold text-[#0a1c3e] text-xs">NWS</div>
                    <div>
                      <h1 class="text-sm font-display font-bold tracking-wider text-white">NEW WORLD STATE</h1>
                      <p class="text-[9px] font-mono-tech tracking-widest text-[#c5a880]">VERIFICATION REGISTRY</p>
                    </div>
                  </div>
                  <span class="text-[8px] font-mono-tech bg-[#ef4444]/10 text-[#ef4444] px-2 py-0.5 border border-[#ef4444]/20 rounded font-semibold uppercase">SECURE LINK NEEDED</span>
                </div>
              </header>

              <main class="max-w-md w-full mx-auto px-6 py-12 flex-1 flex items-center justify-center">
                <div class="bg-[#071530] border border-red-500/20 rounded-3xl shadow-2xl p-8 text-center space-y-6 w-full">
                  <div class="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-3xl font-bold animate-pulse">!</div>
                  <div class="space-y-2">
                    <h2 class="text-xl font-display font-bold text-white tracking-tight">Parametro Mancante</h2>
                    <p class="text-slate-400 text-xs leading-relaxed">Nessun codice cittadino o identificativo univoco specificato per la verifica decentralizzata. Inquadra nuovamente il QR code presente sulla carta fisica d'identità.</p>
                  </div>
                  <div class="pt-4">
                    <a href="/" class="inline-flex w-full justify-center bg-gradient-to-r from-[#c5a880] to-[#e4cbab] text-[#0a1c3e] font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-xl hover:opacity-90 shadow-lg shadow-amber-500/10 transition">Torna alla Home</a>
                  </div>
                </div>
              </main>

              <footer class="border-t border-[#c5a880]/10 bg-[#040a15] py-6 px-4 text-center text-[10px] text-slate-500 font-mono-tech">
                <p>© 2026 Sovereign Administration of New World State. Central Verification Authority.</p>
              </footer>
            </body>
          </html>
        `);
      }

      const citizen = await findCitizenByCodeOrId(key);

      // If NOT approved or NOT found
      if (!citizen || citizen.status !== 'approved') {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>AVVISO CONTRAFFATTURA - NWS</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;550&display=swap" rel="stylesheet">
              <style>
                body { font-family: 'Inter', sans-serif; }
                .font-display { font-family: 'Space Grotesk', sans-serif; }
                .font-mono-tech { font-family: 'JetBrains Mono', monospace; }
              </style>
            </head>
            <body class="bg-[#050d1e] min-h-screen text-slate-100 flex flex-col justify-between">
              <header class="border-b border-[#c5a880]/20 bg-[#071328]/80 backdrop-blur py-5 px-6 sticky top-0 z-50">
                <div class="max-w-4xl mx-auto flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-[#ef4444] flex items-center justify-center font-display font-bold text-white text-xs">!</div>
                    <div>
                      <h1 class="text-sm font-display font-bold tracking-wider text-white">NEW WORLD STATE</h1>
                      <p class="text-[9px] font-mono-tech tracking-widest text-[#ef4444]">SECURITY DIVISION</p>
                    </div>
                  </div>
                  <span class="text-[8px] font-mono-tech bg-[#ef4444]/10 text-rose-500 px-2 py-0.5 border border-rose-500/20 rounded font-semibold uppercase">VERIFICA FALLITA</span>
                </div>
              </header>

              <main class="max-w-lg w-full mx-auto px-6 py-10 flex-grow flex items-center">
                <div class="bg-[#110714] border-2 border-red-500/30 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden w-full animate-fade-in">
                  <div class="absolute -top-10 -right-10 w-28 h-28 bg-red-500/10 rounded-full blur-2xl"></div>
                  
                  <div class="text-center space-y-4">
                    <div class="w-16 h-16 bg-red-600/10 text-red-500 border-2 border-red-500/20 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">!</div>
                    <div class="space-y-1">
                      <span class="text-[10px] font-mono-tech tracking-widest text-red-400 font-bold uppercase">AVVISO DI SICUREZZA</span>
                      <h2 class="text-2xl font-display font-bold text-white tracking-tight">DOCUMENTO COPIATO O CONTRAFFATTO</h2>
                    </div>
                  </div>

                  <p class="text-slate-300 text-xs leading-relaxed text-center">
                    Il codice identificativo <strong class="text-red-400 font-mono-tech font-bold uppercase select-all">${key}</strong> inserito o inquadrato <span class="font-semibold text-white">NON RISULTA REGISTRATO</span> o approvato nell'Anagrafe Centrale della Federazione Sovrana di New World State.
                  </p>

                  <div class="bg-black/30 border border-red-500/20 rounded-2xl p-5 space-y-2.5 text-xs text-slate-400">
                    <p class="font-bold text-red-300 text-center uppercase text-[10px] tracking-wider mb-1">ISTRUZIONI PER FUNZIONARI DI FRONTIERA</p>
                    <ul class="space-y-2 list-none pl-0">
                      <li class="flex items-start gap-2"><span class="text-red-500">🛡️</span> Ogni documento NWS ufficiale possiede una corrispondenza univoca nel nostro server di registro. Se la scansione fallisce, la carta stampata è priva di efficacia giuridica.</li>
                      <li class="flex items-start gap-2"><span class="text-red-500">🛡️</span> La contraffazione dei documenti e l'utilizzo abusivo del design federale costituiscono gravi violazioni penali.</li>
                      <li class="flex items-start gap-2"><span class="text-red-500">🛡️</span> Trattieni la tessera fisica ed esegui i dovuti controlli anagrafici approfonditi.</li>
                    </ul>
                  </div>

                  <div class="pt-2 text-center text-[10px] text-slate-500 font-mono-tech">
                    ID Transazione Verifica: NWS-SEC-ERR-${Math.floor(100000 + Math.random() * 900000)}
                  </div>
                </div>
              </main>

              <footer class="border-t border-[#c5a880]/10 bg-[#040a15] py-6 px-4 text-center text-[10px] text-slate-500 font-mono-tech">
                <p>© 2026 Sovereign Administration of New World State. Central Verification Authority.</p>
              </footer>
            </body>
          </html>
        `);
      }

      // If approved and found!
      const docHash = citizen.documentHash || 'VALIDATED';
      const cleanHash = docHash.slice(0, 16).toUpperCase();
      const citizenPhoto = citizen.arubaPhotoUrl || citizen.arubaphotourl || '';

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CITTADINANZA VERIFICATA - NWS Registry</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;550&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Inter', sans-serif; }
              .font-display { font-family: 'Space Grotesk', sans-serif; }
              .font-mono-tech { font-family: 'JetBrains Mono', monospace; }
            </style>
          </head>
          <body class="bg-[#050d1e] min-h-screen text-slate-100 flex flex-col justify-between">
            <header class="border-b border-[#c5a880]/20 bg-[#071328]/80 backdrop-blur py-5 px-6 sticky top-0 z-50">
              <div class="max-w-4xl mx-auto flex items-center justify-between w-full">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center font-display font-bold text-[#0a1c3e] text-xs">✓</div>
                  <div>
                    <h1 class="text-sm font-display font-bold tracking-wider text-white">NEW WORLD STATE</h1>
                    <p class="text-[9px] font-mono-tech tracking-widest text-[#c5a880]">SOVEREIGN CITIZENSHIP REGISTRY</p>
                  </div>
                </div>
                <span class="text-[8px] font-mono-tech bg-[#10b981]/10 text-emerald-400 px-2.5 py-1 border border-emerald-500/20 rounded font-semibold uppercase tracking-wider animate-pulse">✓ DOCUMENTO AUTENTICO</span>
              </div>
            </header>

            <main class="max-w-2xl w-full mx-auto px-6 py-8 flex-grow">
              <div class="bg-[#071530] border border-[#c5a880]/20 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
                
                {/* Visual Header */}
                <div class="text-center space-y-2">
                  <div class="w-14 h-14 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">✓</div>
                  <div>
                    <h2 class="text-xl font-display font-bold text-white tracking-tight">Anagrafe Federale Validata</h2>
                    <p class="text-[11px] text-[#c5a880] uppercase tracking-widest font-mono-tech font-bold">Stato Cittadinanza: Attivo e Convalidato</p>
                  </div>
                </div>

                {/* Instructions Box */}
                <div class="bg-[#0d1f3d] rounded-2xl p-4 border border-[#c5a880]/15 text-xs text-sky-200/80 leading-relaxed">
                  <strong class="text-white">IMPORTANTE CONFRONTO DATI COPIE:</strong> Controlla attentamente i dati anagrafici scritti sulla tessera fisica di identità con quelli estratti in tempo reale dal nostro database centrale sottostante. Accertati inoltre che la <strong>fotografia stampata</strong> sulla carta plastificata corrisponda esattamente a quella ufficiale qui registrata.
                </div>

                {/* Profile Photo Comparison & Core Details split */}
                <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* Photo area */}
                  <div class="md:col-span-4 flex flex-col items-center space-y-2">
                    <div class="text-[10px] font-mono-tech text-slate-400 uppercase tracking-wider font-semibold">Foto Ufficiale nel DB</div>
                    <div class="w-36 h-48 rounded-xl border border-[#c5a880]/30 overflow-hidden bg-[#050e21] shadow-xl flex items-center justify-center relative group">
                      ${citizenPhoto ? `
                        <img src="${citizenPhoto}" class="w-full h-full object-cover" alt="Foto Dossier" referrerPolicy="no-referrer" />
                      ` : `
                        <div class="text-center p-3">
                          <span class="text-2xl block">👤</span>
                          <span class="text-[9px] text-slate-500 font-mono-tech">Foto non disponibile</span>
                        </div>
                      `}
                    </div>
                    <span class="text-[10px] bg-emerald-500/15 text-emerald-400 py-0.5 px-2.5 rounded-full font-mono-tech uppercase font-bold tracking-wider">Identità Verificata</span>
                  </div>

                  {/* Fields Area */}
                  <div class="md:col-span-8 space-y-4">
                    <div class="text-[10px] font-mono-tech text-slate-400 uppercase tracking-wider font-semibold">Anagrafica Federale Archiviata</div>
                    
                    <div class="bg-[#050e21] rounded-2xl p-5 border border-slate-800 space-y-3.5 text-xs">
                      <div class="grid grid-cols-2 gap-y-3.5 gap-x-2 border-b border-white/5 pb-3">
                        <div>
                          <span class="text-slate-400 block text-[9px] uppercase tracking-wider">Cognome / Surname</span>
                          <strong class="text-white text-sm font-semibold select-all font-display">${(citizen.surname || '').toUpperCase()}</strong>
                        </div>
                        <div>
                          <span class="text-slate-400 block text-[9px] uppercase tracking-wider">Nome / Given Names</span>
                          <strong class="text-white text-sm font-semibold select-all font-display">${(citizen.firstName || '').toUpperCase()}</strong>
                        </div>
                      </div>

                      <div class="grid grid-cols-2 gap-3.5 border-b border-white/5 pb-3">
                        <div>
                          <span class="text-slate-400 block text-[9px] uppercase tracking-wider">Nato il / Date of Birth</span>
                          <strong class="text-slate-200 select-all font-mono-tech">${citizen.birthDate || 'N/A'}</strong>
                        </div>
                        <div>
                          <span class="text-slate-400 block text-[9px] uppercase tracking-wider">A / Place of Birth</span>
                          <strong class="text-slate-200 select-all font-mono-tech">${(citizen.birthPlace || '').toUpperCase()} (${(citizen.birthCountry || '').toUpperCase()})</strong>
                        </div>
                      </div>

                      <div class="grid grid-cols-2 gap-3.5 border-b border-white/5 pb-3">
                        <div>
                          <span class="text-slate-400 block text-[9px] uppercase tracking-wider">Codice Cittadino / Citizen Code</span>
                          <strong class="text-[#c5a880] select-all font-bold text-sm font-mono-tech tracking-wider">${citizen.citizenCode || 'N/A'}</strong>
                        </div>
                        <div>
                          <span class="text-slate-400 block text-[9px] uppercase tracking-wider">Genere / Sex</span>
                          <strong class="text-slate-200 select-all uppercase font-mono-tech">${citizen.gender || '-'}</strong>
                        </div>
                      </div>

                      <div class="pt-1 select-all">
                        <span class="text-slate-400 block text-[9px] uppercase tracking-wider">Firma di Controllo Algoritmica (Centrale)</span>
                        <strong class="text-slate-500 font-mono-tech text-[9px] font-bold block overflow-x-auto whitespace-nowrap bg-black/30 p-2 border border-white/5 rounded-lg mt-1 uppercase">HASH: ${docHash}</strong>
                      </div>
                    </div>

                  </div>

                </div>

                <div class="bg-emerald-500/5 text-emerald-400/90 rounded-2xl p-4 border border-emerald-500/20 text-[11px] font-mono-tech text-center flex items-center justify-center gap-2">
                  <span>🛡️</span> REGISTRO DI CITTADINANZA SOVRANA NWS: INTEGRITÀ CERTIFICATA SUL DATABASE FEDERALE
                </div>

              </div>
            </main>

            <footer class="border-t border-[#c5a880]/10 bg-[#040a15] py-6 px-4 text-center text-[10px] text-slate-500 font-mono-tech">
              <p>© 2026 Sovereign Administration of New World State. Central Verification Authority.</p>
            </footer>
          </body>
        </html>
      `);
    });

    // Servizio di Validazione Interattivo via Link di Approvazione/Rifiuto Email
    app.get('/admin/action', async (req, res) => {
      const { id } = req.query;
      
      if (!id) {
        return res.send(`
          <html>
            <head>
              <title>Errore - Servizio Validazione NWS</title>
              <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-[#faf9f6] min-h-screen flex items-center justify-center p-6 text-slate-800 font-sans">
              <div class="bg-white max-w-md w-full rounded-2xl shadow-xl border border-red-100 p-8 text-center animate-fade-in">
                <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">!</div>
                <h1 class="text-xl font-bold text-slate-900 mb-2">ID Cittadino Mancante</h1>
                <p class="text-slate-500 text-sm leading-relaxed mb-6">Il link di validazione utilizzato non contiene un parametro identificativo valido o il codice della richiesta è nullo.</p>
                <a href="/" class="inline-flex bg-[#0a1c3e] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition">Torna alla Home</a>
              </div>
            </body>
          </html>
        `);
      }

      const cit = await findCitizenById(id as string);
      if (!cit) {
        return res.send(`
          <html>
            <head>
              <title>Errore - Cittadino Non Trovato</title>
              <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-[#faf9f6] min-h-screen flex items-center justify-center p-6 text-slate-800 font-sans">
              <div class="bg-white max-w-md w-full rounded-2xl shadow-xl border border-amber-100 p-8 text-center animate-fade-in">
                <div class="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">?</div>
                <h1 class="text-xl font-bold text-slate-900 mb-2">Richiesta Non Trovata</h1>
                <p class="text-slate-500 text-sm leading-relaxed mb-6">Impossibile trovare nel registro locale del server una richiesta di cittadinanza associata all'ID #${id}. Potrebbe essere stata archiviata o rimossa.</p>
                <a href="/" class="inline-flex bg-[#0a1c3e] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition">Torna alla Home</a>
              </div>
            </body>
          </html>
        `);
      }

      const status = cit.status || 'pending';
      const statusClass = status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                          status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                          'bg-amber-50 text-amber-700 border-amber-100';

      const statusLabel = status === 'approved' ? 'APPROVATO' : 
                          status === 'rejected' ? 'RESPINTO' : 
                          'IN ATTESA DI VALIDAZIONE';

      let decisionPanelHtml = '';
      if (status === 'approved') {
        const docHash = cit.documentHash || 'VALIDATED';
        const cleanHash = docHash.slice(0, 16).toUpperCase();
        decisionPanelHtml = `
          <div class="space-y-4">
            <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl text-center space-y-2">
              <div class="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
              <h4 class="font-bold text-sm tracking-wide">PRATICA GIÀ APPROVATA</h4>
              <p class="text-xs text-emerald-600 leading-relaxed">Questa domanda di cittadinanza è stata accolta favorevolmente dal comitato anagrafico. La ID card ufficiale è stata generata e spedita via email.</p>
            </div>
            
            <div class="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
              <div>
                <span class="text-[10px] text-slate-400 uppercase font-semibold">Codice Cittadino NWS</span>
                <div class="font-mono text-base font-bold text-[#c5a880] select-all">${cit.citizenCode || 'N/D'}</div>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 uppercase font-semibold">Firma Digitale Federale</span>
                <div class="font-mono text-[10px] text-slate-500 font-bold">NWS HASH: ${cleanHash}</div>
              </div>
            </div>
          </div>
        `;
      } else if (status === 'rejected') {
        decisionPanelHtml = `
          <div class="space-y-4">
            <div class="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-2xl text-center space-y-2">
              <div class="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">✕</div>
              <h4 class="font-bold text-sm tracking-wide">PRATICA RESPINTA</h4>
              <p class="text-xs text-rose-600 leading-relaxed">Questa domanda è stata catalogata come respinta.</p>
            </div>
            
            <div class="bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <span class="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Motivazione Formalizzata</span>
              <p class="text-xs text-slate-700 italic bg-white p-3 rounded-lg border border-slate-100">
                "${cit.rejectionReason || 'Nessuna motivazione specificata.'}"
              </p>
            </div>
          </div>
        `;
      } else {
        decisionPanelHtml = `
          <div id="action-ui" class="space-y-4">
            <p class="text-xs text-slate-500 leading-relaxed mb-4">In qualità di validatore del New World State, esamina lo stato formale dei requisiti anagrafici. Approvando, il cittadino riceverà un'email con il suo passaporto e il suo certificato. Rifiutando, verrà motivata la respinta via email.</p>
            
            <!-- INPUT REJECTION REASON -->
            <div>
              <label for="rejectReason" class="block text-xs font-semibold text-slate-600 mb-2">Motivazione Obbligatoria del Rifiuto (se applica)</label>
              <textarea id="rejectReason" rows="4" placeholder="Inserisci qui i motivi specifici dell'eventuale respinta di questa richiesta..." class="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0a1c3e] transition text-slate-800 bg-slate-50/50 resize-none">${cit.rejectionReason || ''}</textarea>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="flex flex-col gap-3 pt-2">
              <button id="btn-approve" onclick="submitDecision('approve')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition duration-150 active:scale-95 shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2 text-sm select-none">
                <span>✓</span> APPROVA REGISTRAZIONE
              </button>
              <button id="btn-reject" onclick="submitDecision('reject')" class="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3.5 px-4 rounded-xl transition duration-150 active:scale-95 shadow-md shadow-rose-500/10 flex items-center justify-center gap-2 text-sm select-none">
                <span>✕</span> RESPINGI REGISTRAZIONE
              </button>
            </div>
          </div>
        `;
      }

      return res.send(`
        <!DOCTYPE html>
        <html lang="it">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Servizio di Validazione • New World State</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; }
          </style>
        </head>
        <body class="bg-[#fcfbf9] min-h-screen text-slate-800 selection:bg-amber-100">
          <!-- TOP NAVBAR -->
          <header class="bg-[#0a1c3e] text-white py-5 px-6 sticky top-0 z-50 border-b border-[#c5a880]/30 shadow-md">
            <div class="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-tr from-[#c5a880] to-[#e4ceb4] rounded-lg flex items-center justify-center text-[#0a1c3e] font-bold text-xl shadow-inner">W</div>
                <div>
                  <h1 class="font-bold tracking-tight text-base sm:text-lg">NEW WORLD STATE</h1>
                  <p class="text-[10px] text-amber-200/80 tracking-widest font-mono uppercase">Sovereign Administration Console</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-amber-100/70 font-mono">Consolle Validatore Federale</div>
                <div class="text-xs text-white/50">ID Accesso: #nws-root-validator</div>
              </div>
            </div>
          </header>

          <main class="max-w-6xl mx-auto py-8 px-4 sm:px-6">
            <!-- HEADER INFO -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span class="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono">Pratica di Cittadinanza</span>
                <h2 class="text-2xl font-bold text-slate-900 mt-1">${cit.surname || ''} ${cit.firstName || ''}</h2>
                <p class="text-slate-500 text-sm mt-1">Sottomessa il ${cit.createdAt ? new Date(cit.createdAt).toLocaleString('it-IT') : 'N/D'} • Username: <span class="font-mono text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded">${cit.username || 'N/D'}</span></p>
              </div>
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div class="border rounded-xl px-4 py-2 text-center sm:text-left ${statusClass}">
                  <div class="text-[9px] uppercase tracking-wider font-bold opacity-60">Stato Attuale</div>
                  <div class="text-xs font-bold tracking-wide">${statusLabel}</div>
                </div>
              </div>
            </div>

            <!-- MAIN GRID -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <!-- LEFT COL: CITIZEN DOSSIER (7 COLS) -->
              <div class="lg:col-span-7 space-y-6">
                <!-- SEGMENT 1: ANAGRAFICA -->
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                    <span class="text-cyan-600">👤</span> Dati Personali
                  </h3>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-xs text-slate-400 block mb-0.5">Codice Unico NWS</span>
                      <span class="font-mono font-bold text-amber-700 block text-base">${cit.citizenCode || 'N/D'}</span>
                    </div>
                    <div>
                      <span class="text-xs text-slate-400 block mb-0.5">Sesso / Genere</span>
                      <span class="font-semibold text-slate-800 block">${cit.gender || 'N/D'}</span>
                    </div>
                    <div>
                      <span class="text-xs text-slate-400 block mb-0.5">Data di Nascita</span>
                      <span class="font-semibold text-slate-800 block">${cit.birthDate || 'N/D'}</span>
                    </div>
                    <div>
                      <span class="text-xs text-slate-400 block mb-0.5">Luogo di Nascita</span>
                      <span class="font-semibold text-slate-800 block">${cit.birthPlace || ''} (${cit.birthCountry || ''})</span>
                    </div>
                    <div>
                      <span class="text-xs text-slate-400 block mb-0.5">Stato Civile</span>
                      <span class="font-semibold text-slate-800 block">${cit.maritalStatus || 'N/D'}</span>
                    </div>
                    <div>
                      <span class="text-xs text-slate-400 block mb-0.5">Email</span>
                      <span class="font-semibold text-cyan-600 block"><a href="mailto:${cit.email || ''}">${cit.email || 'Nessuna'}</a></span>
                    </div>
                    <div>
                      <span class="text-xs text-slate-400 block mb-0.5">Telefono</span>
                      <span class="font-semibold text-slate-800 block">${cit.phonePrefix || ''} ${cit.phoneNumber || 'N/D'}</span>
                    </div>
                    <div>
                      <span class="text-xs text-slate-400 block mb-0.5">Cittadinanza Richiesta</span>
                      <span class="font-bold text-slate-800 block">${cit.citizenship || 'N/D'}</span>
                    </div>
                  </div>
                </div>

                <!-- SEGMENT 2: LOCATION -->
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                    <span class="text-emerald-600">📍</span> Residenza e Coordinate
                  </h3>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                    <div class="sm:col-span-2">
                      <span class="text-xs text-slate-400 block mb-0.5">Indirizzo Completo</span>
                      <span class="font-semibold text-slate-800 block">
                        ${(() => {
                          const parts = [];
                          if (cit.residenceAddress && cit.residenceAddress.trim()) parts.push(cit.residenceAddress.trim());
                          if (cit.residenceNumber && cit.residenceNumber.trim()) parts.push(cit.residenceNumber.trim());
                          const street = parts.join(', ');

                          const secondParts = [];
                          if (cit.residenceZip && cit.residenceZip.trim()) secondParts.push(cit.residenceZip.trim());
                          if (cit.residenceCity && cit.residenceCity.trim()) secondParts.push(cit.residenceCity.trim());
                          if (cit.residenceProvince && cit.residenceProvince.trim()) secondParts.push(`(${cit.residenceProvince.trim()})`);
                          const cityZip = secondParts.join(' ');

                          if (street && cityZip) return `${street} - ${cityZip}`;
                          if (street) return street;
                          if (cityZip) return cityZip;
                          return 'N/D';
                        })()}
                      </span>
                    </div>
                    <div>
                      <span class="text-xs text-slate-400 block mb-0.5">Stato di Residenza</span>
                      <span class="font-semibold text-slate-800 block">${cit.residenceCountry || 'N/D'}</span>
                    </div>
                    <div>
                      <span class="text-xs text-slate-400 block mb-0.5">Plus Code Posizione</span>
                      <span class="font-mono text-cyan-700 font-bold block bg-cyan-50 px-2 py-0.5 rounded inline-block font-sans">${cit.plusCode || 'N/D'}</span>
                    </div>
                  </div>
                  <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-500">
                    <strong class="text-slate-700 block mb-1">Descrizione Luogo Memorizzato:</strong>
                    "${cit.locationDescription || 'Nessuna descrizione del luogo fornita dal cittadino.'}"
                  </div>
                </div>

                <!-- SEGMENT 3: FILE PREVIEWS -->
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                    <span class="text-purple-600">📁</span> Corredo Documentale su Aruba
                  </h3>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="border rounded-xl p-3 bg-slate-50 text-center flex flex-col justify-between h-44">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fronte Documento</span>
                      <div class="flex-1 flex items-center justify-center my-2 overflow-hidden rounded bg-white border border-slate-100">
                        ${cit.arubaFrontUrl ? `<img src="${cit.arubaFrontUrl}" class="max-h-24 w-auto object-contain cursor-pointer" onclick="window.open('${cit.arubaFrontUrl}')" />` : `<div class="text-slate-300 text-[10px] italic">Non Disponibile</div>`}
                      </div>
                      ${cit.arubaFrontUrl ? `<a href="${cit.arubaFrontUrl}" target="_blank" class="text-[10px] font-semibold text-blue-600 hover:underline">Apri scheda</a>` : `<span class="text-[10px] text-slate-400">Non caricato su Aruba</span>`}
                    </div>

                    <div class="border rounded-xl p-3 bg-slate-50 text-center flex flex-col justify-between h-44">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Retro Documento</span>
                      <div class="flex-1 flex items-center justify-center my-2 overflow-hidden rounded bg-white border border-slate-100">
                        ${cit.arubaBackUrl ? `<img src="${cit.arubaBackUrl}" class="max-h-24 w-auto object-contain cursor-pointer" onclick="window.open('${cit.arubaBackUrl}')" />` : `<div class="text-slate-300 text-[10px] italic">Non Disponibile</div>`}
                      </div>
                      ${cit.arubaBackUrl ? `<a href="${cit.arubaBackUrl}" target="_blank" class="text-[10px] font-semibold text-blue-600 hover:underline">Apri scheda</a>` : `<span class="text-[10px] text-slate-400">Non caricato su Aruba</span>`}
                    </div>

                    <div class="border rounded-xl p-3 bg-slate-50 text-center flex flex-col justify-between h-44">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Foto Tessera</span>
                      <div class="flex-1 flex items-center justify-center my-2 overflow-hidden rounded bg-white border border-slate-100">
                        ${cit.arubaPhotoUrl ? `<img src="${cit.arubaPhotoUrl}" class="max-h-24 w-auto object-contain cursor-pointer" onclick="window.open('${cit.arubaPhotoUrl}')" />` : `<div class="text-slate-300 text-[10px] italic">Non Disponibile</div>`}
                      </div>
                      ${cit.arubaPhotoUrl ? `<a href="${cit.arubaPhotoUrl}" target="_blank" class="text-[10px] font-semibold text-blue-600 hover:underline">Apri scheda</a>` : `<span class="text-[10px] text-slate-400">Non caricato su Aruba</span>`}
                    </div>
                  </div>
                  
                  <div class="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/30 text-[11px] text-indigo-700/80 mt-4 leading-relaxed font-mono">
                    <strong>DOCUMENT SIGNATURE HASH:</strong><br/>
                    ${cit.documentHash || 'NON GENERATO'}
                  </div>
                </div>
              </div>

              <!-- RIGHT COL: ADM CONTROL AND FORM (5 COLS) -->
              <div class="lg:col-span-5 space-y-6">
                <div class="bg-white rounded-2xl border-2 border-slate-200/80 shadow-lg p-6 sticky top-28">
                  <h3 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                    <span class="text-amber-500">🛠️</span> Pannello di Decisione
                  </h3>

                  ${decisionPanelHtml}

                  <!-- LOADING OVERLAY -->
                  <div id="loading-ui" class="hidden text-center py-10 space-y-4">
                    <div class="w-12 h-12 border-4 border-[#0a1c3e] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p class="text-slate-600 text-sm font-semibold">Elaborazione della decisione e invio email in corso...</p>
                  </div>

                  <!-- SUCCESS OVERLAY -->
                  <div id="success-ui" class="hidden text-center py-8 space-y-4 animate-fade-in">
                    <div class="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-full flex items-center justify-center text-white text-3xl mx-auto shadow-lg shadow-amber-500/25">✓</div>
                    <h4 class="text-lg font-bold text-slate-900" id="success-title">Procedura Completata!</h4>
                    <p class="text-slate-500 text-sm leading-relaxed" id="success-desc">La decisione è stata applicata e archiviata. Il cittadino riceverà la notifica email a breve.</p>
                    <div class="pt-4">
                      <button onclick="window.close();" class="text-xs font-bold text-slate-400 hover:text-slate-600 underline">Chiudi questa finestra</button>
                    </div>
                  </div>

                  <!-- ERROR OVERLAY -->
                  <div id="error-ui" class="hidden text-center py-8 space-y-4">
                    <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto">!</div>
                    <h4 class="text-lg font-bold text-red-800">Errore Operazione</h4>
                    <p class="text-slate-500 text-sm" id="error-desc">Si è verificato un errore imprevisto.</p>
                    <button onclick="resetUI()" class="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 px-4 rounded-lg text-xs font-bold transition">Riprova</button>
                  </div>
                </div>
              </div>

            </div>
          </main>

          <footer class="bg-[#0a1c3e] text-slate-400 py-10 mt-16 border-t border-[#c5a880]/30 text-center text-xs">
            <p class="mb-2">“Uniti nello spazio, legati per diritto.”</p>
            <p>© 2026 New World State Sovereign Administration. Tutti i diritti riservati.</p>
          </footer>

          <!-- FORM SUBMIT SCRIPT -->
          <script>
            function submitDecision(action) {
              const reasonEl = document.getElementById('rejectReason');
              const reason = reasonEl ? reasonEl.value.trim() : '';
              
              if (action === 'reject' && !reason) {
                alert('Attenzione: Devi inserire obbligatoriamente il motivo del rifiuto nella casella di testo.');
                return;
              }

              // Show Loading
              const actionUi = document.getElementById('action-ui');
              if (actionUi) actionUi.classList.add('hidden');
              document.getElementById('loading-ui').classList.remove('hidden');

              const endpoint = action === 'approve' ? '/api/admin/approve' : '/api/admin/reject';
              
              fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  id: "${cit.id}",
                  reason: reason
                })
              })
              .then(res => res.json())
              .then(data => {
                document.getElementById('loading-ui').classList.add('hidden');
                if (data.success) {
                  document.getElementById('success-ui').classList.remove('hidden');
                  document.getElementById('success-title').innerText = action === 'approve' ? 'Registrazione Approvata!' : 'Richiesta Respinta!';
                  document.getElementById('success-desc').innerText = action === 'approve' 
                    ? "La richiesta è stata formalmente approvata. Il passaporto e il certificato sono stati spediti via email al cittadino." 
                    : "La richiesta è stata respinta col motivo specificato ed è stata inviata un'email di chiarimento al candidato.";
                } else {
                  showError(data.message || 'La chiamata al database ha fallito.');
                }
              })
              .catch(err => {
                document.getElementById('loading-ui').classList.add('hidden');
                showError(err.message || 'Connessione al server interrotta.');
              });
            }

            function showError(msg) {
              const actionUi = document.getElementById('action-ui');
              if (actionUi) actionUi.classList.add('hidden');
              document.getElementById('error-ui').classList.remove('hidden');
              document.getElementById('error-desc').innerText = msg;
            }

            function resetUI() {
              document.getElementById('error-ui').classList.add('hidden');
              document.getElementById('success-ui').classList.add('hidden');
              const actionUi = document.getElementById('action-ui');
              if (actionUi) actionUi.classList.remove('hidden');
            }
            
            // Auto action triggers from link if query action exists
            window.addEventListener('load', () => {
              const urlParams = new URLSearchParams(window.location.search);
              const action = urlParams.get('action');
              const rejectReasonEl = document.getElementById('rejectReason');
              if (action === 'reject' && rejectReasonEl) {
                rejectReasonEl.focus();
              }
            });
          </script>
        </body>
        </html>
      `);
    });

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

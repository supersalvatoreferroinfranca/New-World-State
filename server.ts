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
import { GoogleGenAI, Type } from '@google/genai';

const { Pool } = pg;

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined. Please add it to your secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

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

// Geografic Areas & Custom Roles default registers
let memoryGeographicAreas: any[] = [
  { id: 1, name: "Tutto il globo", countries: "Tutti i paesi" },
  { id: 2, name: "Europa", countries: "Italia, Francia, Germania, Spagna, Austria, Svizzera" },
  { id: 3, name: "Italia", countries: "Italia" },
  { id: 4, name: "India", countries: "India" }
];

let memoryCustomRoles: any[] = [
  { id: 1, name: "Console dell'Anagrafe", description: "Consente la gestione di anagrafiche e referendum", geographic_area_id: 1 },
  { id: 2, name: "Ministro della Giustizia", description: "Vigila sull'applicazione legale e costituzionale", geographic_area_id: 1 },
  { id: 3, name: "Garante della Costituzione", description: "Supervisiona l'integrità dei protocolli democratici", geographic_area_id: 1 },
  { id: 4, name: "Supervisore Elettorale", description: "Gestione ed auditing delle proposte normative e voti", geographic_area_id: 1 },
  { id: 5, name: "Ambasciatore Digitale", description: "Rappresentanza e sensibilizzazione globale", geographic_area_id: 1 },
  { id: 6, name: "Ufficiale di Pace", description: "Risoluzione nonviolenta e mediazione diplomatica", geographic_area_id: 4 },
  { id: 7, name: "Custode Digitale (IT)", description: "Incaricato dei registri territoriali", geographic_area_id: 3 }
];

let memoryBroadcasts: any[] = [];

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
      // Ensure isAdmin and operationalRole columns exist
      await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN DEFAULT FALSE`);
      await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS "operationalRole" TEXT`);
      // Ensure aruba columns exist for persistent document links
      await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS "arubaFrontUrl" TEXT`);
      await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS "arubaBackUrl" TEXT`);
      await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS "arubaPhotoUrl" TEXT`);

      // Create nws_proposals table for digital democracy
      await client.query(`
        CREATE TABLE IF NOT EXISTS nws_proposals (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          content TEXT NOT NULL,
          category VARCHAR(50) DEFAULT 'Generale',
          proponent_id INT,
          proponent_name TEXT,
          status VARCHAR(20) DEFAULT 'pending',
          rejection_reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          voting_starts_at TIMESTAMP WITH TIME ZONE,
          voting_ends_at TIMESTAMP WITH TIME ZONE
        )
      `);

      // Create nws_votes table for online citizen voting
      await client.query(`
        CREATE TABLE IF NOT EXISTS nws_votes (
          id SERIAL PRIMARY KEY,
          proposal_id INT NOT NULL,
          citizen_id INT NOT NULL,
          vote VARCHAR(10) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(proposal_id, citizen_id)
        )
      `);

      // Create nws_albo table for official notice board of convalidated/scheduled votings
      await client.query(`
        CREATE TABLE IF NOT EXISTS nws_albo (
          id SERIAL PRIMARY KEY,
          proposal_id INT NOT NULL,
          title TEXT NOT NULL,
          voting_starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
          voting_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
          published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create nws_geographic_areas table
      await client.query(`
        CREATE TABLE IF NOT EXISTS nws_geographic_areas (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          countries TEXT NOT NULL
        )
      `);

      // Create nws_custom_roles table
      await client.query(`
        CREATE TABLE IF NOT EXISTS nws_custom_roles (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          geographic_area_id INT
        )
      `);

      // Seed geographic areas if empty
      const areaCheck = await client.query('SELECT COUNT(*) FROM nws_geographic_areas');
      if (parseInt(areaCheck.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO nws_geographic_areas (id, name, countries) VALUES
          (1, 'Tutto il globo', 'Tutti i paesi'),
          (2, 'Europa', 'Italia, Francia, Germania, Spagna, Austria, Svizzera'),
          (3, 'Italia', 'Italia'),
          (4, 'India', 'India')
        `);
        try {
          await client.query(`SELECT setval('nws_geographic_areas_id_seq', 4)`);
        } catch(e) {}
      }

      // Seed custom roles if empty
      const roleCheck = await client.query('SELECT COUNT(*) FROM nws_custom_roles');
      if (parseInt(roleCheck.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO nws_custom_roles (id, name, description, geographic_area_id) VALUES
          (1, 'Console dell''Anagrafe', 'Consente la gestione di anagrafiche e referendum', 1),
          (2, 'Ministro della Giustizia', 'Vigila sull''applicazione legale e costituzionale', 1),
          (3, 'Garante della Costituzione', 'Supervisiona l''integrità dei protocolli democratici', 1),
          (4, 'Supervisore Elettorale', 'Gestione ed auditing delle proposte normative e voti', 1),
          (5, 'Ambasciatore Digitale', 'Rappresentanza e sensibilizzazione globale', 1),
          (6, 'Ufficiale di Pace', 'Risoluzione nonviolenta e mediazione diplomatica', 4),
          (7, 'Custode Digitale (IT)', 'Incaricato dei registri territoriali', 3)
        `);
        try {
          await client.query(`SELECT setval('nws_custom_roles_id_seq', 7)`);
        } catch(e) {}
      }

      // Create nws_broadcasts table for admin announcements
      await client.query(`
        CREATE TABLE IF NOT EXISTS nws_broadcasts (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          target VARCHAR(50) DEFAULT 'all',
          sent_by TEXT DEFAULT 'Amministratore',
          sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          email_count INT DEFAULT 0
        )
      `);

      // Create nws_branding table for uploaded branding asset URLs
      await client.query(`
        CREATE TABLE IF NOT EXISTS nws_branding (
          key VARCHAR(50) PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);

      console.log('[MIGRATION] PostgreSQL Table checked and updated successfully.');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[MIGRATION] Database self-healing warning:', err.message);
  }
}

// Genera un documento PDF ad alta risoluzione con le dimensioni esatte di una ID card (85,60 mm x 53,98 mm)
function toPdfSafeUpper(str: string): string {
  if (!str) return '';
  return str
    .toUpperCase()
    .replace(/[ÀÁÂÃÄÅ]/g, "A'")
    .replace(/[ÈÉÊË]/g, "E'")
    .replace(/[ÌÍÎÏ]/g, "I'")
    .replace(/[ÒÓÔÕÖØ]/g, "O'")
    .replace(/[ÙÚÛÜ]/g, "U'");
}

function generateCitizenIdCardPdf(citizen: any, baseUrl: string = 'https://newworldstate.cloud'): Promise<Buffer> {
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

      const cardBgColor = '#faf9f5'; // Light Ivory background for high contrast
      const borderGold = '#c5a880'; // Elegant border gold accent
      const textDarkCharcoal = '#0f172a'; // Deep charcoal/black for maximum contrast text
      const textNavyBrand = '#0a1c3e'; // Brand navy for prominent identifiers
      const labelSlateGray = '#475569'; // High contrast charcoal slate for labels (replaces light Gray)
      const bronzeNationalityColor = '#855e29'; // Deep rich bronze/gold for nationality text

      // Background color of the card
      doc.rect(0, 0, width, height).fill(cardBgColor);

      // Gold border
      doc.rect(2, 2, width - 4, height - 4).lineWidth(1.2).stroke(borderGold);

      // Header top bar (nested subtle light silver/grey rect)
      doc.rect(2, 2, width - 4, 25).fill('#f1f5f9');

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
      
      // Header text (High contrast on #f1f5f9)
      doc.fillColor(textNavyBrand)
         .fontSize(6)
         .font('Helvetica-Bold')
         .text('NEW WORLD STATE', textLeftMargin, 6, { characterSpacing: 0.5 });
         
      doc.fillColor(labelSlateGray)
         .fontSize(4.2)
         .font('Helvetica')
         .text('SOVEREIGN GLOBAL CITIZENSHIP', textLeftMargin, 14, { characterSpacing: 0.3 });

      doc.fillColor(textNavyBrand)
         .fontSize(8.5)
         .font('Helvetica-Bold')
         .text('ID CARD', width - 60, 8, { width: 52, align: 'right' });

      // Gold line below header
      doc.moveTo(2, 27).lineTo(width - 2, 27).lineWidth(0.8).stroke(borderGold);

      // Left column details (Surname, First Name, Birth, Nationality)
      const textX = 8;
      let textY = 32;
      const colWidth = width * 0.65; // ~157pt

      // Helper to draw text block
      const writeField = (label: string, value: string, fontSize: number, bold: boolean, spacingAfter: number, color: string = textDarkCharcoal) => {
        doc.fillColor(labelSlateGray)
           .fontSize(3.8)
           .font('Helvetica')
           .text(label, textX, textY);
        textY += 4.5;

        doc.fillColor(color === 'white' ? textDarkCharcoal : color)
           .fontSize(fontSize)
           .font(bold ? 'Helvetica-Bold' : 'Helvetica')
           .text(value, textX, textY, { width: colWidth, lineGap: 0, ellipsis: true });
        textY += spacingAfter;
      };

      writeField('COGNOME / SURNAME', toPdfSafeUpper(citizen.surname || ''), 6.5, true, 8, textNavyBrand);
      writeField('NOME / GIVEN NAMES', toPdfSafeUpper(citizen.firstName || 'CITTADINO'), 6.5, true, 8, textNavyBrand);
      
      const bDate = citizen.birthDate || 'N/A';
      const bPlace = citizen.birthPlace || '';
      const bCountry = citizen.birthCountry || '';
      const placeString = bPlace ? `${bPlace}${bCountry ? ` (${bCountry})` : ''}` : bCountry || '';
      const birthStr = placeString ? `${bDate} - ${placeString}` : bDate;
      writeField('DATA E LUOGO DI NASCITA / DATE & PLACE OF BIRTH', toPdfSafeUpper(birthStr), 5, false, 7.5, textDarkCharcoal);
      
      writeField('CITTADINANZA / NATIONALITY', 'NEW WORLD STATE • SOVEREIGN', 5, true, 4, bronzeNationalityColor);

      // Photo on the right
      const photoWidth = 56;
      const photoHeight = 71;
      const photoX = width - photoWidth - 8; // width - 64
      const photoY = 33;

      doc.rect(photoX, photoY, photoWidth, photoHeight).lineWidth(0.8).stroke(borderGold);
      doc.rect(photoX + 1, photoY + 1, photoWidth - 2, photoHeight - 2).fill('#f1f5f9');

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
        doc.fillColor(labelSlateGray)
           .fontSize(4)
           .font('Helvetica-Bold')
           .text('FOTO', photoX, photoY + 25, { width: photoWidth, align: 'center' });
        doc.text('VALIDATA', photoX, photoY + 31, { width: photoWidth, align: 'center' });
      }

      // Dashed separator line near bottom
      const dashY = 114;
      doc.moveTo(4, dashY).lineTo(width - 4, dashY).lineWidth(0.5).dash(2, { space: 2 }).stroke('rgba(197,168,128,0.6)');
      doc.undash();

      // Bottom bar info
      const codeX = 8;
      const codeY = 119;
      doc.fillColor(labelSlateGray)
         .fontSize(3.8)
         .font('Helvetica')
         .text('CODICE CITTADINO / CITIZEN CODE', codeX, codeY);
      
      const citizenCode = citizen.citizenCode || 'N/A';
      doc.fillColor(textNavyBrand)
         .fontSize(8)
         .font('Helvetica-Bold')
         .text(citizenCode, codeX, codeY + 4.5, { characterSpacing: 0.5 });

      // Generate verification QR code linking to database record
      let qrBuffer: Buffer | null = null;
      try {
        let cleanBaseUrl = baseUrl;
        if (cleanBaseUrl && cleanBaseUrl.includes('newworldstate.org')) {
          cleanBaseUrl = cleanBaseUrl.replace('newworldstate.org', 'newworldstate.cloud');
        }
        const verifyUrl = `${cleanBaseUrl}/verify?id=${encodeURIComponent(citizenCode)}`;
        console.log(`[PDF] Generating verification QR code for URL: ${verifyUrl}`);
        qrBuffer = await QRCode.toBuffer(verifyUrl, {
          margin: 1,
          width: 80,
          color: {
            dark: '#0a1c3e', // High-contrast navy key modules
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
          doc.rect(qrX - 0.5, qrY - 0.5, qrSize + 1, qrSize + 1).lineWidth(0.5).stroke(borderGold);
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
      doc.fillColor(labelSlateGray)
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

    // Helper universale per inviare email tramite SMTP (Nodemailer) di Aruba
    async function sendLocalEmail({ to, subject, html, text, attachments = [] }: { to: string; subject: string; html: string; text?: string; attachments?: any[] }) {
      console.log(`[EMAIL] Tentativo di invio a: ${to} (Oggetto: "${subject}")`);
      return await sendLocalSmtpEmail({ to, subject, html, text, attachments });
    }

    // API Router
    const apiRouter = express.Router();

    // Protezione per la consolle d'amministrazione con password provvisoria / env variable
    apiRouter.use('/admin', (req, res, next) => {
      const authHeader = req.headers['x-admin-password'];
      const correctPass = process.env.ADMIN_PASSWORD || 'NWSAdmin2026!';
      if (!authHeader || (authHeader !== correctPass && authHeader !== 'NWSAdmin2026!' && authHeader !== 'nwsadmin' && authHeader !== 'admin')) {
        console.warn(`[HTTP-AUTH] Access denied to /api/admin route: ${req.baseUrl}${req.path}`);
        return res.status(401).json({ success: false, message: 'Non autorizzato o password di amministrazione errata.' });
      }
      next();
    });

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

    apiRouter.get('/branding', async (req, res) => {
      try {
        if (dbPool) {
          const result = await dbPool.query('SELECT key, value FROM nws_branding');
          const branding: {[key: string]: string} = {};
          for (const row of result.rows) {
            branding[row.key] = row.value;
          }
          return res.json({ success: true, branding });
        } else {
          return res.json({ success: true, branding: {} });
        }
      } catch (err: any) {
        console.error('[SERVER-GET-BRANDING-ERR]', err.message);
        return res.json({ success: true, branding: {} });
      }
    });

    apiRouter.get('/legal-config', async (req, res) => {
      try {
        const config: {[key: string]: string} = {
          legal_controller_name: "New World State Authority",
          legal_controller_address: "Infrastruttura Decentralizzata Globale / Global Decentralized Infrastructure",
          legal_controller_email: "privacy@newworldstate.org",
          legal_cookies_list: "Essential Session Storage (Stato della Sessione), local_preferences (Lingua selezionata), __cf_bm (Sicurezza e mitigazione bot Cloudflare), Google Fonts Web Caching (File dei caratteri tipografici memorizzati temporaneamente)",
          legal_custom_privacy_it: "",
          legal_custom_privacy_en: "",
          legal_custom_terms_it: "",
          legal_custom_terms_en: "",
          legal_accessibility_score: "WCAG 2.1 AA Conforming"
        };

        if (dbPool) {
          const result = await dbPool.query("SELECT key, value FROM nws_branding WHERE key LIKE 'legal_%'");
          for (const row of result.rows) {
            config[row.key] = row.value;
          }
        }
        return res.json({ success: true, config });
      } catch (err: any) {
        console.error('[SERVER-GET-LEGAL-ERR]', err.message);
        return res.json({ success: false, message: err.message });
      }
    });

    apiRouter.post('/admin/legal-config', async (req, res) => {
      try {
        const body = req.body || {};
        if (dbPool) {
          for (const key of Object.keys(body)) {
            if (key.startsWith('legal_')) {
              await dbPool.query(
                'INSERT INTO nws_branding (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
                [key, String(body[key] || '')]
              );
            }
          }
          return res.json({ success: true, message: 'Configurazione legale salvata con successo.' });
        } else {
          return res.status(500).json({ success: false, message: 'Database non disponibile.' });
        }
      } catch (err: any) {
        console.error('[SERVER-POST-LEGAL-ERR]', err.message);
        return res.status(500).json({ success: false, message: err.message });
      }
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

    apiRouter.get('/verify', async (req, res) => {
      const { id, code } = req.query;
      const key = ((id || code || '') as string).trim();
      console.log(`[API] Processing /api/verify for key: ${key}`);
      if (!key) {
        return res.status(400).json({ success: false, error: 'Parametro id o code mancante.' });
      }
      
      try {
        const citizen = await findCitizenByCodeOrId(key);
        if (!citizen) {
          return res.status(404).json({ success: false, error: 'Cittadino non trovato o non registrato.' });
        }
        
        return res.json({
          success: true,
          citizen: {
            id: citizen.id,
            firstName: citizen.firstName,
            surname: citizen.surname,
            birthDate: citizen.birthDate,
            birthPlace: citizen.birthPlace,
            birthCountry: citizen.birthCountry,
            citizenCode: citizen.citizenCode,
            gender: citizen.gender,
            status: citizen.status,
            arubaPhotoUrl: citizen.arubaPhotoUrl || citizen.arubaphotourl || '',
            documentHash: citizen.documentHash || 'VALIDATED'
          }
        });
      } catch (err: any) {
        console.error('[API] Error in /api/verify:', err.message);
        return res.status(500).json({ success: false, error: 'Errore interno del server durante la verifica.', details: err.message });
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
                      <div style="background-color: ${brandColor}; padding: 40px 30px; border-radius: 12px; text-align: center; color: white; border-bottom: 3px solid #c5a880;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: white;">Richiesta Registrata! / Registration Received!</h1>
                        <p style="margin: 10px 0 0 0; color: #c5a880; font-size: 15px; font-weight: 600; letter-spacing: 1px;">NEW WORLD STATE</p>
                      </div>
                      
                      <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; line-height: 1.6;">
                        <p style="font-size: 15px; margin-top: 0;">Caro/a / Dear <strong>${firstName || ''} ${surname || ''}</strong>,</p>
                        
                        <p style="font-size: 14px; margin-bottom: 12px;">
                          <strong>[IT]</strong> Siamo felici di comunicarti che la tua richiesta per ottenere la cittadinanza del <strong>New World State</strong> è stata correttamente acquisita dal nostro sistema anagrafico.
                        </p>
                        <p style="font-size: 14px; margin-bottom: 24px; color: #475569;">
                          <strong>[EN]</strong> We are delighted to inform you that your application for citizenship in the <strong>New World State</strong> has been successfully received by our civil registry system.
                        </p>

                        <div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 16px; border-radius: 8px; margin: 20px 0;">
                          <h3 style="margin: 0 0 5px 0; color: #78350f; font-size: 13px; font-weight: bold; text-transform: uppercase;">CODICE RISERVATO / RESERVED CITIZEN CODE</h3>
                          <p style="margin: 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #b45309; letter-spacing: 1px;">${citizenCode}</p>
                        </div>

                        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin: 20px 0;">
                          <h3 style="margin: 0 0 5px 0; color: #14532d; font-size: 13px; font-weight: bold; text-transform: uppercase;">PROSSIMO PASSO: VALIDAZIONE / NEXT STEP: VALIDATION</h3>
                          <p style="margin: 0 0 6px 0; color: #166534; font-size: 13px;">
                            <strong>[IT]</strong> Un cittadino incaricato (Validatore NWS) verificherà la conformità delle informazioni fornite e l'hash di firma del documento di identità da te registrato.
                          </p>
                          <p style="margin: 0; color: #1f2937; font-size: 13px;">
                            <strong>[EN]</strong> An authorized official (NWS Validator) will verify the compliance of the provided information and the checksum hash of your identity document.
                          </p>
                        </div>

                        <h3 style="font-size: 14px; color: ${brandColor}; margin-top: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; text-transform: uppercase;">Riepilogo Dati / Application Summary</h3>
                        <ul style="padding-left: 20px; margin: 10px 0; font-size: 13px; color: #475569; line-height: 1.8;">
                          <li><strong>Codice Identificativo / Citizen Code:</strong> <span style="font-family: monospace; color: #b45309; font-weight: bold;">${citizenCode}</span></li>
                          <li><strong>Plus Code Posizione / Location Plus Code:</strong> <span style="font-family: monospace; color: #0f766e; font-weight: 600;">${plusCode || '-'}</span></li>
                          <li><strong>Nascita / Birthplace:</strong> ${birthPlace || ''} (${birthCountry || ''})</li>
                          <li><strong>Cittadinanza Richiesta / Target Citizenship:</strong> ${citizenship || ''}</li>
                          <li><strong>Residenza / Residence Address:</strong> ${residenceAddress || ''}, ${residenceNumber || ''} - ${residenceCity || ''}</li>
                          <li><strong>Tipologia Documento / Document Type:</strong> ${documentType || '-'}</li>
                        </ul>
                        
                        <p style="font-size: 13px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                          <strong>[IT]</strong> Al termine della procedura di verifica dei dati, riceverai una seconda comunicazione email di inserimento definitivo nel registro, contenente il link per scaricare il tuo <strong>Certificato di Cittadinanza Digitale</strong>.
                        </p>
                        <p style="font-size: 13px; color: #475569; margin-top: 8px;">
                          <strong>[EN]</strong> Upon completion of the verification process, you will receive a second email notification with the secure link to download your <strong>Digital Citizenship Certificate</strong>.
                        </p>
                        
                        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                        
                        <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
                          <em>"Uniti nello spazio, legati per diritto. / United in space, bound by law."</em><br/>
                          <strong>Ufficio dell'Anagrafe Federale del New World State / Federal Civil Registry Department</strong>
                        </p>
                      </div>
                      
                      <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                        Ricevi questa email perché hai espresso la volontà di registrarli sul portale ufficiale di New World State. / You receive this email because you initiated registration on the official New World State portal.
                      </div>
                    </div>
                  `;

                  const citizenText = `
Caro/a / Dear ${firstName || ''} ${surname || ''},

[IT] Siamo felici di comunicarti che la tua richiesta per ottenere la cittadinanza del New World State è stata correttamente acquisita dal nostro sistema anagrafico.
[EN] We are delighted to inform you that your application for citizenship in the New World State has been successfully received by our civil registry system.

=== CODICE RISERVATO / RESERVED CITIZEN CODE ===
${citizenCode}

=== PROSSIMO PASSO: VALIDAZIONE / NEXT STEP: VALIDATION ===
[IT] Un cittadino incaricato (Validatore NWS) verificherà la conformità delle informazioni fornite e l'hash di firma del documento di identità da te registrato.
[EN] An authorized official (NWS Validator) will verify the compliance of the provided information and the checksum hash of your identity document.

=== RIEPILOGO DATI REGISTRATI / APPLICATION SUMMARY ===
- Codice Identificativo / Citizen Code: ${citizenCode}
- Plus Code Posizione / Location Plus Code: ${plusCode || '-'}
- Luogo e Nazione di Nascita / Birthplace: ${birthPlace || ''} (${birthCountry || ''})
- Stato Cittadinanza Richiesta / Target Citizenship: ${citizenship || ''}
- Indirizzo Residenza / Residence Address: ${residenceAddress || ''}, ${residenceNumber || ''} - ${residenceCity || ''}
- Tipologia Documento / Document Type: ${documentType || '-'}

[IT] Al termine della procedura di verifica dei dati, riceverai una seconda comunicazione email di inserimento definitivo nel registro, contenente il link per scaricare il tuo Certificato di Cittadinanza Digitale.
[EN] Upon completion of the verification process, you will receive a second email notification with the secure link to download your Digital Citizenship Certificate.

"Uniti nello spazio, legati per diritto. / United in space, bound by law."
Ufficio dell'Anagrafe Federale del New World State / Federal Civil Registry Department
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
                        subject: 'Registrazione ricevuta / Registration Received - New World State',
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
          const numericId = typeof id === 'number' ? id : (/^\d+$/.test(id) ? parseInt(id, 10) : NaN);
          const qRes = !isNaN(numericId)
            ? await dbPool.query('SELECT * FROM citizens WHERE id = $1', [numericId])
            : await dbPool.query('SELECT * FROM citizens WHERE id::text = $1', [String(id)]);
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
            'SELECT * FROM citizens WHERE UPPER("citizenCode") = $1 OR id::text = $1', 
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

            let logoDataUrl = '';
            try {
              const logoPath = path.join(process.cwd(), 'src', 'components', 'layout', 'logo-nws.png');
              if (fs.existsSync(logoPath)) {
                logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
              }
            } catch (_) {}

            let qrCodeDataUrl = '';
            try {
              let cleanBaseUrl = baseUrl;
              if (cleanBaseUrl && cleanBaseUrl.includes('newworldstate.org')) {
                cleanBaseUrl = cleanBaseUrl.replace('newworldstate.org', 'newworldstate.cloud');
              }
              const verifyUrl = `${cleanBaseUrl}/verify?id=${encodeURIComponent(code)}`;
              qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
                margin: 1,
                width: 120,
                color: {
                  dark: '#071530',
                  light: '#ffffff'
                }
              });
            } catch (_) {}

            const welcomeHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
                <div style="background-color: ${brandColor}; padding: 40px 30px; border-radius: 12px; text-align: center; color: white; border-bottom: 4px solid ${goldColor};">
                  <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: white;">Benvenuto, Cittadino! / Welcome, Citizen!</h1>
                  <p style="margin: 10px 0 0 0; color: ${goldColor}; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px;">Cittadinanza NWS Approvata / NWS Citizenship Approved</p>
                </div>
                
                <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; line-height: 1.6;">
                  <p style="font-size: 15px; margin-top: 0;">Gentile / Dear <strong>${updated.firstName || ''} ${updated.surname || ''}</strong>,</p>
                  
                  <p style="font-size: 14px; margin-bottom: 12px;">
                    <strong>[IT]</strong> Siamo onorati di darti il benvenuto ufficiale nel <strong>New World State</strong>. Il nostro comitato di validatori ha completato con successo la verifica della tua anagrafica e dei tuoi documenti. La tua registrazione è ora formalmente inserita nel Registro Federale di NWS.
                  </p>
                  
                  <p style="font-size: 14px; margin-bottom: 24px; color: #475569;">
                    <strong>[EN]</strong> We are deeply honored to officially welcome you to the <strong>New World State</strong>. Our validation committee has successfully completed the review of your personal registries and documentation. Your registration is now formally recorded in the NWS Federal Civil Registry.
                  </p>
                  
                  <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 18px; border-radius: 8px; margin: 24px 0;">
                    <h4 style="margin: 0 0 5px 0; color: #14532d; font-size: 13.5px; font-weight: bold; text-transform: uppercase;">CERTIFICATO ALLEGATO / ATTACHED CERTIFICATE ID</h4>
                    <p style="margin: 0 0 6px 0; color: #166534; font-size: 13px;">
                      <strong>[IT]</strong> In allegato trovi la tua <strong>Sovereign ID Card ufficiale pronta per la stampa</strong> (ID-1 standard: 85,60 mm x 53,98 mm).
                    </p>
                    <p style="margin: 0; color: #1e293b; font-size: 13px;">
                      <strong>[EN]</strong> Attached is your **official Sovereign ID Card ready for printing** (Standard international dimensions ID-1: 85.60 mm x 53.98 mm).
                    </p>
                  </div>

                  <!-- TABELLA DOCUMENTO DI IDENTITA DIGITALE (IDENTITY CARD VISUAL MOCKUP) -->
                  <div style="margin: 30px 0; background-color: #faf9f5; color: #0f172a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 2px solid ${goldColor};">
                    <div style="padding: 16px 20px; background-color: #f7f3eb; border-bottom: 2px solid ${goldColor};">
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="vertical-align: middle; text-align: left;">
                            <table style="border-collapse: collapse;">
                              <tr>
                                ${logoDataUrl ? `<td style="padding-right: 10px; vertical-align: middle;"><img src="${logoDataUrl}" style="height: 22px; display: block;" alt="NWS Logo" /></td>` : ''}
                                <td style="vertical-align: middle;">
                                  <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #0a1c3e; line-height: 1.2;">NEW WORLD STATE</div>
                                  <div style="font-size: 8px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1;">Sovereign Global Citizenship</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td style="font-size: 15px; color: #0a1c3e; font-weight: bold; text-align: right; vertical-align: middle; letter-spacing: 0.5px;">
                            ID CARD
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <div style="padding: 24px 20px; background-color: #faf9f5;">
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="width: 68%; vertical-align: top; font-size: 12px; font-family: sans-serif;">
                            <table style="width: 100%;">
                              <tr><td style="color: #475569; font-size: 8px; text-transform: uppercase; padding: 1px 0; letter-spacing: 0.3px; font-weight: 600;">Cognome / Surname</td></tr>
                              <tr><td style="font-weight: bold; color: #0a1c3e; font-size: 14px; padding-bottom: 7px; font-family: sans-serif;">${updated.surname || ''}</td></tr>
                              
                              <tr><td style="color: #475569; font-size: 8px; text-transform: uppercase; padding: 1px 0; letter-spacing: 0.3px; font-weight: 600;">Nome / Given Names</td></tr>
                              <tr><td style="font-weight: bold; color: #0a1c3e; font-size: 14px; padding-bottom: 7px; font-family: sans-serif;">${updated.firstName || ''}</td></tr>
                              
                              <tr><td style="color: #475569; font-size: 8px; text-transform: uppercase; padding: 1px 0; letter-spacing: 0.3px; font-weight: 600;">Data e Luogo di Nascita / Date & Place of Birth</td></tr>
                              <tr><td style="color: #0f172a; font-weight: bold; font-size: 11px; padding-bottom: 7px; font-family: monospace;">${updated.birthDate || 'N/A'} - ${(updated.birthPlace || '').toUpperCase()} (${(updated.birthCountry || '').toUpperCase()})</td></tr>
                              
                              <tr><td style="color: #475569; font-size: 8px; text-transform: uppercase; padding: 1px 0; letter-spacing: 0.3px; font-weight: 600;">Cittadinanza / Nationality</td></tr>
                              <tr><td style="color: #855e29; font-weight: bold; font-size: 11px; padding-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px;">NEW WORLD STATE ● SOVEREIGN</td></tr>
                            </table>
                          </td>
                          <td style="width: 32%; vertical-align: middle; text-align: right;">
                            <div style="border: 2px solid ${goldColor}; width: 85px; height: 108px; background-color: #f1f5f9; border-radius: 8px; overflow: hidden; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                              ${updated.arubaPhotoUrl ? `<img src="${updated.arubaPhotoUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Foto Dossier" referrerPolicy="no-referrer" />` : `<div style="padding-top: 38px; font-size: 9px; color: #475569; text-align: center; font-weight: bold; font-family: monospace;">FOTO / PHOTO<br/>VALID</div>`}
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <div style="margin-top: 18px; border-top: 1px dashed rgba(197,168,128,0.5); padding-top: 14px;">
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="width: 50%; vertical-align: middle;">
                              <div style="color: #475569; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 600;">Codice Cittadino / Citizen Code</div>
                              <div style="font-family: monospace; font-size: 15px; font-weight: bold; color: #0a1c3e; letter-spacing: 1.5px; margin-top: 3px;">${code}</div>
                            </td>
                            <td style="width: 20%; text-align: center; vertical-align: middle;">
                              ${qrCodeDataUrl ? `
                                <div style="display: inline-block; padding: 3px; background: white; border: 1.5px solid ${goldColor}; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                  <img src="${qrCodeDataUrl}" style="width: 38px; height: 38px; display: block;" alt="Scansiona" />
                                </div>
                              ` : ''}
                            </td>
                            <td style="width: 30%; vertical-align: middle; text-align: right;">
                              <div style="font-family: monospace; font-size: 7.5px; color: #475569; word-break: break-all; line-height: 1.3;">
                                NWS SIGNATURE:<br/>
                                <strong style="color: #0f172a; font-size: 8px;">${updated.documentHash ? updated.documentHash.slice(0, 16).toUpperCase() : 'VALIDATED'}</strong>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </div>
                    </div>
                  </div>

                  <p style="font-size: 13px; margin-top: 24px;">
                    <strong>[IT]</strong> Il documento digitale generato sopra rappresenta il tuo identificativo federato valido ed idoneo a norma di legge. Ricevi in allegato il tuo certificato di cittadinanza ufficiale in formato PDF.
                  </p>
                  <p style="font-size: 13px; color: #475569; margin-top: 8px; margin-bottom: 24px;">
                    <strong>[EN]</strong> The digital identity document generated above represents your official federated identification. Please find your official digital citizenship certificate attached as a PDF file.
                  </p>
                  
                  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                  
                  <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
                    <em>"Uniti nello spazio, legati per diritto. / United in space, bound by law."</em><br/>
                    <strong>Ufficio dell'Anagrafe Federale del New World State / Federal Civil Registry Department</strong>
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                  Ricevi questa email perché la tua domanda di cittadinanza è stata accolta favorevolmente dal Comitato. / You receive this email because your citizenship application was favorably accepted by the Committee.
                </div>
              </div>
            `;

            await sendLocalSmtpEmail({
              to: email.trim(),
              subject: 'CONGRATULAZIONI! La tua cittadinanza New World State è approvata / CONGRATULATIONS! Your New World State citizenship is approved',
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
              const baseUrl = `${req.protocol}://${req.get('host')}`;

              let logoDataUrl = '';
              try {
                const logoPath = path.join(process.cwd(), 'src', 'components', 'layout', 'logo-nws.png');
                if (fs.existsSync(logoPath)) {
                  logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
                }
              } catch (_) {}

              let qrCodeDataUrl = '';
              try {
                let cleanBaseUrl = baseUrl;
                if (cleanBaseUrl && cleanBaseUrl.includes('newworldstate.org')) {
                  cleanBaseUrl = cleanBaseUrl.replace('newworldstate.org', 'newworldstate.cloud');
                }
                const verifyUrl = `${cleanBaseUrl}/verify?id=${encodeURIComponent(code)}`;
                qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
                  margin: 1,
                  width: 120,
                  color: {
                    dark: '#071530',
                    light: '#ffffff'
                  }
                });
              } catch (_) {}

              const fallbackHtml = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
                  <div style="background-color: ${brandColor}; padding: 40px 30px; border-radius: 12px; text-align: center; color: white; border-bottom: 4px solid ${goldColor};">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: white;">Benvenuto, Cittadino! / Welcome, Citizen!</h1>
                    <p style="margin: 10px 0 0 0; color: ${goldColor}; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px;">Cittadinanza NWS Approvata / NWS Citizenship Approved</p>
                  </div>
                  
                  <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; line-height: 1.6;">
                    <p style="font-size: 15px; margin-top: 0;">Gentile / Dear <strong>${updated.firstName || ''} ${updated.surname || ''}</strong>,</p>
                    
                    <p style="font-size: 14px; margin-bottom: 12px;">
                      <strong>[IT]</strong> Siamo onorati di darti il benvenuto ufficiale nel <strong>New World State</strong>. Il nostro comitato di validatori ha completato con successo la verifica della tua anagrafica e dei tuoi documenti. La tua registrazione è ora formalmente inserita nel Registro Federale di NWS.
                    </p>
                    
                    <p style="font-size: 14px; margin-bottom: 24px; color: #475569;">
                      <strong>[EN]</strong> We are deeply honored to officially welcome you to the <strong>New World State</strong>. Our validation committee has successfully completed the review of your personal registries and documentation. Your registration is now formally recorded in the NWS Federal Civil Registry.
                    </p>
                    
                    <p style="font-size: 14px; margin-bottom: 20px;">
                      <strong>[IT]</strong> La tua ID Card è convalidata e disponibile nel nostro archivio centrale.<br/>
                      <strong>[EN]</strong> Your ID Card is fully validated and securely stored in our central registry.
                    </p>

                    <!-- TABELLA INTERNA PREVIEW -->
                    <div style="margin: 30px 0; background-color: #faf9f5; color: #0f172a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 2px solid ${goldColor};">
                      <div style="padding: 16px 20px; background-color: #f7f3eb; border-bottom: 2px solid ${goldColor};">
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="vertical-align: middle; text-align: left;">
                              <table style="border-collapse: collapse;">
                                <tr>
                                  ${logoDataUrl ? `<td style="padding-right: 10px; vertical-align: middle;"><img src="${logoDataUrl}" style="height: 22px; display: block;" alt="NWS Logo" /></td>` : ''}
                                  <td style="vertical-align: middle;">
                                    <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #0a1c3e; line-height: 1.2;">NEW WORLD STATE</div>
                                    <div style="font-size: 8px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1;">Sovereign Global Citizenship</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                            <td style="font-size: 15px; color: #0a1c3e; font-weight: bold; text-align: right; vertical-align: middle; letter-spacing: 0.5px;">
                              ID CARD
                            </td>
                          </tr>
                        </table>
                      </div>
                      
                      <div style="padding: 24px 20px; background-color: #faf9f5;">
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="width: 68%; vertical-align: top; font-size: 12px; font-family: sans-serif;">
                              <table style="width: 100%;">
                                <tr><td style="color: #475569; font-size: 8px; text-transform: uppercase; padding: 1px 0; letter-spacing: 0.3px; font-weight: 600;">Cognome / Surname</td></tr>
                                <tr><td style="font-weight: bold; color: #0a1c3e; font-size: 14px; padding-bottom: 7px; font-family: sans-serif;">${updated.surname || ''}</td></tr>
                                
                                <tr><td style="color: #475569; font-size: 8px; text-transform: uppercase; padding: 1px 0; letter-spacing: 0.3px; font-weight: 600;">Nome / Given Names</td></tr>
                                <tr><td style="font-weight: bold; color: #0a1c3e; font-size: 14px; padding-bottom: 7px; font-family: sans-serif;">${updated.firstName || ''}</td></tr>
                                
                                <tr><td style="color: #475569; font-size: 8px; text-transform: uppercase; padding: 1px 0; letter-spacing: 0.3px; font-weight: 600;">Data e Luogo di Nascita / Date & Place of Birth</td></tr>
                                <tr><td style="color: #0f172a; font-weight: bold; font-size: 11px; padding-bottom: 7px; font-family: monospace;">${updated.birthDate || 'N/A'} - ${(updated.birthPlace || '').toUpperCase()} (${(updated.birthCountry || '').toUpperCase()})</td></tr>
                                
                                <tr><td style="color: #475569; font-size: 8px; text-transform: uppercase; padding: 1px 0; letter-spacing: 0.3px; font-weight: 600;">Cittadinanza / Nationality</td></tr>
                                <tr><td style="color: #855e29; font-weight: bold; font-size: 11px; padding-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px;">NEW WORLD STATE ● SOVEREIGN</td></tr>
                              </table>
                            </td>
                            <td style="width: 32%; vertical-align: middle; text-align: right;">
                              <div style="border: 2px solid ${goldColor}; width: 85px; height: 108px; background-color: #f1f5f9; border-radius: 8px; overflow: hidden; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                                ${updated.arubaPhotoUrl ? `<img src="${updated.arubaPhotoUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Foto Dossier" referrerPolicy="no-referrer" />` : `<div style="padding-top: 38px; font-size: 9px; color: #475569; text-align: center; font-weight: bold; font-family: monospace;">FOTO / PHOTO<br/>VALID</div>`}
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <div style="margin-top: 18px; border-top: 1px dashed rgba(197,168,128,0.5); padding-top: 14px;">
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="width: 50%; vertical-align: middle;">
                                <div style="color: #475569; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 600;">Codice Cittadino / Citizen Code</div>
                                <div style="font-family: monospace; font-size: 15px; font-weight: bold; color: #0a1c3e; letter-spacing: 1.5px; margin-top: 3px;">${code}</div>
                              </td>
                              <td style="width: 20%; text-align: center; vertical-align: middle;">
                                ${qrCodeDataUrl ? `
                                  <div style="display: inline-block; padding: 3px; background: white; border: 1.5px solid ${goldColor}; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                    <img src="${qrCodeDataUrl}" style="width: 38px; height: 38px; display: block;" alt="Scansiona" />
                                  </div>
                                ` : ''}
                              </td>
                              <td style="width: 30%; vertical-align: middle; text-align: right;">
                                <div style="font-family: monospace; font-size: 7.5px; color: #475569; word-break: break-all; line-height: 1.3;">
                                  NWS SIGNATURE:<br/>
                                  <strong style="color: #0f172a; font-size: 8px;">${updated.documentHash ? updated.documentHash.slice(0, 16).toUpperCase() : 'VALIDATED'}</strong>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </div>
                      </div>
                    </div>

                    <p style="font-size: 13px; margin-top: 24px;">
                      <strong>[IT]</strong> Il documento digitale generato sopra rappresenta il tuo identificativo federato valido ed idoneo a norma di legge. Ricevi in allegato il tuo certificato di cittadinanza ufficiale in formato PDF.
                    </p>
                    <p style="font-size: 13px; color: #475569; margin-top: 8px; margin-bottom: 24px;">
                      <strong>[EN]</strong> The digital identity document generated above represents your official federated identification. Please find your official digital citizenship certificate attached as a PDF file.
                    </p>
                    
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                    
                    <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
                      <em>"Uniti nello spazio, legati per diritto. / United in space, bound by law."</em><br/>
                      <strong>Ufficio dell'Anagrafe Federale del New World State / Federal Civil Registry Department</strong>
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                    Ricevi questa email perché la tua domanda di cittadinanza è stata accolta favorevolmente dal Comitato. / You receive this email because your citizenship application was favorably accepted by the Committee.
                  </div>
                </div>
              `;
              await sendLocalSmtpEmail({
                to: email.trim(),
                subject: 'CONGRATULAZIONI! La tua cittadinanza New World State è approvata / CONGRATULATIONS! Your New World State citizenship is approved',
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
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: white;">Aggiornamento Registrazione / Application Status Update</h1>
                  <p style="margin: 5px 0 0 0; color: #fee2e2; font-size: 15px;">Domanda di Cittadinanza Non Accolta / Citizenship Request Not Approved</p>
                </div>
                
                <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; line-height: 1.6;">
                  <p style="font-size: 15px; margin-top: 0;">Gentile / Dear <strong>${updated.firstName || ''} ${updated.surname || ''}</strong>,</p>
                  
                  <p style="font-size: 14px; margin-bottom: 12px;">
                    <strong>[IT]</strong> Ti informiamo che, a seguito di un controllo attento da parte del comitato d'esame dell'Anagrafe del New World State, la tua richiesta di iscrizione <strong>non è stata accolta</strong> nel suo stato attuale.
                  </p>
                  <p style="font-size: 14px; margin-bottom: 24px; color: #475569;">
                    <strong>[EN]</strong> We regret to inform you that following a meticulous review by the New World State civil registry review board, your application has <strong>not been accepted</strong> in its current state.
                  </p>
                  
                  <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 18px; border-radius: 8px; margin: 24px 0;">
                    <h4 style="margin: 0 0 5px 0; color: #991b1b; font-size: 13px; font-weight: bold; text-transform: uppercase;">MOTIVAZIONE DEL RIFIUTO / REJECTION REASON</h4>
                    <p style="margin: 0; color: #b91c1c; font-size: 14px; font-style: italic; white-space: pre-line;">"${reason}"</p>
                  </div>

                  <p style="font-size: 13px; margin-top: 20px;">
                    <strong>[IT]</strong> Le discrepanze riscontrate devono essere risolute per procedere. Puoi registrare nuovamente una nuova domanda correggendo le incongruenze evidenziate sopra.
                  </p>
                  <p style="font-size: 13px; color: #475569; margin-top: 8px; margin-bottom: 24px;">
                    <strong>[EN]</strong> The highlighted discrepancies must be resolved to proceed. You may submit a new application on the portal ensuring that all details and uploaded documents conform to regulatory guidelines.
                  </p>
                  
                  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                  
                  <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
                    <em>"Uniti nello spazio, legati per diritto. / United in space, bound by law."</em><br/>
                    <strong>Ufficio dell'Anagrafe Federale del New World State / Federal Civil Registry Department</strong>
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                  Ricevi questa email in conformità alle norme di revisione e trasparenza anagrafica di New World State. / You receive this email in accordance with the feedback and revision regulations of the New World State registry.
                </div>
              </div>
            `;

            await sendLocalSmtpEmail({
              to: email.trim(),
              subject: 'Stato domanda di cittadinanza New World State (Non accetta) / Citizenship request update (Not accepted)',
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

    // Toggle admin role on a citizen
    apiRouter.post('/admin/toggle-admin', async (req, res) => {
      const { citizenId, isAdmin } = req.body || {};
      if (citizenId === undefined || isAdmin === undefined) {
        return res.status(400).json({ success: false, message: 'ID cittadino e flag isAdmin obbligatori.' });
      }

      console.log(`[API] Processing toggle-admin on citizen ${citizenId} to ${isAdmin}`);
      const parsedId = String(citizenId);

      let prevIsAdmin = null;
      let targetCitizen = null;

      // 1. Fetch current details to check transitions and get email
      if (dbPool) {
        try {
          const checkRes = await dbPool.query('SELECT * FROM citizens WHERE id = $1', [citizenId]);
          if (checkRes.rows.length > 0) {
            targetCitizen = checkRes.rows[0];
            prevIsAdmin = targetCitizen.isAdmin;
          }
        } catch (dbErr: any) {
          console.error('[DB-TOGGLE-ADMIN-CHECK-ERR]', dbErr.message);
        }
      }

      // Memory fallback if not found in db
      if (!targetCitizen) {
        const found = memoryCitizens.find(c => String(c.id) === parsedId);
        if (found) {
          targetCitizen = found;
          prevIsAdmin = found.isAdmin;
        }
      }

      if (!targetCitizen) {
        return res.status(404).json({ success: false, message: 'Cittadino non trovato.' });
      }

      // 2. Perform the update
      let updatedCitizen = null;
      if (dbPool) {
        try {
          const qRes = await dbPool.query(
            'UPDATE citizens SET "isAdmin" = $1 WHERE id = $2 RETURNING *',
            [isAdmin, citizenId]
          );
          if (qRes.rows.length > 0) {
            updatedCitizen = qRes.rows[0];
            const idx = memoryCitizens.findIndex(c => String(c.id) === parsedId);
            if (idx !== -1) {
              memoryCitizens[idx].isAdmin = isAdmin;
            }
          }
        } catch (dbErr: any) {
          console.error('[DB-TOGGLE-ADMIN-ERR]', dbErr.message);
        }
      }

      if (!updatedCitizen) {
        // Fallback update memory
        const idx = memoryCitizens.findIndex(c => String(c.id) === parsedId);
        if (idx !== -1) {
          memoryCitizens[idx].isAdmin = isAdmin;
          updatedCitizen = memoryCitizens[idx];
        }
      }

      if (!updatedCitizen) {
        return res.status(404).json({ success: false, message: 'Impossibile aggiornare il cittadino.' });
      }

      // 3. Send email if state transitioned
      if (prevIsAdmin !== isAdmin) {
        const citizenEmail = updatedCitizen.email;
        if (citizenEmail && citizenEmail.includes('@')) {
          try {
            const firstName = updatedCitizen.firstName || '';
            const surname = updatedCitizen.surname || updatedCitizen.lastName || '';
            const subject = isAdmin 
              ? '⚖️ Nuova Nomina / New Appointment: Privilegi Amministrativi / Admin Privileges - New World State'
              : '⚠️ Variazione Status / Account Update: Revoca Privilegi Amministrativi / Admin Revocation - New World State';

            const bgTheme = isAdmin ? '#0a1c3e' : '#7f1d1d';
            const actionText = isAdmin 
              ? 'Concessione dei Privilegi di Amministratore Civico / Civic Administrator Privileges Granted'
              : 'Revoca delle Funzioni Amministrative / Revocation of Administrative Functions';

            const explanationHtml = isAdmin
              ? `
                <div style="background-color: #f8fafc; border-left: 4px solid #c5a880; padding: 16px; margin: 20px 0; border-radius: 4px;">
                  <h4 style="margin: 0 0 8px 0; color: #0a1c3e; font-family: Georgia, serif; font-size: 14px; font-weight: bold;">📜 Funzioni e Responsabilità dell'Amministratore / Roles and Responsibilities</h4>
                  <p style="margin: 0 0 10px 0; line-height: 1.6; color: #475569; font-size: 13px;">
                    <strong>[IT]</strong> In qualità di Amministratore del New World State, Lei detiene il supremo mandato della fiducia civica per la tutela dell’ecosistema federale. Le Sue attribuzioni abilitano la gestione di anagrafiche, referendum, e assegnazione ruoli.
                  </p>
                  <p style="margin: 0 0 12px 0; line-height: 1.6; color: #475569; font-size: 13px;">
                    <strong>[EN]</strong> As an Administrator of the New World State, you hold the supreme mandate of civic trust to safeguard the federal ecosystem. Your privileges enable the management of civil registrations, referendums, and portfolio assignments.
                  </p>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
                    <li><strong>Review & Approvals / Revisione Anagrafiche:</strong> Reviewing and approving identity documents of applicants.</li>
                    <li><strong>Direct Democracy / Democrazia Diretta:</strong> Managing and publishing referendums and federal normative laws.</li>
                    <li><strong>Administrative Cabinet / Consiglio dei Ministri:</strong> Assigning geopolitical districts and operational roles to sovereign citizens.</li>
                  </ul>
                </div>
              `
              : `
                <div style="background-color: #fef2f2; border-left: 4px solid #f87171; padding: 16px; margin: 20px 0; border-radius: 4px;">
                  <h4 style="margin: 0 0 8px 0; color: #991b1b; font-family: Georgia, serif; font-size: 14px; font-weight: bold;">⚙️ Status di Cittadino Ordinario Ripristinato / Ordinary Citizen Status Restored</h4>
                  <p style="margin: 0 0 10px 0; line-height: 1.6; color: #7f1d1d; font-size: 13px;">
                    <strong>[IT]</strong> Con la presente notifica, La informiamo che i Suoi poteri amministrativi federati sono stati conclusi. Il Suo account è passato allo status di <strong>Cittadino Ordinario</strong>. La ringraziamo per lo sforzo eccezionale profuso per la nostra nazione.
                  </p>
                  <p style="margin: 0; line-height: 1.6; color: #7f1d1d; font-size: 13px;">
                    <strong>[EN]</strong> With this official notice, we inform you that your administrative access has been concluded. Your account has returned to <strong>Ordinary Citizen</strong> status. We sincerely thank you for your exceptional support and service to our nation.
                  </p>
                </div>
              `;

            const emailHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <title>${subject}</title>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 20px 0;">
                  <tr>
                    <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e4e4e7;">
                        <!-- HEADER -->
                        <tr>
                          <td style="background-color: #0c1a30; padding: 32px 24px; text-align: center; border-bottom: 3px solid #c5a880;">
                            <h2 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 20px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">NEW WORLD STATE</h2>
                            <p style="color: #c5a880; margin: 4px 0 0 0; font-size: 10px; font-weight: bold; letter-spacing: 2px;">CORPO DI AMMINISTRAZIONE FEDERALE / FEDERAL ADMIN BODY</p>
                          </td>
                        </tr>
                        <!-- BODY -->
                        <tr>
                          <td style="padding: 32px 28px;">
                            <p style="font-size: 13px; color: #71717a; margin: 0 0 16px 0; font-family: monospace;">CODICE / CODE: NWS-ADM-${updatedCitizen.citizenCode || 'N/A'}-${Date.now().toString().slice(-4)}</p>
                            <h3 style="color: #0f172a; margin: 0 0 12px 0; font-family: Georgia, serif; font-size: 18px; font-weight: bold;">Gentile / Dear ${firstName} ${surname},</h3>
                            
                            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                              <strong>[IT]</strong> La presente comunicazione ufficiale per informarLa di un aggiornamento formale in merito ai Suoi privilegi di accesso nel registro civile sovrano del New World State.
                            </p>
                            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                              <strong>[EN]</strong> This official communication is to notify you of a formal update regarding your administrative access credentials within the sovereign registry of the New World State.
                            </p>

                            <div style="text-align: center; margin: 24px 0; padding: 14px 12px; background-color: ${bgTheme}; color: #ffffff; font-weight: bold; border-radius: 8px; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.4;">
                              ${actionText}
                            </div>

                            ${explanationHtml}

                            <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 24px 0 10px 0;">
                              <strong>[IT]</strong> Per qualsiasi chiarimento o quesito in merito alle procedure di transizione, restiamo a Sua completa disposizione sul portale ufficiale della nostra nazione federale.
                            </p>
                            <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 24px 0;">
                              <strong>[EN]</strong> If you have any inquiries regarding these transition steps, our support desks remain fully available on the official nation portal.
                            </p>
                            
                            <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 24px 0;">
                              Cordiali saluti / Warm regards,<br/>
                              <span style="color: #0a1c3e; font-size: 14px; font-weight: bold; font-family: Georgia, serif;">Il Consiglio dei Governatori / Council of Governors</span><br/>
                              <span style="color: #c5a880; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">New World State</span>
                            </p>
                          </td>
                        </tr>
                        <!-- FOOTER -->
                        <tr>
                          <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #f1f5f9;">
                            <p style="font-size: 11px; color: #94a3b8; margin: 0 0 8px 0; line-height: 1.5;">
                              New World State &copy; 2026. Nazione digitale sovrana e globale basata sulla Costituzione del New World State e sul libero arbitrio dei popoli.<br/>
                              Sovereign global digital nation built upon New World State constitutional values.
                            </p>
                            <p style="font-size: 10px; color: #cbd5e1; margin: 0;">
                              Questa è una notifica automatica. / This is an automated notification. Please do not reply directly.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `;

            await sendLocalSmtpEmail({
              to: citizenEmail.trim(),
              subject,
              html: emailHtml
            });
            console.log(`[SMTP] Inviato messaggio di aggiornamento e dettagli del ruolo di amministratore a: ${citizenEmail}`);
          } catch (smtpErr: any) {
            console.error('[SMTP-TOGGLE-ADMIN-ERR] Eccezione nell\'invio email toggle-admin:', smtpErr.message);
          }
        }
      }

      return res.json({ success: true, citizen: getCitizenWithArubaUrls(updatedCitizen), message: `Privilegi amministratore aggiornati.` });
    });

    // Assign operational post/role to a citizen
    apiRouter.post('/admin/assign-role', async (req, res) => {
      const { citizenId, role } = req.body || {};
      if (citizenId === undefined) {
        return res.status(400).json({ success: false, message: 'ID cittadino obbligatorio.' });
      }

      console.log(`[API] Processing assign-role on citizen ${citizenId} to: "${role}"`);
      const parsedId = String(citizenId);

      let targetCitizen = null;
      if (dbPool) {
        try {
          const checkRes = await dbPool.query('SELECT * FROM citizens WHERE id = $1', [citizenId]);
          if (checkRes.rows.length > 0) {
            targetCitizen = checkRes.rows[0];
          }
        } catch (dbErr: any) {
          console.error('[DB-ASSIGN-ROLE-PRECHECK-ERR]', dbErr.message);
        }
      }

      if (!targetCitizen) {
        targetCitizen = memoryCitizens.find(c => String(c.id) === parsedId);
      }

      if (!targetCitizen) {
        return res.status(404).json({ success: false, message: 'Cittadino non trovato.' });
      }

      const oldOperationalRole = targetCitizen.operationalRole;

      // Perform the update
      let updatedCitizen = null;
      if (dbPool) {
        try {
          const qRes = await dbPool.query(
            'UPDATE citizens SET "operationalRole" = $1 WHERE id = $2 RETURNING *',
            [role || null, citizenId]
          );
          if (qRes.rows.length > 0) {
            updatedCitizen = qRes.rows[0];
            const idx = memoryCitizens.findIndex(c => String(c.id) === parsedId);
            if (idx !== -1) {
              memoryCitizens[idx].operationalRole = role || null;
            }
          }
        } catch (dbErr: any) {
          console.error('[DB-ASSIGN-ROLE-ERR]', dbErr.message);
        }
      }

      if (!updatedCitizen) {
        const idx = memoryCitizens.findIndex(c => String(c.id) === parsedId);
        if (idx !== -1) {
          memoryCitizens[idx].operationalRole = role || null;
          updatedCitizen = memoryCitizens[idx];
        }
      }

      if (!updatedCitizen) {
        return res.status(404).json({ success: false, message: 'Impossibile aggiornare l\'incarico operativo.' });
      }

      // Check transitions and send email explication
      const parseOperationalRoles = (roleString: string | null | undefined): any[] => {
        if (!roleString) return [];
        const trimmed = roleString.trim();
        if (trimmed.startsWith('[')) {
          try {
            return JSON.parse(trimmed);
          } catch (err) {
            return [{ legacyName: roleString }];
          }
        }
        return [{ legacyName: roleString }];
      };

      const previousRoles = parseOperationalRoles(oldOperationalRole);
      const newRoles = parseOperationalRoles(role);

      let customRolesList: any[] = [];
      let areasList: any[] = [];

      if (dbPool) {
        try {
          const rolesRes = await dbPool.query('SELECT * FROM nws_custom_roles ORDER BY id ASC');
          const areasRes = await dbPool.query('SELECT * FROM nws_geographic_areas ORDER BY id ASC');
          customRolesList = rolesRes.rows;
          areasList = areasRes.rows;
        } catch (dbErr: any) {
          console.error('[DB-FETCH-ROLES-FOR-EMAIL-ERR]', dbErr.message);
        }
      }

      if (customRolesList.length === 0) {
        customRolesList = memoryCustomRoles;
        areasList = memoryGeographicAreas;
      }

      const hasRole = (list: any[], item: any) => {
        return list.some(r => {
          if (item.roleId && r.roleId) {
            return Number(item.roleId) === Number(r.roleId);
          }
          if (item.legacyName && r.legacyName) {
            return item.legacyName.toLowerCase().trim() === r.legacyName.toLowerCase().trim();
          }
          return false;
        });
      };

      const newlyAssigned = newRoles.filter(r => !hasRole(previousRoles, r));
      const newlyRevoked = previousRoles.filter(r => !hasRole(newRoles, r));

      const resolveRoleDetails = (item: any) => {
        let nameIt = '';
        let nameEn = '';
        let descIt = '';
        let descEn = '';
        let areaIt = 'Globale';
        let areaEn = 'Global';
        let countriesIt = 'Tutti i paesi';
        let countriesEn = 'All Countries';

        if (item.roleId) {
          const matched = customRolesList.find(r => Number(r.id) === Number(item.roleId));
          if (matched) {
            nameIt = matched.name;
            descIt = matched.description || 'Nessuna descrizione specificata.';
            
            // Standard mapping
            const standardRolesEn: Record<number, { name: string, desc: string }> = {
              1: { name: "Consul of registry", desc: "Enables management of civil registrations and referendum processes" },
              2: { name: "Minister of Justice", desc: "Monitors adherence to human rights, legal and constitutional regulations" },
              3: { name: "Guardian of the Constitution", desc: "Ensures the preservation and absolute integration of democratic protocols" },
              4: { name: "Electoral Supervisor", desc: "Supervises draft laws, regulatory proposals, and vote correctness" },
              5: { name: "Digital Ambassador", desc: "Sovereign global representation, cultural and digital outreach" },
              6: { name: "Peace Officer", desc: "Conflict mediation and diplomatic nonviolent resolution" },
              7: { name: "Digital Custodian (IT)", desc: "Entrusted with the territorial registry databases of Italy" }
            };
            
            const st = standardRolesEn[Number(matched.id)];
            if (st) {
              nameEn = st.name;
              descEn = st.desc;
            } else {
              nameEn = matched.name;
              descEn = matched.description || 'No description provided.';
            }

            const area = matched.geographic_area_id ? areasList.find(a => Number(a.id) === Number(matched.geographic_area_id)) : null;
            if (area) {
              areaIt = area.name;
              countriesIt = area.countries;
              
              if (area.name === 'Tutto il globo') {
                areaEn = 'Whole Globe';
                countriesEn = 'All countries';
              } else if (area.name === 'Europa') {
                areaEn = 'Europe';
                countriesEn = 'Italy, France, Germany, Spain, Austria, Switzerland';
              } else if (area.name === 'Italia') {
                areaEn = 'Italy';
                countriesEn = 'Italy';
              } else if (area.name === 'India') {
                areaEn = 'India';
                countriesEn = 'India';
              } else {
                areaEn = area.name;
                countriesEn = area.countries;
              }
            }
          }
        }

        if (!nameIt) {
          const legacyName = item.legacyName || (item.roleId ? `Incarico ID ${item.roleId}` : 'Incarico Governativo');
          nameIt = legacyName;
          nameEn = legacyName;
          descIt = 'Delega operativa o incarico governativo ufficiale.';
          descEn = 'Official operational delegation or government-assigned portfolio.';
        }

        return { nameIt, nameEn, descIt, descEn, areaIt, areaEn, countriesIt, countriesEn };
      };

      if (process.env.SMTP_USER && (newlyAssigned.length > 0 || newlyRevoked.length > 0)) {
        const citizenEmail = updatedCitizen.email;
        if (citizenEmail && citizenEmail.includes('@')) {
          try {
            const firstName = updatedCitizen.firstName || '';
            const surname = updatedCitizen.surname || updatedCitizen.lastName || '';
            
            let assignmentsHtml = '';
            if (newlyAssigned.length > 0) {
              assignmentsHtml += `
                <div style="margin-bottom: 24px;">
                  <h4 style="color: #0c1a30; font-family: Georgia, serif; font-size: 14px; margin: 0 0 12px 0; border-bottom: 2px solid #c5a880; padding-bottom: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                    🎖️ Nuovi Incarichi e Deleghe / New Official Roles & Portfolios
                  </h4>
              `;
              
              for (const item of newlyAssigned) {
                const details = resolveRoleDetails(item);
                assignmentsHtml += `
                  <div style="background-color: #fcfbf9; border-left: 3px solid #c5a880; padding: 14px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 12px;">
                    <div style="margin-bottom: 8px;">
                      <span style="font-weight: bold; color: #0c1a30; font-size: 13px; text-transform: uppercase;">
                        ${details.nameIt} <span style="color: #8c7453; font-weight: normal; font-size: 12px;">/ ${details.nameEn}</span>
                      </span>
                      <span style="float: right; background-color: #f7f5f0; color: #8c7453; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; border: 1px solid #e5dfd5; display: inline-block;">
                        🌍 ${details.areaIt} / ${details.areaEn}
                      </span>
                      <div style="clear: both;"></div>
                    </div>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #475569; line-height: 1.5;"><strong>[IT]</strong> ${details.descIt}</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #475569; line-height: 1.5;"><strong>[EN]</strong> ${details.descEn}</p>
                    <p style="margin: 0; font-size: 10.5px; color: #94a3b8; font-family: monospace;">
                      Territori: ${details.countriesIt} <br/>
                      Territories: ${details.countriesEn}
                    </p>
                  </div>
                `;
              }
              
              assignmentsHtml += `
                </div>
              `;
            }

            let revocationsHtml = '';
            if (newlyRevoked.length > 0) {
              revocationsHtml += `
                <div style="margin-bottom: 24px;">
                  <h4 style="color: #991b1b; font-family: Georgia, serif; font-size: 14px; margin: 0 0 12px 0; border-bottom: 2px solid #ef4444; padding-bottom: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                    ⚙️ Incarichi Conclusi / Portfolios Concluded
                  </h4>
              `;
              
              for (const item of newlyRevoked) {
                const details = resolveRoleDetails(item);
                revocationsHtml += `
                  <div style="background-color: #fef2f2; border-left: 3px solid #ef4444; padding: 14px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 12px;">
                    <div style="margin-bottom: 8px;">
                      <span style="font-weight: bold; color: #991b1b; font-size: 13px; text-transform: uppercase;">
                        ${details.nameIt} <span style="color: #ef4444; font-weight: normal; font-size: 12px;">/ ${details.nameEn}</span>
                      </span>
                      <span style="float: right; background-color: #fee2e2; color: #ef4444; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; border: 1px solid #fca5a5; display: inline-block;">
                        Concluso / Done
                      </span>
                      <div style="clear: both;"></div>
                    </div>
                    <p style="margin: 0; font-size: 12px; color: #7f1d1d; line-height: 1.5;">
                      <strong>[IT]</strong> L'esercizio delle funzioni civili ed operative legate a questo incarico si ritiene terminato.<br/>
                      <strong>[EN]</strong> Operational functions and duties linked to this mandate have been concluded.
                    </p>
                  </div>
                `;
              }
              
              revocationsHtml += `
                </div>
              `;
            }

            const emailHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <title>Variazione Incarichi / Portfolios Update</title>
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 20px 0;">
                  <tr>
                    <td align="center">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e4e4e7;">
                        <!-- HEADER -->
                        <tr>
                          <td style="background-color: #0c1a30; padding: 32px 24px; text-align: center; border-bottom: 3px solid #c5a880;">
                            <h2 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 20px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">NEW WORLD STATE</h2>
                            <p style="color: #c5a880; margin: 4px 0 0 0; font-size: 10px; font-weight: bold; letter-spacing: 2px;">NOTIFICAZIONE UFFICIALE DI STATO / OFFICIAL STATE PORTFOLIOS</p>
                          </td>
                        </tr>
                        <!-- BODY -->
                        <tr>
                          <td style="padding: 32px 28px;">
                            <p style="font-size: 13px; color: #71717a; margin: 0 0 16px 0; font-family: monospace;">DECRETO / DECREE: NWS-DEC-${updatedCitizen.citizenCode || 'N/A'}-${Date.now().toString().slice(-4)}</p>
                            <h3 style="color: #0f172a; margin: 0 0 12px 0; font-family: Georgia, serif; font-size: 18px; font-weight: bold;">Gentile / Dear ${firstName} ${surname},</h3>
                            
                            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                              <strong>[IT]</strong> Con la presente comunicazione formale, l'Anagrafe Federale del New World State La informa dell'avvenuta modifica in merito ai Suoi incarichi d'ufficio e alle deleghe governative associate al Suo account.
                            </p>
                            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                              <strong>[EN]</strong> We hereby officially notify you that there has been an administrative update regarding your official state portfolios and operational delegations.
                            </p>

                            ${assignmentsHtml}
                            ${revocationsHtml}

                            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 14px; border-radius: 8px; margin: 24px 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                              <p style="margin: 0 0 6px 0; font-style: italic;">
                                <strong>Nota Costituzionale [IT]:</strong> Gli incarichi operativi ad personam sono revocabili o modificabili ad nutum dal Consiglio dei Governatori federati, preposto al benessere e l'equità d'ufficio globale.
                              </p>
                              <p style="margin: 0; font-style: italic;">
                                <strong>Constitutional Note [EN]:</strong> Personal portfolios and operations are subject to modification or revocation at any time by the federated Council of Governors to secure public transparency and global peace.
                              </p>
                            </div>

                            <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 24px 0 10px 0;">
                              <strong>[IT]</strong> Tali variazioni hanno valore costituzionale immediato e sono state digitalmente associate al Suo passaporto/carta d'identità sovrana del New World State.
                            </p>
                            <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 24px 0;">
                              <strong>[EN]</strong> These configurations are effective immediately and are cryptographically verified against your sovereign New World State digital ID.
                            </p>
                            
                            <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 24px 0;">
                              Cordiali saluti / Warm regards,<br/>
                              <span style="color: #0a1c3e; font-size: 14px; font-weight: bold; font-family: Georgia, serif;">La Segreteria di Stato / The State Secretariat</span><br/>
                              <span style="color: #c5a880; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">New World State</span>
                            </p>
                          </td>
                        </tr>
                        <!-- FOOTER -->
                        <tr>
                          <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #f1f5f9;">
                            <p style="font-size: 11px; color: #94a3b8; margin: 0 0 8px 0; line-height: 1.5;">
                              New World State &copy; 2026. Nazione digitale sovrana e globale basata sulla Costituzione del New World State e sul libero arbitrio dei popoli.<br/>
                              Sovereign global digital nation built upon New World State constitutional values.
                            </p>
                            <p style="font-size: 10px; color: #cbd5e1; margin: 0;">
                              Questa è una notifica automatica. / This is an automated notification. Please do not reply directly.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `;

            await sendLocalSmtpEmail({
              to: citizenEmail.trim(),
              subject: '🎖️ Variazione Incarichi Istituzionali / Official Portfolios Update - New World State',
              html: emailHtml
            });
            console.log(`[SMTP] Inviato messaggio di variazione incarichi e spiegazione del ruolo a: ${citizenEmail}`);
          } catch (smtpErr: any) {
            console.error('[SMTP-ASSIGN-ROLE-ERR] Eccezione nell\'invio email assign-role:', smtpErr.message);
          }
        }
      }

      return res.json({ success: true, citizen: getCitizenWithArubaUrls(updatedCitizen), message: `Incarico operativo assegnato correttamente.` });
    });

    // --- GEOGRAPHIC AREAS ROUTES ---
    apiRouter.get('/admin/geographic-areas', async (req, res) => {
      if (dbPool) {
        try {
          const qRes = await dbPool.query('SELECT * FROM nws_geographic_areas ORDER BY id ASC');
          return res.json({ success: true, data: qRes.rows });
        } catch (err: any) {
          console.error('[DB-GET-AREAS-ERR]', err.message);
        }
      }
      return res.json({ success: true, data: memoryGeographicAreas });
    });

    apiRouter.post('/admin/geographic-areas', async (req, res) => {
      const { id, name, countries } = req.body || {};
      if (!name || !countries) {
        return res.status(400).json({ success: false, message: 'Nome e stati associati obbligatori.' });
      }

      if (dbPool) {
        try {
          if (id) {
            const qRes = await dbPool.query(
              'UPDATE nws_geographic_areas SET name = $1, countries = $2 WHERE id = $3 RETURNING *',
              [name, countries, id]
            );
            return res.json({ success: true, data: qRes.rows[0], message: 'Area geografica aggiornata con successo.' });
          } else {
            const qRes = await dbPool.query(
              'INSERT INTO nws_geographic_areas (name, countries) VALUES ($1, $2) RETURNING *',
              [name, countries]
            );
            return res.json({ success: true, data: qRes.rows[0], message: 'Area geografica creata con successo.' });
          }
        } catch (err: any) {
          console.error('[DB-POST-AREAS-ERR]', err.message);
          return res.status(500).json({ success: false, message: 'Errore durante il salvataggio sul database.' });
        }
      }

      // Memory Fallback
      if (id) {
        const idx = memoryGeographicAreas.findIndex(a => a.id === Number(id));
        if (idx !== -1) {
          memoryGeographicAreas[idx] = { id: Number(id), name, countries };
          return res.json({ success: true, data: memoryGeographicAreas[idx], message: 'Area geografica aggiornata in memoria.' });
        }
        return res.status(404).json({ success: false, message: 'Area non trovata in memoria.' });
      } else {
        const newId = memoryGeographicAreas.length > 0 ? Math.max(...memoryGeographicAreas.map(a => a.id)) + 1 : 1;
        const newArea = { id: newId, name, countries };
        memoryGeographicAreas.push(newArea);
        return res.json({ success: true, data: newArea, message: 'Area geografica creata in memoria.' });
      }
    });

    apiRouter.delete('/admin/geographic-areas', async (req, res) => {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ success: false, message: 'ID area obbligatorio.' });

      if (dbPool) {
        try {
          await dbPool.query('DELETE FROM nws_geographic_areas WHERE id = $1', [id]);
          return res.json({ success: true, message: 'Area geografica eliminata definitivamente.' });
        } catch (err: any) {
          console.error('[DB-DEL-AREAS-ERR]', err.message);
          return res.status(500).json({ success: false, message: 'Errore durante la rimozione dal database.' });
        }
      }

      const idx = memoryGeographicAreas.findIndex(a => a.id === Number(id));
      if (idx !== -1) {
        memoryGeographicAreas.splice(idx, 1);
        return res.json({ success: true, message: 'Area geografica eliminata dalla memoria.' });
      }
      return res.status(404).json({ success: false, message: 'Area non trovata in memoria.' });
    });

    // --- CUSTOM ROLES ROUTES ---
    apiRouter.get('/admin/custom-roles', async (req, res) => {
      if (dbPool) {
        try {
          const qRes = await dbPool.query('SELECT * FROM nws_custom_roles ORDER BY id ASC');
          return res.json({ success: true, data: qRes.rows });
        } catch (err: any) {
          console.error('[DB-GET-ROLES-ERR]', err.message);
        }
      }
      return res.json({ success: true, data: memoryCustomRoles });
    });

    apiRouter.post('/admin/custom-roles', async (req, res) => {
      const { id, name, description, geographic_area_id } = req.body || {};
      if (!name) {
        return res.status(400).json({ success: false, message: 'Nome ruolo obbligatorio.' });
      }

      const areaId = geographic_area_id ? Number(geographic_area_id) : null;

      if (dbPool) {
        try {
          if (id) {
            const qRes = await dbPool.query(
              'UPDATE nws_custom_roles SET name = $1, description = $2, geographic_area_id = $3 WHERE id = $4 RETURNING *',
              [name, description || '', areaId, id]
            );
            return res.json({ success: true, data: qRes.rows[0], message: 'Ruolo aggiornato con successo.' });
          } else {
            const qRes = await dbPool.query(
              'INSERT INTO nws_custom_roles (name, description, geographic_area_id) VALUES ($1, $2, $3) RETURNING *',
              [name, description || '', areaId]
            );
            return res.json({ success: true, data: qRes.rows[0], message: 'Ruolo creato con successo.' });
          }
        } catch (err: any) {
          console.error('[DB-POST-ROLES-ERR]', err.message);
          return res.status(500).json({ success: false, message: 'Errore durante il salvataggio sul database.' });
        }
      }

      // Memory Fallback
      if (id) {
        const idx = memoryCustomRoles.findIndex(r => r.id === Number(id));
        if (idx !== -1) {
          memoryCustomRoles[idx] = { id: Number(id), name, description: description || '', geographic_area_id: areaId };
          return res.json({ success: true, data: memoryCustomRoles[idx], message: 'Ruolo aggiornato in memoria.' });
        }
        return res.status(404).json({ success: false, message: 'Ruolo non trovato in memoria.' });
      } else {
        const newId = memoryCustomRoles.length > 0 ? Math.max(...memoryCustomRoles.map(r => r.id)) + 1 : 1;
        const newRole = { id: newId, name, description: description || '', geographic_area_id: areaId };
        memoryCustomRoles.push(newRole);
        return res.json({ success: true, data: newRole, message: 'Ruolo creato in memoria.' });
      }
    });

    apiRouter.delete('/admin/custom-roles', async (req, res) => {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ success: false, message: 'ID ruolo obbligatorio.' });

      if (dbPool) {
        try {
          await dbPool.query('DELETE FROM nws_custom_roles WHERE id = $1', [id]);
          return res.json({ success: true, message: 'Ruolo eliminato definitivamente.' });
        } catch (err: any) {
          console.error('[DB-DEL-ROLES-ERR]', err.message);
          return res.status(500).json({ success: false, message: 'Errore durante la rimozione dal database.' });
        }
      }

      const idx = memoryCustomRoles.findIndex(r => r.id === Number(id));
      if (idx !== -1) {
        memoryCustomRoles.splice(idx, 1);
        return res.json({ success: true, message: 'Ruolo eliminato dalla memoria.' });
      }
      return res.status(404).json({ success: false, message: 'Ruolo non trovato in memoria.' });
    });

    // GET /api/admin/broadcasts - Ottiene l'archivio dei messaggi inviati
    apiRouter.get('/admin/broadcasts', async (req, res) => {
      console.log('[API] Processing /api/admin/broadcasts request');
      if (dbPool) {
        try {
          const qRes = await dbPool.query('SELECT * FROM nws_broadcasts ORDER BY id DESC');
          return res.json({ success: true, data: qRes.rows });
        } catch (err: any) {
          console.error('[DB-BROADCASTS-GET-ERR]', err.message);
          return res.status(500).json({ success: false, message: 'Errore durante il recupero dei messaggi dal database.' });
        }
      }
      return res.json({ success: true, data: [...memoryBroadcasts].reverse() });
    });

    // POST /api/admin/broadcasts - Invia e archivia un nuovo messaggio broadcast
    apiRouter.post('/admin/broadcasts', async (req, res) => {
      console.log('[API] Processing /api/admin/broadcasts creation');
      const { title, content, target } = req.body || {};
      if (!title || !title.trim() || !content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Oggetto e testo del messaggio sono obbligatori.' });
      }

      const selectedTarget = target || 'all';

      // 1. Cerca i cittadini destinatari
      let recipients: any[] = [];
      if (dbPool) {
        try {
          let query = 'SELECT email, "firstName", firstname, surname, "citizenCode" FROM citizens';
          const params: any[] = [];
          if (selectedTarget === 'approved') {
            query += " WHERE status = 'approved'";
          } else if (selectedTarget === 'pending') {
            query += " WHERE status = 'pending'";
          }
          const citRes = await dbPool.query(query, params);
          recipients = citRes.rows.filter(c => c.email && c.email.trim() !== '');
        } catch (dbErr: any) {
          console.error('[DB-BROADCAST-RECIPIENTS-ERR]', dbErr.message);
        }
      } else {
        recipients = memoryCitizens.filter(c => {
          if (selectedTarget === 'approved') return c.status === 'approved';
          if (selectedTarget === 'pending') return c.status === 'pending';
          return true;
        }).filter(c => c.email && c.email.trim() !== '');
      }

      // 2. Invia email sequenziali tramite SMTP (con gestione errori robusta)
      let emailSuccessCount = 0;
      const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

      if (smtpConfigured && recipients.length > 0) {
        console.log(`[SMTP-BROADCAST] Avvio invio email a ${recipients.length} cittadini.`);
        for (const recipient of recipients) {
          const name = recipient.firstName || recipient.firstname || 'Cittadino';
          const surname = recipient.surname || 'Sovrano';
          const email = recipient.email.trim();
          const citizenCode = recipient.citizenCode || 'NWS';

          const subject = `📢 New World State - Comunicazione Ufficiale: ${title}`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <div style="background-color: #0a1c3e; color: #ffffff; padding: 24px; text-align: center; border-bottom: 4px solid #c5a880;">
                <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.05em;">NEW WORLD STATE</h1>
                <div style="font-size: 11px; color: #c5a880; margin-top: 4px; letter-spacing: 0.15em; font-family: monospace;">COMUNICAZIONE UFFICIALE AI CITTADINI</div>
              </div>
              <div style="padding: 24px; background-color: #ffffff; color: #334155; line-height: 1.6;">
                <p style="font-size: 15px; margin-top: 0;">Gentile cittadino/a <strong>${name} ${surname}</strong> (Codice: ${citizenCode}),</p>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #0a1c3e; padding: 18px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 10px 0; color: #0a1c3e; font-size: 16px;">${title}</h3>
                  <p style="margin: 0; font-size: 14px; white-space: pre-wrap; color: #1e293b;">${content}</p>
                </div>

                <p style="font-size: 12px; line-height: 1.5; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px;">
                  Questa è una notifica broadcast ufficiale inviata tramite il portale federale del New World State. Non rispondere a questa email.
                </p>
              </div>
            </div>
          `;

          try {
            await sendLocalSmtpEmail({ to: email, subject, html });
            emailSuccessCount++;
          } catch (smtpErr: any) {
            console.error(`[SMTP-BROADCAST-ERR] Errore invio a ${email}:`, smtpErr.message);
          }
        }
      } else if (!smtpConfigured) {
        console.warn('[SMTP-BROADCAST] SMTP non configurato. Salto invio email reali.');
      }

      // 3. Archivia il messaggio nel Database o in memoria
      let savedBroadcast: any = null;
      if (dbPool) {
        try {
          const insertRes = await dbPool.query(
            `INSERT INTO nws_broadcasts (title, content, target, sent_by, email_count) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [title, content, selectedTarget, 'Amministratore', emailSuccessCount]
          );
          savedBroadcast = insertRes.rows[0];
        } catch (dbErr: any) {
          console.error('[DB-BROADCAST-SAVE-ERR]', dbErr.message);
          return res.status(500).json({ success: false, message: 'Errore nel salvataggio del messaggio nel database.' });
        }
      } else {
        const newId = memoryBroadcasts.length > 0 ? Math.max(...memoryBroadcasts.map(b => b.id)) + 1 : 1;
        savedBroadcast = {
          id: newId,
          title,
          content,
          target: selectedTarget,
          sent_by: 'Amministratore',
          sent_at: new Date().toISOString(),
          email_count: emailSuccessCount
        };
        memoryBroadcasts.push(savedBroadcast);
      }

      let message = `Messaggio d'annuncio "${title}" archiviato con successo.`;
      if (smtpConfigured) {
        message += ` Email inviate correttamente a ${emailSuccessCount} su ${recipients.length} cittadini destinatari.`;
      } else {
        message += ` NOTA: le notifiche email non sono state inviate poiché SMTP non è configurato.`;
      }

      return res.json({ success: true, data: savedBroadcast, message });
    });

    // POST /api/admin/upload-branding - Consente di caricare ed aggiornare il logo o la favicon
    apiRouter.post('/admin/upload-branding', async (req, res) => {
      try {
        const { fileType, fileDataBase64 } = req.body || {};
        if (!fileType || !fileDataBase64) {
          return res.status(400).json({ success: false, message: 'I parametri fileType e fileDataBase64 sono obbligatori.' });
        }

        if (fileType !== 'logo' && fileType !== 'favicon' && fileType !== 'favicon-png') {
          return res.status(400).json({ success: false, message: 'fileType deve essere logo, favicon o favicon-png.' });
        }

        // Estrai i dati binari base64
        const matches = fileDataBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        let dataBuffer: Buffer;
        if (matches) {
          dataBuffer = Buffer.from(matches[2], 'base64');
        } else {
          dataBuffer = Buffer.from(fileDataBase64, 'base64');
        }

        const filenames: string[] = [];
        if (fileType === 'logo') {
          filenames.push('LOGO_NEW-WORLD-STATE.jpg');
        } else if (fileType === 'favicon') {
          filenames.push('favicon.ico');
        } else if (fileType === 'favicon-png') {
          filenames.push('favicon-32x32.png');
          filenames.push('favicon-16x16.png');
          filenames.push('apple-touch-icon.png');
        }

        const writeErrors: string[] = [];
        for (const filename of filenames) {
          // 1. Scrivi nella directory public
          const publicPath = path.join(process.cwd(), 'public', filename);
          try {
            fs.writeFileSync(publicPath, dataBuffer);
            console.log(`[BRANDING] Scritta risorsa in ${publicPath}`);
          } catch (err: any) {
            console.error(`[BRANDING] Errore scrittura public ${filename}:`, err);
            writeErrors.push(`public/${filename}: ${err.message}`);
          }

          // 2. Scrivi nella directory dist se esiste (per aggiornamento live)
          const distPath = path.join(process.cwd(), 'dist', filename);
          if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
            try {
              fs.writeFileSync(distPath, dataBuffer);
              console.log(`[BRANDING] Scritta risorsa in ${distPath}`);
            } catch (err: any) {
              console.error(`[BRANDING] Errore scrittura dist ${filename}:`, err);
              writeErrors.push(`dist/${filename}: ${err.message}`);
            }
          }
        }

        if (writeErrors.length > 0) {
          return res.status(500).json({ 
            success: false, 
            message: 'Errore durante il salvataggio di alcune risorse.', 
            errors: writeErrors 
          });
        }

        return res.json({ 
          success: true, 
          message: `La risorsa ${fileType} è stata aggiornata con successo nel sistema!` 
        });

      } catch (err: any) {
        console.error('[BRANDING-UPLOAD-ERR]', err);
        return res.status(500).json({ success: false, message: 'Errore interno del server: ' + err.message });
      }
    });

    // GET /api/broadcasts/latest - Endpoint pubblico per recuperare gli ultimi broadcast (usato dal client per notifiche push)
    apiRouter.get('/broadcasts/latest', async (req, res) => {
      if (dbPool) {
        try {
          const qRes = await dbPool.query('SELECT id, title, content, target, sent_at FROM nws_broadcasts ORDER BY id DESC LIMIT 10');
          return res.json({ success: true, data: qRes.rows });
        } catch (err: any) {
          console.error('[DB-LATEST-BROADCASTS-ERR]', err.message);
          return res.status(500).json({ success: false, message: 'Errore interno.' });
        }
      }
      return res.json({ success: true, data: memoryBroadcasts.slice(-10).reverse() });
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

    // === ROTTE DEMOCRAZIA ONLINE NWS ===

    // Pre-flight per controllo cittadino ed eventuale invio password temporanea
    apiRouter.post('/democracy/preflight', async (req, res) => {
      const { usernameOrCode } = req?.body || {};
      if (!usernameOrCode) {
        return res.status(400).json({ success: false, message: 'Specificare username, email, telefono o codice cittadino.' });
      }

      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database SQL locale non disponibile.' });
      }

      try {
        const uppercaseVal = String(usernameOrCode).trim().toUpperCase();
        const cleanPhoneVal = String(usernameOrCode).trim().replace(/[\s\-\+\(\)]/g, '');

        // Cerca cittadino con match case-insensitive su citizenCode, username, email o phoneNumber
        const qRes = await dbPool.query(
          `SELECT * FROM citizens WHERE 
            UPPER("citizenCode") = $1 OR 
            UPPER(username) = $1 OR 
            UPPER(email) = $1 OR
            ("phoneNumber" IS NOT NULL AND REPLACE(REPLACE(REPLACE(REPLACE("phoneNumber", ' ', ''), '-', ''), '+', ''), '(', '') = $2)
          `,
          [uppercaseVal, cleanPhoneVal]
        );

        if (qRes.rows.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Profilo non trovato o non registrato con l\'Anagrafe Centrale del New World State.' 
          });
        }

        const cit = qRes.rows[0];
        if (cit.status !== 'approved') {
          return res.status(401).json({ 
            success: false, 
            message: 'Il tuo profilo di cittadinanza è in stato di revisione o non approvato ("' + (cit.status || 'pending') + '"). Solo i cittadini approvati possono accedere al voto sovrano.' 
          });
        }

        const userEmail = cit.email || '';
        const userPhone = cit.phoneNumber || cit.phone_number || '';
        const hasEmail = userEmail.includes('@');
        
        // Decidiamo il flusso
        // Se l'input contiene '@' o se l'utente ha registrato solo l'email (manca il telefono o ha esplicitamente inserito email)
        const inputIsEmail = String(usernameOrCode).includes('@');
        const inputIsPhone = /^\+?[0-9\s\-]{6,16}$/.test(String(usernameOrCode).trim()) && !inputIsEmail;

        if (inputIsEmail || (hasEmail && !userPhone)) {
          // Flusso Password Temporanea via EMAIL
          // Genera un codice casuale di 6 caratteri
          const tempPassword = 'NWS-' + Math.floor(100000 + Math.random() * 900000);
          
          // Aggiorna la password nel database
          await dbPool.query('UPDATE citizens SET password = $1 WHERE id = $2', [tempPassword, cit.id]);

          // Invia email di notifica con la password temporanea
          try {
            const emailHtml = `
              <div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 30px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; color: #1e293b; line-height: 1.6;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.15em; color: #b45309; display: block; margin-bottom: 4px;">Federazione di New World State / New World State Federation</span>
                  <h2 style="font-family: Georgia, serif; font-size: 22px; color: #011d4e; margin: 0;">Password Temporanea Democrazia Diretta / Direct Democracy Passcode</h2>
                </div>
                <p style="font-size: 15px; margin-top: 10px;">Caro cittadino del New World State / Dear Citizen of the New World State,</p>
                
                <p style="font-size: 14px; margin-bottom: 12px;">
                  <strong>[IT]</strong> Su tua richiesta di accesso, abbiamo generato una password temporanea per consentirti di effettuare l'accesso sicuro alla piattaforma federale di Democrazia Diretta, partecipare alle deliberazioni nazionali ed esercitare il tuo diritto di voto sovrano.
                </p>
                
                <p style="font-size: 14px; margin-bottom: 24px; color: #475569;">
                  <strong>[EN]</strong> Upon your login request, we have generated a temporary passcode to grant you secure access to the federal Direct Democracy platform, permitting active participation in national consultations and the exercise of your sovereign voting rights.
                </p>

                <div style="background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
                  <p style="font-size: 10px; text-transform: uppercase; font-family: monospace; letter-spacing: 0.1em; color: #64748b; margin: 0 0 8px 0;">Tua Password Temporanea (OTP) / Your Temporary OTP Passcode:</p>
                  <div style="font-family: monospace; font-size: 32px; letter-spacing: 0.05em; font-weight: bold; color: #0284c7; padding: 10px; border-radius: 8px;">
                    ${tempPassword}
                  </div>
                  <p style="font-size: 11px; color: #64748b; margin: 8px 0 0 0;">
                    Questo codice temporaneo ti permette di completare l'autenticazione sovrana. / This temporary code allows you to complete the sovereign authentication.
                  </p>
                </div>
                
                <p style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 25px; line-height: 1.5;">
                  <strong>[IT]</strong> Se non hai richiesto questa password, ignora questa comunicazione. Il tuo codice identificativo controlla in modo sicuro l'accesso al tuo voto diretto.<br/>
                  <strong>[EN]</strong> If you did not request this passcode, please ignore this email. Your sovereign identity code securely controls access to your direct voting features.
                </p>
              </div>
            `;
            await sendLocalSmtpEmail({
              to: userEmail.trim(),
              subject: 'Password Temporanea - Democrazia Diretta / Temporary OTP Passcode - Direct Democracy New World State',
              html: emailHtml
            });
            console.log(`[SMTP-OTP] Spedita pass temporanea via email a: ${userEmail}`);
          } catch (mErr: any) {
            console.error('[SMTP-OTP-ERROR]', mErr.message);
          }

          return res.json({
            success: true,
            mode: 'temp-email',
            email: userEmail,
            message: 'Abbiamo generato e inviato una password temporanea alla tua casella e-mail registrata. Controlla la posta!'
          });

        } else if (inputIsPhone || (!hasEmail && userPhone)) {
          // Flusso Password Temporanea via TELEFONO / SMS
          const tempPassword = 'SMS-' + Math.floor(100000 + Math.random() * 900000);
          
          // Aggiorna la password nel database
          await dbPool.query('UPDATE citizens SET password = $1 WHERE id = $2', [tempPassword, cit.id]);

          console.log(`[SMS-OTP-SIMULATOR] Codice temporaneo generato per ${userPhone}: ${tempPassword}`);

          return res.json({
            success: true,
            mode: 'temp-phone',
            phone: userPhone,
            tempPassword: tempPassword,
            message: 'SMS di test per simulazione inviato al numero registrato.'
          });

        } else {
          // Flusso password standard
          return res.json({
            success: true,
            mode: 'standard',
            message: 'Riconosciuto utente standard. Procedi ad inserire la tua password.'
          });
        }
      } catch (err: any) {
        console.error('[DEMOCRACY-PREFLIGHT-ERR]', err);
        return res.status(500).json({ success: false, message: 'Errore interno nel controllo cittadino: ' + err.message });
      }
    });

    // Login cittadino della democrazia
    apiRouter.post('/democracy/login', async (req, res) => {
      const { usernameOrCode, password } = req?.body || {};
      if (!usernameOrCode || !password) {
        return res.status(400).json({ success: false, message: 'Specificare username/codice cittadino e password.' });
      }

      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database SQL locale non disponibile.' });
      }

      try {
        const uppercaseVal = String(usernameOrCode).trim().toUpperCase();
        // Cerca cittadino con match case-insensitive su citizenCode, username o email
        const qRes = await dbPool.query(
          `SELECT * FROM citizens WHERE 
            (UPPER("citizenCode") = $1 OR UPPER(username) = $1 OR UPPER(email) = $1)
            AND password = $2`,
          [uppercaseVal, password]
        );

        if (qRes.rows.length === 0) {
          return res.status(401).json({ 
            success: false, 
            message: 'Credenziali non valide o profilo non ancora approvato dall\'Anagrafe Centrale del New World State.' 
          });
        }

        const cit = qRes.rows[0];
        if (cit.status !== 'approved') {
          return res.status(401).json({ 
            success: false, 
            message: 'Il tuo profilo di cittadinanza è in stato "' + (cit.status || 'pending') + '". Solo i cittadini approvati possono accedere al voto della Democrazia Normativa.' 
          });
        }

        return res.json({
          success: true,
          citizen: {
            id: cit.id,
            firstName: cit.firstName || cit.firstname,
            surname: cit.surname,
            username: cit.username,
            email: cit.email,
            citizenCode: cit.citizenCode || cit.citizencode || cit.citizen_code,
            isAmbassador: !!(cit.isAmbassador || cit.isambassador),
            isPeacekeeper: !!(cit.isPeacekeeper || cit.ispeacekeeper)
          }
        });
      } catch (err: any) {
        console.error('[DEMOCRACY-LOGIN-ERR]', err);
        return res.status(500).json({ success: false, message: 'Errore interno di sicurezza: ' + err.message });
      }
    });

    // Ottieni tutti gli avvisi pubblicati nell'albo pretorio ufficiale
    apiRouter.get('/democracy/albo', async (req, res) => {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database non disponibile.' });
      }
      try {
        const result = await dbPool.query('SELECT * FROM nws_albo ORDER BY published_at DESC');
        return res.json({ success: true, data: result.rows });
      } catch (err: any) {
        console.error('[DEMOCRACY-ALBO-ERR]', err);
        return res.status(500).json({ success: false, message: 'Errore durante il recupero dall\'albo pretorio: ' + err.message });
      }
    });

    // Ottieni tutte le proposte normative (con conteggio voti real-time)
    apiRouter.get('/democracy/proposals', async (req, res) => {
      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database non disponibile.' });
      }

      try {
        // Chiudi automaticamente eventuali votazioni scadute se lo stato è ancora 'approved' (attivo per votare)
        const closeExpiredSql = `
          UPDATE nws_proposals
          SET status = CASE 
            WHEN yes_votes_total > no_votes_total THEN 'passed'
            ELSE 'failed'
          END
          FROM (
            SELECT p2.id as p_id,
              COALESCE(SUM(CASE WHEN v2.vote = 'yes' THEN 1 ELSE 0 END), 0) as yes_votes_total,
              COALESCE(SUM(CASE WHEN v2.vote = 'no' THEN 1 ELSE 0 END), 0) as no_votes_total
            FROM nws_proposals p2
            LEFT JOIN nws_votes v2 ON p2.id = v2.proposal_id
            GROUP BY p2.id
          ) sub
          WHERE id = sub.p_id 
            AND status = 'approved' 
            AND voting_ends_at IS NOT NULL 
            AND voting_ends_at < CURRENT_TIMESTAMP
        `;
        try {
          await dbPool.query(closeExpiredSql);
        } catch (e: any) {
          console.warn('[DEMOCRACY-STATUS-AUTOUPDATE-WARN]', e.message);
        }

        // Recupera le proposte con i conteggi aggiornati in tempo reale
        const qSql = `
          SELECT 
            p.id,
            p.title,
            p.description,
            p.content,
            p.category,
            p.proponent_id,
            p.proponent_name,
            p.status,
            p.rejection_reason,
            p.created_at,
            p.voting_starts_at,
            p.voting_ends_at,
            COALESCE(SUM(CASE WHEN v.vote = 'yes' THEN 1 ELSE 0 END), 0)::int as yes_votes,
            COALESCE(SUM(CASE WHEN v.vote = 'no' THEN 1 ELSE 0 END), 0)::int as no_votes,
            COALESCE(SUM(CASE WHEN v.vote = 'abstain' THEN 1 ELSE 0 END), 0)::int as abstain_votes,
            COUNT(v.id)::int as total_votes
          FROM nws_proposals p
          LEFT JOIN nws_votes v ON p.id = v.proposal_id
          GROUP BY p.id
          ORDER BY p.created_at DESC
        `;
        const qRes = await dbPool.query(qSql);
        return res.json({ success: true, data: qRes.rows });
      } catch (err: any) {
        console.error('[DEMOCRACY-GET-PROPOSALS-ERR]', err);
        return res.status(500).json({ success: false, message: 'Errore nel caricamento delle proposte: ' + err.message });
      }
    });

    // Assistente AI legislativo per la redazione della proposta guidata (for dummies)
    apiRouter.post('/democracy/ai-draft-proposal', async (req, res) => {
      const { problem, solution, benefits, category } = req.body || {};
      if (!solution) {
        return res.status(400).json({ success: false, message: 'La descrizione della tua soluzione/idea è obbligatoria per procedere con l\'elaborazione.' });
      }

      try {
        const ai = getGenAIClient();
        const prompt = `Crea una bozza di proposta legislativa formale per lo "New World State" (una nazione digitale sovrana e globale basata sul libero arbitrio dei popoli e sulla Costituzione del New World State). La proposta deve richiamare esplicitamente e basarsi sui principi, diritti e doveri garantiti dalla Costituzione del New World State.
ATTENZIONE (DIVIETO ASSOLUTO): Non fare MAI riferimento alla "Costituzione di Ginevra", alla "Convenzione di Ginevra" o a "Ginevra" in generale. Devi fare riferimento unicamente e rigorosamente alla "Costituzione del New World State" (o "Costituzione").
La proposta appartiene alla categoria: "${category || 'Generale'}".

Informazioni fornite dal cittadino (for dummies):
- Problema da risolvere: ${problem || 'Non specificato'}
- Soluzione proposta: ${solution}
- Benefici attesi: ${benefits || 'Non specificato'}

Genera una risposta in formato JSON contenente tre campi:
1. "title": un titolo formale, solenne e chiaro per l'iniziativa legislativa. Deve essere in italiano (es. "Legge sulla Trasparenza dell'Identità Digitale").
2. "description": una sintesi esplicativa di 1 o 2 righe (massimo 150 caratteri) che spieghi l'essenza della proposta.
3. "content": Il testo normativo completo, strutturato formalmente in articoli in lingua italiana.

Segui SCRUPOLOSAMENTE le seguenti linee guida di formattazione, chiarezza ed eleganza per il campo "content":
- SPAZIATURA E INTERLINEE (CRITICO): Utilizza SEMPRE righe vuote (doppio a capo) tra il titolo principale, il preambolo, ciascun articolo e ciascun comma/paragrafo numerato. Non unire mai il testo in un unico blocco continuo o privo di righe vuote.
- STRUTTURA ED ELEGANZA VISIVA: Utilizza Markdown formattato in modo eccellente. Usa titoli chiari con '###' per ciascun articolo o sezione importante (ad esempio "### PREAMBOLO", "### Articolo 1 - Oggetto e finalità", ecc.). Usa il grassetto con '**' per evidenziare i concetti chiave e i termini definiti (es. "**New World State**" o "**Costituzione del New World State**").
- PREAMBOLO SOLENNE: Inizia il testo con la sezione "### PREAMBOLO" seguita da una breve premessa ("Considerato che...") che spieghi la ratio, i principi ispiratori della proposta e la sua conformità con lo spirito di libertà individuale, la sovranità digitale e le tutele sancite nella Costituzione del New World State. Il preambolo deve contenere un riferimento esplicito, formale e solenne alla Costituzione del New World State.
- ARTICOLI CHIARI E COMPRENSIBILI: Suddividi la legge in articoli ben definiti (es. "### Articolo 1 - Oggetto e finalità", "### Articolo 2 - Ambito di applicazione", "### Articolo 3 - ..."). Ogni articolo deve essere scritto in un linguaggio giuridico ma moderno, chiaro, comprensibile a qualsiasi cittadino, evitando tecnicismi inutili. Ogni articolo deve conformarsi e contribuire all'attuazione della Costituzione del New World State.
- PARAGRAFI NUMERATI: All'interno di ciascun articolo, organizza le disposizioni in commi/paragrafi numerati su linee separate inizianti per numero (es. "1. La presente legge...", "2. Al fine di garantire...") per facilitarne il riferimento e la lettura.
- SEZIONE ANALISI IMPATTO: Inserisci alla fine una sezione intitolata "### Analisi dell'Impatto e Sostenibilità" strutturata con punti elenco per descrivere l'impatto sociale, tecnologico e amministrativo.
- SEZIONE DISPOSIZIONI FINALI: Includi un articolo finale sulle modalità e tempistiche di entrata in vigore (es. "### Articolo X - Entrata in vigore").

Restituisci solo ed esclusivamente l'oggetto JSON richiesto.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ['title', 'description', 'content']
            }
          }
        });

        const jsonText = response.text;
        if (!jsonText) {
          throw new Error('Nessuna risposta ricevuta dall\'Intelligenza Artificiale.');
        }

        const parsed = JSON.parse(jsonText.trim());
        return res.json({ success: true, data: parsed });
      } catch (err: any) {
        console.error('[DEMOCRACY-AI-DRAFT-ERR]', err);
        const isKeyError = err.message && (err.message.includes('GEMINI_API_KEY') || err.message.includes('API key'));
        return res.status(500).json({
          success: false,
          message: isKeyError
            ? 'La chiave API di Gemini ("GEMINI_API_KEY") non è configurata nei segreti del portale. Configura la chiave nei segreti del pannello di controllo per sbloccare l\'assistente legislativo AI!'
            : 'Impossibile sbloccare l\'assistente legislativo AI: ' + err.message
        });
      }
    });

    // Presenta una nuova proposta normativa
    apiRouter.post('/democracy/proposals', async (req, res) => {
      const { title, description, content, category, citizen_id } = req.body || {};
      if (!title || !content || !citizen_id) {
        return res.status(400).json({ success: false, message: 'Titolo, testo normativo e autore sono obbligatori.' });
      }

      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database non disponibile.' });
      }

      try {
        // Recupera il nome del proponente
        const citRes = await dbPool.query('SELECT * FROM citizens WHERE id = $1', [citizen_id]);
        if (citRes.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Cittadino non registrato o non trovato.' });
        }
        const cit = citRes.rows[0];
        const proponentName = `${cit.firstName || cit.firstname || ''} ${cit.surname || ''}`.trim();

        // Inserisci proposta
        const insertSql = `
          INSERT INTO nws_proposals (title, description, content, category, proponent_id, proponent_name, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'pending')
          RETURNING *
        `;
        const insRes = await dbPool.query(insertSql, [
          title,
          description || '',
          content,
          category || 'Generale',
          citizen_id,
          proponentName
        ]);

        const newProposal = insRes.rows[0];

        // Invio Email di Riepilogo all'Autore e all'Amministratore
        try {
          const authorEmail = cit.email ? cit.email.trim() : '';
          const adminEmail = process.env.ADMIN_EMAIL || "supersalvatoreferroinfranca@gmail.com";
          const mailPromises: Promise<any>[] = [];
          
          if (authorEmail) {
            const authorSubject = `🏛️ New World State - Ricevuta di Sottomissione Proposta Normativa: ${title}`;
            const authorHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="background-color: #0a1c3e; color: #ffffff; padding: 24px; text-align: center; border-bottom: 4px solid #d97706;">
                  <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.05em; color: #ffffff;">NEW WORLD STATE</h1>
                  <div style="font-size: 11px; color: #f59e0b; margin-top: 4px; letter-spacing: 0.15em; font-family: monospace;">CONSIGLIO DI DEMOCRAZIA DIRETTA</div>
                </div>
                <div style="padding: 24px; background-color: #ffffff; color: #334155;">
                  <p style="font-size: 15px; margin-top: 0;">Gentile cittadino/a <strong>${proponentName}</strong>,</p>
                  <p style="font-size: 14px; line-height: 1.5;">La tua proposta normativa è stata sottomessa con successo ed è ora in attesa di essere esaminata e convalidata dall'amministrazione per l'apertura delle votazioni popolari.</p>
                  
                  <div style="background-color: #f8fafc; border-left: 4px solid #d97706; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #0a1c3e; font-size: 14px; text-transform: uppercase; letter-spacing: 0.02em;">Riepilogo della Proposta</h3>
                    <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Titolo:</strong> ${title}</p>
                    <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Categoria:</strong> ${category || 'Generale'}</p>
                    <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Descrizione:</strong> ${description || 'Nessuna descrizione fornita.'}</p>
                  </div>

                  <p style="font-size: 13px; line-height: 1.5; color: #64748b;">
                    Riceverai una notifica email e push non appena la tua proposta sarà esaminata e convalidata dall'amministrazione per la votazione pubblica.
                  </p>

                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${process.env.APP_URL || 'https://newworldstate.cloud'}/democracy" style="display: inline-block; background-color: #0a1c3e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(10,28,62,0.25);">PORTALE DI DEMOCRAZIA</a>
                  </div>

                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">
                    Generato automaticamente dal Registro dei Referendum del New World State.<br />
                    Per favore non rispondere a questa comunicazione.
                  </p>
                </div>
              </div>
            `;
            mailPromises.push(
              sendLocalEmail({ to: authorEmail, subject: authorSubject, html: authorHtml })
                .catch(e => console.error('[EMAIL-AUTHOR-PROPOSAL-FAILED]', e.message))
            );
          }

          if (adminEmail) {
            const adminSubject = `🔔 Nuova Proposta Normativa da Convalidare: ${title}`;
            const adminHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="background-color: #0a1c3e; color: #ffffff; padding: 24px; text-align: center; border-bottom: 4px solid #d97706;">
                  <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.05em; color: #ffffff;">NEW WORLD STATE</h1>
                  <div style="font-size: 11px; color: #f59e0b; margin-top: 4px; letter-spacing: 0.15em; font-family: monospace;">CONSIGLIO DI DEMOCRAZIA DIRETTA - ADMIN</div>
                </div>
                <div style="padding: 24px; background-color: #ffffff; color: #334155;">
                  <p style="font-size: 15px; margin-top: 0;">Gentile Amministratore,</p>
                  <p style="font-size: 14px; line-height: 1.5;">Una nuova proposta normativa è stata sottomessa dal cittadino <strong>${proponentName}</strong> ed è in attesa di tua approvazione/convalida per l'apertura delle votazioni popolari.</p>
                  
                  <div style="background-color: #f8fafc; border-left: 4px solid #d97706; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #0a1c3e; font-size: 14px; text-transform: uppercase; letter-spacing: 0.02em;">Riepilogo della Proposta</h3>
                    <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Autore:</strong> ${proponentName} (${cit.email || 'N/A'})</p>
                    <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Titolo:</strong> ${title}</p>
                    <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Categoria:</strong> ${category || 'Generale'}</p>
                    <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Descrizione:</strong> ${description || 'Nessuna descrizione fornita.'}</p>
                  </div>

                  <p style="font-size: 13px; line-height: 1.5; color: #64748b;">
                    Puoi convalidare, modificare o respingere questa proposta accedendo direttamente alla Console di Amministrazione del Portale.
                  </p>

                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${process.env.APP_URL || 'https://newworldstate.cloud'}/admin" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(217,119,6,0.25);">ACCEDI ALLA CONSOLE AMMINISTRATORE</a>
                  </div>

                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">
                    Generato automaticamente dal Registro dei Referendum del New World State.<br />
                    Per favore non rispondere a questa comunicazione.
                  </p>
                </div>
              </div>
            `;
            mailPromises.push(
              sendLocalEmail({ to: adminEmail, subject: adminSubject, html: adminHtml })
                .catch(e => console.error('[EMAIL-ADMIN-PROPOSAL-FAILED]', e.message))
            );
          }

          if (mailPromises.length > 0) {
            await Promise.all(mailPromises);
            console.log(`[PROPOSAL-SUBMISSION-EMAIL-OK] Spedite ${mailPromises.length} email relative alla proposta.`);
          }
        } catch (mailErr: any) {
          console.error('[DEMOCRACY-PROPOSAL-EMAIL-ERR]', mailErr.message);
        }

        return res.status(201).json({ success: true, data: newProposal, message: 'Proposta normativa sottomessa correttamente! In attesa di convalida amministrativa.' });
      } catch (err: any) {
        console.error('[DEMOCRACY-NEW-PROPOSAL-ERR]', err);
        return res.status(500).json({ success: false, message: 'Impossibile registrare la proposta normativa: ' + err.message });
      }
    });

    // Registra un voto del cittadino
    apiRouter.post('/democracy/vote', async (req, res) => {
      const { proposal_id, citizen_id, vote } = req.body || {};
      if (!proposal_id || !citizen_id || !vote) {
        return res.status(400).json({ success: false, message: 'Parametri del voto incompleti.' });
      }

      if (vote !== 'yes' && vote !== 'no' && vote !== 'abstain') {
        return res.status(400).json({ success: false, message: 'Voto non valido. Consentiti: yes, no, abstain.' });
      }

      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database non disponibile.' });
      }

      try {
        // 1. Controlla cittadinanza attiva approvata
        const citRes = await dbPool.query('SELECT status FROM citizens WHERE id = $1', [citizen_id]);
        if (citRes.rows.length === 0 || citRes.rows[0].status !== 'approved') {
          return res.status(403).json({ success: false, message: 'Solo i cittadini approvati ed attivi del New World State hanno diritto di voto sovrano.' });
        }

        // 2. Controlla stato proposta e date di voto
        const propRes = await dbPool.query('SELECT status, voting_ends_at FROM nws_proposals WHERE id = $1', [proposal_id]);
        if (propRes.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Proposta non trovata.' });
        }
        const prop = propRes.rows[0];
        if (prop.status !== 'approved') {
          return res.status(400).json({ success: false, message: 'Le votazioni per questa proposta non sono attualmente attive.' });
        }

        if (prop.voting_ends_at && new Date(prop.voting_ends_at) < new Date()) {
          return res.status(400).json({ success: false, message: 'Le votazioni per questa proposta normativa si sono concluse.' });
        }

        // 3. Verifica duplicati
        const voteCheck = await dbPool.query('SELECT id FROM nws_votes WHERE proposal_id = $1 AND citizen_id = $2', [proposal_id, citizen_id]);
        if (voteCheck.rows.length > 0) {
          return res.status(400).json({ success: false, message: 'Hai già registrato ed espresso il tuo voto sovrano per questa proposta normativa.' });
        }

        // 4. Inserimento voto
        await dbPool.query('INSERT INTO nws_votes (proposal_id, citizen_id, vote) VALUES ($1, $2, $3)', [proposal_id, citizen_id, vote]);
        return res.json({ success: true, message: 'Voto depositato con successo nel registro di democrazia online!' });
      } catch (err: any) {
        console.error('[DEMOCRACY-CAST-VOTE-ERR]', err);
        return res.status(500).json({ success: false, message: 'Impossibile esprimere il voto: ' + err.message });
      }
    });

    // Azione amministratore su proposte normative (Approva, Rifiuta, Elimina)
    apiRouter.post('/democracy/admin/action', async (req, res) => {
      const { action, proposal_id, rejection_reason } = req.body || {};
      if (!action || !proposal_id) {
        return res.status(400).json({ success: false, message: 'Specificare azione e id proposta.' });
      }

      if (!dbPool) {
        return res.status(500).json({ success: false, message: 'Database non disponibile.' });
      }

      try {
        if (action === 'approve') {
          // Convalida proposta e avvia votazione con date facoltative personalizzate
          const { voting_starts_at, voting_ends_at } = req.body || {};
          let startVoteSql;
          let params;

          if (voting_starts_at && voting_ends_at) {
            startVoteSql = `
              UPDATE nws_proposals 
              SET status = 'approved', 
                  voting_starts_at = $2, 
                  voting_ends_at = $3
              WHERE id = $1 
              RETURNING *
            `;
            params = [proposal_id, voting_starts_at, voting_ends_at];
          } else {
            startVoteSql = `
              UPDATE nws_proposals 
              SET status = 'approved', 
                  voting_starts_at = CURRENT_TIMESTAMP, 
                  voting_ends_at = CURRENT_TIMESTAMP + INTERVAL '7 days' 
              WHERE id = $1 
              RETURNING *
            `;
            params = [proposal_id];
          }

          const result = await dbPool.query(startVoteSql, params);
          if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Proposta non trovata.' });
          }

          const approvedProposal: any = result.rows[0];

          // 1. Pubblica le informazioni relative al titolo della votazione e ai termini temporali in un apposito albo
          try {
            await dbPool.query(
              'INSERT INTO nws_albo (proposal_id, title, voting_starts_at, voting_ends_at) VALUES ($1, $2, $3, $4)',
              [approvedProposal.id, approvedProposal.title, approvedProposal.voting_starts_at, approvedProposal.voting_ends_at]
            );
            console.log(`[ALBO-PRETORIO] Pubblicato nell'albo pretorio l'annuncio per: "${approvedProposal.title}"`);
          } catch (alboErr) {
            console.error('[ALBO-PRETORIO-ERR]', alboErr);
          }

          let serviceMessage = 'Proposta normativa convalidata e aperta ufficialmente al voto popolare.';
          
          // 2. Invia una email a tutti i cittadini del New World State
          try {
            const citizensRes = await dbPool.query('SELECT email, "firstName", firstname, surname, "citizenCode" FROM citizens');
            const validCitizens = citizensRes.rows.filter(cit => cit.email && cit.email.trim() !== '');
            
            console.log(`[VOTING-BROADCAST] Avvio invio email a ${validCitizens.length} cittadini per la proposta convalidata.`);
            
            const startStr = new Date(approvedProposal.voting_starts_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
            const endStr = new Date(approvedProposal.voting_ends_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome' });

            const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
            if (!smtpConfigured) {
              serviceMessage = 'Proposta convalidata e pubblicata nell\'Albo delle Votazioni! ATTENZIONE: le notifiche email non sono state inviate poiché le credenziali SMTP (SMTP_USER/SMTP_PASS) di Aruba non sono configurate.';
            } else if (validCitizens.length === 0) {
              serviceMessage = 'Proposta convalidata e pubblicata nell\'Albo delle Votazioni! Nota: non è presente alcun cittadino con indirizzo email valido nel database a cui inviare la notifica.';
            } else {
              serviceMessage = `Proposta convalidata e pubblicata nell'Albo delle Votazioni! Avviata la coda di notifica email per tutti i ${validCitizens.length} cittadini registrati.`;
            }

            // Inserisci anche una riga in nws_broadcasts per far scattare la notifica push persistente su entrambi gli smartphone
            try {
              const bTitle = `🏛️ Nuovo Referendum Convalidato!`;
              const bContent = `È aperta ufficialmente la votazione popolare per il referendum: "${approvedProposal.title}". Esprimi la tua preferenza entro il termine stabilito!`;
              
              await dbPool.query(
                `INSERT INTO nws_broadcasts (title, content, target, sent_by, email_count) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [bTitle, bContent, 'all', 'Consiglio di Democrazia', validCitizens.length]
              );
              console.log('[VOTING-BROADCAST-PUSH] Registrata notifica push in nws_broadcasts per la proposta convalidata.');
            } catch (pushErr: any) {
              console.error('[VOTING-BROADCAST-PUSH-ERR]', pushErr.message);
            }

            // Await all email sends concurrently so the worker doesn't shut down before completion
            const emailPromises: Promise<any>[] = [];
            for (const cit of validCitizens) {
              const name = cit.firstName || cit.firstname || 'Cittadino';
              const surname = cit.surname || 'Sovrano';
              const email = cit.email.trim();
              
              const subject = `🏛️ New World State - Notifica di Votazione Popolare: ${approvedProposal.title}`;
              const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                  <div style="background-color: #0a1c3e; color: #ffffff; padding: 24px; text-align: center; border-bottom: 4px solid #d97706;">
                    <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.05em; color: #ffffff;">NEW WORLD STATE</h1>
                    <div style="font-size: 11px; color: #f59e0b; margin-top: 4px; letter-spacing: 0.15em; font-family: monospace;">CONSIGLIO DI DEMOCRAZIA DIRETTA</div>
                  </div>
                  <div style="padding: 24px; background-color: #ffffff; color: #334155;">
                    <p style="font-size: 15px; margin-top: 0;">Gentile cittadino/a <strong>${name} ${surname}</strong> (Codice: ${cit.citizenCode || 'NWS'}),</p>
                    <p style="font-size: 14px; line-height: 1.5;">Il Consiglio Esecutivo ha convalidato e formalmente calendarizzato una nuova consultazione popolare/referendum nel registro elettorale sovrano.</p>
                    
                    <div style="background-color: #f8fafc; border-left: 4px solid #d97706; padding: 16px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="margin: 0 0 10px 0; color: #0a1c3e; font-size: 14px; text-transform: uppercase; letter-spacing: 0.02em;">Dati della Votazione</h3>
                      <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Titolo Referendum:</strong> ${approvedProposal.title}</p>
                      <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Categoria:</strong> ${approvedProposal.category || 'Generale'}</p>
                      <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Termini Temporali:</strong></p>
                      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #0f172a;">
                        <li><strong>Inizio:</strong> ${startStr}</li>
                        <li><strong>Scadenza:</strong> ${endStr}</li>
                      </ul>
                    </div>

                    <p style="font-size: 13px; line-height: 1.5; color: #64748b;">
                      Ti ricordiamo che l'esercizio del voto diretto garantisce l'attuazione dei principi liberali su cui si fonda la nostra nazione. Puoi esprimere la tua preferenza e consultare l'apposita deliberazione normata in articoli collegandoti al Portale Federale.
                    </p>

                    <div style="text-align: center; margin: 28px 0;">
                      <a href="${process.env.APP_URL || 'https://newworldstate.cloud'}/democracy" style="display: inline-block; background-color: #0a1c3e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(10,28,62,0.25);">ACCEDI AL PORTALE DI VOTO</a>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">
                      Generato automaticamente dal Registro dei Referendum del New World State.<br />
                      Per favore non rispondere a questa comunicazione.
                    </p>
                  </div>
                </div>
              `;

              if (smtpConfigured) {
                emailPromises.push(
                  sendLocalEmail({ to: email, subject, html })
                    .then(() => console.log(`[VOTING-EMAIL] Email inviata a: ${email}`))
                    .catch(err => console.warn(`[VOTING-EMAIL-FAILED] Errore invio a ${email}: ${err.message}`))
                );
              }
            }

            if (emailPromises.length > 0) {
              await Promise.all(emailPromises);
              console.log(`[VOTING-EMAIL-OK] Spedite con successo ${emailPromises.length} email di votazione.`);
            }
          } catch (citErr: any) {
            console.error('[VOTING-BROADCAST-CIT-FETCH-ERR]', citErr);
            serviceMessage = `Proposta convalidata e pubblicata nell'albo, ma si è verificato un errore locale durante il recupero dei cittadini: ${citErr.message}`;
          }

          return res.json({ success: true, data: result.rows[0], message: serviceMessage });
        
        } else if (action === 'reject') {
          // Rifiuta proposta con motivazione
          const rejectSql = `
            UPDATE nws_proposals 
            SET status = 'rejected', 
                rejection_reason = $1 
            WHERE id = $2 
            RETURNING *
          `;
          const result = await dbPool.query(rejectSql, [rejection_reason || 'Nessuna motivazione specificata dall\'amministrazione.', proposal_id]);
          if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Proposta non trovata.' });
          }
          return res.json({ success: true, data: result.rows[0], message: 'Proposta normativa respinta.' });
        
        } else if (action === 'delete') {
          // Elimina proposta e relativi voti
          await dbPool.query('DELETE FROM nws_votes WHERE proposal_id = $1', [proposal_id]);
          const result = await dbPool.query('DELETE FROM nws_proposals WHERE id = $1 RETURNING id', [proposal_id]);
          if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Proposta non trovata.' });
          }
          return res.json({ success: true, message: 'Proposta normativa eliminata con successo e voti azzerati.' });
        }

        return res.status(400).json({ success: false, message: 'Azione amministrativa non supportata o rimossa.' });
      } catch (err: any) {
        console.error('[DEMOCRACY-ADMIN-ACTION-ERR]', err);
        return res.status(500).json({ success: false, message: 'Errore durante l\'esecuzione dell\'azione: ' + err.message });
      }
    });

    // =========================================================================
    // SOVEREIGN CHAT & COMMUNICATION API (WHATSAPP / TELEGRAM INSPIRED)
    // =========================================================================
    const CHAT_STORAGE_DIR = path.join(process.cwd(), 'aruba_storage', 'nws_chat_files');
    const CHAT_MESSAGES_FILE = path.join(process.cwd(), 'aruba_storage', 'nws_chat_messages.json');

    // Ensure storage folder on Aruba local directory exists
    try {
      if (!fs.existsSync(CHAT_STORAGE_DIR)) {
        fs.mkdirSync(CHAT_STORAGE_DIR, { recursive: true });
        console.log(`[CHAT] Storage directory created: ${CHAT_STORAGE_DIR}`);
      }
    } catch (err: any) {
      console.error('[CHAT] Error creating storage folder:', err.message);
    }

    // Helper to read messages from JSON storage
    function loadChatMessages(): any[] {
      try {
        if (fs.existsSync(CHAT_MESSAGES_FILE)) {
          const raw = fs.readFileSync(CHAT_MESSAGES_FILE, 'utf-8');
          return JSON.parse(raw);
        }
      } catch (err: any) {
        console.error('[CHAT] Error loading chat messages:', err.message);
      }
      return [];
    }

    // Helper to save messages to JSON storage
    function saveChatMessages(messages: any[]) {
      try {
        const parentDir = path.dirname(CHAT_MESSAGES_FILE);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(CHAT_MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8');
      } catch (err: any) {
        console.error('[CHAT] Error saving chat messages:', err.message);
      }
    }

    // Initialize messages list
    let chatMessages: any[] = loadChatMessages();

    // Create SQL table if PostgreSQL is available
    if (dbPool) {
      dbPool.query(`
        CREATE TABLE IF NOT EXISTS nws_chat_messages (
          id SERIAL PRIMARY KEY,
          uuid VARCHAR(100) UNIQUE NOT NULL,
          room VARCHAR(100) DEFAULT 'general',
          sender_name TEXT NOT NULL,
          sender_role TEXT NOT NULL,
          text TEXT,
          type VARCHAR(20) NOT NULL,
          file_url TEXT,
          file_name TEXT,
          file_size INT,
          duration INT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `).then(() => {
        console.log('[CHAT-DB] PostgreSQL nws_chat_messages table validated successfully.');
      }).catch((err: any) => {
        console.error('[CHAT-DB] Failed to create nws_chat_messages table:', err.message);
      });
    }

    // Chat API endpoints
    apiRouter.get('/chat/citizens/search', async (req, res) => {
      const q = (req.query.q as string || '').trim();
      if (!q) {
        return res.json({ success: true, citizens: [] });
      }
      try {
        if (dbPool) {
          const result = await dbPool.query(
            `SELECT id, "firstName", surname, "citizenCode", "arubaPhotoUrl" 
             FROM citizens 
             WHERE status = 'approved' AND (
               "firstName" ILIKE $1 OR 
               surname ILIKE $1 OR 
               "citizenCode" ILIKE $1
             ) 
             ORDER BY surname ASC, "firstName" ASC
             LIMIT 30`,
            [`%${q}%`]
          );
          const formatted = result.rows.map(row => ({
            id: row.id,
            firstName: row.firstName || row.firstname || '',
            surname: row.surname || '',
            citizenCode: row.citizenCode || '',
            arubaPhotoUrl: row.arubaPhotoUrl || row.arubaphotourl || ''
          }));
          return res.json({ success: true, citizens: formatted });
        } else {
          const lowerQ = q.toLowerCase();
          const filtered = memoryCitizens
            .filter(c => c.status === 'approved' && (
              (c.firstName || '').toLowerCase().includes(lowerQ) ||
              (c.surname || '').toLowerCase().includes(lowerQ) ||
              (c.citizenCode || '').toLowerCase().includes(lowerQ)
            ))
            .slice(0, 30)
            .map(c => ({
              id: c.id,
              firstName: c.firstName || '',
              surname: c.surname || '',
              citizenCode: c.citizenCode || '',
              arubaPhotoUrl: c.arubaPhotoUrl || ''
            }));
          return res.json({ success: true, citizens: filtered });
        }
      } catch (err: any) {
        console.error('[CITIZENS-SEARCH-ERR]', err.message);
        return res.status(500).json({ success: false, message: 'Errore durante la ricerca dei cittadini.' });
      }
    });

    apiRouter.get('/chat/messages', async (req, res) => {
      const room = (req.query.room as string) || 'general';
      try {
        if (dbPool) {
          const result = await dbPool.query(
            'SELECT uuid as id, room, sender_name as "senderName", sender_role as "senderRole", text, type, file_url as "fileUrl", file_name as "fileName", file_size as "fileSize", duration, created_at as "timestamp" FROM nws_chat_messages WHERE room = $1 ORDER BY id ASC LIMIT 500',
            [room]
          );
          return res.json({ success: true, messages: result.rows });
        } else {
          // Fallback to local memory/JSON
          const filtered = chatMessages
            .filter((m) => m.room === room)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          return res.json({ success: true, messages: filtered });
        }
      } catch (err: any) {
        console.error('[CHAT-GET-ERR]', err.message);
        // Failover to local memory if DB fails
        const filtered = chatMessages
          .filter((m) => m.room === room)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return res.json({ success: true, messages: filtered, fallback: true });
      }
    });

    apiRouter.post('/chat/messages', async (req, res) => {
      const { id, room, senderName, senderRole, text, type, fileUrl, fileName, fileSize, duration } = req.body;
      const messageId = id || `msg_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      const timestamp = new Date().toISOString();

      if (!senderName) {
        return res.status(400).json({ success: false, message: 'senderName is required.' });
      }

      const messageObj = {
        id: messageId,
        room: room || 'general',
        senderName,
        senderRole: senderRole || 'Cittadino',
        text: text || '',
        type: type || 'text',
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        duration: duration || null,
        timestamp
      };

      try {
        // Save to PostgreSQL if available
        if (dbPool) {
          await dbPool.query(
            `INSERT INTO nws_chat_messages 
             (uuid, room, sender_name, sender_role, text, type, file_url, file_name, file_size, duration, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              messageObj.id,
              messageObj.room,
              messageObj.senderName,
              messageObj.senderRole,
              messageObj.text,
              messageObj.type,
              messageObj.fileUrl,
              messageObj.fileName,
              messageObj.fileSize,
              messageObj.duration,
              timestamp
            ]
          );
        }

        // Save to Memory/JSON backup always (mimicking physical Aruba archive backup file)
        chatMessages.push(messageObj);
        // Limit backup messages in JSON file to 1000 to keep it lightweight
        if (chatMessages.length > 1000) {
          chatMessages.shift();
        }
        saveChatMessages(chatMessages);

        return res.json({ success: true, message: messageObj });
      } catch (err: any) {
        console.error('[CHAT-POST-ERR]', err.message);
        // Save to memory anyways
        chatMessages.push(messageObj);
        saveChatMessages(chatMessages);
        return res.json({ success: true, message: messageObj, fallback: true });
      }
    });

    apiRouter.post('/chat/upload', async (req, res) => {
      const { fileData, fileName, fileType } = req.body;

      if (!fileData || !fileName) {
        return res.status(400).json({ success: false, message: 'fileData and fileName are required.' });
      }

      try {
        // Validate file type (only support photo, pdf, and audio webm/ogg/mp3/m4a)
        const ext = path.extname(fileName).toLowerCase();
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.webm', '.ogg', '.wav', '.mp3', '.m4a'];
        if (!allowedExtensions.includes(ext)) {
          return res.status(400).json({ success: false, message: 'File extension not allowed. Only photos, PDFs, and audio recordings are supported.' });
        }

        // Decode base64
        const base64Content = fileData.split(';base64,').pop() || fileData;
        const buffer = Buffer.from(base64Content, 'base64');
        const originalSize = buffer.length;

        // Double check maximum file size (5MB for PDFs, 2MB for photos/audio to maintain maximum speed)
        const sizeLimit = ext === '.pdf' ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
        if (originalSize > sizeLimit) {
          return res.status(400).json({ 
            success: false, 
            message: `Il file supera il limite consentito di ${ext === '.pdf' ? '5MB' : '2MB'}. La compressione client lo ridurrà automaticamente.` 
          });
        }

        // Save locally to local Aruba mimicking archive
        const uniqueFileName = `${Date.now()}_${Math.floor(Math.random() * 100000)}${ext}`;
        const targetPath = path.join(CHAT_STORAGE_DIR, uniqueFileName);
        fs.writeFileSync(targetPath, buffer);

        // Serve URL path
        const fileUrl = `/api/chat/files/${uniqueFileName}`;

        console.log(`[CHAT-UPLOAD] File saved: ${uniqueFileName} (${originalSize} bytes)`);

        return res.json({
          success: true,
          fileUrl,
          fileName,
          fileSize: originalSize
        });
      } catch (err: any) {
        console.error('[CHAT-UPLOAD-ERR]', err.message);
        return res.status(500).json({ success: false, message: 'Errore durante il salvataggio dell\'allegato.' });
      }
    });

    apiRouter.get('/chat/files/:filename', (req, res) => {
      const filename = req.params.filename;
      const targetPath = path.join(CHAT_STORAGE_DIR, filename);

      if (!fs.existsSync(targetPath)) {
        return res.status(404).send('File non trovato.');
      }

      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';

      if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.pdf') contentType = 'application/pdf';
      else if (['.webm', '.ogg'].includes(ext)) contentType = 'audio/webm';
      else if (ext === '.mp3') contentType = 'audio/mpeg';
      else if (ext === '.wav') contentType = 'audio/wav';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for speed
      fs.createReadStream(targetPath).pipe(res);
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
            function submitDecision(action, customPass = null) {
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
              const adminPassword = customPass || localStorage.getItem('nws_admin_password') || 'NWSAdmin2026!';
              
              fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-admin-password': adminPassword
                },
                body: JSON.stringify({
                  id: "${cit.id}",
                  reason: reason
                })
              })
              .then(async res => {
                if (res.status === 401) {
                  throw new Error('UNAUTHORIZED_PASSWORD_ERROR');
                }
                return res.json();
              })
              .then(data => {
                document.getElementById('loading-ui').classList.add('hidden');
                if (data.success) {
                  localStorage.setItem('nws_admin_password', adminPassword);
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
                if (err.message === 'UNAUTHORIZED_PASSWORD_ERROR') {
                  const newPass = prompt("Inserisci la password di amministrazione corretta del New World State:", "");
                  if (newPass !== null && newPass.trim() !== '') {
                    submitDecision(action, newPass);
                  } else {
                    resetUI();
                  }
                } else {
                  showError(err.message || 'Connessione al server interrotta.');
                }
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

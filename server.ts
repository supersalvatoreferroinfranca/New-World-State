import express from 'express';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import path from 'path';
import dotenv from 'dotenv';
const { Pool } = pg;

dotenv.config();

console.log('[SERVER] Starting initialization...');
console.log('[SERVER] NODE_ENV:', process.env.NODE_ENV);

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;
    const isProd = process.env.NODE_ENV === 'production';
    const distPath = path.resolve(process.cwd(), 'dist');

    console.log(`[SERVER] Mode: ${isProd ? 'Production' : 'Development'}`);
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

    // API Routes (defined early to ensure they are hit before static fallback)
    app.get('/api/ping', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'Express server is responding' });
    });

    app.get('/api/db-status', async (req, res) => {
      console.log('[API] Processing /api/db-status');
      const WORKER_URL = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev/api/db-status';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

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

    // Setup PostgreSQL Connection Pool (Neon.tech) - Only if DATABASE_URL is present
    let pool: any = null;
    if (process.env.DATABASE_URL) {
      try {
        pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false // Required for Neon
          }
        });
        console.log('--- POOL DB INIZIALIZZATO ---');
      } catch (e) {
        console.error('Errore durante inizializzazione Pool:', e);
      }
    } else {
      console.warn('⚠️ ATTENZIONE: DATABASE_URL non configurato nei Secrets. Il DB diretto sarà disabilitato.');
    }

  // Check connection and initialize table on startup
  const checkConnection = async () => {
    if (!pool) return;

    try {
      console.log('--- AVVIO CONTROLLO DB (ASYNC) ---');
      const client = await pool.connect();
      console.log('✅ DATABASE CONNESSO: Neon.tech (PostgreSQL) è online.');
      
      await client.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
      
      const tableCheck = await client.query("SELECT FROM information_schema.tables WHERE table_name = 'citizens'");
      
      if (tableCheck.rows.length === 0) {
        await client.query(`
          CREATE TABLE citizens (
            id SERIAL PRIMARY KEY,
            surname TEXT,
            "firstName" TEXT,
            gender CHAR(1),
            "birthDate" DATE,
            "birthPlace" TEXT,
            "birthCountry" TEXT,
            citizenship TEXT,
            "maritalStatus" TEXT,
            "residenceAddress" TEXT,
            "residenceNumber" TEXT,
            "residenceZip" VARCHAR(20),
            "residenceCity" TEXT,
            "residenceProvince" VARCHAR(10),
            "residenceCountry" TEXT,
            "registrationDate" DATE,
            email TEXT UNIQUE,
            "phonePrefix" TEXT,
            "phoneNumber" TEXT,
            username TEXT UNIQUE,
            password TEXT,
            "documentHash" TEXT UNIQUE,
            "documentType" TEXT,
            "plusCode" TEXT,
            "locationDescription" TEXT,
            location GEOMETRY(Point, 4326),
            "isAmbassador" BOOLEAN DEFAULT FALSE,
            "isPeacekeeper" BOOLEAN DEFAULT FALSE,
            status VARCHAR(20) DEFAULT 'pending',
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('✅ DATABASE SCHEMA: Tabella "citizens" creata.');
      }
      client.release();
    } catch (err: any) {
      console.error('--- ERRORE SILENZIOSO CONNESSIONE DB ---');
      console.error('Messaggio:', err.message);
    }
  };
  
  // Do not wait for DB to listen
  checkConnection().catch(e => console.error('checkConnection failed:', e));

  // API Routes
  // (Note: /api/db-status moved to top)

  // Proxy for Nominatim location lookup to avoid CORS/User-Agent issues in browser
  app.get('/api/lookup/location', async (req, res) => {
    const { q, type, lat, lon } = req.query;
    if (!q && (!lat || !lon)) return res.status(400).json({ error: 'Query parameter q or (lat and lon) is required' });

    try {
      let url: string;
      if (q) {
        url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q as string)}&addressdetails=1&limit=5`;
        // Bias results towards user location if provided
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
          contentType,
          body: text.slice(0, 500)
        });
        if (response.status === 429) {
          return res.status(429).json({ error: 'Too many requests. Please slow down.', code: 'RATE_LIMIT' });
        }
        return res.status(response.status).json({ error: 'Nominatim service error', details: text.slice(0, 100) });
      }

      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error('Nominatim proxy error:', err);
      res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
  });

  app.post('/api/register', async (req, res) => {
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

  // Health check/DB check
  app.get('/api/db-check', async (req, res) => {
    if (!pool) return res.status(503).json({ status: 'error', message: 'Database not configured' });
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
  });

  // Catch-all for unmatched API routes
  app.all('/api/*', (req, res) => {
    console.warn(`[API] Unmatched route: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: 'Not Found', 
      message: `The API endpoint ${req.url} was not found on this server.`,
      available_routes: ['/api/db-status', '/api/ping', '/api/lookup/location', '/api/register', '/api/db-check']
    });
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
        index: false // Don't serve index.html for root, let the SPA fallback handle it
      }));
      
      // SPA Fallback: handle all non-API routes
      app.get('*', (req, res, next) => {
        // Skip API routes - they should have been handled by /api/* catch-all if missed
        if (req.url.startsWith('/api/')) {
          console.warn(`[SERVER] API route fallthrough to SPA fallback: ${req.url}`);
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

    // Final catch-all for anything else (should be empty if SPA fallback works)
    app.use((req, res) => {
      console.warn(`[SERVER] Unhandled request: ${req.method} ${req.url}`);
      if (req.url.startsWith('/api/')) {
        res.status(404).json({ error: 'Not Found', path: req.url });
      } else {
        res.status(404).send('Not Found');
      }
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT} (Production: ${isProd})`);
    });

  } catch (err: any) {
    console.error('--- FATAL SERVER ERROR AT STARTUP ---');
    console.error(err);
  }
}

startServer();

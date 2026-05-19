import express from 'express';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const { Pool } = pg;

dotenv.config();

// Standard ESM shims for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;
    const isProd = process.env.NODE_ENV === 'production';

    // Logging middleware
    app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });

    app.use(express.json({ limit: '10mb' }));

    // API Routes (defined early to ensure they are hit before static fallback)
    app.get('/api/ping', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'Express server is responding' });
    });

    app.get('/api/db-status', async (req, res) => {
      console.log('[API] GET /api/db-status');
      const WORKER_URL = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev/api/db-status';
      try {
        const workerRes = await fetch(WORKER_URL);
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
        console.error('[API] Error reaching worker status:', err.message);
        return res.status(502).json({ 
          status: 'error', 
          message: 'Impossibile raggiungere il Worker Database (NWS-WK).', 
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
            firstname TEXT,
            gender CHAR(1),
            birthdate DATE,
            birthplace TEXT,
            birthcountry TEXT,
            citizenship TEXT,
            maritalstatus TEXT,
            residenceaddress TEXT,
            residencenumber TEXT,
            residencezip VARCHAR(20),
            residencecity TEXT,
            residenceprovince VARCHAR(10),
            residencecountry TEXT,
            registrationdate DATE,
            email TEXT UNIQUE,
            phoneprefix TEXT,
            phonenumber TEXT,
            username TEXT UNIQUE,
            password TEXT,
            document_hash TEXT UNIQUE,
            documenttype TEXT,
            pluscode TEXT,
            locationdescription TEXT,
            location GEOMETRY(Point, 4326),
            isambassador BOOLEAN DEFAULT FALSE,
            ispeacekeeper BOOLEAN DEFAULT FALSE,
            status VARCHAR(20) DEFAULT 'pending',
            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

  // Catch-all for unmatched API routes
  app.all('/api/*', (req, res) => {
    console.warn(`[API] Unmatched route: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: 'Not Found', 
      message: `The API endpoint ${req.url} was not found on this server.`,
      available_routes: ['/api/db-status', '/api/ping', '/api/lookup/location', '/api/register']
    });
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

    // Static file serving logic
    if (!isProd) {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      // In production, esbuild bundle is usually in dist/ and assets are there too
      // path.resolve(process.cwd(), 'dist') is safe
      const distPath = path.resolve(process.cwd(), 'dist');
      console.log(`[SERVER] Serving static files from: ${distPath}`);
      
      app.use(express.static(distPath));
      
      // SPA Fallback: handle all non-API routes
      app.get('*', (req, res, next) => {
        // Skip API routes if they weren't matched above
        if (req.url.startsWith('/api/')) {
          return next();
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT} (Production: ${isProd})`);
    });

  } catch (err: any) {
    console.error('--- FATAL SERVER ERROR AT STARTUP ---');
    console.error(err);
  }
}

startServer();

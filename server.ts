import express from 'express';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Setup PostgreSQL Connection Pool (Neon.tech)
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Neon
    }
  });

  console.log('--- TENTATIVO DI CONNESSIONE DB (NEON.TECH) ---');
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ ATTENZIONE: DATABASE_URL non configurato nei Secrets di AI Studio.');
  }

  // Check connection and initialize table on startup
  const checkConnection = async () => {
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ ATTENZIONE: DATABASE_URL non configurato.');
      return;
    }

    let client;
    try {
      client = await pool.connect();
      console.log('✅ DATABASE CONNESSO: Neon.tech (PostgreSQL) è online.');
      
      // Enable PostGIS if not enabled
      await client.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
      
      // Check if table exists, if not create it
      // We don't drop it every time now to avoid issues if multiple instances start
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
      } else {
        // Heal schema: ensure all columns exist
        const columnsToEnsure = [
          ['surname', 'TEXT'],
          ['firstname', 'TEXT'],
          ['gender', 'CHAR(1)'],
          ['birthdate', 'DATE'],
          ['birthplace', 'TEXT'],
          ['birthcountry', 'TEXT'],
          ['citizenship', 'TEXT'],
          ['maritalstatus', 'TEXT'],
          ['residenceaddress', 'TEXT'],
          ['residencenumber', 'TEXT'],
          ['residencezip', 'VARCHAR(20)'],
          ['residencecity', 'TEXT'],
          ['residenceprovince', 'VARCHAR(10)'],
          ['residencecountry', 'TEXT'],
          ['registrationdate', 'DATE'],
          ['phoneprefix', 'TEXT'],
          ['phonenumber', 'TEXT'],
          ['username', 'TEXT'],
          ['password', 'TEXT'],
          ['document_hash', 'TEXT'],
          ['documenttype', 'TEXT'],
          ['pluscode', 'TEXT'],
          ['locationdescription', 'TEXT'],
          ['isambassador', 'BOOLEAN DEFAULT FALSE'],
          ['ispeacekeeper', 'BOOLEAN DEFAULT FALSE'],
          ['status', 'VARCHAR(20) DEFAULT \'pending\''],
          ['createdat', 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP']
        ];

        for (const [col, type] of columnsToEnsure) {
          await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS ${col} ${type};`);
        }
        
        // Special case: location column (requires separate care due to GEOMETRY type)
        try {
          await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS location GEOMETRY(Point, 4326);`);
        } catch (e) {
          console.warn('Could not add location column (might already exist or PostGIS missing)');
        }

        await client.query(`ALTER TABLE citizens ALTER COLUMN email DROP NOT NULL;`);
        console.log('✅ DATABASE SCHEMA: Tabella "citizens" verificata e aggiornata.');
      }
    } catch (err: any) {
      console.error('--- ERRORE CONNESSIONE DB ---');
      console.error('Messaggio:', err.message);
    } finally {
      if (client) client.release();
    }
  };
  
  checkConnection();

  // API Routes
  app.get('/api/db-status', async (req, res) => {
    const WORKER_URL = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev/';
    try {
      const workerRes = await fetch(WORKER_URL);
      if (workerRes.ok || workerRes.status === 404) {
        res.json({ status: 'connected', message: 'Connesso al Database Worker (NWS-WK).' });
      } else {
        res.json({ status: 'error', message: `Il Worker Database ha risposto con codice ${workerRes.status}.` });
      }
    } catch (err: any) {
      res.json({ status: 'error', message: 'Impossibile raggiungere il Worker Database (NWS-WK).', details: err.message });
    }
  });

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
    const WORKER_URL = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev/';
    console.log('--- PROXYING REGISTRAZIONE AL WORKER ---');
    try {
      const workerRes = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });

      const contentType = workerRes.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await workerRes.json();
        res.status(workerRes.status).json(data);
      } else {
        const text = await workerRes.text();
        res.status(workerRes.status).json({ success: false, message: 'Risposta worker non valida (non JSON)', details: text });
      }
    } catch (error: any) {
      console.error('Registration Proxy Error:', error);
      res.status(500).json({ success: false, message: 'Errore durante la comunicazione con il Database Worker.' });
    }
  });

  // Health check/DB check
  app.get('/api/db-check', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

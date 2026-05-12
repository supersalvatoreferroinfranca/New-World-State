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

  app.use(express.json());

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
            surname TEXT NOT NULL,
            firstName TEXT NOT NULL,
            gender CHAR(1) NOT NULL,
            birthDate DATE NOT NULL,
            birthPlace TEXT NOT NULL,
            birthCountry TEXT NOT NULL,
            citizenship TEXT NOT NULL,
            maritalStatus TEXT NOT NULL,
            residenceAddress TEXT,
            residenceNumber TEXT,
            residenceZip VARCHAR(10),
            residenceCity TEXT,
            residenceProvince VARCHAR(5),
            residenceCountry TEXT,
            registrationDate DATE,
            email TEXT UNIQUE,
            phonePrefix TEXT,
            phoneNumber TEXT,
            username TEXT UNIQUE,
            password TEXT,
            document_hash TEXT UNIQUE,
            documentType TEXT NOT NULL,
            documentFront TEXT,
            documentBack TEXT,
            plusCode TEXT,
            locationDescription TEXT,
            location GEOMETRY(Point, 4326),
            isAmbassador BOOLEAN DEFAULT FALSE,
            isPeacekeeper BOOLEAN DEFAULT FALSE,
            status VARCHAR(20) DEFAULT 'pending',
            createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('✅ DATABASE SCHEMA: Tabella "citizens" creata.');
      } else {
        // Just verify/update columns if needed (simplified for now)
        // Ensure residenceNumber column exists (added in recent version)
        await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS residenceNumber TEXT;`);
        await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS phonePrefix TEXT;`);
        await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS phoneNumber TEXT;`);
        await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS username TEXT;`);
        await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS password TEXT;`);
        await client.query(`ALTER TABLE citizens ADD COLUMN IF NOT EXISTS document_hash TEXT;`);
        await client.query(`ALTER TABLE citizens ALTER COLUMN email DROP NOT NULL;`);
        console.log('✅ DATABASE SCHEMA: Tabella "citizens" verificata.');
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
    if (!process.env.DATABASE_URL) {
      return res.json({ status: 'unconfigured', message: 'Configura DATABASE_URL nei Secrets' });
    }
    try {
      const client = await pool.connect();
      client.release();
      res.json({ status: 'connected', message: 'Connesso a Neon.tech (PostgreSQL)' });
    } catch (err: any) {
      res.json({ status: 'error', code: err.code, message: err.message });
    }
  });

  /**
   * REQUISITO SQL PER NEON (PostgreSQL):
   * Esegui questa query nel SQL Editor di Neon per creare la tabella:
   * 
   * CREATE TABLE IF NOT EXISTS citizens (
   *   id SERIAL PRIMARY KEY,
   *   fullName TEXT NOT NULL,
   *   email TEXT UNIQUE NOT NULL,
   *   birthDate DATE,
   *   nationality VARCHAR(10),
   *   isAmbassador BOOLEAN DEFAULT FALSE,
   *   isPeacekeeper BOOLEAN DEFAULT FALSE,
   *   status VARCHAR(20) DEFAULT 'pending',
   *   createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   * );
   */
  // Proxy for Nominatim location lookup to avoid CORS/User-Agent issues in browser
  app.get('/api/lookup/location', async (req, res) => {
    const { q, type, lat, lon } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q as string)}&addressdetails=1&limit=5`;
      
      // Bias results towards user location if provided
      if (lat && lon) {
        url += `&viewbox=${Number(lon)-0.5},${Number(lat)+0.5},${Number(lon)+0.5},${Number(lat)-0.5}`;
      }

      if (type === 'country') url += '&featuretype=country';
      if (type === 'city') url += '&featuretype=city';

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
        
        // If we hit rate limiting, we might want to return an empty array instead of failing hard
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
    console.log('--- NUOVA RICHIESTA DI REGISTRAZIONE ---');
    try {
      const { 
        surname, firstName, gender, birthDate, birthPlace, birthCountry,
        citizenship, maritalStatus, residenceAddress, residenceNumber, residenceZip, 
        residenceCity, residenceProvince, residenceCountry, email, phonePrefix, phoneNumber,
        username, password, documentHash,
        documentType, plusCode, locationDescription, latitude, longitude,
        isAmbassador, isPeacekeeper 
      } = req.body;
      
      const normalizedUsername = username ? username.toLowerCase().replace(/\s/g, '') : null;
      
      console.log('Dati ricevuti per:', email || normalizedUsername);
      
      if (!process.env.DATABASE_URL) {
        console.error('ERRORE: DATABASE_URL non configurato');
        return res.status(400).json({ 
          success: false, 
          message: 'Configurazione Database mancante.' 
        });
      }

      // 1. Unified checks for security and duplicates
      // Check for duplicates by Email, Username, Document Hash, or Persona (Surname+FirstName+BirthDate)
      const duplicateQuery = `
        SELECT id FROM citizens 
        WHERE (email IS NOT NULL AND email = $1)
        OR (username IS NOT NULL AND username = $2)
        OR (document_hash IS NOT NULL AND document_hash = $3)
        OR (surname = $4 AND firstName = $5 AND birthDate = $6)
      `;
      const duplicateValues = [
        email || null, 
        normalizedUsername, 
        documentHash || null, 
        surname, 
        firstName, 
        birthDate
      ];
      
      const dupCheck = await pool.query(duplicateQuery, duplicateValues);
      
      if (dupCheck.rows.length > 0) {
        console.warn('REGISTRAZIONE NEGATA: Rilevato duplicato');
        return res.status(400).json({ 
          success: false, 
          message: 'Spiacenti, esiste già un cittadino registrato con questi dati, questo account o questo documento.' 
        });
      }

      console.log('Tentativo di inserimento nel DB...');
      const query = `
        INSERT INTO citizens (
          surname, firstName, gender, birthDate, birthPlace, birthCountry,
          citizenship, maritalStatus, residenceAddress, residenceNumber, residenceZip, 
          residenceCity, residenceProvince, residenceCountry, registrationDate, email, phonePrefix, phoneNumber,
          username, password, document_hash,
          documentType, plusCode, locationDescription, location,
          isAmbassador, isPeacekeeper, status, createdAt
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, ST_SetSRID(ST_MakePoint($25, $26), 4326), $27, $28, $29, $30)
        RETURNING id
      `;
      const values = [
        surname, firstName, gender, birthDate || null, birthPlace, birthCountry,
        citizenship, maritalStatus, residenceAddress || null, residenceNumber || null, residenceZip || null,
        residenceCity || null, residenceProvince || null, residenceCountry || null, new Date(), email || null, phonePrefix || null, phoneNumber || null,
        normalizedUsername, password || null, documentHash || null,
        documentType, plusCode || null, locationDescription || null,
        longitude || null, latitude || null,
        !!isAmbassador, !!isPeacekeeper, 'pending', new Date()
      ];

      const result = await pool.query(query, values);
      console.log('Inserimento completato. ID:', result.rows[0].id);

      res.status(201).json({ 
        success: true, 
        message: 'Cittadino registrato con successo', 
        id: result.rows[0].id 
      });
    } catch (error: any) {
      console.error('Registration Error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.code === '23505' // Unique violation in Postgres
          ? 'Indirizzo email già registrato.' 
          : 'Errore interno del server durante la registrazione.' 
      });
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

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

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

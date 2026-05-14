# Guida alla Distribuzione su Cloudflare Pages

Questa applicazione è configurata per funzionare sia su un server Express tradizionale che su **Cloudflare Pages** tramite le **Pages Functions**.

## Come funziona
Le API sono state duplicate nella cartella `functions/api/`. Quando carichi il codice su Cloudflare Pages, queste verranno automaticamente distribuite come Workers "edge".

## Passaggi per la Configurazione su Cloudflare

### 0. Configurazione Wrangler (Novità)
Abbiamo aggiunto un file `wrangler.jsonc`. Questo file dice a Cloudflare che:
- La cartella dei file statici è `dist`.
- Deve usare la compatibilità `nodejs_compat` (necessaria per il driver di Neon).

Se ricevi un errore di **conflitto git** su `wrangler.jsonc` su GitHub:
1. Accetta la versione del repository (quella creata dall'AI).
2. Assicurati che il file contenga `"pages_build_output_dir": "dist"`.

### 1. Variabili d'Ambiente (Secrets)
Cloudflare Pages richiede che le variabili siano configurate nella sua dashboard.
1. Apri la dashboard di Cloudflare.
2. Vai su **Workers & Pages** -> seleziona il tuo progetto.
3. Clicca su **Settings** -> **Functions** (o **Environment Variables** se è un progetto statico appena convertito).
4. Sotto **Environment variables**, clicca su **Add variable**.
5. Aggiungi `DATABASE_URL` con la tua stringa di Neon.
6. Clicca su **Save** e **rifai il deploy**.

### 2. Driver Database
Abbiamo installato `@neondatabase/serverless` che è necessario per connettere Neon dall'ambiente "Edge" di Cloudflare. Le funzioni nella cartella `functions/` usano già questo driver.

### 3. Build Command
Il comando di build su Cloudflare Pages deve rimanere:
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

## Problemi Comuni
### Errore: "Variables cannot be added to a Worker that only has static assets"
Se vedi questo errore nella dashboard di Cloudflare, significa che Cloudflare non ha ancora rilevato la cartella `functions` nel tuo ultimo deploy.
1. Carica (Push) il codice su GitHub assicurandoti che la cartella `functions` sia presente.
2. Attendi il completamento della build.
3. Una volta completata, Cloudflare "sbloccherà" la sezione Variables sotto **Settings > Functions**.
4. Inserisci i tuoi segreti e **avvia un nuovo deploy** (le variabili vengono iniettate solo durante la fase di build).

### Errore: "Infinite loop detected in _redirects"
Questo accade perché abbiamo abilitato il supporto SPA direttamente in `wrangler.jsonc`.
- Abbiamo rimosso il file `public/_redirects`.
- Il routing è ora gestito dall'opzione `"not_found_handling": "single-page-application"` in `wrangler.jsonc`.

### Errore: "Specify the path to the directory of assets"
Questo errore accade quando Wrangler non trova i file statici nel nuovo formato di configurazione.
- Abbiamo aggiunto il blocco `assets` con `"directory": "./dist"` in `wrangler.jsonc`.
- Abbiamo abilitato `"not_found_handling": "single-page-application"` per gestire correttamente le rotte di React.

### Errore: "The name 'ASSETS' is reserved"
Risolto rimuovendo il binding manuale `ASSETS`. Cloudflare lo gestisce internamente.

### Errore: "Unsupported platform for tapable (win32)"
Se vedi questo errore durante la build:
1. Ho eliminato il file `package-lock.json`. 
2. Al prossimo commit su GitHub, Cloudflare genererà un nuovo lock file compatibile con l'ambiente Linux del server di build.

## Configurazione Standalone Worker (API)

Se hai creato un Worker separato (es. `nws-wk`), ecco il codice `worker.js` da incollare nell'editor di Cloudflare. Questo codice gestisce la connessione a Neon usando il driver HTTP ottimizzato.

```javascript
import { neon } from 'https://esm.sh/@neondatabase/serverless@0.10.4';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
      if (!env.DATABASE_URL) throw new Error('DATABASE_URL non configurata');
      const sql = neon(env.DATABASE_URL);

      // Rotta: Lookup Location
      if (url.pathname === '/api/lookup/location') {
        const q = url.searchParams.get('q');
        const type = url.searchParams.get('type');
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5`;
        const response = await fetch(nominatimUrl, { headers: { 'User-Agent': 'WorldRegistrationApp/1.0' } });
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Rotta: Registrazione
      if (url.pathname === '/api/register' && request.method === 'POST') {
        const body = await request.json();
        const { surname, firstName, gender, birthDate, email, username, longitude, latitude } = body;
        const normalizedUsername = username ? username.toLowerCase().replace(/\s/g, '') : null;
        
        // Esempio query (espandere con tutti i campi del form)
        const result = await sql`
          INSERT INTO citizens (surname, firstName, gender, birthDate, email, username, location, status)
          VALUES (${surname}, ${firstName}, ${gender}, ${birthDate}, ${email}, ${normalizedUsername}, 
          ST_SetSRID(ST_MakePoint(${longitude || 0}, ${latitude || 0}), 4326), 'pending')
          RETURNING id
        `;
        return new Response(JSON.stringify({ success: true, id: result[0].id }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Rotta: Health Check
      if (url.pathname === '/api/db-status' || url.pathname === '/api/db-check') {
        await sql`SELECT 1`;
        return new Response(JSON.stringify({ status: 'connected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ status: 'error', message: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }
};
```

**Nota:** Ricordati di eseguire `CREATE EXTENSION IF NOT EXISTS postgis;` nella console SQL di Neon se ricevi errori sulla funzione `ST_MakePoint`.

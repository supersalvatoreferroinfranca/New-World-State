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

### Errore: "invalid header: neon-connection-string"
Questo errore accade quando la stringa di connessione DATABASE_URL contiene caratteri non validi o spazi.
- Nel codice del Worker, abbiamo aggiunto `.trim()` alla variabile `env.DATABASE_URL`.
- Assicurati che su Cloudflare la variabile non inizi con apici o spazi.

### Errore: "No such module"
Questo accade perché la dashboard di Cloudflare non risolve automaticamente gli import `npm` se il Worker non è caricato tramite Wrangler.
- **Soluzione:** Abbiamo riscritto il Worker per usare l'**API HTTP nativa di Neon** tramite `fetch`.
- In questo modo il file è autonomo e **non richiede installazioni o moduli esterni**.

## Codice Worker "Zero-Dependencies" (worker.js)
Copia questo codice integrale nella dashboard di Cloudflare. Funziona senza bisogno di `npm` o `wrangler`.

```javascript
/* 
  WORKER STANDALONE (worker.js)
  Utilizza fetch() invece del driver Neon per massima compatibilità dashboard.
*/

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
      
      // Funzione helper per query via HTTP (converte postgres:// in https://)
      const queryDb = async (sqlQuery, params = []) => {
        const rawUrl = env.DATABASE_URL.trim();
        const urlObj = new URL(rawUrl.replace('postgresql://', 'http://'));
        const host = urlObj.host;
        const password = urlObj.password;
        const neonHttpUrl = `https://${host}/sql`;

        const response = await fetch(neonHttpUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${password}`
          },
          body: JSON.stringify({ query: sqlQuery, params })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Errore database Neon');
        return result.rows || [];
      };

      // Rotta: Health Check
      if (url.pathname === '/api/db-status') {
        await queryDb('SELECT 1');
        return new Response(JSON.stringify({ status: 'connected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Rotta: Lookup Location
      if (url.pathname === '/api/lookup/location') {
        const q = url.searchParams.get('q');
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5`;
        const res = await fetch(nominatimUrl, { headers: { 'User-Agent': 'WorldRegistrationApp/1.0' } });
        const data = await res.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Rotta: Register
      if (url.pathname === '/api/register' && request.method === 'POST') {
        const body = await request.json();
        
        // Estrazione di tutti i campi dal body
        const { 
          surname, firstName, gender, birthDate, birthPlace, birthCountry,
          citizenship, maritalStatus, residenceAddress, residenceNumber, residenceZip, 
          residenceCity, residenceProvince, residenceCountry, email, phonePrefix, phoneNumber,
          username, password, documentHash, documentType,
          plusCode, locationDescription, latitude, longitude,
          isAmbassador, isPeacekeeper 
        } = body;

        const normalizedUsername = username ? username.toLowerCase().replace(/\s/g, '') : null;

        const sql = `
          INSERT INTO citizens (
            surname, firstName, gender, birth_date, birth_place, birth_country,
            citizenship, marital_status, residence_address, residence_number, residence_zip, 
            residence_city, residence_province, residence_country, email, phone_prefix, phone_number,
            username, password, document_hash, document_type,
            plus_code, location_description, location,
            is_ambassador, is_peacekeeper, status, createdAt
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 
            ST_SetSRID(ST_MakePoint($24, $25), 4326),
            $26, $27, 'pending', NOW()
          )
          RETURNING id
        `;
        
        const params = [
          surname, firstName, gender, birthDate || null, birthPlace, birthCountry,
          citizenship, maritalStatus, residenceAddress, residenceNumber, residenceZip, 
          residenceCity, residenceProvince, residenceCountry, email || null, phonePrefix, phoneNumber,
          normalizedUsername, password, documentHash, documentType,
          plusCode, locationDescription, longitude || 0, latitude || 0,
          !!isAmbassador, !!isPeacekeeper
        ];

        const rows = await queryDb(sql, params);
        return new Response(JSON.stringify({ success: true, id: rows[0].id }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ status: 'error', message: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }
};
```


---

## Deploy tramite Wrangler (Metodo Suggerito)
Se ricevi errori di moduli mancanti nella dashboard, usa questo metodo per caricare il Worker:

1. Crea una cartella locale: `mkdir nws-api && cd nws-api`
2. Inizializza: `npm init -y`
3. Installa driver: `npm install @neondatabase/serverless`
4. Crea `index.js` col codice sopra.
5. Deploy: `npx wrangler deploy index.js --name nws-wk`


**Nota:** Ricordati di eseguire `CREATE EXTENSION IF NOT EXISTS postgis;` nella console SQL di Neon se ricevi errori sulla funzione `ST_MakePoint`.

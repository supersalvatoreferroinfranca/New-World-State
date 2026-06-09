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
  Includendo diagnostica visiva integrata al percorso principale (/)
  per identificare errori di configurazione, connettività ed estensioni spaziali (PostGIS).
*/

import { connect } from 'cloudflare:sockets';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    // 1. Diagnostica Visiva HTML al percorso "/"
    if (url.pathname === '/' || url.pathname === '/index.html') {
      try {
        let dbStatus = {
          envConfigured: !!env.DATABASE_URL,
          maskedUrl: 'Non configurata',
          host: 'N/A',
          httpTest: { ok: false, status: null, message: 'Non avviato' },
          pingTest: { ok: false, time: null, error: null },
          schemaTest: { ok: false, count: null, error: null },
          postGisTest: { ok: false, error: null },
          latestEntries: [],
          emailProvider: env.SMTP_USER ? 'Aruba SMTP' : (env.RESEND_API_KEY ? 'Resend' : (env.BREVO_API_KEY ? 'Brevo' : 'Nessuno')),
          emailApiKeyConfigured: !!(env.SMTP_USER || env.RESEND_API_KEY || env.BREVO_API_KEY),
          adminEmail: env.ADMIN_EMAIL || 'supersalvatoreferroinfranca@gmail.com',
          fromEmail: env.SMTP_FROM || env.SMTP_USER || env.RESEND_FROM_EMAIL || env.BREVO_FROM_EMAIL || 'onboarding@resend.dev',
          arubaConfigured: !!env.ARUBA_UPLOADER_URL,
          arubaUrl: env.ARUBA_UPLOADER_URL || 'Non configurata',
          arubaTest: { ok: false, writeOk: false, readOk: false, message: 'Non avviato o non configurato', url: null, error: null }
        };

        if (env.DATABASE_URL) {
          const rawUrl = env.DATABASE_URL.trim();
          try {
            const parsed = new URL(rawUrl.replace('postgresql://', 'http://'));
            dbStatus.host = parsed.host;
            dbStatus.maskedUrl = `postgresql://${parsed.username}:******@${parsed.host}${parsed.pathname}`;
          } catch(e) {
            dbStatus.maskedUrl = 'Formato URL non valido: ' + e.message;
          }
        }

        const runDiagnostic = async () => {
          if (!dbStatus.envConfigured) return;

          const rawUrl = env.DATABASE_URL.trim();
          const cleanUrl = rawUrl.split('?')[0];
          const urlObj = new URL(rawUrl.replace('postgresql://', 'http://'));
          const neonHttpUrl = `https://${urlObj.host}/sql`;

          // Step 1: Raw DNS & HTTP connection ping
          try {
            const rawRes = await fetch(neonHttpUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: 'SELECT 1' })
            });
            dbStatus.httpTest.status = rawRes.status;
            if (rawRes.status === 400 || rawRes.status === 401 || rawRes.ok) {
              dbStatus.httpTest.ok = true;
              dbStatus.httpTest.message = `Server Neon raggiungibile (Risposta HTTP: ${rawRes.status})`;
            } else {
              dbStatus.httpTest.message = `Risposta inattesa dal gateway HTTP Neon: Codice ${rawRes.status}`;
            }
          } catch (e) {
            dbStatus.httpTest.message = `Impossibile connettersi al server Neon: ${e.message}`;
          }

          // SQL execution helper using neon connection headers
          const executeQuery = async (sqlQuery, params = []) => {
            const response = await fetch(neonHttpUrl, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Neon-Connection-String': cleanUrl
              },
              body: JSON.stringify({ query: sqlQuery, params })
            });
            const result = await response.json();
            if (!response.ok) {
              throw new Error(result.message || JSON.stringify(result));
            }
            return result.rows || [];
          };

          // Step 2: Query Ping (SELECT 1)
          try {
            const pingStart = Date.now();
            await executeQuery('SELECT 1');
            dbStatus.pingTest.ok = true;
            dbStatus.pingTest.time = Date.now() - pingStart;
          } catch (e) {
            dbStatus.pingTest.error = e.message;
          }

          // Step 3: Check Table Schema
          try {
            const rowsCount = await executeQuery('SELECT count(*) as total FROM citizens');
            dbStatus.schemaTest.ok = true;
            dbStatus.schemaTest.count = rowsCount[0]?.total || 0;
          } catch (e) {
            dbStatus.schemaTest.error = e.message;
          }

          // Step 4: Check PostGIS Geography features
          try {
            await executeQuery('SELECT ST_AsText(ST_MakePoint(12.4924, 41.8902))');
            dbStatus.postGisTest.ok = true;
          } catch (e) {
            dbStatus.postGisTest.error = e.message;
          }

          // Step 5: Fetch latest citizens if the table was found
          if (dbStatus.schemaTest.ok) {
            try {
              // Esplora dinamicamente le colonne per evitare eccezioni di case sensitivity
              const colsRes = await executeQuery("SELECT column_name FROM information_schema.columns WHERE table_name = 'citizens'");
              const existingColsDiag = colsRes.map(c => c.column_name.toLowerCase());
              
              const selectFields = ['id'];
              if (existingColsDiag.includes('surname')) selectFields.push('surname');
              
              if (existingColsDiag.includes('firstname')) {
                selectFields.push('"firstname" as "firstName"');
              } else if (existingColsDiag.includes('firstname')) {
                selectFields.push('"firstName" as "firstName"');
              } else {
                selectFields.push('NULL as "firstName"');
              }
              
              let orderByField = 'id';
              if (existingColsDiag.includes('createdat')) {
                selectFields.push('"createdat" as "createdAt"');
                orderByField = '"createdat"';
              } else if (existingColsDiag.includes('createdat')) {
                selectFields.push('"createdAt" as "createdAt"');
                orderByField = '"createdAt"';
              } else {
                selectFields.push('NOW() as "createdAt"');
              }

              const selectQuery = `SELECT ${selectFields.join(', ')} FROM citizens ORDER BY ${orderByField} DESC LIMIT 3`;
              const entries = await executeQuery(selectQuery);
              dbStatus.latestEntries = entries || [];
            } catch (e) {
              // Ignore table content fetch errors
            }
          }

          // Aruba PHP Bridge write & read diagnostics in background status
          if (env.ARUBA_UPLOADER_URL) {
            const uploaderUrl = env.ARUBA_UPLOADER_URL.trim();
            const uploaderKey = env.ARUBA_UPLOADER_KEY ? env.ARUBA_UPLOADER_KEY.trim() : '';
            try {
              const separator = uploaderUrl.includes('?') ? '&' : '?';
              const targetUrlWithKey = `${uploaderUrl}${separator}key=${encodeURIComponent(uploaderKey)}`;

              // 1. Controllo di stato
              const arubaResponse = await fetch(targetUrlWithKey, {
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

              let performWriteTest = false;
              let isOldPhpWithoutStatus = false;

              if (arubaResponse.ok) {
                performWriteTest = true;
              } else {
                const text = await arubaResponse.text();
                try {
                  const parsed = JSON.parse(text);
                  if (arubaResponse.status === 400 && parsed.message && parsed.message.includes('Nessun file decodificato')) {
                    isOldPhpWithoutStatus = true;
                    performWriteTest = true;
                    dbStatus.arubaTest.message = 'Rilevato uploader precedente (Autenticazione OK). Verifico scrittura...';
                  }
                } catch (e) {}

                if (!performWriteTest) {
                  dbStatus.arubaTest.message = `Errore autorizzazione token (HTTP ${arubaResponse.status})`;
                }
              }

              if (performWriteTest) {
                // 2. Test di Scrittura
                const writeResponse = await fetch(targetUrlWithKey, {
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

                if (writeResponse.ok) {
                  const writeData = await writeResponse.json();
                  if (writeData.success && writeData.files && writeData.files.front) {
                    dbStatus.arubaTest.writeOk = true;
                    dbStatus.arubaTest.url = writeData.files.front;
                    
                    // 3. Test di Lettura
                    const readResponse = await fetch(writeData.files.front);
                    if (readResponse.ok) {
                      dbStatus.arubaTest.readOk = true;
                      dbStatus.arubaTest.ok = true;
                      dbStatus.arubaTest.message = isOldPhpWithoutStatus 
                        ? '✓ Connessione, Scrittura e Lettura superate con successo! (Uploader precedente bypassato con successo)'
                        : '✓ Connessione, Scrittura e Lettura superate con successo!';
                    } else {
                      dbStatus.arubaTest.message = `Scrittura OK, ma fallimento del download pubblico (HTTP ${readResponse.status})`;
                    }
                  } else {
                    dbStatus.arubaTest.message = `Errore di scrittura: ${writeData.message || 'Chiave errata o non scrivibile'}`;
                  }
                } else {
                  dbStatus.arubaTest.message = `La scrittura di test ha riportato errore (HTTP ${writeResponse.status})`;
                }
              }
            } catch (err) {
              dbStatus.arubaTest.error = err.message;
              dbStatus.arubaTest.message = `Impossibile comunicare con Aruba: ${err.message}`;
            }
          }
        };

        await runDiagnostic();

        const html = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NWS Worker Diagnostics | Console di Controllo</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet font-sans">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: {
              sans: ['Plus Jakarta Sans', 'sans-serif'],
              mono: ['JetBrains Mono', 'monospace'],
            }
          }
        }
      }
    </script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen py-10 px-4 md:px-8 shadow-inner font-sans">
    <div class="max-w-4xl mx-auto space-y-8">
        
        <!-- Header Brand -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
            <div class="space-y-1">
                <div class="flex items-center gap-3">
                    <span class="flex h-3 w-3 relative">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dbStatus.pingTest.ok ? 'bg-emerald-400' : 'bg-red-400'}"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 ${dbStatus.pingTest.ok ? 'bg-emerald-500' : 'bg-red-500'}"></span>
                    </span>
                    <h1 class="text-xl font-bold text-white tracking-tight">NWS Database Worker (NWS-WK)</h1>
                </div>
                <p class="text-xs text-slate-400">Pannello Diagnostico Live per la Connessione al Database Neon</p>
            </div>
            <div class="flex flex-col text-left md:text-right font-mono text-xs text-slate-500">
                <span>Sticking on edge: Cloudflare Worker</span>
                <span class="text-slate-400 mt-1">${url.origin}</span>
            </div>
        </div>

        <!-- Section 1: Connection details -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            <h2 class="text-md font-semibold text-slate-200 uppercase tracking-widest font-mono text-xs">1. Analisi Stringa Connessione DATABASE_URL</h2>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                    <span class="text-[10px] font-mono uppercase text-slate-500 tracking-wider">DATABASE_URL Registrata</span>
                    <span class="block text-md font-bold mt-1 ${dbStatus.envConfigured ? 'text-emerald-400' : 'text-red-400'}">
                        ${dbStatus.envConfigured ? '✓ Configurato Correttamente' : '✗ Non Configurato'}
                    </span>
                </div>
                <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                    <span class="text-[10px] font-mono uppercase text-slate-500 tracking-wider font-semibold">Database Host</span>
                    <span class="block text-sm font-mono text-slate-300 mt-1 truncate select-all" title="${dbStatus.host}">${dbStatus.host}</span>
                </div>
            </div>

            <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                <span class="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Stringa Mascherata (Sicura)</span>
                <code class="block text-xs text-slate-300 break-all bg-slate-900/40 p-2.5 rounded border border-slate-800/40 font-mono">${dbStatus.maskedUrl}</code>
            </div>

            ${!dbStatus.envConfigured ? `
            <div class="p-4 bg-red-950/30 border border-red-500/20 text-red-300 rounded-2xl text-sm space-y-2">
                <p class="font-bold">⚠️ ATTENZIONE: La variabile DATABASE_URL non è impostata!</p>
                <p>Nelle impostazioni del tuo Worker su Cloudflare Pages / Workers Dashboard, aggiungi la variabile d'ambiente chiamata <code>DATABASE_URL</code> contenente la stringa di connessione che ti è stata fornita da Neon.</p>
            </div>
            ` : ''}
        </div>

        <!-- Section 2: Sequential checks -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            <h2 class="text-md font-semibold text-slate-200 uppercase tracking-widest font-mono text-xs">2. Stato Test di Diagnosi (In Tempo Reale)</h2>

            <div class="space-y-4">
                
                <!-- check 1 -->
                <div class="flex gap-4 p-4 rounded-2xl border bg-slate-950/50 ${dbStatus.httpTest.ok ? 'border-emerald-500/10' : 'border-red-500/10'}">
                    <div class="text-2xl select-none">${dbStatus.httpTest.ok ? '🟢' : '🔴'}</div>
                    <div class="space-y-1 flex-grow">
                        <h3 class="text-sm font-semibold text-white">2.1 Connettività di Rete HTTP</h3>
                        <p class="text-xs text-slate-400">Verifica se i computer Cloudflare riescono a negoziare pacchetti TCP/HTTPS verso il Neon DB Gateway.</p>
                        <div class="bg-slate-950 text-slate-300 text-xs font-mono p-2 rounded border border-slate-850 mt-2">
                            ${dbStatus.httpTest.message}
                        </div>
                    </div>
                </div>

                <!-- check 2 -->
                <div class="flex gap-4 p-4 rounded-2xl border bg-slate-950/50 ${dbStatus.pingTest.ok ? 'border-emerald-500/10' : 'border-red-500/10'}">
                    <div class="text-2xl select-none">${dbStatus.pingTest.ok ? '🟢' : '🔴'}</div>
                    <div class="space-y-1 flex-grow">
                        <h3 class="text-sm font-semibold text-white">2.2 Query Ping (SELECT 1)</h3>
                        <p class="text-xs text-slate-400">Verifica se l'autenticazione ha successo ed esegue transazioni istantanee.</p>
                        ${dbStatus.pingTest.ok ? `
                        <div class="bg-slate-950 text-emerald-400 text-xs font-mono p-2 rounded border border-slate-850 mt-2">
                            OK &bull; Database connesso ed autenticato in ${dbStatus.pingTest.time}ms
                        </div>
                        ` : `
                        <div class="bg-slate-950 text-red-400 text-xs font-mono p-2.5 rounded border border-slate-850 mt-2 whitespace-pre-wrap">
                            Errore: ${dbStatus.pingTest.error}
                        </div>
                        <p class="text-[11px] text-yellow-400 mt-2 leading-relaxed"><strong>Solf:</strong> Se il messaggio indica "SCRAM authentication", controlla la password. Se il server dichiara host unreachable, accertati di stare usando l'URL Neon nativo.</p>
                        `}
                    </div>
                </div>

                <!-- check 3 -->
                <div class="flex gap-4 p-4 rounded-2xl border bg-slate-950/50 ${dbStatus.schemaTest.ok ? 'border-emerald-500/10' : 'border-red-500/10'}">
                    <div class="text-2xl select-none">${dbStatus.schemaTest.ok ? '🟢' : '🔴'}</div>
                    <div class="space-y-1 flex-grow">
                        <h3 class="text-sm font-semibold text-white">2.3 Tabella 'citizens' nel Database</h3>
                        <p class="text-xs text-slate-400">Verifica la presenza della tabella citizens che memorizza l'anagrafica dei registrati.</p>
                        ${dbStatus.schemaTest.ok ? `
                        <div class="bg-slate-950 text-emerald-400 text-xs font-mono p-2 rounded border border-slate-850 mt-2">
                            La tabella esiste ed è correttamente configurata. Totale cittadini presenti: <strong>${dbStatus.schemaTest.count}</strong>
                        </div>
                        ` : `
                        <div class="bg-slate-950 text-red-400 text-xs font-mono p-2.5 rounded border border-slate-850 mt-2 whitespace-pre-wrap">
                            Errore: ${dbStatus.schemaTest.error}
                        </div>
                        <div class="bg-slate-950 border border-slate-850 p-3 rounded text-xs mt-3 text-slate-300">
                            <span class="block font-semibold text-yellow-400 text-xs mb-1.5">&#128161; Tabella assente? Crea lo schema copiando questa query SQL nell'interfaccia Neon:</span>
                            <pre class="bg-slate-900 border border-slate-800 p-2 text-[10px] overflow-auto text-slate-300 font-mono select-all select-none">
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
);</pre>
                        </div>
                        `}
                    </div>
                </div>

                <!-- check 4 -->
                <div class="flex gap-4 p-4 rounded-2xl border bg-slate-950/50 ${dbStatus.postGisTest.ok ? 'border-emerald-500/10' : 'border-red-500/10'}">
                    <div class="text-2xl select-none">${dbStatus.postGisTest.ok ? '🟢' : '🔴'}</div>
                    <div class="space-y-1 flex-grow">
                        <h3 class="text-sm font-semibold text-white">2.4 Estensione Geografica PostGIS</h3>
                        <p class="text-xs text-slate-400">L'estensione PostGIS è vitale per raccogliere e mappare le coordinate di longitudine e latitudine dei cittadini registrati.</p>
                        ${dbStatus.postGisTest.ok ? `
                        <div class="bg-slate-950 text-emerald-400 text-xs font-mono p-2 rounded border border-slate-850 mt-2">
                            OK &bull; PostGIS attivo e regolarmente installato.
                        </div>
                        ` : `
                        <div class="bg-slate-950 text-red-400 text-xs font-mono p-2 rounded border border-slate-850 mt-2 text-rose-300">
                            Errore: ${dbStatus.postGisTest.error}
                        </div>
                        <p class="text-[11px] text-amber-300 mt-2">Per installare PostGIS, esegui questo comando nella pagina SQL Console di Neon: <code class="bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-white font-mono">CREATE EXTENSION IF NOT EXISTS postgis;</code></p>
                        `}
                    </div>
                </div>

                <!-- check 5 -->
                <div class="flex gap-4 p-4 rounded-2xl border bg-slate-950/50 ${dbStatus.emailApiKeyConfigured ? 'border-emerald-500/10' : 'border-yellow-500/10'}">
                    <div class="text-2xl select-none">${dbStatus.emailApiKeyConfigured ? '🟢' : '🟡'}</div>
                    <div class="space-y-1 flex-grow">
                        <h3 class="text-sm font-semibold text-white">2.5 Configurazione Invio Email (Aruba SMTP / Resend / Brevo)</h3>
                        <p class="text-xs text-slate-400 font-sans">Gestisce l'invio automatico delle notifiche email sia al nuovo cittadino che all'amministratore ad ogni registrazione.</p>
                        
                        <div class="bg-slate-950 text-xs font-mono p-3 rounded border border-slate-850 mt-2 space-y-1.5 text-slate-300">
                            <div>Stato Server Email: <strong class="${dbStatus.emailApiKeyConfigured ? 'text-emerald-400' : 'text-yellow-400'}">${dbStatus.emailApiKeyConfigured ? '✓ ATTIVO (' + dbStatus.emailProvider + ')' : '✗ DISATTIVATO (Nessun canale configurato)'}</strong></div>
                            <div>Mittente Outbox: <code class="text-slate-400">${dbStatus.fromEmail}</code></div>
                            <div>Email Amministratore (Admin): <code class="text-slate-400">${dbStatus.adminEmail}</code></div>
                        </div>

                        ${!dbStatus.emailApiKeyConfigured ? `
                        <div class="bg-amber-950/25 border border-amber-500/20 text-amber-300 rounded-xl p-3 text-xs mt-3 space-y-2 font-sans text-left">
                            <span class="block font-semibold">💡 Come abilitare le email automatiche (Aruba SMTP, Resend o Brevo):</span>
                            <p class="text-[11px] text-slate-400 my-0.5">Inserisci le variabili d'ambiente nella Dashboard Cloudflare del tuo Worker:</p>
                            <ul class="list-disc list-inside space-y-1 text-slate-400 text-[11px] mt-1 pl-1">
                                <li><strong>Opzione SMTP Aruba (Consigliata):</strong> Imposta <code>SMTP_USER</code> (la tua email Aruba), <code>SMTP_PASS</code> (la tua password), <code>SMTP_HOST</code> (es. <code>smtps.aruba.it</code>), <code>SMTP_PORT</code> (es. <code>465</code>), <code>SMTP_FROM</code> (mittente, solitamente coincide con SMTP_USER), e <code>SMTP_FROM_NAME</code> (es. <code>Anagrafe New World State</code>).</li>
                                <li><strong>Opzione Resend:</strong> Imposta <code>RESEND_API_KEY</code>, <code>RESEND_FROM_EMAIL</code> e <code>ADMIN_EMAIL</code>.</li>
                            </ul>
                        </div>
                        ` : `
                        <div class="mt-3 flex items-center gap-4">
                            <button onclick="testEmailSend()" class="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-xs transition-all pointer-events-auto cursor-pointer">
                                Invia Email di Test
                            </button>
                            <span id="test-email-status" class="text-xs font-mono text-slate-400 font-medium"></span>
                        </div>
                        <script>
                            async function testEmailSend() {
                                const statusEl = document.getElementById('test-email-status');
                                statusEl.className = 'text-xs font-mono text-cyan-400 animate-pulse';
                                statusEl.textContent = 'Invio in corso...';
                                try {
                                    const res = await fetch('/api/test-email');
                                    const data = await res.json();
                                    if (data.success) {
                                        statusEl.className = 'text-xs font-mono text-emerald-400';
                                        statusEl.textContent = '✓ ' + data.message;
                                    } else {
                                        statusEl.className = 'text-xs font-mono text-red-400';
                                        statusEl.textContent = '✗ Errore: ' + data.message;
                                    }
                                } catch(e) {
                                    statusEl.className = 'text-xs font-mono text-red-500';
                                    statusEl.textContent = '✗ Connessione fallita: ' + e.message;
                                }
                            }
                        </script>
                        `}
                    </div>
                </div>

                <!-- check 6 (Aruba Storage Bridge) -->
                <div class="flex gap-4 p-4 rounded-2xl border bg-slate-950/50 ${dbStatus.arubaTest.ok ? 'border-emerald-500/10' : (dbStatus.arubaConfigured ? 'border-amber-500/10' : 'border-rose-500/10')}">
                    <div class="text-2xl select-none">${dbStatus.arubaTest.ok ? '🟢' : (dbStatus.arubaTest.writeOk ? '🟡' : '🔴')}</div>
                    <div class="space-y-1 flex-grow">
                        <h3 class="text-sm font-semibold text-white">2.6 Archiviazione e Documenti Aruba PHP Bridge</h3>
                        <p class="text-xs text-slate-400">Verifica se il Worker è in grado di autenticarsi, scrivere file base64 dello spazio illimitato sul server fisico Aruba e leggerli pubblicamente.</p>
                        
                        <div class="bg-slate-950 text-xs font-mono p-3 rounded border border-slate-850 mt-2 space-y-1.5 text-slate-300">
                            <div>Stato Configurazione Aruba: <strong class="${dbStatus.arubaConfigured ? 'text-emerald-400' : 'text-rose-400'}">${dbStatus.arubaConfigured ? '✓ Configurato' : '✗ Non Configurato'}</strong></div>
                            <div>URL del Bridge Aruba: <code class="text-slate-450">${dbStatus.arubaUrl}</code></div>
                            <div>Dettagli Test in Tempo Reale: <span class="text-slate-400 font-sans">${dbStatus.arubaTest.message}</span></div>
                            
                            ${dbStatus.arubaTest.url ? `
                            <div class="mt-2 text-[10px]">
                                <span class="text-slate-500 uppercase tracking-widest block mb-1">File Scritto & Letto con Successo:</span>
                                <a href="${dbStatus.arubaTest.url}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline break-all inline-flex items-center gap-1 font-mono">
                                    ${dbStatus.arubaTest.url} &rarr;
                                </a>
                            </div>
                            ` : ''}
                        </div>

                        ${!dbStatus.arubaConfigured ? `
                        <div class="bg-amber-950/25 border border-amber-500/20 text-amber-300 rounded-xl p-3 text-xs mt-3 space-y-2 font-sans text-left">
                            <span class="block font-semibold">💡 Come abilitare lo spazio di archiviazione Aruba illimitato:</span>
                            <p class="text-[11px] text-slate-400 my-0.5">La tua webapp permette di archiviare i documenti caricati in sicurezza nell'hosting Aruba tramite un bridge PHP.</p>
                            <ol class="list-decimal list-inside space-y-1 text-slate-405 text-[11px] pl-1 font-mono">
                                <li>Carica il file <code>nws-uploader.php</code> sul tuo hosting Aruba tramite FTP.</li>
                                <li>Nelle impostazioni di Cloudflare del tuo Worker, aggiungi i parametri:</li>
                                <ul class="list-disc list-inside pl-4 text-slate-400 text-[10px] space-y-0.5 font-sans">
                                    <li><code>ARUBA_UPLOADER_URL</code> = L'URL pubblico di quel file PHP</li>
                                    <li><code>ARUBA_UPLOADER_KEY</code> = La password segreta definita nel file PHP</li>
                                </ul>
                            </ol>
                        </div>
                        ` : `
                        <div class="mt-3 flex items-center gap-4">
                            <button onclick="testArubaRW()" class="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-xs transition-all pointer-events-auto cursor-pointer">
                                Esegui Test Scrittura/Lettura Aruba
                            </button>
                            <span id="test-aruba-status" class="text-xs font-mono text-slate-455 font-medium"></span>
                        </div>
                        <script>
                            async function testArubaRW() {
                                const statusEl = document.getElementById('test-aruba-status');
                                statusEl.className = 'text-xs font-mono text-cyan-400 animate-pulse';
                                statusEl.textContent = 'Test in corso (Scrittura -> Lettura)...';
                                try {
                                    const res = await fetch('/api/test-aruba');
                                    const data = await res.json();
                                    if (data.success) {
                                        statusEl.className = 'text-xs font-mono text-emerald-400 leading-relaxed';
                                        statusEl.innerHTML = '✓ ' + data.message + '<br/><span class="text-[10px] text-slate-500">File scritto su Aruba e letto con successo.</span>';
                                    } else {
                                        statusEl.className = 'text-xs font-mono text-red-400 leading-relaxed';
                                        let details = data.details || "";
                                        if (data.statusCheck && !data.statusCheck.ok) {
                                            details = "Impossibile contattare il bridge: " + data.statusCheck.error;
                                        } else if (data.writeTest && !data.writeTest.ok) {
                                            details = "Scrittura fallita: " + data.writeTest.error;
                                        } else if (data.readTest && !data.readTest.ok) {
                                            details = "Scrittura OK, ma Lettura fallita: " + data.readTest.error;
                                        }
                                        statusEl.textContent = '✗ Errore: ' + data.message + ' (' + details + ')';
                                    }
                                } catch(e) {
                                    statusEl.className = 'text-xs font-mono text-red-500';
                                    statusEl.textContent = '✗ Connessione fallita: ' + e.message;
                                }
                            }
                        </script>
                        `}
                    </div>
                </div>

            </div>
        </div>

        <!-- Section 3: Live database rows info -->
        ${dbStatus.latestEntries.length > 0 ? `
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
            <h2 class="text-md font-semibold text-slate-200 uppercase tracking-widest font-mono text-xs">3. Ultime Registrazioni Live nel Database</h2>
            <div class="overflow-x-auto rounded-xl border border-slate-800">
                <table class="w-full text-left text-xs bg-slate-950 font-mono text-slate-300 divide-y divide-slate-850">
                    <thead class="bg-slate-900/80 text-slate-400 font-semibold uppercase">
                        <tr>
                            <th class="p-3">ID</th>
                            <th class="p-3">Nominativo</th>
                            <th class="p-3">Data Registrazione</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-850">
                        ${dbStatus.latestEntries.map(e => `
                        <tr class="hover:bg-slate-900/40">
                            <td class="p-3 text-slate-400 font-bold">#${e.id}</td>
                            <td class="p-3 text-white font-sans">${e.surname || '-'} ${e['firstName'] || '-'}</td>
                            <td class="p-3 text-[10px] text-slate-500">${e['createdAt'] ? new Date(e['createdAt']).toLocaleString('it-IT') : '-'}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}

        <!-- Documentation Endpoint links -->
        <div class="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-xs text-slate-400 font-mono space-y-1">
            <span class="block text-slate-300 font-sans font-semibold mb-2">Endpoint API esposti e attivi:</span>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                <div><span class="text-emerald-500 font-semibold">GET</span> /api/db-status (Ping automatico JSON)</div>
                <div><span class="text-indigo-400 font-semibold">GET</span> /api/lookup/location?q=... (Nominatim Proxy)</div>
                <div><span class="text-sky-500 font-semibold">POST</span> /api/register (Registrazione cittadini)</div>
                <div><span class="text-pink-400 font-semibold">GET</span> /api/test-email (Invio email di test)</div>
                <div><span class="text-amber-500 font-semibold">GET</span> /api/admin/citizens (Lista cittadini iscritti)</div>
                <div><span class="text-amber-500 font-semibold">POST</span> /api/admin/approve (Approvazione con ID Card)</div>
                <div><span class="text-amber-500 font-semibold">POST</span> /api/admin/reject (Rifiuto con motivazione)</div>
            </div>
        </div>

    </div>
</body>
</html>
        `;

        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            ...corsHeaders
          }
        });
      } catch (globalErr) {
        return new Response(`Errore diagnostica integrato: ${globalErr.message}`, { status: 500, headers: corsHeaders });
      }
    }

    try {
      if (!env.DATABASE_URL) throw new Error('DATABASE_URL non configurata');
      
      // Funzione helper per query via HTTP
      const queryDb = async (sqlQuery, params = []) => {
        const rawUrl = env.DATABASE_URL.trim();
        // Rimuoviamo parametri extra che possono disturbare l'header HTTP di Neon
        const cleanUrl = rawUrl.split('?')[0];
        const urlObj = new URL(rawUrl.replace('postgresql://', 'http://'));
        const neonHttpUrl = `https://${urlObj.host}/sql`;

        const response = await fetch(neonHttpUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Neon-Connection-String': cleanUrl
          },
          body: JSON.stringify({ query: sqlQuery, params })
        });
        
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || JSON.stringify(result));
        }
        return result.rows || [];
      };

      // Funzione helper per arricchire i dati dei cittadini con gli URL fisici autoguariti di Aruba se mancanti
      const getCitizenWithArubaUrls = (cit) => {
        if (!cit) return cit;
        
        const front = cit.arubaFrontUrl || cit.arubafronturl;
        const back = cit.arubaBackUrl || cit.arubabackurl;
        const photo = cit.arubaPhotoUrl || cit.arubaphotourl;
        
        let arubaBase = 'https://www.newworldstate.org/';
        if (env.ARUBA_UPLOADER_URL) {
          const cleanUrl = env.ARUBA_UPLOADER_URL.replace(/nws-uploader\.php.*/, '').replace(/uploader\.php.*/, '');
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
        const arubaPhotoUrl = photo || `${arubaBase}documents/${citizenId}/foto.png`;

        return {
          ...cit,
          arubaFrontUrl,
          arubaBackUrl,
          arubaPhotoUrl,
          arubafronturl: arubaFrontUrl,
          arubabackurl: arubaBackUrl,
          arubaphotourl: arubaPhotoUrl
        };
      };

      // Funzione helper per leggere una risposta SMTP completa in tempo reale riga per riga su Cloudflare Workers
      const readSMTPResponse = async (reader, accumulated = '') => {
        const decoder = new TextDecoder();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout durante la lettura della risposta dal server SMTP di Aruba (10s)')), 10000));
        
        const readPromise = (async () => {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
            const lines = accumulated.split('\r\n');
            const lastLineIndex = accumulated.endsWith('\r\n') ? lines.length - 2 : lines.length - 1;
            if (lastLineIndex >= 0) {
              const lastLine = lines[lastLineIndex];
              if (/^\d{3} /.test(lastLine)) {
                return { text: accumulated, lastLine, code: parseInt(lastLine.substring(0, 3), 10) };
              }
            }
          }
          throw new Error('Socket SMTP chiuso prematuramente o timeout dell\'infrastruttura di Aruba.');
        })();

        return await Promise.race([readPromise, timeoutPromise]);
      };

      // Funzione helper per comunicare pacchetti di controllo con il server SMTP
      const sendSMTPCommand = async (writer, reader, cmd) => {
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(cmd));
        return await readSMTPResponse(reader);
      };

      // Spedizione dei dati tramite connessione socket protetta nativa (cloudflare:sockets)
      const sendSmtpSocketEmail = async (to, subject, html, env, pdfAttachment = null) => {
        const host = env.SMTP_HOST || 'smtps.aruba.it';
        const port = parseInt(env.SMTP_PORT || '465', 10);
        const user = env.SMTP_USER;
        const pass = env.SMTP_PASS;
        const from = env.SMTP_FROM || user;
        const fromName = env.SMTP_FROM_NAME || 'Anagrafe New World State';

        console.log(`[SMTP-SOCKET] Negoziazione con ${host}:${port} tramite cloudflare:sockets (SSL/TLS)...`);
        
        let socket;
        try {
          socket = connect({ hostname: host, port }, { secureTransport: 'on' });
        } catch (connErr) {
          console.error('[SMTP-SOCKET] Impossibile stabilire una connessione TCP protetta:', connErr);
          throw connErr;
        }

        const writer = socket.writable.getWriter();
        const reader = socket.readable.getReader();
        const encoder = new TextEncoder();

        try {
          // 1. Lettura Banner Principale (220)
          let res = await readSMTPResponse(reader);
          console.log('[SMTP-SOCKET] Banner di Benvenuto Ricevuto:', res.text.trim());
          if (res.code !== 220) throw new Error(`Codice di benvenuto non valido: ${res.text}`);

          // 2. Comunicazione HELO/EHLO
          res = await sendSMTPCommand(writer, reader, `EHLO nws-wk.workers.dev\r\n`);
          if (res.code !== 250) throw new Error(`EHLO Negato: ${res.text}`);

          // 3. Avvio Autenticazione (AUTH LOGIN)
          res = await sendSMTPCommand(writer, reader, `AUTH LOGIN\r\n`);
          if (res.code !== 334) throw new Error(`AUTH LOGIN non supportato o fallito: ${res.text}`);

          // 4. Invio Username Base64
          res = await sendSMTPCommand(writer, reader, `${btoa(user)}\r\n`);
          if (res.code !== 334) throw new Error(`Username rifiutato: ${res.text}`);

          // 5. Invio Password Base64
          res = await sendSMTPCommand(writer, reader, `${btoa(pass)}\r\n`);
          if (res.code !== 235) throw new Error(`Credenziali errate su Aruba SMTP (Autenticazione Fallita): ${res.text}`);

          // 6. Configurazione Mittente (MAIL FROM)
          res = await sendSMTPCommand(writer, reader, `MAIL FROM:<${from}>\r\n`);
          if (res.code !== 250) throw new Error(`Mittente rifiutato dal server Aruba: ${res.text}`);

          // 7. Configurazione Destinatario (RCPT TO)
          res = await sendSMTPCommand(writer, reader, `RCPT TO:<${to}>\r\n`);
          if (res.code !== 250) throw new Error(`Destinatario rifiutato dal server Aruba: ${res.text}`);

          // 8. Apertura Canale Dati (DATA)
          res = await sendSMTPCommand(writer, reader, `DATA\r\n`);
          if (res.code !== 354) throw new Error(`Inizio trasmissione dati rifiutato: ${res.text}`);

          // 9. Scrittura Intestazione Email RFC-compliant con codifica UTF-8 del Soggetto
          const dateStr = new Date().toUTCString();
          const base64Subject = btoa(unescape(encodeURIComponent(subject)));
          const utf8Subject = `=?UTF-8?B?${base64Subject}?=`;

          let headers = '';
          let body = '';

          if (pdfAttachment) {
            const boundary = `----=_Part_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
            headers = 
              `From: "${fromName}" <${from}>\r\n` +
              `To: <${to}>\r\n` +
              `Subject: ${utf8Subject}\r\n` +
              `Date: ${dateStr}\r\n` +
              `MIME-Version: 1.0\r\n` +
              `Content-Type: multipart/mixed; boundary="${boundary}"\r\n` +
              `Message-ID: <${Date.now()}-${user.split('@')[0]}@newworldstate.cloud>\r\n\r\n`;

            body = 
              `This is a multi-part message in MIME format.\r\n\r\n` +
              `--${boundary}\r\n` +
              `Content-Type: text/html; charset=utf-8\r\n` +
              `Content-Transfer-Encoding: 7bit\r\n\r\n` +
              html + `\r\n\r\n` +
              `--${boundary}\r\n` +
              `Content-Type: application/pdf; name="${pdfAttachment.filename}"\r\n` +
              `Content-Transfer-Encoding: base64\r\n` +
              `Content-Disposition: attachment; filename="${pdfAttachment.filename}"\r\n\r\n` +
              pdfAttachment.content + `\r\n\r\n` +
              `--${boundary}--\r\n.\r\n`;
          } else {
            headers = 
              `From: "${fromName}" <${from}>\r\n` +
              `To: <${to}>\r\n` +
              `Subject: ${utf8Subject}\r\n` +
              `Date: ${dateStr}\r\n` +
              `MIME-Version: 1.0\r\n` +
              `Content-Type: text/html; charset=utf-8\r\n` +
              `Content-Transfer-Encoding: 7bit\r\n` +
              `Message-ID: <${Date.now()}-${user.split('@')[0]}@newworldstate.cloud>\r\n\r\n`;

            body = html.replace(/\r?\n/g, '\r\n') + '\r\n.\r\n';
          }

          await writer.write(encoder.encode(headers + body));
          res = await readSMTPResponse(reader);
          if (res.code !== 250) throw new Error(`Errore durante l'invio fisico dei dati: ${res.text}`);

          // 10. Chiusura Connessione (QUIT)
          await writer.write(encoder.encode(`QUIT\r\n`));
          console.log(`[SMTP-SOCKET] Email recapitata correttamente a ${to}`);
          return true;
        } catch (err) {
          console.error('[SMTP-SOCKET] Errore di connessione o transazione:', err.message);
          throw err;
        } finally {
          try {
            writer.releaseLock();
            reader.releaseLock();
            await socket.close();
          } catch (_) {}
        }
      };

      // Funzione per generare un PDF della carta di identità in puro JavaScript (standards-compliant)
      const generateCitizenPdf = (citizen) => {
        const citizenCode = citizen.citizenCode || citizen.citizencode || 'N/A';
        const firstName = citizen.firstName || citizen.firstname || '';
        const surname = citizen.surname || '';
        const birthDate = citizen.birthDate || citizen.birthdate || 'N/A';
        const birthPlace = citizen.birthPlace || citizen.birthplace || '';
        const birthCountry = citizen.birthCountry || citizen.birthcountry || '';
        const docHash = (citizen.documentHash || citizen.documenthash || 'VALIDATED').toUpperCase();
        
        // Escape special PDF characters: paren `(`, `)` and backslash `\`
        const esc = (str) => {
          if (!str) return '';
          return str.toString()
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');
        };

        const escFirstName = esc(firstName).toUpperCase();
        const escSurname = esc(surname).toUpperCase();
        const escBirthPlace = esc(birthPlace).toUpperCase();
        const escBirthCountry = esc(birthCountry).toUpperCase();
        const escBirthDate = esc(birthDate);
        const escCitizenCode = esc(citizenCode).toUpperCase();
        const escDocHash = esc(docHash).toUpperCase();

        const todayStr = new Date().toISOString().split('T')[0];

        // Let's create a beautiful document using PDF drawing primitives!
        let streamContent = '';

        // Page background: Soft beige/white (#FAF9F6)
        streamContent += '0.98 0.98 0.96 rg\n';
        streamContent += '0 0 595.275 841.89 re f\n';

        // Outer margin border (Gold)
        streamContent += '0.77 0.66 0.50 RG\n';
        streamContent += '1.5 w\n';
        streamContent += '25 25 545.275 791.89 re s\n';

        // Elegant top header bar (Dark Navy Blue #0A1C3E)
        streamContent += '0.04 0.11 0.24 rg\n';
        streamContent += '35 725 525 80 re f\n';

        // Thin Gold accent bar
        streamContent += '0.77 0.66 0.50 rg\n';
        streamContent += '35 720 525 5 re f\n';

        // Header Title (Gold)
        streamContent += 'BT\n';
        streamContent += '/F1 18 Tf\n';
        streamContent += '0.77 0.66 0.50 rg\n';
        streamContent += '55 765 Td\n';
        streamContent += '(NEW WORLD STATE) Tj\n';
        streamContent += 'ET\n';

        // Header Subtitle (White)
        streamContent += 'BT\n';
        streamContent += '/F2 9.5 Tf\n';
        streamContent += '1.0 1.0 1.0 rg\n';
        streamContent += '55 745 Td\n';
        streamContent += '(SOVEREIGN GLOBAL ADMINISTRATION OF CITIZENSHIP) Tj\n';
        streamContent += 'ET\n';

        // "OFFICIAL CERTIFICATE" Text (Gold)
        streamContent += 'BT\n';
        streamContent += '/F1 11 Tf\n';
        streamContent += '0.77 0.66 0.50 rg\n';
        streamContent += '440 762 Td\n';
        streamContent += '(CERTIFICATE) Tj\n';
        streamContent += 'ET\n';

        // Subtitle Certificate
        streamContent += 'BT\n';
        streamContent += '/F2 7.5 Tf\n';
        streamContent += '0.9 0.9 0.9 rg\n';
        streamContent += '440 748 Td\n';
        streamContent += '(No. ' + escCitizenCode + ') Tj\n';
        streamContent += 'ET\n';

        // Title of Certificate
        streamContent += 'BT\n';
        streamContent += '/F1 15 Tf\n';
        streamContent += '0.04 0.11 0.24 rg\n';
        streamContent += '35 680 Td\n';
        streamContent += '(DECRETO FEDERALE DI CONCESSIONE DELLA CITTADINANZA) Tj\n';
        streamContent += 'ET\n';

        // Introduction text (using standard fonts)
        const introLines = [
          'Visto l\\\'articolo 1 della Costituzione Sovrana del New World State, inerente i diritti e',
          'doveri dei cittadini del mondo e l\\\'unificazione pacifica dei popoli sovrani;',
          'Esaminate le credenziali anagrafiche, di nascita e di identita presentate dal richiedente;',
          'Accertata la piena conformita dei requisiti formali richiesti dall\\\'Anagrafe Centrale;',
          'Il Comitato dei Validatori Federati decreta e riconosce solennemente lo status di:'
        ];

        let introY = 650;
        for (const line of introLines) {
          streamContent += 'BT\n';
          streamContent += '/F2 9.5 Tf\n';
          streamContent += '0.2 0.25 0.3 rg\n';
          streamContent += `35 ${introY} Td\n`;
          streamContent += `(${line}) Tj\n`;
          streamContent += 'ET\n';
          introY -= 14;
        }

        // VISUAL ID CARD (in the middle)
        // Card Background (pure white)
        streamContent += '1.0 1.0 1.0 rg\n';
        streamContent += '0.04 0.11 0.24 RG\n'; // Navy Blue Border
        streamContent += '1.5 w\n';
        streamContent += '35 295 525 210 re f s\n'; // Draw the visual card container (Height 210, width 525)

        // Visual Card Header (Navy Blue Accent Box)
        streamContent += '0.04 0.11 0.24 rg\n';
        streamContent += '35 470 525 35 re f\n';

        // Gold divider inside card
        streamContent += '0.77 0.66 0.50 rg\n';
        streamContent += '35 466 525 4 re f\n';

        // Card Title Text
        streamContent += 'BT\n';
        streamContent += '/F1 10.5 Tf\n';
        streamContent += '0.77 0.66 0.50 rg\n';
        streamContent += '50 482 Td\n';
        streamContent += '(NEW WORLD STATE  *  UNIVERSAL IDENTITY CARD) Tj\n';
        streamContent += 'ET\n';

        streamContent += 'BT\n';
        streamContent += '/F1 10.5 Tf\n';
        streamContent += '1.0 1.0 1.0 rg\n';
        streamContent += '440 482 Td\n';
        streamContent += '(CITTADINO) Tj\n';
        streamContent += 'ET\n';

        // Card fields helpers
        const addCardField = (label, value, x, y) => {
          let out = '';
          // Label text
          out += 'BT\n';
          out += '/F2 7.5 Tf\n';
          out += '0.45 0.5 0.55 rg\n'; // soft grey/blue
          out += `${x} ${y} Td\n`;
          out += `(${label}) Tj\n`;
          out += 'ET\n';
          // Value text
          out += 'BT\n';
          out += '/F1 11 Tf\n';
          out += '0.04 0.11 0.24 rg\n'; // Navy blue
          out += `${x} ${y - 12} Td\n`;
          out += `(${value}) Tj\n`;
          out += 'ET\n';
          return out;
        };

        // Populate fields
        streamContent += addCardField('COGNOME / SURNAME', escSurname, 55, 442);
        streamContent += addCardField('NOME / GIVEN NAMES', escFirstName, 55, 404);
        streamContent += addCardField('DATA E LUOGO DI NASCITA / DATE & PLACE OF BIRTH', `${escBirthDate} - ${escBirthPlace} (${escBirthCountry})`, 55, 366);
        streamContent += addCardField('STATUTO DI CITTADINANZA / NATIONALITY STATUS', 'NEW WORLD STATE SOVEREIGN ● GLOBAL INDEPENDENT', 55, 328);

        // Photo Border Frame representing the placeholder
        streamContent += '0.77 0.66 0.50 RG\n'; // Gold border for photo
        streamContent += '1.5 w\n';
        streamContent += '445 330 90 115 re s\n'; // photo rect

        // NWS elegant watermark inside the photo frame
        streamContent += 'BT\n';
        streamContent += '/F1 9 Tf\n';
        streamContent += '0.04 0.11 0.24 rg\n';
        streamContent += '468 385 Td\n';
        streamContent += '(NWS) Tj\n';
        streamContent += 'ET\n';

        streamContent += 'BT\n';
        streamContent += '/F2 7 Tf\n';
        streamContent += '0.5 0.5 0.5 rg\n';
        streamContent += '458 373 Td\n';
        streamContent += '(DOCUMENTO) Tj\n';
        streamContent += 'ET\n';

        streamContent += 'BT\n';
        streamContent += '/F2 7 Tf\n';
        streamContent += '0.5 0.5 0.5 rg\n';
        streamContent += '463 361 Td\n';
        streamContent += '(VALIDATO) Tj\n';
        streamContent += 'ET\n';

        // Footer block of the Visual Card
        streamContent += 'BT\n';
        streamContent += '/F2 7 Tf\n';
        streamContent += '0.45 0.5 0.55 rg\n';
        streamContent += '55 304 Td\n';
        streamContent += '(CODICE CITTADINO / CITIZEN CODE:) Tj\n';
        streamContent += 'ET\n';

        streamContent += 'BT\n';
        streamContent += '/F1 8.5 Tf\n';
        streamContent += '0.77 0.66 0.50 rg\n';
        streamContent += '195 304 Td\n';
        streamContent += '(' + escCitizenCode + ') Tj\n';
        streamContent += 'ET\n';

        streamContent += 'BT\n';
        streamContent += '/F2 6.5 Tf\n';
        streamContent += '0.45 0.5 0.55 rg\n';
        streamContent += '310 304 Td\n';
        streamContent += '(* VERIFIED BY BLOCKCHAIN HASH: ' + escDocHash.slice(0, 20) + '...) Tj\n';
        streamContent += 'ET\n';

        // Let's add certificate explanation block below card
        const bottomTextLines = [
          'La concessione dello status sovraindicato conferisce al titolare la facolta di avvalersi',
          'delle prerogative federate del New World State, dei servizi amministrativi correlati e dei',
          'diritti inerenti la Libera Circolazione e Autodeterminazione riconosciuta dalle Nazioni Unite.',
          'La presente carta, firmata digitalmente, costituisce titolo provvisorio ed idoneo.'
        ];

        let bottomY = 265;
        for (const line of bottomTextLines) {
          streamContent += 'BT\n';
          streamContent += '/F2 9.2 Tf\n';
          streamContent += '0.3 0.35 0.4 rg\n';
          streamContent += `35 ${bottomY} Td\n`;
          streamContent += `(${line}) Tj\n`;
          streamContent += 'ET\n';
          bottomY -= 13;
        }

        // Signature section (Bottom part of A4 sheet)
        streamContent += '0.77 0.66 0.50 RG\n'; // gold divider line
        streamContent += '1 w\n';
        streamContent += '35 190 525 0.5 re s\n';

        // Left signature: Date of issue and validation
        streamContent += 'BT\n';
        streamContent += '/F2 7.5 Tf\n';
        streamContent += '0.4 0.4 0.4 rg\n';
        streamContent += '55 174 Td\n';
        streamContent += '(DATA DI EMISSIONE & VALIDAZIONE / DATE OF ISSUE) Tj\n';
        streamContent += 'ET\n';

        streamContent += 'BT\n';
        streamContent += '/F1 10.5 Tf\n';
        streamContent += '0.04 0.11 0.24 rg\n';
        streamContent += `55 158 Td\n`;
        streamContent += `(${todayStr}) Tj\n`;
        streamContent += 'ET\n';

        // Right signature: Official Federated Authority
        streamContent += 'BT\n';
        streamContent += '/F2 7.5 Tf\n';
        streamContent += '0.4 0.4 0.4 rg\n';
        streamContent += '365 174 Td\n';
        streamContent += '(AUTORITA DI FIRMA / FEDERATED SIGNATORY AUTHORITY) Tj\n';
        streamContent += 'ET\n';

        streamContent += 'BT\n';
        streamContent += '/F1 11 Tf\n';
        streamContent += '0.77 0.66 0.50 rg\n';
        streamContent += '365 158 Td\n';
        streamContent += '(New World State Sovereign Administration) Tj\n';
        streamContent += 'ET\n';

        streamContent += 'BT\n';
        streamContent += '/F2 6.5 Tf\n';
        streamContent += '0.5 0.5 0.6 rg\n';
        streamContent += '365 146 Td\n';
        streamContent += `(NWS REGISTRY HASH: ${escDocHash}) Tj\n`;
        streamContent += 'ET\n';

        // Universal Motto centered
        streamContent += 'BT\n';
        streamContent += '/F1 9 Tf\n';
        streamContent += '0.77 0.66 0.50 rg\n';
        streamContent += '200 95 Td\n';
        streamContent += '("UNITI NELLO SPAZIO, LEGATI PER DIRITTO") Tj\n';
        streamContent += 'ET\n';

        // Construct Catalog, Pages, Page, Resources, Content, Fonts objects
        const objects = [];
        objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
        objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
        objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 595.275 841.89] /Contents 5 0 R >>\nendobj');
        objects.push('4 0 obj\n<< /Font << /F1 6 0 R /F2 7 0 R >> >>\nendobj');
        
        const streamLength = streamContent.length;
        objects.push(`5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`);
        objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');
        objects.push('7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

        let rawPdf = '%PDF-1.4\n%âãÏÓ\n';
        const offsets = [];
        for (let i = 0; i < objects.length; i++) {
          offsets.push(rawPdf.length);
          rawPdf += objects[i] + '\n';
        }
        const startXref = rawPdf.length;
        rawPdf += 'xref\n';
        rawPdf += `0 ${objects.length + 1}\n`;
        rawPdf += '0000000000 65535 f \n';
        for (let i = 0; i < offsets.length; i++) {
          rawPdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
        }
        rawPdf += 'trailer\n';
        rawPdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
        rawPdf += 'startxref\n';
        rawPdf += `${startXref}\n`;
        rawPdf += '%%EOF';

        // Safe conversion of binary string to Base64
        const binaryToBase64 = (str) => {
          let b64 = '';
          try {
            b64 = btoa(str);
          } catch (err) {
            const bytes = new TextEncoder().encode(str);
            let bin = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              bin += String.fromCharCode(bytes[i]);
            }
            b64 = btoa(bin);
          }
          return b64;
        };

        const sanitizedSurname = surname.replace(/[^a-zA-Z]/g, '');
        return {
          filename: `NWS_Certificato_Cittadinanza_${sanitizedSurname}.pdf`,
          content: binaryToBase64(rawPdf)
        };
      };

      // Funzione helper per l'invio delle email (SMTP Aruba / Resend / Brevo)
      const sendEmail = async (to, subject, html, env, pdfAttachment = null) => {
        const fromEmail = env.SMTP_FROM || env.SMTP_USER || env.RESEND_FROM_EMAIL || env.BREVO_FROM_EMAIL || "onboarding@resend.dev";
        const adminEmail = env.ADMIN_EMAIL || "supersalvatoreferroinfranca@gmail.com";
        
        console.log(`[EMAIL] Tentativo di invio a: ${to} (Oggetto: "${subject}")`);

        // 0. Autodetect SMTP: Se configurato Aruba, proviamo sempre come prima opzione
        if (env.SMTP_USER && env.SMTP_PASS) {
          try {
            const success = await sendSmtpSocketEmail(to, subject, html, env, pdfAttachment);
            if (success) return true;
          } catch (smtpErr) {
            console.error('[EMAIL] Errore riscontrato con SMTP Direct Aruba. Proverò API alternative se presenti.', smtpErr);
          }
        }
        
        // 1. Resend API
        if (env.RESEND_API_KEY) {
          try {
            const resendPayload = {
              from: `New World State <${fromEmail}>`,
              to: Array.isArray(to) ? to : [to],
              subject: subject,
              html: html
            };
            if (pdfAttachment) {
              resendPayload.attachments = [
                {
                  content: pdfAttachment.content,
                  filename: pdfAttachment.filename
                }
              ];
            }

            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY.trim()}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(resendPayload)
            });
            const resultMsg = await response.text();
            console.log(`[EMAIL] Risposta Resend: [${response.status}] ${resultMsg}`);
            return response.ok;
          } catch (e) {
            console.error('[EMAIL] Errore di invio tramite Resend:', e);
          }
        }
        
        // 2. Brevo API
        if (env.BREVO_API_KEY) {
          try {
            const brevoPayload = {
              sender: { name: "New World State", email: fromEmail.includes('@') ? fromEmail : "onboarding@newworldstate.cloud" },
              to: (Array.isArray(to) ? to : [to]).map(addr => ({ email: addr })),
              subject: subject,
              htmlContent: html
            };
            if (pdfAttachment) {
              brevoPayload.attachment = [
                {
                  content: pdfAttachment.content,
                  name: pdfAttachment.filename
                }
              ];
            }

            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
              method: 'POST',
              headers: {
                'api-key': env.BREVO_API_KEY.trim(),
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(brevoPayload)
            });
            const resultMsg = await response.text();
            console.log(`[EMAIL] Risposta Brevo: [${response.status}] ${resultMsg}`);
            return response.ok;
          } catch (e) {
            console.error('[EMAIL] Errore di invio tramite Brevo:', e);
          }
        }
        
        console.warn('[EMAIL] Configura SMTP_USER/SMTP_PASS, RESEND_API_KEY o BREVO_API_KEY nella dashboard di Cloudflare.');
        return false;
      };

      // Rotta: Health Check
      if (url.pathname === '/api/db-status') {
        await queryDb('SELECT 1');
        return new Response(JSON.stringify({ status: 'connected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Rotta: Test Email Send
      if (url.pathname === '/api/test-email') {
        const adminEmail = env.ADMIN_EMAIL || "supersalvatoreferroinfranca@gmail.com";
        const isSmtp = !!env.SMTP_USER;
        const isResend = !!env.RESEND_API_KEY;
        const isBrevo = !!env.BREVO_API_KEY;
        
        if (!isSmtp && !isResend && !isBrevo) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Nessun servizio email configurato nel Cloudflare Worker. Imposta i parametri SMTP o inserisci una chiave API per Resend/Brevo.' 
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        const testHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; line-height: 1.6;">
            <h1 style="color: #0a1c3e; font-size: 20px; margin-top: 0;">Test Invio Email New World State</h1>
            <p>Questo è un messaggio di test per verificare che il server di invio email inserito funzioni correttamente.</p>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 13px; margin: 15px 0;">
              <strong style="display: block; margin-bottom: 5px; color: #0a1c3e;">Configurazione Rilevata sul Cloudflare Edge:</strong>
              <ul style="margin: 0; padding-left: 20px; color: #475569;">
                <li><strong>Canale Principale:</strong> ${isSmtp ? 'SMTP Aruba Direct' : (isResend ? 'Resend' : 'Brevo')}</li>
                <li><strong>Email Mittente:</strong> ${env.SMTP_FROM || env.SMTP_USER || env.RESEND_FROM_EMAIL || env.BREVO_FROM_EMAIL || 'onboarding@resend.dev'}</li>
                <li><strong>Destinatario Amministratore:</strong> ${adminEmail}</li>
              </ul>
            </div>
            <p style="color: #16a34a; font-weight: bold; margin-bottom: 0;">Se vedi questa email, la configurazione è corretta ed operativa!</p>
          </div>
        `;
        
        const ok = await sendEmail(adminEmail, "Test Invio Email - New World State Status", testHtml, env);
        if (ok) {
          const activeChannel = isSmtp ? 'SMTP Aruba Direct' : (isResend ? 'Resend' : 'Brevo');
          return new Response(JSON.stringify({ 
            success: true, 
            message: `Email di test recapitata correttamente a ${adminEmail} via ${activeChannel}!` 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } else {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Il server ha avviato l\'invio dell\'email ma ha riscontrato un errore nel canale. Controlla il log di Cloudflare per i dettagli.' 
          }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      // Rotta: Test Aruba PHP Bridge
      if (url.pathname === '/api/test-aruba') {
        const uploaderUrl = env.ARUBA_UPLOADER_URL ? env.ARUBA_UPLOADER_URL.trim() : '';
        const uploaderKey = env.ARUBA_UPLOADER_KEY ? env.ARUBA_UPLOADER_KEY.trim() : '';

        if (!uploaderUrl) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'La variabile d\'ambiente ARUBA_UPLOADER_URL non è impostata sul tuo Worker Cloudflare.' 
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        try {
          const separator = uploaderUrl.includes('?') ? '&' : '?';
          const targetUrlWithKey = `${uploaderUrl}${separator}key=${encodeURIComponent(uploaderKey)}`;

          // 1. Controllo Stato / Connettività del Bridge
          const arubaResponse = await fetch(targetUrlWithKey, {
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

          let statusData = { success: true, message: 'Attivo' };
          let isOldPhpWithoutStatus = false;

          if (!arubaResponse.ok) {
            const text = await arubaResponse.text();
            try {
              const parsed = JSON.parse(text);
              if (arubaResponse.status === 400 && parsed.message && parsed.message.includes('Nessun file decodificato')) {
                isOldPhpWithoutStatus = true;
                statusData = { success: true, message: 'Attivo (File PHP precedente rilevato, procedo al test di scrittura)' };
              }
            } catch (e) {}

            if (!isOldPhpWithoutStatus) {
              return new Response(JSON.stringify({
                success: false,
                source: 'Cloudflare Worker Diagnostics',
                message: `Il bridge Aruba ha risposto con errore HTTP ${arubaResponse.status} alla richiesta di stato.`,
                details: text.slice(0, 200)
              }), { status: arubaResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          } else {
            statusData = await arubaResponse.json();
          }

          // 2. Test di Scrittura Attiva (Caricamento di un mini file di test PNG Base64)
          let writeData;
          let usedFallback = false;

          if (arubaResponse.redirected) {
            return new Response(JSON.stringify({
              success: false,
              source: 'Cloudflare Worker Diagnostics',
              message: `Reindirizzamento rilevato (HTTP Redirect)! Il server Aruba ha reindirizzato da ${targetUrlWithKey} a ${arubaResponse.url}. Questo rimuove il corpo POST. Per favore aggiorna la variabile ARUBA_UPLOADER_URL sul tuo Worker impostando esattamente l'URL finale reindirizzato: ${arubaResponse.url}`,
            }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          const writeResponse = await fetch(targetUrlWithKey, {
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

          if (writeResponse.redirected) {
            return new Response(JSON.stringify({
              success: false,
              source: 'Cloudflare Worker Diagnostics',
              message: `Reindirizzamento rilevato durante la scrittura! Il server Aruba ha reindirizzato a ${writeResponse.url}. Corpo POST rimosso. Aggiorna la variabile ARUBA_UPLOADER_URL impostando l'URL finale reindirizzato: ${writeResponse.url}`,
            }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          if (!writeResponse.ok) {
            const text = await writeResponse.text();
            let parsed = null;
            try { parsed = JSON.parse(text); } catch (e) {}

            const looksLikeEmptyRawInput = writeResponse.status === 400 && (!parsed || (parsed.debug && parsed.debug.raw_input_empty) || text.includes('decodificato'));

            if (looksLikeEmptyRawInput) {
              console.log('[ARUBA-TEST] Tentativo JSON fallito con body vuoto. Eseguo fallback su form-urlencoded...');
              const urlEncodedBody = new URLSearchParams();
              urlEncodedBody.append('key', uploaderKey);
              urlEncodedBody.append('username', 'diagnostics_test_user');
              urlEncodedBody.append('documentFrontData', 'data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
              urlEncodedBody.append('documentFrontName', 'test_write.png');

              const fallbackResponse = await fetch(targetUrlWithKey, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Authorization': `Bearer ${uploaderKey}`,
                  'X-Aruba-Key': uploaderKey
                },
                body: urlEncodedBody
              });

              if (!fallbackResponse.ok) {
                const fallbackText = await fallbackResponse.text();
                return new Response(JSON.stringify({
                  success: false,
                  source: 'Cloudflare Worker Diagnostics (Fallback x-www-form-urlencoded)',
                  message: `La scrittura di test su Aruba è fallita anche tramite form-urlencoded (HTTP ${fallbackResponse.status})`,
                  details: fallbackText.slice(0, 1000)
                }), { status: fallbackResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              }

              writeData = await fallbackResponse.json();
              usedFallback = true;
            } else {
              return new Response(JSON.stringify({
                success: false,
                source: 'Cloudflare Worker Diagnostics',
                message: `La scrittura di test su Aruba è fallita (HTTP ${writeResponse.status})`,
                details: text.slice(0, 1000)
              }), { status: writeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          } else {
            writeData = await writeResponse.json();
          }

          if (!writeData || !writeData.success || !writeData.files || !writeData.files.front) {
            return new Response(JSON.stringify({
              success: false,
              source: 'Cloudflare Worker Diagnostics',
              message: 'La scrittura di test su Aruba è fallita o non ha generato link.',
              details: writeData ? (writeData.message || JSON.stringify(writeData)) : 'Controlla i permessi di scrittura PHP sul server Aruba.'
            }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          const fileUrl = writeData.files.front;

          // 3. Test di Lettura Attiva (I computer Cloudflare scaricano pubblicamente il file caricato)
          const readResponse = await fetch(fileUrl);
          if (!readResponse.ok) {
            return new Response(JSON.stringify({
              success: false,
              source: 'Cloudflare Worker Diagnostics',
              message: `Il file è stato scritto ma il ri-scaricamento pubblico è fallito (HTTP ${readResponse.status})`,
              details: `Impossibile scaricare pubblicamente l'immagine da ${fileUrl}`
            }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          return new Response(JSON.stringify({
            success: true,
            source: 'Cloudflare Worker Diagnostics',
            message: 'Test di Scrittura e Lettura su Aruba effettuato con successo!',
            statusCheck: statusData,
            writeTest: { ok: true, fileName: 'test_write.png' },
            readTest: { ok: true, url: fileUrl }
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        } catch (err) {
          return new Response(JSON.stringify({
            success: false,
            source: 'Cloudflare Worker Diagnostics',
            message: 'Errore durante la connessione o l\'autenticazione con il bridge Aruba ' + uploaderUrl,
            details: err.message
          }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      // Rotta: Admin Citizens (Lista iscritti per Consolle Amministratore)
      if (url.pathname === '/api/admin/citizens') {
        try {
          const rows = await queryDb('SELECT * FROM citizens ORDER BY id DESC');
          const augmented = rows.map(row => getCitizenWithArubaUrls(row));
          return new Response(JSON.stringify({ success: true, count: rows.length, data: augmented }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dbErr) {
          return new Response(JSON.stringify({ success: false, message: 'Errore durante l\'interrogazione del database: ' + dbErr.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Rotta: Admin Approve (Approvazione cittadinanza con generazione ID Card)
      if (url.pathname === '/api/admin/approve' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { id } = body;
          if (!id) {
            return new Response(JSON.stringify({ success: false, message: 'ID cittadino mancante.' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const citizenRows = await queryDb('SELECT * FROM citizens WHERE id = $1', [id]);
          if (citizenRows.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Cittadino non trovato.' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          const citizen = citizenRows[0];

          // Verifica dinamica delle colonne nello schema reali
          const columnsQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'citizens'
          `;
          const cols = await queryDb(columnsQuery);
          const existingColsLower = cols.map(c => c.column_name.toLowerCase());

          let dbCitizenCode = citizen.citizenCode || citizen.citizencode || citizen.citizen_code;
          let codeNeedsUpdate = false;
          if (!dbCitizenCode || dbCitizenCode === 'N/A' || dbCitizenCode === 'N/D') {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let newCode = '';
            for (let i = 0; i < 16; i++) {
              if (i > 0 && i % 4 === 0) newCode += '-';
              newCode += chars[Math.floor(Math.random() * chars.length)];
            }
            dbCitizenCode = newCode;
            codeNeedsUpdate = true;
          }

          let citizenCodeCol = 'citizenCode';
          const possibleCodeCols = ['citizenCode', 'citizencode', 'citizen_code'];
          for (const key of possibleCodeCols) {
            const idx = existingColsLower.indexOf(key.toLowerCase());
            if (idx !== -1) {
              const realCol = cols.find(c => c.column_name.toLowerCase() === key.toLowerCase());
              if (realCol) {
                citizenCodeCol = realCol.column_name;
              }
              break;
            }
          }

          let updateSql = '';
          let params = [];
          if (existingColsLower.includes('rejectionreason')) {
            if (codeNeedsUpdate) {
              updateSql = `UPDATE citizens SET status = $1, "rejectionReason" = $2, "${citizenCodeCol}" = $3 WHERE id = $4 RETURNING *`;
              params = ['approved', null, dbCitizenCode, id];
            } else {
              updateSql = 'UPDATE citizens SET status = $1, "rejectionReason" = $2 WHERE id = $3 RETURNING *';
              params = ['approved', null, id];
            }
          } else {
            if (codeNeedsUpdate) {
              updateSql = `UPDATE citizens SET status = $1, "${citizenCodeCol}" = $2 WHERE id = $3 RETURNING *`;
              params = ['approved', dbCitizenCode, id];
            } else {
              updateSql = 'UPDATE citizens SET status = $1 WHERE id = $2 RETURNING *';
              params = ['approved', id];
            }
          }

          const updatedRows = await queryDb(updateSql, params);
          if (updatedRows.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Impossibile aggiornare lo stato di validazione.' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          const updated = updatedRows[0];

          // Invio dell'email con la ID card ufficiale ed il PDF allegato
          const email = updated.email || citizen.email;
          if (email && email.includes('@')) {
            try {
              const brandColor = '#0a1c3e';
              const goldColor = '#c5a880';
              const citizenCodeVal = updated.citizenCode || updated.citizencode || citizen.citizenCode || citizen.citizencode || 'N/A';
              const firstNameVal = updated.firstName || updated.firstname || citizen.firstName || citizen.firstname || '';
              const surnameVal = updated.surname || citizen.surname || '';
              const birthDateVal = updated.birthDate || updated.birthdate || citizen.birthDate || citizen.birthdate || 'N/A';
              const birthPlaceVal = updated.birthPlace || updated.birthplace || citizen.birthPlace || citizen.birthplace || '';
              const birthCountryVal = updated.birthCountry || updated.birthcountry || citizen.birthCountry || citizen.birthcountry || '';
              const photoUrlVal = updated.arubaPhotoUrl || updated.arubaphotourl || citizen.arubaPhotoUrl || citizen.arubaphotourl || '';
              const hashVal = updated.documentHash || updated.documenthash || citizen.documentHash || citizen.documenthash || '';

              // Generazione del PDF in formato ufficiale A4
              const pdfAttachment = generateCitizenPdf(updated);

              const welcomeHtml = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f1f5f9; border-radius: 20px;">
                  <div style="background-color: ${brandColor}; padding: 45px 30px; border-radius: 16px 16px 0 0; text-align: center; color: white; border-bottom: 5px solid ${goldColor};">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${goldColor}; margin-bottom: 8px;">NEW WORLD STATE</div>
                    <h1 style="margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.5px; color: white; line-height: 1.2;">Benvenuto, Cittadino!</h1>
                    <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 15px; font-weight: 400; max-width: 400px; margin-left: auto; margin-right: auto; line-height: 1.4;">La tua domanda di cittadinanza sovrana globale è stata formalmente approvata e registrata.</p>
                  </div>
                  
                  <div style="padding: 35px 30px; background-color: white; border-radius: 0 0 16px 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; border-top: none; line-height: 1.63;">
                    <p style="font-size: 16px; margin-top: 0; color: #0f172a;">Gentile <strong>${firstNameVal} ${surnameVal}</strong>,</p>
                    
                    <p style="font-size: 15px; color: #334155;">Siamo onorati di darti il benvenuto ufficiale nella comunità federale globale del <strong>New World State</strong>. Il nostro comitato di validatori ha completato con successo la verifica della tua anagrafica e dei tuoi documenti di identità.</p>
                    
                    <div style="margin: 24px 0; background-color: #fef3c7; border-left: 4px solid ${goldColor}; padding: 18px; border-radius: 8px;">
                      <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: bold; color: #92400e; display: flex; align-items: center; gap: 6px;">
                        📎 CERTIFICATO PDF ALLEGATO ALL'EMAIL
                      </h4>
                      <p style="margin: 0; font-size: 13.5px; color: #78350f; line-height: 1.45;">Abbiamo generato e allegato a questa comunicazione la tua <strong>Carta d'Identità Ufficiale e Certificato di Cittadinanza in formato PDF</strong> ad alta risoluzione, firmato dall'autorità federale. Ti consigliamo di scaricarlo, stamparlo o conservarlo sul tuo smartphone.</p>
                    </div>

                    <p style="font-size: 15px; color: #334155;">Di seguito viene riportata un'anteprima digitale delle informazioni registrate nei nostri archivi sovrani:</p>
  
                    <!-- TABELLA ANTEPRIMA DOCUMENTO -->
                    <div style="margin: 28px 0; background-color: ${brandColor}; color: white; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 20px rgba(10,28,62,0.18); border: 2.5px solid ${goldColor};">
                      <div style="padding: 14px 18px; background-color: #071530; border-bottom: 1.5px solid ${goldColor};">
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td>
                              <div style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: ${goldColor};">NEW WORLD STATE</div>
                              <div style="font-size: 7.5px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Sovereign Global Citizenship</div>
                            </td>
                            <td style="text-align: right; font-size: 15px; color: ${goldColor}; font-weight: bold; letter-spacing: 0.5px;">IDENTITY CARD</td>
                          </tr>
                        </table>
                      </div>
                      
                      <div style="padding: 22px 18px; background-color: ${brandColor};">
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="width: 70%; vertical-align: top; font-size: 11.5px; font-family: sans-serif;">
                              <table style="width: 100%; border-collapse: collapse;">
                                  <tr><td style="color: #94a3b8; font-size: 7.5px; text-transform: uppercase; padding: 0; letter-spacing: 0.5px;">Cognome / Surname</td></tr>
                                  <tr><td style="font-weight: bold; color: white; font-size: 13.5px; padding-bottom: 7px; padding-top: 2px;">${surnameVal}</td></tr>
                                  
                                  <tr><td style="color: #94a3b8; font-size: 7.5px; text-transform: uppercase; padding: 0; letter-spacing: 0.5px;">Nome / Given Names</td></tr>
                                  <tr><td style="font-weight: bold; color: white; font-size: 13.5px; padding-bottom: 7px; padding-top: 2px;">${firstNameVal}</td></tr>
                                  
                                  <tr><td style="color: #94a3b8; font-size: 7.5px; text-transform: uppercase; padding: 0; letter-spacing: 0.5px;">Data e Luogo di Nascita / Date & Place of Birth</td></tr>
                                  <tr><td style="color: white; font-size: 11px; padding-bottom: 7px; padding-top: 2px;">${birthDateVal} - ${birthPlaceVal} (${birthCountryVal})</td></tr>
                                  
                                  <tr><td style="color: #94a3b8; font-size: 7.5px; text-transform: uppercase; padding: 0; letter-spacing: 0.5px;">Cittadinanza / Nationality</td></tr>
                                  <tr><td style="color: ${goldColor}; font-weight: bold; font-size: 11px; padding-top: 2px; text-transform: uppercase; letter-spacing: 0.5px;">NEW WORLD STATE ● SOVEREIGN</td></tr>
                              </table>
                            </td>
                            <td style="width: 30%; vertical-align: middle; text-align: center; padding-left: 10px;">
                              <div style="border: 2.5px solid ${goldColor}; width: 85px; height: 105px; background-color: #071530; border-radius: 6px; overflow: hidden; display: inline-block; vertical-align: middle;">
                                ${photoUrlVal ? `<img src="${photoUrlVal}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Foto" />` : `<div style="padding-top: 36px; font-size: 8.5px; color: #475569; text-align: center; font-weight: bold;">DOCUMENTO<br/>VALIDATO</div>`}
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <div style="margin-top: 15px; border-top: 1px dashed rgba(197,168,128,0.25); padding-top: 12px;">
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td>
                                <div style="color: #94a3b8; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.5px;">Codice Cittadino / Citizen Code</div>
                                <div style="font-family: monospace; font-size: 14.5px; font-weight: bold; color: ${goldColor}; letter-spacing: 0.8px; margin-top: 3px;">${citizenCodeVal}</div>
                              </td>
                              <td style="vertical-align: bottom; text-align: right;">
                                <div style="font-family: monospace; font-size: 8.2px; color: #64748b; word-break: break-all;">NWS SIGNATURE: ${hashVal ? hashVal.slice(0, 16).toUpperCase() : 'VALIDATED'}</div>
                              </td>
                            </tr>
                          </table>
                        </div>
                      </div>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 28px 0;" />
                    
                    <p style="font-size: 13.5px; color: #64748b; text-align: center; margin-bottom: 0; line-height: 1.5;">
                      <em style="color: #475569; font-weight: 500;">"Uniti nello spazio, legati per diritto."</em><br/>
                      <strong style="color: #0f172a; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; display: block; margin-top: 6px;">Ufficio dell'Anagrafe Federale del New World State</strong>
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 22px; font-size: 11.5px; color: #64748b; line-height: 1.4; padding: 0 10px;">
                    Questa è una comunicazione ufficiale automatica inviata a seguito della delibera di accoglimento della pratica di cittadinanza da parte dei Ministri Federali. Si prega di verificare la presenza dell'allegato PDF sul proprio lettore email.
                  </div>
                </div>
              `;
              await sendEmail(email.trim(), 'CONGRATULAZIONI! La tua cittadinanza New World State è approvata', welcomeHtml, env, pdfAttachment);
            } catch (smtpErr) {
              console.error('[SMTP-APPROVE-ERR] Eccezione nell\'invio email approvazione dal Worker:', smtpErr);
            }
          }

          return new Response(JSON.stringify({ success: true, message: 'Cittadino approvato con successo e ID card spedita via email!', citizen: updated }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dbErr) {
          return new Response(JSON.stringify({ success: false, message: 'Errore durante l\'approvazione nel database: ' + dbErr.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Rotta: Admin Reject (Rifiuto domanda anagrafica con motivazione)
      if (url.pathname === '/api/admin/reject' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { id, reason } = body;
          if (!id) {
            return new Response(JSON.stringify({ success: false, message: 'ID cittadino mancante.' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          if (!reason) {
            return new Response(JSON.stringify({ success: false, message: 'Fornire una motivazione per il rifiuto.' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const citizenRows = await queryDb('SELECT * FROM citizens WHERE id = $1', [id]);
          if (citizenRows.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Cittadino non trovato.' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          const citizen = citizenRows[0];

          const columnsQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'citizens'
          `;
          const cols = await queryDb(columnsQuery);
          const existingColsLower = cols.map(c => c.column_name.toLowerCase());

          let updateSql = '';
          let params = [];
          if (existingColsLower.includes('rejectionreason')) {
            updateSql = 'UPDATE citizens SET status = $1, "rejectionReason" = $2 WHERE id = $3 RETURNING *';
            params = ['rejected', reason, id];
          } else {
            updateSql = 'UPDATE citizens SET status = $1 WHERE id = $2 RETURNING *';
            params = ['rejected', id];
          }

          const updatedRows = await queryDb(updateSql, params);
          if (updatedRows.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Impossibile aggiornare lo stato di validazione.' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          const updated = updatedRows[0];

          // Invio dell'email di rifiuto
          const email = updated.email || citizen.email;
          if (email && email.includes('@')) {
            try {
              const firstNameVal = updated.firstName || updated.firstname || citizen.firstName || citizen.firstname || '';
              const surnameVal = updated.surname || citizen.surname || '';

              const textHtml = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
                  <div style="background-color: #ef4444; padding: 30px; border-radius: 12px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: white;">Aggiornamento Registrazione</h1>
                    <p style="margin: 5px 0 0 0; color: #fee2e2; font-size: 15px;">Domanda di Cittadinanza Respinta</p>
                  </div>
                  
                  <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; line-height: 1.6;">
                    <p style="font-size: 16px; margin-top: 0;">Gentile <strong>${firstNameVal} ${surnameVal}</strong>,</p>
                    
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

              await sendEmail(email.trim(), 'Stato domanda di cittadinanza New World State (Non accetta)', textHtml, env);
            } catch (smtpErr) {
              console.error('[SMTP-REJECT-ERR] Errore invio rifiuto:', smtpErr);
            }
          }

          return new Response(JSON.stringify({ success: true, message: 'Pratica respinta con successo e spiegazione spedita via email.', citizen: updated }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dbErr) {
          return new Response(JSON.stringify({ success: false, message: 'Errore durante il rifiuto nel database: ' + dbErr.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Rotta: Admin Action (Servizio di Validazione Interattivo via Email)
      if (url.pathname === '/admin/action' && request.method === 'GET') {
        const id = url.searchParams.get('id');
        if (!id) {
          return new Response(`
            <html>
              <head>
                <title>Errore - Servizio Validazione NWS</title>
                <script src="https://cdn.tailwindcss.com"></script>
              </head>
              <body class="bg-[#faf9f6] min-h-screen flex items-center justify-center p-6 text-slate-800 font-sans">
                <div class="bg-white max-w-md w-full rounded-2xl shadow-xl border border-red-100 p-8 text-center">
                  <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">!</div>
                  <h1 class="text-xl font-bold text-slate-900 mb-2">ID Cittadino Mancante</h1>
                  <p class="text-slate-500 text-sm leading-relaxed mb-6">Il link di validazione utilizzato non contiene un parametro identificativo valido o il codice della richiesta è nullo.</p>
                  <a href="/" class="inline-flex bg-[#0a1c3e] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition">Torna alla Home</a>
                </div>
              </body>
            </html>
          `, { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
        }

        try {
          const citizenRows = await queryDb('SELECT * FROM citizens WHERE id = $1', [Number(id)]);
          if (citizenRows.length === 0) {
            return new Response(`
              <html>
                <head>
                  <title>Errore - Cittadino Non Trovato</title>
                  <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body class="bg-[#faf9f6] min-h-screen flex items-center justify-center p-6 text-slate-800 font-sans">
                  <div class="bg-white max-w-md w-full rounded-2xl shadow-xl border border-amber-100 p-8 text-center">
                    <div class="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">?</div>
                    <h1 class="text-xl font-bold text-slate-900 mb-2">Richiesta Non Trovata</h1>
                    <p class="text-slate-500 text-sm leading-relaxed mb-6">Impossibile trovare nel registro del database una richiesta di cittadinanza associata all'ID #${id}. Potrebbe essere stata archiviata o rimossa.</p>
                    <a href="/" class="inline-flex bg-[#0a1c3e] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition">Torna alla Home</a>
                  </div>
                </body>
              </html>
            `, { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
          }

          const cit = getCitizenWithArubaUrls(citizenRows[0]);
          const status = cit.status || 'pending';
          const statusClass = status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                              status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                              'bg-amber-50 text-amber-700 border-amber-100';

          const statusLabel = status === 'approved' ? 'APPROVATO' : 
                              status === 'rejected' ? 'RESPINTO' : 
                              'IN ATTESA DI VALIDAZIONE';

          return new Response(`
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
                    <p class="text-slate-500 text-sm mt-1">Username: <span class="font-mono text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded">${cit.username || 'N/D'}</span></p>
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
                          <span class="font-semibold text-slate-800 block">${cit.phonePrefix || ''} ... ${cit.phoneNumber || 'N/D'}</span>
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
                  const reason = document.getElementById('rejectReason').value.trim();
                  
                  if (action === 'reject' && !reason) {
                    alert('Attenzione: Devi inserire obbligatoriamente il motivo del rifiuto nella casella di testo.');
                    return;
                  }

                  // Show Loading
                  document.getElementById('action-ui').classList.add('hidden');
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
                  document.getElementById('action-ui').classList.add('hidden');
                  document.getElementById('error-ui').classList.remove('hidden');
                  document.getElementById('error-desc').innerText = msg;
                }

                function resetUI() {
                  document.getElementById('error-ui').classList.add('hidden');
                  document.getElementById('success-ui').classList.add('hidden');
                  document.getElementById('action-ui').classList.remove('hidden');
                }
                
                window.addEventListener('load', () => {
                  const urlParams = new URLSearchParams(window.location.search);
                  const action = urlParams.get('action');
                  if (action === 'reject') {
                    document.getElementById('rejectReason').focus();
                  }
                });
              </script>
            </body>
            </html>
          `, { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } });

        } catch (dbErr) {
          return new Response(`
            <html>
              <head>
                <title>Errore Database - Servizio Validazione NWS</title>
                <script src="https://cdn.tailwindcss.com"></script>
              </head>
              <body class="bg-[#faf9f6] min-h-screen flex items-center justify-center p-6 text-slate-800 font-sans">
                <div class="bg-white max-w-md w-full rounded-2xl shadow-xl border border-red-100 p-8 text-center">
                  <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">!</div>
                  <h1 class="text-xl font-bold text-slate-900 mb-2">Errore di Connessione</h1>
                  <p class="text-slate-500 text-sm leading-relaxed mb-6">Non è possibile connettersi al database anagrafico per estrarre le informazioni richieste: ${dbErr.message}</p>
                  <a href="/" class="inline-flex bg-[#0a1c3e] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition">Torna alla Home</a>
                </div>
              </body>
            </html>
          `, { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
        }
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
        
        // Mapping completo di tutti i campi secondo la struttura citizens, incluse le immagini Base64 dei carichi dei documenti
        const { 
          surname, firstName, gender, birthDate, birthPlace, birthCountry,
          citizenship, maritalStatus, residenceAddress, residenceNumber, residenceZip, 
          residenceCity, residenceProvince, residenceCountry, email, phonePrefix, phoneNumber,
          username, password, documentHash, documentType,
          plusCode, locationDescription, latitude, longitude,
          isAmbassador, isPeacekeeper, citizenCode,
          documentFrontData, documentFrontName, documentBackData, documentBackName,
          documentPhotoData, documentPhotoName
        } = body;

        const normalizedUsername = username ? username.toLowerCase().replace(/\s/g, '') : null;

        // --- INIZIALIZZAZIONE VARIABILI DOCUMENTI ---
        let arubaFrontUrl = '';
        let arubaBackUrl = '';
        let arubaPhotoUrl = '';

        // 1. Interroghiamo lo schema del database in tempo reale per scoprire i nomi effettivi delle colonne.
        // In questo modo, che il database sia stato creato con colonne case-sensitive (es. "firstName")
        // o tutto in minuscolo privo di virgolette (es. "firstname"), l'inserimento funzionerà senza errori!
        const columnsQuery = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'citizens'
        `;
        const cols = await queryDb(columnsQuery);
        const existingCols = cols.map(c => c.column_name); // Mantiene il casing del DB
        const existingColsLower = existingCols.map(c => c.toLowerCase());

        const insertCols = [];
        const insertPlaceholders = [];
        const dbParams = [];
        let paramIndex = 1;

        // Helper per mappare e aggiungere la colonna se esiste, a prescindere dal case
        const addColumnIfExist = (targetName, value) => {
          const lowerTarget = targetName.toLowerCase();
          const foundIdx = existingColsLower.indexOf(lowerTarget);
          if (foundIdx !== -1) {
            const dbColumnName = existingCols[foundIdx];
            insertCols.push(`"${dbColumnName}"`);
            insertPlaceholders.push(`$${paramIndex}`);
            dbParams.push(value);
            paramIndex++;
          }
        };

        // Popoliamo i campi di base di anagrafica e credenziali
        addColumnIfExist('surname', surname);
        addColumnIfExist('firstName', firstName);
        addColumnIfExist('gender', gender);
        addColumnIfExist('birthDate', birthDate || null);
        addColumnIfExist('birthPlace', birthPlace);
        addColumnIfExist('birthCountry', birthCountry);
        addColumnIfExist('citizenship', citizenship);
        addColumnIfExist('maritalStatus', maritalStatus);
        addColumnIfExist('residenceAddress', residenceAddress);
        addColumnIfExist('residenceNumber', residenceNumber);
        addColumnIfExist('residenceZip', residenceZip);
        addColumnIfExist('residenceCity', residenceCity);
        addColumnIfExist('residenceProvince', residenceProvince);
        addColumnIfExist('residenceCountry', residenceCountry);
        addColumnIfExist('email', email || null);
        addColumnIfExist('phonePrefix', phonePrefix);
        addColumnIfExist('phoneNumber', phoneNumber);
        addColumnIfExist('username', normalizedUsername);
        addColumnIfExist('password', password);
        addColumnIfExist('documentHash', documentHash);
        addColumnIfExist('documentType', documentType);
        addColumnIfExist('plusCode', plusCode);
        addColumnIfExist('locationDescription', locationDescription);
        addColumnIfExist('isAmbassador', !!isAmbassador);
        addColumnIfExist('isPeacekeeper', !!isPeacekeeper);
        addColumnIfExist('status', 'pending');
        addColumnIfExist('citizenCode', citizenCode || '');

        // Gestione colonna geografica spaziale (PostGIS)
        const locationIdx = existingColsLower.indexOf('location');
        if (locationIdx !== -1) {
          const dbLocationCol = existingCols[locationIdx];
          insertCols.push(`"${dbLocationCol}"`);
          insertPlaceholders.push(`ST_SetSRID(ST_MakePoint($${paramIndex}, $${paramIndex + 1}), 4326)`);
          dbParams.push(parseFloat(longitude) || 0);
          dbParams.push(parseFloat(latitude) || 0);
          paramIndex += 2;
        }

        // Gestione data di creazione ("createdAt" o "createdat")
        const createdAtIdx = existingColsLower.indexOf('createdat');
        if (createdAtIdx !== -1) {
          const dbCreatedAtCol = existingCols[createdAtIdx];
          insertCols.push(`"${dbCreatedAtCol}"`);
          insertPlaceholders.push('NOW()');
        }

        if (insertCols.length === 0) {
          throw new Error('Nessuna colonna valida corrispondente trovata nella tabella citizens.');
        }

        const sql = `
          INSERT INTO citizens (${insertCols.join(', ')})
          VALUES (${insertPlaceholders.join(', ')})
          RETURNING id
        `;

        const rows = await queryDb(sql, dbParams);
        const citizenId = rows[0]?.id;

        // --- CARICAMENTO DOCUMENTI SU SPAZIO ARUBA VIA BRIDGE PHP (CON RECORD ID DI POSTGRES) ---
        const uploaderUrl = env.ARUBA_UPLOADER_URL ? env.ARUBA_UPLOADER_URL.trim() : '';
        const uploaderKey = env.ARUBA_UPLOADER_KEY ? env.ARUBA_UPLOADER_KEY.trim() : '';

        if (uploaderUrl && uploaderKey && documentFrontData && citizenId) {
          console.log('[ARUBA-UPLOADER] Tentativo di caricamento su Aruba con record ID #' + citizenId);
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
                username: String(citizenId),
                documentFrontData,
                documentFrontName,
                documentBackData,
                documentBackName,
                documentPhotoData,
                documentPhotoName
              })
            });

            if (uploaderRes.ok) {
              const uploaderData = await uploaderRes.json();
              if (uploaderData.success && uploaderData.files) {
                arubaFrontUrl = uploaderData.files.front || '';
                arubaBackUrl = uploaderData.files.back || '';
                arubaPhotoUrl = uploaderData.files.photo || '';
                console.log('[ARUBA-UPLOADER] Documenti e foto memorizzati correttamente su Aruba per record #' + citizenId, uploaderData.files);
              }
            } else {
              console.error('[ARUBA-UPLOADER] Errore HTTP: ' + uploaderRes.status);
            }
          } catch (upErr) {
            console.error('[ARUBA-UPLOADER] Eccezione: ' + upErr.message);
          }
        }

        // --- SALVATAGGIO DEI LINK FISICI ARUBA NEL DATABASE POSTGRESQL ---
        if ((arubaFrontUrl || arubaBackUrl || arubaPhotoUrl) && citizenId) {
          try {
            await queryDb('UPDATE citizens SET "arubaFrontUrl" = $1, "arubaBackUrl" = $2, "arubaPhotoUrl" = $3 WHERE id = $4', [
              arubaFrontUrl || null,
              arubaBackUrl || null,
              arubaPhotoUrl || null,
              Number(citizenId)
            ]);
            console.log('[DB-UPDATE-ARUBA] Record aggiornato con i link fisici Aruba.');
          } catch (dbUpErr) {
            console.error('[DB-UPDATE-ARUBA-ERR] Errore nell\'aggiornamento del record con i link Aruba:', dbUpErr.message);
          }
        }

        // --- INVIO EMAIL DI NOTIFICA E CONFERMA ---
        try {
          const adminEmail = env.ADMIN_EMAIL || "supersalvatoreferroinfranca@gmail.com";
          const brandColor = "#0a1c3e";
          const lightBg = "#f8fafc";
          
          const adminHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: ${lightBg}; border-radius: 16px;">
              <div style="background-color: ${brandColor}; padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Nuovo Cittadino Registrato</h1>
                <p style="margin: 5px 0 0 0; color: #93c5fd; font-size: 14px;">Richiesta id #${citizenId}</p>
              </div>
              
              <div style="padding: 24px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <h2 style="font-size: 18px; color: ${brandColor}; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 0;">Anagrafica Richiedente</h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                  <tr><td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Cognome e Nome:</strong></td><td style="padding: 6px 0; font-weight: 600;">${surname || ''} ${firstName || ''}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Sesso:</strong></td><td style="padding: 6px 0;">${gender || ''}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Data di Nascita:</strong></td><td style="padding: 6px 0;">${birthDate || 'Non fornito'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Luogo di Nascita:</strong></td><td style="padding: 6px 0;">${birthPlace || ''} (${birthCountry || ''})</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Cittadinanza Attuale:</strong></td><td style="padding: 6px 0;">${citizenship || ''}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Stato Civile:</strong></td><td style="padding: 6px 0;">${maritalStatus || ''}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Email del Cittadino:</strong></td><td style="padding: 6px 0; font-weight: 600; color: #2563eb;">${email || 'Nessuna'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Telefono:</strong></td><td style="padding: 6px 0;">${phonePrefix || ''} ${phoneNumber || 'Nessuno'}</td></tr>
                </table>

                <h2 style="font-size: 18px; color: ${brandColor}; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 24px;">Localizzazione Geografica</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                  <tr><td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Indirizzo Residenza:</strong></td><td style="padding: 6px 0;">${residenceAddress || ''}, ${residenceNumber || ''}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>CAP / Città:</strong></td><td style="padding: 6px 0;">${residenceZip || ''} - ${residenceCity || ''} (${residenceProvince || ''})</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Stato Residenza:</strong></td><td style="padding: 6px 0;">${residenceCountry || ''}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Coordinate Geografiche:</strong></td><td style="padding: 6px 0; font-family: monospace; font-size: 13px;">lat: ${latitude || 0}, lon: ${longitude || 0}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Plus Code:</strong></td><td style="padding: 6px 0; font-family: monospace; color: #0f766e; font-weight: 600;">${plusCode || ''}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Descrizione Luogo:</strong></td><td style="padding: 6px 0; font-style: italic;">"${locationDescription || ''}"</td></tr>
                </table>

                <h2 style="font-size: 18px; color: ${brandColor}; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 24px;">Credenziali ed Opzioni</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                  <tr><td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Username:</strong></td><td style="padding: 6px 0; font-family: monospace;">${normalizedUsername || 'Registrato con email/tel'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Hash Documento:</strong></td><td style="padding: 6px 0; font-family: monospace; font-size: 11px; word-break: break-all;">${documentHash || ''}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Tipo Documento:</strong></td><td style="padding: 6px 0;">${documentType || ''}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>File Fisici su Aruba:</strong></td><td style="padding: 6px 0;">
                    ${arubaFrontUrl ? `<a href="${arubaFrontUrl}" target="_blank" style="color: #2563eb; font-weight: bold; text-decoration: underline; margin-right: 12px;">Visualizza Fronte</a>` : ''}
                    ${arubaBackUrl ? `<a href="${arubaBackUrl}" target="_blank" style="color: #2563eb; font-weight: bold; text-decoration: underline; margin-right: 12px;">Visualizza Retro</a>` : ''}
                    ${arubaPhotoUrl ? `<a href="${arubaPhotoUrl}" target="_blank" style="color: #10b981; font-weight: bold; text-decoration: underline;">Visualizza Foto Tessera</a>` : ''}
                    ${!arubaFrontUrl && !arubaBackUrl && !arubaPhotoUrl ? '<span style="color: #94a3b8; font-style: italic;">Nessuno (Uploader non configurato o disabilitato nel Worker)</span>' : ''}
                  </td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Candidato Ambasciatore:</strong></td><td style="padding: 6px 0; font-weight: 600; color: ${isAmbassador ? '#15803d' : '#64748b'};">${isAmbassador ? 'SÌ' : 'NO'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Candidato Peacekeeper:</strong></td><td style="padding: 6px 0; font-weight: 600; color: ${isPeacekeeper ? '#15803d' : '#64748b'};">${isPeacekeeper ? 'SÌ' : 'NO'}</td></tr>
                </table>
              </div>
              
              <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8;">
                Questo è un messaggio automatico generato dal database di New World State.
              </div>
            </div>
          `;
          
          const citizenHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: ${lightBg}; border-radius: 16px;">
              <div style="background-color: ${brandColor}; padding: 40px 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Richiesta Registrata!</h1>
                <p style="margin: 10px 0 0 0; color: #93c5fd; font-size: 16px;">Benvenuto nel registro mondiale del New World State</p>
              </div>
              
              <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); line-height: 1.6;">
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
                
                <p style="font-size: 14px; margin-top: 24px;">Al termine della procedura di verifica dei dati, riceverai una seconda comunicazione email di inserimento definitivo nel registro, contenente il link per scaricare il tuo **Certificato di Cittadinanza Digitale**.</p>
                
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                
                <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
                  <em>"Uniti nello spazio, legati per diritto."</em><br/>
                  <strong>Ufficio dell'Anagrafe Federale del New World State</strong>
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8;">
                Ricevi questa email perché hai espresso la volontà di registrararti sul portale ufficiale di New World State. Se non eri tu, puoi ignorare questo messaggio.
              </div>
            </div>
          `;

          const emailPromises = [];
          
          // Invia all'amministratore
          emailPromises.push(sendEmail(adminEmail, `[NWS-ANAGRAFE] Nuova richiesta di cittadinanza: ${surname} ${firstName}`, adminHtml, env));
          
          // Invia all'utente
          if (email && email.includes('@')) {
            emailPromises.push(sendEmail(email.trim(), `Registrazione ricevuta - New World State`, citizenHtml, env));
          }
          
          await Promise.all(emailPromises);
        } catch (mailErr) {
          console.error('[EMAIL] Errore riscontrato durante la spedizione delle email in registrazione:', mailErr);
        }

        return new Response(JSON.stringify({ success: true, id: citizenId }), { 
          status: 201, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
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


---

## 5. INTEGRAZIONE NATIVA: CLOUDFLARE PAGES "STATIC FORMS" & MAILCHANNELS (CONSIGLIATO)

Se desideri evitare l'uso di chiavi API esterne (come Resend o Brevo) e inviare le email in modo **100% integrato e gratuito** tramite Cloudflare, puoi sfruttare il plugin nativo **Static Forms** accoppiato a **Mailchannels** (il servizio di invio email preconfigurato e gratuito per l'ecosistema Cloudflare Pages / Workers).

### Come è stato predisposto il codice nell'App:
1. **Rilevamento Statico (`index.html`)**: È stato inserito un form HTML nascosto (`<form name="richiesta-cittadinanza" data-static-form-name="richiesta-cittadinanza" style="display:none;">`) all'interno del file `/index.html`. Questo permette al compilatore/parser di Cloudflare Pages di rilevare staticamente il modulo durante il deploy.
2. **Inoltro Dinamico (`RegisterForm.tsx`)**: Al completamento positivo del salvataggio nel database, il codice React esegue silenziosamente una richiesta POST programmata a `/` in formato `application/x-www-form-urlencoded`. Cloudflare Pages intercetterà questa chiamata attivando il plugin email, mantenendo intatto l'elegante flusso dell'interfaccia utente React (senza ricaricare la pagina!).

---

### Guida di configurazione passo-passo per Cloudflare Pages

#### Passo 1: Installa il Plugin Static Forms nel tuo repository di Pages
Se gestisci il progetto tramite repository Git connesso a Cloudflare Pages, installa pacchetto del plugin:
```bash
npm install @cloudflare/pages-plugin-static-forms
```

#### Passo 2: Crea il file di Middleware per le Cloudflare Pages Functions
All'interno del tuo progetto, crea (se non esiste già) una cartella chiamata `functions/` nella root del repository e crea un file denominato `_middleware.js` (o `functions/_middleware.js`):

```javascript
import staticFormsPlugin from "@cloudflare/pages-plugin-static-forms";

export const onRequest = [
  staticFormsPlugin({
    respondWith: async ({ name, data }) => {
      // Intercettiamo solo il form di registrazione della cittadinanza
      if (name === "richiesta-cittadinanza") {
        const adminEmail = "supersalvatoreferroinfranca@gmail.com";
        const userEmail = data.email;
        const brandColor = "#0a1c3e";
        const lightBg = "#f8fafc";

        // Costruiamo il template email per l'Amministratore
        const adminHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: ${lightBg}; border-radius: 16px;">
            <div style="background-color: ${brandColor}; padding: 30px; border-radius: 12px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">Nuovo Cittadino Registrato</h1>
              <p style="margin: 5px 0 0 0; color: #93c5fd; font-size: 14px;">Inoltrato da Cloudflare Pages Native Forms</p>
            </div>
            <div style="padding: 24px; background-color: white; border-radius: 12px; margin-top: 20px;">
              <h2 style="font-size: 18px; color: ${brandColor}; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Anagrafica Richiedente</h2>
              <table style="width: 100%; font-size: 14px;">
                <tr><td><strong>Cognome e Nome:</strong></td><td>${data.surname || ''} ${data.firstName || ''}</td></tr>
                <tr><td><td><strong>Sesso:</strong></td><td>${data.gender || ''}</td></tr>
                <tr><td><strong>Email:</strong></td><td><a href="mailto:${userEmail}">${userEmail || 'Nessuna'}</a></td></tr>
                <tr><td><strong>Telefono:</strong></td><td>${data.phonePrefix || ''} ${data.phoneNumber || ''}</td></tr>
                <tr><td><strong>Plus Code:</strong></td><td style="color:#0f766e; font-weight:600;">${data.plusCode || ''}</td></tr>
                <tr><td><strong>Descrizione Luogo:</strong></td><td><em>"${data.locationDescription || ''}"</em></td></tr>
              </table>
            </div>
          </div>
        `;

        // Costruiamo il template email per l'Utente
        const userHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: ${lightBg}; border-radius: 16px;">
            <div style="background-color: ${brandColor}; padding: 40px 30px; border-radius: 12px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 26px;">Richiesta Registrata!</h1>
              <p style="margin: 10px 0 0 0; color: #93c5fd; font-size: 16px;">Benvenuto nel registro del New World State</p>
            </div>
            <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; line-height: 1.6;">
              <p>Caro/a <strong>${data.firstName || ''} ${data.surname || ''}</strong>,</p>
              <p>La tua richiesta di cittadinanza è stata correttamente registrata nel nostro sistema anagrafico.</p>
              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <h3 style="margin: 0 0 5px 0; color: #14532d; font-size: 14px;">PROSSIMO PASSO: VALIDAZIONE</h3>
                <p style="margin: 0; color: #166534; font-size: 13px;">Un validatore NWS verificherà la conformità delle informazioni fornite. Al termine riceverai il tuo Certificato Digitale.</p>
              </div>
            </div>
          </div>
        `;

        // Spedizione tramite le API native e gratuite di Mailchannels su Cloudflare
        const sendMailViaMailchannels = async (recipient, subject, htmlContent) => {
          return fetch("https://api.mailchannels.net/tx/v1/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: recipient }] }],
              from: { email: "anagrafe@newworldstate.cloud", name: "Anagrafe New World State" },
              subject: subject,
              content: [{ type: "text/html", value: htmlContent }]
            })
          });
        };

        try {
          // Invio all'amministratore
          await sendMailViaMailchannels(adminEmail, `[NWS-ANAGRAFE] Nuova iscrizione di ${data.surname} ${data.firstName}`, adminHtml);
          
          // Invio all'utente (se ha inserito un'email)
          if (userEmail && userEmail.includes('@')) {
            await sendMailViaMailchannels(userEmail.trim(), `Richiesta Ricevuta - New World State`, userHtml);
          }
        } catch (e) {
          console.error("Errore nell'invio automatico via Mailchannels:", e);
        }
      }

      // Rispondiamo con un JSON di successo per non bloccare o ricaricare la pagina React client-side
      return new Response(JSON.stringify({ success: true, plugin: "static-forms-intercepted" }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  })
];
```

#### Passo 3: Esegui il Deploy su Cloudflare Pages
Una volta salvato il file `_middleware.js` nella tua cartella `functions/` sul tuo repository Git, effettua il push. Cloudflare Pages rileverà automaticamente la directory `functions/`, configurerà il plugin static forms integrato e invierà l'email in modo del tutto autonomo ad ogni nuova registrazione!


## 🚀 Archiviazione Fisica dei Documenti su Spazio Aruba (Illimitato)

Per archiviare i documenti caricati sul portale direttamente nello spazio illimitato del tuo hosting **Aruba** mantenendo l'infrastruttura di visualizzazione e calcolo su **Cloudflare**, abbiamo creato un sistema di **Bridge PHP**.

Il portale converte i documenti in formato Base64 al momento della registrazione e li trasmette al server Express (o direttamente a Cloudflare). Il server contatta l'uploader Aruba protetto che crea una cartella separata per ogni utente e vi deposita i file fronte e retro. I link diretti generati vengono poi trasmessi all'amministratore via email!

### 1. Codice del Bridge PHP (`nws-uploader.php`)

Crea un file di testo denominato `nws-uploader.php`, incolla il codice seguente e caricalo tramite **FTP / SFTP** sul tuo spazio Aruba (nella cartella principale o in una sottocartella, ad esempio `https://iltuodominio.it/nws-uploader.php`):

```php
<?php
/**
 * NWS Document Uploader Bridge - Spazio Aruba
 * 
 * Permette di caricare in modo sicuro i documenti di identità dei richiedenti
 * nello spazio illimitato di Aruba, invocato direttamente da Cloudflare/Express.
 */

// Imposta gli header di sicurezza e CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Aruba-Key');

// Gestione dei pacchetti PREFLIGHT di CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Lettura delle credenziali di sicurezza inserite nella richiesta (Header, Server variables, o POST)
$authHeader = '';
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} else if (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    foreach ($headers as $key => $val) {
        if (strcasecmp($key, 'Authorization') === 0) {
            $authHeader = $val;
            break;
        }
    }
}

// Estrazione da header custom (infallibile per bypassare i filtri Apache che rimuovono Authorization)
$customArubaKeyHeader = '';
if (isset($_SERVER['HTTP_X_ARUBA_KEY'])) {
    $customArubaKeyHeader = $_SERVER['HTTP_X_ARUBA_KEY'];
} elseif (isset($_SERVER['HTTP_X_AUTHORIZATION'])) {
    $customArubaKeyHeader = $_SERVER['HTTP_X_AUTHORIZATION'];
} else if (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    foreach ($headers as $key => $val) {
        if (strcasecmp($key, 'X-Aruba-Key') === 0) {
            $customArubaKeyHeader = $val;
            break;
        }
    }
}

$postKey = isset($_POST['key']) ? $_POST['key'] : '';
$getKey = isset($_GET['key']) ? $_GET['key'] : '';

$inputRaw = file_get_contents('php://input');
$inputData = json_decode($inputRaw, true);

if (!is_array($inputData)) {
    $inputData = array();
}

// Fallback su parametri POST tradizionali se non è stato inviato JSON o se non è decodificato
if (empty($inputData['documentFrontData']) && !empty($_POST['documentFrontData'])) {
    $inputData['documentFrontData'] = $_POST['documentFrontData'];
}
if (empty($inputData['documentFrontName']) && !empty($_POST['documentFrontName'])) {
    $inputData['documentFrontName'] = $_POST['documentFrontName'];
}
if (empty($inputData['documentBackData']) && !empty($_POST['documentBackData'])) {
    $inputData['documentBackData'] = $_POST['documentBackData'];
}
if (empty($inputData['documentBackName']) && !empty($_POST['documentBackName'])) {
    $inputData['documentBackName'] = $_POST['documentBackName'];
}
if (empty($inputData['documentPhotoData']) && !empty($_POST['documentPhotoData'])) {
    $inputData['documentPhotoData'] = $_POST['documentPhotoData'];
}
if (empty($inputData['documentPhotoName']) && !empty($_POST['documentPhotoName'])) {
    $inputData['documentPhotoName'] = $_POST['documentPhotoName'];
}
if (empty($inputData['username']) && !empty($_POST['username'])) {
    $inputData['username'] = $_POST['username'];
}
if (empty($inputData['action']) && !empty($_POST['action'])) {
    $inputData['action'] = $_POST['action'];
}
if (empty($inputData['action']) && !empty($_GET['action'])) {
    $inputData['action'] = $_GET['action'];
}
if (empty($inputData['key']) && !empty($_POST['key'])) {
    $inputData['key'] = $_POST['key'];
}
if (empty($inputData['key']) && !empty($_GET['key'])) {
    $inputData['key'] = $_GET['key'];
}

if (empty($postKey) && isset($inputData['key'])) {
    $postKey = $inputData['key'];
}

// ⚠️ MODIFICA QUESTO TOKEN: Inserisci una password segreta molto complessa!
// Questa chiave deve coincidere esattamente con la variabile d'ambiente ARUBA_UPLOADER_KEY
define('SECURE_TOKEN', 'INSERISCI_UNA_PASSWORD_MOLTO_SICURA_E_LUNGA_QUI'); 

// Estrazione e riscontro del token con trim() di sicurezza per evitare spazi copia-incolla
$receivedToken = '';
if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
    $receivedToken = $matches[1];
}

// Fallback su Header custom X-Aruba-Key (se Authorization è stato rimosso da FastCGI / PHP-FPM)
if (empty($receivedToken) && !empty($customArubaKeyHeader)) {
    $receivedToken = $customArubaKeyHeader;
}

// Fallback su Query String GET (?key=...)
if (empty($receivedToken) && !empty($getKey)) {
    $receivedToken = $getKey;
}

// Fallback su campo POST tradizionale o JSON
if (empty($receivedToken) && !empty($postKey)) {
    $receivedToken = $postKey;
}

$receivedToken = trim($receivedToken);
$secureToken = trim(SECURE_TOKEN);

if (empty($receivedToken) || $receivedToken !== $secureToken) {
    http_response_code(401);
    echo json_encode(array(
        'success' => false,
        'message' => 'Errore di autorizzazione: Chiave di sicurezza non valida o non fornita.'
    ));
    exit;
}

// Status Check
if (isset($inputData['action']) && $inputData['action'] === 'status') {
    echo json_encode(array(
        'success' => true,
        'message' => 'Il bridge di caricamento Aruba è attivo ed operativo!',
        'writeable' => is_writable('.')
    ));
    exit;
}

// Estrazione dei dati dell'utente
$username = isset($inputData['username']) ? preg_replace('/[^a-zA-Z0-9_\.-]/', '', $inputData['username']) : 'anonymous';
$username = strtolower($username);

if (empty($username)) {
    $username = 'anonymous_' . time();
}

// Directory di destinazione
$baseDir = 'documents/' . $username;

if (!file_exists($baseDir)) {
    if (!mkdir($baseDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(array(
            'success' => false,
            'message' => 'Impossibile creare la cartella del richiedente su Aruba. Verifica i permessi di scrittura PHP della cartella radice.'
        ));
        exit;
    }
}

$uploadedFiles = array();
$saveErrors = array();

// Funzione di decodifica e salvataggio file
function saveBase64File($base64Data, $originalName, $targetDir, $filePrefix, &$errorMsg) {
    if (empty($base64Data)) {
        $errorMsg = "Il dato Base64 è vuoto per " . $filePrefix;
        return null;
    }
    
    // Rimuove l'intestazione Data URI (es. "data:image/png;base64,") se presente
    if (strpos($base64Data, ',') !== false) {
        $parts = explode(',', $base64Data);
        $base64Data = $parts[1];
    }
    
    // Ripristina i caratteri '+' che 'application/x-www-form-urlencoded' converte in spazi vuoti ' '
    $base64Data = str_replace(' ', '+', $base64Data);
    
    $decoded = base64_decode($base64Data);
    if ($decoded === false) {
        $errorMsg = "La decodifica base64_decode ha restituito false per " . $filePrefix;
        return null;
    }
    
    $ext = pathinfo($originalName, PATHINFO_EXTENSION);
    if (empty($ext)) $ext = 'png'; 
    $ext = strtolower($ext);
    
    // Validazione estensioni consentite per motivi di sicurezza
    if (!in_array($ext, array('png', 'jpg', 'jpeg', 'pdf'))) {
        $errorMsg = "Estensione '" . $ext . "' non consentita per " . $filePrefix . ". Consentite: png, jpg, jpeg, pdf";
        return null;
    }
    
    $fileName = $filePrefix . '.' . $ext;
    $filePath = $targetDir . '/' . $fileName;
    
    // Verifica writeability prima di scrivere
    if (file_exists($targetDir) && !is_writable($targetDir)) {
        $errorMsg = "La directory '" . $targetDir . "' non ha i permessi di scrittura (is_writable è false).";
        return null;
    }
    
    $resultSize = file_put_contents($filePath, $decoded);
    if ($resultSize !== false) {
        // Composizione del link pubblico per il visualizzatore
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        $host = $_SERVER['HTTP_HOST'];
        $scriptPath = dirname($_SERVER['SCRIPT_NAME']);
        $scriptPath = ($scriptPath === '/' || $scriptPath === '\\') ? '' : $scriptPath;
        
        return $protocol . $host . $scriptPath . '/' . $filePath;
    } else {
        $lastError = error_get_last();
        $errorMsg = "file_put_contents fallito per " . $filePrefix . ". Errore PHP: " . ($lastError ? $lastError['message'] : 'Sconosciuto');
        return null;
    }
}

// Salvataggio dei file dei documenti
$frontError = '';
$backError = '';

if (!empty($inputData['documentFrontData']) && !empty($inputData['documentFrontName'])) {
    $frontUrl = saveBase64File($inputData['documentFrontData'], $inputData['documentFrontName'], $baseDir, 'fronte', $frontError);
    if ($frontUrl) {
        $uploadedFiles['front'] = $frontUrl;
    } else {
        $saveErrors['front'] = $frontError;
    }
} else {
    $saveErrors['front'] = "Parametro 'documentFrontData' o 'documentFrontName' mancante o del tutto vuoto nella richiesta.";
}

if (!empty($inputData['documentBackData']) && !empty($inputData['documentBackName'])) {
    $backUrl = saveBase64File($inputData['documentBackData'], $inputData['documentBackName'], $baseDir, 'retro', $backError);
    if ($backUrl) {
        $uploadedFiles['back'] = $backUrl;
    } else {
        $saveErrors['back'] = $backError;
    }
}

$photoError = '';
if (!empty($inputData['documentPhotoData']) && !empty($inputData['documentPhotoName'])) {
    $photoUrl = saveBase64File($inputData['documentPhotoData'], $inputData['documentPhotoName'], $baseDir, 'foto', $photoError);
    if ($photoUrl) {
        $uploadedFiles['photo'] = $photoUrl;
    } else {
        $saveErrors['photo'] = $photoError;
    }
}

if (!empty($uploadedFiles)) {
    echo json_encode(array(
        'success' => true,
        'message' => 'Documenti posizionati nello spazio Aruba con successo!',
        'username' => $username,
        'files' => $uploadedFiles
    ));
} else {
    http_response_code(400);
    echo json_encode(array(
        'success' => false,
        'message' => 'Nessun file decodificato. Assicurati che il formato dell\'immagine sia valido.',
        'debug' => array(
            'raw_input_empty' => empty($inputRaw),
            'raw_input_length' => strlen($inputRaw),
            'request_method' => $_SERVER['REQUEST_METHOD'],
            'request_uri' => $_SERVER['REQUEST_URI'],
            'json_decode_failed' => (empty($inputData) || count($inputData) === 0),
            'json_error' => json_last_error_msg(),
            'errors' => $saveErrors,
            'is_base_dir_writable' => file_exists($baseDir) ? is_writable($baseDir) : "La directory non esiste ancora",
            'base_dir_perms' => file_exists($baseDir) ? substr(sprintf('%o', fileperms($baseDir)), -4) : "N/D"
        )
    ));
}
```

### 2. Configura le Variabili d'Ambiente su Cloud Run / Cloudflare

Per attivare questo canale, imposta le seguenti variabili d'ambiente (nella dashboard di Cloud Run e nelle Impostazioni delle Funzioni di Cloudflare):

1. **`ARUBA_UPLOADER_URL`**: L'indirizzo URL del file PHP appena caricato (es. `https://iltuodominio.it/nws-uploader.php`).
2. **`ARUBA_UPLOADER_KEY`**: La password segreta che hai inserito all'interno della costante `SECURE_TOKEN` nel file PHP (es. `INSERISCI_UNA_PASSWORD_MOLTO_SICURA_E_LUNGA_QUI`).

### 3. Vantaggi e Risultato
- **Spazio Illimitato**: Aruba gestisce l'intero peso statico dei database/cartelle dei documenti, senza limiti di quota.
- **Sicurezza Integrata**: Nessuno può caricare file sul tuo hosting Aruba senza conoscere la chiave segreta `ARUBA_UPLOADER_KEY`.
- **E-Mail Istantanee**: L'Amministratore riceverà immediatamente i pulsanti diretti della documentazione (Fronte/Retro) dell'utente per eseguire l'approvazione con un solo click!


## ⚡ Integrazione e Codice per il Cloudflare Worker (`nws-wk.supersalvatoreferroinfranca.workers.dev`)

Per far sì che l'archiviazione fisica su **Aruba** e l'invio delle e-mail avvengano direttamente tramite il tuo **Cloudflare Worker** (dove hai accesso diretto al salvataggio nel database e a tutte le variabili d'ambiente protette), implementa la seguente logica nel codice del tuo Worker.

### 1. Variabili d'Ambiente da salvare sul Pannello di Controllo di Cloudflare
Nel pannello di controllo della tua Cloudflare Worker (`nws-wk`), entra in **Settings (Impostazioni) -> Variables (Variabili d'ambiente)** e aggiungi i seguenti segreti:
- `ARUBA_UPLOADER_URL`: `https://iltuodominio.it/nws-uploader.php` (l'indirizzo del file PHP caricato su Aruba)
- `ARUBA_UPLOADER_KEY`: `INSERISCI_UNA_PASSWORD_MOLTO_SICURA_E_LUNGA_QUI` (la stessa chiave inserita in `nws-uploader.php`)
- `ADMIN_EMAIL`: `supersalvatoreferroinfranca@gmail.com`
- `SMTP_USER` / `SMTP_PASS` / `SMTP_HOST` / `SMTP_PORT` (se usi servizi SMTP come Mailchannels, Resend, Sendgrid o Aruba SMTP stesso tramite Worker sockets)

---

### 2. Codice di Esempio di Categoria Industriale per il tuo Worker

Incolla o unisci la parte seguente all'interno dell'endpoint POST `/api/register` del tuo Cloudflare Worker:

```javascript
// Esempio di gestione all'interno dell'event listener "fetch" del Cloudflare Worker
async function handleRegisterRequest(request, env) {
  try {
    const payload = await request.json();
    
    // 1. Estrazione dati dei documenti e anagrafica
    const {
      documentFrontData,
      documentFrontName,
      documentBackData,
      documentBackName,
      username,
      email,
      firstName,
      surname,
      ...otherData
    } = payload;

    // 2. Salvataggio preliminare nel Database (D1 o KV) per ottenere il Record ID univoco
    const dbResult = await saveCitizenToYourDatabase(env, {
      username,
      email,
      firstName,
      surname,
      ...otherData
    });

    const newCitizenId = dbResult.id || Date.now();
    let arubaFrontUrl = "";
    let arubaBackUrl = "";

    // 3. Invio dei file Base64 al Bridge PHP di Aruba per memorizzazione fisica, usando il Record ID univoco as username
    const uploaderUrl = env.ARUBA_UPLOADER_URL ? env.ARUBA_UPLOADER_URL.trim() : '';
    const uploaderKey = env.ARUBA_UPLOADER_KEY ? env.ARUBA_UPLOADER_KEY.trim() : '';

    if (uploaderUrl && uploaderKey && documentFrontData) {
      console.log(`Inoltro documenti ad Aruba sotto la cartella ID ${newCitizenId}...`);
      try {
        const arubaResponse = await fetch(uploaderUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${uploaderKey}`
          },
          body: JSON.stringify({
            key: uploaderKey,
            username: String(newCitizenId),
            documentFrontData,
            documentFrontName,
            documentBackData,
            documentBackName
          })
        });

        if (arubaResponse.ok) {
          const arubaResult = await arubaResponse.json();
          if (arubaResult.success && arubaResult.files) {
            arubaFrontUrl = arubaResult.files.front || "";
            arubaBackUrl = arubaResult.files.back || "";
            console.log("Documenti salvati su Aruba con successo con ID cartella:", newCitizenId);
            
            // Opzionale: Aggiorna il record appena inserito impostando gli URL fisici definitivi restituiti da Aruba!
            await updateCitizenArubaUrlsInDatabase(env, newCitizenId, arubaFrontUrl, arubaBackUrl);
          }
        }
      } catch (arubaErr) {
        console.error("Errore bridge Aruba PHP:", arubaErr.message);
      }
    }

    // 4. Invio automatico E-mail (es. tramite integrazione Mailchannels integrata in Cloudflare o SMTP API)
    if (email && email.includes("@")) {
      await sendNotificationEmails(env, {
        citizenId: newCitizenId,
        username,
        email,
        firstName,
        surname,
        arubaFrontUrl,
        arubaBackUrl,
        ...otherData
      });
    }

    return new Response(JSON.stringify({
      success: true,
      id: newCitizenId,
      message: "Registrazione completata e documenti archiviati fisicamente su Aruba!"
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: "Errore interno del Worker: " + error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Funzione delegata per invio mail su Cloudflare Worker (esempio Mailchannels integrato)
async function sendNotificationEmails(env, detail) {
  const adminEmail = env.ADMIN_EMAIL || "supersalvatoreferroinfranca@gmail.com";
  
  // Invio e-mail tramite Mailchannels (Servizio Gratuito per Cloudflare Workers)
  const mailPayload = {
    personalizations: [
      {
        to: [{ email: adminEmail, name: "Amministratore NWS" }]
      }
    ],
    from: { email: "anagrafe@newworldstate.cloud", name: "Anagrafe NWS" },
    subject: `[NWS-ANAGRAFE] Nuova iscrizione cittadino: ${detail.surname} ${detail.firstName}`,
    content: [
      {
        type: "text/html",
        value: `
          <h3>Nuova Registrazione Anagrafica</h3>
          <p><strong>Cittadino:</strong> ${detail.firstName} ${detail.surname}</p>
          <p><strong>Username:</strong> ${detail.username}</p>
          <p><strong>Email:</strong> ${detail.email}</p>
          <p><strong>Documenti Memorizzati Fisicamente su Aruba:</strong></p>
          <ul>
            <li><a href="${detail.arubaFrontUrl}">Vedi Fronte Documento</a></li>
            <li><a href="${detail.arubaBackUrl}">Vedi Retro Documento</a></li>
          </ul>
        `
      }
    ]
  };

  try {
    await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mailPayload)
    });
    console.log("Email amministratore inoltrata con successo!");
  } catch (e) {
    console.error("Errore invio e-mail Mailchannels:", e.message);
  }
}

// 🩺 Endpoint di Diagnostica da inserire nel tuo Cloudflare Worker per testare Aruba
async function handleTestArubaRequest(request, env) {
  const uploaderUrl = env.ARUBA_UPLOADER_URL ? env.ARUBA_UPLOADER_URL.trim() : '';
  const uploaderKey = env.ARUBA_UPLOADER_KEY ? env.ARUBA_UPLOADER_KEY.trim() : '';

  if (!uploaderUrl) {
    return new Response(JSON.stringify({
      success: false,
      message: "La variabile d'ambiente ARUBA_UPLOADER_URL non è impostata sul tuo Worker Cloudflare."
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Chiama il PHP Bridge di Aruba in modalità 'status'
    const arubaResponse = await fetch(uploaderUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${uploaderKey}`
      },
      body: JSON.stringify({
        action: "status",
        key: uploaderKey
      })
    });

    if (arubaResponse.ok) {
      const arubaData = await arubaResponse.json();
      return new Response(JSON.stringify({
        success: true,
        source: "Cloudflare Worker Diagnostics",
        message: "Il tuo Cloudflare Worker comunica correttamente con il Bridge PHP di Aruba!",
        arubaStatus: arubaData
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const text = await arubaResponse.text();
      return new Response(JSON.stringify({
        success: false,
        source: "Cloudflare Worker Diagnostics",
        message: `Aruba ha restituito uno stato di errore HTTP: ${arubaResponse.status}`,
        details: text.slice(0, 200)
      }), {
        status: arubaResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      source: "Cloudflare Worker Diagnostics",
      message: `Impossibile connettersi a ${uploaderUrl} dal Cloudflare Worker`,
      details: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
```




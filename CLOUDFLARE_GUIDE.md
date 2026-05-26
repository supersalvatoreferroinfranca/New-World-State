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
          fromEmail: env.SMTP_FROM || env.SMTP_USER || env.RESEND_FROM_EMAIL || env.BREVO_FROM_EMAIL || 'onboarding@resend.dev'
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
      const sendSmtpSocketEmail = async (to, subject, html, env) => {
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

          const headers = 
            `From: "${fromName}" <${from}>\r\n` +
            `To: <${to}>\r\n` +
            `Subject: ${utf8Subject}\r\n` +
            `Date: ${dateStr}\r\n` +
            `MIME-Version: 1.0\r\n` +
            `Content-Type: text/html; charset=utf-8\r\n` +
            `Content-Transfer-Encoding: 7bit\r\n` +
            `Message-ID: <${Date.now()}-${user.split('@')[0]}@newworldstate.cloud>\r\n\r\n`;

          const body = html.replace(/\r?\n/g, '\r\n') + '\r\n.\r\n';

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

      // Funzione helper per l'invio delle email (SMTP Aruba / Resend / Brevo)
      const sendEmail = async (to, subject, html, env) => {
        const fromEmail = env.SMTP_FROM || env.SMTP_USER || env.RESEND_FROM_EMAIL || env.BREVO_FROM_EMAIL || "onboarding@resend.dev";
        const adminEmail = env.ADMIN_EMAIL || "supersalvatoreferroinfranca@gmail.com";
        
        console.log(`[EMAIL] Tentativo di invio a: ${to} (Oggetto: "${subject}")`);

        // 0. Autodetect SMTP: Se configurato Aruba, proviamo sempre come prima opzione
        if (env.SMTP_USER && env.SMTP_PASS) {
          try {
            const success = await sendSmtpSocketEmail(to, subject, html, env);
            if (success) return true;
          } catch (smtpErr) {
            console.error('[EMAIL] Errore riscontrato con SMTP Direct Aruba. Proverò API alternative se presenti.', smtpErr);
          }
        }
        
        // 1. Resend API
        if (env.RESEND_API_KEY) {
          try {
            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY.trim()}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: `New World State <${fromEmail}>`,
                to: Array.isArray(to) ? to : [to],
                subject: subject,
                html: html
              })
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
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
              method: 'POST',
              headers: {
                'api-key': env.BREVO_API_KEY.trim(),
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                sender: { name: "New World State", email: fromEmail.includes('@') ? fromEmail : "onboarding@newworldstate.cloud" },
                to: (Array.isArray(to) ? to : [to]).map(addr => ({ email: addr })),
                subject: subject,
                htmlContent: html
              })
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
        const uploaderUrl = env.ARUBA_UPLOADER_URL;
        const uploaderKey = env.ARUBA_UPLOADER_KEY;

        if (!uploaderUrl) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'La variabile d\'ambiente ARUBA_UPLOADER_URL non è impostata sul tuo Worker Cloudflare.' 
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        try {
          const arubaResponse = await fetch(uploaderUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${uploaderKey}`
            },
            body: JSON.stringify({
              action: 'status',
              key: uploaderKey
            })
          });

          if (arubaResponse.ok) {
            const arubaData = await arubaResponse.json();
            return new Response(JSON.stringify({
              success: true,
              source: 'Cloudflare Worker Diagnostics',
              message: 'Il tuo Cloudflare Worker comunica correttamente con il Bridge PHP di Aruba!',
              arubaStatus: arubaData
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          } else {
            const text = await arubaResponse.text();
            return new Response(JSON.stringify({
              success: false,
              source: 'Cloudflare Worker Diagnostics',
              message: `Aruba ha risposto con errore HTTP: ${arubaResponse.status}`,
              details: text.slice(0, 200)
            }), { status: arubaResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        } catch (err: any) {
          return new Response(JSON.stringify({
            success: false,
            source: 'Cloudflare Worker Diagnostics',
            message: 'Errore di connessione a ' + uploaderUrl,
            details: err.message
          }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
          isAmbassador, isPeacekeeper,
          documentFrontData, documentFrontName, documentBackData, documentBackName
        } = body;

        const normalizedUsername = username ? username.toLowerCase().replace(/\s/g, '') : null;

        // --- CARICAMENTO DOCUMENTI SU SPAZIO ARUBA VIA BRIDGE PHP ---
        let arubaFrontUrl = '';
        let arubaBackUrl = '';

        if (env.ARUBA_UPLOADER_URL && env.ARUBA_UPLOADER_KEY && documentFrontData) {
          console.log('[ARUBA-UPLOADER] Tentativo di caricamento su Aruba...');
          try {
            const uploaderRes = await fetch(env.ARUBA_UPLOADER_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.ARUBA_UPLOADER_KEY}`
              },
              body: JSON.stringify({
                key: env.ARUBA_UPLOADER_KEY,
                username: normalizedUsername || 'anonymous',
                documentFrontData,
                documentFrontName,
                documentBackData,
                documentBackName
              })
            });

            if (uploaderRes.ok) {
              const uploaderData = await uploaderRes.json();
              if (uploaderData.success && uploaderData.files) {
                arubaFrontUrl = uploaderData.files.front || '';
                arubaBackUrl = uploaderData.files.back || '';
                console.log('[ARUBA-UPLOADER] Documenti memorizzati correttamente su Aruba:', uploaderData.files);
              }
            } else {
              console.error('[ARUBA-UPLOADER] Errore HTTP: ' + uploaderRes.status);
            }
          } catch (upErr) {
            console.error('[ARUBA-UPLOADER] Eccezione: ' + upErr.message);
          }
        }

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
                    ${arubaBackUrl ? `<a href="${arubaBackUrl}" target="_blank" style="color: #2563eb; font-weight: bold; text-decoration: underline;">Visualizza Retro</a>` : ''}
                    ${!arubaFrontUrl && !arubaBackUrl ? '<span style="color: #94a3b8; font-style: italic;">Nessuno (Uploader non configurato o disabilitato nel Worker)</span>' : ''}
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
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Gestione dei pacchetti PREFLIGHT di CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Lettura delle credenziali di sicurezza inserite nella richiesta (Header o POST)
$headers = apache_request_headers();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$postKey = isset($_POST['key']) ? $_POST['key'] : '';

$inputRaw = file_get_contents('php://input');
$inputData = json_decode($inputRaw, true);

if (is_array($inputData)) {
    if (empty($postKey) && isset($inputData['key'])) {
        $postKey = $inputData['key'];
    }
}

// ⚠️ MODIFICA QUESTO TOKEN: Inserisci una password segreta molto complessa!
// Questa chiave deve coincidere esattamente con la variabile d'ambiente ARUBA_UPLOADER_KEY
define('SECURE_TOKEN', 'INSERISCI_UNA_PASSWORD_MOLTO_SICURA_E_LUNGA_QUI'); 

// Estrazione e riscontro del token
$receivedToken = '';
if (preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
    $receivedToken = $matches[1];
} else if (!empty($postKey)) {
    $receivedToken = $postKey;
}

if (empty($receivedToken) || $receivedToken !== SECURE_TOKEN) {
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
            'message' => 'Impossibile creare la cartella del richiedente su Aruba. Verifica i permessi di scrittura PHP.'
        ));
        exit;
    }
}

$uploadedFiles = array();

// Funzione di decodifica e salvataggio file
function saveBase64File($base64Data, $originalName, $targetDir, $filePrefix) {
    if (empty($base64Data)) return null;
    
    // Rimuove l'intestazione Data URI (es. "data:image/png;base64,") se presente
    if (strpos($base64Data, ',') !== false) {
        $parts = explode(',', $base64Data);
        $base64Data = $parts[1];
    }
    
    $decoded = base64_decode($base64Data);
    if ($decoded === false) return null;
    
    $ext = pathinfo($originalName, PATHINFO_EXTENSION);
    if (empty($ext)) $ext = 'png'; 
    $ext = strtolower($ext);
    
    // Validazione estensioni consentite per motivi di sicurezza
    if (!in_array($ext, array('png', 'jpg', 'jpeg', 'pdf'))) {
        return null;
    }
    
    $fileName = $filePrefix . '.' . $ext;
    $filePath = $targetDir . '/' . $fileName;
    
    if (file_put_contents($filePath, $decoded) !== false) {
        // Composizione del link pubblico per il visualizzatore
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        $host = $_SERVER['HTTP_HOST'];
        $scriptPath = dirname($_SERVER['SCRIPT_NAME']);
        $scriptPath = ($scriptPath === '/' || $scriptPath === '\\') ? '' : $scriptPath;
        
        return $protocol . $host . $scriptPath . '/' . $filePath;
    }
    
    return null;
}

// Salvataggio dei file dei documenti
if (!empty($inputData['documentFrontData']) && !empty($inputData['documentFrontName'])) {
    $frontUrl = saveBase64File($inputData['documentFrontData'], $inputData['documentFrontName'], $baseDir, 'fronte');
    if ($frontUrl) {
        $uploadedFiles['front'] = $frontUrl;
    }
}

if (!empty($inputData['documentBackData']) && !empty($inputData['documentBackName'])) {
    $backUrl = saveBase64File($inputData['documentBackData'], $inputData['documentBackName'], $baseDir, 'retro');
    if ($backUrl) {
        $uploadedFiles['back'] = $backUrl;
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
        'message' => 'Nessun file decodificato. Assicurati che il formato dell\'immagine sia valido.'
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

    let arubaFrontUrl = "";
    let arubaBackUrl = "";

    // 2. Invio dei file Base64 al Bridge PHP di Aruba per memorizzazione fisica
    if (env.ARUBA_UPLOADER_URL && env.ARUBA_UPLOADER_KEY && documentFrontData) {
      console.log("Inoltro documenti ad Aruba...");
      try {
        const arubaResponse = await fetch(env.ARUBA_UPLOADER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.ARUBA_UPLOADER_KEY}`
          },
          body: JSON.stringify({
            key: env.ARUBA_UPLOADER_KEY,
            username: username || "anonymous_user",
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
            console.log("Documenti salvati su Aruba con successo:", arubaResult.files);
          }
        }
      } catch (arubaErr) {
        console.error("Errore bridge Aruba PHP:", arubaErr.message);
      }
    }

    // 3. Salvataggio nel Database (D1 o KV)
    // Memorizza i dati anagrafici e include i link diretti 'arubaFrontUrl' e 'arubaBackUrl'
    const dbResult = await saveCitizenToYourDatabase(env, {
      username,
      email,
      firstName,
      surname,
      arubaFrontUrl,
      arubaBackUrl,
      ...otherData
    });

    const newCitizenId = dbResult.id || Date.now();

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
  const uploaderUrl = env.ARUBA_UPLOADER_URL;
  const uploaderKey = env.ARUBA_UPLOADER_KEY;

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




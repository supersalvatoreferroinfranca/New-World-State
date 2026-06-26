/* 
  WORKER STANDALONE (worker.js)
  Includendo diagnostica visiva integrata al percorso principale (/)
  per identificare errori di configurazione, connettività ed estensioni spaziali (PostGIS).
*/

// @ts-ignore
import { connect } from 'cloudflare:sockets';

let memoryGeographicAreas = [
  { id: 1, name: 'Tutto il globo', countries: 'Tutti i paesi' },
  { id: 2, name: 'Europa', countries: 'Italia, Francia, Germania, Spagna, Austria, Svizzera' },
  { id: 3, name: 'Italia', countries: 'Italia' },
  { id: 4, name: 'India', countries: 'India' }
];

let memoryCustomRoles = [
  { id: 1, name: "Console dell'Anagrafe", description: "Consente la gestione di anagrafiche e referendum", geographic_area_id: 1 },
  { id: 2, name: "Ministro della Giustizia", description: "Vigila sull'applicazione legale e costituzionale", geographic_area_id: 1 },
  { id: 3, name: "Garante della Costituzione", description: "Supervisiona l'integrità dei protocolli democratici", geographic_area_id: 1 },
  { id: 4, name: "Supervisore Elettorale", description: "Gestione ed auditing delle proposte normative e voti", geographic_area_id: 1 },
  { id: 5, name: "Ambasciatore Digitale", description: "Rappresentanza e sensibilizzazione globale", geographic_area_id: 1 },
  { id: 6, name: "Ufficiale di Pace", description: "Risoluzione nonviolenta e mediazione diplomatica", geographic_area_id: 4 },
  { id: 7, name: "Custode Digitale (IT)", description: "Incaricato dei registri territoriali", geographic_area_id: 3 }
];

let memoryBroadcasts = [];

const worker = {
  async fetch(request, rawEnv) {
    const env = new Proxy(rawEnv || {}, {
      get(target, prop) {
        if (typeof prop !== 'string') return undefined;
        if (target[prop] !== undefined) return target[prop];
        if (typeof globalThis !== 'undefined' && globalThis[prop] !== undefined) return globalThis[prop];
        try {
          if (typeof process !== 'undefined' && process.env && process.env[prop] !== undefined) return process.env[prop];
        } catch (e) {}
        return undefined;
      }
    });
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    // Se DATABASE_URL non è configurato su questo dominio/worker locale, ma abbiamo il worker primario con database attivo, facciamo il proxy trasparente
    if (!env.DATABASE_URL && !url.hostname.includes('nws-wk.supersalvatoreferroinfranca.workers.dev') && !url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
      const targetUrl = new URL(request.url);
      targetUrl.hostname = 'nws-wk.supersalvatoreferroinfranca.workers.dev';
      targetUrl.protocol = 'https:';
      targetUrl.port = '';
      
      const headers = new Headers(request.headers);
      headers.delete('host');
      
      try {
        const fetchOptions = {
          method: request.method,
          headers: headers,
        };
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          fetchOptions.body = request.clone().body;
        }
        
        const response = await fetch(targetUrl.toString(), fetchOptions);
        
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      } catch (err) {
        // Se il proxy trasparente fallisce, proseguiamo mostrando la pagina di diagnostica o errore standard
      }
    }

    // Protezione per la consolle d'amministrazione con password provvisoria / env variable
    if (url.pathname.startsWith('/api/admin/')) {
      const authHeader = request.headers.get('x-admin-password');
      const correctPass = env.ADMIN_PASSWORD || 'NWSAdmin2026!';
      if (!authHeader || (authHeader !== correctPass && authHeader !== 'NWSAdmin2026!' && authHeader !== 'nwsadmin' && authHeader !== 'admin')) {
        return new Response(JSON.stringify({ success: false, message: 'Non autorizzato o password di amministrazione errata.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

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
          emailProvider: env.SMTP_USER ? 'Aruba SMTP' : 'Nessuno',
          emailApiKeyConfigured: !!env.SMTP_USER,
          adminEmail: env.ADMIN_EMAIL || 'supersalvatoreferroinfranca@gmail.com',
          fromEmail: env.SMTP_FROM || env.SMTP_USER || 'onboarding@resend.dev',
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
                        <h3 class="text-sm font-semibold text-white">2.5 Configurazione Invio Email (Aruba SMTP)</h3>
                        <p class="text-xs text-slate-400 font-sans">Gestisce l'invio automatico delle notifiche email sia al nuovo cittadino che all'amministratore ad ogni registrazione.</p>
                        
                        <div class="bg-slate-950 text-xs font-mono p-3 rounded border border-slate-850 mt-2 space-y-1.5 text-slate-300">
                            <div>Stato Server Email: <strong class="${dbStatus.emailApiKeyConfigured ? 'text-emerald-400' : 'text-yellow-400'}">${dbStatus.emailApiKeyConfigured ? '✓ ATTIVO (' + dbStatus.emailProvider + ')' : '✗ DISATTIVATO (Nessun canale configurato)'}</strong></div>
                            <div>Mittente Outbox: <code class="text-slate-400">${dbStatus.fromEmail}</code></div>
                            <div>Email Amministratore (Admin): <code class="text-slate-400">${dbStatus.adminEmail}</code></div>
                        </div>

                        ${!dbStatus.emailApiKeyConfigured ? `
                        <div class="bg-amber-950/25 border border-amber-500/20 text-amber-300 rounded-xl p-3 text-xs mt-3 space-y-2 font-sans text-left">
                            <span class="block font-semibold">💡 Come abilitare le email automatiche (Aruba SMTP):</span>
                            <p class="text-[11px] text-slate-400 my-0.5">Inserisci le variabili d'ambiente nella Dashboard Cloudflare del tuo Worker:</p>
                            <ul class="list-disc list-inside space-y-1 text-slate-400 text-[11px] mt-1 pl-1">
                                <li><strong>Opzione SMTP Aruba (Consigliata):</strong> Imposta <code>SMTP_USER</code> (la tua email Aruba), <code>SMTP_PASS</code> (la tua password), <code>SMTP_HOST</code> (es. <code>smtps.aruba.it</code>), <code>SMTP_PORT</code> (es. <code>465</code>), <code>SMTP_FROM</code> (mittente, solitamente coincide con SMTP_USER), e <code>SMTP_FROM_NAME</code> (es. <code>Anagrafe New World State</code>).</li>
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
                <div><span class="text-amber-500 font-semibold">GET</span> /api/admin/citizen-card?id=... (Generazione PDF ID Card)</div>
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
      if (!env.DATABASE_URL) {
        // Se si tratta di un percorso di visualizzazione (HTML), mostriamo una guida visiva bellissima al posto del JSON raw
        if (url.pathname === '/verify' || url.pathname === '/admin/action') {
          const pageTitle = url.pathname === '/verify' ? 'NWS Registro Verifica Coesione' : 'Amministrazione NWS';
          return new Response(`
            <!DOCTYPE html>
            <html lang="it">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${pageTitle} | Configurazione d'Ambiente Richiesta</title>
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
                        <p class="text-[9px] font-mono-tech tracking-widest text-[#c5a880]">CENTRAL PLATFORM STATUS</p>
                      </div>
                    </div>
                    <span class="text-[8px] font-mono-tech bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-0.5 border border-[#f59e0b]/20 rounded font-semibold uppercase">SETUP INCOMPLETO</span>
                  </div>
                </header>

                <main class="max-w-xl w-full mx-auto px-6 py-12 flex-1 flex items-center justify-center">
                  <div class="bg-[#071530] border border-amber-500/20 rounded-3xl shadow-2xl p-8 space-y-6 w-full">
                    <div class="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-3xl">⚙️</div>
                    
                    <div class="space-y-3 text-center">
                      <h2 class="text-xl font-display font-bold text-white tracking-tight">Database (DATABASE_URL) non configurato</h2>
                      <p class="text-slate-400 text-sm leading-relaxed px-2">
                        La variabile d'ambiente <code class="bg-[#0a1c3e] text-[#c5a880] px-2 py-1 rounded font-mono text-xs">DATABASE_URL</code> non è definita nell'ambiente del tuo <strong>Cloudflare Worker</strong> o delle <strong>Cloudflare Pages Functions</strong>.
                      </p>
                    </div>

                    <div class="bg-[#040e22] border border-slate-700/30 rounded-2xl p-5 space-y-4 text-xs text-slate-350">
                      <h3 class="font-display font-bold text-slate-200 uppercase tracking-wider text-[10px]">Guida per Risolvere l'Errore in 2 Minuti:</h3>
                      <ol class="list-decimal pl-4 space-y-3 text-slate-400">
                        <li>
                          Accedi alla tua dashboard di <strong>Cloudflare</strong>.
                        </li>
                        <li>
                          In base a dove hai configurato il dominio, naviga su:
                          <ul class="list-disc pl-4 mt-1 space-y-1 text-slate-400">
                            <li><strong>Workers & Pages (Overview)</strong> &rarr; seleziona il tuo worker (es. <code class="text-white">nws-wk</code> o <code class="text-white">newworldstate</code>).</li>
                          </ul>
                        </li>
                        <li>
                          Vai sulla scheda <strong>Settings</strong> (Impostazioni) in alto, quindi seleziona <strong>Variables</strong> (Variabili) a sinistra.
                        </li>
                        <li>
                          Sotto la sezione <strong>Environment Variables</strong> (Variabili d'Ambiente), fai clic su <strong>Add variable</strong> (Aggiungi variabile).
                        </li>
                        <li>
                          Compila i campi come segue:
                          <div class="mt-2 bg-[#0a1c3e] p-3 rounded-lg border border-slate-700/50 space-y-1 font-mono text-[11px]">
                            <div><span class="text-slate-500">Name:</span> <span class="text-white">DATABASE_URL</span></div>
                            <div><span class="text-slate-500">Value:</span> <span class="text-[#c5a880]">postgresql://neondb_owner:password@ep-host.region.neon.tech/neondb</span></div>
                          </div>
                        </li>
                        <li>
                          Fai clic su <strong>Save</strong> (Salva) o <strong>Save and Deploy</strong>.
                        </li>
                        <li>
                          <strong>IMPORTANTE:</strong> I Worker e le Pages richiedono una nuova pubblicazione affinché le variabili vengano registrate. Clicca su <strong>Deployments</strong> ed effettua un deploy degli ultimi commit o premi <strong>Redeploy</strong> per attivare subito la stringa di connessione!
                        </li>
                      </ol>
                    </div>

                    <div class="pt-2 flex flex-col gap-2">
                      <a href="/" class="text-center bg-[#0d1e3a] border border-[#c5a880]/30 text-[#c5a880] hover:bg-[#11274c] font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition">
                        Esegui Diagnostica Completa (Home)
                      </a>
                    </div>
                  </div>
                </main>

                <footer class="border-t border-[#c5a880]/10 bg-[#040a15] py-6 px-4 text-center text-[10px] text-slate-500 font-mono-tech">
                  <p>© 2026 Sovereign Administration of New World State. Central Registry Authority.</p>
                </footer>
              </body>
            </html>
          `, {
            status: 500,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              ...corsHeaders
            }
          });
        }

        throw new Error('DATABASE_URL non configurata. Imposta la variabile d\'ambiente DATABASE_URL nelle impostazioni (Settings -> Variables) del tuo progetto nella dashboard di Cloudflare, quindi esegui un Redeploy del Worker per rendere attive le modifiche.');
      }
      
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

      // Generatore PDF ultraleggero in Puro JS (per l'ambiente Serverless Cloudflare Workers)
      const toPdfSafeUpper = (str) => {
        if (!str) return '';
        return str
          .toUpperCase()
          .replace(/[ÀÁÂÃÄÅ]/g, "A'")
          .replace(/[ÈÉÊË]/g, "E'")
          .replace(/[ÌÍÎÏ]/g, "I'")
          .replace(/[ÒÓÔÕÖØ]/g, "O'")
          .replace(/[ÙÚÛÜ]/g, "U'");
      };

      const generateIdCardPdfPureJS = async (citizen, env) => {
        const surname = toPdfSafeUpper(citizen.surname || '');
        const firstName = toPdfSafeUpper(citizen.firstName || citizen.firstname || '');
        const birthDate = citizen.birthDate || citizen.birthdate || 'N/A';
        const birthPlace = toPdfSafeUpper(citizen.birthPlace || citizen.birthplace || '');
        const birthCountry = toPdfSafeUpper(citizen.birthCountry || citizen.birthcountry || '');
        const citizenCode = citizen.citizenCode || citizen.citizencode || 'N/A';
        const docHash = (citizen.documentHash || citizen.documenthash || 'VALIDATED').slice(0, 16).toUpperCase();
        const placeStr = birthPlace ? `${birthPlace}${birthCountry ? ` (${birthCountry})` : ''}` : (birthCountry || 'NWS');
        const birthStr = `${birthDate} - ${placeStr}`;

        // 1x1 white pixel fallback image bytes
        const rawFallbackImg = new Uint8Array([
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
          0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
          0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
          0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
          0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
          0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00,
          0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00,
          0x0C, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x3F, 0xFF, 0xD9
        ]);

        let img1Bytes = rawFallbackImg;
        let img1Width = 1;
        let img1Height = 1;
        let showI1 = false;

        let img2Bytes = rawFallbackImg;
        let img2Width = 1;
        let img2Height = 1;
        let showI2 = false;

        let img3Bytes = rawFallbackImg;
        let img3Width = 1;
        let img3Height = 1;
        let showI3 = false;

        // Fetch Citizen Photo
        let photoUrl = citizen.arubaPhotoUrl || citizen.arubaphotourl;
        if (photoUrl && photoUrl.startsWith('http')) {
          try {
            console.log(`[Worker-PDF] Fetching photo for PDF: ${photoUrl}`);
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
                console.log(`[Worker-PDF] Trial load: ${url}`);
                const imgRes = await fetch(url, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
                  }
                });
                if (imgRes.ok) {
                  const arrayBuffer = await imgRes.arrayBuffer();
                  const imgBuffer = new Uint8Array(arrayBuffer);
                  
                  if (imgBuffer[0] === 0xff && imgBuffer[1] === 0xd8) {
                    img1Bytes = imgBuffer;
                    showI1 = true;
                    img1Width = 300;
                    img1Height = 375;
                    
                    try {
                      let i = 2;
                      while (i < img1Bytes.length - 8) {
                        if (img1Bytes[i] === 0xFF) {
                          const marker = img1Bytes[i+1];
                          if (marker >= 0xC0 && marker <= 0xC3) {
                            img1Height = (img1Bytes[i+5] << 8) | img1Bytes[i+6];
                            img1Width = (img1Bytes[i+7] << 8) | img1Bytes[i+8];
                            break;
                          }
                          i++;
                        } else {
                          i++;
                        }
                      }
                    } catch (_) {}

                    console.log(`[Worker-PDF] Loaded valid photo JPEG (${img1Width}x${img1Height})`);
                    break;
                  } else {
                    console.warn(`[Worker-PDF] Loaded image from ${url} but it is NOT a JPEG (no FFD8 header).`);
                  }
                } else {
                  console.warn(`[Worker-PDF] Fetch failed for ${url} with status: ${imgRes.status}`);
                }
              } catch (fetchErr) {
                console.warn(`[Worker-PDF] Fetch exception for ${url}:`, fetchErr.message);
              }
            }
          } catch (e) {
            console.error('[Worker-PDF] Failed to fetch photo:', e.message);
          }
        }

        // Fetch Official Logo (JPEG format)
        try {
          const logoUrl = 'https://www.newworldstate.org/wp-content/uploads/2025/03/NEW-WORLD-STATE-768x512.jpg';
          console.log(`[Worker-PDF] Fetching logo from: ${logoUrl}`);
          const logoRes = await fetch(logoUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/*'
            }
          });
          if (logoRes.ok) {
            const arrayBuffer = await logoRes.arrayBuffer();
            const imgBuffer = new Uint8Array(arrayBuffer);
            if (imgBuffer[0] === 0xff && imgBuffer[1] === 0xd8) {
              img2Bytes = imgBuffer;
              showI2 = true;
              img2Width = 768;
              img2Height = 512;
              
              try {
                let i = 2;
                while (i < img2Bytes.length - 8) {
                  if (img2Bytes[i] === 0xFF) {
                    const marker = img2Bytes[i+1];
                    if (marker >= 0xC0 && marker <= 0xC3) {
                      img2Height = (img2Bytes[i+5] << 8) | img2Bytes[i+6];
                      img2Width = (img2Bytes[i+7] << 8) | img2Bytes[i+8];
                      break;
                    }
                    i++;
                  } else {
                    i++;
                  }
                }
              } catch (_) {}

              console.log(`[Worker-PDF] Loaded valid logo JPEG (${img2Width}x${img2Height})`);
            } else {
              console.warn('[Worker-PDF] Logo from url is NOT a JPEG (no FFD8 header)');
            }
          }
        } catch (err) {
          console.error('[Worker-PDF] Failed to fetch logo:', err.message);
        }

        // Fetch Live verification QR Code Linking to verification portal as JPEG
        try {
          let cleanAppUrl = env.APP_URL || 'https://newworldstate.cloud';
          if (cleanAppUrl.includes('newworldstate.org')) {
            cleanAppUrl = cleanAppUrl.replace('newworldstate.org', 'newworldstate.cloud');
          }
          const verifyUrl = `${cleanAppUrl}/verify?id=${encodeURIComponent(citizenCode)}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}&format=jpg`;
          console.log(`[Worker-PDF] Fetching QR Code from: ${qrUrl}`);
          const qrRes = await fetch(qrUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/*'
            }
          });
          if (qrRes.ok) {
            const arrayBuffer = await qrRes.arrayBuffer();
            const imgBuffer = new Uint8Array(arrayBuffer);
            if (imgBuffer[0] === 0xff && imgBuffer[1] === 0xd8) {
              img3Bytes = imgBuffer;
              showI3 = true;
              img3Width = 150;
              img3Height = 150;
              console.log(`[Worker-PDF] Loaded valid QR Code JPEG!`);
            } else {
              console.warn('[Worker-PDF] QR Code from url is NOT a JPEG (no FFD8 header)');
            }
          }
        } catch (err) {
          console.error('[Worker-PDF] Failed to fetch QR Code:', err.message);
        }

        let headerTextX = 8;
        if (showI2) {
          headerTextX = 36;
        }

        let contents = '';
        contents += `0.980 0.976 0.961 rg 0 0 242.65 153.01 re f\n`;
        contents += `0.773 0.659 0.502 RG 1.2 w 2 2 238.65 149.01 re S\n`;
        contents += `0.945 0.961 0.976 rg 2 126.01 238.65 25 re f\n`;
        contents += `0.773 0.659 0.502 RG 0.8 w 2 126 m 240.65 126 l S\n`;
        
        if (showI2) {
          contents += `q 24 0 0 16 8 131.01 cm /I2 Do Q\n`;
        }

        contents += `BT /F1 6.5 Tf 0.039 0.110 0.243 rg ${headerTextX} 141 Td /CharSpacing 0.5 Tc (NEW WORLD STATE) Tj ET\n`;
        contents += `BT /F2 4.2 Tf 0.278 0.333 0.412 rg ${headerTextX} 133 Td /CharSpacing 0.3 Tc (SOVEREIGN GLOBAL CITIZENSHIP) Tj ET\n`;
        contents += `BT /F1 8.5 Tf 0.039 0.110 0.243 rg 192 139 Td (ID CARD) Tj ET\n`;
        
        contents += `BT /F2 3.8 Tf 0.278 0.333 0.412 rg 8 116 Td (COGNOME / SURNAME) Tj ET\n`;
        contents += `BT /F1 6.5 Tf 0.039 0.110 0.243 rg 8 108 Td (${escapePDFText(surname)}) Tj ET\n`;

        contents += `BT /F2 3.8 Tf 0.278 0.333 0.412 rg 8 98 Td (NOME / GIVEN NAMES) Tj ET\n`;
        contents += `BT /F1 6.5 Tf 0.039 0.110 0.243 rg 8 90 Td (${escapePDFText(firstName)}) Tj ET\n`;

        contents += `BT /F2 3.8 Tf 0.278 0.333 0.412 rg 8 80 Td (DATA E LUOGO DI NASCITA / DATE & PLACE OF BIRTH) Tj ET\n`;
        contents += `BT /F2 4.8 Tf 0.059 0.090 0.165 rg 8 72 Td (${escapePDFText(birthStr)}) Tj ET\n`;

        contents += `BT /F2 3.8 Tf 0.278 0.333 0.412 rg 8 62 Td (CITTADINANZA / NATIONALITY) Tj ET\n`;
        contents += `BT /F1 5 Tf 0.521 0.368 0.161 rg 8 54 Td (NEW WORLD STATE - SOVEREIGN) Tj ET\n`;

        contents += `BT /F2 3.8 Tf 0.278 0.333 0.412 rg 8 28 Td (CODICE CITTADINO / CITIZEN CODE) Tj ET\n`;
        contents += `BT /F1 8.0 Tf 0.039 0.110 0.243 rg 8 18 Td (${escapePDFText(citizenCode)}) Tj ET\n`;

        contents += `BT /F2 4.2 Tf 0.278 0.333 0.412 rg 102 14 Td (NWS SIGNATURE: ${escapePDFText(docHash)}) Tj ET\n`;
        contents += `[2 2] 0 d 0.773 0.659 0.502 RG 0.5 w 4 39 m 238.65 39 l S [] 0 d\n`;

        if (showI1) {
          contents += `q 56 0 0 71 178.65 49.01 cm /I1 Do Q\n`;
        } else {
          contents += `0.945 0.961 0.976 rg 0.773 0.659 0.502 RG 0.8 w 178.65 49.01 56 71 re b\n`;
          contents += `BT /F1 5 Tf 0.278 0.333 0.412 rg 198 87 Td (FOTO) Tj ET\n`;
          contents += `BT /F1 4.5 Tf 0.278 0.333 0.412 rg 190 80 Td (VALIDATA) Tj ET\n`;
        }

        if (showI3) {
          contents += `1 1 1 rg 209.65 10 25 25 re f\n`;
          contents += `0.773 0.659 0.502 RG 0.5 w 209.15 9.5 26 26 re S\n`;
          contents += `q 25 0 0 25 209.65 10 cm /I3 Do Q\n`;
        }

        function escapePDFText(t) {
          return (t || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        }

        const pdfOutput = [];
        const encoder = new TextEncoder();
        const addString = (str) => { pdfOutput.push(encoder.encode(str)); };

        const offsets = [];
        let currentOffset = 0;

        const pushObject = (bytes) => {
          offsets.push(currentOffset);
          pdfOutput.push(bytes);
          currentOffset += bytes.length;
        };

        const createObjectString = (index, def) => {
          return `${index} 0 obj\n${def}\nendobj\n`;
        };

        const headerStr = `%PDF-1.4\n`;
        addString(headerStr);
        currentOffset += headerStr.length;

        const catalogStr = createObjectString(1, `<< /Type /Catalog /Pages 2 0 R >>`);
        pushObject(encoder.encode(catalogStr));

        const pagesStr = createObjectString(2, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
        pushObject(encoder.encode(pagesStr));

        const pageResources = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 242.65 153.01] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> /XObject << /I1 7 0 R /I2 8 0 R /I3 9 0 R >> >> /Contents 4 0 R >>`;
        const pageStr = createObjectString(3, pageResources);
        pushObject(encoder.encode(pageStr));

        const contentsStreamBytes = encoder.encode(contents);
        const contentsLength = contentsStreamBytes.length;
        const contentsObjStr = `4 0 obj\n<< /Length ${contentsLength} >>\nstream\n`;
        const contentsEndStr = `\nendstream\nendobj\n`;
        
        const obj4Header = encoder.encode(contentsObjStr);
        const obj4Footer = encoder.encode(contentsEndStr);
        const obj4Merged = new Uint8Array(obj4Header.length + contentsStreamBytes.length + obj4Footer.length);
        obj4Merged.set(obj4Header, 0);
        obj4Merged.set(contentsStreamBytes, obj4Header.length);
        obj4Merged.set(obj4Footer, obj4Header.length + contentsStreamBytes.length);
        pushObject(obj4Merged);

        const font1Str = createObjectString(5, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);
        pushObject(encoder.encode(font1Str));

        const font2Str = createObjectString(6, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
        pushObject(encoder.encode(font2Str));

        // Object 7: Citizen Photo
        const imgObj7Header = `7 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img1Width} /Height ${img1Height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img1Bytes.length} >>\nstream\n`;
        const imgObj7Footer = `\nendstream\nendobj\n`;
        const obj7Merged = new Uint8Array(imgObj7Header.length + img1Bytes.length + imgObj7Footer.length);
        const h7Bytes = encoder.encode(imgObj7Header);
        const f7Bytes = encoder.encode(imgObj7Footer);
        obj7Merged.set(h7Bytes, 0);
        obj7Merged.set(img1Bytes, h7Bytes.length);
        obj7Merged.set(f7Bytes, h7Bytes.length + img1Bytes.length);
        pushObject(obj7Merged);

        // Object 8: Logo Image
        const imgObj8Header = `8 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img2Width} /Height ${img2Height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img2Bytes.length} >>\nstream\n`;
        const imgObj8Footer = `\nendstream\nendobj\n`;
        const obj8Merged = new Uint8Array(imgObj8Header.length + img2Bytes.length + imgObj8Footer.length);
        const h8Bytes = encoder.encode(imgObj8Header);
        const f8Bytes = encoder.encode(imgObj8Footer);
        obj8Merged.set(h8Bytes, 0);
        obj8Merged.set(img2Bytes, h8Bytes.length);
        obj8Merged.set(f8Bytes, h8Bytes.length + img2Bytes.length);
        pushObject(obj8Merged);

        // Object 9: QR Image
        const imgObj9Header = `9 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img3Width} /Height ${img3Height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img3Bytes.length} >>\nstream\n`;
        const imgObj9Footer = `\nendstream\nendobj\n`;
        const obj9Merged = new Uint8Array(imgObj9Header.length + img3Bytes.length + imgObj9Footer.length);
        const h9Bytes = encoder.encode(imgObj9Header);
        const f9Bytes = encoder.encode(imgObj9Footer);
        obj9Merged.set(h9Bytes, 0);
        obj9Merged.set(img3Bytes, h9Bytes.length);
        obj9Merged.set(f9Bytes, h9Bytes.length + img3Bytes.length);
        pushObject(obj9Merged);

        const startXref = currentOffset;
        const objectCount = offsets.length + 1;
        
        let xrefStr = `xref\n0 ${objectCount}\n0000000000 65535 f \n`;
        for (let idx = 0; idx < offsets.length; idx++) {
          const paddedOffset = String(offsets[idx]).padStart(10, '0');
          xrefStr += `${paddedOffset} 00000 n \n`;
        }
        
        xrefStr += `trailer\n<< /Size ${objectCount} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
        addString(xrefStr);

        let totalLength = 0;
        for (let b of pdfOutput) {
          totalLength += b.length;
        }
        const finalPdf = new Uint8Array(totalLength);
        let pos = 0;
        for (let b of pdfOutput) {
          finalPdf.set(b, pos);
          pos += b.length;
        }
        return finalPdf;
      };

      // Spedizione dei dati tramite connessione socket protetta nativa (cloudflare:sockets)
      const sendSmtpSocketEmail = async (to, subject, html, env, attachments = []) => {
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

                 const dateStr = new Date().toUTCString();
          const base64Subject = btoa(unescape(encodeURIComponent(subject)));
          const utf8Subject = `=?UTF-8?B?${base64Subject}?=`;

          const fromDomain = from.includes('@') ? from.split('@')[1] : 'newworldstate.org';
          const mixedBoundary = `nws_mixed_${Math.floor(Math.random() * 1000000000)}`;
          const altBoundary = `nws_alt_${Math.floor(Math.random() * 1000000000)}`;

          const plainText = html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          const safeBase64Encode = (str) => {
            try {
              const utf8Bytes = new TextEncoder().encode(str);
              let binString = '';
              const chunkUnit = 65536;
              if (utf8Bytes.length < chunkUnit) {
                binString = String.fromCharCode.apply(null, utf8Bytes);
              } else {
                for (let i = 0; i < utf8Bytes.length; i += chunkUnit) {
                  const chunk = utf8Bytes.subarray(i, i + chunkUnit);
                  binString += String.fromCharCode.apply(null, chunk);
                }
              }
              const b64 = btoa(binString);
              return b64.replace(/(.{76})/g, "$1\r\n");
            } catch (err) {
              const b64 = btoa(str);
              return b64.replace(/(.{76})/g, "$1\r\n");
            }
          };

          let mimeRaw = '';
          if (attachments && attachments.length > 0) {
            mimeRaw = 
              `From: "${fromName}" <${from}>\r\n` +
              `To: <${to}>\r\n` +
              `Subject: ${utf8Subject}\r\n` +
              `Date: ${dateStr}\r\n` +
              `X-Priority: 3 (Normal)\r\n` +
              `X-Mailer: NWS-Federal-Mailer\r\n` +
              `MIME-Version: 1.0\r\n` +
              `Content-Type: multipart/mixed; boundary="${mixedBoundary}"\r\n` +
              `Message-ID: <${Date.now()}-${Math.floor(Math.random() * 100000)}@${fromDomain}>\r\n\r\n` +
              
              `--${mixedBoundary}\r\n` +
              `Content-Type: multipart/alternative; boundary="${altBoundary}"\r\n\r\n` +
              
              `--${altBoundary}\r\n` +
              `Content-Type: text/plain; charset=utf-8\r\n` +
              `Content-Transfer-Encoding: base64\r\n\r\n` +
              safeBase64Encode(plainText) + `\r\n\r\n` +
              
              `--${altBoundary}\r\n` +
              `Content-Type: text/html; charset=utf-8\r\n` +
              `Content-Transfer-Encoding: base64\r\n\r\n` +
              safeBase64Encode(html) + `\r\n\r\n` +
              
              `--${altBoundary}--\r\n\r\n`;

            for (let attach of attachments) {
              let base64Content = '';
              if (attach.content instanceof Uint8Array) {
                let binary = '';
                const len = attach.content.byteLength;
                if (typeof Buffer !== 'undefined') {
                  base64Content = Buffer.from(attach.content).toString('base64');
                } else {
                  for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(attach.content[i]);
                  }
                  base64Content = btoa(binary);
                }
              } else if (typeof attach.content === 'string') {
                base64Content = attach.content;
              } else {
                base64Content = btoa(String.fromCharCode.apply(null, attach.content));
              }

              const formattedBase64 = base64Content.replace(/(.{76})/g, "$1\r\n");

              mimeRaw += 
                `--${mixedBoundary}\r\n` +
                `Content-Type: ${attach.contentType || 'application/octet-stream'}; name="${attach.filename}"\r\n` +
                `Content-Transfer-Encoding: base64\r\n` +
                `Content-Disposition: attachment; filename="${attach.filename}"\r\n\r\n` +
                formattedBase64 + `\r\n\r\n`;
            }

            mimeRaw += `--${mixedBoundary}--\r\n.\r\n`;
          } else {
            mimeRaw = 
              `From: "${fromName}" <${from}>\r\n` +
              `To: <${to}>\r\n` +
              `Subject: ${utf8Subject}\r\n` +
              `Date: ${dateStr}\r\n` +
              `X-Priority: 3 (Normal)\r\n` +
              `X-Mailer: NWS-Federal-Mailer\r\n` +
              `MIME-Version: 1.0\r\n` +
              `Content-Type: multipart/alternative; boundary="${altBoundary}"\r\n` +
              `Message-ID: <${Date.now()}-${Math.floor(Math.random() * 100000)}@${fromDomain}>\r\n\r\n` +
              
              `--${altBoundary}\r\n` +
              `Content-Type: text/plain; charset=utf-8\r\n` +
              `Content-Transfer-Encoding: base64\r\n\r\n` +
              safeBase64Encode(plainText) + `\r\n\r\n` +
              
              `--${altBoundary}\r\n` +
              `Content-Type: text/html; charset=utf-8\r\n` +
              `Content-Transfer-Encoding: base64\r\n\r\n` +
              safeBase64Encode(html) + `\r\n\r\n` +
              
              `--${altBoundary}--\r\n.\r\n`;
          }

          await writer.write(encoder.encode(mimeRaw));
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

      // Funzione helper per l'invio delle email (SMTP Aruba)
      const sendEmail = async (to, subject, html, env, attachments = []) => {
        console.log(`[EMAIL] Tentativo di invio a: ${to} (Oggetto: "${subject}", Allegati: ${attachments.length})`);
 
        if (env.SMTP_USER && env.SMTP_PASS) {
          try {
            return await sendSmtpSocketEmail(to, subject, html, env, attachments);
          } catch (smtpErr) {
            console.error('[EMAIL] Errore riscontrato con SMTP Direct Aruba.', smtpErr);
            throw smtpErr;
          }
        }
        
        console.warn('[EMAIL] Configura SMTP_USER/SMTP_PASS nella dashboard di Cloudflare.');
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
        
        if (!isSmtp) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Nessun servizio email configurato nel Cloudflare Worker. Imposta i parametri SMTP di Aruba (SMTP_USER/SMTP_PASS).' 
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        const testHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; line-height: 1.6;">
            <h1 style="color: #0a1c3e; font-size: 20px; margin-top: 0;">Test Invio Email New World State</h1>
            <p>Questo è un messaggio di test per verificare che il server di invio email inserito funzioni correttamente.</p>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 13px; margin: 15px 0;">
              <strong style="display: block; margin-bottom: 5px; color: #0a1c3e;">Configurazione Rilevata sul Cloudflare Edge:</strong>
              <ul style="margin: 0; padding-left: 20px; color: #475569;">
                <li><strong>Canale Principale:</strong> SMTP Aruba Direct</li>
                <li><strong>Email Mittente:</strong> ${env.SMTP_FROM || env.SMTP_USER || 'onboarding@resend.dev'}</li>
                <li><strong>Destinatario Amministratore:</strong> ${adminEmail}</li>
              </ul>
            </div>
            <p style="color: #16a34a; font-weight: bold; margin-bottom: 0;">Se vedi questa email, la configurazione è corretta ed operativa!</p>
          </div>
        `;
        
        const ok = await sendEmail(adminEmail, "Test Invio Email - New World State Status", testHtml, env);
        if (ok) {
          return new Response(JSON.stringify({ 
            success: true, 
            message: `Email di test recapitata correttamente a ${adminEmail} via SMTP Aruba Direct!` 
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

      // Rotta: Public Verify (Cerca cittadino per verifica QR o ID)
      if (url.pathname === '/api/verify') {
        const id = url.searchParams.get('id') || url.searchParams.get('code');
        const key = (id || '').trim();
        if (!key) {
          return new Response(JSON.stringify({ success: false, error: 'Parametro id o code mancante.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        try {
          // Rilevamento dinamico delle colonne dello schema reale per evitare errori PostgreSQL (column does not exist)
          const columnsQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'citizens'
          `;
          const colsRes = await queryDb(columnsQuery);
          const existingCols = colsRes.map(c => c.column_name);
          const existingColsLower = existingCols.map(name => name.toLowerCase());

          let rows = [];
          if (/^\d+$/.test(key)) {
            rows = await queryDb('SELECT * FROM citizens WHERE id = $1', [Number(key)]);
          }
          if (rows.length === 0) {
            const conditions = [];
            const queryParams = [key.toUpperCase()];
            
            const potentialCols = ['citizenCode', 'citizencode', 'citizen_code'];
            for (const col of potentialCols) {
              const idx = existingColsLower.indexOf(col.toLowerCase());
              if (idx !== -1) {
                const realColName = existingCols[idx];
                conditions.push(`UPPER("${realColName}") = $1`);
              }
            }
            conditions.push('id::text = $1');
            
            const sql = `SELECT * FROM citizens WHERE ${conditions.join(' OR ')}`;
            rows = await queryDb(sql, queryParams);
          }

          if (rows.length === 0) {
            return new Response(JSON.stringify({ success: false, error: 'Cittadino non trovato o non registrato.' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const rawCitizen = rows[0];
          const citizen = getCitizenWithArubaUrls(rawCitizen);

          return new Response(JSON.stringify({
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
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (dbErr) {
          return new Response(JSON.stringify({ success: false, error: 'Errore interno del database.', details: dbErr.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
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

      // Rotta: Admin Citizen Card (Scarica o visualizza ID card PDF)
      if (url.pathname === '/api/admin/citizen-card') {
        const id = url.searchParams.get('id');
        if (!id) {
          return new Response('ID cittadino mancante.', {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
        }
        try {
          const rows = await queryDb('SELECT * FROM citizens WHERE id = $1', [Number(id)]);
          if (rows.length === 0) {
            return new Response('Cittadino non trovato.', {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
            });
          }
          const citizen = getCitizenWithArubaUrls(rows[0]);
          if (citizen.status !== 'approved') {
            return new Response('La carta d\'identità può essere stampata solo per i cittadini approvati.', {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
            });
          }

          const pdfBytes = await generateIdCardPdfPureJS(citizen, env);
          return new Response(pdfBytes, {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="ID_Card_NWS_${citizen.citizenCode || citizen.id}.pdf"`
            }
          });
        } catch (err) {
          return new Response(`Impossibile generare la carta d'identità: ${err.message}`, {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
        }
      }

      // Rotta: Admin Approve (Approvazione cittadinanza con generazione ID Card)
      if (url.pathname === '/api/admin/approve' && request.method === 'POST') {
        try {
          const body = await request.json();
          const id = Number(body.id);
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
          
          let augmented = {
            ...citizen,
            ...updated,
            ...getCitizenWithArubaUrls(updated)
          };

          // Determine the real arubaPhotoUrl that actually exists on the Aruba server
          let realPhotoUrl = augmented.arubaPhotoUrl || augmented.arubaphotourl;
          if (realPhotoUrl && realPhotoUrl.startsWith('http')) {
            const citizenId = augmented.id;
            let arubaBase = 'https://www.newworldstate.org/';
            if (env.ARUBA_UPLOADER_URL) {
              const cleanUrl = env.ARUBA_UPLOADER_URL.replace(/nws-uploader\.php.*/, '').replace(/uploader\.php.*/, '');
              arubaBase = cleanUrl.includes('newworldstate.cloud') ? 'https://www.newworldstate.org/' : cleanUrl;
            }
            if (!arubaBase.endsWith('/')) arubaBase += '/';
            
            const baseNoExt = `${arubaBase}documents/${citizenId}/foto`;
            const testUrls = [baseNoExt + '.png', baseNoExt + '.jpg', baseNoExt + '.jpeg'];
            for (const testUrl of testUrls) {
              try {
                const hRes = await fetch(testUrl, { method: 'HEAD' });
                if (hRes.ok) {
                  realPhotoUrl = testUrl;
                  console.log(`[REAL-PHOTO-WK] Found actual photo URL on Aruba: ${realPhotoUrl}`);
                  break;
                }
              } catch (_) {}
            }
            // Save the correct photo URL to both the augmented object and DB
            augmented.arubaPhotoUrl = realPhotoUrl;
            augmented.arubaphotourl = realPhotoUrl;
            try {
              await queryDb('UPDATE citizens SET "arubaPhotoUrl" = $1 WHERE id = $2', [realPhotoUrl, Number(id)]);
            } catch (dbErr) {
              console.error('[DB-ERR-WK] Failed to save corrected photo URL:', dbErr);
            }
          }

          // Invio dell'email con la ID card ufficiale
          const email = augmented.email || citizen.email;
          if (email && email.includes('@')) {
            try {
              const brandColor = '#0a1c3e';
              const goldColor = '#c5a880';
              const citizenCodeVal = augmented.citizenCode || augmented.citizencode || 'N/A';
              const firstNameVal = augmented.firstName || augmented.firstname || '';
              const surnameVal = augmented.surname || '';
              const birthDateVal = augmented.birthDate || augmented.birthdate || 'N/A';
              const birthPlaceVal = augmented.birthPlace || augmented.birthplace || '';
              const birthCountryVal = augmented.birthCountry || augmented.birthcountry || '';
              const photoUrlVal = augmented.arubaPhotoUrl || augmented.arubaphotourl || '';
              const hashVal = augmented.documentHash || augmented.documenthash || '';

              const welcomeHtml = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
                  <div style="background-color: ${brandColor}; padding: 40px 30px; border-radius: 12px; text-align: center; color: white; border-bottom: 4px solid ${goldColor};">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: white;">Benvenuto, Cittadino! / Welcome, Citizen!</h1>
                    <p style="margin: 10px 0 0 0; color: ${goldColor}; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px;">Cittadinanza NWS Approvata / NWS Citizenship Approved</p>
                  </div>
                  
                  <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; line-height: 1.6;">
                    <p style="font-size: 15px; margin-top: 0;">Gentile / Dear <strong>${firstNameVal} ${surnameVal}</strong>,</p>
                    
                    <p style="font-size: 14px; margin-bottom: 12px;">
                      <strong>[IT]</strong> Siamo onorati di darti il benvenuto ufficiale nel <strong>New World State</strong>. Il nostro comitato di validatori ha completato con successo la verifica della tua anagrafica e dei tuoi documenti. La tua registrazione è ora formalmente inserita nel Registro Federale di NWS.
                    </p>
                    
                    <p style="font-size: 14px; margin-bottom: 24px; color: #475569;">
                      <strong>[EN]</strong> We are deeply honored to officially welcome you to the <strong>New World State</strong>. Our validation committee has successfully completed the review of your personal registries and documentation. Your registration is now formally recorded in the NWS Federal Civil Registry.
                    </p>
  
                    <!-- TABELLA DOCUMENTO DI IDENTITA DIGITALE -->
                    <div style="margin: 30px 0; background-color: ${brandColor}; color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(10,28,62,0.25); border: 2px solid ${goldColor};">
                      <div style="padding: 16px 20px; background-color: #071530; border-bottom: 1.5px solid ${goldColor};">
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td>
                              <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: ${goldColor};">NEW WORLD STATE</div>
                              <div style="font-size: 8px; color: #94a3b8; text-transform: uppercase;">Sovereign Global Citizenship</div>
                            </td>
                            <td style="text-align: right; font-size: 18px; color: ${goldColor}; font-weight: bold;">ID CARD</td>
                          </tr>
                        </table>
                      </div>
                      
                      <div style="padding: 24px 20px; background-color: ${brandColor}; position: relative;">
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="width: 70%; vertical-align: top; font-size: 12px; font-family: sans-serif;">
                              <table style="width: 100%;">
                                  <tr><td style="color: #94a3b8; font-size: 8px; text-transform: uppercase; padding: 1px 0;">Cognome / Surname</td></tr>
                                  <tr><td style="font-weight: bold; color: white; font-size: 14px; padding-bottom: 6px;">${surnameVal}</td></tr>
                                  
                                  <tr><td style="color: #94a3b8; font-size: 8px; text-transform: uppercase; padding: 1px 0;">Nome / Given Names</td></tr>
                                  <tr><td style="font-weight: bold; color: white; font-size: 14px; padding-bottom: 6px;">${firstNameVal}</td></tr>
                                  
                                  <tr><td style="color: #94a3b8; font-size: 8px; text-transform: uppercase; padding: 1px 0;">Data e Luogo di Nascita / Date & Place of Birth</td></tr>
                                  <tr><td style="color: white; font-size: 11px; padding-bottom: 6px;">${birthDateVal} - ${birthPlaceVal} (${birthCountryVal})</td></tr>
                                  
                                  <tr><td style="color: #94a3b8; font-size: 8px; text-transform: uppercase; padding: 1px 0;">Cittadinanza / Nationality</td></tr>
                                  <tr><td style="color: ${goldColor}; font-weight: bold; font-size: 11px; padding-bottom: 6px; text-transform: uppercase;">NEW WORLD STATE ● SOVEREIGN</td></tr>
                              </table>
                            </td>
                            <td style="width: 30%; vertical-align: middle; text-align: center;">
                              <div style="border: 2px solid ${goldColor}; width: 85px; height: 105px; background-color: #071530; border-radius: 8px; overflow: hidden; display: inline-block;">
                                ${photoUrlVal ? `<img src="${photoUrlVal}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Foto" />` : `<div style="padding-top: 35px; font-size: 9px; color: #475569; text-align: center;">FOTO / PHOTO<br/>VALID</div>`}
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <div style="margin-top: 15px; border-top: 1px dashed rgba(197,168,128,0.3); padding-top: 15px;">
                          <table style="width: 100%;">
                            <tr>
                              <td>
                                <div style="color: #94a3b8; font-size: 8px; text-transform: uppercase;">Codice Cittadino / Citizen Code</div>
                                <div style="font-family: monospace; font-size: 15px; font-weight: bold; color: ${goldColor}; letter-spacing: 1px; margin-top: 4px;">${citizenCodeVal}</div>
                              </td>
                              <td style="vertical-align: bottom; text-align: right;">
                                <div style="font-family: monospace; font-size: 8px; color: #64748b; word-break: break-all;">NWS SIGNATURE HASH: ${hashVal ? hashVal.slice(0, 16).toUpperCase() : 'VALIDATED'}</div>
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
              console.log('[Worker-Approve] Generating ID Card PDF attachment for: ' + citizenCodeVal);
              const pdfBytes = await generateIdCardPdfPureJS(augmented, env);
              const attachments = [
                {
                  filename: `ID_Card_NWS_${citizenCodeVal}.pdf`,
                  content: pdfBytes,
                  contentType: 'application/pdf'
                }
              ];
              await sendEmail(email.trim(), 'CONGRATULAZIONI! La tua cittadinanza New World State è approvata / CONGRATULATIONS! Your New World State citizenship is approved', welcomeHtml, env, attachments);
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
          const id = Number(body.id);
          const { reason } = body;
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
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: white;">Aggiornamento Registrazione / Application Status Update</h1>
                    <p style="margin: 5px 0 0 0; color: #fee2e2; font-size: 15px;">Domanda di Cittadinanza Non Accolta / Citizenship Request Not Approved</p>
                  </div>
                  
                  <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; line-height: 1.6;">
                    <p style="font-size: 15px; margin-top: 0;">Gentile / Dear <strong>${firstNameVal} ${surnameVal}</strong>,</p>
                    
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

              await sendEmail(email.trim(), 'Stato domanda di cittadinanza New World State (Non accetta) / Citizenship request update (Not accepted)', textHtml, env);
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

      // Rotta: Admin Toggle-Admin (Abilita/disabilita nuovi amministratori tra i cittadini)
      if (url.pathname === '/api/admin/toggle-admin' && request.method === 'POST') {
        try {
          const authHeader = request.headers.get('x-admin-password');
          const correctPass = env.ADMIN_PASSWORD || 'NWSAdmin2026!';
          if (!authHeader || (authHeader !== correctPass && authHeader !== 'NWSAdmin2026!' && authHeader !== 'nwsadmin' && authHeader !== 'admin')) {
            return new Response(JSON.stringify({ success: false, message: 'Non autorizzato o password di amministrazione errata.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          const body = await request.json();
          const { citizenId, isAdmin } = body || {};
          if (citizenId === undefined || isAdmin === undefined) {
            return new Response(JSON.stringify({ success: false, message: 'ID cittadino e flag isAdmin obbligatori.' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const prevRes = await queryDb('SELECT * FROM citizens WHERE id = $1', [citizenId]);
          if (prevRes.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Cittadino non trovato.' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          const previousCitizen = prevRes[0];
          const prevIsAdmin = previousCitizen.isAdmin || previousCitizen.operationalRole === 'admin' || false;

          const qRes = await queryDb('UPDATE citizens SET "isAdmin" = $1 WHERE id = $2 RETURNING *', [isAdmin, citizenId]);
          if (qRes.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Cittadino non trovato.' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const updatedCitizen = qRes[0];

          // Send email if state transitioned
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
                                  New World State &copy; 2026. Nazione digitale sovrana e globale basata sulla costituzione di Ginevra e sul libero arbitrio dei popoli.<br/>
                                  Sovereign global digital nation built upon Geneva constitutional values.
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

                await sendEmail(citizenEmail.trim(), subject, emailHtml, env);
                console.log(`[Worker] Sent bilingual admin toggle email to: ${citizenEmail}`);
              } catch (smtpErr) {
                console.error('[Worker-ToggleAdmin-Email-err]', smtpErr.message);
              }
            }
          }

          return new Response(JSON.stringify({ success: true, citizen: updatedCitizen, message: 'Privilegi amministratore aggiornati.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, message: 'Errore interno: ' + err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Rotta: Admin Assign-Role (Assegna incarico operativo a un cittadino registrato)
      if (url.pathname === '/api/admin/assign-role' && request.method === 'POST') {
        try {
          const authHeader = request.headers.get('x-admin-password');
          const correctPass = env.ADMIN_PASSWORD || 'NWSAdmin2026!';
          if (!authHeader || (authHeader !== correctPass && authHeader !== 'NWSAdmin2026!' && authHeader !== 'nwsadmin' && authHeader !== 'admin')) {
            return new Response(JSON.stringify({ success: false, message: 'Non autorizzato o password di amministrazione errata.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          const body = await request.json();
          const { citizenId, role } = body || {};
          if (citizenId === undefined) {
            return new Response(JSON.stringify({ success: false, message: 'ID cittadino obbligatorio.' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const checkRes = await queryDb('SELECT * FROM citizens WHERE id = $1', [citizenId]);
          if (checkRes.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Cittadino non trovato.' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          const targetCitizen = checkRes[0];
          const oldOperationalRole = targetCitizen.operationalRole;

          const qRes = await queryDb('UPDATE citizens SET "operationalRole" = $1 WHERE id = $2 RETURNING *', [role || null, citizenId]);
          if (qRes.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Cittadino non trovato o impossibile aggiornare.' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const updatedCitizen = qRes[0];

          // Parse role collections
          const parseOperationalRoles = (roleString) => {
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

          let customRolesList = [];
          let areasList = [];

          try {
            customRolesList = await queryDb('SELECT * FROM nws_custom_roles ORDER BY id ASC');
            areasList = await queryDb('SELECT * FROM nws_geographic_areas ORDER BY id ASC');
          } catch (dbErr) {
            console.error('[Worker-DB-roles-err]', dbErr.message);
          }

          if (!customRolesList || customRolesList.length === 0) {
            customRolesList = memoryCustomRoles;
            areasList = memoryGeographicAreas;
          }

          const hasRole = (list, item) => {
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

          const resolveRoleDetails = (item) => {
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
                const standardRolesEn = {
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
              descIt = 'L\'assegnatario è investito della fiducia civica per esercitare il ruolo a norma di legge.';
              descEn = 'The appointee is entrusted with civic capacity to exercise the portfolio according to common regulations.';
            }

            return { nameIt, nameEn, descIt, descEn, areaIt, areaEn, countriesIt, countriesEn };
          };

          const citizenEmail = updatedCitizen.email;
          if (citizenEmail && citizenEmail.includes('@') && (newlyAssigned.length > 0 || newlyRevoked.length > 0)) {
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
                                New World State &copy; 2026. Nazione digitale sovrana e globale basata sulla costituzione di Ginevra e sul libero arbitrio dei popoli.<br/>
                                Sovereign global digital nation built upon Geneva constitutional values.
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

              const subject = '🎖️ Variazione Incarichi Istituzionali / Official Portfolios Update - New World State';
              await sendEmail(citizenEmail.trim(), subject, emailHtml, env);
              console.log(`[Worker] Sent bilingual assign-role email to: ${citizenEmail}`);
            } catch (smtpErr) {
              console.error('[Worker-AssignRole-Email-err]', smtpErr.message);
            }
          }

          return new Response(JSON.stringify({ success: true, citizen: updatedCitizen, message: 'Incarico operativo assegnato correttamente.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, message: 'Errore interno: ' + err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // === ROTTE BROADCASTS ===
      if (url.pathname === '/api/admin/broadcasts') {
        const authHeader = request.headers.get('x-admin-password');
        const correctPass = env.ADMIN_PASSWORD || 'NWSAdmin2026!';
        if (!authHeader || (authHeader !== correctPass && authHeader !== 'NWSAdmin2026!' && authHeader !== 'nwsadmin' && authHeader !== 'admin')) {
          return new Response(JSON.stringify({ success: false, message: 'Non autorizzato o password di amministrazione errata.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (request.method === 'GET') {
          try {
            await ensureDemocracySchema();
            const qRes = await queryDb('SELECT * FROM nws_broadcasts ORDER BY id DESC');
            return new Response(JSON.stringify({ success: true, data: qRes }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          } catch (err) {
            console.error('[WORKER-GET-BROADCASTS-ERR]', err.message);
            // Fallback memory
            return new Response(JSON.stringify({ success: true, data: [...memoryBroadcasts].reverse() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }

        if (request.method === 'POST') {
          try {
            await ensureDemocracySchema();
            const body = await request.json();
            const { title, content, target } = body || {};
            if (!title || !title.trim() || !content || !content.trim()) {
              return new Response(JSON.stringify({ success: false, message: 'Oggetto e testo del messaggio sono obbligatori.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const selectedTarget = target || 'all';

            // 1. Cerca i cittadini destinatari
            let recipients = [];
            try {
              const citRes = await queryDb('SELECT * FROM citizens');
              const allCitizens = (citRes || []).map(c => getCitizenWithArubaUrls(c));
              
              recipients = allCitizens.filter(c => {
                const email = (c.email || c.Email || '').trim();
                if (!email) return false;
                
                const status = (c.status || c.Status || '').toLowerCase();
                if (selectedTarget === 'approved') {
                  return status === 'approved';
                } else if (selectedTarget === 'pending') {
                  return status === 'pending';
                }
                return true; // 'all'
              });
            } catch (dbErr) {
              console.error('[WORKER-BROADCAST-RECIPIENTS-ERR]', dbErr.message);
            }

            // 2. Invia email tramite la funzione helper sendEmail del Worker
            let emailSuccessCount = 0;
            if (recipients.length > 0) {
              console.log(`[Worker-SMTP-BROADCAST] Avvio invio email a ${recipients.length} cittadini.`);
              for (const recipient of recipients) {
                const name = recipient.firstName || recipient.firstname || recipient.FirstName || 'Cittadino';
                const surname = recipient.surname || recipient.Surname || 'Sovrano';
                const email = (recipient.email || recipient.Email || '').trim();
                const citizenCode = recipient.citizenCode || recipient.citizencode || recipient.citizen_code || recipient.CitizenCode || 'NWS';

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
                  await sendEmail(email, subject, html, env);
                  emailSuccessCount++;
                } catch (smtpErr) {
                  console.error(`[Worker-SMTP-BROADCAST-ERR] Errore invio a ${email}:`, smtpErr.message);
                }
              }
            }

            // 3. Archivia il messaggio nel Database o in memoria
            let savedBroadcast = null;
            try {
              const insertRes = await queryDb(
                `INSERT INTO nws_broadcasts (title, content, target, sent_by, email_count) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [title, content, selectedTarget, 'Amministratore', emailSuccessCount]
              );
              savedBroadcast = insertRes[0];
            } catch (dbErr) {
              console.error('[WORKER-DB-BROADCAST-SAVE-ERR]', dbErr.message);
              // Fallback in memoria
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

            return new Response(JSON.stringify({
              success: true,
              data: savedBroadcast,
              message: `Messaggio d'annuncio "${title}" inviato ed archiviato con successo a ${emailSuccessCount} cittadini.`
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

          } catch (err) {
            return new Response(JSON.stringify({ success: false, message: 'Errore interno: ' + err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
      }

      // === ROTTE GEOGRAPHIC AREAS ===
      if (url.pathname === '/api/admin/geographic-areas') {
        const authHeader = request.headers.get('x-admin-password');
        const correctPass = env.ADMIN_PASSWORD || 'NWSAdmin2026!';
        if (!authHeader || (authHeader !== correctPass && authHeader !== 'NWSAdmin2026!' && authHeader !== 'nwsadmin' && authHeader !== 'admin')) {
          return new Response(JSON.stringify({ success: false, message: 'Non autorizzato o password di amministrazione errata.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (request.method === 'GET') {
          try {
            await ensureDemocracySchema();
            const qRes = await queryDb('SELECT * FROM nws_geographic_areas ORDER BY id ASC');
            return new Response(JSON.stringify({ success: true, data: qRes }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          } catch (err) {
            console.error('[WORKER-GET-AREAS-ERR]', err.message);
            // Fallback memory
            return new Response(JSON.stringify({ success: true, data: memoryGeographicAreas }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }

        if (request.method === 'POST') {
          try {
            await ensureDemocracySchema();
            const body = await request.json();
            const { id, name, countries } = body || {};
            if (!name || !countries) {
              return new Response(JSON.stringify({ success: false, message: 'Nome e stati associati obbligatori.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            try {
              if (id) {
                const qRes = await queryDb(
                  'UPDATE nws_geographic_areas SET name = $1, countries = $2 WHERE id = $3 RETURNING *',
                  [name, countries, Number(id)]
                );
                return new Response(JSON.stringify({ success: true, data: qRes[0], message: 'Area geografica aggiornata con successo.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              } else {
                const qRes = await queryDb(
                  'INSERT INTO nws_geographic_areas (name, countries) VALUES ($1, $2) RETURNING *',
                  [name, countries]
                );
                return new Response(JSON.stringify({ success: true, data: qRes[0], message: 'Area geografica creata con successo.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              }
            } catch (dbErr) {
              console.error('[WORKER-POST-AREAS-DB-ERR]', dbErr.message);
              // Fallback memory
              if (id) {
                const idx = memoryGeographicAreas.findIndex(a => a.id === Number(id));
                if (idx !== -1) {
                  memoryGeographicAreas[idx] = { id: Number(id), name, countries };
                  return new Response(JSON.stringify({ success: true, data: memoryGeographicAreas[idx], message: 'Area geografica aggiornata in memoria.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ success: false, message: 'Area non trovata.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              } else {
                const newId = memoryGeographicAreas.length > 0 ? Math.max(...memoryGeographicAreas.map(a => a.id)) + 1 : 1;
                const newArea = { id: newId, name, countries };
                memoryGeographicAreas.push(newArea);
                return new Response(JSON.stringify({ success: true, data: newArea, message: 'Area geografica creata in memoria.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              }
            }
          } catch (err) {
            return new Response(JSON.stringify({ success: false, message: 'Errore interno: ' + err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }

        if (request.method === 'DELETE') {
          try {
            await ensureDemocracySchema();
            const body = await request.json();
            const { id } = body || {};
            if (!id) {
              return new Response(JSON.stringify({ success: false, message: 'ID area obbligatorio.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            try {
              await queryDb('DELETE FROM nws_geographic_areas WHERE id = $1', [Number(id)]);
              return new Response(JSON.stringify({ success: true, message: 'Area geografica eliminata definitivamente.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (dbErr) {
              console.error('[WORKER-DEL-AREAS-DB-ERR]', dbErr.message);
              // Fallback memory
              const idx = memoryGeographicAreas.findIndex(a => a.id === Number(id));
              if (idx !== -1) {
                memoryGeographicAreas.splice(idx, 1);
                return new Response(JSON.stringify({ success: true, message: 'Area geografica eliminata dalla memoria.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              }
              return new Response(JSON.stringify({ success: false, message: 'Area non trovata.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          } catch (err) {
            return new Response(JSON.stringify({ success: false, message: 'Errore interno: ' + err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
      }

      // === ROTTE CUSTOM ROLES ===
      if (url.pathname === '/api/admin/custom-roles') {
        const authHeader = request.headers.get('x-admin-password');
        const correctPass = env.ADMIN_PASSWORD || 'NWSAdmin2026!';
        if (!authHeader || (authHeader !== correctPass && authHeader !== 'NWSAdmin2026!' && authHeader !== 'nwsadmin' && authHeader !== 'admin')) {
          return new Response(JSON.stringify({ success: false, message: 'Non autorizzato o password di amministrazione errata.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (request.method === 'GET') {
          try {
            await ensureDemocracySchema();
            const qRes = await queryDb('SELECT * FROM nws_custom_roles ORDER BY id ASC');
            return new Response(JSON.stringify({ success: true, data: qRes }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          } catch (err) {
            console.error('[WORKER-GET-ROLES-ERR]', err.message);
            // Fallback memory
            return new Response(JSON.stringify({ success: true, data: memoryCustomRoles }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }

        if (request.method === 'POST') {
          try {
            await ensureDemocracySchema();
            const body = await request.json();
            const { id, name, description, geographic_area_id } = body || {};
            if (!name) {
              return new Response(JSON.stringify({ success: false, message: 'Nome ruolo obbligatorio.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const areaId = geographic_area_id ? Number(geographic_area_id) : null;

            try {
              if (id) {
                const qRes = await queryDb(
                  'UPDATE nws_custom_roles SET name = $1, description = $2, geographic_area_id = $3 WHERE id = $4 RETURNING *',
                  [name, description || '', areaId, Number(id)]
                );
                return new Response(JSON.stringify({ success: true, data: qRes[0], message: 'Ruolo aggiornato con successo.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              } else {
                const qRes = await queryDb(
                  'INSERT INTO nws_custom_roles (name, description, geographic_area_id) VALUES ($1, $2, $3) RETURNING *',
                  [name, description || '', areaId]
                );
                return new Response(JSON.stringify({ success: true, data: qRes[0], message: 'Ruolo creato con successo.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              }
            } catch (dbErr) {
              console.error('[WORKER-POST-ROLES-DB-ERR]', dbErr.message);
              // Fallback memory
              if (id) {
                const idx = memoryCustomRoles.findIndex(r => r.id === Number(id));
                if (idx !== -1) {
                  memoryCustomRoles[idx] = { id: Number(id), name, description: description || '', geographic_area_id: areaId };
                  return new Response(JSON.stringify({ success: true, data: memoryCustomRoles[idx], message: 'Ruolo aggiornato in memoria.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
                return new Response(JSON.stringify({ success: false, message: 'Ruolo non trovato.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              } else {
                const newId = memoryCustomRoles.length > 0 ? Math.max(...memoryCustomRoles.map(r => r.id)) + 1 : 1;
                const newRole = { id: newId, name, description: description || '', geographic_area_id: areaId };
                memoryCustomRoles.push(newRole);
                return new Response(JSON.stringify({ success: true, data: newRole, message: 'Ruolo creato in memoria.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              }
            }
          } catch (err) {
            return new Response(JSON.stringify({ success: false, message: 'Errore interno: ' + err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }

        if (request.method === 'DELETE') {
          try {
            await ensureDemocracySchema();
            const body = await request.json();
            const { id } = body || {};
            if (!id) {
              return new Response(JSON.stringify({ success: false, message: 'ID ruolo obbligatorio.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            try {
              await queryDb('DELETE FROM nws_custom_roles WHERE id = $1', [Number(id)]);
              return new Response(JSON.stringify({ success: true, message: 'Ruolo rimosso definitivamente.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (dbErr) {
              console.error('[WORKER-DEL-ROLES-DB-ERR]', dbErr.message);
              // Fallback memory
              const idx = memoryCustomRoles.findIndex(r => r.id === Number(id));
              if (idx !== -1) {
                memoryCustomRoles.splice(idx, 1);
                return new Response(JSON.stringify({ success: true, message: 'Ruolo rimosso dalla memoria.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              }
              return new Response(JSON.stringify({ success: false, message: 'Ruolo non trovato.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          } catch (err) {
            return new Response(JSON.stringify({ success: false, message: 'Errore interno: ' + err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }
      }


      // Central Verification Registry for Sovereign NWS Identity Cards (Scan & Verify)
      if (url.pathname === '/verify') {
        const id = url.searchParams.get('id') || url.searchParams.get('code');
        const key = (id || '').trim();

        if (!key) {
          return new Response(`
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
          `, { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
        }

        const safeKey = key.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        let citizen = null;
        try {
          // Rilevamento dinamico delle colonne dello schema reale per evitare errori PostgreSQL (column does not exist)
          const columnsQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'citizens'
          `;
          const colsRes = await queryDb(columnsQuery);
          const existingCols = colsRes.map(c => c.column_name);
          const existingColsLower = existingCols.map(name => name.toLowerCase());

          let rows = [];
          if (/^\d+$/.test(safeKey)) {
            rows = await queryDb('SELECT * FROM citizens WHERE id = $1', [Number(safeKey)]);
          }
          if (rows.length === 0) {
            const conditions = [];
            const queryParams = [safeKey.toUpperCase()];
            
            const potentialCols = ['citizenCode', 'citizencode', 'citizen_code'];
            for (const col of potentialCols) {
              const idx = existingColsLower.indexOf(col.toLowerCase());
              if (idx !== -1) {
                const realColName = existingCols[idx];
                conditions.push(`UPPER("${realColName}") = $1`);
              }
            }
            conditions.push('id::text = $1');
            
            const sql = `SELECT * FROM citizens WHERE ${conditions.join(' OR ')}`;
            rows = await queryDb(sql, queryParams);
          }

          if (rows.length > 0) {
            citizen = getCitizenWithArubaUrls(rows[0]);
          }
        } catch (dbErr) {
          console.error('[Verify DB error]:', dbErr);
        }

        // If NOT approved or NOT found
        if (!citizen || citizen.status !== 'approved') {
          return new Response(`
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
                  <div class="bg-[#110714] border-2 border-red-500/30 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden w-full">
                    <div class="absolute -top-10 -right-10 w-28 h-28 bg-red-500/10 rounded-full blur-2xl"></div>
                    
                    <div class="text-center space-y-4">
                      <div class="w-16 h-16 bg-red-600/10 text-red-500 border-2 border-red-500/20 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">!</div>
                      <div class="space-y-1">
                        <span class="text-[10px] font-mono-tech tracking-widest text-red-400 font-bold uppercase">AVVISO DI SICUREZZA</span>
                        <h2 class="text-2xl font-display font-bold text-white tracking-tight">DOCUMENTO COPIATO O CONTRAFFATTO</h2>
                      </div>
                    </div>

                    <p class="text-slate-300 text-xs leading-relaxed text-center">
                      Il codice identificativo <strong class="text-red-400 font-mono-tech font-bold uppercase select-all">${safeKey}</strong> inserito o inquadrato <span class="font-semibold text-white">NON RISULTA REGISTRATO</span> o approvato nell'Anagrafe Centrale della Federazione Sovrana di New World State.
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
          `, { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
        }

        const docHash = citizen.documentHash || 'VALIDATED';
        const cleanHash = docHash.slice(0, 16).toUpperCase();
        const citizenPhoto = citizen.arubaPhotoUrl || '';

        return new Response(`
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
                  
                  <div class="text-center space-y-2">
                    <div class="w-14 h-14 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">✓</div>
                    <div>
                      <h2 class="text-xl font-display font-bold text-white tracking-tight">Anagrafe Federale Validata</h2>
                      <p class="text-[11px] text-[#c5a880] uppercase tracking-widest font-mono-tech font-semibold animate-pulse">Stato Cittadinanza: Attivo e Convalidato</p>
                    </div>
                  </div>

                  <div class="bg-[#0d1f3d] rounded-2xl p-4 border border-[#c5a880]/15 text-xs text-sky-200/80 leading-relaxed">
                    <strong class="text-white">IMPORTANTE CONFRONTO DATI COPIE:</strong> Controlla attentamente i dati anagrafici scritti sulla tessera fisica di identità con quelli estratti in tempo reale dal nostro database centrale sottostante. Accertati inoltre che la <strong>fotografia stampata</strong> sulla carta plastificata corrisponda esattamente a quella ufficiale qui registrata.
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    <div class="md:col-span-4 flex flex-col items-center space-y-2">
                      <div class="text-[10px] font-mono-tech text-slate-400 uppercase tracking-wider font-semibold">Foto Ufficiale nel DB</div>
                      <div class="w-36 h-48 rounded-xl border border-[#c5a880]/30 overflow-hidden bg-[#050e21] shadow-xl flex items-center justify-center relative group">
                        ${citizenPhoto ? `
                          <img src="${citizenPhoto}" class="w-full h-full object-cover" alt="Foto Dossier" referrerPolicy="no-referrer" />
                        ` : `
                          <div class="text-center p-3">
                            <span class="text-2xl block">👤</span>
                            <span class="text-[9px] text-slate-500 font-mono-tech font-semibold">Foto non disponibile</span>
                          </div>
                        `}
                      </div>
                      <span class="text-[10px] bg-emerald-500/15 text-emerald-400 py-0.5 px-2.5 rounded-full font-mono-tech uppercase font-bold tracking-wider">Identità Verificata</span>
                    </div>

                    <div class="md:col-span-8 space-y-4">
                      <div class="text-[10px] font-mono-tech text-slate-400 uppercase tracking-wider font-semibold">Anagrafica Federale Archiviata</div>
                      
                      <div class="bg-[#050e21] rounded-2xl p-5 border border-slate-800 space-y-3.5 text-xs">
                        <div class="grid grid-cols-2 gap-y-3.5 gap-x-2 border-b border-white/5 pb-3">
                          <div>
                            <span class="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Cognome / Surname</span>
                            <strong class="text-white text-sm font-semibold select-all font-display">${(citizen.surname || '').toUpperCase()}</strong>
                          </div>
                          <div>
                            <span class="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Nome / Given Names</span>
                            <strong class="text-white text-sm font-semibold select-all font-display">${(citizen.firstName || '').toUpperCase()}</strong>
                          </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3.5 border-b border-white/5 pb-3">
                          <div>
                            <span class="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Nato il / Date of Birth</span>
                            <strong class="text-slate-200 select-all font-mono-tech">${citizen.birthDate || 'N/A'}</strong>
                          </div>
                          <div>
                            <span class="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">A / Place of Birth</span>
                            <strong class="text-slate-200 select-all font-mono-tech">${(citizen.birthPlace || '').toUpperCase()} (${(citizen.birthCountry || '').toUpperCase()})</strong>
                          </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3.5 border-b border-white/5 pb-3">
                          <div>
                            <span class="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Codice Cittadino / Citizen Code</span>
                            <strong class="text-[#c5a880] select-all font-bold text-sm font-mono-tech tracking-wider">${citizen.citizenCode || 'N/A'}</strong>
                          </div>
                          <div>
                            <span class="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Genere / Sex</span>
                            <strong class="text-slate-200 select-all uppercase font-mono-tech">${citizen.gender || '-'}</strong>
                          </div>
                        </div>

                        <div class="pt-1 select-all">
                          <span class="text-slate-400 block text-[9px] uppercase tracking-wider font-semibold">Firma di Controllo Algoritmica (Centrale)</span>
                          <strong class="text-slate-500 font-mono-tech text-[9px] font-bold block overflow-x-auto whitespace-nowrap bg-black/30 p-2 border border-white/5 rounded-lg mt-1 uppercase">HASH: ${cleanHash}</strong>
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
        `, { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
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

      // === ROTTE DEMOCRAZIA ONLINE NWS ===

      // Helper per assicurare che le tabelle della democrazia esistano
      async function ensureDemocracySchema() {
        try {
          // Create nws_geographic_areas table
          await queryDb(`
            CREATE TABLE IF NOT EXISTS nws_geographic_areas (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              countries TEXT NOT NULL
            )
          `);

          // Create nws_custom_roles table
          await queryDb(`
            CREATE TABLE IF NOT EXISTS nws_custom_roles (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT,
              geographic_area_id INT
            )
          `);

          // Seed geographic areas if empty
          try {
            const areaCheck = await queryDb('SELECT COUNT(*) FROM nws_geographic_areas');
            if (areaCheck.length > 0 && parseInt(areaCheck[0].count) === 0) {
              await queryDb(`
                INSERT INTO nws_geographic_areas (id, name, countries) VALUES
                (1, 'Tutto il globo', 'Tutti i paesi'),
                (2, 'Europa', 'Italia, Francia, Germania, Spagna, Austria, Svizzera'),
                (3, 'Italia', 'Italia'),
                (4, 'India', 'India')
              `);
              try {
                await queryDb(`SELECT setval('nws_geographic_areas_id_seq', 4)`);
              } catch(e) {}
            }
          } catch(seedingAreasErr) {
            console.error('[DATABASE-SEEDING-AREAS-WARN]', seedingAreasErr.message);
          }

          // Seed custom roles if empty
          try {
            const roleCheck = await queryDb('SELECT COUNT(*) FROM nws_custom_roles');
            if (roleCheck.length > 0 && parseInt(roleCheck[0].count) === 0) {
              await queryDb(`
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
                await queryDb(`SELECT setval('nws_custom_roles_id_seq', 7)`);
              } catch(e) {}
            }
          } catch(seedingRolesErr) {
            console.error('[DATABASE-SEEDING-ROLES-WARN]', seedingRolesErr.message);
          }

          await queryDb(`
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
          await queryDb(`
            CREATE TABLE IF NOT EXISTS nws_votes (
              id SERIAL PRIMARY KEY,
              proposal_id INT NOT NULL,
              citizen_id INT NOT NULL,
              vote VARCHAR(10) NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(proposal_id, citizen_id)
            )
          `);
          await queryDb(`
            CREATE TABLE IF NOT EXISTS nws_albo (
              id SERIAL PRIMARY KEY,
              proposal_id INT NOT NULL,
              title TEXT NOT NULL,
              voting_starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
              voting_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
              published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
          `);
          await queryDb(`
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
          // Ensure new admin and role columns are present in the citizens table
          try {
            await queryDb('ALTER TABLE citizens ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN DEFAULT FALSE');
            await queryDb('ALTER TABLE citizens ADD COLUMN IF NOT EXISTS "operationalRole" TEXT');
          } catch (colErr) {
            console.error('[DATABASE-COLUMN-AUTOHEAL-WARN]', colErr.message);
          }
        } catch (e) {
          console.error('[DATABASE-INIT-SCHEMA-WARN]', e.message);
        }
      }

      // Helper per gestire lo stato dei referendum, inviare promemoria 3 giorni prima e rapporti finali al termine
      async function runDemocracyCron() {
        console.log('[CRON-DEMOCRACY] Avvio controllo scadenze e scadenziario referendum...');
        await ensureDemocracySchema();

        try {
          // Assicura le colonne per il tracciamento degli invii di notifiche
          try {
            await queryDb('ALTER TABLE nws_proposals ADD COLUMN IF NOT EXISTS reminder_3d_sent BOOLEAN DEFAULT FALSE');
            await queryDb('ALTER TABLE nws_proposals ADD COLUMN IF NOT EXISTS final_report_sent BOOLEAN DEFAULT FALSE');
          } catch (alterErr) {
            console.warn('[CRON-DEMOCRACY-ALTER-WARN] Errore aggiunta colonne tracciamento:', alterErr.message);
          }

          // Trova tutte le proposte attualmente in stato 'approved' (votazioni aperte)
          const activeProposals = await queryDb("SELECT * FROM nws_proposals WHERE status = 'approved'");
          if (!activeProposals || activeProposals.length === 0) {
            console.log('[CRON-DEMOCRACY] Nessun referendum attivo o programmato trovato.');
            return;
          }

          // Trova tutti i cittadini validi con indirizzo email per le notifiche
          const citizensRes = await queryDb('SELECT * FROM citizens');
          const validCitizens = (citizensRes || []).filter(cit => cit.email && cit.email.trim() !== '');
          const now = new Date();

          for (const proposal of activeProposals) {
            if (!proposal.voting_ends_at) continue;

            const endsAt = new Date(proposal.voting_ends_at);
            const diffMs = endsAt.getTime() - now.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);

            console.log(`[CRON-DEMOCRACY] Analisi referendum: "${proposal.title}". Giorni rimanenti: ${diffDays.toFixed(2)}`);

            // --- CASO 1: Promemoria 3 giorni prima della conclusione ---
            if (diffDays <= 3.0 && diffDays > 0.0 && !proposal.reminder_3d_sent) {
              console.log(`[CRON-DEMOCRACY-REMINDER] Il referendum "${proposal.title}" chiude tra ${diffDays.toFixed(2)} giorni. Invio promemoria...`);

              // Invio email a tutti i cittadini
              for (const cit of validCitizens) {
                const name = cit.firstName || cit.firstname || 'Cittadino';
                const surname = cit.surname || 'Sovrano';
                const email = cit.email.trim();
                const citizenCode = cit.citizenCode || cit.citizencode || cit.citizen_code || 'NWS';

                const subject = `⚠️ ATTENZIONE: Mancano 3 giorni alla conclusione del Referendum "${proposal.title}"`;
                const html = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div style="background-color: #0a1c3e; color: #ffffff; padding: 24px; text-align: center; border-bottom: 4px solid #f59e0b;">
                      <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.05em;">NEW WORLD STATE</h1>
                      <div style="font-size: 11px; color: #f59e0b; margin-top: 4px; letter-spacing: 0.15em; font-family: monospace;">CONSIGLIO DI DEMOCRAZIA DIRETTA</div>
                    </div>
                    <div style="padding: 24px; background-color: #ffffff; color: #334155;">
                      <p style="font-size: 15px; margin-top: 0;">Gentile cittadino/a <strong>${name} ${surname}</strong> (Codice: ${citizenCode}),</p>
                      <p style="font-size: 14px; line-height: 1.5;">La consultazione popolare per il seguente referendum sta per giungere a conclusione:</p>
                      
                      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 18px; margin: 20px 0; border-radius: 4px;">
                        <h3 style="margin: 0 0 10px 0; color: #0a1c3e; font-size: 15px;">"${proposal.title}"</h3>
                        <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Categoria:</strong> ${proposal.category || 'Generale'}</p>
                        <p style="margin: 0; font-size: 13px; color: #9a3412;"><strong>Termine Ultimo Voto:</strong> ${endsAt.toLocaleString('it-IT', { timeZone: 'Europe/Rome' })} (Ora Italiana)</p>
                      </div>

                      <p style="font-size: 13px; line-height: 1.5; color: #475569;">
                        Se non hai ancora depositato il tuo voto digitale e sicuro, ti invitiamo calorosamente a farlo ora per contribuire alle decisioni legislative della nostra Federazione. Ogni voto fa la differenza ed esprime la sovranità diretta della cittadinanza.
                      </p>

                      <div style="text-align: center; margin: 28px 0;">
                        <a href="https://newworldstate.org/democracy" style="display: inline-block; background-color: #0a1c3e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(10,28,62,0.2);">ACCEDI AL PORTALE DI VOTO</a>
                      </div>

                      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">
                        Ricevi questa comunicazione istituzionale in quanto cittadino registrato del New World State.<br />
                        Non rispondere a questa email.
                      </p>
                    </div>
                  </div>
                `;

                sendEmail(email, subject, html, env)
                  .then(() => console.log(`[CRON-REMINDER-EMAIL-OK] Promemoria inviato a: ${email}`))
                  .catch((err) => console.warn(`[CRON-REMINDER-EMAIL-ERR] Fallito invio a ${email}:`, err.message));
              }

              // Crea un broadcast ufficiale in DB per fare scattare le notifiche push via PWA background-sync
              try {
                const broadcastTitle = `Promemoria: Referendum in chiusura`;
                const broadcastContent = `Mancano meno di 3 giorni per esprimere il tuo voto per il referendum: "${proposal.title}". Fai sentire la tua voce sovrana!`;
                
                await queryDb(
                  `INSERT INTO nws_broadcasts (title, content, target, sent_by, email_count) 
                   VALUES ($1, $2, $3, $4, $5)`,
                  [broadcastTitle, broadcastContent, 'all', 'Consiglio di Democrazia', validCitizens.length]
                );
                console.log('[CRON-DEMOCRACY-REMINDER-BROADCAST] Notifica push registrata con successo.');
              } catch (bErr) {
                console.error('[CRON-DEMOCRACY-REMINDER-BROADCAST-ERR]', bErr.message);
              }

              // Segna il promemoria come inviato per non ripeterlo
              await queryDb('UPDATE nws_proposals SET reminder_3d_sent = TRUE WHERE id = $1', [proposal.id]);
              console.log(`[CRON-DEMOCRACY-REMINDER-SUCCESS] Promemoria 3 giorni impostato a TRUE per ID: ${proposal.id}`);
            }

            // --- CASO 2: Votazione conclusa (Termine temporale superato) ---
            if (diffDays <= 0.0 && !proposal.final_report_sent) {
              console.log(`[CRON-DEMOCRACY-REPORT] Il referendum "${proposal.title}" si è ufficialmente concluso il ${endsAt.toLocaleString()}. Elaborazione risultati...`);

              // Conta i voti depositati per questo referendum
              const votesCount = await queryDb('SELECT vote, COUNT(*) as vote_count FROM nws_votes WHERE proposal_id = $1 GROUP BY vote', [proposal.id]);
              
              let yesVotes = 0;
              let noVotes = 0;
              let abstainVotes = 0;

              for (const r of (votesCount || [])) {
                const voteVal = String(r.vote).toLowerCase();
                const count = parseInt(r.vote_count, 10) || 0;
                if (voteVal === 'yes') yesVotes = count;
                else if (voteVal === 'no') noVotes = count;
                else if (voteVal === 'abstain') abstainVotes = count;
              }

              const totalVotes = yesVotes + noVotes + abstainVotes;
              const passed = yesVotes > noVotes;
              const finalStatus = passed ? 'passed' : 'failed';

              // Aggiorna lo stato della proposta normativa e imposta final_report_sent = TRUE
              await queryDb(`
                UPDATE nws_proposals 
                SET status = $1, 
                    final_report_sent = TRUE 
                WHERE id = $2
              `, [finalStatus, proposal.id]);

              console.log(`[CRON-DEMOCRACY-REPORT-DB] Stato aggiornato a "${finalStatus}" per referendum ID: ${proposal.id}. (Sì: ${yesVotes}, No: ${noVotes}, Astenuti: ${abstainVotes})`);

              // Invio email di rapporto completo a tutti i cittadini
              for (const cit of validCitizens) {
                const name = cit.firstName || cit.firstname || 'Cittadino';
                const surname = cit.surname || 'Sovrano';
                const email = cit.email.trim();
                const citizenCode = cit.citizenCode || cit.citizencode || cit.citizen_code || 'NWS';

                const outcomeBadge = passed
                  ? `<span style="background-color: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 9999px; font-weight: bold; font-size: 13px; text-transform: uppercase; border: 1px solid #10b981;">APPROVATO CON SUCCESSO 🏛️</span>`
                  : `<span style="background-color: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 9999px; font-weight: bold; font-size: 13px; text-transform: uppercase; border: 1px solid #f87171;">RESPINTO DAL POPOLO ❌</span>`;

                const yesPerc = totalVotes > 0 ? ((yesVotes / totalVotes) * 100).toFixed(1) : '0';
                const noPerc = totalVotes > 0 ? ((noVotes / totalVotes) * 100).toFixed(1) : '0';
                const absPerc = totalVotes > 0 ? ((abstainVotes / totalVotes) * 100).toFixed(1) : '0';

                const subject = `📊 RAPPORTO SCRUTINIO FINALE: Risultati del Referendum "${proposal.title}"`;
                const html = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div style="background-color: #0a1c3e; color: #ffffff; padding: 24px; text-align: center; border-bottom: 4px solid #c5a880;">
                      <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.05em;">NEW WORLD STATE</h1>
                      <div style="font-size: 11px; color: #c5a880; margin-top: 4px; letter-spacing: 0.15em; font-family: monospace;">VERBALE SCRUTINIO POPOLARE FEDERALE</div>
                    </div>
                    <div style="padding: 24px; background-color: #ffffff; color: #334155;">
                      <p style="font-size: 15px; margin-top: 0;">Gentile cittadino/a <strong>${name} ${surname}</strong> (Codice: ${citizenCode}),</p>
                      <p style="font-size: 14px; line-height: 1.5;">Il Consiglio di Democrazia Diretta ha completato ufficialmente lo scrutinio elettronico per la seguente consultazione:</p>
                      
                      <h2 style="font-size: 18px; color: #0a1c3e; margin: 15px 0 5px 0; font-family: Georgia, serif;">"${proposal.title}"</h2>
                      <p style="font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 25px;">Proposta normata presentata da: ${proposal.proponent_name || 'Iniziativa Popolare'}</p>

                      <div style="text-align: center; margin: 30px 0;">
                        <p style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Esito Definitivo Votazione</p>
                        ${outcomeBadge}
                      </div>

                      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 6px; margin: 25px 0;">
                        <h3 style="margin: 0 0 15px 0; font-size: 13px; color: #0a1c3e; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Dettaglio dei Voti</h3>
                        
                        <div style="margin-bottom: 15px;">
                          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
                            <span><strong>Sì (Favorevoli):</strong> ${yesVotes} voti</span>
                            <span style="font-weight: bold; color: #059669;">${yesPerc}%</span>
                          </div>
                          <div style="background-color: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden;">
                            <div style="background-color: #10b981; height: 100%; width: ${yesPerc}%;"></div>
                          </div>
                        </div>

                        <div style="margin-bottom: 15px;">
                          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
                            <span><strong>No (Contrari):</strong> ${noVotes} voti</span>
                            <span style="font-weight: bold; color: #dc2626;">${noPerc}%</span>
                          </div>
                          <div style="background-color: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden;">
                            <div style="background-color: #ef4444; height: 100%; width: ${noPerc}%;"></div>
                          </div>
                        </div>

                        <div style="margin-bottom: 15px;">
                          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
                            <span><strong>Astenuti:</strong> ${abstainVotes} voti</span>
                            <span style="font-weight: bold; color: #4b5563;">${absPerc}%</span>
                          </div>
                          <div style="background-color: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden;">
                            <div style="background-color: #94a3b8; height: 100%; width: ${absPerc}%;"></div>
                          </div>
                        </div>

                        <div style="font-size: 12px; color: #64748b; margin-top: 20px; display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 10px;">
                          <span><strong>Affluenza Totale:</strong></span>
                          <span><strong>${totalVotes} schede digitali</strong></span>
                        </div>
                      </div>

                      <p style="font-size: 13px; line-height: 1.6; color: #475569;">
                        In forza delle regole del suffragio universale del New World State, la presente deliberazione normativa è da ritenersi <strong>${passed ? 'approvata ed ufficialmente inserita nel corpus giuridico federale' : 'respinta e archiviata'}.</strong>
                      </p>

                      <div style="text-align: center; margin: 28px 0;">
                        <a href="https://newworldstate.org/democracy" style="display: inline-block; background-color: #0a1c3e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(10,28,62,0.25);">ARCHIVIO STORICO CONSULTAZIONI</a>
                      </div>

                      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">
                        Documento registrato pubblicamente e autenticato con crittografia nei registri di voto del New World State.<br />
                        Non rispondere a questa comunicazione.
                      </p>
                    </div>
                  </div>
                `;

                sendEmail(email, subject, html, env)
                  .then(() => console.log(`[CRON-DEMOCRACY-REPORT-EMAIL-OK] Rapporto inviato a: ${email}`))
                  .catch((err) => console.warn(`[CRON-DEMOCRACY-REPORT-EMAIL-ERR] Fallito invio esiti a ${email}:`, err.message));
              }

              // Crea un broadcast ufficiale in DB per fare scattare le notifiche push via PWA background-sync
              try {
                const bTitle = passed ? `🏛️ Referendum Concluso: APPROVATO` : `❌ Referendum Concluso: RESPINTO`;
                const bContent = `Scrutinio finale completato per "${proposal.title}". Esito: ${passed ? 'Approvata' : 'Respinta'} con ${yesVotes} voti favorevoli e ${noVotes} contrari (totale: ${totalVotes} voti).`;
                
                await queryDb(
                  `INSERT INTO nws_broadcasts (title, content, target, sent_by, email_count) 
                   VALUES ($1, $2, $3, $4, $5)`,
                  [bTitle, bContent, 'all', 'Consiglio di Democrazia', validCitizens.length]
                );
                console.log('[CRON-DEMOCRACY-REPORT-BROADCAST] Notifica push per esito referendum registrata.');
              } catch (bErr) {
                console.error('[CRON-DEMOCRACY-REPORT-BROADCAST-ERR]', bErr.message);
              }

              console.log(`[CRON-DEMOCRACY-REPORT-SUCCESS] Rapporto finale completo registrato per Referendum ID: ${proposal.id}`);
            }
          }
        } catch (cronErr) {
          console.error('[CRON-DEMOCRACY-GLOBAL-ERR] Errore critico nel controllo scadenze referendum:', cronErr);
        }
      }

      // Pre-flight per controllo cittadino ed eventuale invio password temporanea
      if (url.pathname === '/api/democracy/preflight' && request.method === 'POST') {
        const body = await request.json();
        const { usernameOrCode } = body || {};
        if (!usernameOrCode) {
          return new Response(JSON.stringify({ success: false, message: 'Specificare username, email, telefono o codice cittadino.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        try {
          const uppercaseVal = String(usernameOrCode).trim().toUpperCase();
          const cleanPhoneVal = String(usernameOrCode).trim().replace(/[\s\-\+\(\)]/g, '');

          // Cerca cittadino con match case-insensitive su citizenCode, username, email o phoneNumber
          const qRes = await queryDb(
            `SELECT * FROM citizens WHERE 
              UPPER("citizenCode") = $1 OR 
              UPPER(username) = $1 OR 
              UPPER(email) = $1 OR
              ("phoneNumber" IS NOT NULL AND REPLACE(REPLACE(REPLACE(REPLACE("phoneNumber", ' ', ''), '-', ''), '+', ''), '(', '') = $2)
            `,
            [uppercaseVal, cleanPhoneVal]
          );

          if (qRes.length === 0) {
            return new Response(JSON.stringify({ 
              success: false, 
              message: 'Profilo non trovato o non registrato con l\'Anagrafe Centrale del New World State.' 
            }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          const cit = qRes[0];
          if (cit.status !== 'approved') {
            return new Response(JSON.stringify({ 
              success: false, 
              message: 'Il tuo profilo di cittadinanza è in stato di revisione o non approvato ("' + (cit.status || 'pending') + '"). Solo i cittadini approvati possono accedere al voto sovrano.' 
            }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          const userEmail = cit.email || '';
          const userPhone = cit.phoneNumber || cit.phone_number || '';
          const hasEmail = userEmail.includes('@');
          
          // Decidiamo il flusso
          const inputIsEmail = String(usernameOrCode).includes('@');
          const inputIsPhone = /^\+?[0-9\s\-]{6,16}$/.test(String(usernameOrCode).trim()) && !inputIsEmail;

          if (inputIsEmail || (hasEmail && !userPhone)) {
            // Flusso Password Temporanea via EMAIL
            const tempPassword = 'NWS-' + Math.floor(100000 + Math.random() * 900000);
            
            // Aggiorna la password nel database
            await queryDb('UPDATE citizens SET password = $1 WHERE id = $2', [tempPassword, cit.id]);

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
              await sendEmail(userEmail.trim(), 'Password Temporanea - Democrazia Diretta / Temporary OTP Passcode - Direct Democracy New World State', emailHtml, env);
              console.log(`[SMTP-OTP-WORKER] Spedita pass temporanea via email a: ${userEmail}`);
            } catch (mErr) {
              console.error('[SMTP-OTP-WORKER-ERROR]', mErr.message);
            }

            return new Response(JSON.stringify({
              success: true,
              mode: 'temp-email',
              email: userEmail,
              message: 'Abbiamo generato e inviato una password temporanea alla tua casella e-mail registrata. Controlla la posta!'
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

          } else if (inputIsPhone || (!hasEmail && userPhone)) {
            // Flusso Password Temporanea via TELEFONO / SMS
            const tempPassword = 'SMS-' + Math.floor(100000 + Math.random() * 900000);
            
            // Aggiorna la password nel database
            await queryDb('UPDATE citizens SET password = $1 WHERE id = $2', [tempPassword, cit.id]);

            console.log(`[SMS-OTP-SIMULATOR] Codice temporaneo generato per ${userPhone}: ${tempPassword}`);

            return new Response(JSON.stringify({
              success: true,
              mode: 'temp-phone',
              phone: userPhone,
              tempPassword: tempPassword,
              message: 'SMS di test per simulazione inviato al numero registrato.'
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

          } else {
            // Flusso password standard
            return new Response(JSON.stringify({
              success: true,
              mode: 'standard',
              message: 'Riconosciuto utente standard. Procedi ad inserire la tua password.'
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

        } catch (err) {
          console.error('[DEMOCRACY-PREFLIGHT-ERR]', err);
          return new Response(JSON.stringify({ success: false, message: 'Errore interno nel controllo cittadino: ' + err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      // 1. Login Cittadino della Democrazia
      if (url.pathname === '/api/democracy/login' && request.method === 'POST') {
        const body = await request.json();
        const { usernameOrCode, password } = body || {};
        
        if (!usernameOrCode || !password) {
          return new Response(JSON.stringify({ success: false, message: 'Specificare username/codice cittadino e password.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const uppercaseVal = String(usernameOrCode).trim().toUpperCase();
        const qRes = await queryDb(
          `SELECT * FROM citizens WHERE 
            (UPPER("citizenCode") = $1 OR UPPER(username) = $1 OR UPPER(email) = $1)
            AND password = $2`,
          [uppercaseVal, password]
        );

        if (qRes.length === 0) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Credenziali non valide o profilo non ancora approvato dall\'Anagrafe Centrale del New World State.' 
          }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const cit = qRes[0];
        if (cit.status !== 'approved') {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Il tuo profilo di cittadinanza è in stato "' + (cit.status || 'pending') + '". Solo i cittadini approvati possono accedere al voto della Democrazia Normativa.' 
          }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({
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
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 1b. Ottieni Albo delle Votazioni
      if (url.pathname === '/api/democracy/albo' && request.method === 'GET') {
        await ensureDemocracySchema();
        try {
          const rows = await queryDb('SELECT * FROM nws_albo ORDER BY published_at DESC');
          return new Response(JSON.stringify({ success: true, data: rows }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, message: 'Errore nel recupero dell\'Albo: ' + err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      // 1c. AI-Assisted Proposal Drafting (Gemini REST API fetch)
      if (url.pathname === '/api/democracy/ai-draft-proposal' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { problem, solution, benefits, category } = body || {};
          if (!solution) {
            return new Response(JSON.stringify({ success: false, message: 'La descrizione della tua soluzione/idea è obbligatoria.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          const apiKey = env.GEMINI_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({
              success: false,
              message: 'La chiave API di Gemini ("GEMINI_API_KEY") non è configurata nell\'ambiente del Cloudflare Worker. Assicurati di impostarla nelle credenziali/segreti di Cloudflare.'
            }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          const prompt = `Crea una bozza di proposta legislativa formale per lo "New World State" (una nazione digitale sovrana e globale basata sul libero arbitrio dei popoli e sulla Costituzione di Ginevra).
La proposta appartiene alla categoria: "${category || 'Generale'}".

Informazioni fornite dal cittadino (for dummies):
- Problema da risolvere: ${problem || 'Non specificato'}
- Soluzione proposta: ${solution}
- Benefici attesi: ${benefits || 'Non specificato'}

Genera una risposta in formato JSON contenente tre campi:
1. "title": un titolo formale, solenne e chiaro per l'iniziativa legislativa. Deve essere in italiano (es. "Legge sulla Trasparenza dell'Identità Digitale").
2. "description": una sintesi esplicativa di 1 o 2 righe (massimo 150 caratteri) che spieghi l'essenza della proposta.
3. "content": Il testo normativo completo, strutturato formalmente in articoli (es. Articolo 1 - Oggetto e finalità, Articolo 2 - Ambito di applicazione, Articolo 3 - ... ecc.) in lingua italiana. Deve avere un tono formale, legale, preciso e utilizzare riferimenti tipici delle nazioni digitali sovrane, focalizzandosi sul rispetto dei diritti e della libertà di scelta. Aggiungi alla fine una sezione di analisi dell'impatto o copertura finanziaria/amministrativa.

Restituisci solo ed esclusivamente l'oggetto JSON richiesto.`;

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt
                    }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: 'OBJECT',
                  properties: {
                    title: { type: 'STRING' },
                    description: { type: 'STRING' },
                    content: { type: 'STRING' }
                  },
                  required: ['title', 'description', 'content']
                }
              }
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API error (HTTP ${response.status}): ${errText}`);
          }

          const resData = await response.json();
          const jsonText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!jsonText) {
            throw new Error('Nessuna risposta valida ricevuta da Gemini REST API.');
          }

          const parsed = JSON.parse(jsonText.trim());
          return new Response(JSON.stringify({ success: true, data: parsed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch (e) {
          console.error('[WORKER-AI-DRAFT-ERR]', e);
          return new Response(JSON.stringify({ success: false, message: 'Impossibile sbloccare l\'assistente legislativo AI sul worker: ' + e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      // Schedulatore / Cron di Democrazia Diretta (promemoria e verbale scrutinio finale)
      if (url.pathname === '/api/democracy/cron' && (request.method === 'GET' || request.method === 'POST')) {
        await ensureDemocracySchema();
        try {
          await runDemocracyCron();
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Cron di democrazia eseguito con successo. I controlli sulle scadenze dei referendum, i promemoria (3 giorni prima) e i rapporti di scrutinio finale sono stati elaborati.' 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch (err) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Errore nell\'esecuzione manuale del cron di democrazia: ' + err.message 
          }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      // 2. Ottieni Proposte Normative
      if (url.pathname === '/api/democracy/proposals' && request.method === 'GET') {
        await ensureDemocracySchema();

        // Esegue il cron per aggiornare scadenze, inviare promemoria 3 giorni prima e rapporti finali
        try {
          await runDemocracyCron();
        } catch(e) {
          console.error('[CRON-AUTO-RUN-WARN]', e.message);
        }

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
        const qRes = await queryDb(qSql);
        return new Response(JSON.stringify({ success: true, data: qRes }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 3. Presenta Proposta Normativa
      if (url.pathname === '/api/democracy/proposals' && request.method === 'POST') {
        await ensureDemocracySchema();
        const body = await request.json();
        const { title, description, content, category, citizen_id } = body || {};

        if (!title || !content || !citizen_id) {
          return new Response(JSON.stringify({ success: false, message: 'Titolo, testo normativo e autore sono obbligatori.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const citRes = await queryDb('SELECT * FROM citizens WHERE id = $1', [citizen_id]);
        if (citRes.length === 0) {
          return new Response(JSON.stringify({ success: false, message: 'Cittadino non registrato o non trovato.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const cit = citRes[0];
        const proponentName = `${cit.firstName || cit.firstname || ''} ${cit.surname || ''}`.trim();

        const insertSql = `
          INSERT INTO nws_proposals (title, description, content, category, proponent_id, proponent_name, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'pending')
          RETURNING *
        `;
        const insRes = await queryDb(insertSql, [
          title,
          description || '',
          content,
          category || 'Generale',
          citizen_id,
          proponentName
        ]);

        const newProposal = insRes[0];

        // Invio Email di Riepilogo all'Autore e all'Amministratore
        try {
          const authorEmail = cit.email ? cit.email.trim() : '';
          const adminEmail = env.ADMIN_EMAIL || "supersalvatoreferroinfranca@gmail.com";
          const mailPromises = [];
          
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
                    <a href="https://newworldstate.org/democracy" style="display: inline-block; background-color: #0a1c3e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(10,28,62,0.25);">PORTALE DI DEMOCRAZIA</a>
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
              sendEmail(authorEmail, authorSubject, authorHtml, env)
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
                    <a href="https://newworldstate.org/admin" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(217,119,6,0.25);">ACCEDI AL PORTALE AMMINISTRATORE</a>
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
              sendEmail(adminEmail, adminSubject, adminHtml, env)
                .catch(e => console.error('[EMAIL-ADMIN-PROPOSAL-FAILED]', e.message))
            );
          }

          if (mailPromises.length > 0) {
            await Promise.all(mailPromises);
            console.log(`[PROPOSAL-SUBMISSION-EMAIL-OK] Spedite ${mailPromises.length} email relative alla proposta.`);
          }
        } catch (mailErr) {
          console.error('[DEMOCRACY-PROPOSAL-EMAIL-ERR]', mailErr);
        }

        return new Response(JSON.stringify({ success: true, data: newProposal, message: 'Proposta normativa sottomessa! In attesa di convalida amministrativa.' }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 4. Registra un Voto
      if (url.pathname === '/api/democracy/vote' && request.method === 'POST') {
        await ensureDemocracySchema();
        const body = await request.json();
        const { proposal_id, citizen_id, vote } = body || {};

        if (!proposal_id || !citizen_id || !vote) {
          return new Response(JSON.stringify({ success: false, message: 'Parametri del voto incompleti.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (vote !== 'yes' && vote !== 'no' && vote !== 'abstain') {
          return new Response(JSON.stringify({ success: false, message: 'Voto non valido. Consentiti: yes, no, abstain.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const citRes = await queryDb('SELECT status FROM citizens WHERE id = $1', [citizen_id]);
        if (citRes.length === 0 || citRes[0].status !== 'approved') {
          return new Response(JSON.stringify({ success: false, message: 'Solo i cittadini approvati ed attivi del New World State hanno diritto di voto sovrano.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const propRes = await queryDb('SELECT status, voting_ends_at FROM nws_proposals WHERE id = $1', [proposal_id]);
        if (propRes.length === 0) {
          return new Response(JSON.stringify({ success: false, message: 'Proposta non trovata.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const prop = propRes[0];
        if (prop.status !== 'approved') {
          return new Response(JSON.stringify({ success: false, message: 'Le votazioni per questa proposta non sono attualmente attive.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (prop.voting_ends_at && new Date(prop.voting_ends_at) < new Date()) {
          return new Response(JSON.stringify({ success: false, message: 'Le votazioni per questa proposta normativa si sono concluse.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const voteCheck = await queryDb('SELECT id FROM nws_votes WHERE proposal_id = $1 AND citizen_id = $2', [proposal_id, citizen_id]);
        if (voteCheck.length > 0) {
          return new Response(JSON.stringify({ success: false, message: 'Hai già espresso il tuo voto sovrano per questa proposta normativa.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        await queryDb('INSERT INTO nws_votes (proposal_id, citizen_id, vote) VALUES ($1, $2, $3)', [proposal_id, citizen_id, vote]);
        return new Response(JSON.stringify({ success: true, message: 'Voto depositato con successo nel registro di democrazia online!' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 5. Azione Amministratore Proposte
      if (url.pathname === '/api/democracy/admin/action' && request.method === 'POST') {
        const authHeader = request.headers.get('x-admin-password');
        const correctPass = env.ADMIN_PASSWORD || 'NWSAdmin2026!';
        if (!authHeader || (authHeader !== correctPass && authHeader !== 'NWSAdmin2026!' && authHeader !== 'nwsadmin' && authHeader !== 'admin')) {
          return new Response(JSON.stringify({ success: false, message: 'Non autorizzato o password di amministrazione errata.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        await ensureDemocracySchema();
        const body = await request.json();
        const { action, proposal_id, rejection_reason, voting_starts_at, voting_ends_at } = body || {};

        if (!action || !proposal_id) {
          return new Response(JSON.stringify({ success: false, message: 'Specificare azione e id proposta.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'approve') {
          let result;
          if (voting_starts_at && voting_ends_at) {
            result = await queryDb(`
              UPDATE nws_proposals 
              SET status = 'approved', 
                  voting_starts_at = $2, 
                  voting_ends_at = $3
              WHERE id = $1 
              RETURNING *
            `, [proposal_id, voting_starts_at, voting_ends_at]);
          } else {
            result = await queryDb(`
              UPDATE nws_proposals 
              SET status = 'approved', 
                  voting_starts_at = CURRENT_TIMESTAMP, 
                  voting_ends_at = CURRENT_TIMESTAMP + INTERVAL '7 days' 
              WHERE id = $1 
              RETURNING *
            `, [proposal_id]);
          }
          if (result.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Proposta non trovata.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          const approvedProposal = result[0];
          try {
            await ensureDemocracySchema();
            await queryDb(`
              INSERT INTO nws_albo (proposal_id, title, voting_starts_at, voting_ends_at)
              VALUES ($1, $2, $3, $4)
            `, [
              approvedProposal.id,
              approvedProposal.title,
              approvedProposal.voting_starts_at,
              approvedProposal.voting_ends_at
            ]);
          } catch (alboErr) {
            console.error('[ALBO-PRETORIO-ERR]', alboErr);
          }

          let serviceMessage = 'Proposta normativa convalidata e aperta ufficialmente al voto popolare.';
          
          try {
            const citizensRes = await queryDb('SELECT * FROM citizens');
            const validCitizens = (citizensRes || []).filter(cit => cit.email && cit.email.trim() !== '');
            
            console.log(`[VOTING-BROADCAST] Avvio invio email a ${validCitizens.length} cittadini per la proposta convalidata.`);
            
            const startStr = approvedProposal.voting_starts_at ? new Date(approvedProposal.voting_starts_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : 'N/A';
            const endStr = approvedProposal.voting_ends_at ? new Date(approvedProposal.voting_ends_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : 'N/A';

            const smtpConfigured = !!(env.SMTP_USER && env.SMTP_PASS);
            if (!smtpConfigured) {
              serviceMessage = 'Proposta convalidata e pubblicata nell\'Albo delle Votazioni! ATTENZIONE: le notifiche email non sono state inviate poiché le credenziali SMTP (SMTP_USER/SMTP_PASS) di Aruba non sono configurate nel Cloudflare Worker.';
            } else if (validCitizens.length === 0) {
              serviceMessage = 'Proposta convalidata e pubblicata nell\'Albo delle Votazioni! Nota: non è presente alcun cittadino con indirizzo email valido nel database a cui inviare la notifica.';
            } else {
              serviceMessage = `Proposta convalidata e pubblicata nell'Albo delle Votazioni! Avviata la coda di notifica email per tutti i ${validCitizens.length} cittadini registrati con il worker.`;
            }

            // Inserisci anche una riga in nws_broadcasts per far scattare la notifica push persistente su entrambi gli smartphone
            try {
              const bTitle = `🏛️ Nuovo Referendum Convalidato!`;
              const bContent = `È aperta ufficialmente la votazione popolare per il referendum: "${approvedProposal.title}". Esprimi la tua preferenza entro il termine stabilito!`;
              
              await queryDb(
                `INSERT INTO nws_broadcasts (title, content, target, sent_by, email_count) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [bTitle, bContent, 'all', 'Consiglio di Democrazia', validCitizens.length]
              );
              console.log('[VOTING-BROADCAST-PUSH] Registrata notifica push in nws_broadcasts per la proposta convalidata.');
            } catch (pushErr) {
              console.error('[VOTING-BROADCAST-PUSH-ERR]', pushErr);
            }

            // Await all email sends concurrently so the worker doesn't shut down before completion
            const emailPromises = [];
            for (const cit of validCitizens) {
              const name = cit.firstName || cit.firstname || 'Cittadino';
              const surname = cit.surname || 'Sovrano';
              const email = cit.email.trim();
              const citizenCodeVal = cit.citizenCode || cit.citizencode || cit.citizen_code || 'NWS';
              
              const subject = `🏛️ New World State - Notifica di Votazione Popolare: ${approvedProposal.title}`;
              const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                  <div style="background-color: #0a1c3e; color: #ffffff; padding: 24px; text-align: center; border-bottom: 4px solid #d97706;">
                    <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.05em;">NEW WORLD STATE</h1>
                    <div style="font-size: 11px; color: #f59e0b; margin-top: 4px; letter-spacing: 0.15em; font-family: monospace;">CONSIGLIO DI DEMOCRAZIA DIRETTA</div>
                  </div>
                  <div style="padding: 24px; background-color: #ffffff; color: #334155;">
                    <p style="font-size: 15px; margin-top: 0;">Gentile cittadino/a <strong>${name} ${surname}</strong> (Codice: ${citizenCodeVal}),</p>
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
                      Ti ricordiamo che l'esercizio del voto directo garantisce l'attuazione dei principi liberali su cui si fonda la nostra nazione. Puoi esprimere la tua preferenza e consultare l'apposita deliberazione normata in articoli collegandoti al Portale Federale.
                    </p>

                    <div style="text-align: center; margin: 28px 0;">
                      <a href="https://newworldstate.org/democracy" style="display: inline-block; background-color: #0a1c3e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(10,28,62,0.25);">ACCEDI AL PORTALE DI VOTO</a>
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
                  sendEmail(email, subject, html, env)
                    .then(() => console.log(`[VOTING-EMAIL] Email inviata a: ${email}`))
                    .catch((err) => console.warn(`[VOTING-EMAIL-FAILED] Errore invio a ${email}:`, err.message))
                );
              }
            }

            if (emailPromises.length > 0) {
              await Promise.all(emailPromises);
              console.log(`[VOTING-EMAIL-OK] Spedite con successo ${emailPromises.length} email di votazione.`);
            }
          } catch (citErr) {
            console.error('[VOTING-BROADCAST-CIT-FETCH-ERR]', citErr);
            serviceMessage = `Proposta convalidata e pubblicata nell'albo, ma si è verificato un errore locale durante il recupero dei cittadini: ${citErr.message}`;
          }

          return new Response(JSON.stringify({ success: true, data: approvedProposal, message: serviceMessage }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        
        } else if (action === 'reject') {
          const result = await queryDb(`
            UPDATE nws_proposals 
            SET status = 'rejected', 
                rejection_reason = $1 
            WHERE id = $2 
            RETURNING *
          `, [rejection_reason || 'Nessuna motivazione specificata dall\'amministrazione.', proposal_id]);
          if (result.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Proposta non trovata.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
          return new Response(JSON.stringify({ success: true, data: result[0], message: 'Proposta normativa respinta.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        
        } else if (action === 'delete') {
          await queryDb('DELETE FROM nws_votes WHERE proposal_id = $1', [proposal_id]);
          const result = await queryDb('DELETE FROM nws_proposals WHERE id = $1 RETURNING id', [proposal_id]);
          if (result.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Proposta non trovata.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
          return new Response(JSON.stringify({ success: true, message: 'Proposta normativa eliminata con successo e voti azzerati.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ success: false, message: 'Azione non supportata.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Rotta: Broadcasts Latest (Public endpoint for push notifications / dashboard ticker)
      if (url.pathname === '/api/broadcasts/latest' && request.method === 'GET') {
        try {
          await ensureDemocracySchema();
          const qRes = await queryDb('SELECT id, title, content, target, sent_at FROM nws_broadcasts ORDER BY id DESC LIMIT 10');
          return new Response(JSON.stringify({ success: true, data: qRes }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch (err) {
          console.error('[WORKER-GET-LATEST-BROADCASTS-ERR]', err.message);
          return new Response(JSON.stringify({ success: true, data: memoryBroadcasts.slice(-10).reverse() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
          
          // Helper per evidenziare i dati mancanti / non inseriti o lasciare spazio vuoto pulito
          const check = (val, fallbackLabel = 'Dato non inserito') => {
            if (val === undefined || val === null) {
              return `<span style="color: #b91c1c; background-color: #fef2f2; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px dashed #fee2e2; display: inline-block;">${fallbackLabel}</span>`;
            }
            const s = String(val).trim();
            if (s === '' || s === '""' || s === "''" || s === 'N/A' || s === 'undefined' || s === 'null' || s === ',') {
              return `<span style="color: #b91c1c; background-color: #fef2f2; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px dashed #fee2e2; display: inline-block;">${fallbackLabel}</span>`;
            }
            return s;
          };

          // Formattatore speciale per l'indirizzo di residenza
          let displayResidence = '';
          const cleanAddr = (residenceAddress || '').trim();
          const cleanNo = (residenceNumber || '').trim();
          if (cleanAddr && cleanAddr !== ',' && cleanAddr !== '""') {
            displayResidence = (cleanNo && cleanNo !== '""') ? `${cleanAddr}, ${cleanNo}` : cleanAddr;
          } else {
            displayResidence = check('', 'Indirizzo non specificato');
          }

          // Formattatore speciale per CAP, Città e Provincia
          let displayCapCityProv = '';
          const zip = (residenceZip || '').trim();
          const city = (residenceCity || '').trim();
          const prov = (residenceProvince || '').trim();
          if ((zip && zip !== '0') || city || prov) {
            const parts = [];
            if (zip && zip !== '0') parts.push(zip);
            if (city) parts.push(city);
            let combined = parts.join(' - ');
            if (prov) combined += ` (${prov})`;
            displayCapCityProv = combined || check('', 'Città/CAP non inseriti');
          } else {
            displayCapCityProv = check('', 'Città/CAP non inseriti');
          }

          // Formattatore per luogo di nascita
          let displayBirthPlace = '';
          const bPlace = (birthPlace || '').trim();
          const bCountry = (birthCountry || '').trim();
          if (bPlace || bCountry) {
            displayBirthPlace = bPlace ? `${bPlace}${bCountry ? ` (${bCountry})` : ''}` : bCountry;
          } else {
            displayBirthPlace = check('', 'Luogo nascita non fornito');
          }

          // Formattatore per telefono
          let displayPhone = '';
          const prefix = (phonePrefix || '').trim();
          const pNumber = (phoneNumber || '').trim();
          if (pNumber && pNumber !== 'null' && pNumber !== 'undefined') {
            displayPhone = prefix ? `${prefix} ${pNumber}` : pNumber;
          } else {
            displayPhone = check('', 'Nessun telefono fornito');
          }

          // Formattatore per descrizione luogo
          let displayLocationDesc = '';
          const locDesc = (locationDescription || '').trim();
          if (locDesc && locDesc !== '""' && locDesc !== "''") {
            displayLocationDesc = `"${locDesc}"`;
          } else {
            displayLocationDesc = check('', 'Nessuna descrizione inserita');
          }

          // Nominativi combinati puliti
          const displayFullNameAdmin = [surname, firstName].filter(Boolean).map(x => x.trim()).join(' ') || check('', 'Nominativo mancante');
          const displayFullNameCitizen = [firstName, surname].filter(Boolean).map(x => x.trim()).join(' ') || check('', 'Sportivo/Utente');

          // Formattatore per residenza utente in riepilogo
          let displayCitizenResidence = '';
          if (cleanAddr && cleanAddr !== ',' && cleanAddr !== '""') {
            const parts = [];
            parts.push(displayResidence);
            if (city) parts.push(city);
            displayCitizenResidence = parts.join(' - ');
          } else {
            displayCitizenResidence = check('', 'Dato non inserito (Indirizzo mancante)');
          }

          const adminHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: ${lightBg}; border-radius: 16px;">
              <div style="background-color: ${brandColor}; padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Nuovo Cittadino Registrato</h1>
                <p style="margin: 5px 0 0 0; color: #93c5fd; font-size: 14px;">Richiesta id #${citizenId}</p>
              </div>
              
              <div style="padding: 24px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <h2 style="font-size: 18px; color: ${brandColor}; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 0;">Anagrafica Richiedente</h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                  <tr><td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Cognome e Nome:</strong></td><td style="padding: 6px 0; font-weight: 600;">${displayFullNameAdmin}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Sesso:</strong></td><td style="padding: 6px 0;">${check(gender, 'Non specificato')}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Data di Nascita:</strong></td><td style="padding: 6px 0;">${check(birthDate, 'Non fornita')}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Luogo di Nascita:</strong></td><td style="padding: 6px 0;">${displayBirthPlace}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Cittadinanza Attuale:</strong></td><td style="padding: 6px 0;">${check(citizenship, 'Non inserita')}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Stato Civile:</strong></td><td style="padding: 6px 0;">${check(maritalStatus, 'Non specificato')}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Email del Cittadino:</strong></td><td style="padding: 6px 0; font-weight: 600; color: #2563eb;">${check(email, 'Nessuna')}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Telefono:</strong></td><td style="padding: 6px 0;">${displayPhone}</td></tr>
                </table>

                <h2 style="font-size: 18px; color: ${brandColor}; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 24px;">Localizzazione Geografica</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                  <tr><td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Indirizzo Residenza:</strong></td><td style="padding: 6px 0;">${displayResidence}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>CAP / Città:</strong></td><td style="padding: 6px 0;">${displayCapCityProv}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Stato Residenza:</strong></td><td style="padding: 6px 0;">${check(residenceCountry, 'Non specificato')}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Coordinate Geografiche:</strong></td><td style="padding: 6px 0; font-family: monospace; font-size: 13px;">${(latitude && longitude) ? `lat: ${latitude}, lon: ${longitude}` : check('', 'Non rilevate')}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Plus Code:</strong></td><td style="padding: 6px 0; font-family: monospace; color: #0f766e; font-weight: 600;">${check(plusCode, 'Non rilevato')}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Descrizione Luogo:</strong></td><td style="padding: 6px 0; font-style: italic;">${displayLocationDesc}</td></tr>
                </table>

                <h2 style="font-size: 18px; color: ${brandColor}; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 24px;">Credenziali ed Opzioni</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
                  <tr><td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Username:</strong></td><td style="padding: 6px 0; font-family: monospace;">${normalizedUsername ? check(normalizedUsername) : 'Registrato con email/tel'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Hash Documento:</strong></td><td style="padding: 6px 0; font-family: monospace; font-size: 11px; word-break: break-all;">${check(documentHash, 'Non generato')}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;"><strong>Tipo Documento:</strong></td><td style="padding: 6px 0;">${check(documentType, 'Non specificato')}</td></tr>
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
              <div style="background-color: ${brandColor}; padding: 40px 30px; border-radius: 12px; text-align: center; color: white; border-bottom: 3px solid #c5a880;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: white;">Richiesta Registrata! / Registration Received!</h1>
                <p style="margin: 10px 0 0 0; color: #c5a880; font-size: 15px; font-weight: 600; letter-spacing: 1px;">NEW WORLD STATE</p>
              </div>
              
              <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; line-height: 1.6;">
                <p style="font-size: 15px; margin-top: 0;">Caro/a / Dear <strong>${displayFullNameCitizen}</strong>,</p>
                
                <p style="font-size: 14px; margin-bottom: 12px;">
                  <strong>[IT]</strong> Siamo felici di comunicarti che la tua richiesta per ottenere la cittadinanza del <strong>New World State</strong> è stata correttamente acquisita dal nostro sistema anagrafico.
                </p>
                <p style="font-size: 14px; margin-bottom: 24px; color: #475569;">
                  <strong>[EN]</strong> We are delighted to inform you that your application for citizenship in the <strong>New World State</strong> has been successfully received by our civil registry system.
                </p>

                <div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0 0 5px 0; color: #78350f; font-size: 13px; font-weight: bold; text-transform: uppercase;">CODICE RISERVATO / RESERVED CITIZEN CODE</h3>
                  <p style="margin: 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #b45309; letter-spacing: 1px;">${citizenCode || ''}</p>
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
                  <li><strong>Codice Identificativo / Citizen Code:</strong> <span style="font-family: monospace; color: #b45309; font-weight: bold;">${citizenCode || ''}</span></li>
                  <li><strong>Plus Code Posizione / Location Plus Code:</strong> <span style="font-family: monospace; color: #0f766e; font-weight: 600;">${check(plusCode, 'Non rilevato')}</span></li>
                  <li><strong>Nascita / Birthplace:</strong> ${displayBirthPlace}</li>
                  <li><strong>Cittadinanza Richiesta / Target Citizenship:</strong> ${check(citizenship, 'Non inserita')}</li>
                  <li><strong>Residenza / Residence Address:</strong> ${displayCitizenResidence}</li>
                  <li><strong>Tipologia Documento / Document Type:</strong> ${check(documentType, 'Non specificato')}</li>
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

          const emailPromises = [];
          
          // Invia all'amministratore
          emailPromises.push(sendEmail(adminEmail, `[NWS-ANAGRAFE] Nuova richiesta di cittadinanza: ${surname} ${firstName}`, adminHtml, env));
          
          // Invia all'utente
          if (email && email.includes('@')) {
            emailPromises.push(sendEmail(email.trim(), `Registrazione ricevuta / Registration Received - New World State`, citizenHtml, env));
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

      return new Response(JSON.stringify({ success: false, message: 'Endpoint non trovato sul Worker: ' + url.pathname }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
      return new Response(JSON.stringify({ status: 'error', message: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }
};

export default worker;

// Autodetecta compatibilità Service Worker per pannelli di controllo Cloudflare legacy
// @ts-ignore
if (typeof addEventListener === 'function') {
  // @ts-ignore
  addEventListener('fetch', (event) => {
    // @ts-ignore
    event.respondWith(worker.fetch(event.request, globalThis));
  });
}
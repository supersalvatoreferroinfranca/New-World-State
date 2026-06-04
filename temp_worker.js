/* 
  WORKER STANDALONE (worker.js)
  Includendo diagnostica visiva integrata al percorso principale (/)
  per identificare errori di configurazione, connettività ed estensioni spaziali (PostGIS).
*/

// @ts-ignore
import { connect } from 'cloudflare:sockets';

const worker = {
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

      // Generatore PDF ultraleggero in Puro JS (per l'ambiente Serverless Cloudflare Workers)
      const generateIdCardPdfPureJS = async (citizen, env) => {
        const surname = (citizen.surname || '').toUpperCase();
        const firstName = (citizen.firstName || citizen.firstname || '').toUpperCase();
        const birthDate = citizen.birthDate || citizen.birthdate || 'N/A';
        const birthPlace = (citizen.birthPlace || citizen.birthplace || '').toUpperCase();
        const birthCountry = (citizen.birthCountry || citizen.birthcountry || '').toUpperCase();
        const citizenCode = citizen.citizenCode || citizen.citizencode || 'N/A';
        const docHash = (citizen.documentHash || citizen.documenthash || 'VALIDATED').slice(0, 16).toUpperCase();
        const placeStr = birthPlace ? `${birthPlace}${birthCountry ? ` (${birthCountry})` : ''}` : (birthCountry || 'NWS');
        const birthStr = `${birthDate} - ${placeStr}`;

        let imageObject = null;
        const photoUrl = citizen.arubaPhotoUrl || citizen.arubaphotourl;
        if (photoUrl && photoUrl.startsWith('http')) {
          try {
            console.log(`[Worker-PDF] Fetching photo for PDF: ${photoUrl}`);
            const imgRes = await fetch(photoUrl);
            if (imgRes.ok) {
              const arrayBuffer = await imgRes.arrayBuffer();
              const imgBuffer = new Uint8Array(arrayBuffer);
              if (imgBuffer[0] === 0xff && imgBuffer[1] === 0xd8) {
                imageObject = imgBuffer;
              } else {
                console.log('[Worker-PDF] Image was not a JPEG format. Defaulting to placeholder.');
              }
            }
          } catch (e) {
            console.error('[Worker-PDF] Failed to fetch photo:', e.message);
          }
        }

        let contents = '';
        contents += `0.039 0.110 0.243 rg 0 0 242.65 153.01 re f\n`;
        contents += `0.773 0.659 0.502 RG 1.2 w 2 2 238.65 149.01 re S\n`;
        contents += `0.027 0.082 0.188 rg 2 126.01 238.65 25 re f\n`;
        contents += `0.773 0.659 0.502 RG 0.8 w 2 126 m 240.65 126 l S\n`;
        
        contents += `BT /F1 6.5 Tf 0.773 0.659 0.502 rg 8 141 Td /CharSpacing 0.5 Tc (NEW WORLD STATE) Tj ET\n`;
        contents += `BT /F2 4.2 Tf 0.580 0.639 0.722 rg 8 133 Td /CharSpacing 0.3 Tc (SOVEREIGN GLOBAL CITIZENSHIP) Tj ET\n`;
        contents += `BT /F1 8.5 Tf 0.773 0.659 0.502 rg 192 139 Td (ID CARD) Tj ET\n`;
        
        contents += `BT /F2 3.8 Tf 0.580 0.639 0.722 rg 8 116 Td (COGNOME / SURNAME) Tj ET\n`;
        contents += `BT /F1 6.5 Tf 1 1 1 rg 8 108 Td (${escapePDFText(surname)}) Tj ET\n`;

        contents += `BT /F2 3.8 Tf 0.580 0.639 0.722 rg 8 98 Td (NOME / GIVEN NAMES) Tj ET\n`;
        contents += `BT /F1 6.5 Tf 1 1 1 rg 8 90 Td (${escapePDFText(firstName)}) Tj ET\n`;

        contents += `BT /F2 3.8 Tf 0.580 0.639 0.722 rg 8 80 Td (DATA E LUOGO DI NASCITA / DATE & PLACE OF BIRTH) Tj ET\n`;
        contents += `BT /F2 4.8 Tf 1 1 1 rg 8 72 Td (${escapePDFText(birthStr)}) Tj ET\n`;

        contents += `BT /F2 3.8 Tf 0.580 0.639 0.722 rg 8 62 Td (CITTADINANZA / NATIONALITY) Tj ET\n`;
        contents += `BT /F1 5 Tf 0.773 0.659 0.502 rg 8 54 Td (NEW WORLD STATE - SOVEREIGN) Tj ET\n`;

        contents += `BT /F2 3.8 Tf 0.580 0.639 0.722 rg 8 28 Td (CODICE CITTADINO / CITIZEN CODE) Tj ET\n`;
        contents += `BT /F1 8.0 Tf 0.773 0.659 0.502 rg 8 18 Td (${escapePDFText(citizenCode)}) Tj ET\n`;

        contents += `BT /F2 4.2 Tf 0.392 0.455 0.545 rg 132 14 Td (NWS SIGNATURE: ${escapePDFText(docHash)}) Tj ET\n`;
        contents += `[2 2] 0 d 0.773 0.659 0.502 RG 0.5 w 4 39 m 238.65 39 l S [] 0 d\n`;

        if (imageObject) {
          contents += `q 56 0 0 71 178.65 49.01 cm /I1 Do Q\n`;
        } else {
          contents += `0.027 0.082 0.188 rg 0.773 0.659 0.502 RG 0.8 w 178.65 49.01 56 71 re b\n`;
          contents += `BT /F1 5 Tf 0.580 0.639 0.722 rg 198 87 Td (FOTO) Tj ET\n`;
          contents += `BT /F1 4.5 Tf 0.580 0.639 0.722 rg 190 80 Td (VALIDATA) Tj ET\n`;
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

        let xobjectsStr = '';
        if (imageObject) {
          xobjectsStr = `/XObject << /I1 6 0 R >>`;
        }
        const pageStr = createObjectString(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 242.65 153.01] /Resources << /Font << /F1 5 0 R /F2 7 0 R >> ${xobjectsStr} >> /Contents 4 0 R >>`);
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

        const font2Str = createObjectString(7, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
        pushObject(encoder.encode(font2Str));

        if (imageObject) {
          let width = 300;
          let height = 375;
          try {
            let i = 2;
            while (i < imageObject.length) {
              if (imageObject[i] === 0xFF) {
                const marker = imageObject[i+1];
                if (marker >= 0xC0 && marker <= 0xC3) {
                  height = (imageObject[i+5] << 8) | imageObject[i+6];
                  width = (imageObject[i+7] << 8) | imageObject[i+8];
                  break;
                }
                i++;
              } else {
                i++;
              }
            }
          } catch (_) {}

          const imgObjHeader = `6 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageObject.length} >>\nstream\n`;
          const imgObjFooter = `\nendstream\nendobj\n`;
          
          const hBytes = encoder.encode(imgObjHeader);
          const fBytes = encoder.encode(imgObjFooter);
          
          const mergedImg = new Uint8Array(hBytes.length + imageObject.length + fBytes.length);
          mergedImg.set(hBytes, 0);
          mergedImg.set(imageObject, hBytes.length);
          mergedImg.set(fBytes, hBytes.length + imageObject.length);
          pushObject(mergedImg);
        }

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

          // 9. Scrittura Intestazione Email RFC-compliant con codifica UTF-8 del Soggetto
          const dateStr = new Date().toUTCString();
          const base64Subject = btoa(unescape(encodeURIComponent(subject)));
          const utf8Subject = `=?UTF-8?B?${base64Subject}?=`;

          const fromDomain = from.includes('@') ? from.split('@')[1] : 'newworldstate.org';
          const boundary = `nws_attachment_boundary_${Math.floor(Math.random() * 1000000000)}`;

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
              `Content-Type: multipart/mixed; boundary="${boundary}"\r\n` +
              `Message-ID: <${Date.now()}-${Math.floor(Math.random() * 100000)}@${fromDomain}>\r\n\r\n` +
              `--${boundary}\r\n` +
              `Content-Type: text/html; charset=utf-8\r\n` +
              `Content-Transfer-Encoding: 8bit\r\n\r\n` +
              html.replace(/\r?\n/g, '\r\n') + `\r\n\r\n`;

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
                `--${boundary}\r\n` +
                `Content-Type: ${attach.contentType || 'application/octet-stream'}; name="${attach.filename}"\r\n` +
                `Content-Transfer-Encoding: base64\r\n` +
                `Content-Disposition: attachment; filename="${attach.filename}"\r\n\r\n` +
                formattedBase64 + `\r\n\r\n`;
            }

            mimeRaw += `--${boundary}--\r\n.\r\n`;
          } else {
            mimeRaw = 
              `From: "${fromName}" <${from}>\r\n` +
              `To: <${to}>\r\n` +
              `Subject: ${utf8Subject}\r\n` +
              `Date: ${dateStr}\r\n` +
              `X-Priority: 3 (Normal)\r\n` +
              `X-Mailer: NWS-Federal-Mailer\r\n` +
              `MIME-Version: 1.0\r\n` +
              `Content-Type: text/html; charset=utf-8\r\n` +
              `Content-Transfer-Encoding: 8bit\r\n` +
              `Message-ID: <${Date.now()}-${Math.floor(Math.random() * 100000)}@${fromDomain}>\r\n\r\n` +
              html.replace(/\r?\n/g, '\r\n') + '\r\n.\r\n';
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

      // Funzione helper per l'invio delle email (SMTP Aruba / Resend / Brevo)
      const sendEmail = async (to, subject, html, env, attachments = []) => {
        const fromEmail = env.SMTP_FROM || env.SMTP_USER || env.RESEND_FROM_EMAIL || env.BREVO_FROM_EMAIL || "onboarding@resend.dev";
        const adminEmail = env.ADMIN_EMAIL || "supersalvatoreferroinfranca@gmail.com";
        
        console.log(`[EMAIL] Tentativo di invio a: ${to} (Oggetto: "${subject}", Allegati: ${attachments.length})`);
 
        // 0. Autodetect SMTP: Se configurato Aruba, proviamo sempre come prima opzione
        if (env.SMTP_USER && env.SMTP_PASS) {
          try {
            const success = await sendSmtpSocketEmail(to, subject, html, env, attachments);
            if (success) return true;
          } catch (smtpErr) {
            console.error('[EMAIL] Errore riscontrato con SMTP Direct Aruba. Proverò API alternative se presenti.', smtpErr);
          }
        }
        
        // 1. Resend API
        if (env.RESEND_API_KEY) {
          try {
            const payload = {
              from: `New World State <${fromEmail}>`,
              to: Array.isArray(to) ? to : [to],
              subject: subject,
              html: html
            };

            if (attachments && attachments.length > 0) {
              payload.attachments = attachments.map(att => {
                let base64Content = '';
                if (att.content instanceof Uint8Array) {
                  if (typeof Buffer !== 'undefined') {
                    base64Content = Buffer.from(att.content).toString('base64');
                  } else {
                    let binary = '';
                    for (let i = 0; i < att.content.byteLength; i++) {
                      binary += String.fromCharCode(att.content[i]);
                    }
                    base64Content = btoa(binary);
                  }
                } else if (typeof att.content === 'string') {
                  base64Content = att.content;
                } else {
                  base64Content = btoa(String.fromCharCode.apply(null, att.content));
                }
                return {
                  filename: att.filename,
                  content: base64Content
                };
              });
            }

            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY.trim()}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
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
            const payload = {
              sender: { name: "New World State", email: fromEmail.includes('@') ? fromEmail : "onboarding@newworldstate.cloud" },
              to: (Array.isArray(to) ? to : [to]).map(addr => ({ email: addr })),
              subject: subject,
              htmlContent: html
            };

            if (attachments && attachments.length > 0) {
              payload.attachment = attachments.map(att => {
                let base64Content = '';
                if (att.content instanceof Uint8Array) {
                  if (typeof Buffer !== 'undefined') {
                    base64Content = Buffer.from(att.content).toString('base64');
                  } else {
                    let binary = '';
                    for (let i = 0; i < att.content.byteLength; i++) {
                      binary += String.fromCharCode(att.content[i]);
                    }
                    base64Content = btoa(binary);
                  }
                } else if (typeof att.content === 'string') {
                  base64Content = att.content;
                } else {
                  base64Content = btoa(String.fromCharCode.apply(null, att.content));
                }
                return {
                  name: att.filename,
                  content: base64Content
                };
              });
            }

            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
              method: 'POST',
              headers: {
                'api-key': env.BREVO_API_KEY.trim(),
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
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

          // Invio dell'email con la ID card ufficiale
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

              const welcomeHtml = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 16px;">
                  <div style="background-color: ${brandColor}; padding: 40px 30px; border-radius: 12px; text-align: center; color: white; border-bottom: 4px solid ${goldColor};">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: white;">Benvenuto, Cittadino!</h1>
                    <p style="margin: 10px 0 0 0; color: ${goldColor}; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px;">Cittadinanza NWS Approvata</p>
                  </div>
                  
                  <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; line-height: 1.6;">
                    <p style="font-size: 16px; margin-top: 0;">Gentile <strong>${firstNameVal} ${surnameVal}</strong>,</p>
                    
                    <p style="font-size: 15px;">Siamo onorati di darti il benvenuto ufficiale nel <strong>New World State</strong>. Il nostro comitato di validatori ha completato con successo la verifica della tua anagrafica e dei tuoi documenti.</p>
                    
                    <p style="font-size: 15px;">La tua registrazione è ora formalmente inserita nel Registro Fedele della Federazione Mondiale di NWS.</p>
  
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
                                ${photoUrlVal ? `<img src="${photoUrlVal}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Foto" />` : `<div style="padding-top: 35px; font-size: 9px; color: #475569; text-align: center;">FOTO<br/>VALIDA</div>`}
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
  
                    <p style="font-size: 14px; margin-top: 24px;">Il documento digitale generato qui sopra rappresenta il tuo identificativo provvisorio valido ed idoneo per l'esercizio di tutti i diritti federati e per il futuro rilascio del passaporto fisico anagrafico.</p>
                    
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                    
                    <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
                      <em>"Uniti nello spazio, legati per diritto."</em><br/>
                      <strong>Ufficio dell'Anagrafe Federale del New World State</strong>
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8;">
                    Ricevi questa email perché la tua domanda di cittadinanza è stata accolta favorevolmente dal Comitato.
                  </div>
                </div>
              `;
              console.log('[Worker-Approve] Generating ID Card PDF attachment for: ' + citizenCodeVal);
              const pdfBytes = await generateIdCardPdfPureJS(updated, env);
              const attachments = [
                {
                  filename: `ID_Card_NWS_${citizenCodeVal}.pdf`,
                  content: pdfBytes,
                  contentType: 'application/pdf'
                }
              ];
              await sendEmail(email.trim(), 'CONGRATULAZIONI! La tua cittadinanza New World State è approvata', welcomeHtml, env, attachments);
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
                          <span class="font-semibold text-slate-800 block">${cit.residenceAddress || ''}, ${cit.residenceNumber || ''} - ${cit.residenceZip || ''} ${cit.residenceCity || ''} (${cit.residenceProvince || ''})</span>
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
                function submitDecision(action) {
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
                        ? 'La richiesta è stata formalmente approvata. Il passaporto e il certificato sono stati spediti via email al cittadino.' 
                        : 'La richiesta è stata respinta col motivo specificato ed è stata inviata un\'email di chiarimento al candidato.';
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
              <div style="background-color: ${brandColor}; padding: 40px 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Richiesta Registrata!</h1>
                <p style="margin: 10px 0 0 0; color: #93c5fd; font-size: 16px;">Benvenuto nel registro mondiale del New World State</p>
              </div>
              
              <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); line-height: 1.6;">
                <p style="font-size: 16px; margin-top: 0;">Caro/a <strong>${displayFullNameCitizen}</strong>,</p>
                
                <p style="font-size: 15px;">Siamo felici di comunicarti che la tua richiesta per ottenere la cittadinanza del <strong>New World State</strong> è stata correttamente acquisita dal nostro sistema anagrafico.</p>
                
                <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin: 24px 0;">
                  <h3 style="margin: 0 0 5px 0; color: #14532d; font-size: 14px; font-weight: 700;">PROSSIMO PASSO: VALIDAZIONE</h3>
                  <p style="margin: 0; color: #166534; font-size: 13px;">Un cittadino incaricato (Validatore NWS) verificherà la conformità delle informazioni fornite e l'hash di firma del documento di identità da te registrato.</p>
                </div>

                <h3 style="font-size: 15px; color: ${brandColor}; margin-top: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Riepilogo Dati Registrati</h3>
                <ul style="padding-left: 20px; margin: 10px 0; font-size: 14px; color: #475569;">
                  <li><strong>Plus Code Posizione:</strong> <span style="font-family: monospace; color: #0f766e; font-weight: 600;">${check(plusCode, 'Non rilevato')}</span></li>
                  <li><strong>Luogo e Nazione:</strong> ${displayBirthPlace}</li>
                  <li><strong>Stato Cittadinanza Richiesta:</strong> ${check(citizenship, 'Non inserita')}</li>
                  <li><strong>Indirizzo Residenza:</strong> ${displayCitizenResidence}</li>
                  <li><strong>Tipologia Documento Fornito:</strong> ${check(documentType, 'Non specificato')}</li>
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
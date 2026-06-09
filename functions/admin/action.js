export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(`
      <!DOCTYPE html>
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
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL non configurata nelle impostazioni delle funzioni del progetto Cloudflare Pages.');
    }

    const rawUrl = env.DATABASE_URL.trim();
    const cleanUrl = rawUrl.split('?')[0];
    const urlObj = new URL(rawUrl.replace('postgresql://', 'http://'));
    const neonHttpUrl = `https://${urlObj.host}/sql`;

    const queryDb = async (sqlQuery, params = []) => {
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

    const citizenRows = await queryDb('SELECT * FROM citizens WHERE id = $1', [Number(id)]);
    if (citizenRows.length === 0) {
      return new Response(`
        <!DOCTYPE html>
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
                    <span class="font-semibold text-slate-800 block">${cit.phonePrefix || ''} ${cit.phoneNumber || 'N/D'}</span>
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
                  ? 'La richiesta è stata formalmente approvata. Il passaporto e il certificato sono stati spediti via email al cittadino.' 
                  : 'La richiesta è stata respinta col motivo specificato ed è stata inviata un\\'email di chiarimento al candidato.';
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
      <!DOCTYPE html>
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

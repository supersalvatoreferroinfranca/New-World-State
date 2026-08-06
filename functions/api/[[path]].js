export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Costruiamo l'indirizzo di destinazione sul Worker Cloudflare principale
  const targetUrl = `https://nws-wk.supersalvatoreferroinfranca.workers.dev${url.pathname}${url.search}`;
  
  // Clonavo gli header della richiesta originaria
  const headers = new Headers(request.headers);
  headers.delete('host'); // Rimuoviamo l'header host per evitare problemi di SNI/routing SSL
  
  let body = null;
  const methodUpper = request.method.toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(methodUpper)) {
    try {
      body = await request.clone().arrayBuffer();
    } catch (e) {
      console.warn('[Proxy API] Errore estrazione corpo richiesta:', e.message);
    }
  }
  
  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body
    });
    
    // Per completezza, clonavo la risposta ritornata dal Worker principale
    const responseHeaders = new Headers(response.headers);
    // Garantiamo che CORS sia sempre abilitato per evitare blocchi del browser sulle chiamate cross-origin
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      message: `Impossibile contattare il Database Worker di New World State. Errore Gateway: ${err.message}`
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

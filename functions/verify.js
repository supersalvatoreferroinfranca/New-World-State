export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Costruiamo l'indirizzo di destinazione sul Worker Cloudflare principale per la verifica QR code
  const targetUrl = `https://nws-wk.supersalvatoreferroinfranca.workers.dev/verify${url.search}`;
  
  // Clonavo gli header della richiesta originaria
  const headers = new Headers(request.headers);
  headers.delete('host'); // Rimuoviamo l'header host per evitare problemi di SNI/routing SSL
  
  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers
    });
    
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (err) {
    // Fallback: se il proxy fallisce, proviamo a reindirizzare l'utente direttamente alla home con il flag di verifica id
    return Response.redirect(`${url.origin}/?verify=true&${url.searchParams.toString()}`, 302);
  }
}


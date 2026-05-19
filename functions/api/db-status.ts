export const onRequestGet = async (context: any) => {
  const WORKER_URL = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev/';

  try {
    // We try to fetch the worker's root or a known status endpoint if available
    // Since I don't know the exact endpoint, we'll try to reach it.
    const res = await fetch(WORKER_URL);
    
    if (res.ok || res.status === 404) {
      // res.status 404 is often acceptable if it just means the root isn't defined but the worker is up
      return new Response(JSON.stringify({ 
        status: 'connected', 
        message: 'Connesso al Database Worker (NWS-WK).' 
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ 
      status: 'error', 
      message: `Il Worker Database ha risposto con codice ${res.status}.` 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('Worker Status Error:', error);
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: 'Impossibile raggiungere il Worker Database (NWS-WK). Verifica la configurazione del worker.',
      details: error.message 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
};

import { neon } from '@neondatabase/serverless';

export const onRequestGet = async (context: any) => {
  const { env } = context;

  if (!env.DATABASE_URL) {
    return new Response(JSON.stringify({ 
      status: 'unconfigured', 
      message: 'Configurazione DATABASE_URL mancante su Cloudflare.' 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const sql = neon(env.DATABASE_URL);
    // Ping the database
    await sql`SELECT 1`;
    
    return new Response(JSON.stringify({ 
      status: 'connected', 
      message: 'Connesso a Neon.tech (PostgreSQL) tramite Cloudflare Functions.' 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    console.error('DB Status Error:', error);
    
    // Provide diagnostic hints
    let diagnostic = 'Errore di connessione a Neon.tech.';
    if (error.message?.includes('ETIMEDOUT')) diagnostic = 'Timeout connessione: Neon non risponde.';
    if (error.message?.includes('ECONNREFUSED')) diagnostic = 'Connessione rifiutata: Host database non raggiungibile.';
    if (error.message?.includes('neon-connection-string')) diagnostic = 'DATABASE_URL non valida per gli header di Neon.';
    
    return new Response(JSON.stringify({ 
      status: 'error', 
      code: error.code || 'UNKNOWN', 
      message: diagnostic,
      details: error.message 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
};

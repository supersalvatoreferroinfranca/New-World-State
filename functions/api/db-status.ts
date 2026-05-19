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
      message: 'Connesso a Neon.tech (PostgreSQL)' 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    console.error('DB Status Error:', error);
    return new Response(JSON.stringify({ 
      status: 'error', 
      code: error.code || 'UNKNOWN', 
      message: error.message || 'Errore di connessione al database' 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
};

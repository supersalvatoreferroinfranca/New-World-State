export const onRequestPost = async (context: any) => {
  const { request, env } = context;
  const WORKER_URL = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev/';
  
  try {
    const body = await request.json();
    const { email, firstName, username, surname } = body;

    // Forward the registration request to the worker
    // Note: We use the same body. We assume the worker handles the DB insertion.
    const workerRes = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result: any = await workerRes.json();

    if (!workerRes.ok || !result.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: result.message || 'Errore durante la registrazione tramite il worker.' 
      }), { status: workerRes.status, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Send Email (Native Cloudflare Email) - only if insertion succeeded
    if (email && env.EMAIL) {
      try {
        const welcomeHtml = `
          <div style="font-family: serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h1 style="color: #1a365d; text-align: center;">Benvenuto, Cittadino ${firstName || username || 'Cittadino'}!</h1>
            <p>Siamo lieti di confermare che la tua richiesta di cittadinanza è stata registrata con successo nel Registro Anagrafico Mondiale.</p>
            <p>La tua richiesta sarà ora validata da un cittadino incaricato incaricato della verifica dei dati.</p>
            <p>Riceverai un'ulteriore email di conferma dell'inserimento definitivo al termine di questa procedura.</p>
            <br>
            <hr style="border: 0; border-top: 1px solid #eeeeee;">
            <p style="font-size: 12px; color: #666666; text-align: center;">
              New World State - Ufficio Anagrafe Mondiale<br>
              <i>Uniti per un futuro globale.</i>
            </p>
          </div>
        `;

        await env.EMAIL.send({
          from: "newuser@newworldstate.cloud",
          to: email,
          subject: "Benvenuto nel New World State!",
          content: [
            {
              type: "text/html",
              value: welcomeHtml
            }
          ]
        });

        // Send copy to info
        await env.EMAIL.send({
          from: "newuser@newworldstate.cloud",
          to: "info@newworldstate.cloud",
          subject: `[Copia] Nuova registrazione: ${firstName} ${surname}`,
          content: [
            {
              type: "text/html",
              value: `<p>Nuova registrazione ricevuta per <b>${email}</b>.</p>` + welcomeHtml
            }
          ]
        });
      } catch (e) {
        console.error('Cloudflare Email Error:', e);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Cittadino registrato con successo tramite Worker', 
      id: result.id 
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Registration Proxy Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Errore durante la comunicazione con il Database Worker.',
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

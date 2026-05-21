export async function onRequest(context) {
  const { request } = context;

  // Gestione CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const data = await request.json();
    
    const adminEmail = "supersalvatoreferroinfranca@gmail.com";
    const userEmail = data.email;
    const brandColor = "#0a1c3e";
    const lightBg = "#f8fafc";

    // Template email per l'Amministratore
    const adminHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: ${lightBg}; border-radius: 16px;">
        <div style="background-color: ${brandColor}; padding: 30px; border-radius: 12px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: white;">Nuovo Cittadino Registrato</h1>
          <p style="margin: 5px 0 0 0; color: #93c5fd; font-size: 14px;">Inoltrato da Cloudflare Pages Functions</p>
        </div>
        <div style="padding: 24px; background-color: white; border-radius: 12px; margin-top: 20px; border: 1px solid #e2e8f0;">
          <h2 style="font-size: 18px; color: ${brandColor}; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 0;">Anagrafica Richiedente</h2>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse; line-height: 1.8;">
            <tr><td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Cognome e Nome:</strong></td><td style="padding: 6px 0;"><b>${data.surname || ''} ${data.firstName || ''}</b></td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Sesso:</strong></td><td style="padding: 6px 0;">${data.gender || ''}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td><td style="padding: 6px 0;"><a href="mailto:${userEmail || ''}" style="color: #2563eb; font-weight: 600;">${userEmail || 'Nessuna'}</a></td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Telefono:</strong></td><td style="padding: 6px 0;">${data.phonePrefix || ''} ${data.phoneNumber || ''}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Plus Code Posizione:</strong></td><td style="padding: 6px 0; color:#0f766e; font-weight:600; font-family: monospace;">${data.plusCode || ''}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Descrizione Luogo:</strong></td><td style="padding: 6px 0;"><em>"${data.locationDescription || ''}"</em></td></tr>
          </table>
        </div>
      </div>
    `;

    // Template email per l'Utente
    const userHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: ${lightBg}; border-radius: 16px;">
        <div style="background-color: ${brandColor}; padding: 40px 30px; border-radius: 12px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 26px; font-weight: bold; color: white;">Richiesta Registrata!</h1>
          <p style="margin: 10px 0 0 0; color: #93c5fd; font-size: 16px;">Benvenuto nel registro del New World State</p>
        </div>
        <div style="padding: 30px; background-color: white; border-radius: 12px; margin-top: 20px; line-height: 1.6; border: 1px solid #e2e8f0;">
          <p style="font-size: 16px; margin-top: 0;">Caro/a <strong>${data.firstName || ''} ${data.surname || ''}</strong>,</p>
          <p style="font-size: 15px;">La tua richiesta di cittadinanza è stata correttamente registrata nel nostro sistema anagrafico.</p>
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <h3 style="margin: 0 0 5px 0; color: #14532d; font-size: 14px; font-weight: bold;">PROSSIMO PASSO: VALIDAZIONE</h3>
            <p style="margin: 0; color: #166534; font-size: 13px;">Un validatore NWS verificherà la conformità delle informazioni fornite. Al termine riceverai il tuo Certificato Digitale.</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
            <em>"Uniti nello spazio, legati per diritto."</em><br/>
            <strong>Ufficio dell'Anagrafe Federale del New World State</strong>
          </p>
        </div>
      </div>
    `;

    // Metodo nativo per inviare email via Mailchannels su Cloudflare
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

    // Invio automatico asincrono
    try {
      await sendMailViaMailchannels(adminEmail, `[NWS-ANAGRAFE] Nuova iscrizione di ${data.surname || ''} ${data.firstName || ''}`, adminHtml);
      if (userEmail && userEmail.includes('@')) {
        await sendMailViaMailchannels(userEmail.trim(), `Richiesta Ricevuta - New World State`, userHtml);
      }
    } catch (e) {
      console.error("Errore nell'invio automatico via Mailchannels:", e);
    }

    return new Response(JSON.stringify({ success: true, message: "Notifications processing triggered" }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

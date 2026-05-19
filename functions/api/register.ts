import { neon } from '@neondatabase/serverless';

export const onRequestPost = async (context: any) => {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { 
      surname, firstName, gender, birthDate, birthPlace, birthCountry,
      citizenship, maritalStatus, residenceAddress, residenceNumber, residenceZip, 
      residenceCity, residenceProvince, residenceCountry, email, phonePrefix, phoneNumber,
      username, password, documentHash,
      documentType, plusCode, locationDescription, latitude, longitude,
      isAmbassador, isPeacekeeper 
    } = body;

    const normalizedUsername = username ? username.toLowerCase().replace(/\s/g, '') : null;

    if (!env.DATABASE_URL) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Configurazione Database mancante su Cloudflare.' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(env.DATABASE_URL);

    // 1. Check for duplicates
    const duplicates = await sql`
      SELECT id FROM citizens 
      WHERE (email IS NOT NULL AND email = ${email || null})
      OR (username IS NOT NULL AND username = ${normalizedUsername})
      OR (document_hash IS NOT NULL AND document_hash = ${documentHash || null})
      OR (surname = ${surname || ''} AND firstname = ${firstName || ''} AND birthdate = ${birthDate || null})
    `;

    if (duplicates.length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Spiacenti, esiste già un cittadino registrato con questi dati o documento.' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const lat = (latitude !== null && latitude !== undefined && latitude !== '') ? parseFloat(latitude as string) : null;
    const lon = (longitude !== null && longitude !== undefined && longitude !== '') ? parseFloat(longitude as string) : null;

    // 2. Insert
    const result = await sql`
      INSERT INTO citizens (
        surname, firstname, gender, birthdate, birthplace, birthcountry,
        citizenship, maritalstatus, residenceaddress, residencenumber, residencezip, 
        residencecity, residenceprovince, residencecountry, registrationdate, email, phoneprefix, phonenumber,
        username, password, document_hash,
        documenttype, pluscode, locationdescription, location,
        isambassador, ispeacekeeper, status, createdat
      )
      VALUES (
        ${surname}, ${firstName}, ${gender}, ${birthDate || null}, ${birthPlace}, ${birthCountry},
        ${citizenship}, ${maritalStatus}, ${residenceAddress || null}, ${residenceNumber || null}, ${residenceZip || null},
        ${residenceCity || null}, ${residenceProvince || null}, ${residenceCountry || null}, ${new Date()}, 
        ${email || null}, ${phonePrefix || null}, ${phoneNumber || null},
        ${normalizedUsername}, ${password || null}, ${documentHash || null},
        ${documentType}, ${plusCode || null}, ${locationDescription || null},
        ${(lat !== null && lon !== null) ? sql`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)` : null},
        ${!!isAmbassador}, ${!!isPeacekeeper}, 'pending', ${new Date()}
      )
      RETURNING id
    `;

    // 3. Send Email (Native Cloudflare Email)
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
      message: 'Cittadino registrato con successo', 
      id: result[0].id 
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Registration Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Errore interno del server durante la registrazione.',
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

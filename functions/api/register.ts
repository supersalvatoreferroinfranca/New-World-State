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
      OR (surname = ${surname} AND firstname = ${firstName} AND birthdate = ${birthDate})
    `;

    if (duplicates.length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Spiacenti, esiste già un cittadino registrato con questi dati.' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

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
        ${residenceCity || null}, ${residenceProvince || null}, ${residenceCountry || null}, ${new Date().toISOString().split('T')[0]}, 
        ${email || null}, ${phonePrefix || null}, ${phoneNumber || null},
        ${normalizedUsername}, ${password || null}, ${documentHash || null},
        ${documentType}, ${plusCode || null}, ${locationDescription || null},
        ST_SetSRID(ST_MakePoint(${longitude || 0}, ${latitude || 0}), 4326),
        ${!!isAmbassador}, ${!!isPeacekeeper}, 'pending', ${new Date().toISOString()}
      )
      RETURNING id
    `;

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

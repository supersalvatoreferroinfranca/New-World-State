export const onRequestGet = async (context: any) => {
  const { request } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  const type = url.searchParams.get('type');
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');

  if (!q) {
    return new Response(JSON.stringify({ error: 'Query parameter q is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    let nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5`;
    
    if (lat && lon) {
      nominatimUrl += `&viewbox=${Number(lon)-0.5},${Number(lat)+0.5},${Number(lon)+0.5},${Number(lat)-0.5}`;
    }

    if (type === 'country') nominatimUrl += '&featuretype=country';
    if (type === 'city') nominatimUrl += '&featuretype=city';

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'WorldRegistrationApp/1.0 (contact: supersalvatoreferroinfranca@gmail.com)', 
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch suggestions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

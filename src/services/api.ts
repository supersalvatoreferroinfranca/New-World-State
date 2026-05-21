const WORKER_BASE = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev';

/**
 * A wrapper around fetch that automatically detects whether api endpoints returning
 * HTML fallbacks (or failing with 404/405 and network errors) should be redirected directly
 * to the CORS-enabled production Cloudflare Worker.
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  const cleanPath = url.startsWith('/') ? url : `/${url}`;

  // Check if we are running in the development preview (local or AI Studio domains)
  const isDevOrStudio = 
    typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname.includes('127.0.0.1') ||
     window.location.hostname.includes('ais-dev-') ||
     window.location.hostname.includes('ais-pre-'));

  const isProductionStaticDomain = !isDevOrStudio;

  if (isProductionStaticDomain && cleanPath.startsWith('/api/')) {
    const directUrl = `${WORKER_BASE}${cleanPath}`;
    console.log(`[API] Production Static Host detected (${window.location.hostname}). Routing directly to Cloudflare Worker: ${directUrl}`);
    try {
      const res = await fetch(directUrl, options);
      // If the worker responded successfully or with a valid client/server error, return it
      if (res.ok || res.status < 500) {
        return res;
      }
    } catch (err) {
      console.error(`[API] Direct worker fetch failed for ${directUrl}:`, err);
    }
  }

  try {
    const primaryRes = await fetch(cleanPath, options);
    
    // Check if the response was redirected to the SPA HTML index page (content-type includes 'text/html')
    // or if the HTTP status indicates a Method Not Allowed (405) or Not Found (404) on the local server
    const contentType = primaryRes.headers.get('content-type') || '';
    
    const isErrorOrHtml = 
      primaryRes.status === 404 || 
      primaryRes.status === 405 || 
      contentType.includes('text/html');

    if (cleanPath.startsWith('/api/') && isErrorOrHtml) {
      const directUrl = `${WORKER_BASE}${cleanPath}`;
      console.warn(`[API] HTML Fallback or status ${primaryRes.status} handled on ${cleanPath}. Auto-redirecting to Worker: ${directUrl}`);
      return await fetch(directUrl, options);
    }
    
    return primaryRes;
  } catch (err) {
    if (cleanPath.startsWith('/api/')) {
      const directUrl = `${WORKER_BASE}${cleanPath}`;
      console.warn(`[API] Network error on local route ${cleanPath}. Retrying directly on Worker: ${directUrl}`, err);
      try {
        return await fetch(directUrl, options);
      } catch (retryErr) {
        throw retryErr;
      }
    }
    throw err;
  }
}

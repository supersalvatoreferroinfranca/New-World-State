const WORKER_BASE = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev';

/**
 * A wrapper around fetch that automatically detects whether api endpoints returning
 * HTML fallbacks (or failing with 404/network errors) should be redirected directly
 * to the CORS-enabled production Cloudflare Worker.
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  const cleanPath = url.startsWith('/') ? url : `/${url}`;

  // If we are already running on a domain we know has no server backend like newworldstate.cloud,
  // we can skip the local proxy attempt entirely for a faster experience.
  const isKnownStaticHost = 
    typeof window !== 'undefined' && 
    (window.location.hostname.endsWith('newworldstate.cloud') || 
     window.location.hostname.endsWith('github.io') ||
     window.location.hostname.endsWith('pages.dev'));

  if (isKnownStaticHost && cleanPath.startsWith('/api/')) {
    const directUrl = `${WORKER_BASE}${cleanPath}`;
    console.log(`[API] Static Host detected. Routing directly to Cloudflare Worker: ${directUrl}`);
    try {
      const res = await fetch(directUrl, options);
      if (res.ok || res.status < 500) {
        return res;
      }
    } catch (err) {
      console.error(`[API] Failed direct worker fetch for ${directUrl}:`, err);
    }
  }

  try {
    const primaryRes = await fetch(cleanPath, options);
    
    // Check if the response was redirected to the SPA HTML index page (content-type includes 'text/html')
    const contentType = primaryRes.headers.get('content-type') || '';
    
    if (cleanPath.startsWith('/api/') && (contentType.includes('text/html') || primaryRes.status === 404)) {
      const directUrl = `${WORKER_BASE}${cleanPath}`;
      console.warn(`[API] HTML Fallback or 404 handled on ${cleanPath}. Auto-redirecting to Worker: ${directUrl}`);
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
        // If the retry also fails, throw the original error or the retry error
        throw retryErr;
      }
    }
    throw err;
  }
}

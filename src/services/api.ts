const WORKER_BASE = 'https://nws-wk.supersalvatoreferroinfranca.workers.dev';

/**
 * A wrapper around fetch that calls the local API server and automatically
 * falls back to the Cloudflare Worker if running on a purely static host
 * (where /api/* returns 404/HTML SPA fallback) or upon network error.
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  const cleanPath = url.startsWith('/') ? url : `/${url}`;

  try {
    const primaryRes = await fetch(cleanPath, options);
    
    // Check if the response was redirected to the SPA HTML index page (content-type includes 'text/html')
    // or if the HTTP status indicates a Method Not Allowed (405) or Not Found (404) on a static hosting CDN
    const contentType = primaryRes.headers.get('content-type') || '';
    
    const isErrorOrHtml = 
      primaryRes.status === 404 || 
      primaryRes.status === 405 || 
      (cleanPath.startsWith('/api/') && contentType.includes('text/html'));

    if (cleanPath.startsWith('/api/') && isErrorOrHtml) {
      const directUrl = `${WORKER_BASE}${cleanPath}`;
      return await fetch(directUrl, options);
    }
    
    return primaryRes;
  } catch (err) {
    if (cleanPath.startsWith('/api/')) {
      const directUrl = `${WORKER_BASE}${cleanPath}`;
      try {
        return await fetch(directUrl, options);
      } catch (retryErr) {
        throw retryErr;
      }
    }
    throw err;
  }
}


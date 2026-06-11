export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Point target to root index.html without search parameters to prevent asset-lookup 404
  const newUrl = new URL(url.origin);
  newUrl.pathname = '/index.html';
  
  try {
    // ASSETS is a built-in Cloudflare Pages binding to grab static files of the build
    return await context.env.ASSETS.fetch(newUrl);
  } catch (err) {
    // Fallback redirect if ASSETS fetch is not bound in local preview of wrangler
    return Response.redirect(`${url.origin}/?verify=true&${url.searchParams.toString()}`, 302);
  }
}

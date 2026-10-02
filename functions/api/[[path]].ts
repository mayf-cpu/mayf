/**
 * Cloudflare Pages Function: Proxies all /api/* requests to the live backend server.
 * This replaces the invalid 200 proxy in _redirects and works natively on Cloudflare Pages.
 */
interface PagesContext {
  request: Request;
  params: {
    path?: string[];
  };
  env: Record<string, any>;
  next: () => Promise<Response>;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const url = new URL(context.request.url);
  const backendBase = 'https://ais-pre-mdcohwj24k254wgdckgjjc-464692473971.asia-southeast1.run.app';
  const targetUrl = `${backendBase}${url.pathname}${url.search}`;

  const req = context.request;

  const forwardHeaders = new Headers(req.headers);
  forwardHeaders.set('X-Forwarded-Host', url.host);
  forwardHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

  const init: RequestInit = {
    method: req.method,
    headers: forwardHeaders,
    redirect: 'follow',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req.body;
  }

  try {
    return await fetch(targetUrl, init);
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Backend service unreachable', details: err?.message }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

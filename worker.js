/**
 * Cloudflare Worker — proxy for the RCT Treatment Embed.
 *
 * Two routes, same Worker:
 *   POST /  or  POST /llm     → forwards to OpenRouter chat completions
 *                               with the secret OPENROUTER_API_KEY.
 *   POST /search              → forwards to Brave Search API with the
 *                               secret BRAVE_SEARCH_API_KEY.
 *
 * (Originally written against Google Programmable Search, but Google
 *  removed the "Search the entire web" option for new Programmable
 *  Search Engines, so we switched to Brave. The response shape returned
 *  to the browser is unchanged: {items: [{title, url, displayUrl,
 *  snippet}]}.)
 *
 * Both routes share the same Origin allowlist + CORS headers + JSON
 * helpers so the participant's browser only sees Worker URLs and never
 * a third-party API key.
 *
 * Required env vars (Workers & Pages → your worker → Settings →
 *   Variables and Secrets):
 *
 *   OPENROUTER_API_KEY      Secret    Real OpenRouter key.
 *   BRAVE_SEARCH_API_KEY    Secret    From api.search.brave.com (free
 *                                      tier: 2,000 queries/month, 1 qps).
 *   ALLOWED_ORIGINS         Text      Comma-separated origins. Example:
 *                                      https://bruno20033.github.io,
 *                                      https://oii.eu.qualtrics.com
 *
 * Optional:
 *   HTTP_REFERER            Text      Sent to OpenRouter for attribution.
 *   X_TITLE                 Text      Sent to OpenRouter for attribution.
 *   MAX_TOKENS              Text      Hard cap on max_tokens (default 1024).
 *   SEARCH_NUM_RESULTS      Text      Max results per search query (1-20,
 *                                      default 10).
 *   SEARCH_COUNTRY          Text      Two-letter ISO country code passed
 *                                      to Brave (default 'US'). Affects
 *                                      result locale.
 *   SEARCH_SAFESEARCH       Text      'off' | 'moderate' | 'strict'
 *                                      (default 'moderate').
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---------------------------------------------------------------
    // CORS pre-flight (any path, any method)
    // ---------------------------------------------------------------
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors(request, env) });
    }

    // ---------------------------------------------------------------
    // Origin allowlist — applied to every non-OPTIONS request.
    // ---------------------------------------------------------------
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.length > 0 && !allowed.includes(origin)) {
      return json({ error: 'Forbidden origin: ' + origin }, 403, request, env);
    }

    // ---------------------------------------------------------------
    // SEARCH route → Brave Search API
    // ---------------------------------------------------------------
    if (url.pathname === '/search') {
      if (request.method !== 'POST') {
        return json({ error: 'Method Not Allowed' }, 405, request, env);
      }
      if (!env.BRAVE_SEARCH_API_KEY) {
        return json({ error: 'Worker misconfigured: BRAVE_SEARCH_API_KEY not set' }, 500, request, env);
      }

      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, request, env); }
      const query = (body && body.query ? String(body.query) : '').trim();
      if (!query) {
        return json({ error: 'query required' }, 400, request, env);
      }

      const count = clampInt(env.SEARCH_NUM_RESULTS, 10, 1, 20);
      const params = new URLSearchParams({
        q:          query,
        count:      String(count),
        country:    env.SEARCH_COUNTRY    || 'US',
        safesearch: env.SEARCH_SAFESEARCH || 'moderate',
      });
      const upstream = await fetch(
        'https://api.search.brave.com/res/v1/web/search?' + params.toString(),
        {
          headers: {
            'Accept':                'application/json',
            'Accept-Encoding':       'gzip',
            'X-Subscription-Token':  env.BRAVE_SEARCH_API_KEY,
          },
        }
      );
      const data = await upstream.json().catch(() => ({}));

      if (!upstream.ok) {
        return json(
          {
            error: (data && (data.message || (data.error && data.error.detail))) || 'Brave search error',
            http_status: upstream.status,
          },
          upstream.status,
          request, env
        );
      }

      // Brave returns { web: { results: [{ title, url, description, meta_url: { hostname }, ... }] }, ... }
      // Normalise to the same {title, url, displayUrl, snippet} shape the
      // browser already expects from the previous Google CSE wiring.
      const webResults = (data && data.web && Array.isArray(data.web.results)) ? data.web.results : [];
      const items = webResults.map(r => ({
        title:      r.title || '',
        url:        r.url || '',
        displayUrl: (r.meta_url && r.meta_url.hostname) || hostnameOf(r.url),
        snippet:    r.description || '',
      }));
      return json({ items, total: String(webResults.length) }, 200, request, env);
    }

    // ---------------------------------------------------------------
    // LLM routes (POST / and POST /llm) → OpenRouter chat completions
    // ---------------------------------------------------------------
    if (url.pathname === '/' || url.pathname === '/llm') {
      if (request.method !== 'POST') {
        return json({ error: 'Method Not Allowed' }, 405, request, env);
      }
      if (!env.OPENROUTER_API_KEY) {
        return json({ error: 'Worker misconfigured: OPENROUTER_API_KEY not set' }, 500, request, env);
      }

      let payload;
      try { payload = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, request, env); }
      if (!payload || !Array.isArray(payload.messages)) {
        return json({ error: 'Body must contain a messages array' }, 400, request, env);
      }
      const maxTokens = Number(env.MAX_TOKENS || 1024);
      if (!payload.max_tokens || payload.max_tokens > maxTokens) {
        payload.max_tokens = maxTokens;
      }

      const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + env.OPENROUTER_API_KEY,
          'Content-Type': 'application/json',
          'HTTP-Referer': env.HTTP_REFERER || 'https://thesis-rct.example',
          'X-Title':      env.X_TITLE      || 'RCT Chart Study',
        },
        body: JSON.stringify(payload),
      });

      const text = await upstream.text();
      return new Response(text, {
        status: upstream.status,
        headers: {
          ...cors(request, env),
          'Content-Type': 'application/json',
        },
      });
    }

    // ---------------------------------------------------------------
    // Anything else → 404
    // ---------------------------------------------------------------
    return json({ error: 'Not found: ' + url.pathname }, 404, request, env);
  },
};

// -------------------------------------------------------------------
// helpers
// -------------------------------------------------------------------
function cors(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const allow = allowed.includes(origin) ? origin : (allowed[0] || '*');
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(obj, status, request, env) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      ...cors(request, env),
      'Content-Type': 'application/json',
    },
  });
}

function clampInt(raw, fallback, min, max) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function hostnameOf(url) {
  try { return new URL(url).hostname; } catch { return url || ''; }
}

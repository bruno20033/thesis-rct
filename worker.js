/**
 * Cloudflare Worker — proxy for the RCT Treatment Embed.
 *
 * Two routes, same Worker:
 *   POST /  or  POST /llm     → forwards to OpenRouter chat completions
 *                               with the secret OPENROUTER_API_KEY.
 *   POST /search              → forwards to Google Programmable Search
 *                               (Custom Search JSON API) with the secret
 *                               GOOGLE_CSE_API_KEY + public GOOGLE_CSE_ID.
 *
 * Both routes share the same Origin allowlist + CORS headers + JSON
 * helpers so the participant's browser only sees Worker URLs and never
 * a third-party API key.
 *
 * Required env vars (Workers & Pages → your worker → Settings →
 *   Variables and Secrets):
 *
 *   OPENROUTER_API_KEY    Secret    Real OpenRouter key.
 *   GOOGLE_CSE_API_KEY    Secret    Google API key (with Custom Search
 *                                    API enabled at console.cloud.google.com).
 *   GOOGLE_CSE_ID         Text      The `cx` from
 *                                    programmablesearchengine.google.com,
 *                                    e.g. "017576662512468239146:omuauf_lfve".
 *                                    The CSE must be configured to
 *                                    "Search the entire web".
 *   ALLOWED_ORIGINS       Text      Comma-separated origins. Example:
 *                                    https://bruno20033.github.io,
 *                                    https://oii.eu.qualtrics.com
 *
 * Optional:
 *   HTTP_REFERER          Text      Sent to OpenRouter for attribution.
 *   X_TITLE               Text      Sent to OpenRouter for attribution.
 *   MAX_TOKENS            Text      Hard cap on max_tokens (default 1024).
 *   SEARCH_NUM_RESULTS    Text      Max results per search query (1-10,
 *                                    default 10).
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
    // SEARCH route → Google Programmable Search (Custom Search JSON API)
    // ---------------------------------------------------------------
    if (url.pathname === '/search') {
      if (request.method !== 'POST') {
        return json({ error: 'Method Not Allowed' }, 405, request, env);
      }
      if (!env.GOOGLE_CSE_API_KEY || !env.GOOGLE_CSE_ID) {
        return json({ error: 'Worker misconfigured: GOOGLE_CSE_API_KEY/GOOGLE_CSE_ID not set' }, 500, request, env);
      }

      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, request, env); }
      const query = (body && body.query ? String(body.query) : '').trim();
      if (!query) {
        return json({ error: 'query required' }, 400, request, env);
      }

      const num = clampInt(env.SEARCH_NUM_RESULTS, 10, 1, 10);
      const params = new URLSearchParams({
        key:  env.GOOGLE_CSE_API_KEY,
        cx:   env.GOOGLE_CSE_ID,
        q:    query,
        num:  String(num),
        safe: 'active',
      });
      const upstream = await fetch(
        'https://www.googleapis.com/customsearch/v1?' + params.toString()
      );
      const data = await upstream.json().catch(() => ({}));

      if (!upstream.ok) {
        return json(
          { error: (data.error && data.error.message) || 'CSE error', http_status: upstream.status },
          upstream.status,
          request, env
        );
      }
      const items = (data.items || []).map(it => ({
        title:      it.title || '',
        url:        it.link  || '',
        displayUrl: it.displayLink || '',
        snippet:    it.snippet || '',
      }));
      const total = (data.searchInformation && data.searchInformation.totalResults) || '0';
      return json({ items, total: String(total) }, 200, request, env);
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

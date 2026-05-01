/**
 * Cloudflare Worker — OpenRouter proxy for the RCT Treatment Embed.
 *
 * Holds the OpenRouter API key as a server-side secret. The participant's
 * browser calls THIS worker, the worker adds the Authorization header and
 * forwards to OpenRouter, then returns the response unchanged.
 *
 * Required Worker secrets / variables (set in Cloudflare dashboard:
 *   Workers & Pages → your worker → Settings → Variables):
 *
 *   OPENROUTER_API_KEY   (encrypted secret)  Your real OpenRouter key.
 *   ALLOWED_ORIGINS      (plain text)        Comma-separated list of
 *                                            origins that may call this
 *                                            proxy. Example:
 *                                              https://bruno20033.github.io,
 *                                              https://oii.eu.qualtrics.com
 *
 * Optional:
 *   HTTP_REFERER         (plain text)        Sent to OpenRouter for
 *                                            attribution. Default below.
 *   X_TITLE              (plain text)        Sent to OpenRouter for
 *                                            attribution. Default below.
 *   MAX_TOKENS           (plain text)        Hard cap on max_tokens in
 *                                            the upstream request.
 *                                            Defaults to 1024.
 */

export default {
  async fetch(request, env) {
    // ---------------------------------------------------------------
    // CORS pre-flight
    // ---------------------------------------------------------------
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors(request, env) });
    }

    // ---------------------------------------------------------------
    // Method allowlist — proxy only POST chat completions
    // ---------------------------------------------------------------
    if (request.method !== 'POST') {
      return json({ error: 'Method Not Allowed' }, 405, request, env);
    }

    // ---------------------------------------------------------------
    // Origin allowlist — only the GitHub Pages site (and Qualtrics
    // origins, for direct testing) may call this proxy. Without this,
    // anyone who finds the worker URL could use your API quota.
    // ---------------------------------------------------------------
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.length > 0 && !allowed.includes(origin)) {
      return json({ error: 'Forbidden origin: ' + origin }, 403, request, env);
    }

    // ---------------------------------------------------------------
    // Validate body and clamp max_tokens before forwarding
    // ---------------------------------------------------------------
    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, request, env);
    }
    if (!payload || !Array.isArray(payload.messages)) {
      return json({ error: 'Body must contain a messages array' }, 400, request, env);
    }
    const maxTokens = Number(env.MAX_TOKENS || 1024);
    if (!payload.max_tokens || payload.max_tokens > maxTokens) {
      payload.max_tokens = maxTokens;
    }

    // ---------------------------------------------------------------
    // Forward to OpenRouter with the secret key
    // ---------------------------------------------------------------
    if (!env.OPENROUTER_API_KEY) {
      return json({ error: 'Worker misconfigured: OPENROUTER_API_KEY not set' }, 500, request, env);
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

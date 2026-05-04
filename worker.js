/**
 * Cloudflare Worker — proxy for the RCT Treatment Embed.
 *
 * Two routes, same Worker:
 *   POST /  or  POST /llm     → forwards to OpenRouter chat completions
 *                               with the secret OPENROUTER_API_KEY.
 *   POST /search              → server-side scrape of DuckDuckGo's HTML
 *                               results page, parsed into JSON. No API
 *                               key, no signup, no quota.
 *
 * History: the SEARCH route originally targeted Google Programmable
 * Search (Google removed "search the entire web" for new engines in
 * 2024) and then Brave Search (free tier requires a payment card on
 * file). DuckDuckGo's HTML page is publicly accessible and DDG
 * permits non-commercial use, which suits a thesis pilot. The
 * browser-facing response shape is unchanged across all backends:
 *   {items: [{title, url, displayUrl, snippet}], total}
 *
 * Both routes share the same Origin allowlist + CORS headers + JSON
 * helpers so the participant's browser only sees Worker URLs and never
 * a third-party API key.
 *
 * Required env vars (Workers & Pages → your worker → Settings →
 *   Variables and Secrets):
 *
 *   OPENROUTER_API_KEY      Secret    Real OpenRouter key.
 *   ALLOWED_ORIGINS         Text      Comma-separated origins. Example:
 *                                      https://bruno20033.github.io,
 *                                      https://oii.eu.qualtrics.com
 *
 *   (No SEARCH_* secret is required — DuckDuckGo needs none.)
 *
 * Optional:
 *   HTTP_REFERER            Text      Sent to OpenRouter for attribution.
 *   X_TITLE                 Text      Sent to OpenRouter for attribution.
 *   MAX_TOKENS              Text      Hard cap on max_tokens (default 1024).
 *   SEARCH_NUM_RESULTS      Text      Max results per search query (1-30,
 *                                      default 10).
 *   SEARCH_REGION           Text      DDG region code, default 'wt-wt'
 *                                      (no region). Examples: 'us-en',
 *                                      'uk-en', 'de-de'.
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
    // SEARCH route → DuckDuckGo HTML results, parsed server-side.
    // No API key required.
    // ---------------------------------------------------------------
    if (url.pathname === '/search') {
      if (request.method !== 'POST') {
        return json({ error: 'Method Not Allowed' }, 405, request, env);
      }

      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, request, env); }
      const query = (body && body.query ? String(body.query) : '').trim();
      if (!query) {
        return json({ error: 'query required' }, 400, request, env);
      }

      const count = clampInt(env.SEARCH_NUM_RESULTS, 10, 1, 30);
      const region = env.SEARCH_REGION || 'wt-wt';
      // DDG safesearch query param: kp=1 strict, kp=-1 off, kp=-2 moderate.
      const safe = (env.SEARCH_SAFESEARCH || 'moderate').toLowerCase();
      const kp = safe === 'strict' ? '1' : (safe === 'off' ? '-1' : '-2');

      const formBody = new URLSearchParams({
        q:  query,
        kl: region,   // region/locale code
        kp: kp,       // safesearch
      }).toString();

      // POST to DuckDuckGo HTML endpoint. POST returns a fully rendered
      // HTML results page with stable .result__a / .result__snippet
      // anchors that we can extract with HTMLRewriter.
      const upstream = await fetch('https://html.duckduckgo.com/html/', {
        method: 'POST',
        headers: {
          'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Content-Type':    'application/x-www-form-urlencoded',
        },
        body: formBody,
      });

      if (!upstream.ok) {
        return json(
          { error: 'DuckDuckGo HTTP ' + upstream.status, http_status: upstream.status },
          upstream.status >= 400 ? upstream.status : 502,
          request, env
        );
      }

      const html = await upstream.text();

      // Detect DDG's anti-bot interstitial and surface it cleanly.
      if (/anomaly|please try again/i.test(html) && !/result__a/.test(html)) {
        return json({ error: 'DuckDuckGo rate-limit/anomaly check; retry shortly.' }, 429, request, env);
      }

      const items = parseDuckDuckGoHtml(html, count);
      return json({ items, total: String(items.length) }, 200, request, env);
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

// -------------------------------------------------------------------
// DuckDuckGo HTML parser
// -------------------------------------------------------------------
//
// DDG's html.duckduckgo.com results page renders each web result as:
//
//   <div class="result results_links results_links_deep web-result">
//     <h2 class="result__title">
//       <a class="result__a" href="REDIRECT_URL">TITLE_HTML</a>
//     </h2>
//     <a class="result__snippet" href="REDIRECT_URL">SNIPPET_HTML</a>
//     <a class="result__url" href="REDIRECT_URL">DISPLAY_URL</a>
//   </div>
//
// REDIRECT_URL is one of:
//   //duckduckgo.com/l/?uddg=ENCODED_REAL_URL&...   (DDG redirect wrapper)
//   https://www.example.com/...                     (occasionally direct)
//
// The HTML is reasonably stable — DDG hasn't changed these class names
// in years — but the parser is forgiving so a small markup tweak won't
// silently zero out results.
function parseDuckDuckGoHtml(html, max) {
  // Split the page into per-result blocks. Each organic result block
  // begins with `<div class="result results_links ...">`. Sponsored
  // results carry an extra `result--ad` / `result__sponsored` class
  // and we skip them so the experimental control isn't contaminated
  // with paid placements.
  var blocks = html.split(/<div\s+class="result\s+results_links/);
  var results = [];

  for (var i = 1; i < blocks.length && results.length < max; i++) {
    var block = blocks[i];

    // Skip sponsored / ad blocks.
    if (/result--ad|result__sponsored|nrn-react-div/i.test(block)) continue;

    // Title + outbound href.
    var titleMatch = /<a\s+rel="nofollow"\s+class="result__a"\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(block);
    if (!titleMatch) continue;
    var url = unwrapDdgUrl(titleMatch[1]);
    var title = stripHtml(titleMatch[2]);
    if (!url || !title) continue;

    // Skip residual ad redirects that escaped the sponsored-class check.
    if (/duckduckgo\.com\/y\.js/i.test(url)) continue;

    // Snippet — separate regex so we tolerate the result__extras div
    // that DDG injects between title and snippet.
    var snippetMatch = /<a\s+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/.exec(block);
    var snippet = snippetMatch ? stripHtml(snippetMatch[1]) : '';

    results.push({
      title: title,
      url: url,
      displayUrl: hostnameOf(url),
      snippet: snippet
    });
  }
  return results;
}

function unwrapDdgUrl(href) {
  // External links land at //duckduckgo.com/l/?uddg=ENCODED&rut=...
  // Pull out the actual destination so the click navigates straight to
  // the real site, not through DDG's redirector.
  if (!href) return '';
  if (href.indexOf('//duckduckgo.com/l/?') === 0) href = 'https:' + href;
  if (href.indexOf('https://duckduckgo.com/l/?') === 0 ||
      href.indexOf('http://duckduckgo.com/l/?')  === 0) {
    try {
      var u = new URL(href);
      var real = u.searchParams.get('uddg');
      return real ? decodeURIComponent(real) : href;
    } catch { return href; }
  }
  return href.indexOf('//') === 0 ? 'https:' + href : href;
}

function stripHtml(s) {
  return String(s)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&hellip;/g, '…')
    .replace(/\s+/g, ' ')
    .trim();
}

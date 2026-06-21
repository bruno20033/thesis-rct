/**
 * Cloudflare Worker — proxy for the RCT Treatment Embed.
 *
 * Four routes, same Worker:
 *   POST /  or  POST /llm     → forwards to OpenRouter chat completions
 *                               with the secret OPENROUTER_API_KEY (the
 *                               participant-facing generator).
 *   POST /search              → Google web results via the Serper.dev
 *                               API (server-side, secret SERPER_API_KEY),
 *                               normalised to JSON.
 *   POST /judge               → forwards to OpenRouter with the secret
 *                               OPENROUTER_JUDGE_API_KEY for the LLM-as-
 *                               Judge fidelity layer (Socratic arm only).
 *                               The Judge model is supplied per request
 *                               in the `model` body field, so the Judge
 *                               provider can be swapped without re-deploy.
 *   POST /fetch               → fetches the given URL server-side, strips
 *                               boilerplate (nav/header/footer/scripts),
 *                               and returns {title, site, blocks} for the
 *                               embed.html reader-mode fallback. Triggered
 *                               automatically when an iframe is blocked by
 *                               X-Frame-Options / CSP frame-ancestors.
 *
 * History: the SEARCH route has run on Google Programmable Search
 * (Google removed "search the entire web" for new engines in 2024),
 * Brave Search (free tier needs a card on file), and a DuckDuckGo HTML
 * scrape. The DDG scrape was publicly accessible but rate-limited from
 * datacentre IPs — it served its anomaly page after a few queries,
 * breaking the SEARCH control mid-session. The current backend is the
 * Serper.dev Google Search API: keyed, quota-backed, and reliable at
 * trial scale. The browser-facing response shape is unchanged across
 * all backends:
 *   {items: [{title, url, displayUrl, snippet}], total}
 *
 * All three routes share the same Origin allowlist + CORS headers +
 * JSON helpers so the participant's browser only sees Worker URLs and
 * never a third-party API key.
 *
 * Required env vars (Workers & Pages → your worker → Settings →
 *   Variables and Secrets):
 *
 *   OPENROUTER_API_KEY        Secret  Generator OpenRouter key.
 *   OPENROUTER_JUDGE_API_KEY  Secret  Judge OpenRouter key. May be set
 *                                      to the same value as the
 *                                      generator key, but separate so
 *                                      spend / rotation can be tracked
 *                                      independently. If unset, the
 *                                      Worker falls back to
 *                                      OPENROUTER_API_KEY for /judge.
 *   ALLOWED_ORIGINS           Text    Comma-separated origins. Example:
 *                                      https://bruno20033.github.io,
 *                                      https://oii.eu.qualtrics.com
 *   SERPER_API_KEY            Secret  Serper.dev API key — used by
 *                                      /search for Google results.
 *                                      Get one at serper.dev.
 *
 * Optional:
 *   HTTP_REFERER              Text    Sent to OpenRouter for attribution.
 *   X_TITLE                   Text    Sent to OpenRouter for attribution.
 *   MAX_TOKENS                Text    Hard cap on max_tokens for /llm
 *                                      (default 1024).
 *   JUDGE_MAX_TOKENS          Text    Hard cap on max_tokens for /judge
 *                                      (default 400 — short JSON only).
 *   SEARCH_NUM_RESULTS        Text    Max organic results per query
 *                                      (1-30, default 10).
 *   SEARCH_GL                 Text    Google country code, default 'us'.
 *                                      Examples: 'us', 'gb', 'de'.
 *   SEARCH_HL                 Text    Google interface language,
 *                                      default 'en'. Examples: 'en', 'de'.
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
    // /export is token-protected, not origin-protected (called from curl/scripts)
    if (url.pathname === '/export' && request.method === 'GET') {
      // skip origin check
    } else if (allowed.length > 0 && !allowed.includes(origin)) {
      return json({ error: 'Forbidden origin: ' + origin }, 403, request, env);
    }

    // ---------------------------------------------------------------
    // SEARCH route → Google web results via the Serper.dev API.
    // Requires the SERPER_API_KEY secret. Serper returns Google's SERP
    // as JSON; we keep only organic results and normalise them to the
    // stable browser-facing shape {items:[{title,url,displayUrl,snippet}]}.
    // ---------------------------------------------------------------
    if (url.pathname === '/search') {
      if (request.method !== 'POST') {
        return json({ error: 'Method Not Allowed' }, 405, request, env);
      }
      if (!env.SERPER_API_KEY) {
        return json({ error: 'Worker misconfigured: SERPER_API_KEY not set' }, 500, request, env);
      }

      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, request, env); }
      const query = (body && body.query ? String(body.query) : '').trim();
      if (!query) {
        return json({ error: 'query required' }, 400, request, env);
      }

      const count = clampInt(env.SEARCH_NUM_RESULTS, 10, 1, 30);
      // Per-request language (bilingual study): the embed sends lang=DE for German
      // participants so the SEARCH arm gets German Google results; everyone else
      // falls back to the Worker's configured defaults (English).
      const reqLang = (body && body.lang ? String(body.lang) : '').trim().toUpperCase();
      const isDE = reqLang === 'DE';
      const gl = isDE ? 'de' : (env.SEARCH_GL || 'us').toLowerCase();   // Google country
      const hl = isDE ? 'de' : (env.SEARCH_HL || 'en').toLowerCase();   // interface language

      let upstream;
      try {
        upstream = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY':    env.SERPER_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: query, num: count, gl: gl, hl: hl }),
        });
      } catch (err) {
        return json({ error: 'Serper fetch failed: ' + String(err && err.message || err) }, 502, request, env);
      }

      if (!upstream.ok) {
        // 401/403 = bad or missing key; 429 = Serper plan quota exhausted.
        const detail = await upstream.text().catch(function () { return ''; });
        return json(
          { error: 'Serper HTTP ' + upstream.status, http_status: upstream.status, detail: String(detail).slice(0, 300) },
          upstream.status >= 400 ? upstream.status : 502,
          request, env
        );
      }

      let data;
      try { data = await upstream.json(); } catch { return json({ error: 'Serper returned non-JSON' }, 502, request, env); }

      const items = parseSerperResults(data, count);
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
    // JUDGE route (POST /judge) → OpenRouter chat completions for the
    // LLM-as-Judge fidelity layer. Same shape as /llm but uses a
    // separate API key (OPENROUTER_JUDGE_API_KEY, falling back to
    // OPENROUTER_API_KEY) and a tighter max-tokens cap. The Judge
    // model is supplied per request so the Judge provider can be
    // swapped without re-deploying the worker.
    // ---------------------------------------------------------------
    if (url.pathname === '/judge') {
      if (request.method !== 'POST') {
        return json({ error: 'Method Not Allowed' }, 405, request, env);
      }
      const judgeKey = env.OPENROUTER_JUDGE_API_KEY || env.OPENROUTER_API_KEY;
      if (!judgeKey) {
        return json({ error: 'Worker misconfigured: OPENROUTER_JUDGE_API_KEY (or OPENROUTER_API_KEY fallback) not set' }, 500, request, env);
      }

      let payload;
      try { payload = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, request, env); }
      if (!payload || !Array.isArray(payload.messages)) {
        return json({ error: 'Body must contain a messages array' }, 400, request, env);
      }
      if (!payload.model || typeof payload.model !== 'string') {
        return json({ error: 'Body must specify a `model` string (Judge model id)' }, 400, request, env);
      }

      // Hard cap on Judge max_tokens — Judge response is short JSON.
      const judgeMaxTokens = Number(env.JUDGE_MAX_TOKENS || 400);
      if (!payload.max_tokens || payload.max_tokens > judgeMaxTokens) {
        payload.max_tokens = judgeMaxTokens;
      }
      // Force determinism floor for the Judge — caller can still pick
      // anything up to 0.3, but we never let it exceed 0.3 here.
      if (typeof payload.temperature !== 'number' || payload.temperature > 0.3) {
        payload.temperature = 0.1;
      }

      const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + judgeKey,
          'Content-Type': 'application/json',
          'HTTP-Referer': env.HTTP_REFERER || 'https://thesis-rct.example',
          'X-Title':      (env.X_TITLE || 'RCT Chart Study') + ' (Judge)',
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
    // FETCH route (POST /fetch) → server-side page fetch + text
    // extraction for the reader-mode fallback. Called automatically
    // by embed.html when an iframe is blocked by X-Frame-Options / CSP.
    // Returns {title, site, blocks} where blocks is an ordered array of
    // {type:'h'|'p'|'li', text, level?} suitable for safe rendering.
    // ---------------------------------------------------------------
    if (url.pathname === '/fetch') {
      if (request.method !== 'POST') {
        return json({ error: 'Method Not Allowed' }, 405, request, env);
      }

      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400, request, env); }
      const targetUrl = (body && body.url ? String(body.url) : '').trim();
      if (!targetUrl) {
        return json({ error: 'url required' }, 400, request, env);
      }

      let parsed;
      try {
        parsed = new URL(targetUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return json({ error: 'Only http/https URLs are supported' }, 400, request, env);
        }
      } catch {
        return json({ error: 'Invalid URL' }, 400, request, env);
      }

      let upstream;
      try {
        upstream = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
      } catch (err) {
        return json({ error: 'Fetch failed: ' + String(err && err.message || err) }, 502, request, env);
      }

      if (!upstream.ok) {
        return json({ error: 'Upstream HTTP ' + upstream.status }, 502, request, env);
      }

      const ct = upstream.headers.get('content-type') || '';
      if (!ct.includes('html')) {
        return json({ error: 'Not an HTML page (' + ct.split(';')[0].trim() + ')' }, 415, request, env);
      }

      let html = await upstream.text();
      if (html.length > 200000) html = html.slice(0, 200000);

      const extracted = extractContent(html);
      return json({ title: extracted.title, site: parsed.hostname, blocks: extracted.blocks }, 200, request, env);
    }

    // ---------------------------------------------------------------
    // LOG route (POST /log) → persist session data to KV.
    // Each persist() call from embed.html sends the full
    // InteractionLog + CR scoring data. KV key is
    // {participant_id}_{condition}_{phase} so later calls
    // overwrite (upsert) with the latest state.
    // ---------------------------------------------------------------
    if (url.pathname === '/log') {
      if (request.method !== 'POST') {
        return json({ error: 'Method Not Allowed' }, 405, request, env);
      }
      if (!env.RCT_LOGS) {
        return json({ error: 'Worker misconfigured: RCT_LOGS KV not bound' }, 500, request, env);
      }

      let body;
      try { body = await request.json(); } catch {
        return json({ error: 'Invalid JSON body' }, 400, request, env);
      }

      var log = body.log;       // full InteractionLog object
      var cr  = body.cr || {};   // cr_score, cr_items, etc. (may be empty)
      if (!log || !log.participant_id || !log.session_id) {
        return json({ error: 'log.participant_id and log.session_id required' }, 400, request, env);
      }

      var phase = log.phase || 'train';
      var cond  = log.condition || 'UNKNOWN';
      var key   = log.participant_id + '_' + cond + '_' + phase;

      var record = {
        log: log,
        cr: cr,
        updated_at: new Date().toISOString(),
      };

      await env.RCT_LOGS.put(key, JSON.stringify(record));
      return json({ ok: true, key: key }, 200, request, env);
    }

    // ---------------------------------------------------------------
    // EXPORT route (GET /export) → bulk-download all KV records as
    // JSON. Protected by a bearer token (env.EXPORT_TOKEN) so only
    // the researcher can pull data.
    // ---------------------------------------------------------------
    if (url.pathname === '/export') {
      if (request.method !== 'GET') {
        return json({ error: 'Method Not Allowed' }, 405, request, env);
      }
      if (!env.RCT_LOGS) {
        return json({ error: 'Worker misconfigured: RCT_LOGS KV not bound' }, 500, request, env);
      }

      var authHeader = request.headers.get('Authorization') || '';
      var token = authHeader.replace(/^Bearer\s+/i, '');
      if (!env.EXPORT_TOKEN || token !== env.EXPORT_TOKEN) {
        return json({ error: 'Unauthorized' }, 401, request, env);
      }

      var keys = [];
      var cursor = null;
      do {
        var listOpts = cursor ? { cursor: cursor } : {};
        var list = await env.RCT_LOGS.list(listOpts);
        keys.push(...list.keys);
        cursor = list.list_complete ? null : list.cursor;
      } while (cursor);

      var records = [];
      for (var i = 0; i < keys.length; i++) {
        var val = await env.RCT_LOGS.get(keys[i].name);
        if (val) {
          try { records.push({ key: keys[i].name, ...JSON.parse(val) }); }
          catch (e) { records.push({ key: keys[i].name, raw: val }); }
        }
      }

      return json({ count: records.length, records: records }, 200, request, env);
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
// Serper.dev results parser
// -------------------------------------------------------------------
//
// Serper returns Google's SERP as JSON. Organic web results live in the
// `organic` array, each shaped roughly as:
//
//   { "title": "...", "link": "https://...", "snippet": "...",
//     "position": 1, "sitelinks": [...] }
//
// We map those to the browser-facing {title, url, displayUrl, snippet}
// shape and cap at `max`. Non-organic blocks (answerBox, knowledgeGraph,
// topStories, paid ads) are intentionally ignored so the experimental
// SEARCH control sees plain organic results only — the same contract the
// earlier DuckDuckGo/Brave backends honoured. Serper fields are already
// plain text (no HTML), and embed.html escapes them on render anyway.
function parseSerperResults(data, max) {
  var organic = (data && Array.isArray(data.organic)) ? data.organic : [];
  var results = [];
  for (var i = 0; i < organic.length && results.length < max; i++) {
    var r = organic[i] || {};
    var url = r.link ? String(r.link) : '';
    var title = r.title ? String(r.title) : '';
    if (!url || !title) continue;
    results.push({
      title: title,
      url: url,
      displayUrl: hostnameOf(url),
      snippet: r.snippet ? String(r.snippet) : ''
    });
  }
  return results;
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

// -------------------------------------------------------------------
// Page content extractor — used by the /fetch reader-mode route.
// Strips boilerplate (nav/header/footer/scripts/styles), then extracts
// headings, paragraphs, and list items in document order.
// Returns { title: string, blocks: [{type, text, level?}] }.
// -------------------------------------------------------------------
function extractContent(html) {
  var titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  var title = titleMatch ? stripHtml(titleMatch[1]) : '';

  // Remove non-content sections before extracting blocks.
  var cleaned = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header\b[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  var elements = [];
  var m;

  var headingRe = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  while ((m = headingRe.exec(cleaned)) !== null) {
    var t = stripHtml(m[2]);
    if (t.length > 3) elements.push({ pos: m.index, type: 'h', level: Number(m[1]), text: t });
  }

  var paraRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  while ((m = paraRe.exec(cleaned)) !== null) {
    var t = stripHtml(m[1]);
    if (t.length > 20) elements.push({ pos: m.index, type: 'p', text: t });
  }

  var liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  while ((m = liRe.exec(cleaned)) !== null) {
    var t = stripHtml(m[1]);
    if (t.length > 10) elements.push({ pos: m.index, type: 'li', text: t });
  }

  elements.sort(function (a, b) { return a.pos - b.pos; });

  var blocks = elements.slice(0, 60).map(function (e) {
    var b = { type: e.type, text: e.text };
    if (e.type === 'h') b.level = e.level;
    return b;
  });

  return { title: title, blocks: blocks };
}

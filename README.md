# RCT Treatment Interface for Qualtrics

A self-contained HTML/CSS/JS app that runs the experimental UI (chart + multi-question task on the left, LLM chat or mocked Google search on the right). Architecture modelled on **Simple Chat** (Bermudez Schettino, Dasmeh & Brinkmann, 2025, [arXiv:2511.19123](https://arxiv.org/abs/2511.19123)).

This repo provides **two deployment architectures** — pick one:

| Architecture | When to use | Files |
|---|---|---|
| **Iframe + postMessage** *(original)* | Public host available (GitHub Pages, your institution's web server, Netlify). Qualtrics is fully isolated from the experimental UI; the editor cannot mangle anything. | [embed.html](embed.html), [qualtrics-question-js.js](qualtrics-question-js.js), [qualtrics-llm.html](qualtrics-llm.html), [qualtrics-search.html](qualtrics-search.html) |
| **Self-contained HTML View** *(alternative)* | No external host. Everything pastes directly into Qualtrics. Adds streaming, Chart.js, four question types, and per-condition `LLM_Log` / `Search_Log` fields. | [qualtrics-llm-htmlview.html](qualtrics-llm-htmlview.html), [qualtrics-search-htmlview.html](qualtrics-search-htmlview.html) |

The two are mutually exclusive per question. The iframe section below is the original guide; jump to [HTML View deployment](#html-view-deployment-self-contained) for the alternative.

**Why iframe?** Earlier versions of this project pasted HTML/CSS/JS directly into the Qualtrics question. Qualtrics' rich-text editor strips `<style>` blocks and mangles markup, which broke the layout. The iframe approach moves the entire app to a URL Qualtrics never touches; Qualtrics just renders an `<iframe>` tag and the inside is invisible to its editor.

## Files

| File | Role |
|---|---|
| `embed.html` | The whole experimental app — single self-contained page. **This is what gets deployed.** Reads `?condition=`, `?pid=`, `?model=` from its URL. |
| `qualtrics-llm.html` | One-line `<iframe>` snippet to paste into the LLM-branch question. |
| `qualtrics-search.html` | One-line `<iframe>` snippet to paste into the SEARCH-branch question. |
| `qualtrics-question-js.js` | Qualtrics-side bridge — paste into both questions' JS panels. Listens for postMessage from the iframe and writes to Embedded Data, shows the Next button, and resizes the iframe. |
| `index-llm.html`, `index-search.html` | Local "Qualtrics simulator" pages. Iframe-embed `embed.html`, mimic the postMessage bridge so you can test exactly the production flow without deploying. |
| `worker.js` | Cloudflare Worker that holds the OpenRouter API key as a server-side secret and proxies chat requests. **Deploy this so the key never ships in `embed.html`.** See [Backend proxy setup](#backend-proxy-setup-cloudflare-worker) below. |
| `README.md` | This file. |

## Communication contract (iframe → parent)

The iframe posts these messages to `window.parent`:

```js
{ type: 'rct_log_update', payload: <full InteractionLog> }   // every interaction
{ type: 'rct_complete' }                                      // final answer submitted
{ type: 'rct_height',  value: <px> }                          // suggested iframe height
```

`qualtrics-question-js.js` translates them into `Qualtrics.SurveyEngine.setEmbeddedData(...)` calls, `qThis.showNextButton()`, and `iframe.style.height = ...`.

## Setup overview

```
1. Edit embed.html (API key, instructions, chart data, etc.)
2. Deploy embed.html publicly (GitHub Pages is the easy default)
3. Survey Flow: declare Embedded Data + Randomizer
4. LLM question:    paste iframe + paste qualtrics-question-js.js
5. SEARCH question: paste iframe + paste qualtrics-question-js.js
6. Test in Qualtrics preview
```

## 1. Local development

Serve the directory with any static server:

```bash
python3 -m http.server 8765
```

Open:
- `http://localhost:8765/index-llm.html` — simulates the Qualtrics page hosting the LLM iframe.
- `http://localhost:8765/index-search.html` — simulates the SEARCH page.

Each simulator page has a dark top bar showing the synthetic participant id, a "Next ›" button that appears when the iframe sends `rct_complete`, and a panel below the iframe that prints every postMessage so you can debug.

To use the LLM with a real model, edit `embed.html` and replace `YOUR_KEY_HERE` with an OpenRouter key. Revert before deploying publicly. See [Security](#security-api-key-handling) below.

## 2. Deploying `embed.html`

You need a public HTTPS URL that serves `embed.html`. Easiest options for a thesis:

### GitHub Pages (recommended for thesis projects)

1. Make sure the project directory is a git repo (`git init` if needed) and push it to a GitHub repo, e.g. `username/thesis`.
2. On GitHub: **Settings → Pages → Source: Deploy from a branch → main → `/` (root)**. Save.
3. Wait ~1 minute. Your URL is `https://username.github.io/thesis/embed.html`.

### Cloudflare Pages

`Connect to Git` → pick the repo → leave build command empty → publish directory `/` → deploy. URL is `https://<project>.pages.dev/embed.html`.

### Netlify drop

Drag the project folder onto [app.netlify.com/drop](https://app.netlify.com/drop). Get an instant `https://*.netlify.app` URL.

Whichever you pick, **note the URL of `embed.html`**. You'll paste it into the iframe in step 4.

## 3. Qualtrics Survey Flow

Add an **Embedded Data** element at the top with these field names (leave values blank — the bridge fills them):

```
# core identification
condition
participant_id
session_id
model_used
InteractionLog

# task answer
q1_answer

# LLM-condition counters and content
prompt_count
response_count
last_prompt
last_response
all_prompts
all_responses
prompt_1 prompt_2 prompt_3 ... prompt_20
response_1 response_2 response_3 ... response_20

# SEARCH-condition counters and content
query_count
click_count
total_clicks
total_dwell_ms
last_search_query
all_search_queries
all_clicked_urls
search_query_1 search_query_2 ... search_query_20
search_click_1 search_click_2 ... search_click_20
search_click_title_1 ... search_click_title_20
search_click_query_1 ... search_click_query_20
search_click_index_1 ... search_click_index_20
search_dwell_ms_1 ... search_dwell_ms_20
```

The `prompt_N` / `response_N` / `search_query_N` fields capture each turn separately so analysts can read prompts and AI replies directly from the CSV. Up to 20 turns are written; if a participant has fewer, the remaining fields stay empty. The full conversation is also concatenated into `all_prompts`, `all_responses`, and `all_search_queries` (separated by `\n---\n`). The complete event log with timestamps and latencies remains in `InteractionLog` (stringified JSON) for full-fidelity analysis.

`prompt_count` counts user prompts SENT (regardless of whether the AI replied successfully). `response_count` counts successful AI replies / search results shown.

Add a **Randomizer** that evenly assigns each participant to one of two branches:
- Branch A — sets `condition = LLM`, then shows the LLM question.
- Branch B — sets `condition = SEARCH`, then shows the SEARCH question.

(You can also use Display Logic on the questions instead.)

## 4. The two Qualtrics questions

Create two **Text Entry** questions, one per branch.

### LLM question

**Question Text** (rich-text editor → Source view, paste the line below; replace `EMBED_URL` with your hosted URL from step 2):

```html
<iframe
  src="https://yourname.github.io/thesis/embed.html?condition=LLM&pid=${e://Field/ResponseID}"
  width="100%" height="800" frameborder="0"
  style="border:none; display:block; width:100%; min-height:700px;"
  allow="clipboard-write"
  title="Research tools — LLM condition">
</iframe>
```

**JavaScript panel** (gear icon → Add JavaScript): paste the entire contents of `qualtrics-question-js.js`.

### SEARCH question

Same as LLM but with `condition=SEARCH` in the iframe URL.

`${e://Field/ResponseID}` is Qualtrics piped text — it inserts the participant's response ID as the `pid` query parameter, so the iframe storage and the embedded log stay tied to that participant.

## 5. Test in Qualtrics

Open the survey **Preview**. Open browser DevTools → Console. You should see:

```
[RCT bridge] listening for iframe postMessage events.
[RCT embed] init complete — condition=LLM, pid=<response-id>
```

Then check:
- Top instructions panel renders.
- Chart, True/False, Submit on the left.
- Treatment on the right (chat or search).
- Selecting True/False enables the Submit button.
- Clicking Submit → right panel locks, Qualtrics' real Next button appears.
- After submitting and exporting (Data & Analysis → Export → CSV), `InteractionLog` is populated as a stringified JSON column, and the flat fields (`condition`, `prompt_count`, `q1_answer`, `model_used`, `session_id`) are filled.

## Customisation

Everything user-facing lives at the top of `embed.html`. After editing, **redeploy** (push to GitHub, etc.) — Qualtrics fetches the new version automatically on the next survey load.

| Want to change… | Edit in `embed.html` |
|---|---|
| Instructions text | `INSTRUCTIONS_HTML` |
| Chart data | `CHART_DATA` |
| Search results | `SEARCH_RESULTS` |
| Questions list | `QUESTIONS` |
| LLM model / API key / referer | Top of file |
| Aesthetics | The `<style>` block |

Different instructions per condition? Move `INSTRUCTIONS_HTML` below the `CONDITION` resolution and gate on `CONDITION === 'LLM'`.

## Data model

```jsonc
{
  "session_id": "uuid",
  "participant_id": "<Qualtrics ResponseID or sim id>",
  "condition": "LLM" | "SEARCH",
  "model_used": "openai/gpt-4o-mini" | null,
  "started_at": "ISO8601",
  "events": [
    { "type": "prompt",               "ts": "...", "content": "..." },
    { "type": "response",             "ts": "...", "content": "...", "latency_ms": 1234, "http_status": 200 },
    { "type": "search_query",         "ts": "...", "query": "..." },
    { "type": "search_results_shown", "ts": "...", "query": "...", "results": [/*…*/], "latency_ms": 600 },
    { "type": "answer_change",        "ts": "...", "question_id": "q1", "value": true },
    { "type": "answer_final",         "ts": "...", "question_id": "q1", "value": true },
    { "type": "panel_locked",         "ts": "..." },
    { "type": "error",                "ts": "...", "error": "...", "http_status": 500 }
  ],
  "prompt_count": 3,
  "answers": { "q1": true }
}
```

For the LLM condition, chat is **multi-turn**: every prior `prompt`/`response` event is replayed as `user`/`assistant` messages on each request. For SEARCH, results come from the **Brave Search API** proxied through the same Cloudflare Worker; clicking a result navigates the embed page same-window to the destination, and dwell time is logged on `pageshow` when the participant returns via the browser back button. See *Brave Search API setup* below.

### SEARCH event types

| Event | Fields | When |
|---|---|---|
| `search_query` | `query` | Submitted before the API call (so failed searches are still recorded). |
| `search_results_shown` | `query, results[], latency_ms` | After a successful API response. `results` is `[{title, url, displayUrl, snippet}]`. |
| `result_click` | `index, url, title, query` | Logged synchronously, **before** navigation, so a torn-down page doesn't lose the click. |
| `result_dwell` | `url, dwell_ms, returned_via` | Computed on `pageshow` when the participant returns. `returned_via` is `"bfcache"` (instant restore) or `"reload"`. Sub-100 ms and 30 min+ values are filtered as noise. |
| `error_retry` | `attempt, error` | Each transient failure during the silent-retry loop (max 2 retries). |
| `error` | `error, http_status, latency_ms` | Logged once after all retries are exhausted; the inline error card is shown. |

The bridge's flat-field flattener writes per-turn fields (`search_click_1..20`, `search_click_title_1..20`, `search_click_query_1..20`, `search_click_index_1..20`, `search_dwell_ms_1..20`) plus aggregates `total_clicks`, `total_dwell_ms`, `query_count`, `click_count`, `all_clicked_urls` so analysts get the data without parsing `InteractionLog` JSON.

## Backend proxy setup (Cloudflare Worker)

The OpenRouter API key must NOT live in `embed.html` once that file is deployed publicly — anyone can read it from page source and rack up your bill. The proxy in [worker.js](worker.js) fixes this: it sits between `embed.html` and OpenRouter, holding the key as a server-side secret.

### One-time setup (~5 minutes)

1. **Create a Cloudflare account** at [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up). Free tier is fine.
2. **Workers & Pages → Create → Create Worker.** Name it e.g. `thesis-llm-proxy`. Click **Deploy** (the placeholder code is fine for now).
3. **Edit code** → paste the **entire contents of [worker.js](worker.js)** into the editor (replace what's there). Click **Save and deploy**.
4. **Settings → Variables and Secrets:**
   - Add **`OPENROUTER_API_KEY`** as **Type: Secret** → paste your real OpenRouter key (the one you tested with curl) → **Save**.
   - Add **`ALLOWED_ORIGINS`** as **Type: Text** → set to your GitHub Pages origin and Qualtrics origin, comma-separated:
     ```
     https://bruno20033.github.io,https://oii.eu.qualtrics.com
     ```
     (add other Qualtrics datacentres if you publish from a different one — `*.qualtrics.com` is locked down per-tenant)
   - Optional: `MAX_TOKENS=1024` (default), `HTTP_REFERER=https://bruno20033.github.io/thesis-rct`, `X_TITLE=RCT Chart Study`.
5. **Note your worker URL** — at the top of the worker page, e.g. `https://thesis-llm-proxy.bruno20033.workers.dev`.

### Test the proxy

```bash
curl -i https://thesis-llm-proxy.YOUR-CF-USERNAME.workers.dev \
  -H "Origin: https://bruno20033.github.io" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"hi"}]}'
```

Expect a normal OpenRouter chat completion back. Responses with `403 Forbidden origin` mean `ALLOWED_ORIGINS` didn't match — fix the env var.

### Wire `embed.html` to the proxy

In [embed.html](embed.html), set:

```js
var PROXY_URL = 'https://thesis-llm-proxy.YOUR-CF-USERNAME.workers.dev';
```

(`OPENROUTER_API_KEY` and `OPENROUTER_URL` are no longer needed — the proxy adds the auth header server-side.) Commit and push:

```bash
git add embed.html
git commit -m "route llm calls through cloudflare proxy"
git push
```

### Revoke the leaked key

The key currently in your repo's git history (commit `b0ceff5` and similar) is permanently exposed. After confirming the proxy works:

1. Go to [openrouter.ai/keys](https://openrouter.ai/keys) → revoke the old key.
2. Create a new key, paste it into the **Cloudflare Worker secret** (NOT into embed.html ever again).

The worker now holds the key; no further key handling is needed in your repo.

### What the proxy enforces

The Worker exposes two routes under one origin-locked CORS policy:

- **`POST /` and `POST /llm`** — forward to OpenRouter chat completions with the secret `OPENROUTER_API_KEY`. `max_tokens` is clamped to the `MAX_TOKENS` env var (default 1024).
- **`POST /search`** — forward to **Brave Search API** with the secret `BRAVE_SEARCH_API_KEY`. Returns up to 20 `{title, url, displayUrl, snippet}` items. (Originally written against Google Programmable Search, but Google removed the "search the entire web" option for new engines, so we switched to Brave. Browser-facing response shape is unchanged.)

Cross-cutting:
- **Origin allowlist** — every request is checked against `ALLOWED_ORIGINS`. Off-list requests get `403 Forbidden origin`.
- **Method allowlist** — POST only (plus OPTIONS for CORS pre-flight).
- **CORS headers** — `Access-Control-Allow-Origin` is set to the matching allowed origin (per-request), not `*`.

For higher-stakes deployments, add per-IP rate limiting in Cloudflare's dashboard (Security → WAF → Rate limiting) and a daily spend cap on the OpenRouter key. Brave Search has its own quota dashboard at [api.search.brave.com](https://api.search.brave.com/) and a per-month cap on the free tier.

## Brave Search API setup (~5 minutes, one time)

The SEARCH condition needs one Brave Search API key. It goes into the Cloudflare Worker as a secret; nothing ships in `embed.html`.

> **Why Brave instead of Google?** Google's Programmable Search Engine no longer allows "search the entire web" for new engines (since 2024). Brave runs an independent index, returns plain organic results in clean JSON, and the free tier is large enough for a thesis pilot. The visual presentation in `embed.html` (blue title link, green URL hostname, grey snippet) is identical regardless of backend.

### Step 1 — create the API key

1. Go to [api.search.brave.com](https://api.search.brave.com/) and sign up (or log in with Google/GitHub).
2. **Subscriptions → Subscribe** to a free plan. Brave offers a couple of free tiers — pick whichever covers your needs:
   - **Data for AI Free** — 2,000 queries/month, 1 query/second, no card required.
   - **Web Search Free** — same kind of free tier, also 1 qps. Pick this if you want results closest to brave.com search itself.
3. **API Keys → Add API Key** → name it (e.g. `thesis-rct`) → **Generate**.
4. Copy the key (Brave only shows it once on creation — save it somewhere temporarily).

### Step 2 — wire the worker

In Workers & Pages → your worker → **Settings → Variables and Secrets**:

- `BRAVE_SEARCH_API_KEY` (Type: **Secret**) — paste the key from Step 1.
- `SEARCH_NUM_RESULTS` (Type: **Text**, optional) → `1`–`20`, default 10.
- `SEARCH_COUNTRY` (Type: **Text**, optional) → two-letter ISO code, default `US`. Affects result locale.
- `SEARCH_SAFESEARCH` (Type: **Text**, optional) → `off` | `moderate` | `strict`, default `moderate`.

Save. Your worker is now ready to serve `POST /search`.

### Step 3 — test the new route

```bash
curl -i https://thesis-llm-proxy.YOUR-CF-USERNAME.workers.dev/search \
  -H "Origin: https://bruno20033.github.io" \
  -H "Content-Type: application/json" \
  -d '{"query":"acme corp profitable"}'
```

Expect `200` + `{"items":[{"title":"…","url":"…","displayUrl":"…","snippet":"…"}, …], "total":"…"}`. A `403 Forbidden origin` means `ALLOWED_ORIGINS` doesn't include the test origin. A `500` mentioning `BRAVE_SEARCH_API_KEY` means the secret isn't set. A `429` from Brave means you exceeded 1 qps — re-test after a moment.

### Quota & cost

Brave free tiers: **2,000 queries/month, 1 qps**, no card required. For a 200-participant pilot at ~5 queries each = 1,000 queries → comfortably inside the free tier. Beyond the free tier, paid tiers start at $3/CPM (Data-for-AI) or $9/CPM (Web Search) — see [api.search.brave.com](https://api.search.brave.com/) pricing. Brave's dashboard shows live usage; consider setting a monthly hard cap on your account.

## Refresh resilience

The iframe persists its `InteractionLog` to **its own** `localStorage` keyed by `pid` and `condition`. Refreshing the Qualtrics page reloads the iframe; the iframe restores its state, replays the chat or search UI, and re-applies any submitted lock. The Qualtrics Embedded Data is also up to date because every event is mirrored via postMessage.

## Security: API-key handling

The OpenRouter API key in `embed.html` ships to the participant's browser and is extractable. Choose ONE:

1. **Backend proxy (RECOMMENDED).** Stand up `POST /llm` on a Cloudflare Worker / Vercel function that forwards to OpenRouter with the real key in a server env var. In `embed.html`, set `OPENROUTER_URL` to your proxy and remove the `Authorization` header.
2. **Per-session ephemeral key** passed via the iframe's URL.
3. **Hardcoded for IRB-supervised pilots only**, with all of: spend cap on the OpenRouter key, weekly rotation, time-limited recruitment, methods-section disclosure of the trade-off.

Set `EXPECTED_ORIGIN` near the top of `qualtrics-question-js.js` to your deployed origin (e.g. `'https://yourname.github.io'`) so the postMessage listener ignores stray events from other iframes.

## Failure handling

If the OpenRouter request fails, an `error` event is logged with the error string and HTTP status, and an inline error bubble appears in the chat. The chart and T/F question remain answerable — the dependent variable is still measurable even if the treatment fails. Filter or exclude responses with elevated `error` event counts during analysis.

## Pre-launch verification checklist

- [ ] `embed.html` deployed at a stable HTTPS URL.
- [ ] OpenRouter API key set; spend cap configured on the OpenRouter dashboard.
- [ ] `EXPECTED_ORIGIN` set in `qualtrics-question-js.js`.
- [ ] Embedded Data fields declared in Survey Flow.
- [ ] Randomizer set to even allocation between LLM and SEARCH branches.
- [ ] LLM question has the iframe pasted (with the deployed URL) AND `qualtrics-question-js.js` in its JS panel.
- [ ] SEARCH question has the same.
- [ ] Browser console shows both `[RCT bridge]` and `[RCT embed]` log lines on preview load.
- [ ] Multi-turn LLM works (a follow-up prompt that requires prior context returns a coherent reply).
- [ ] Refresh test mid-session restores chat/search and answer state.
- [ ] Submit → Next reveals → right panel locks.
- [ ] CSV export: `InteractionLog` is one column with a parseable JSON string; flat columns populated.
- [ ] Mobile blocked in Survey Options (or layout explicitly chosen otherwise).

## HTML View deployment (self-contained)

Use this path when you don't have a public URL to host `embed.html` on. The two HTML View files are fully self-contained — no iframe, no proxy, no separate JS bridge.

### Differences from the iframe build

| Concern | Iframe build | HTML View build |
|---|---|---|
| Hosting | Static URL (`embed.html`) + Qualtrics paste | Everything inside Qualtrics |
| Chart | Hand-rolled SVG | [Chart.js](https://www.chartjs.org/) via CDN |
| LLM | Single round-trip (non-streaming) | **Streaming** (OpenRouter SSE) |
| **SEARCH** | **Real Brave Search** via Worker `/search` route + click + dwell tracking | **Still mocked** (4 hardcoded results); click event logged but no navigation |
| Question types | True/False only | True/False, MC (single), MC (multi), Likert |
| Embedded Data field | `InteractionLog` (one) | `LLM_Log` and `Search_Log` (per condition) |
| Layout | `min-height: 560px` (page grows) | `height: 600px` with internal scroll per panel |
| Submit timing | Immediate | If a stream is in flight, waits for it to finish before locking |

### Files

| File | What goes where |
|---|---|
| [qualtrics-llm-htmlview.html](qualtrics-llm-htmlview.html) | LLM (Condition A). Paste the `<style>` + `<div>` mount into the question's HTML View, paste the `<script>` body into the JS panel. (Or paste the whole file into HTML View if your Qualtrics instance preserves `<script>` tags.) |
| [qualtrics-search-htmlview.html](qualtrics-search-htmlview.html) | Search (Condition B). Same paste flow. |

Both files double as standalone preview pages — open them in a browser and the script falls back to a non-Qualtrics simulator mode.

### Setup

1. **Survey Flow → Embedded Data block** (blank values):
   ```
   LLM_Log
   Search_Log
   prompt_count
   query_count
   total_response_time_ms
   click_count
   q1_answer
   q2_answer
   q3_answer
   q4_answer
   condition
   participant_id
   model_used
   ```
2. **Randomizer**: even allocation between LLM and SEARCH branches.
3. Create **two Text Entry questions**, one per branch.
4. For the **LLM question**:
   - Question Text → HTML View → paste the `<style>...</style>` block plus the `<div id="rct-root"></div>` mount from `qualtrics-llm-htmlview.html`.
   - JS panel → paste the contents of the inline `<script>` block (everything inside its tags).
   - Edit the constants at the top of the JS: `OPENROUTER_API_KEY`, `OPENROUTER_REFERER`, `MODEL`, `INSTRUCTIONS_HTML`, `QUESTIONS`, `CHART_DATA`. The `<script src="...chart.js...">` CDN tag must be in the HTML View paste so Chart.js loads.
5. For the **SEARCH question**: same flow with `qualtrics-search-htmlview.html`. Edit `SEARCH_RESULTS` and the same shared constants.
6. **Test in Preview**. The browser console should show `[RCT] init complete — condition=LLM, pid=<id>` once.

### Question schema (extending)

```js
var QUESTIONS = [
  { id: 'q1', type: 'truefalse', text: '...' },
  { id: 'q2', type: 'mc',        text: '...', options: ['A','B','C','D'] },
  { id: 'q3', type: 'mcmulti',   text: '...', options: ['X','Y','Z'] },
  { id: 'q4', type: 'likert',    text: '...', scale: 5, leftLabel: 'Disagree', rightLabel: 'Agree' }
];
```

The Submit button stays disabled until **every** question has a non-empty answer (for `mcmulti`, at least one box checked). For each question id, a flat `<id>_answer` Embedded Data field is written; multi-select answers are stored as JSON-stringified arrays like `[0,2]`.

### Streaming behaviour

The LLM file uses OpenRouter's SSE streaming endpoint (`stream: true`). The assistant bubble updates incrementally as `delta.content` arrives. The full reply is accumulated and logged on stream end. If the participant clicks Submit while a stream is in flight, the button shows "Submitting after response…" and the panel locks once the stream completes — no partial responses, no orphaned chat bubbles.

### Embedded Data schema

```jsonc
{
  "session_id": "uuid",
  "participant_id": "<Qualtrics ResponseID>",
  "condition": "LLM" | "SEARCH",
  "model_used": "openai/gpt-4o-mini" | undefined,
  "started_at": "ISO8601",
  "events": [
    { "type": "prompt",               "ts": "...", "content": "..." },
    { "type": "response",             "ts": "...", "content": "...", "latency_ms": 1234 },
    { "type": "search_query",         "ts": "...", "query": "..." },
    { "type": "search_results_shown", "ts": "...", "query": "...", "results": [...], "latency_ms": 600 },
    { "type": "result_click",         "ts": "...", "index": 2, "url": "...", "title": "...", "query": "..." },
    { "type": "answer_change",        "ts": "...", "question_id": "q2", "value": 1 },
    { "type": "submit_click",         "ts": "...", "stream_in_flight": false },
    { "type": "answer_final",         "ts": "...", "question_id": "q2", "value": 1 },
    { "type": "panel_locked",         "ts": "..." },
    { "type": "error",                "ts": "...", "error": "...", "latency_ms": 1500 }
  ],
  "prompt_count":           3,        // LLM only
  "query_count":            2,        // SEARCH only
  "click_count":            6,        // Submit + Send + Search + result clicks
  "total_response_time_ms": 4321,
  "answers": { "q1": true, "q2": 1, "q3": [0, 2], "q4": 4 },
  "finalised": true
}
```

### Verification (HTML View build)

Before the pilot, confirm `LLM_Log` / `Search_Log` is saving to Qualtrics correctly:

1. **Survey Flow declarations**: in Survey Flow, expand the Embedded Data block; confirm all 13 fields above are listed with blank default values. Without declarations, Qualtrics drops `setEmbeddedData` writes silently.
2. **Open survey Preview** in Chrome with DevTools open. Console should print `[RCT] init complete — condition=LLM, pid=R_xxxxxx (Qualtrics)` exactly once. If it prints twice, the idempotency guard isn't working — check that you didn't paste the JS into both Question Text *and* the JS panel.
3. **Layout sanity**: total height ≈ 600 px; only inner panes scroll on overflow; the Qualtrics Next button stays anchored at the bottom of the question card and does not jump down the page as the chat grows.
4. **All 4 question types render** and accept input. Submit is disabled until the last one is answered.
5. **LLM streaming**: send a prompt. Tokens arrive progressively (visibly streaming, not a single dump after a delay). Network tab shows `Content-Type: text/event-stream`. After `[DONE]`, run `JSON.parse(localStorage.getItem('rct_state_<pid>_LLM')).events` and confirm the last `response` event has the full text and a `latency_ms` value.
6. **Mid-stream Submit**: send a slow prompt, click Submit immediately. The button should change to "Submitting after response…" and the panel should NOT lock until the stream finishes.
7. **Search**: type a query → 4–5 mock results render after 400–800 ms. Click a result → `result_click` event in the log; `click_count` increments. The query string is logged even though results are static.
8. **CSV export end-to-end** (the most important check): in Preview, finish a complete fake submission. Note the Response ID. Go to **Data & Analysis → Export & Import → Export Data → CSV**, download, open. Confirm in the CSV row:
   - `LLM_Log` (or `Search_Log`) column contains a parseable JSON string. `JSON.parse(value).events.length` matches what you did.
   - `prompt_count` (or `query_count`), `total_response_time_ms`, `click_count` are populated as integers-as-strings.
   - `q1_answer` through `q4_answer` are populated. Multi-select answers like `q3_answer` are JSON arrays as strings (e.g. `"[0,2]"`).
   - `condition`, `participant_id`, `model_used` are filled.
9. **Refresh resilience**: mid-session, hard-refresh the Preview tab. Chat history / search query / radio selections / answered state all restore from localStorage. If you'd already submitted, the panel stays locked and Next stays visible.

If `LLM_Log` is empty in the CSV, the most common causes are: (a) the field isn't declared in Survey Flow, (b) the JS isn't actually pasted into the JS panel (check for the init log line), or (c) you previewed the page but never clicked through to a final response submission — Qualtrics doesn't write Embedded Data for previews you abandon mid-session unless you complete the response.

## Out of scope (deliberately)

- The backend proxy itself — design above; build separately.
- A Python analysis pipeline (downstream thesis work; data shape is documented above).
- Per-condition chart variants — single chart shared by both conditions for now.
- Streaming LLM responses in the iframe build — only the HTML View build streams. Simple Chat does this in the iframe build too; left as a future enhancement.

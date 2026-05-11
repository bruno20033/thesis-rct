# CLAUDE.md

Repo-specific orientation for Claude (and any human onboarding to this project). The deployment guide lives in [README.md](README.md); this file is shorter and focuses on **what we're doing, how the pieces fit together, and the gotchas that recur**.

## What we're trying to do

Bruno Kneffel's Frankfurt School / Oxford thesis: a **3-arm randomised controlled trial** testing whether using an LLM to solve chart-reading problems leads to **less learning of visual data-literacy skills** than searching for help on the open web.

The hypothesis is **cognitive offloading**: when participants delegate the reasoning step to an LLM, they form weaker representations of the underlying chart-reading principles than participants who have to assemble the answer themselves from search snippets. The two LLM arms split the offloading question further — a Socratic tutor that *refuses to compute the answer* should preserve learning even though an LLM is in the loop, while an unrestricted helpful assistant should not.

| Arm | Purpose | URL params | Treatment |
|---|---|---|---|
| **SEARCH** | Active control | `?condition=SEARCH` | Real DuckDuckGo web search panel. No LLM. |
| **LLM-Socratic** | Scaffolded LLM | `?condition=LLM&arm=socratic` | Probe-only system prompt; never reveals answer. Every turn judged by a second LLM for Socratic fidelity. |
| **LLM-Unrestricted** | Unscaffolded LLM | `?condition=LLM&arm=unrestricted` | Generally-helpful system prompt. May answer directly. No Judge layer. |

The **dependent variable** is performance on held-out GMAT-style Data Insights / Graphics Interpretation items administered after the treatment. The **measured covariates** are interaction quality (turn count, prompt content, search clicks, dwell time) and — for the Socratic arm — Judge-scored fidelity per turn so we can quantify scaffold breakdown.

## How the pieces fit together


```
                         ┌──────────────────────────────────┐
                         │  Qualtrics survey                │
                         │  (Survey Flow: ED + Randomizer)  │
                         │                                  │
                         │  Per-arm question:               │
                         │   • Question Text  = <iframe>    │
                         │   • Add JavaScript = bridge JS   │
                         └─────────────┬────────────────────┘
                                       │
                                       │ iframe src
                                       ▼
            ┌──────────────────────────────────────────────┐
            │  GitHub Pages — embed.html                    │
            │  https://bruno20033.github.io/thesis-rct/    │
            │                                              │
            │  Holds: chart, T/F questions, chat / search  │
            │  panel, system prompts, Judge orchestration. │
            └──────────────┬───────────────────────────────┘
                           │ fetch
                           ▼
            ┌──────────────────────────────────────────────┐
            │  Cloudflare Worker — thesis-llm-proxy        │
            │  ...workers.dev (env: bruno-kneffel)         │
            │                                              │
            │  POST /llm    → OpenRouter (generator key)   │
            │  POST /search → DuckDuckGo HTML scrape       │
            │  POST /judge  → OpenRouter (Judge key)       │
            └──────────────────────────────────────────────┘
```



**Why this shape?** Qualtrics' rich-text editor mangles inline HTML/CSS/JS (strips `<style>`, rewrites markup). Putting the entire UI in a separately-hosted page that Qualtrics only embeds via `<iframe>` makes the editor invisible to our code. Pattern from Simple Chat (Bermudez Schettino, Dasmeh & Brinkmann, 2025, [arXiv:2511.19123](https://arxiv.org/abs/2511.19123)).

The OpenRouter keys cannot ship in `embed.html` (anyone can `view-source` the page on GitHub Pages). The Worker holds them as server-side secrets; the browser only ever sees the Worker's URL.

## Repo file map

| File | Role |
|---|---|
| `embed.html` | The whole experimental UI — single self-contained page served from GitHub Pages. Reads `?condition=`, `?arm=`, `?pid=`, `?model=`. Contains both arm system prompts, the Judge orchestration, and the multi-question `QUESTIONS` array (each question carries its own chart + T/F text). **Edit this for any UI/prompt/chart change.** |
| `worker.js` | Cloudflare Worker source. Three POST routes (`/llm`, `/search`, `/judge`), Origin allowlist, CORS. |
| `wrangler.jsonc` | Worker deployment config (used by `wrangler deploy`). |
| `qualtrics-question-js.js` | Bridge that pastes into the **Add JavaScript** panel of each Qualtrics question. Listens for postMessage events from the iframe and writes flat per-turn fields + aggregates to Embedded Data. |
| `qualtrics-llm.html` | The single `<iframe>` line to paste into the **Question Text → HTML source** of the LLM question. Uses `${e://Field/arm}` so one question serves both LLM arms. |
| `qualtrics-search.html` | Same, for the SEARCH question. |
| `rct_arm_prompts.md` | Canonical text of `SYSTEM_PROMPT_SOCRATIC` and `SYSTEM_PROMPT_UNRESTRICTED`. **Edit here first, then mirror into the JS literals in `embed.html` before deploying.** |
| `rct_judge_prompts.md` | Canonical Judge system prompt + 10-example synthetic calibration corpus + calibration log. Same mirror-then-deploy rule. |
| `README.md` | Long-form deployment guide for humans. |
| `CLAUDE.md` | This file. |

## Editing and deployment loop

| Change | Where | How to deploy |
|---|---|---|
| UI / chart / questions / instructions | `embed.html` (top of file) | `git push` → GitHub Pages picks it up in ~30s. No build step. |
| Add/edit/reorder the per-item questions | `QUESTIONS` array near the top of `embed.html`. Each entry needs `{id, type, text, chart}`. Declare a matching `qN_answer` Embedded Data field in Survey Flow for every new id. | `git push`. |
| LLM arm system prompts | Edit `rct_arm_prompts.md` first (canonical), then mirror into `SYSTEM_PROMPT_SOCRATIC` / `SYSTEM_PROMPT_UNRESTRICTED` literals in `embed.html`. | `git push`. |
| Judge prompt | Same dual-edit: `rct_judge_prompts.md` then `RCT_JUDGE_SYSTEM_PROMPT` literal in `embed.html`. | `git push`. |
| Judge model swap | Change `RCT_JUDGE_MODEL` in `embed.html`. Cross-family rule: if you change the generator family, change the Judge family too (Wataoka et al. 2024, self-preference bias). | `git push`. |
| Worker routing / CORS / parsing | `worker.js` | `wrangler deploy` from this directory, or paste into the Cloudflare dashboard editor. |
| Worker secrets / env vars | Cloudflare dashboard → Workers → thesis-llm-proxy → Settings → Variables and Secrets | Saved live, no redeploy needed. |
| Qualtrics question text or JS | Inside Qualtrics directly (not in this repo) | Save in the Qualtrics editor. |

## Qualtrics setup essentials

**Each treatment question has two paste slots — they are not the same place:**

| Slot | How to reach it | Content |
|---|---|---|
| **Question Text (HTML source)** | Click the question body → toolbar → **`<>`** button | The `<iframe>` block from `qualtrics-llm.html` or `qualtrics-search.html`. |
| **Add JavaScript** | Gear ⚙️ icon next to the question → **Add JavaScript** | Full contents of `qualtrics-question-js.js`, copied **from raw.githubusercontent.com**, never from the rendered GitHub page (rendered Markdown rewrites `event.data` into a broken link). |

**Survey Flow** (left sidebar → Survey Flow):

1. **Embedded Data block** at the top declaring all the fields the bridge writes (full list in [README §2](README.md)). Without declarations, `setEmbeddedData` writes are dropped silently.
2. **Randomizer** with `Randomly present 1 of 3` and `Evenly Present Elements` checked. Each branch must be a **Group** element wrapping `(Set Embedded Data, Show Block)` together — otherwise the Randomizer treats the 6 items as 6 independent siblings and randomly picks one of them, which breaks arm assignment.


```
Randomizer (1 of 3, Evenly Present)
├─ Group: Branch SEARCH
│    ├─ Set ED: condition = SEARCH
│    └─ Show Block: SEARCH question
├─ Group: Branch Socratic
│    ├─ Set ED: condition = LLM, arm = socratic
│    └─ Show Block: LLM question
└─ Group: Branch Unrestricted
     ├─ Set ED: condition = LLM, arm = unrestricted
     └─ Show Block: LLM question   (same block as Socratic — the arm ED differentiates them)
```


**Drop-out capture** — Survey Options → Responses → set **"Incomplete survey responses"** to **Record** (not Delete) with a 1-week timeout. Without this, abandoned sessions are discarded after the timeout and you lose ITT-analysis data.

## Cloudflare Worker setup essentials

Worker name: **`thesis-llm-proxy`** (account: bruno-kneffel). URL: `https://thesis-llm-proxy.bruno-kneffel.workers.dev`.

**Required secrets / env vars** (Workers → thesis-llm-proxy → Settings → Variables and Secrets):

| Name | Type | Value |
|---|---|---|
| `OPENROUTER_API_KEY` | Secret | Generator key (used by `/llm`). |
| `OPENROUTER_JUDGE_API_KEY` | Secret | Separate Judge key (used by `/judge`). Falls back to `OPENROUTER_API_KEY` if unset, but a separate key is strongly recommended so spend on the participant-facing channel and the Judge channel can be tracked independently. |
| `ALLOWED_ORIGINS` | Text | Comma-separated. Currently: `https://bruno20033.github.io,https://oii.eu.qualtrics.com`. Add other Qualtrics datacentre origins if the survey is moved. |
| `MAX_TOKENS` | Text (optional) | Hard cap on `/llm` `max_tokens`, default 1024. |
| `JUDGE_MAX_TOKENS` | Text (optional) | Hard cap on `/judge` `max_tokens`, default 400. |
| `HTTP_REFERER`, `X_TITLE` | Text (optional) | OpenRouter attribution headers. |
| `SEARCH_NUM_RESULTS`, `SEARCH_REGION`, `SEARCH_SAFESEARCH` | Text (optional) | DuckDuckGo tuning; defaults are fine. |

The Worker enforces the Origin allowlist on every request and returns `403 Forbidden origin` for anything off-list.

**OpenRouter spend caps** — set them on the keys at [openrouter.ai/keys](https://openrouter.ai/keys) before launch. The Worker already caps per-request tokens but a key-level daily/monthly cap is the real blast-radius limit.

## Common problems and fixes

These are the recurring traps. If you hit one of them, the fix below is almost always the answer.

### Qualtrics editor

- **`Unexpected token <` error after pasting.** The iframe HTML went into the JavaScript panel instead of Question Text. The JS panel runs a syntax check and rejects HTML. Fix: clear the JS panel; paste the iframe in Question Text → `<>` (HTML source); paste the JS in the gear ⚙️ → Add JavaScript panel.
- **JS panel content has weird `[event.data](http://event.data)` Markdown links.** You copied from the rendered GitHub page; GitHub auto-linkified `event.data` because it looks like a domain. Always copy from `raw.githubusercontent.com/...` instead.
- **Iframe loads but nothing posts back to Qualtrics.** Most often: JS panel was saved but the iframe's `src` is still pointing at an old URL or the wrong condition. Open DevTools console — you should see both `[RCT bridge] listening...` and `[RCT embed] init complete...`. If you only see the bridge line, the iframe isn't loading.
- **Randomizer assigns participants weirdly.** Two failure modes: (1) count is `3` instead of `1` — every participant gets all three arms in random order. (2) The ED + Block pairs are NOT inside a Group — the Randomizer sees 6 siblings and randomly picks one of them, which can be a bare ED with no question. Fix: count = 1, Evenly Present, each branch is a Group containing `(ED, Block)`.
- **Embedded Data not showing in Data & Analysis.** Two causes: (1) the participant didn't reach End of Survey — Embedded Data persists on page transitions, and incomplete responses are buffered until the configured timeout. Enable "Record incomplete responses." (2) The Embedded Data field isn't declared in Survey Flow — Qualtrics drops `setEmbeddedData` writes for undeclared fields silently.
- **Data appears slowly in Data & Analysis even after submission.** Normal — there's a 10–60s indexing delay. For real-time debugging use the iframe's `localStorage` (`JSON.parse(localStorage.getItem('rct_state_<pid>_<condition>'))`) or Cloudflare's live worker logs.

### Cloudflare Worker

- **`403 Forbidden origin`.** The browser's Origin header isn't in `ALLOWED_ORIGINS`. Add it to the env var (no redeploy needed). Common culprits: a different Qualtrics datacentre subdomain (`*.qualtrics.com` is locked per-tenant), or a local-test origin like `http://localhost:8765`.
- **`User not found` or `401` from OpenRouter.** The key in the Worker secret doesn't match an active key on OpenRouter. Regenerate the key on OpenRouter and paste the new value into the Worker secret.
- **`429 DuckDuckGo rate-limit/anomaly check`.** DDG served their bot-challenge page. Wait 1–2 min and retry. For real trial scale (a few hundred queries/day) this is rare; if it becomes systemic, switch the SEARCH backend to Brave (needs a billing card) or self-hosted SearXNG.
- **`/llm` returns 200 but the assistant message is empty.** Almost always a `max_tokens` issue, or the model id in `embed.html`'s `RCT_LLM_MODEL` is wrong. Check the Worker live tail in the Cloudflare dashboard.

### Embed / deployment

- **GitHub Pages serving stale `embed.html`.** Pages CDN caches aggressively. Hard-refresh (Cmd/Ctrl+Shift+R), or append `?v=<timestamp>` to the iframe src in the Qualtrics question text to force a fresh fetch.
- **Same SEARCH results appear for every query** during testing. Browser cached an old response, or a stale `localStorage` state was restored. Bypass by changing the `pid` query param (`?pid=test2`) — that's the localStorage key.
- **Iframe height keeps growing on each interaction.** Resolved upstream (PR #3) by clamping height in the bridge JS and removing `100vh` from `embed.html`. If it recurs, check that `body { min-height: 100vh }` hasn't been re-introduced in `embed.html` — that triggers a feedback loop with the auto-resize.
- **Mid-page drop-outs lose recent turns.** Qualtrics persists Embedded Data on page transitions, not on every `setEmbeddedData` call. The iframe's localStorage has the full log but it can't be pulled back from the participant's browser. If complete fidelity is required (IRB), add a `/log` route on the Worker that mirrors each event server-side.

## What's still TODO

- **Judge calibration.** Run two human coders against the 10 synthetic examples in `rct_judge_prompts.md` plus ~20 real pilot turns. Compute Cohen's κ between Judge and consensus. Targets: fidelity κ ≥ 0.75, intent κ ≥ 0.70. Log results in `rct_judge_prompts.md` → `## Calibration log`.
- **OpenRouter spend caps** on both the generator and Judge keys.
- **Pilot N=5–10** before opening the full trial — verify CSV export, Embedded Data shape, and the Socratic prompt's robustness against participant extraction attempts in the wild.
- **Qualtrics CSV export verification** — confirm `InteractionLog` is one parseable JSON column and the per-turn flat fields (`prompt_1..20`, `response_1..20`, `judge_fidelity_1..20`, etc.) are populated.

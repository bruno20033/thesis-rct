# CLAUDE.md

Repo-specific orientation for Claude (and any human onboarding to this project). The deployment guide lives in [README.md](README.md); this file is shorter and focuses on **what we're doing, how the pieces fit together, and the gotchas that recur**.

## What we're trying to do

Bruno Kneffel's Frankfurt School / Oxford thesis: a **3-arm randomised controlled trial** testing whether using an LLM to solve chart-reading problems leads to **less learning of visual data-literacy skills** than searching for help on the open web.

The hypothesis is **cognitive offloading**: when participants delegate the reasoning step to an LLM, they form weaker representations of the underlying chart-reading principles than participants who have to assemble the answer themselves from search snippets. The two LLM arms split the offloading question further — a Socratic tutor that *refuses to compute the answer* should preserve learning even though an LLM is in the loop, while an unrestricted helpful assistant should not.

| Arm | Purpose | URL params | Treatment |
|---|---|---|---|
| **SEARCH** | Active control | `?condition=SEARCH` | Real Google web search panel (Serper.dev API). No LLM. |
| **LLM-Socratic** | Scaffolded LLM | `?condition=LLM&arm=socratic` | Probe-only system prompt; never reveals answer. Every turn judged by a second LLM for Socratic fidelity. |
| **LLM-Unrestricted** | Unscaffolded LLM | `?condition=LLM&arm=unrestricted` | Generally-helpful system prompt. May answer directly. No Judge layer. |

The study has three research questions:

| RQ | Label | What it asks | Primary measure |
|---|---|---|---|
| **RQ1** | Learning | Does unrestricted LLM use impair skill acquisition? | Proportion correct on unaided post-test (immediate) |
| **RQ2** | Productivity | Does LLM access improve task performance during practice? | Proportion correct on aided practice block |
| **H3** | Dissociation | Does the arm that performs best during practice perform worst on the unaided test? | Interaction between arm and block (aided vs unaided) |

The **primary dependent variable** is unaided post-task accuracy — proportion of correct responses on held-out chart-reading items administered immediately after tool withdrawal. **Secondary outcomes** include assisted-phase accuracy (productivity), delayed post-test accuracy (retention), mean time per question, NASA-TLX cognitive load, and self-reported confidence. **Process measures** include turn count, token count, search query count, time-on-task, and — for the Socratic arm — per-turn Judge-scored fidelity and intent scores.

## Confirmed technical parameters

These were confirmed from `embed.html` source inspection (May 2025); the generator model was
updated 2026-07-14 to reconcile with `methods.tex`'s stated model (was `openai/gpt-4o-mini`; see
`PRELAUNCH_FAILURE_MODES.md`'s "Model IDs live and consistent with the pre-registration" item):

| Parameter | Value | Notes |
|---|---|---|
| Generator model | `openai/gpt-5.5` | Locked for entire recruitment window once recruitment starts (not yet launched) |
| Judge model | `anthropic/claude-haiku-4-5` | Cross-family: OpenAI generator, Anthropic judge (mitigates self-preference bias per Wataoka et al. 2024) |
| Judge fidelity threshold | ≥ 3 (5-point SOLO-inspired scale) | Relational level — asks probing question without revealing answer |
| Judge mode | Passive | Fires after response is rendered; scores backfill asynchronously |
| Judge temperature | 0.1 | Low variance for consistent scoring |
| Judge max tokens | 400 (Worker-enforced) | |
| Generator max tokens | 1024 (Worker-enforced) | |
| Generator temperature | Model default | Not set client-side; Worker does not override for `/llm` |
| Practice questions | 3 bar-chart items, True/False | `RESET_CHAT_BETWEEN_QUESTIONS = true` — chat history clears between items |
| Chat reset between questions | Yes | Each question starts a fresh conversation |

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
            │  POST /search → Google search (Serper.dev)   │
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
| `qualtrics-question-js.js` | Bridge that pastes into the **Add JavaScript** panel of each Qualtrics question. Listens for postMessage events from the iframe and writes flat per-turn fields + aggregates to Embedded Data. Also writes the analyst-friendly `interaction_log` dict view (per-condition schema documented in README § "interaction_log dictionary schema"). |
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
| `SERPER_API_KEY` | Secret | Serper.dev API key used by `/search` for Google results. **Required** for the SEARCH arm. Get one at [serper.dev](https://serper.dev). |
| `MAX_TOKENS` | Text (optional) | Hard cap on `/llm` `max_tokens`, default 1024. |
| `JUDGE_MAX_TOKENS` | Text (optional) | Hard cap on `/judge` `max_tokens`, default 400. |
| `HTTP_REFERER`, `X_TITLE` | Text (optional) | OpenRouter attribution headers. |
| `SEARCH_NUM_RESULTS`, `SEARCH_GL`, `SEARCH_HL` | Text (optional) | Serper/Google result tuning (result count, country, language); defaults are fine. |

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
- **`/search` returns `401`/`403` with a Serper `detail`.** The `SERPER_API_KEY` secret is missing or wrong — set it in the Worker (Settings → Variables and Secrets). A `429` from `/search` means the Serper plan quota is exhausted; top up or upgrade at [serper.dev](https://serper.dev). (The previous DuckDuckGo backend throttled the Worker's datacentre IP and served a bot-challenge page after a few queries — that failure mode, where search "worked for a few queries then went *vorübergehend nicht verfügbar*", is gone with the keyed Serper API.)
- **`/llm` returns 200 but the assistant message is empty.** Almost always a `max_tokens` issue, or the model id in `embed.html`'s `RCT_LLM_MODEL` is wrong. Check the Worker live tail in the Cloudflare dashboard.

### Embed / deployment

- **GitHub Pages serving stale `embed.html`.** Pages CDN caches aggressively. Hard-refresh (Cmd/Ctrl+Shift+R), or append `?v=<timestamp>` to the iframe src in the Qualtrics question text to force a fresh fetch.
- **Same SEARCH results appear for every query** during testing. Browser cached an old response, or a stale `localStorage` state was restored. Bypass by changing the `pid` query param (`?pid=test2`) — that's the localStorage key.
- **Iframe height keeps growing on each interaction.** Resolved upstream (PR #3) by clamping height in the bridge JS and removing `100vh` from `embed.html`. If it recurs, check that `body { min-height: 100vh }` hasn't been re-introduced in `embed.html` — that triggers a feedback loop with the auto-resize.
- **Mid-page drop-outs lose recent turns.** Qualtrics persists Embedded Data on page transitions, not on every `setEmbeddedData` call. The iframe's localStorage has the full log but it can't be pulled back from the participant's browser. If complete fidelity is required (IRB), add a `/log` route on the Worker that mirrors each event server-side.

## Thesis writing

The thesis is written in LaTeX, stored separately from the experiment code:

```
Thesis WIP directory:
  ~/Library/Mobile Documents/com~apple~CloudDocs/
    gymnasium steglitz/B.SC Frankfurt School/Oxford/Thesis/WIP/

  thesis-latex/
  ├── main.tex                  # Master document
  ├── references.bib            # BibLaTeX bibliography
  ├── sections/
  │   ├── abstract.tex
  │   ├── introduction.tex
  │   ├── concepts.tex          # Conceptual framework
  │   ├── theory.tex            # CLT-based theoretical model
  │   ├── literature_review.tex
  │   ├── methods.tex           # ← Active drafting target
  │   ├── results.tex
  │   └── discussion.tex
  └── Appendix/
      └── (CONSORT-AI PDF, etc.)

  methods_plan.md               # Detailed writing blueprint for Methods
  methods_notes.md              # Working notes and decision log
```

### Key design decisions (documented in methods.tex and methods_plan.md)

| Decision | Choice | Key justification |
|---|---|---|
| Reporting standard | CONSORT-AI (primary) + CONSORT-SPI + TIDieR | AI intervention in a social/psychological trial |
| Pre-test | Posttest-only (no content-matched pre-test) | Sensitisation d=0.43 (Willson 1982), asymmetric testing effect, demand characteristics in an offloading study |
| Baseline equivalence | MAILS-S (AI literacy) + Mini-VLAT V2 (visual data literacy) + demographics | Capture relevant individual differences without target-content exposure |
| Active control | Web search (Google via Serper.dev), not no-tool | Ecological validity: compare against existing practice (Freedland et al. 2011); precedent in Shen & Tamkin (2026) |
| Primary outcome timing | Immediate post-test (primary), delayed post-test (secondary) | Pragmatic: delayed follow-up risks non-random attrition in online adult sample |
| Analysis framework | OLS with arm dummies, HC1 SEs, Bonferroni-corrected pairwise contrasts | ITT primary, per-protocol sensitivity |

### Methods section writing status

| Subsection | Status | Notes |
|---|---|---|
| §5.1 Research Design | ✅ Drafted | Three \paragraph{} blocks: RCT rationale, three-arm structure, posttest-only design |
| §5.2 Participants | 📝 Planned | Blueprint in methods_plan.md §5.2; boxplot screening DECISION PENDING |
| §5.3 Setting & Materials | 📝 Planned | Blueprint in methods_plan.md §5.3; concise main text + appendix refs |
| §5.4 Interventions | 📝 Planned | Blueprint in methods_plan.md §5.4; TIDieR-compliant, Socratic arm has 4-layer compliance structure |
| §5.5 Measures | 📝 Planned | Blueprint in methods_plan.md §5.5 |
| §5.6 Procedure | 📝 Planned | Blueprint in methods_plan.md §5.6 |
| §5.7 Randomisation | ✅ Drafted | In methods.tex (placeholder-level) |
| §5.8 Sample Size | ✅ Drafted | In methods.tex (placeholder-level, needs per-arm N) |
| §5.9 Statistical Analysis | ✅ Drafted | In methods.tex (placeholder-level) |
| §5.10 Pre-registration | ✅ Drafted | In methods.tex (placeholder-level) |
| Appendix A (CONSORT-AI) | ✅ Created | Full longtable in appendix.tex; page refs empty |
| Appendix B (System Prompts) | ✅ Exists | In appendix.tex |

### Writing approach

The preferred workflow for each Methods subsection:
1. **Discuss & brainstorm** — review methods_plan.md requirements, resolve open questions
2. **Draft two versions** — vary structure, emphasis, or argument order
3. **Analyse both** — identify strengths/weaknesses of each
4. **Produce optimal version** — synthesise the best elements into the final LaTeX prose

Main text carries the "why" and interpretively important content. Tedious implementation detail (platform architecture, Judge pipeline, stimulus materials, step-by-step procedure) is deferred to appendices.

### Open placeholders (require decisions before finalising)

| Placeholder | Decision needed | Current status |
|---|---|---|
| Boxplot screening | Exclusion gate or covariate-only? | PENDING — depends on pilot data |
| Practice item count | Expand beyond 3? | Currently 3 in QUESTIONS array |
| Post-test item count | How many held-out items? | TBD |
| Delayed post-test timing | 7 days? 14 days? | TBD |
| Recruitment platform | Prolific / MTurk / LinkedIn? | TBD |
| Compensation | Amount and type | TBD |
| Geographic region | Scope of recruitment | TBD |
| Ethics approval | Committee + reference number | TBD |
| Pre-registration venue | OSF vs AsPredicted | TBD |
| Confidence scale | Single Likert item or multi-item? | TBD |
| Generator temperature | Confirm model default behaviour | Not set client-side; Worker doesn't override |
| Response-length matching | How was Unrestricted prompt calibrated? | Needs documentation |
| Per-protocol threshold | What % failing Judge scores = non-compliant? | TBD |
| Bick et al. (2024) citation | Soften "dominant tool" claim, replace, or remove? | PENDING — paper doesn't explicitly say web search is dominant; only shows 23% GenAI adoption |

### References added to bib (may need completion)

- `thomas2024` — **PLACEHOLDER**: needs full citation details (Thomas et al., posttest-only AI-education RCT)
- `elkarkri2025` — **PLACEHOLDER**: needs full citation details (El Karkri et al., posttest-only LLM learning study)
- Complete entries added: `liu2020`, `montgomery2018`, `freedland2011`, `bick2024`, `campbell1963`, `solomon1949`, `willson1982`, `roediger2006`, `hoffmann2014`

## What's still TODO

### Experiment implementation
- **Judge calibration.** Run two human coders against the 10 synthetic examples in `rct_judge_prompts.md` plus ~20 real pilot turns. Compute Cohen's κ between Judge and consensus. Targets: fidelity κ ≥ 0.75, intent κ ≥ 0.70. Log results in `rct_judge_prompts.md` → `## Calibration log`.
- **OpenRouter spend caps** on both the generator and Judge keys.
- **Pilot N=5–10** before opening the full trial — verify CSV export, Embedded Data shape, and the Socratic prompt's robustness against participant extraction attempts in the wild.
- **Qualtrics CSV export verification** — confirm `InteractionLog` is one parseable JSON column and the per-turn flat fields (`prompt_1..20`, `response_1..20`, `judge_fidelity_1..20`, etc.) are populated.

### Thesis writing
- **Complete placeholder bib entries** — `thomas2024` and `elkarkri2025` need full citation details.
- **Resolve Bick et al. citation** — current methods.tex claims web search is "the dominant information-retrieval tool" citing Bick et al. (2024), but the paper only reports 23% GenAI adoption and does not explicitly make this claim. Options: soften wording, find alternative citation, or remove and rest on Freedland (2011) + Shen & Tamkin (2026) alone.
- **Implement revised RCT rationale** — discussed alternative structure (gold standard → identification problem → policy relevance → internal/external validity tradeoff with mitigations) but not yet written into methods.tex §5.1.
- **Draft remaining Methods subsections** — §5.2 through §5.6 need full prose (§5.7–5.10 have placeholder-level text).
- **Resolve open placeholders** — see table above; several depend on pilot data or logistical decisions.

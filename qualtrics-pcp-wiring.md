# PCP outcome measure — Qualtrics wiring

How the PCP phase files (this repo) drop into the Qualtrics survey. Mirrors the
retired VLAT wiring; the VLAT originals are archived in `archive/vlat-outcome/`.

All pages are hosted on GitHub Pages (`https://bruno20033.github.io/thesis-rct/`)
and embedded via `<iframe>`; each question also needs a bridge in its **Add
JavaScript** panel. Copy the JS from `raw.githubusercontent.com`, never the
rendered GitHub page.

## The four question slots

| Phase | Question Text (HTML `<>` source) | Add JavaScript panel |
|---|---|---|
| **Aided practice — LLM arm** (RQ2) | iframe from `qualtrics-pcp-train-llm.html` → `embed-pcp.html?condition=LLM&arm=${e://Field/arm}&pid=${e://Field/ResponseID}` | `qualtrics-pcp-train-js.js` |
| **Aided practice — SEARCH arm** (RQ2) | iframe from `qualtrics-pcp-train-search.html` → `embed-pcp.html?condition=SEARCH&pid=${e://Field/ResponseID}` | `qualtrics-pcp-train-js.js` |
| **Immediate post-test** (RQ1, primary) | `<iframe src="…/qualtrics-pcp-posttest1.html?pid=${e://Field/ResponseID}" width="100%" style="border:none;min-height:700px">` | `qualtrics-pcp-js.js` |
| **Delayed post-test** (retention, secondary) | `<iframe src="…/qualtrics-pcp-posttest2.html?pid=${e://Field/ResponseID}" …>` | `qualtrics-pcp-js.js` |

- The LLM practice question serves **both** LLM arms; the Randomizer sets `arm`
  (socratic|unrestricted) and the iframe pipes it through `${e://Field/arm}`.
- `embed-pcp.html` hardcodes `PHASE='vlattrain'` and loads the 8 `block:"practice"`
  PCP items itself — no `phase=`/`set=` params needed.
- Post-tests ship **no answer key** (participant-facing). They store the chosen
  option **letter** per item; correctness is scored **offline** against
  `PCP_KEY` in `pcp_scoring.js`. Per-item time cap is `TIME_LIMIT=90s` (tunable at
  the top of each posttest HTML; set `0` to disable the timer entirely).

## Survey Flow placement

```
… baseline (Mini-VLAT covariate, demographics) …
Randomizer (1 of 3, Evenly Present)
├─ Group SEARCH:       Set ED condition=SEARCH        → Show: PCP practice (SEARCH)
├─ Group Socratic:     Set ED condition=LLM, arm=socratic     → Show: PCP practice (LLM)
└─ Group Unrestricted: Set ED condition=LLM, arm=unrestricted → Show: PCP practice (LLM)
Show: PCP Immediate post-test (tool withdrawn)
… NASA-TLX / confidence … End of Session 1

[~delay] Session 2 (separate survey or re-entry, linked by pid):
Show: PCP Delayed post-test
```

**Delayed post-test = a second session** — the one piece still needing a decision:
platform (Prolific longitudinal re-invite vs email), interval (e.g. 7 days),
reminder schedule, attrition handling. The `qualtrics-pcp-posttest2.html` renderer
itself is ready and identical in behaviour to posttest 1.

## Embedded Data — one field per phase (reuses existing fields)

The consolidated design writes the **whole phase into a single existing field**, so
there is **nothing new to declare**. Identity (`condition`, `participant_id`, `arm`)
is set by the Randomizer.

| Phase | Field (reused) | Holds |
|---|---|---|
| Aided practice | `vlat_train_responses` | JSON array, one dict per practice question: `{id, raw_id, chart_id, chart_type, format, answer, time_ms, interaction}`. `interaction` = `{mode:"llm", turns:[{prompt,response,response_latency_ms,judge}]}` (judge `null` on Unrestricted) **or** `{mode:"search", searches:[{query, clicks:[{title,url,index,dwell_ms,fallback_clicked}]}]}`. Built by `pcp_consolidate.js` inside the embed. |
| Immediate / delayed post-test | `vlat_post_responses` | JSON array, one dict per item: `{id, chart_id, format, answer, rt_ms, timeout}`. Immediate and delayed live in separate surveys, so each uses its own copy of the field. |

The field names are constants at the top of the bridges (`TRAIN_FIELD`,
`POSTTEST_FIELD`) — edit there to point at differently-named existing fields. No
answer key ships to the browser; correctness is scored offline by `pcp_score.js`
(`scoreResponses`) against `PCP_KEY`. The full raw InteractionLog is also backed up
server-side by the embed (Cloudflare `/log`), so the single field is the
analysis-facing record.

## Verified

`pcp_consolidate.js` (transform) and `pcp_score.js` (scorer) are unit-tested —
`node test_consolidate.js` → 26 pass; `node pcp_score.js --test` → 25 pass — across
all three arms including the Socratic active-regen path. The post-test renderer was
browser smoke-tested. The aided `embed-pcp.html` flow still needs an end-to-end
pilot check with the Cloudflare Worker live.

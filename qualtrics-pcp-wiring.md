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

## Embedded Data to declare (Survey Flow → Embedded Data block)

Undeclared fields are dropped silently. Identity (`condition`, `participant_id`,
`arm`) is set by the Randomizer.

**Post-tests** — per item `<id>_response`, `<id>_rt`, `<id>_timeout` (id already
includes the `pcp_` prefix), plus 7 block fields each.

- Immediate (16): `pcp_rem_sa_1..4`, `pcp_und_sa_1..4`, `pcp_ana_sa_1`, `pcp_ana_sa_2`, `pcp_ana_sa_3`, `pcp_ana_sa_9`, `pcp_eval_sa_1..4`
- Delayed (16): `pcp_rem_sa_5..8`, `pcp_und_sa_5..8`, `pcp_ana_sa_5..8`, `pcp_eval_sa_5..8`
- Block fields (× posttest1, posttest2): `pcp_<block>_completed`, `_total_time`, `_items_answered`, `_attempted`, `_order`, `_total`, `_responses`

**Aided practice** — the full `pcp_train_*` field list (interaction log, per-turn
chat/search/judge fields, and `pcp_train_<id>_answer/_chart/_format/_slot/_time`
for the 8 practice ids) is documented in the header of `qualtrics-pcp-train-js.js`.

## Verified

The post-test renderer was smoke-tested in a browser (16 items load, chart +
options render, selection→advance→completion works, ED fields correctly named
`pcp_<id>_response/_rt/_timeout` + 7 block fields, no console errors). The aided
`embed-pcp.html` practice flow still needs an end-to-end pilot check with the
Cloudflare Worker live (P3).

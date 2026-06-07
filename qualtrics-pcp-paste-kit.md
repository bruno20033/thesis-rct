# PCP → Qualtrics paste kit

Copy-paste-ready blocks to wire the live PCP outcome measure into Qualtrics by
hand. Companion to `qualtrics-pcp-wiring.md` (which explains *why*); this file is
just the *what to paste, where*. All URLs point at GitHub Pages `main`, which is
**live and verified** (deployed 2026-06-07).

Two paste slots per question — they are NOT the same place:
- **Question Text → `<>` (HTML source)** ← the `<iframe>` block.
- **gear ⚙️ → Add JavaScript** ← the bridge JS (copy from the raw URL).

Make each iframe-hosting question a **Text / Graphic (Descriptive Text)** question.

---

## The four question slots

### Slot 1 — Aided practice, **LLM arm** (RQ2 productivity; serves Socratic + Unrestricted)

Question Text (`<>` HTML source):
```html
<iframe
  src="https://bruno20033.github.io/thesis-rct/embed-pcp.html?condition=LLM&arm=${e://Field/arm}&pid=${e://Field/ResponseID}"
  width="100%" height="800" frameborder="0"
  style="border:none; display:block; width:100%; min-height:700px;"
  allow="clipboard-write" title="Research tools — LLM (PCP aided training)"></iframe>
```
Add JavaScript ← copy ALL of:
`https://raw.githubusercontent.com/bruno20033/thesis-rct/main/qualtrics-pcp-train-js.js`

### Slot 2 — Aided practice, **SEARCH arm** (RQ2 productivity; control)

Question Text (`<>` HTML source):
```html
<iframe
  src="https://bruno20033.github.io/thesis-rct/embed-pcp.html?condition=SEARCH&pid=${e://Field/ResponseID}"
  width="100%" height="800" frameborder="0"
  style="border:none; display:block; width:100%; min-height:700px;"
  allow="clipboard-write" title="Research tools — SEARCH (PCP aided training)"></iframe>
```
Add JavaScript ← **same file as Slot 1** (`qualtrics-pcp-train-js.js`).

### Slot 3 — **Immediate** post-test (RQ1 primary; tool withdrawn)

Question Text (`<>` HTML source):
```html
<iframe src="https://bruno20033.github.io/thesis-rct/qualtrics-pcp-posttest1.html?pid=${e://Field/ResponseID}" width="100%" style="border:none;min-height:700px"></iframe>
```
Add JavaScript ← copy ALL of:
`https://raw.githubusercontent.com/bruno20033/thesis-rct/main/qualtrics-pcp-js.js`

### Slot 4 — **Delayed** post-test (retention secondary; Session 2)

Question Text (`<>` HTML source):
```html
<iframe src="https://bruno20033.github.io/thesis-rct/qualtrics-pcp-posttest2.html?pid=${e://Field/ResponseID}" width="100%" style="border:none;min-height:700px"></iframe>
```
Add JavaScript ← **same file as Slot 3** (`qualtrics-pcp-js.js`).

---

## Embedded Data — one field per phase (reuse existing fields)

The consolidated design writes the **whole phase into a single existing field**, so
there's **nothing new to declare** (identity `condition`/`participant_id`/`arm` is set
by the Randomizer):

| Phase | Field reused | Holds |
|---|---|---|
| Aided practice (Slots 1 & 2) | `vlat_train_responses` | one dict per question — answer + that question's interaction (LLM `turns[]`+judge / SEARCH `searches[]`+clicks) |
| Immediate post-test (Slot 3) | `vlat_post_responses` | one dict per item — `{id, chart_id, format, answer, rt_ms, timeout}` |
| Delayed post-test (Slot 4, separate survey) | `vlat_post_responses` | same shape, in that survey's own namespace |

The field names are constants at the top of the bridges (`TRAIN_FIELD`,
`POSTTEST_FIELD`); edit there to target differently-named existing fields. The full
raw InteractionLog is also backed up server-side (Cloudflare `/log`), and correctness
is scored offline by `pcp_score.js` (`scoreResponses`) against `PCP_KEY` — no answer
key in the browser. Schema details: [qualtrics-pcp-wiring.md](qualtrics-pcp-wiring.md).

---

## Survey Flow shape

```
Embedded Data block  (reuses existing fields — nothing new to declare)
… baseline: Mini-VLAT covariate + demographics …
Randomizer  (Randomly present 1 of 3, ✓ Evenly Present Elements)
├─ Group "SEARCH":        Set ED condition=SEARCH                 → Show Slot 2 (SEARCH practice)
├─ Group "Socratic":      Set ED condition=LLM, arm=socratic      → Show Slot 1 (LLM practice)
└─ Group "Unrestricted":  Set ED condition=LLM, arm=unrestricted  → Show Slot 1 (LLM practice)
Show Slot 3 (Immediate post-test — tool withdrawn)
… NASA-TLX / confidence …  End of Session 1
[~7-day delay] Session 2 (re-entry linked by pid):  Show Slot 4 (Delayed post-test)
```

---

## Gotchas (each one has bitten this project before)

- **iframe in the JS panel → `Unexpected token <`.** The iframe goes in Question
  Text `<>`; the JS goes in gear ⚙️ → Add JavaScript. They are different slots.
- **Copy JS from `raw.githubusercontent.com`, never the rendered GitHub page** —
  the rendered page linkifies `event.data` into a broken Markdown link.
- **Randomizer:** count = **1**, Evenly Present, and each branch must be a **Group**
  wrapping *(Set ED, Show Block)* together — otherwise Qualtrics treats the 6 items
  as 6 siblings and can show a bare ED with no question.
- **Record incomplete responses** (Survey Options → Responses) so drop-outs are kept
  for ITT.
- **Worker `ALLOWED_ORIGINS`** must include your Qualtrics datacentre origin (e.g.
  `https://oii.eu.qualtrics.com`) and `https://bruno20033.github.io`, or the aided
  LLM/SEARCH panel gets `403 Forbidden origin`. (Set in CLAUDE.md; verify before pilot.)
- **Sanity check after wiring:** open the survey preview, DevTools console should show
  `[PCP bridge] … listening` (post-tests) or the train bridge's init line; then
  Data & Analysis should show the `pcp_*` fields populate after a test run.
```

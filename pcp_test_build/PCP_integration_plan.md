# PCP Outcome Measure — Integration Plan (GitHub + Qualtrics)

## Guiding principle
The repo **already** has a chart-literacy harness wired end-to-end for VLAT
(`vlat_items_data.js` → `embed-vlat.html` → `qualtrics-vlat-*` phase files → `vlat_scoring.js`).
**Integrating PCP = mirror that pattern, swapping VLAT items/charts for PCP.** Almost no new
architecture is required.

This also realises the clean measurement design we landed on earlier:
- **MiniVLAT (existing) = baseline covariate** — general visual literacy, measured once.
- **PCP/BTPL (new) = practice + outcome** — the trained, unfamiliar chart type.
- **VLAT-as-outcome and the CR/GMAT items are retired** (CR was already a "drop" decision).

## How the PCP design maps onto existing harness slots

| PCP piece | Items | Existing slot to mirror |
|---|---|---|
| Training (tool-assisted practice) | 8 FA (2 / module) | `block:"practice"` + `qualtrics-vlat-train-{llm,search}.html` + `qualtrics-vlat-train-js.js` |
| Immediate post-test (unaided) | 16 SA (Q1–Q4 / module) | `block:"posttest1"` + `qualtrics-vlat-posttest1.html` |
| Delayed post-test (unaided) | 16 SA (Q5–Q8 / module) | `block:"posttest2"` + `qualtrics-vlat-posttest2.html` |
| Baseline covariate | — | keep `qualtrics-minivlat-baseline.html` (or swap to numeracy/BNT) |

## GitHub side (the embed/host)

**1. Chart images → `charts/`.** The renderer loads `charts/<chartId>.png` (embed-vlat.html:1263).
So produce one image per item, e.g. `charts/pcp_ana_sa_q5.png`. ~38 images (drop the open-ended
Analyze Q4). **Recommended: regenerate from source data as SVG/high-DPI** rather than reuse the
low-res PDF screenshots (ties to the image-quality issue you flagged); the 10 datasets are listed
in the P-Lite paper, Table 4.

**2. `pcp_items_data.js`** — mirror `vlat_items_data.js`. One entry per item:
```js
{ id:'pcp_rem_sa_1', block:'posttest1', bloom:'remember',
  chartType:'Parallel Coordinates', chartId:'pcp_rem_sa_q1',
  questionText:'Is this an example of a parallel coordinates plot?',
  questionText_de:'…',
  questionFormat:'mc',
  options:[ {label:'Yes',text:'Yes',text_de:'Ja'},
            {label:'No', text:'No', text_de:'Nein'},
            {label:'Not sure',text:'Not sure',text_de:'Unsicher'} ] }
```
- `block`: `practice` (FA training) | `posttest1` (immediate SA Q1–4) | `posttest2` (delayed SA Q5–8).
- Add a **`bloom`** field (remember/understand/analyze/evaluate) → enables the "where does
  offloading bite" per-level analysis.
- Correct answers live in **`pcp_scoring.js`** (mirror `vlat_scoring.js`), keyed by `id`, taken
  from `PCP_ANSWER_KEY.md`. Replace the open-ended Analyze Q4; confirm the LOW-confidence items.

**3. Embed.** *Recommended:* **generalise `embed-vlat.html`** to load a bank by URL param
(`?bank=pcp` → load `pcp_items_data.js`), instead of duplicating a 2,500-line file. The chart
renderer (`<img src="charts/<chartId>.png">`) already works unchanged. Alternative: copy to
`embed-pcp.html` (more to maintain).

**4. Qualtrics phase HTML (mirror `qualtrics-vlat-*`):**
- `qualtrics-pcp-train-llm.html` + `qualtrics-pcp-train-search.html` — thin iframe loaders →
  `embed-vlat.html?bank=pcp&condition=…&phase=practice`. Reuse `qualtrics-vlat-train-js.js` bridge.
- `qualtrics-pcp-posttest1.html`, `qualtrics-pcp-posttest2.html` — self-contained unaided
  renderers; score via `pcp_scoring.js`; write to Embedded Data. **Reference images by absolute
  GitHub Pages URL** (`https://bruno20033.github.io/thesis-rct/charts/…`), since these run on the
  Qualtrics origin, not the Pages origin.

## Qualtrics side (the survey)

**1. Survey Flow** (additions, mirroring the VLAT phases):
- **Embedded Data**: declare new PCP fields (per-item responses, per-phase + per-bloom scores,
  time-on-item). Undeclared fields are dropped silently.
- **Practice**: the PCP iframe question goes *inside the existing arm Randomizer groups* so
  SEARCH / Socratic / Unrestricted each get PCP practice with their tool.
- **Immediate post-test**: `qualtrics-pcp-posttest1` block, shown after practice (tool withdrawn).
- NASA-TLX / confidence (existing) → End of Session 1.

**2. Delayed post-test = a second session** (your "test everyone twice"). This is the main *new*
logistical piece: a **separate Qualtrics survey** (or re-entry block) containing
`qualtrics-pcp-posttest2`, distributed ~7 days later (email / Prolific longitudinal re-invite),
linked by `pid`. Needs: platform choice, delay interval, reminder schedule, attrition handling.

**3. Scoring/data**: done inside the posttest HTML block (like VLAT), not native Qualtrics scoring.
The answer key lives in `pcp_scoring.js`.

## Content-prep tasks (the actual work)
- [ ] Extract/regenerate ~38 PCP chart images → `charts/` (decide PDF-extract vs data-regenerate).
- [ ] Author `pcp_items_data.js` (~40 entries: options, `bloom`, `block`).
- [ ] `pcp_scoring.js` from `PCP_ANSWER_KEY.md` (replace Analyze Q4; confirm LOW items).
- [ ] German translations of PCP questions/options — or decide PCP runs English-only.
- [ ] 6 Qualtrics phase files + Embedded Data declarations + Survey-Flow wiring.
- [ ] Stand up the delayed-test second survey + distribution.
- [ ] Pilot N=3–5 end-to-end; verify CSV/score export.

## Decisions needed before building
1. **Scope:** does PCP **replace** the VLAT outcome (retire VLAT-as-outcome + CR wiring), with
   **MiniVLAT kept as baseline**? (Recommended — matches the covariate design.) Or run alongside?
2. **Embed:** generalise `embed-vlat.html?bank=pcp` (rec) vs duplicate `embed-pcp.html`.
3. **Images:** regenerate from data as SVG (rec, better quality) vs extract low-res from the PDFs (fast).
4. **Bilingual:** translate PCP items to German (harness + sample are EN/DE) vs English-only.
5. **Delayed test:** platform (Prolific longitudinal vs email), interval (7 d?), reminders.
6. **Baseline covariate:** keep MiniVLAT, or swap/add numeracy (Berlin Numeracy Test)?
7. **Practice count:** 8 aided items keeps the session long — drop to 1/module (4) if attrition risk.

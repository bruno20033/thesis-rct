# High-resolution PCP stimulus regeneration

This directory is the reproducible replacement pipeline for the 40
parallel-coordinates-plot (PCP) stimuli used in the experiment. Candidate
images are generated separately from the served assets in `../charts/`.

## Why this exists

The trial used lossless crops of the BTPL assessment PDFs.  The PDFs embed
low-resolution raster screenshots, so increasing their PDF render DPI cannot
improve the underlying chart detail.  `regenerate.py` recreates source-verified
charts from the underlying open data and writes both vector SVG and 3x PNG
fallbacks.

## Provenance

The input assessment was the BTPL instrument:

- https://github.com/vis-graphics/ml-pcp-literacy (CC BY-NC-SA 4.0)
- Srinivas et al. (2025), *Mastery Learning Improves Performance on Complex
  Tasks on PCP Literacy Test*, arXiv:2506.10164

The data sources used for the first source-derived reconstruction set are pinned in
`sources.json`.  Their field names and row counts are validated by the script.
The historical P-Lite paper (Firat et al., 2022, Table 4) is the source ledger
for the original Car, Cereal, Coal Disaster, US Election and US Population
data.  It also documents that the original test images were produced with
several different PCP tools, and that axis ranges / order were sometimes
modified.  Consequently a matching source dataset alone does **not** prove a
replacement item is equivalent.

## Run

```bash
python regenerate.py
```

This downloads only open data into `data/` (which is ignored), then writes
source-derived candidate replacements to `out/{svg,png}/` and a `validation.json`
ledger.  It never writes into `../charts/`.

## Reviewed release

The study owner reviewed all 40 candidates side by side and selected the
28 replacements recorded in `release_decisions.json`. The remaining 12
original images stay in `../charts/`; delayed test 05 was explicitly retained
because its small axis titles are the answer-bearing defect. Run
`python release_selected.py` after generation to copy only the selected PNGs
into `../charts/`. `release_result.json` records the original and replacement
hashes and replacement dimensions. The original PNGs are also recoverable
from Git history. The embed versions PCP URLs so returning participants do
not see cached originals.

This was a study-owner visual selection, **not** a claim that all candidate
charts passed an independent measurement-equivalence audit. The checklist
below remains the standard for any further chart replacements.

## Further release checklist

Do not deploy a regenerated image until all four checks have a documented
PASS:

1. dataset identity and row count;
2. axis names, order, direction and range;
3. filters, selections, colour encoding and any intentional fault;
4. answer-key equivalence, independently checked against the original item.

`validation.json` also contains a small `answer_logic_audit`. It asserts the
recoverable facts that matter for the revised car-selection, college-ranking,
college-filter and Coal Disaster items. It deliberately does **not** certify
the remaining visual or semantic equivalence claims.

## Provenance distinction

Thirty-four released-assessment items are source-pinned candidates: the input
table is pinned and validated in `sources.json`. This verifies their public
data provenance, but not yet the original's row selection, chart transformation
or measurement equivalence. The eight added training items are also
source-pinned and are already served at high resolution. Six released items
are high-resolution, deterministic structural redraws of assessment
illustrations whose original tables were not included in the public BTPL
release. They are identified under `structural_reconstructions` in
`out/validation.json`. Their provenance limitation still applies to any
owner-selected replacements; the selection does not establish that their
underlying records match the original tables.

See [SOURCE_RECOVERY.md](SOURCE_RECOVERY.md) for the public-source audit and
the exact material needed to clear those six items.
See [SOURCE_MAP.md](SOURCE_MAP.md) for the released items' candidate source
mapping and the distinction between public source data and the unreleased
per-item chart-generation settings.

### Recovered transformation: Coal Disaster / `pcp_und_sa_3`

The cited Xmdv archive has 191 rows. The eight rows whose `Interval` is greater
than 826 or `Deaths` is greater than 344 cannot be present in the deployed
chart: removing them produces its exact visible upper bounds. The remaining 181
records are rendered using the printed padded domains (Month 0–13, Year
1850–1962, Day of Year 0–365, Interval 0–826 and Deaths 9–344). This is a
recoverable display/filter transformation, not a change to the source data.

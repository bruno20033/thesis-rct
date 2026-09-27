# Remaining source-data recovery

This note records the public-source search for the six stimuli that cannot yet
be regenerated from original tables. It is deliberately separate from the
renderer so that a future data handoff can be assessed without rediscovering
the provenance work.

## Public locations checked

- BTPL materials repository: <https://github.com/vis-graphics/ml-pcp-literacy>
  - The complete 46-commit history has assessment figures and participant
    response exports, but no underlying stimulus table for the items below.
- Earlier P-Lite repository: <https://github.com/vis-graphics/pcp-literacy>
  - The complete 44-commit history has study figures, response data and the
    Apply/Create datasets, but not these assessment-source tables.
- BTPL supplementary OSF project: <https://osf.io/h7jav/?view_only=b44cd8c5682d4bceb4048f0873b9725e>
  - Its public components contain figure PNGs, assessment PDFs and response
    CSVs. They do not contain the raw tables or chart-generation scripts.
- The P-Lite paper's Table 4 source list. Its original ten datasets do not
  include the malaria/poverty or `val_auc` stimuli, so those two entered the
  assessment after that original source ledger.

## Exact handoff needed

| Stimulus | Needed to finish source-equivalent reconstruction |
| --- | --- |
| `pcp_und_fa_2` | The row-level table used for *Fever or Malaria cases (%)*, *Malaria cases (%)* and *Poverty Rate*, including the 2006/2013 fields and any group/colour variable. |
| `pcp_und_sa_5` | The Weights & Biases (or equivalent) run/sweep export with `/dropout`, `/learning_rate[0]` and `val_auc`; CSV, JSON or an export link is sufficient. |
| `pcp_rem_sa_3` | The original option-chart source files or a statement that matching chart family/layout is sufficient for this recognition item. |
| `pcp_rem_sa_5` | The treemap's hierarchy/value table, or approval of the recreated non-PCP treemap structure. |
| `pcp_rem_sa_6` | Source files for its four non-PCP distractor charts, or approval of the recreated recognition set. |
| `pcp_rem_sa_7` | Source files for its four non-PCP distractor charts, or approval of the recreated recognition set. |

## Suggested author request

> We are regenerating the PCP-literacy stimuli as high-resolution SVG/PNG
> while preserving their answer-bearing properties. Could you share the raw
> data/export and chart-generation settings for the malaria/poverty comparison
> and the `/dropout`, `/learning_rate[0]`, `val_auc` PCP? For the four
> recognition-choice illustrations, could you either share the source files or
> confirm that faithful chart-family/layout redraws are measurement-equivalent?

The received material should be placed outside `out/` and added as a new,
checksummed entry in `sources.json`; then the structural status can be removed
only after the normal item-level release gate passes.

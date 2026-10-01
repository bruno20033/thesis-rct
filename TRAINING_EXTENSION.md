# Training extension: 16 / 16 / 16

The aided PCP phase now contains 16 questions: the released eight-item
practice block plus eight training-only questions drawn from the released
PCP-literacy source assessments. The immediate and delayed unaided
post-tests remain their released 16-item blocks; no outcome item was moved
into training.

| Item | Source task | Pinned source table | Key |
|---|---|---|---|
| `pcp_create_1` | two highest-sugar cereals | Cereal | B |
| `pcp_create_2` | cereal with most fibre | Cereal | C |
| `pcp_create_3` | manufacturers of highest-vitamin cereals | Cereal | D |
| `pcp_create_4` | one cereal rated below 20 | Cereal | A |
| `pcp_create_5` | sodium >250 and sugar >5 | Cereal | B |
| `pcp_analyze_7` | HP range for selected 8-cylinder cars | Auto MPG | C |
| `pcp_analyze_2` | identify mixed ascending/descending axis directions | State demographics | D |
| `pcp_analyze_4` | state with low high-school completion and high households | State demographics | A |

The first 12 training questions are shuffled. The four final items are fixed
as `pcp_create_5`, `pcp_analyze_7`, `pcp_analyze_2`, and
`pcp_analyze_4`. Before each of those four, participants either enter a
brief account of their own reasoning or select “I relied mainly on the tool
and cannot state my own reasoning.” They then choose their best substantive
answer to the chart question, even when unsure.

All 16 training questions require a substantive answer in every arm (Search,
Socratic LLM and unrestricted LLM). The renderer filters the original English
“I don't know” option before localization and does not append an abstention
option to the added items. The eight released practice items retain their original answer letters and
offline scoring keys, including historical omission keys. The added eight use
the balanced letters documented above. An unsubmitted abstention
restored from an older session cannot enable Next; the participant must select
a currently available answer. No per-item training confidence scale is added.
The Mini-VLAT baseline retains its existing abstention option; the separate
post-training PCS and outcome confidence procedures are unchanged.

Participant-facing chart labels are neutral ("Chart" / "Diagramm"). The
training chart-type caption is removed, and training and both outcome pages
use neutral image alternative text, including enlarged images and missing-image
placeholders. This prevents the interface from supplying the answer to chart-type
identification questions. Item wording, source metadata and scoring keys remain
unchanged.

The reasoning record is stored in the existing `vlat_train_responses` JSON
as `{mode, reasoning_text}`; Qualtrics Survey Flow needs no additional
Embedded Data fields. The static multiple-choice format is an implementation
adaptation of the source activities, while every displayed value and answer
fact is asserted by `pcp_regeneration/regenerate.py`.

The added items use balanced answer positions (two correct answers at each
letter A–D). This avoids an all-A shortcut during training; the offline key
in `pcp_scoring.js` matches the displayed option order.

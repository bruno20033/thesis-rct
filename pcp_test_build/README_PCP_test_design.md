# PCP Literacy Outcome Measure — Training & Test sets

Built from the open-source **PCP Literacy Test using Bloom's Taxonomy** (the mastery-learning
successor to P-Lite), repo: <https://github.com/vis-graphics/ml-pcp-literacy>,
live site: <https://vis-graphics.github.io/PCP-Literacy-Test/>.
Licence: **CC BY-NC-SA 4.0** — academic use is fine; attribute the source and share any
adaptation under the same terms. Cite the mastery-learning paper (arXiv:2506.10164) and the
P-Lite lineage (Firat, Denisova, Wilson & Laramee, 2022, *Visual Informatics* 6(3)).

Scope: the **four objective (multiple-choice) modules only** — Remember, Understand, Analyze,
Evaluate. Apply and Create are excluded (constructed-response, rubric-graded).

## Files

| File | Contents | Items | Pages |
|---|---|---|---|
| `PCP_Training_set.pdf` | Practice block, from the **formative (FA)** forms | 8 (2 / category) | 7 |
| `PCP_Test_set.pdf` | Post-test pool, from the **summative (SA)** forms | 32 (8 / category) | 24 |

Training pulls from FA and the test from SA, so **no item is reused between practice and
test** — the score reflects learning, not memorisation.

## Training set (PCP_Training_set.pdf) — 8 items

| Doc pages | Bloom level | Source file | Source Q# |
|---|---|---|---|
| 1–2 | Remember | Remember-FA | Q1, Q2 |
| 3 | Understand | Understand-FA | Q1, Q2 |
| 4–5 | Analyze | Analyze-FA | Q1, Q2 |
| 6–7 | Evaluate | Evaluate-FA | Q10, Q11 |

## Test set (PCP_Test_set.pdf) — 32 items, used across two administrations

Each category contributes 8 items; **Q1–Q4 = immediate post-test**, **Q5–Q8 = delayed
post-test** (parallel halves, no overlap).

| Doc pages | Bloom level | Source file | Source Q# | Wave |
|---|---|---|---|---|
| 1–3 | Remember | Remember-SA | Q1–Q4 | Immediate |
| 4–6 | Remember | Remember-SA | Q5–Q8 | Delayed |
| 7–9\* | Understand | Understand-SA | Q1–Q4 | Immediate |
| 9–11\* | Understand | Understand-SA | Q5–Q8 | Delayed |
| 12–15\* | Analyze | Analyze-SA | Q1–Q4 | Immediate |
| 15–17\* | Analyze | Analyze-SA | Q5–Q8 | Delayed |
| 18–20 | Evaluate | Evaluate-SA | Q1–Q4 | Immediate |
| 21–24 | Evaluate | Evaluate-SA | Q5–Q8 | Delayed |

\* Some pages carry two questions, so for Understand/Analyze the immediate/delayed split is
**by question number, not by whole page** — assign per item when you rebuild in Qualtrics.

## ⚠️ Caveats before you use this

1. **No answer key.** These PDFs are the blank participant forms — correct answers are NOT
   included. You need a key to score. Routes: (a) derive it from the repo `data/` folder
   (participant responses + module scores may let you back out the keyed answer); (b) have me
   produce a *suggested* key (reliable for Remember/Understand recognition items; the
   Analyze/Evaluate data-reading items need careful per-chart checking); (c) ask the authors.
2. **Image quality.** Charts are the authors' original low-resolution screenshots. For a clean
   stimulus, regenerate the PCPs from source data as SVG/high-DPI (the 10 datasets are listed
   in the P-Lite paper, Table 4). Page extraction here is lossless — quality = the originals.
3. **Parallel-form equivalence is assumed, not proven.** Confirm on your pilot that FA vs SA
   (and immediate vs delayed halves) are difficulty-matched (ideally IRT-equated).
4. **4 items per level is thin for per-level reliability.** For the primary contrast, group
   **lower-order (Remember + Understand = 8)** vs **higher-order (Analyze + Evaluate = 8)**, or
   score one IRT θ. Treat single-level (4-item) results as exploratory.

## Rough timing

- Immediate post-test (16 unaided MCQs): ~12–20 min. Same for the delayed test.
- Training (8 *aided* items, solved with the tool): ~16–32 min (tool-interaction dependent —
  this is your main session-length/attrition lever).

## Provenance

Source PDFs downloaded from `…/assessments/` in the repo above. Page→question mapping and
extraction were done losslessly with poppler `pdfseparate`/`pdfunite`.

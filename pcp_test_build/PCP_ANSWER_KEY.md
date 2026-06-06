# PCP Literacy Test — Answer Key (derived)

**No official key exists in the repo** — the assessment PDFs are blank forms. This key was
reconstructed two ways:

1. **Response consensus** from the repo's participant data (`data/<Module>/*_control.csv`,
   `*_ml.csv`, n≈55) — the answer participants converged on, per question.
2. **Direct chart-reading** by me for the **Analyze** module, because its two data files use
   different question orders *and* reuse generic labels, so the data alone could not be matched
   to specific charts.

**Confidence:** `HIGH` = verified by chart logic and/or ≥80% consensus · `MED` = 55–79% consensus
· `LOW` = <55% / contested (treat as provisional, double-check against the chart).

> ⚠️ This is a *derived* key, not an authoritative one. Before launch, spot-check the `LOW`/`MED`
> items, and ideally confirm the full key with the authors (elif.firat@nottingham.ac.uk) or an
> independent expert.

---

## Training set (PCP_Training_set.pdf) — 8 items

| # | Module | Q | **Answer** | Conf. |
|---|---|---|---|---|
| 1 | Remember | FA Q1 | **Yes** | HIGH |
| 2 | Remember | FA Q2 | **Yes** | HIGH |
| 3 | Understand | FA Q1 | **The carbohydrate(g) axis is flipped** | HIGH |
| 4 | Understand | FA Q2 | **The Malaria cases (%) and the Poverty Rate axes have been reordered** | HIGH |
| 5 | Analyze | FA Q1 | **D** (homeownership-rate & households are adjacent) | HIGH |
| 6 | Analyze | FA Q2 | **B** (bill_depth & bill_length — both in the PCP) | HIGH |
| 7 | Evaluate | FA Q10 | **The color legend is not properly labeled** | MED |
| 8 | Evaluate | FA Q11 | **The color legend has the wrong colors** | HIGH |

## Test set (PCP_Test_set.pdf) — 32 items (immediate = Q1–Q4, delayed = Q5–Q8)

### Remember (recognition — verified against the charts)
| Q | Answer | Conf. |
|---|---|---|
| SA Q1 (diamonds PCP) | **Yes** | HIGH |
| SA Q2 (iris PCP) | **Yes** | HIGH |
| SA Q3 (which is a PCP?) | **C** | HIGH |
| SA Q4 (scatter + histogram) | **No** | HIGH |
| SA Q5 (treemap) | **No** | HIGH |
| SA Q6 (which is a PCP?) | **C** | HIGH |
| SA Q7 (which is a PCP?) | **B** | HIGH |
| SA Q8 (iris smooth PCP) | **Yes** | HIGH |

### Understand (data consensus 82–100%, not visually re-checked)
| Q | Answer | Conf. |
|---|---|---|
| SA Q1 | **The Income.Per.Capita Axis is flipped** | HIGH |
| SA Q2 | **The water(g) and the fiber(g) axes have been reordered** | HIGH |
| SA Q3 | **9 and 344** | HIGH |
| SA Q4 | **Between 20,000 to 30,000** | HIGH |
| SA Q5 | **-0.7887, -0.69216** | HIGH |
| SA Q6 | **1.0 and 6.0** | HIGH |
| SA Q7 | **Running pace per mile** | HIGH |
| SA Q8 | **Judson College** | HIGH |

### Analyze (chart-reading + data candidates)
| Q | Answer | Conf. |
|---|---|---|
| SA Q1 (best chart: Displacement↔Weight) | **B** | HIGH |
| SA Q2 (sort by AverageCost, desc.) | **C > B > A > D** | MED |
| SA Q3 (scatterplot encoded by PCP) | **A** | HIGH |
| SA Q4 (advantage/disadvantage) | **⚠ OPEN-ENDED — not scorable; replace this item** | — |
| SA Q5 (SATAverage↔AdmissionRate) | **They are negatively correlated** | HIGH |
| SA Q6 (Year↔TotalPopulation) | **They are positively correlated** | MED |
| SA Q7 (fat↔carbohydrate) | **They are negatively correlated** | MED |
| SA Q8 (filtered high-income → AverageCost) | **…go to colleges that have a high Average Cost** | MED |

### Evaluate (data consensus; "what's wrong with this chart" — somewhat subjective)
| Q | Answer | Conf. |
|---|---|---|
| SA Q1 | **The chart contains repeated axes** | HIGH |
| SA Q2 | **The axis labels are too cluttered and illegible/unreadable** | HIGH |
| SA Q3 | **The axis labels are too small** | LOW |
| SA Q4 | **There is too much data/clutter on this chart** | MED |
| SA Q5 | **There is nothing wrong with this chart** (a "control" item) | MED |
| SA Q6 | **The axis labels for one of the axes is not in order** | LOW |
| SA Q7 | **The chart contains repeated axes** | HIGH |
| SA Q8 | **It has too many axes** | LOW |

---

## Action items flagged by this exercise
1. **Replace Analyze SA Q4** — it's open-ended (constructed response), not an MCQ. Swap in another
   Analyze SA item (e.g. SA Q9/Q10 from the source PDF) and key it.
2. **Double-check the LOW items** (Evaluate SA Q3, Q6, Q8) and the MED Analyze items against the
   charts — the Evaluate "what's wrong" items are partly subjective even in the original.
3. **Watch for other constructed-response / attention-check items** if you pull more questions
   from these modules (the Analyze FA pool also contains a "Hello World in Python?" attention check
   and an advantage/disadvantage free-text item).
4. Confidence is highest for **Remember** (verified) and **Understand** (near-unanimous); treat
   **Evaluate** low-confidence items as provisional.

# PCP answer key — items to verify (11)

For each item: **open the image** (it shows the full question + chart + options), pick the correct
option, and write it in **Confirmed:**. Then send the list back and I'll update `pcp_scoring.js`.
Everything not listed here is already solid (Remember verified; Understand 82–100% consensus;
Analyze Q1/Q3/Q5 + FA Q1/FA Q2 fixed by chart logic; Evaluate Q1/Q2/Q7 + FA Q11 ≥80%).

---

## Analyze (5)

**1. `pcp_ana_sa_9`** — Analyze · immediate test  · image: `charts/pcp_ana_sa_9.png`
Q: *In this parallel coordinates plot of a cars dataset, the user has selected only the cars that have displacement above 400. What is the range for the HP (Horsepower) of these cars?*
Options: (150, 250) / (150, 300) / **(175, 230)** / (200, 250)
Look at: the min & max of the highlighted (dark) lines on the **Horsepower** axis.
Current guess: **(175, 230)**  ·  Confirmed: ________

**2. `pcp_ana_sa_2`** — Analyze · immediate test  · image: `charts/pcp_ana_sa_2.png`
Q: *Sort the following parallel coordinates charts in descending order based on the "AverageCost" to attend the university.*
Options: C>D>A>B / **C>B>A>D** / B>D>A>C / D>A>C>B
Look at: the highlighted blue line's value on the **AverageCost** axis in each mini-chart A–D; rank high→low.
Current guess: **C > B > A > D**  ·  Confirmed: ________

**3. `pcp_ana_sa_6`** — Analyze · delayed test  · image: `charts/pcp_ana_sa_6.png`
Q: *In this parallel coordinates plot, what is the correlation between Year and TotalPopulation?*
Options: **positively correlated** / negatively correlated / Not sure
Look at: between the **Year** and **Total Population** axes — lines roughly parallel = positive, crossing = negative.
Current guess: **positively correlated**  ·  Confirmed: ________

**4. `pcp_ana_sa_7`** — Analyze · delayed test  · image: `charts/pcp_ana_sa_7.png`
Q: *In the parallel coordinates plot below, what is the correlation between the fat(g) and the carbohydrate (g)?*
Options: positively correlated / **negatively correlated** / Not sure
Look at: between the **fat(g)** and **carbohydrate(g)** axes — parallel = positive, crossing = negative.
Current guess: **negatively correlated**  ·  Confirmed: ________

**5. `pcp_ana_sa_8`** — Analyze · delayed test  · image: `charts/pcp_ana_sa_8.png`
Q: *We get the following chart on filtering to remove rows with Median Family Income less than 100,000. What can we say about the Average Cost of the colleges that the students from those households go to?*
Options: **high Average Cost** / low Average Cost / high Median Debt (>30,000)
Look at: where the lines sit on the **AverageCost** axis (these are the high-income households).
Current guess: **high Average Cost**  ·  Confirmed: ________

---

## Evaluate (6) — "what's wrong with this chart" (partly subjective; judge by good-PCP principles)

**6. `pcp_eval_fa_10`** — Evaluate · practice (Set 1)  · image: `charts/pcp_eval_fa_10.png`
Q: *What is wrong with this chart?*
Options: **The color legend is not properly labeled** / There is no data on the chart / There is nothing wrong with this chart
Current guess: **color legend is not properly labeled**  ·  Confirmed: ________

**7. `pcp_eval_sa_3`** — Evaluate · immediate test  · image: `charts/pcp_eval_sa_3.png`
Q: *What is wrong with the following parallel coordinates plot?*
Options: **The axis labels are too small** / The data labels on each axis are too small / Nothing wrong / The chart does not use color
Note: options A vs B are very close ("axis labels" vs "data labels") — this is why it's low-confidence.
Current guess: **axis labels are too small**  ·  Confirmed: ________

**8. `pcp_eval_sa_4`** — Evaluate · immediate test  · image: `charts/pcp_eval_sa_4.png`
Q: *Name one thing wrong with this chart.*
Options: **There is too much data/clutter on this chart** / The legend is incorrect / There are too many variables on this chart
Current guess: **too much data/clutter**  ·  Confirmed: ________

**9. `pcp_eval_sa_5`** — Evaluate · delayed test  · image: `charts/pcp_eval_sa_5.png`
Q: *What is wrong with this chart?*
Options: **There is nothing wrong with this chart** / The color legend is wrong / The slope of the edges is too high
Note: this looks like a deliberate "control" item (nothing wrong) — verify that's intended.
Current guess: **nothing wrong with this chart**  ·  Confirmed: ________

**10. `pcp_eval_sa_6`** — Evaluate · delayed test  · image: `charts/pcp_eval_sa_6.png`
Q: *Find the problem with the following chart.*
Options: **The axis labels for one of the axes is not in order** / There is too much data on this chart / Nothing wrong
Current guess: **axis labels for one axis not in order**  ·  Confirmed: ________

**11. `pcp_eval_sa_8`** — Evaluate · delayed test  · image: `charts/pcp_eval_sa_8.png`
Q: *Name one problem with this chart.*
Options: **It has too many axes** / There is no problem with this chart / There are too many colors
Current guess: **too many axes**  ·  Confirmed: ________

---

### How to send back
Just reply with the ID and the confirmed answer, e.g.:
`ana_sa_9 = (175, 230); ana_sa_2 = C>B>A>D; eval_sa_3 = A …`
I'll patch `pcp_scoring.js` and flip these from provisional to confirmed.

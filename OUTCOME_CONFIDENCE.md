# Unaided PCP outcomes: best answer, then confidence

Applies identically to the immediate and delayed 16-item tests, across all three
arms. This changes the response procedure, not the item bank, chart files, answer
keys, Bloom allocation, or participant-seeded item order. Mini-VLAT baseline
and the native Qualtrics post-training PCS battery are unchanged. Training's
separate best-answer procedure, without per-item confidence, is documented in
`TRAINING_EXTENSION.md`.

## Participant procedure

1. Choose the best substantive answer, even when unsure. The outcome renderer
   filters out the original English `I don't know` option before applying the
   German overlay; the remaining option letters are preserved. The shared bank
   and offline omission keys are retained for historical exports.
2. Select **Confirm answer**. The chosen answer is locked; no correctness feedback
   is given. The answer timer stops.
3. Answer **How confident are you that your answer is correct?** using 0%, 10%,
   …, 100%. Anchors: **0% = not at all confident; 100% = completely confident**.
   Nothing is selected by default; an explicit selection, including 0%, is
   required to advance. Confidence is untimed and cannot change the answer.

The existing 90-second answer cap is retained. Expiry records `answer:"timeout"`
and `timeout:true`, even if an option was selected but not confirmed, matching
the previous timeout policy. It advances without asking confidence about a
missing answer. Removing explicit abstention does not remove timeout missingness.

English and German interfaces use the same procedure and scale. The German
confidence question is **Wie sicher sind Sie, dass Ihre Antwort richtig ist?**
with anchors **0% = überhaupt nicht sicher; 100% = vollkommen sicher**.

## Saved data and scoring

Each entry in the existing JSON array retains `id`, `chart_id`, `format`, `answer`,
`rt_ms`, and `timeout`, and adds:

| Field | Meaning |
|---|---|
| `confidence_pct` | Integer 0–100, in increments of 10; `null` on timeout |
| `confidence_rt_ms` | Milliseconds from answer confirmation to confidence submission; `null` on timeout |
| `response_format` | `best_answer_confidence_v1`, including timeout entries |

`rt_ms` remains answer time only. Total block time includes the confidence steps.
The `pcp_item_response` message also includes these added fields. The existing
`pcp_block_complete` / `rct_complete` sequence is retained.

The unmodified `qualtrics-pcp-js.js` bridge copies the entire JSON string into its
existing `POSTTEST_FIELD` (`post_test_1_q` in the repository; retain any existing
survey-specific field configuration). **No new Embedded Data fields, bridge
replacement, survey-flow edit, or PCS edit are required.** Immediate and delayed
surveys each store their own array. The version travels inside each record so it
survives this bridge and can distinguish new data from legacy abstention data.

Offline accuracy remains plain proportion correct, with timeouts in the
denominator; legacy abstentions remain scoreable. Confidence does not weight or
adjust accuracy. Join confidence from the raw records by item ID for secondary
confidence/calibration analyses; `pcp_score.js` intentionally retains its existing
output. This is a change from the original response format. Update the study
protocol/preregistration and pilot the added burden before recruitment.

## Validation and release

```sh
npm ci
npx playwright install chromium
npm run test:outcomes
node pcp_score.js --test
node test_consolidate.js
```

The browser suite serves the actual pages and unchanged bridge locally. It
substitutes only Qualtrics' host API, verifies the saved JSON, and scores that JSON
with the production scorer. It covers EN/DE, both blocks, mobile-width layout,
all substantive option labels, answer locking, required confidence including 0%,
separate timing, timeouts, keyboard operation, and single completion. CI runs the
browser and scoring checks on relevant PRs and main-branch pushes.

Merge this focused PR into `main`, then wait for GitHub Pages to deploy that
commit. The iframe URLs remain:

- `https://bruno20033.github.io/thesis-rct/qualtrics-pcp-posttest1.html`
- `https://bruno20033.github.io/thesis-rct/qualtrics-pcp-posttest2.html`

After deployment, use fresh pilot responses in both Qualtrics surveys. Confirm
the new answer/confidence steps, complete all 16 items, and inspect the exported
existing response field for 16 records with the new fields (including a deliberate
0% rating). Confirm Qualtrics Next becomes available only after completion.
Local bridge tests do not substitute for this final deployed survey check.

Rollback: revert the two renderer changes and redeploy; no survey schema migration
is needed. Preserve the original exports and use `response_format` when identifying
which procedure produced each response.

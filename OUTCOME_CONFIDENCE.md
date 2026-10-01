# Unaided PCP outcomes: best answer, then confidence

Both immediate and delayed 16-item tests require a best answer, then confidence,
across all three arms. Both tests use a 1–7 slider in a modal pop-up. This changes the response
procedure, not the item bank, chart files, answer
keys, Bloom allocation, or participant-seeded item order. Mini-VLAT baseline
and the native Qualtrics post-training PCS battery are unchanged. Training's
best-answer and per-item confidence procedure is documented in
`TRAINING_EXTENSION.md`.

## Participant procedure

1. Choose the best substantive answer, even when unsure. The outcome renderer
   filters out the original English `I don't know` option before applying the
   German overlay; the remaining option letters are preserved. The shared bank
   and offline omission keys are retained for historical exports.
2. Select **Confirm answer**. The chosen answer is locked; no correctness feedback
   is given. The answer timer stops.
3. Answer **How confident are you that your answer is correct?**:
   A modal pop-up presents an integer slider from **1 = Not at all confident**
   to **7 = Very confident**. Participants must move the slider or tap a
   position before Next becomes available. The native range's initial midpoint
   is not a response: its thumb is hidden and the interface says **No rating
   selected** until deliberate interaction. Tapping the midpoint explicitly
   records 4. Keyboard arrows and Home/End work; focus alone does not select a
   value. The modal contains focus and cannot be dismissed to bypass the rating.
   Confidence is untimed and cannot change the confirmed answer in either test.

The existing 90-second answer cap is retained. Expiry records `answer:"timeout"`
and `timeout:true`, even if an option was selected but not confirmed, matching
the previous timeout policy. It advances without asking confidence about a
missing answer. Removing explicit abstention does not remove timeout missingness.

English and German interfaces use the same procedure and scale in both tests.
The German question is **Wie sicher sind Sie, dass Ihre Antwort richtig ist?**
with anchors **1 = Überhaupt nicht sicher; 7 = Sehr sicher**.

## Saved data and scoring

Each entry in the existing JSON array retains `id`, `chart_id`, `format`, `answer`,
`rt_ms`, and `timeout`, and adds:

| Field | Meaning |
|---|---|
| `confidence_rating` | Both tests: integer 1–7; `null` on timeout |
| `confidence_scale` | Both tests: `1-7`, including timeout entries |
| `confidence_pct` | Legacy format only: integer 0–100 in increments of 10; absent from new records |
| `confidence_rt_ms` | Milliseconds from answer confirmation to confidence submission; `null` on timeout |
| `response_format` | Both tests: `best_answer_confidence_likert7_v1`; legacy: `best_answer_confidence_v1`, including timeout entries |

The rating is an ordinal, seven-category confidence measure; it is not
a stated probability of correctness. Do not relabel it as a percentage or pool
the raw ratings with legacy percentage responses. The raw 1–7 value is stored
without conversion, and `confidence_pct` is absent from the new records.
This per-answer rating is separate from the four-item perceived-competence scale
administered in Qualtrics after training.

`rt_ms` remains answer time only. Total block time includes the confidence steps.
The `pcp_item_response` message also includes these added fields. The existing
`pcp_block_complete` / `rct_complete` sequence is retained.

The `qualtrics-pcp-js.js` bridge copies the entire JSON string into its
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
all substantive option labels, answer locking, required slider ratings
including 1, 4 and 7 in both blocks, separate timing,
timeouts, modal focus containment, deliberate midpoint selection, keyboard
operation, reset between items, and single completion. CI runs the
browser and scoring checks on relevant PRs and main-branch pushes.

Merge this focused PR into `main`, then wait for GitHub Pages to deploy that
commit. The iframe URLs remain:

- `https://bruno20033.github.io/thesis-rct/qualtrics-pcp-posttest1.html`
- `https://bruno20033.github.io/thesis-rct/qualtrics-pcp-posttest2.html`

After deployment, use fresh pilot responses in both Qualtrics surveys. Confirm
the new answer/confidence steps, complete all 16 items, and inspect the exported
existing response field for 16 records with the appropriate format and fields
(including deliberate 1 and 7 ratings in both tests). Confirm Qualtrics Next becomes available only after completion.
Local bridge tests do not substitute for this final deployed survey check.

Rollback of the slider: revert that renderer change and redeploy;
no survey schema migration
is needed. Preserve the original exports and use `response_format` when identifying
which procedure produced each response.

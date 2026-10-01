# Sources for the 40 released PCP assessment charts

The user's thesis reproduces the 40 administered chart questions in Appendix L, but does not include their row-level data or per-chart rendering instructions. The predecessor P-Lite paper's Table 4 identifies ten **original** datasets and notes that charts were subsequently modified, including axis labels and min/max values. The BTPL paper links assessment materials. None of these is an exact per-item recipe for the 40 charts.

This table records the best recovered public table behind each locally generated candidate. The exact URLs and SHA-256 hashes are in `sources.json`. A source match alone does **not** certify the original chart's row selection, axis order/range, color scheme, or intentional design flaw. Generated images remain candidates until item-level review.

| Candidate source | Released chart IDs | Recovery status |
| --- | --- | --- |
| Auto MPG / Xmdv Car, 392 clean rows | `pcp_rem_fa_1`, `pcp_ana_sa_1`, `pcp_eval_sa_7` | Source pinned; per-item display choices still require review. |
| Fisher Iris, 150 rows | `pcp_rem_fa_2`, `pcp_rem_sa_2`, `pcp_rem_sa_8`, `pcp_eval_sa_1`, `pcp_eval_sa_5` | Source pinned. |
| Diamonds | `pcp_rem_sa_1` | Source pinned; original small sample and standardisation require review. |
| Ames Housing | `pcp_rem_sa_4` | Source pinned. |
| Historical CORGIS county demographics | `pcp_ana_fa_1`, `pcp_und_sa_1`, `pcp_und_sa_4` | Source pinned; the exact highlighted county in `pcp_und_sa_4` is not identified by the original chart. |
| Historical CORGIS state demographics | `pcp_eval_sa_2`, `pcp_eval_sa_3` | Source pinned; intentional label faults must be checked. |
| College | `pcp_ana_sa_2`, `pcp_ana_sa_5`, `pcp_ana_sa_8`, `pcp_und_sa_8` | Source pinned; filtered and highlighted records require item-level checks. |
| R mtcars | `pcp_ana_sa_3`, `pcp_ana_sa_9` | Source pinned; selection logic is asserted for `pcp_ana_sa_9`. |
| Dex nutrients | `pcp_und_fa_1`, `pcp_und_sa_2`, `pcp_ana_sa_7` | Source pinned; axis order and reversal require item-level checks. |
| Cereal | `pcp_und_sa_6` | Source pinned. |
| Xmdv US Population | `pcp_ana_sa_6` | Source pinned; complete-record subset starts in 1950. |
| Palmer Penguins | `pcp_ana_fa_2`, `pcp_eval_sa_6` | Source pinned; scatter choice encodings and colors require review. |
| Highcharts marathon demo | `pcp_und_sa_7` | Exact public demo data and chart code recovered; candidate rendering still requires visual review. |
| Xmdv Coal Disaster | `pcp_und_sa_3` | Source pinned; candidate uses the 181-record visible subset and displayed domains. |
| UCI Abalone | `pcp_eval_fa_10`, `pcp_eval_sa_4`, `pcp_eval_sa_8` | Source pinned; intentional chart faults require review. |
| Hawks | `pcp_eval_fa_11` | Source pinned; deliberately misleading legend must be preserved. |
| No released source table | `pcp_und_fa_2`, `pcp_und_sa_5`, `pcp_rem_sa_3`, `pcp_rem_sa_5`, `pcp_rem_sa_6`, `pcp_rem_sa_7` | Structural redraw only. See `SOURCE_RECOVERY.md` for the exact missing files/author confirmation. |

The eight added Create/Analyze practice charts are separate. Their cereal, Auto MPG and state-demographics sources and answer facts are listed in `out/validation.json`; they are already served at high resolution.

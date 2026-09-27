#!/usr/bin/env python3
"""Verify coverage and provenance labelling of regenerated PCP assets."""
from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
LEDGER = json.loads((HERE / "out" / "validation.json").read_text())
ORIGINALS = sorted((HERE.parent / "charts").glob("pcp_*.png"))
EXPECTED = {path.stem for path in ORIGINALS}
GENERATED = set(LEDGER["generated"])

if GENERATED != EXPECTED:
    raise SystemExit(f"coverage mismatch: missing={sorted(EXPECTED - GENERATED)}, extra={sorted(GENERATED - EXPECTED)}")

for stem in GENERATED:
    for extension in ("png", "svg"):
        path = HERE / "out" / extension / f"{stem}.{extension}"
        if not path.is_file() or path.stat().st_size < 1_000:
            raise SystemExit(f"missing or implausibly small {path}")

source_pinned = set(LEDGER["source_pinned_candidates"])
structural = set(LEDGER["structural_reconstructions"])
if source_pinned | structural != EXPECTED or source_pinned & structural:
    raise SystemExit("provenance classes do not partition the asset set")
if len(source_pinned) != 42 or len(structural) != 6:
    raise SystemExit("unexpected provenance totals")
if any(not source.get("sha256") for source in LEDGER["sources"].values()):
    raise SystemExit("an input source lacks a pinned checksum")

logic = LEDGER.get("answer_logic_audit", {})
for stem in ("pcp_ana_sa_9", "pcp_ana_sa_2", "pcp_ana_sa_8", "pcp_und_sa_3", "pcp_und_fa_2", "pcp_und_sa_5",
             "pcp_create_1", "pcp_create_2", "pcp_create_3", "pcp_create_4", "pcp_create_5",
             "pcp_analyze_7", "pcp_analyze_2", "pcp_analyze_4"):
    if stem not in logic:
        raise SystemExit(f"missing answer-logic audit for {stem}")
if logic["pcp_ana_sa_9"].get("horsepower_range") != [175, 230]:
    raise SystemExit("car-selection answer range drifted")
if logic["pcp_ana_sa_2"].get("descending_order") != ["C", "B", "A", "D"]:
    raise SystemExit("college-ranking answer order drifted")
if logic["pcp_create_1"].get("highest_sugar") != ["Golden Crisp", "Smacks"]:
    raise SystemExit("cereal sugar answer drifted")
if logic["pcp_analyze_7"].get("horsepower_range") != [90, 230]:
    raise SystemExit("8-cylinder horsepower answer range drifted")
if logic["pcp_analyze_4"].get("answer") != "California":
    raise SystemExit("state-comparison answer drifted")

print(f"PASS: {len(EXPECTED)} outputs (SVG + 300-DPI PNG); "
      f"{len(source_pinned)} source-pinned candidates, {len(structural)} structural redraws")

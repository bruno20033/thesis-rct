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

# The first visual review found three candidates with an entirely different
# dataset or axis set. SVG label comments catch that class of regression even
# when the chart is a valid, high-resolution image of some other dataset.
required_labels = {
    "pcp_rem_fa_1": ("mpg", "cylinders", "displacement", "horsepower", "weight", "acceleration", "origin", "American", "Japanese", "European"),
    "pcp_und_fa_1": ("fiber (g)", "fat (g)", "carbohydrate (g)", "monounsat (g)"),
    "pcp_ana_sa_7": ("fiber (g)", "fat (g)", "carbohydrate (g)"),
    "pcp_ana_sa_5": ("AdmissionRate", "SATAverage", "AverageFacultySalary"),
    "pcp_und_sa_7": ("Training date", "Miles for training run", "Training time", "Shoe brand", "Running pace per mile", "Short or long", "After 2004", "00:06", "00:11"),
}
for stem, labels in required_labels.items():
    svg = (HERE / "out" / "svg" / f"{stem}.svg").read_text()
    if any(f"<!-- {label} -->" not in svg for label in labels):
        raise SystemExit(f"{stem}: missing expected axis/category label")
    for forbidden in ("Sepal length", "protein (g)", "sugars (g)"):
        if f"<!-- {forbidden} -->" in svg:
            raise SystemExit(f"{stem}: unexpected {forbidden} label")

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

print(f"PASS: {len(EXPECTED)} output files (SVG + 300-DPI PNG) and provenance coverage; "
      f"{len(source_pinned)} source-pinned candidates, {len(structural)} structural redraws. "
      "This is NOT an item-level measurement-equivalence release check.")

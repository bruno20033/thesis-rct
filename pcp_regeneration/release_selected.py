#!/usr/bin/env python3
"""Install only the high-resolution charts approved in release_decisions.json."""
from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
CHARTS = HERE.parent / "charts"
DECISIONS = json.loads((HERE / "release_decisions.json").read_text())["decisions"]
assert len(DECISIONS) == 40
assert len({row["chart_id"] for row in DECISIONS}) == 40


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


replaced = []
kept = []
for row in DECISIONS:
    chart_id = row["chart_id"]
    target = CHARTS / f"{chart_id}.png"
    source = HERE / "out" / "png" / f"{chart_id}.png"
    if not target.is_file() or not source.is_file():
        raise SystemExit(f"missing chart: {chart_id}")
    if row["decision"] == "keep_original":
        kept.append(chart_id)
        continue
    if row["decision"] != "replace":
        raise SystemExit(f"unknown decision for {chart_id}")
    with Image.open(source) as image:
        if image.width < 1600 or image.height < 1000:
            raise SystemExit(f"replacement resolution too small: {chart_id}")
        dimensions = [image.width, image.height]
    before = digest(target)
    shutil.copyfile(source, target)
    after = digest(target)
    if after != digest(source):
        raise SystemExit(f"copy verification failed: {chart_id}")
    replaced.append({"chart_id": chart_id, "before_sha256": before,
                     "after_sha256": after, "dimensions": dimensions})

assert len(replaced) == 28 and len(kept) == 12
(HERE / "release_result.json").write_text(json.dumps({
    "replaced": replaced, "kept_original": kept,
    "note": "Visual selection by study owner. Original versions remain in Git history."
}, indent=2) + "\n")
print(f"installed {len(replaced)} reviewed replacements; retained {len(kept)} original charts")

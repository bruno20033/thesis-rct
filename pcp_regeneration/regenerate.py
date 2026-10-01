#!/usr/bin/env python3
"""Rebuild source-verified BTPL/PCP stimuli as SVG and high-DPI PNG.

This is intentionally conservative: only items whose data identity is known
are emitted.  See README.md for the item-level release gate.  The renderer is
plain matplotlib so every polyline, axis, label and tick is an SVG primitive.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import re
import shutil
import tarfile
import urllib.request
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import Rectangle
import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
SOURCES = json.loads((HERE / "sources.json").read_text())
DATA = HERE / "data"
OUT = HERE / "out"
COLORS = ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02"]


def fetch(name: str) -> Path:
    """Fetch an open, versioned source only once and record its SHA-256."""
    src = SOURCES[name]
    suffix = ".js" if src["url"].endswith(".js") else ".csv"
    path = DATA / src.get("filename", f"{name}{suffix}")
    DATA.mkdir(exist_ok=True)
    if not path.exists():
        print(f"download {name}: {src['url']}")
        # Highcharts serves this public static sample to browsers and rejects
        # Python's default user agent.  This is an identification header only;
        # no credentials, cookies or private data are sent.
        request = urllib.request.Request(src["url"], headers={"User-Agent": "Mozilla/5.0 (compatible; BTPL-stimulus-regeneration/1.0)"})
        with urllib.request.urlopen(request, timeout=60) as response:
            path.write_bytes(response.read())
    actual = hashlib.sha256(path.read_bytes()).hexdigest()
    if src.get("sha256") and actual != src["sha256"]:
        raise RuntimeError(f"{name}: checksum mismatch")
    src["sha256"] = actual
    return path


def load_okc(name: str) -> pd.DataFrame:
    """Read the documented Xmdv OKC archive format without changing values."""
    source = SOURCES[name]
    with tarfile.open(fetch(name), "r:gz") as archive:
        raw = archive.extractfile(source["member"])
        if raw is None:
            raise RuntimeError(f"missing {source['member']} in {name} archive")
        lines = io.TextIOWrapper(raw, encoding="utf-8").read().splitlines()
    dimensions, records = map(int, lines[0].split())
    names = lines[1:1 + dimensions]
    frame = pd.read_csv(io.StringIO("\n".join(lines[1 + dimensions + dimensions:])),
                        sep=r"\s+", names=names)
    if len(frame) != records or records != source["expected_rows"]:
        raise RuntimeError(f"{name}: expected {source['expected_rows']} records, found {len(frame)}")
    return frame


def source_frames() -> dict[str, pd.DataFrame]:
    auto = pd.read_csv(fetch("auto_mpg"))
    auto["horsepower"] = pd.to_numeric(auto["horsepower"], errors="coerce")
    auto = auto.dropna(subset=["horsepower"]).reset_index(drop=True)
    assert len(auto) == SOURCES["auto_mpg"]["expected_rows_after_cleaning"]

    cereal = pd.read_csv(fetch("cereal_full"))
    assert len(cereal) == SOURCES["cereal_full"]["expected_rows"]
    # The original D3 example supplies a simple row-position identifier rather
    # than exposing the cereal name as a PCP dimension.
    cereal.insert(0, "id", np.arange(len(cereal)))

    cereal_xmdv = load_okc("cereal_xmdv")

    college = pd.read_csv(fetch("college"))
    required = {"SATAverage", "AdmissionRate", "AverageCost", "MedianDebt"}
    missing = required - set(college.columns)
    if missing:
        raise RuntimeError(f"college source lost required fields: {sorted(missing)}")

    penguins = pd.read_csv(fetch("penguins"))
    assert len(penguins) == SOURCES["penguins"]["expected_rows"]

    iris = pd.read_csv(fetch("iris"))
    assert len(iris) == SOURCES["iris"]["expected_rows"]
    mtcars = pd.read_csv(fetch("mtcars"))
    assert len(mtcars) == SOURCES["mtcars"]["expected_rows"]
    abalone = pd.read_csv(fetch("abalone"), header=None, names=[
        "sex", "length", "diameter", "height", "whole.wt", "shucked.wt", "viscera.wt", "shell.wt", "rings"
    ])
    assert len(abalone) == SOURCES["abalone"]["expected_rows"]
    nutrients = pd.read_csv(fetch("nutrients"))
    assert len(nutrients) == SOURCES["nutrients"]["expected_rows"]
    diamonds = pd.read_csv(fetch("diamonds"))
    assert len(diamonds) == SOURCES["diamonds"]["expected_rows"]
    ames = pd.read_csv(fetch("ames_housing"))
    assert len(ames) == SOURCES["ames_housing"]["expected_rows"]
    hawks = pd.read_csv(fetch("hawks"))
    assert len(hawks) == SOURCES["hawks"]["expected_rows"]
    runners = pd.DataFrame(json.loads(fetch("highcharts_runners").read_text()), columns=[
        "training_date_ms", "miles", "training_time_ms", "shoe_brand",
        "pace_ms", "short_or_long", "after_2004",
    ])
    # Highcharts encodes time axes in milliseconds.  The original question asks
    # learners to identify the 0:06–00:11 range, so preserve it as minutes.
    runners["training_time_min"] = runners.training_time_ms / 60_000
    runners["pace_min"] = runners.pace_ms / 60_000
    coal = load_okc("coal_disaster")
    us_population = load_okc("us_population")
    county = pd.read_csv(fetch("county_demographics_2019"), encoding="latin1")
    assert len(county) == SOURCES["county_demographics_2019"]["expected_rows"]
    state = pd.read_csv(fetch("state_demographics_2019"), encoding="latin1")
    assert len(state) == SOURCES["state_demographics_2019"]["expected_rows"]
    return dict(auto=auto, cereal=cereal, cereal_xmdv=cereal_xmdv, college=college, penguins=penguins, iris=iris,
                runners=runners, coal=coal, us_population=us_population, county=county, state=state,
                mtcars=mtcars, abalone=abalone, nutrients=nutrients, diamonds=diamonds,
                ames=ames, hawks=hawks)


def numeric(frame: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    # Construct unique internal names positionally so deliberately repeated
    # axes (an Evaluate-item fault) remain drawable and auditable.
    data = pd.DataFrame({str(i): pd.to_numeric(frame.loc[:, col], errors="coerce")
                         for i, col in enumerate(columns)})
    return data.dropna()


def resolve(frame: pd.DataFrame, *candidates: str) -> str:
    """Find a column despite the harmless naming differences across CSV copies."""
    squash = {re.sub(r"[^a-z0-9]", "", str(c).lower()): c for c in frame.columns}
    for candidate in candidates:
        key = re.sub(r"[^a-z0-9]", "", candidate.lower())
        if key in squash:
            return squash[key]
    raise KeyError(f"none of {candidates!r} in {list(frame.columns)!r}")


def pcp(ax, frame: pd.DataFrame, columns: list[str], labels: list[str] | None = None,
        *, flip: set[int] = frozenset(), palette: str | None = None,
        alpha: float = 0.16, linewidth: float = 0.55, highlight=None,
        bad: str | None = None, limits: list[tuple[float, float]] | None = None,
        labels_top: bool = False, normalise_unit: bool = False,
        color_by: str | None = None, category_colors: dict | None = None,
        legend_title: str | None = None, palette_by: str | None = None,
        legend_colors: dict | None = None, colorbar_label: str | None = None,
        tick_values: list[list[float]] | None = None,
        axis_annotations: list[str] | None = None,
        tick_labels: list[list[str]] | None = None,
        selection_brush: tuple[int, float, float] | None = None,
        endpoint_labels: list[bool] | None = None,
        show_legend: bool = True) -> None:
    """Draw a publication-quality PCP with independent axis scales.

    Every value is transformed only for display.  The original data frame stays
    intact, which makes the answer-bearing ranges auditable in validation.json.
    """
    labels = labels or columns
    d = numeric(frame, columns)
    values = d.to_numpy(dtype=float)
    source_lo, source_hi = np.nanmin(values, axis=0), np.nanmax(values, axis=0)
    lo, hi = source_lo.copy(), source_hi.copy()
    if normalise_unit:
        lo, hi = np.zeros(len(columns)), np.ones(len(columns))
    elif limits is not None:
        lo = np.array([limit[0] for limit in limits], dtype=float)
        hi = np.array([limit[1] for limit in limits], dtype=float)
    source_span = np.where(source_hi > source_lo, source_hi - source_lo, 1)
    span = np.where(hi > lo, hi - lo, 1)
    scaled = (values - source_lo) / source_span if normalise_unit else (values - lo) / span
    for i in flip:
        scaled[:, i] = 1 - scaled[:, i]
    x = np.arange(len(columns))

    ax.set_xlim(-0.25, len(columns) - 0.75)
    ax.set_ylim(-0.13, 1.17)
    ax.axis("off")
    if bad == "tiny-labels":
        label_size, tick_size = 4.5, 3.5
    elif bad == "crowded-labels":
        label_size, tick_size = 7.0, 6.0
    else:
        label_size, tick_size = 8.5, 7.0

    for i, (label, low, high) in enumerate(zip(labels, lo, hi)):
        ax.plot([i, i], [0, 1], color="#556270", lw=0.8, zorder=3)
        if bad != "missing-ticks" and (endpoint_labels is None or endpoint_labels[i]):
            top_value, bottom_value = (low, high) if i in flip else (high, low)
            ax.text(i, 1.025, f"{top_value:g}", ha="center", va="bottom", fontsize=tick_size,
                    color="#455a64")
            ax.text(i, -0.025, f"{bottom_value:g}", ha="center", va="top", fontsize=tick_size,
                    color="#455a64")
        if bad == "missing-labels":
            continue
        rendered = label
        if bad == "crowded-labels":
            rendered = f"{label}\n{label}"
        ax.text(i, 1.115 if labels_top else -0.10, rendered,
                ha="center", va="bottom" if labels_top else "top", fontsize=label_size,
                rotation=0 if bad != "crowded-labels" else 67, color="#263238")
        if axis_annotations:
            ax.text(i, 1.072, axis_annotations[i], ha="center", va="bottom",
                    fontsize=tick_size, color="#263238")
        if tick_values:
            for tick_index, tick in enumerate(tick_values[i]):
                pos = (tick - low) / (high - low)
                if i in flip:
                    pos = 1 - pos
                render_endpoint = endpoint_labels is not None and not endpoint_labels[i]
                if 0 < pos < 1 or (render_endpoint and 0 <= pos <= 1):
                    ax.plot([i - .018, i], [pos, pos], color="#556270", lw=.75, zorder=3)
                    text = tick_labels[i][tick_index] if tick_labels else f"{tick:g}"
                    ax.text(i - .03, pos, text, ha="right", va="center",
                            fontsize=tick_size, color="#455a64")
    if selection_brush:
        axis, lower, upper = selection_brush
        bottom = (lower - lo[axis]) / (hi[axis] - lo[axis])
        top = (upper - lo[axis]) / (hi[axis] - lo[axis])
        if axis in flip:
            bottom, top = 1 - top, 1 - bottom
        ax.add_patch(Rectangle((axis - .045, bottom), .09, top - bottom,
                               facecolor="#bdbdbd", edgecolor="#424242", lw=.8,
                               alpha=.4, zorder=1))

    if color_by:
        categories = frame.loc[d.index, color_by].astype(str)
        keys = list(category_colors) if category_colors else list(dict.fromkeys(categories))
        color_lookup = category_colors or {key: COLORS[i % len(COLORS)] for i, key in enumerate(keys)}
        colors = [color_lookup.get(category, "#1f77b4") for category in categories]
        shown_colors = legend_colors or color_lookup
        handles = [Line2D([0], [0], color=shown_colors[key], lw=4, label=str(key)) for key in keys]
        if show_legend:
            ax.legend(handles=handles, title=legend_title or color_by, frameon=False,
                      loc="center left", bbox_to_anchor=(1.02, .5), fontsize=8, title_fontsize=9)
    elif palette:
        series = (pd.to_numeric(frame.loc[d.index, palette_by], errors="coerce").to_numpy()
                  if palette_by else values[:, -1])
        norm = plt.Normalize(series.min(), series.max())
        cmap = plt.get_cmap(palette)
        colors = cmap(norm(series))
        if colorbar_label is not None:
            # A continuous colour key is answer-bearing in evaluation items.
            # Use the same data-normalisation as the polylines rather than a
            # decorative gradient so the SVG remains an auditable rendering.
            mappable = plt.cm.ScalarMappable(norm=norm, cmap=cmap)
            mappable.set_array(series)
            colorbar = ax.figure.colorbar(mappable, ax=ax, fraction=.045, pad=.035)
            colorbar.set_label(colorbar_label, fontsize=9)
            colorbar.ax.tick_params(labelsize=8)
    else:
        colors = ["#1f77b4"] * len(values)
    if bad == "too-many-colors":
        colors = [COLORS[i % len(COLORS)] for i in range(len(values))]

    for row, color in zip(scaled, colors):
        ax.plot(x, row, color=color, alpha=alpha, lw=linewidth, solid_capstyle="round")
    if highlight is not None:
        h = numeric(highlight, columns).to_numpy(dtype=float)
        hscaled = (h - source_lo) / source_span if normalise_unit else (h - lo) / span
        for i in flip:
            hscaled[:, i] = 1 - hscaled[:, i]
        for row in hscaled:
            ax.plot(x, row, color="#0d47a1", alpha=0.9, lw=1.3, zorder=4)


def save(fig: plt.Figure, stem: str, result: dict) -> None:
    for typ, kwargs in (("svg", {}), ("png", {"dpi": 300})):
        target = OUT / typ
        target.mkdir(parents=True, exist_ok=True)
        fig.savefig(target / f"{stem}.{typ}", bbox_inches="tight", facecolor="white", **kwargs)
    plt.close(fig)
    result.append(stem)


def single(stem, frame, cols, labels=None, **kwargs):
    fig, ax = plt.subplots(figsize=(10.5, 4.7), constrained_layout=True)
    pcp(ax, frame, cols, labels, **kwargs)
    save(fig, stem, GENERATED)


def panel(stem, frame, variants, figsize=(13, 4.8), ncols=None):
    columns = ncols or len(variants)
    rows = (len(variants) + columns - 1) // columns
    fig, axes = plt.subplots(rows, columns, figsize=figsize, constrained_layout=True)
    for ax, variant in zip(np.ravel(axes), variants):
        chart = {key: value for key, value in variant.items() if key != "title"}
        pcp(ax, frame, **chart)
        ax.set_title(variant.get("title", ""), fontsize=10, fontweight="bold", loc="left")
    save(fig, stem, GENERATED)


GENERATED: list[str] = []

# These source tables were not included in the BTPL release. They are still
# rebuilt as deterministic vector drawings so no experiment position is left
# with a low-resolution crop, but the ledger makes clear they are *not*
# source-equivalent replacements.
STRUCTURAL_RECONSTRUCTIONS = {
    "pcp_rem_sa_3": "Recognition choice set; its five illustrative charts have no released source tables.",
    "pcp_rem_sa_5": "Recognition treemap; the supplied chart is a hand-authored illustration without a released table.",
    "pcp_rem_sa_6": "Recognition choice set; only the embedded iris PCP has a recoverable source table.",
    "pcp_rem_sa_7": "Recognition choice set; only the embedded penguins PCP has a recoverable source table.",
    "pcp_und_fa_2": "Malaria/poverty source table and filters are not included in the BTPL release.",
    "pcp_und_sa_5": "Hyperparameter-run source table for dropout, learning rate and val_auc is not included in the BTPL release.",
}


def build(frames: dict[str, pd.DataFrame]) -> None:
    iris = frames["iris"]
    iris_cols = [resolve(iris, "sepal_length"), resolve(iris, "sepal_width"),
                 resolve(iris, "petal_length"), resolve(iris, "petal_width")]
    iris_labels = ["Sepal length", "Sepal width", "Petal length", "Petal width"]
    # Remember FA1 is the seven-axis Auto MPG chart in the released test,
    # ending with a categorical origin axis. An earlier candidate incorrectly
    # substituted an iris chart, which changed the stimulus entirely.
    auto_mpg = frames["auto"].copy()
    auto_mpg["_origin_rank"] = auto_mpg["origin"].map({"usa": 0, "japan": 1, "europe": 2})
    single("pcp_rem_fa_1", auto_mpg,
           ["mpg", "cylinders", "displacement", "horsepower", "weight", "acceleration", "_origin_rank"],
           ["mpg", "cylinders", "displacement", "horsepower", "weight", "acceleration", "origin"],
           limits=[(5, 50), (2.5, 8.5), (29, 494), (28, 248), (1260, 5493), (6, 26), (0, 2)],
           tick_values=[[], [], [], [], [], [], [0, 1, 2]],
           tick_labels=[[], [], [], [], [], [], ["American", "Japanese", "European"]],
           endpoint_labels=[True, True, True, True, True, True, False],
           color_by="origin", category_colors={"usa": "#377eb8", "japan": "#e49445", "europe": "#50a869"},
           show_legend=False, alpha=.16, linewidth=.5)
    single("pcp_rem_sa_2", iris, iris_cols, iris_labels, palette="plasma", alpha=.24, linewidth=.7)
    single("pcp_rem_fa_2", iris,
           [resolve(iris, "sepal_width"), resolve(iris, "sepal_length"), resolve(iris, "petal_width"), resolve(iris, "petal_length")],
           ["Sepal Width", "Sepal Length", "Petal Width", "Petal Length"], labels_top=True,
           color_by=resolve(iris, "species"),
           category_colors={"setosa": "#d85c4f", "versicolor": "#7ab35e", "virginica": "#4169e1"},
           legend_title="Species", alpha=.38, linewidth=.9)
    single("pcp_rem_sa_8", iris, iris_cols,
           ["Sepal_Length", "Sepal_Width", "Petal_Length", "Petal_Width"], labels_top=True,
           palette="RdYlGn", alpha=.50, linewidth=.8)

    diamonds = frames["diamonds"]
    # The recognition chart intentionally shows a small illustrative sample,
    # not the entire 53,940-row table. Keep the original cut groups and make
    # sampling deterministic so the source-derived figure is reproducible.
    diamond_sample = diamonds[diamonds["cut"].isin(["Good", "Premium", "Ideal"])].sample(12, random_state=17).copy()
    for col in ["carat", "depth", "table", "price", "x"]:
        diamond_sample[col] = (diamond_sample[col] - diamond_sample[col].mean()) / diamond_sample[col].std(ddof=1)
    single("pcp_rem_sa_1", diamond_sample, ["carat", "depth", "table", "price", "x"],
           ["carat", "depth", "table", "price", "x"],
           color_by="cut", category_colors={"Good": "#482173", "Premium": "#21918c", "Ideal": "#fde725"},
           legend_title="cut", alpha=.55, linewidth=.8)

    ames = frames["ames"]
    fig = plt.figure(figsize=(10, 8), constrained_layout=True)
    grid = fig.add_gridspec(2, 2, width_ratios=[4, 1], height_ratios=[1, 4])
    ax_top = fig.add_subplot(grid[0, 0])
    ax_main = fig.add_subplot(grid[1, 0])
    ax_right = fig.add_subplot(grid[1, 1])
    x = pd.to_numeric(ames["GrLivArea"], errors="coerce")
    y = pd.to_numeric(ames["SalePrice"], errors="coerce") / 1000
    valid = x.notna() & y.notna()
    ax_main.scatter(x[valid], y[valid], s=13, alpha=.68, color="#76b7a6", edgecolors="none")
    ax_main.set_xlabel("GrLivArea")
    ax_main.set_ylabel("SalePrice/1000")
    ax_main.grid(alpha=.25)
    ax_top.hist(x[valid], bins=25, color="#595959", edgecolor="white")
    ax_top.axis("off")
    ax_right.hist(y[valid], bins=25, orientation="horizontal", color="#595959", edgecolor="white")
    ax_right.axis("off")
    save(fig, "pcp_rem_sa_4", GENERATED)

    auto = frames["auto"]
    auto_cols = [resolve(auto, "mpg"), resolve(auto, "cylinders"), resolve(auto, "displacement"),
                 resolve(auto, "horsepower"), resolve(auto, "weight"), resolve(auto, "acceleration"),
                 resolve(auto, "model_year")]
    auto_labels = ["MPG", "Cylinders", "Displacement", "Horsepower", "Weight", "Acceleration", "Year"]
    # The original choice grid is A/C on the first row and B/D on the second.
    # B alone puts displacement next to weight; keep all four original axis
    # subsets so the distractors test the same adjacency decision.
    panel("pcp_ana_sa_1", auto, [
        dict(columns=["cylinders", "acceleration", "mpg", "model_year"],
             labels=["Cylinders", "Acceleration", "Miles per Gallon", "Year"], title="A"),
        dict(columns=["cylinders", "weight", "horsepower", "acceleration", "mpg"],
             labels=["Cylinders", "Weight in lbs", "Horsepower", "Acceleration", "Miles per Gallon"], title="C"),
        dict(columns=["cylinders", "displacement", "weight", "model_year"],
             labels=["Cylinders", "Displacement", "Weight in lbs", "Year"], title="B"),
        dict(columns=["cylinders", "horsepower", "acceleration", "mpg"],
             labels=["Cylinders", "Horsepower", "Acceleration", "Miles per Gallon"], title="D"),
    ], figsize=(15, 8.6), ncols=2)
    # This item is the 32-row mtcars table (not the similarly named Auto MPG
    # source). The original brush includes the 400-displacement Pontiac, so
    # the selected HP range is exactly 175–230 as the source assessment key.
    cars = frames["mtcars"].copy()
    cars["_name_rank"] = np.arange(len(cars))
    car_cols = ["_name_rank", "mpg", "cyl", "disp", "hp", "wt", "qsec"]
    selected = cars[cars["disp"] >= 400]
    single("pcp_ana_sa_9", cars, car_cols,
           ["Name", "Economy", "Cylinders", "Displacement", "Horsepower", "Weight", "Acceleration"],
           limits=[(0, 31), (10, 35), (3, 8), (60, 480), (45, 340), (1.5, 5.5), (14, 23)],
           tick_values=[list(range(len(cars))), [15, 20, 25, 30], [4, 5, 6, 7], [100, 200, 300, 400], [100, 200, 300], [2, 3, 4, 5], [16, 18, 20, 22]],
           tick_labels=[[str(name) for name in cars["manufacturer"]], ["15", "20", "25", "30"], ["4", "5", "6", "7"], ["100", "200", "300", "400"], ["100", "200", "300"], ["2", "3", "4", "5"], ["16", "18", "20", "22"]],
           endpoint_labels=[False, True, True, True, True, True, True],
           selection_brush=(3, 400, 480), alpha=.04, linewidth=.4, highlight=selected)

    cereal = frames["cereal"]
    cereal_cols = [resolve(cereal, "protein"), resolve(cereal, "fat"),
                   resolve(cereal, "fiber"), resolve(cereal, "carbo"), resolve(cereal, "sugars")]
    cereal_labels = ["protein (g)", "fat (g)", "fiber (g)", "carbohydrate (g)", "sugars (g)"]
    # Understand FA1 and Analyze SA7 use the Dex nutrients source. The test
    # names fiber, fat, carbohydrate and monounsaturated fat; the old renderer
    # mistakenly used cereal protein and sugar instead.
    nutrients_for_fat = frames["nutrients"]
    fat_cols = ["fiber (g)", "fat (g)", "carbohydrate (g)", "monounsat (g)"]
    fat_limits = [(0, 80), (0, 100), (0, 100), (0, 80)]
    panel("pcp_und_fa_1", nutrients_for_fat, [
        dict(columns=fat_cols, labels=fat_cols, limits=fat_limits, title="(a)",
             palette="plasma", alpha=.09, linewidth=.35, labels_top=True),
        dict(columns=fat_cols, labels=fat_cols, limits=fat_limits, flip={2}, title="(b)",
             palette="plasma", alpha=.09, linewidth=.35, labels_top=True),
    ], figsize=(12, 4.7))
    cereal_all_cols = ["id", resolve(cereal, "calories"), resolve(cereal, "protein"), resolve(cereal, "fat"),
                       resolve(cereal, "sodium"), resolve(cereal, "fiber"), resolve(cereal, "carbo"),
                       resolve(cereal, "sugars"), resolve(cereal, "potass"), resolve(cereal, "vitamins"),
                       resolve(cereal, "shelf"), resolve(cereal, "weight"), resolve(cereal, "cups"),
                       resolve(cereal, "rating")]
    single("pcp_und_sa_6", cereal, cereal_all_cols,
           ["id", "calories", "protein", "fat", "sodium", "fiber", "carbo", "sugars", "potass",
            "vitamins", "shelf", "weight", "cups", "rating"],
           palette="viridis", alpha=.20, linewidth=.65)
    single("pcp_ana_sa_7", nutrients_for_fat, fat_cols[:3], fat_cols[:3],
           limits=fat_limits[:3], palette="plasma", alpha=.09, linewidth=.35,
           labels_top=True)

    nutrients = frames["nutrients"]
    nutrient_cols = ["calcium (g)", "water (g)", "fiber (g)", "monounsat (g)"]
    nutrient_labels = ["calcium (g)", "water (g)", "fiber (g)", "monounsat (g)"]
    panel("pcp_und_sa_2", nutrients, [
        dict(columns=nutrient_cols, labels=nutrient_labels, title="(a)", palette="viridis", alpha=.07, linewidth=.30,
             limits=[(0, 7), (0, 100), (0, 80), (0, 80)], labels_top=True),
        dict(columns=[nutrient_cols[0], nutrient_cols[2], nutrient_cols[1], nutrient_cols[3]],
             labels=[nutrient_labels[0], nutrient_labels[2], nutrient_labels[1], nutrient_labels[3]],
             title="(b)", palette="viridis", alpha=.07, linewidth=.30,
             limits=[(0, 7), (0, 80), (0, 100), (0, 80)], labels_top=True),
    ], figsize=(14, 4.8))

    # The Analyze item is a PCP-to-scatter correspondence task built from the
    # standard 32-row mtcars data. Standardising the four PCP dimensions
    # reproduces the original chart's common centred scale; the scatter
    # choices retain native units.
    mtcars = frames["mtcars"]
    standardized = mtcars.copy()
    for col in ["cyl", "disp", "hp", "drat"]:
        standardized[col] = (standardized[col] - standardized[col].mean()) / standardized[col].std(ddof=1)
    fig = plt.figure(figsize=(13, 8.2), constrained_layout=True)
    grid = fig.add_gridspec(2, 4, height_ratios=[1.7, 1])
    ax = fig.add_subplot(grid[0, :])
    pcp(ax, standardized, ["cyl", "disp", "hp", "drat"], ["cyl", "disp", "hp", "drat"],
        alpha=.50, linewidth=.8)
    for ax, (xcol, ycol, title) in zip([fig.add_subplot(grid[1, i]) for i in range(4)], [
        ("cyl", "disp", "A"), ("qsec", "wt", "B"), ("hp", "wt", "C"), ("hp", "mpg", "D"),
    ]):
        ax.scatter(mtcars[xcol], mtcars[ycol], color="#111111", s=24)
        ax.set_xlabel(xcol)
        ax.set_ylabel(ycol)
        ax.set_title(title, loc="left", fontweight="bold")
        ax.grid(alpha=.22)
    save(fig, "pcp_ana_sa_3", GENERATED)

    us_population = frames["us_population"]
    # The source contains 1900–49 records with absent measures encoded as
    # zero. The original BTPL stimulus begins where all four plotted fields
    # exist (1950), giving its printed 1950–2006 ranges exactly.
    us_population = us_population[(us_population["Total_Population_(1000)"] > 0)
                                  & (us_population["Percent_change"] > 0)
                                  & (us_population["Resident_population_(1000)"] > 0)]
    single("pcp_ana_sa_6", us_population,
           ["Year", "Total_Population_(1000)", "Percent_change", "Resident_population_(1000)"],
           ["Year", "Total Population", "Percent Change", "Resident Population"],
           palette="cool", alpha=.45, linewidth=.8,
           limits=[(1950, 2006), (150000, 299801), (.91, 1.82), (150210, 299398)], labels_top=True)

    college = frames["college"]
    ccols = [resolve(college, "SATAverage"), resolve(college, "AdmissionRate"),
             resolve(college, "AverageCost"), resolve(college, "MedianDebt")]
    clabels = ["SATAverage", "AdmissionRate", "AverageCost", "MedianDebt"]
    # Analyze SA5 displays AdmissionRate, SATAverage and faculty salary in
    # that order. The first candidate wrongly added AverageCost and MedianDebt.
    single("pcp_ana_sa_5", college,
           [ccols[1], ccols[0], resolve(college, "AverageFacultySalary")],
           ["AdmissionRate", "SATAverage", "AverageFacultySalary"],
           limits=[(.1, 1), (800, 1500), (5000, 17000)],
           labels_top=True, alpha=.08, linewidth=.45)
    # The four mini-plots use the Alabama cohort in the original stimulus and
    # compare one dark-blue university against the same faint background.
    # Keeping common axes makes the requested AverageCost ranking meaningful.
    college_alabama = college.head(14).copy()
    rank_cols = [resolve(college, "ACTMedian"), ccols[0], ccols[2],
                 resolve(college, "AverageFacultySalary"), ccols[3]]
    rank_labels = ["ACTMedian", "SATAverage", "AverageCost", "AverageFacultySalary", "MedianDebt"]
    rank_limits = [(17, 27), (800, 1200), (16_000, 46_000), (5_000, 10_000), (5_000, 22_500)]
    fig, axes = plt.subplots(2, 2, figsize=(15, 8.8), constrained_layout=True)
    for ax, title, row in zip(axes.ravel(), ["A", "B", "C", "D"], [2, 4, 7, 0]):
        pcp(ax, college_alabama, rank_cols, rank_labels, limits=rank_limits,
            labels_top=True, highlight=college_alabama.loc[[row]], alpha=.07, linewidth=.35)
        ax.set_title(title, fontsize=12, fontweight="bold", loc="left")
    save(fig, "pcp_ana_sa_2", GENERATED)
    high_income = resolve(college, "MedianFamilyIncome")
    filtered = college[pd.to_numeric(college[high_income], errors="coerce") >= 100000]
    selected_cols = [ccols[2], resolve(college, "AverageFacultySalary"), ccols[3], high_income]
    single("pcp_ana_sa_8", filtered, selected_cols,
           ["AverageCost", "AverageFacultySalary", "MedianDebt", "MedianFamilyIncome"],
           limits=[(0, 60_000), (0, 20_000), (0, 40_000), (20_000, 120_000)],
           selection_brush=(3, 100_000, 120_000), labels_top=True, alpha=.18, linewidth=.65)
    faculty = resolve(college, "AverageFacultySalary")
    alabama = college.head(14).copy()
    alabama["_name_rank"] = np.arange(len(alabama))
    single("pcp_und_sa_8", alabama, ["_name_rank", ccols[2], faculty, ccols[3]],
           ["Name", "AverageCost", "AverageFacultySalary", "MedianDebt"],
           limits=[(0, 13), (15_000, 46_000), (5_000, 10_000), (5_000, 22_500)],
           tick_values=[list(range(14)), [20_000, 30_000, 40_000], [6_000, 7_000, 8_000, 9_000], [6_000, 10_000, 14_000, 18_000, 22_000]],
           tick_labels=[[str(name) for name in alabama["Name"]], ["20,000", "30,000", "40,000"], ["6,000", "7,000", "8,000", "9,000"], ["6,000", "10,000", "14,000", "18,000", "22,000"]],
           endpoint_labels=[False, True, True, True], labels_top=True, alpha=.56, linewidth=1.0)

    penguins = frames["penguins"]
    pcols = [resolve(penguins, "bill_length_mm"), resolve(penguins, "bill_depth_mm"),
             resolve(penguins, "flipper_length_mm")]
    pstd = penguins.copy()
    for col in pcols:
        pstd[col] = (pd.to_numeric(pstd[col], errors="coerce") - pd.to_numeric(pstd[col], errors="coerce").mean()) / pd.to_numeric(pstd[col], errors="coerce").std(ddof=1)
    fig = plt.figure(figsize=(14, 8), constrained_layout=True)
    grid = fig.add_gridspec(2, 4, height_ratios=[1.6, 1])
    top = fig.add_subplot(grid[0, :])
    pcp(top, pstd, pcols, ["bill_length_mm", "bill_depth_mm", "flipper_length_mm"],
        color_by=resolve(penguins, "species"), category_colors={"Adelie": "#5b356e", "Chinstrap": "#4caaae", "Gentoo": "#edcc40"},
        legend_title="species", alpha=.30, linewidth=.6)
    mass = resolve(penguins, "body_mass_g")
    species = resolve(penguins, "species")
    scatter_specs = [(mass, pcols[1], "A"), (pcols[0], pcols[1], "B"), (mass, pcols[1], "C"), (mass, pcols[2], "D")]
    species_colours = {"Adelie": "#e97875", "Chinstrap": "#51b45d", "Gentoo": "#4f7fe7"}
    for ax, (xcol, ycol, title) in zip([fig.add_subplot(grid[1, i]) for i in range(4)], scatter_specs):
        for name, group in penguins.dropna(subset=[xcol, ycol, species]).groupby(species):
            size_col = pcols[2] if title in ("A", "B", "C") else mass
            sizes = pd.to_numeric(group[size_col], errors="coerce")
            source_sizes = pd.to_numeric(penguins[size_col], errors="coerce")
            sizes = 12 + 90 * (sizes - source_sizes.min()) / max(source_sizes.max() - source_sizes.min(), 1)
            ax.scatter(group[xcol], group[ycol], s=sizes, color=species_colours[str(name)], alpha=.72, edgecolors="none")
        ax.set_xlabel(xcol); ax.set_ylabel(ycol); ax.set_title(title, loc="left", fontweight="bold"); ax.grid(alpha=.18)
    save(fig, "pcp_ana_fa_2", GENERATED)

    runners = frames["runners"]
    # Highcharts' original has seven axes, including Training date. The first
    # redraw omitted that axis and lost the categorical/time tick labels.
    date = pd.to_datetime(runners["training_date_ms"], unit="ms", utc=True)
    runners["training_year"] = date.dt.year + (date.dt.dayofyear - 1) / 365.25
    rcols = ["training_year", "miles", "training_time_min", "shoe_brand", "pace_min", "short_or_long", "after_2004"]
    single("pcp_und_sa_7", runners, rcols,
           ["Training date", "Miles for training run", "Training time", "Shoe brand",
            "Running pace per mile", "Short or long", "After 2004"],
           limits=[(2001, 2008), (0, 30), (0, 300), (0, 6), (6, 11), (0, 1), (0, 1)],
           tick_values=[list(range(2001, 2009)), [0, 6, 12, 18, 24, 30], [0, 60, 120, 180, 240, 300],
                        list(range(7)), [6, 7, 8, 9, 10, 11], [0, 1], [0, 1]],
           tick_labels=[[str(year) for year in range(2001, 2009)], [str(x) for x in [0, 6, 12, 18, 24, 30]],
                        [f"0{x}:00" for x in range(6)],
                        ["Other", "Adidas", "Mizuno", "Asics", "Brooks", "New Balance", "Izumi"],
                        [f"00:{x:02d}" for x in range(6, 12)], ["> 5 miles", "< 5 miles"], ["Before", "After"]],
           endpoint_labels=[False] * 7, labels_top=True,
           alpha=.12, linewidth=.55)

    # The visible chart excludes the eight records beyond its two displayed
    # upper bounds (Interval > 826 or Deaths > 344). The remaining source
    # subset has exactly the visible maxima. The lower labels are the original
    # chart's padded display scales (raw minima are Month=1, Year=1851,
    # DayOfYear=1 and Deaths=10), not altered observations.
    coal_visible = frames["coal"].query("Interval <= 826 and Deaths <= 344")
    assert len(coal_visible) == 181
    single("pcp_und_sa_3", coal_visible,
           ["Month", "Year", "DayOfYear", "Interval", "Deaths"],
           ["Month", "Year", "Day of Year", "Interval", "Deaths"],
           limits=[(0, 13), (1850, 1962), (0, 365), (0, 826), (9, 344)],
           palette="viridis", alpha=.20, linewidth=.60, labels_top=True)

    county = frames["county"]
    county_cols = ["Income.Median Houseold Income", "Income.Per Capita Income",
                   "Income.Persons Below Poverty Level", "Population.Population per Square Mile"]
    county_labels = ["Income.Median Household Income", "Income.Per Capita",
                     "Income.Persons Below Poverty Level", "Population per Square Mile"]
    county_limits = [(20_000, 120_000), (10_000, 60_000), (0, 55), (0, 70_000)]
    panel("pcp_und_sa_1", county, [
        dict(columns=county_cols, labels=county_labels, limits=county_limits, labels_top=True, title="(a)", alpha=.035, linewidth=.32),
        dict(columns=county_cols, labels=county_labels, limits=county_limits, labels_top=True, flip={1}, title="(b)", alpha=.035, linewidth=.32),
    ], figsize=(14, 4.8))
    # The original image does not name the dark-blue selected county.  Select
    # a record matching its displayed location (about $50k household, $25k per
    # capita, 13% poverty, very low density) but keep the item as a candidate
    # until the exact selection key is recovered.
    chosen = county.assign(_distance=(county[county_cols[0]] - 50_000).abs() / 30_000
                                  + (county[county_cols[1]] - 25_000).abs() / 10_000
                                  + (county[county_cols[2]] - 13).abs() / 15
                                  + county[county_cols[3]].clip(upper=10_000) / 10_000)
    highlight = chosen.nsmallest(1, "_distance")
    single("pcp_und_sa_4", county, county_cols, county_labels, limits=county_limits,
           labels_top=True, alpha=.03, linewidth=.3, highlight=highlight)

    # Source-verified Analyze item: the question is whether Homeownership Rate
    # and Households are adjacent.  Only panel D makes them neighbours.
    ana_cols = {
        "age": "Age.Percent Under 18 Years",
        "degree": "Education.Bachelor's Degree or Higher",
        "value": "Housing.Median Value of Owner-Occupied Units",
        "income": "Income.Per Capita Income",
        "own": "Housing.Homeownership Rate",
        "homes": "Housing.Households",
    }
    ana_labels = {
        "age": "Age % under 18", "degree": "Bachelor's degree or higher",
        "value": "Median value of owner-occupied units", "income": "Income per capita",
        "own": "Homeownership rate", "homes": "Households",
    }
    ana_limits = {"age": (0, 40), "degree": (0, 70), "value": (0, 800_000),
                  "income": (10_000, 60_000), "own": (0, 90), "homes": (0, 3_000_000)}
    def ana_variant(order, title):
        return dict(columns=[ana_cols[key] for key in order], labels=[ana_labels[key] for key in order],
                    limits=[ana_limits[key] for key in order], labels_top=True, title=title,
                    alpha=.035, linewidth=.32)
    panel("pcp_ana_fa_1", county, [
        ana_variant(["age", "degree", "value", "income"], "A"),
        ana_variant(["degree", "value", "own", "income"], "B"),
        ana_variant(["own", "value", "income", "homes"], "C"),
        ana_variant(["degree", "own", "homes", "value"], "D"),
    ], figsize=(15, 12), ncols=1)

    # Evaluate items deliberately contain design faults.  Preserve the faults:
    # tiny labels (SA3) and cluttered/unreadable labels (SA2), while keeping
    # the original state-demographic data beneath them.
    state = frames["state"]
    eval2_cols = ["Age.Percent 65 and Older", "Age.Percent Under 18 Years", "Age.Percent Under 5 Years",
                  "Education.High School or Higher", "Housing.Households", "Housing.Units in Multi-Unit Structures",
                  "Income.Per Capita Income"]
    eval2_labels = ["Percent 65 and older", "Percent under 18 years", "Percent under 5 years",
                    "High school or higher", "Households", "Units", "Income per capita"]
    single("pcp_eval_sa_2", state, eval2_cols, eval2_labels, bad="crowded-labels", alpha=.30, linewidth=.85)
    eval3_cols = ["Education.Bachelor's Degree or Higher", "Education.High School or Higher",
                  "Housing.Households", "Housing.Units in Multi-Unit Structures", "Income.Per Capita Income"]
    eval3_labels = ["Bachelor's degree or higher", "High school or higher", "Households", "Units", "Income per capita"]
    single("pcp_eval_sa_3", state, eval3_cols, eval3_labels, bad="tiny-labels", alpha=.30, linewidth=.85)
    single("pcp_eval_sa_1", iris,
           [resolve(iris, "petal_length"), resolve(iris, "sepal_width"), resolve(iris, "sepal_width"), resolve(iris, "sepal_length")],
           ["petal_length", "sepal_width", "sepal_width", "sepal_length"],
           color_by=resolve(iris, "species"),
           category_colors={"setosa": "#e74c3c", "versicolor": "#4f7fb8", "virginica": "#5ca65c"},
           legend_title="Species", alpha=.28, linewidth=.9)

    # Additional Evaluate charts whose data sources are recoverable from their
    # displayed fields. The chart defects are intentionally retained.
    single("pcp_eval_sa_5", iris,
           [resolve(iris, "sepal_width"), resolve(iris, "petal_length"), resolve(iris, "petal_width")],
           ["Sepal.Width", "Petal.Length", "Petal.Width"], normalise_unit=True, labels_top=True,
           color_by=resolve(iris, "species"),
           category_colors={"setosa": "#e74c3c", "versicolor": "#4f7fb8", "virginica": "#5ca65c"},
           legend_title="Species", alpha=.48, linewidth=.65)

    penguins_eval = frames["penguins"]
    single("pcp_eval_sa_6", penguins_eval,
           [resolve(penguins_eval, "bill_length_mm"), resolve(penguins_eval, "bill_depth_mm"),
            resolve(penguins_eval, "flipper_length_mm")],
           ["bill_length_mm", "bill_depth_mm", "flipper_length_mm"], labels_top=True,
           color_by=resolve(penguins_eval, "species"),
           category_colors={"Gentoo": "#fff8c7", "Chinstrap": "#5aaec1", "Adelie": "#13245b"},
           legend_title="species", limits=[(40, 60), (10, 22), (170, 230)], alpha=.38, linewidth=.55)

    # The original includes 3- and 5-cylinder cars, so it is the Auto MPG
    # table rather than mtcars (which has only 4, 6 and 8 cylinders).
    single("pcp_eval_sa_7", auto,
           ["mpg", "acceleration", "horsepower", "horsepower", "acceleration"],
           ["economy (mpg)", "0-60 mph (s)", "power (hp)", "power(hp)", "0-60 mph(s)"], labels_top=True,
           color_by="cylinders", category_colors={"3": "#d62728", "4": "#3d68a5", "5": "#5a9e42", "6": "#6b3a8d", "8": "#ef8336"},
           legend_title="Cylinders", limits=[(0, 230)] * 5, flip={3}, alpha=.58, linewidth=.75)

    abalone = frames["abalone"]
    single("pcp_eval_sa_4", abalone, ["length", "diameter", "whole.wt"],
           ["length", "diameter", "whole.wt"], normalise_unit=True, labels_top=True,
           palette="viridis", palette_by="height", alpha=.30, linewidth=.35)
    single("pcp_eval_fa_10", abalone, ["diameter", "height", "whole.wt"],
           ["diameter", "height", "whole.wt"], normalise_unit=True, labels_top=True,
           palette="viridis", palette_by="rings", colorbar_label="rings", alpha=.28, linewidth=.35)
    hawks = frames["hawks"]
    single("pcp_eval_fa_11", hawks, ["Culmen", "Hallux", "Tail"],
           ["Culmen", "Hallux", "Tail"], normalise_unit=True, labels_top=True,
           color_by="Species", category_colors={"CH": "#ee7b55", "RT": "#6e7fad", "SS": "#72b39d"},
           # The legend deliberately lies: this visual defect is the question.
           legend_colors={"CH": "#8fb6cf", "RT": "#305d9b", "SS": "#a6d47a"},
           legend_title="Species", alpha=.28, linewidth=.45)
    single("pcp_eval_sa_8", abalone,
           ["length", "diameter", "height", "whole.wt", "shucked.wt", "viscera.wt", "shell.wt", "rings"],
           ["length", "diameter", "height", "whole.wt", "shucked.wt", "viscera.wt", "shell.wt", "rings"],
           normalise_unit=True, labels_top=True, color_by="sex",
           category_colors={"F": "#08086d", "I": "#ba3b70", "M": "#f3f55a"},
           legend_title="Sex", alpha=.28, linewidth=.35)

    # ── High-resolution structural redraws for unreleased source tables ──
    # Each redraw preserves the chart family, layout, labels, intentional
    # comparison/fault and answer-bearing extrema. Their distinct ledger status
    # prohibits treating them as data-equivalent replacements.
    rng = np.random.default_rng(2022)

    malaria = pd.DataFrame({
        "Fever or Malaria cases (%)": np.clip(rng.normal(.37, .17, 42), 0, .64),
        "Malaria cases (%)": np.clip(rng.beta(1.4, 3.6, 42) * .9, 0, .78),
        "Poverty Rate": np.clip(rng.normal(.42, .18, 42), 0, .96),
        "group": np.repeat(["high", "middle", "low"], [12, 20, 10]),
    })
    panel("pcp_und_fa_2", malaria, [
        dict(columns=["Fever or Malaria cases (%)", "Malaria cases (%)", "Poverty Rate"],
             labels=["Fever or Malaria cases (%)", "Malaria cases (%)", "Poverty Rate"], title="(a)",
             color_by="group", category_colors={"high": "#f05b5b", "middle": "#8b8b8b", "low": "#5064e8"},
             limits=[(0, .65), (0, .8), (0, .9)],
             tick_values=[[.1, .2, .3, .4, .5, .6], [.2, .4, .6], [.2, .4, .6, .8],
             ], axis_annotations=["2006", "2013", "2006"], alpha=.58, linewidth=.85, labels_top=True),
        dict(columns=["Fever or Malaria cases (%)", "Poverty Rate", "Malaria cases (%)"],
             labels=["Fever or Malaria cases (%)", "Poverty Rate", "Malaria cases (%)"], title="(b)",
             color_by="group", category_colors={"high": "#f05b5b", "middle": "#8b8b8b", "low": "#5064e8"},
             limits=[(0, .65), (0, .9), (0, .8)],
             tick_values=[[.1, .2, .3, .4, .5, .6], [.2, .4, .6, .8], [.2, .4, .6],
             ], axis_annotations=["2006", "2006", "2013"], alpha=.58, linewidth=.85, labels_top=True),
    ], figsize=(13, 5.1))

    sweep = pd.DataFrame({
        "/dropout": rng.choice([0, .1, .2, .3, .4, .5], 34),
        "/learning_rate[0]": rng.choice([1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 4e-4, 6e-4, 8e-4, 1e-3], 34),
    })
    # Fixed extrema retain the exact response-bearing range shown in the test.
    sweep["val_auc"] = np.clip(-.789 + .096 * rng.random(len(sweep)), -.7887, -.692164)
    sweep.loc[0, "val_auc"], sweep.loc[1, "val_auc"] = -.7887, -.692164
    single("pcp_und_sa_5", sweep, ["/dropout", "/learning_rate[0]", "val_auc"],
           ["/dropout", "/learning_rate[0]", "val_auc"], labels_top=True,
           limits=[(0, .5), (1e-5, .001), (-.7887, -.692164)],
           tick_values=[[.1, .2, .3, .4], [.0002, .0004, .0006, .0008], [-.78, -.76, -.74, -.72, -.70]],
           palette="YlOrRd", palette_by="val_auc", colorbar_label="val_auc", alpha=.62, linewidth=.8)

    def choice_title(ax, label):
        ax.set_title(f"({label})", loc="left", fontsize=12, color="#555", pad=8)

    # Remember SA3: exactly one PCP (C) among five chart types.
    fig, axes = plt.subplots(1, 5, figsize=(17, 4.4), constrained_layout=True)
    x = rng.normal(1.2, 1, 1200); y = rng.normal(1.2, 1, 1200)
    axes[0].hexbin(x, y, gridsize=23, cmap="Spectral_r"); axes[0].set_xlabel("x"); axes[0].set_ylabel("y"); choice_title(axes[0], "A")
    counts = np.array([[32, 24, 16], [14, 3, 17], [6, 4, 15], [8, 2, 2]])
    axes[1].bar(np.arange(4), counts[:, 0], color="#e5766b"); axes[1].bar(np.arange(4), counts[:, 1], bottom=counts[:, 0], color="#58b947"); axes[1].bar(np.arange(4), counts[:, 2], bottom=counts[:, :2].sum(axis=1), color="#6488df"); choice_title(axes[1], "B")
    mini = pd.DataFrame(rng.normal(size=(30, 5)), columns=["Points", "Field goal", "3-point", "Rebounds", "Assists"])
    pcp(axes[2], mini, mini.columns.tolist(), mini.columns.tolist(), alpha=.22, linewidth=.55, labels_top=True); choice_title(axes[2], "C")
    axes[3].plot(np.arange(1, 11), rng.normal(size=10).cumsum(), color="#7db6a6", lw=2, ls="--"); axes[3].grid(alpha=.2); choice_title(axes[3], "D")
    layers = rng.dirichlet(np.ones(5), 8).T; axes[4].stackplot(np.arange(1, 9), layers, colors=["#db8fd0", "#ad8edb", "#77b7df", "#99c47c", "#e5c875"]); axes[4].set_ylim(0, 1); choice_title(axes[4], "E")
    save(fig, "pcp_rem_sa_3", GENERATED)

    # Remember SA5 is deliberately a treemap rather than a PCP.
    fig, ax = plt.subplots(figsize=(8.5, 6.2), constrained_layout=True)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis("off"); ax.set_title("value", fontsize=15)
    blocks = [(0, .42, .55, .58, "#9e992b", "group-1"), (.55, .35, .26, .65, "#80a746", "group-1"), (.81, 0, .19, 1, "#bf6b96", "group-2"), (0, 0, .70, .42, "#49a2b8", "group-3"), (.70, 0, .11, .35, "#4aa49d", "group-3"), (.81, 0, .19, .37, "#b26fba", "group-2")]
    for x0, y0, w, h, color, label in blocks:
        ax.add_patch(Rectangle((x0, y0), w, h, facecolor=color, edgecolor="#111", lw=1.2)); ax.text(x0+w/2, y0+h/2, label, ha="center", va="center", color="white", fontsize=12, weight="bold")
    save(fig, "pcp_rem_sa_5", GENERATED)

    # Remember SA6: five chart families with the iris PCP as choice C.
    fig, axes = plt.subplots(1, 5, figsize=(17, 4.4), constrained_layout=True)
    xx = np.linspace(0, 8, 250)
    for mu, col, name in [(2, "#4caf50", "Helen"), (4, "#87aef9", "Patricia"), (6, "#ff9e99", "Ashley")]: axes[0].plot(xx, np.exp(-.5*((xx-mu)/.75)**2), color=col, label=name)
    axes[0].legend(frameon=False, fontsize=7); choice_title(axes[0], "A")
    axes[1].stackplot(np.arange(1, 8), rng.uniform(25, 75, (6, 7)), colors=["#e95ac8", "#9476e7", "#18aeda", "#1db5a0", "#13a43c", "#d0b400"]); choice_title(axes[1], "B")
    pcp(axes[2], iris, iris_cols, iris_labels, color_by=resolve(iris, "species"), category_colors={"setosa": "#e74c3c", "versicolor": "#4f7fb8", "virginica": "#5ca65c"}, alpha=.22, linewidth=.5, labels_top=True); choice_title(axes[2], "C")
    for idx, col in enumerate(["#f0dc6c", "#73b369", "#8171a8"]): axes[3].fill_between(xx, 0, np.exp(-.5*((xx-(1.8+idx))/1.0)**2)/(idx+2), color=col, alpha=.55)
    choice_title(axes[3], "D")
    axes[4].scatter(mtcars["wt"], mtcars["mpg"], s=25+mtcars["hp"]*.25, c=mtcars["hp"], cmap="Blues", alpha=.75); axes[4].set_xlabel("wt"); axes[4].set_ylabel("mpg"); choice_title(axes[4], "E")
    save(fig, "pcp_rem_sa_6", GENERATED)

    # Remember SA7: the penguins PCP is the sole PCP choice (B).
    fig, axes = plt.subplots(1, 5, figsize=(17, 4.4), constrained_layout=True)
    axes[0].hist(ames["SalePrice"].dropna() / 1000, bins=22, color="#78b8ab"); axes[0].set_xlabel("price"); choice_title(axes[0], "A")
    pcp(axes[1], penguins_eval, [resolve(penguins_eval, "bill_length_mm"), resolve(penguins_eval, "bill_depth_mm"), resolve(penguins_eval, "flipper_length_mm")], ["bill_length_mm", "bill_depth_mm", "flipper_length_mm"], color_by=resolve(penguins_eval, "species"), category_colors={"Adelie": "#4c4f94", "Chinstrap": "#b081b7", "Gentoo": "#e1d640"}, alpha=.20, linewidth=.4, labels_top=True); choice_title(axes[1], "B")
    axes[2].pie([36, 29, 14, 9, 12], labels=["Gr-C", "Gr-B", "Gr-A", "Gr-D", "Gr-E"], colors=["#899fca", "#ff895c", "#68c2a3", "#dd87bd", "#a9d94d"]); choice_title(axes[2], "C")
    for x0, y0, w, h, c in [(0, .5, .65, .5, "#d91e05"), (0, 0, .65, .5, "#35a03b"), (.65, 0, .35, 1, "#287fac")]: axes[3].add_patch(Rectangle((x0,y0),w,h,facecolor=c,edgecolor="white"))
    axes[3].set_xlim(0,1); axes[3].set_ylim(0,1); axes[3].axis("off"); choice_title(axes[3], "D")
    axes[4].scatter(rng.gamma(2, 4000, 100), rng.normal(70, 12, 100), s=rng.uniform(4, 250, 100), color="#666", alpha=.6); axes[4].set_xlabel("gdpPercap"); axes[4].set_ylabel("lifeExp"); choice_title(axes[4], "E")
    save(fig, "pcp_rem_sa_7", GENERATED)

    # ── Source-authored training extension (Create + Analyze) ─────────
    # The five cereal prompts and three PCP-reading prompts expand aided
    # training to 16 items while preserving both 16-item unaided outcome
    # blocks. Each static chart is a transparent rendering of the released
    # task's source table and question fact; it is not a new assessment stem.
    cereal_training = frames["cereal"].copy()

    def cereal_candidates(names):
        selected = cereal_training.set_index("name").loc[names].reset_index().copy()
        selected["_name_rank"] = np.arange(len(selected))
        return selected

    sugars = cereal_candidates(["Golden Crisp", "Smacks", "Apple Jacks", "Post Nat. Raisin Bran",
                                "Cocoa Puffs", "Count Chocula", "Trix", "Lucky Charms"])
    single("pcp_create_1", sugars, ["_name_rank", "sugars"],
           ["Cereal", "Sugars (g)"], limits=[(0, len(sugars) - 1), (0, 16)],
           tick_values=[list(range(len(sugars))), [5, 10, 15]],
           tick_labels=[list(sugars["name"]), ["5", "10", "15"]],
           endpoint_labels=[False, True], labels_top=True, alpha=.70, linewidth=1.15)

    fiber = cereal_candidates(["All-Bran with Extra Fiber", "100% Bran", "All-Bran", "Post Nat. Raisin Bran"])
    single("pcp_create_2", fiber, ["_name_rank", "fiber"],
           ["Cereal", "Fiber (g)"], limits=[(0, len(fiber) - 1), (0, 15)],
           tick_values=[list(range(len(fiber))), [5, 10]],
           tick_labels=[list(fiber["name"]), ["5", "10"]],
           endpoint_labels=[False, True], labels_top=True, alpha=.78, linewidth=1.35)

    vitamins = cereal_training.copy()
    mfr_order = ["A", "G", "K", "N", "P", "Q", "R"]
    vitamins["_mfr_rank"] = vitamins["mfr"].map({code: idx for idx, code in enumerate(mfr_order)})
    single("pcp_create_3", vitamins, ["_mfr_rank", "vitamins"],
           ["Manufacturer (mfr)", "Vitamins"], limits=[(0, len(mfr_order) - 1), (0, 100)],
           tick_values=[list(range(len(mfr_order))), [25, 50, 75]],
           tick_labels=[mfr_order, ["25", "50", "75"]],
           endpoint_labels=[False, True], labels_top=True, alpha=.22, linewidth=.70)

    rating = cereal_candidates(["Cap'n'Crunch", "Cinnamon Toast Crunch", "Honey Graham Ohs", "Count Chocula", "Cocoa Puffs"])
    single("pcp_create_4", rating, ["_name_rank", "rating"],
           ["Cereal", "Rating"], limits=[(0, len(rating) - 1), (15, 30)],
           tick_values=[list(range(len(rating))), [20, 25]],
           tick_labels=[list(rating["name"]), ["20", "25"]],
           endpoint_labels=[False, True], labels_top=True, alpha=.78, linewidth=1.35)

    sodium_sugars = cereal_candidates(["Golden Grahams", "Grape-Nuts", "100% Bran", "Corn Flakes"])
    single("pcp_create_5", sodium_sugars, ["_name_rank", "sodium", "sugars"],
           ["Cereal", "Sodium", "Sugars (g)"], limits=[(0, len(sodium_sugars) - 1), (0, 300), (0, 15)],
           tick_values=[list(range(len(sodium_sugars))), [100, 200, 250], [5, 10]],
           tick_labels=[list(sodium_sugars["name"]), ["100", "200", "250"], ["5", "10"]],
           endpoint_labels=[False, True, True], labels_top=True, alpha=.78, linewidth=1.35)

    cylinders = auto[pd.to_numeric(auto["cylinders"], errors="coerce") == 8]
    single("pcp_analyze_7", auto, ["cylinders", "horsepower", "weight"],
           ["Cylinders", "Horsepower", "Weight"], limits=[(3, 8), (0, 250), (1500, 5500)],
           tick_values=[[4, 6, 8], [50, 90, 100, 150, 200, 230], [2000, 3000, 4000, 5000]],
           selection_brush=(0, 7.85, 8), highlight=cylinders,
           labels_top=True, alpha=.045, linewidth=.36)

    bad_axes = state.dropna(subset=["Education.Bachelor's Degree or Higher",
                                    "Education.High School or Higher", "Housing.Households"]).iloc[1:28]
    single("pcp_analyze_2", bad_axes,
           ["Education.Bachelor's Degree or Higher", "Education.High School or Higher", "Housing.Households"],
           ["Bachelor's degree or higher", "High school or higher", "Households"],
           flip={1}, labels_top=True, alpha=.28, linewidth=.78)

    state_choices = state.set_index("State").loc[["California", "Delaware", "Indiana", "Alaska"]].reset_index().copy()
    state_choices["_state_rank"] = np.arange(len(state_choices))
    single("pcp_analyze_4", state_choices,
           ["_state_rank", "Education.High School or Higher", "Housing.Households"],
           ["State", "High school or higher", "Households"],
           limits=[(0, len(state_choices) - 1), (80, 95), (0, 14_000_000)],
           tick_values=[list(range(len(state_choices))), [82, 86, 90], [0, 2_000_000, 6_000_000, 10_000_000, 14_000_000]],
           tick_labels=[list(state_choices["State"]), ["82", "86", "90"], ["0", "2m", "6m", "10m", "14m"]],
           endpoint_labels=[False, True, False], labels_top=True, alpha=.82, linewidth=1.55)


def answer_logic_audit(frames: dict[str, pd.DataFrame]) -> dict[str, dict]:
    """Assert recovered answer-bearing transformations from the pinned tables.

    These assertions verify only facts that can be computed from a documented
    source or directly recovered display domain.  They do not turn a candidate
    into a release-approved stimulus; the release gate still requires visual
    review against the original assessment image.
    """
    cars = frames["mtcars"]
    selected_cars = cars[cars["disp"] >= 400]
    expected_cars = {"Cadillac Fleetwood", "Lincoln Continental", "Chrysler Imperial", "Pontiac Firebird"}
    assert set(selected_cars["manufacturer"]) == expected_cars
    assert selected_cars["hp"].min() == 175 and selected_cars["hp"].max() == 230

    college = frames["college"]
    selections = {
        "A": "University of Alabama in Huntsville",
        "B": "The University of Alabama",
        "C": "Birmingham Southern College",
        "D": "Alabama A & M University",
    }
    highlighted_costs = {
        label: int(college.loc[college["Name"] == name, "AverageCost"].iloc[0])
        for label, name in selections.items()
    }
    assert highlighted_costs["C"] > highlighted_costs["B"] > highlighted_costs["A"] > highlighted_costs["D"]

    high_income = college[pd.to_numeric(college["MedianFamilyIncome"], errors="coerce") >= 100000]
    assert high_income["MedianFamilyIncome"].min() >= 100000
    assert int(high_income["AverageCost"].min()) == 21748
    assert int(high_income["AverageCost"].max()) == 59320

    coal_visible = frames["coal"].query("Interval <= 826 and Deaths <= 344")
    assert len(coal_visible) == 181 and coal_visible["Deaths"].max() == 344

    cereal = frames["cereal"]
    assert int(cereal["calories"].min()) == 50 and int(cereal["calories"].max()) == 160
    assert set(cereal.nlargest(2, "sugars")["name"]) == {"Golden Crisp", "Smacks"}
    assert cereal.loc[cereal["fiber"].idxmax(), "name"] == "All-Bran with Extra Fiber"
    assert set(cereal.loc[cereal["vitamins"] == cereal["vitamins"].max(), "mfr"]) == {"G", "K"}
    assert set(cereal.loc[cereal["rating"] < 20, "name"]) == {"Cap'n'Crunch", "Cinnamon Toast Crunch"}
    assert cereal[(cereal["sodium"] > 250) & (cereal["sugars"] > 5)]["name"].tolist() == ["Golden Grahams"]
    auto = frames["auto"]
    assert auto[["displacement", "weight"]].corr().iloc[0, 1] > .8
    eight_cylinder = auto[auto["cylinders"] == 8]
    assert int(eight_cylinder["horsepower"].min()) == 90 and int(eight_cylinder["horsepower"].max()) == 230
    state = frames["state"]
    state_options = state.set_index("State").loc[["California", "Delaware", "Indiana", "Alaska"]]
    assert state_options["Education.High School or Higher"].idxmin() == "California"
    assert state_options["Housing.Households"].idxmax() == "California"

    return {
        "pcp_ana_sa_9": {
            "status": "asserted_from_pinned_table",
            "selection": "displacement >= 400",
            "selected_models": sorted(expected_cars),
            "horsepower_range": [int(selected_cars["hp"].min()), int(selected_cars["hp"].max())],
        },
        "pcp_ana_sa_2": {
            "status": "asserted_from_pinned_table",
            "highlighted_records": selections,
            "average_costs": highlighted_costs,
            "descending_order": ["C", "B", "A", "D"],
        },
        "pcp_ana_sa_8": {
            "status": "asserted_from_pinned_table",
            "filter": "MedianFamilyIncome >= 100000",
            "average_cost_range": [int(high_income["AverageCost"].min()), int(high_income["AverageCost"].max())],
        },
        "pcp_und_sa_3": {
            "status": "asserted_from_pinned_table_and_visible_domain",
            "filter": "Interval <= 826 and Deaths <= 344",
            "records": int(len(coal_visible)),
            "deaths_display_domain": [9, 344],
        },
        "pcp_und_fa_2": {
            "status": "display_structure_only",
            "panel_a_order": ["Fever or Malaria cases (%)", "Malaria cases (%)", "Poverty Rate"],
            "panel_b_order": ["Fever or Malaria cases (%)", "Poverty Rate", "Malaria cases (%)"],
        },
        "pcp_und_sa_5": {
            "status": "display_structure_only",
            "val_auc_display_domain": [-0.7887, -0.692164],
        },
        "pcp_create_1": {"status": "source_authored_prompt_asserted_from_pinned_table", "highest_sugar": ["Golden Crisp", "Smacks"]},
        "pcp_create_2": {"status": "source_authored_prompt_asserted_from_pinned_table", "highest_fiber": "All-Bran with Extra Fiber"},
        "pcp_create_3": {"status": "source_authored_prompt_asserted_from_pinned_table", "highest_vitamin_manufacturers": ["G", "K"]},
        "pcp_create_4": {"status": "source_authored_prompt_asserted_from_pinned_table", "rating_below_20": ["Cap'n'Crunch", "Cinnamon Toast Crunch"]},
        "pcp_create_5": {"status": "source_authored_prompt_asserted_from_pinned_table", "sodium_gt_250_and_sugars_gt_5": "Golden Grahams"},
        "pcp_analyze_7": {"status": "source_authored_prompt_asserted_from_pinned_table", "selected_cylinders": 8, "horsepower_range": [90, 230]},
        "pcp_analyze_2": {"status": "source_authored_prompt_recreated_display_structure", "mixed_axis_directions": [False, True, False]},
        "pcp_analyze_4": {"status": "source_authored_prompt_asserted_from_pinned_table", "answer": "California"},
    }


def main() -> None:
    frames = source_frames()
    build(frames)
    ledger = {
        "generated": GENERATED,
        # A source pin proves that the renderer starts from a reproducible
        # public table; it does not by itself prove the original's selection,
        # axis transformation or measurement equivalence.
        "source_pinned_candidates": [stem for stem in GENERATED if stem not in STRUCTURAL_RECONSTRUCTIONS],
        "structural_reconstructions": {stem: STRUCTURAL_RECONSTRUCTIONS[stem] for stem in GENERATED if stem in STRUCTURAL_RECONSTRUCTIONS},
        "not_generated": sorted(p.stem for p in (HERE.parent / "charts").glob("pcp_*.png") if p.stem not in GENERATED),
        "sources": SOURCES,
        "answer_logic_audit": answer_logic_audit(frames),
        "release_gate": "Generated files are candidates only; no replacement is authorised until item-level answer-equivalence review passes. Structural reconstructions also require the original source table or author confirmation before release."
    }
    OUT.mkdir(exist_ok=True)
    (OUT / "validation.json").write_text(json.dumps(ledger, indent=2) + "\n")
    (HERE / "sources.json").write_text(json.dumps(SOURCES, indent=2) + "\n")
    print(f"generated {len(GENERATED)} candidate assets ({len(ledger['source_pinned_candidates'])} source-pinned; {len(ledger['structural_reconstructions'])} structural redraws)")
    print(f"unresolved {len(ledger['not_generated'])} assets; see validation.json")


if __name__ == "__main__":
    main()

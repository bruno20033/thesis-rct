#!/usr/bin/env python3
"""Authoritative PCP build: crop chart-only images + emit pcp_items_data.js & pcp_scoring.js.
Source of truth = upstream survey PDFs (vis-graphics/PCP-Literacy-Test), OCR-verified."""
import os, sys, json
sys.path.insert(0, "/tmp/pcp-extract")
from crop import process

EXTRACT = "/tmp/pcp-extract"
REPO = "/Users/brunokneffel/Library/Mobile Documents/com~apple~CloudDocs/gymnasium steglitz/B.SC Frankfurt School/Oxford/Python/GitHub/Thesis"
CHARTS = os.path.join(REPO, "charts")

# Each item: id, bloom, block, set, src=(module_folder, img_index),
#   q=question text, opts=[option texts in instrument order], ans=correct letter (A,B,..),
#   conf=HIGH/MED/LOW. Letters are auto-assigned A,B,C,... in opts order.
L = "ABCDEFGH"
def item(id, bloom, block, set, src, q, opts, ans, conf):
    return dict(id=id, bloom=bloom, block=block, set=set, src=src, q=q, opts=opts, ans=ans, conf=conf)

YN = ["Yes", "No", "Not sure"]
ITEMS = [
  # ============ PRACTICE (8) — set 1 then set 2, one per Bloom level ============
  item("pcp_rem_fa_1","remember","practice",1,("Remember-FA",0),
       "Is this an example of a parallel coordinates plot?", YN, "A","HIGH"),
  item("pcp_und_fa_1","understand","practice",1,("Understand-FA",0),
       "What would you say is the difference between the following two charts (a) and (b)?",
       ["They both look the same","The carbohydrate(g) axis is flipped","The fat(g) axis is flipped"],"B","HIGH"),
  item("pcp_ana_fa_1","analyze","practice",1,("Analyze-FA",0),
       'Which of the following charts is the best at answering the question examining the relationship of "Home ownership rate" and the "number of households" in this dataset?',
       ["A","B","C","D"],"D","HIGH"),
  item("pcp_eval_fa_10","evaluate","practice",1,("Evaluate-FA",9),
       "What is wrong with this chart?",
       ["The color legend is not properly labeled","The axis titles are missing","There is no data on the chart","There is nothing wrong with this chart"],"A","HIGH"),
  item("pcp_rem_fa_2","remember","practice",2,("Remember-FA",1),
       "Is this an example of a parallel coordinates plot?", YN, "A","HIGH"),
  item("pcp_und_fa_2","understand","practice",2,("Understand-FA",1),
       "What would you say is the difference between the following two charts (a) and (b)?",
       ["They both look the same","The Malaria cases (%) and the Poverty Rate axes have been reordered","The Fever or Malaria cases (%) and Poverty Rate axes have been reordered"],"B","HIGH"),
  item("pcp_ana_fa_2","analyze","practice",2,("Analyze-FA",1),
       "Which of the scatterplot images is encoded in the following parallel coordinates plot?",
       ["A","B","C","D"],"B","HIGH"),
  item("pcp_eval_fa_11","evaluate","practice",2,("Evaluate-FA",10),
       "Name one problem with this chart.",
       ["The color legend has the wrong colors","The axis titles are missing","The slopes of the edges is too high","There is nothing wrong with this chart"],"A","HIGH"),

  # ====== SA TEST ITEMS — module Q1-Q4 (SOURCE order; final wave = WAVE override below) ======
  # Remember
  item("pcp_rem_sa_1","remember","posttest1",1,("Remember-SA",0),
       "Is this an example of a parallel coordinates plot?", YN, "A","HIGH"),
  item("pcp_rem_sa_2","remember","posttest1",1,("Remember-SA",1),
       "Is this an example of a parallel coordinates plot?", YN, "A","HIGH"),
  item("pcp_rem_sa_3","remember","posttest1",1,("Remember-SA",2),
       "Which of the following is an example of a parallel coordinates chart?",
       ["A","B","C","D","E","None of the above"],"C","HIGH"),
  item("pcp_rem_sa_4","remember","posttest1",1,("Remember-SA",3),
       "Is this an example of a parallel coordinates plot?", YN, "B","HIGH"),
  # Understand
  item("pcp_und_sa_1","understand","posttest1",1,("Understand-SA",0),
       "What would you say is the difference between the following two charts (a) and (b)?",
       ["They both look the same","The Income.Per.Capita Axis is flipped","The Population.Population Per Square Mile Axis is flipped"],"B","HIGH"),
  item("pcp_und_sa_2","understand","posttest1",1,("Understand-SA",1),
       "What would you say is the difference between the following two charts (a) and (b)?",
       ["They both look the same","The water(g) and the fiber(g) axes have been reordered","The calcium(g) and the monounsat(g) axes have been reordered"],"B","HIGH"),
  item("pcp_und_sa_3","understand","posttest1",1,("Understand-SA",2),
       'What are the minimum and maximum values of the "Deaths" attribute in the dataset shown using a parallel coordinates chart below?',
       ["0 and 13","0 and 365","0 and 826","9 and 344","1850 and 1962"],"D","HIGH"),
  item("pcp_und_sa_4","understand","posttest1",1,("Understand-SA",3),
       "For this region/county in the United States, what is the range of values for the Income.Per Capita for the data element selected (highlighted in dark blue)?",
       ["Between 10,000 to 20,000","Between 20,000 to 30,000","Between 30,000 to 40,000","Between 40,000 to 50,000","Between 50,000 to 60,000"],"B","HIGH"),
  # Analyze — module Q1,Q2,Q3,Q9 (Q9 replaces the open-ended original Q4)
  item("pcp_ana_sa_1","analyze","posttest1",1,("Analyze-SA",0),
       'Which of the following charts is the best to answer a question examining the relationship between "Displacement" and "Weight in Lbs" when exploring data about cars?',
       ["A","B","C","D"],"B","HIGH"),
  item("pcp_ana_sa_2","analyze","posttest1",1,("Analyze-SA",1),
       'Sort the following parallel coordinates charts in descending order based on the "AverageCost" to attend the university.',
       ["C>D>A>B","C>B>A>D","B>D>A>C","D>A>C>B"],"B","MED"),
  item("pcp_ana_sa_3","analyze","posttest1",1,("Analyze-SA",2),
       "Which of the following scatterplot images is encoded in the following parallel coordinates plot?",
       ["A","B","C","D"],"A","HIGH"),
  item("pcp_ana_sa_9","analyze","posttest1",1,("Analyze-SA",8),
       "In this parallel coordinates plot of a cars dataset, the user has selected only the cars that have displacement above 400. Based on reading this chart, what would you say is the range for the HP (Horsepower) of these cars?",
       ["(150, 250)","(150, 300)","(175, 230)","(200, 250)"],"C","MED"),
  # Evaluate
  item("pcp_eval_sa_1","evaluate","posttest1",1,("Evaluate-SA",0),
       "What is wrong with the following parallel coordinates chart?",
       ["The chart contains repeated axes","The chart uses too many colors","The chart does not contain a color legend","There is nothing wrong with the chart"],"A","HIGH"),
  item("pcp_eval_sa_2","evaluate","posttest1",1,("Evaluate-SA",1),
       "What is wrong with the following parallel coordinates plot?",
       ["The axis labels are too cluttered and illegible/unreadable","The chart does not use color","The axis labels are too small","The axis labels are the wrong color","The chart is missing the minimum and maximum values on the axes"],"A","HIGH"),
  item("pcp_eval_sa_3","evaluate","posttest1",1,("Evaluate-SA",2),
       "What is wrong with the following parallel coordinates plot?",
       ["The axis labels are too small","The chart does not use color","The data labels on each axis are too small","There is nothing wrong with this chart"],"A","LOW"),
  item("pcp_eval_sa_4","evaluate","posttest1",1,("Evaluate-SA",3),
       "Name one thing wrong with this chart.",
       ["There is too much data/clutter on this chart","The legend is incorrect","There are too many variables on this chart","There is nothing wrong with this chart"],"A","MED"),

  # ====== SA TEST ITEMS — module Q5-Q8 (SOURCE order; final wave = WAVE override below) ======
  # Remember
  item("pcp_rem_sa_5","remember","posttest2",1,("Remember-SA",4),
       "Is this an example of a parallel coordinates plot?", YN, "B","HIGH"),
  item("pcp_rem_sa_6","remember","posttest2",1,("Remember-SA",5),
       "Which of the following is an example of a parallel coordinates chart?",
       ["A","B","C","D","E","None of the above"],"C","HIGH"),
  item("pcp_rem_sa_7","remember","posttest2",1,("Remember-SA",7),
       "Which of the following is an example of a parallel coordinates chart?",
       ["A","B","C","D","E","None of the above"],"B","HIGH"),
  item("pcp_rem_sa_8","remember","posttest2",1,("Remember-SA",8),
       "Is this an example of a parallel coordinates plot?", YN, "A","HIGH"),
  # Understand
  item("pcp_und_sa_5","understand","posttest2",1,("Understand-SA",4),
       'What are the minimum and maximum values of the "val_auc" attribute in the dataset shown using a parallel coordinates chart below?',
       ["0.00001, 0.001","-0.7887, -0.69216","0, 0.5"],"B","HIGH"),
  item("pcp_und_sa_6","understand","posttest2",1,("Understand-SA",5),
       'What are the minimum and maximum values of the "protein" attribute in the dataset shown using a parallel coordinates chart below?',
       ["1.0 and 6.0","50 and 160","0 and 5.0","0 and 350"],"A","HIGH"),
  item("pcp_und_sa_7","understand","posttest2",1,("Understand-SA",6),
       "For the following parallel coordinates plot, which axis ranges from 0:06 - 00:11?",
       ["Training time","Miles for training run","Running pace per mile","Shoe brand"],"C","HIGH"),
  item("pcp_und_sa_8","understand","posttest2",1,("Understand-SA",7),
       "Which university has the lowest average faculty salary and one of the highest median debt for students attending that university?",
       ["Marion Military Institute","Judson College","Huntingdon College","University of West Alabama"],"B","HIGH"),
  # Analyze — module Q5,Q6,Q7,Q8
  item("pcp_ana_sa_5","analyze","posttest2",1,("Analyze-SA",4),
       "In the parallel coordinates plot below, what is the correlation between the SATAverage score and the AdmissionRate?",
       ["They are positively correlated","They are negatively correlated","Not sure"],"B","HIGH"),
  item("pcp_ana_sa_6","analyze","posttest2",1,("Analyze-SA",5),
       "In this parallel coordinates plot, what is the correlation between Year and TotalPopulation?",
       ["They are positively correlated","They are negatively correlated","Not sure"],"A","HIGH"),
  item("pcp_ana_sa_7","analyze","posttest2",1,("Analyze-SA",6),
       "In the parallel coordinates plot below, what is the correlation between the fat(g) and the carbohydrate (g)?",
       ["They are positively correlated","They are negatively correlated","Not sure"],"B","MED"),
  item("pcp_ana_sa_8","analyze","posttest2",1,("Analyze-SA",7),
       "We get the following chart on using filtering to remove rows with Median Family Income less than 100,000. What can we say about the Average Cost of the colleges that the students from those households go to?",
       ["Students from high Median Family Income families go to colleges that have a high Average Cost","Students from high Median Family Income families go to colleges that have a low Average Cost","Students from high Median Family Income families have a high Median Debt (greater than 30,000)"],"A","HIGH"),
  # Evaluate
  item("pcp_eval_sa_5","evaluate","posttest2",1,("Evaluate-SA",4),
       "What is wrong with this chart?",
       ["The color legend is wrong","There is too much data on the chart","The slope of the edges is too high","There is nothing wrong with this chart"],"D","MED"),
  item("pcp_eval_sa_6","evaluate","posttest2",1,("Evaluate-SA",5),
       "Find the problem with the following chart.",
       ["The axis labels for one of the axes is not in order","There is too much data on this chart","This chart has too many colors","There is nothing wrong with the chart"],"A","HIGH"),
  item("pcp_eval_sa_7","evaluate","posttest2",1,("Evaluate-SA",6),
       "What is wrong with the following parallel coordinates plot?",
       ["The chart contains repeated axes","The chart uses too many colors","The chart does not contain a color legend","There is nothing wrong with the chart above"],"A","HIGH"),
  item("pcp_eval_sa_8","evaluate","posttest2",1,("Evaluate-SA",7),
       "Name one problem with this chart.",
       ["It has too many axes","There is no color legend","There are too many colors","There is no problem with this chart"],"A","HIGH"),
]

# ── Rebalance post-test waves for parallel-form equivalence ──────────
# The item() calls above tag blocks by SOURCE order (module SA Q1-4 → posttest1,
# Q5-8 → posttest2). That left the two waves unmatched in task-type — e.g. all
# three Analyze correlation items fell in the delayed wave, and both Understand
# compare-charts items in the immediate wave. This override re-tags 10 items so
# each wave has a comparable task mix per Bloom level, and so the immediate
# (primary, RQ1) wave carries almost only HIGH-confidence keys (only eval_sa_4 MED).
#   Immediate (posttest1): rem_sa_1,2,3,4 | und_sa_1,3,4,7 | ana_sa_1,5,6,8 | eval_sa_1,2,4,6
#   Delayed   (posttest2): rem_sa_5,6,7,8 | und_sa_2,5,6,8 | ana_sa_2,3,7,9 | eval_sa_3,5,7,8
WAVE = {
  'pcp_und_sa_2': 'posttest2', 'pcp_und_sa_7': 'posttest1',
  'pcp_ana_sa_2': 'posttest2', 'pcp_ana_sa_3': 'posttest2', 'pcp_ana_sa_9': 'posttest2',
  'pcp_ana_sa_5': 'posttest1', 'pcp_ana_sa_6': 'posttest1', 'pcp_ana_sa_8': 'posttest1',
  'pcp_eval_sa_3': 'posttest2', 'pcp_eval_sa_6': 'posttest1',
}
for _it in ITEMS:
    if _it['id'] in WAVE:
        _it['block'] = WAVE[_it['id']]

# ---- sanity checks ----
assert len(ITEMS) == 40, f"expected 40 items, got {len(ITEMS)}"
ids = [it["id"] for it in ITEMS]
assert len(set(ids)) == 40, "duplicate ids"
from collections import Counter
print("blocks:", dict(Counter(it["block"] for it in ITEMS)))
print("bloom :", dict(Counter(it["bloom"] for it in ITEMS)))

# ---- crop charts ----
os.makedirs(CHARTS, exist_ok=True)
for it in ITEMS:
    folder, idx = it["src"]
    srcimg = os.path.join(EXTRACT, folder, f"img-{idx:03d}.png")
    assert os.path.exists(srcimg), f"missing source {srcimg}"
    out = os.path.join(CHARTS, it["id"] + ".png")
    process(srcimg, out)
print(f"cropped {len(ITEMS)} charts -> {CHARTS}")

# ---- emit pcp_items_data.js ----
def js_items():
    rows = []
    for it in ITEMS:
        opts = []
        for i, t in enumerate(it["opts"]):
            opts.append({"label": L[i], "text": t})
        rows.append({
            "id": it["id"], "bloom": it["bloom"], "block": it["block"], "set": it["set"],
            "chartType": "Parallel Coordinates", "chartId": it["id"],
            "questionText": it["q"], "questionFormat": "mc",
            "options": opts, "hasOmit": False,
        })
    body = ",\n  ".join(json.dumps(r, ensure_ascii=False) for r in rows)
    return ("// PCP Literacy Test items — auto-generated by build_pcp.py from the upstream\n"
            "// BTPL survey PDFs (vis-graphics/PCP-Literacy-Test), OCR-verified. Do not hand-edit;\n"
            "// edit build_pcp.py and regenerate. 40 items: 8 practice, 16 posttest1, 16 posttest2.\n"
            "const PCP_ITEMS = [\n  " + body + "\n];\n"
            "if (typeof module !== 'undefined') { module.exports = PCP_ITEMS; }\n")

# ---- emit pcp_scoring.js ----
def js_scoring():
    key = {it["id"]: it["ans"] for it in ITEMS}
    conf = {it["id"]: it["conf"] for it in ITEMS}
    keyjson = ",\n  ".join(f'"{k}": "{v}"' for k, v in key.items())
    confjson = ",\n  ".join(f'"{k}": "{v}"' for k, v in conf.items())
    return ("// PCP scoring key — auto-generated by build_pcp.py. Letter = correct option (A,B,...).\n"
            "// CONF flags derivation confidence; MED/LOW items (ana_sa_2, ana_sa_7, eval_sa_3,\n"
            "// eval_sa_4) are best confirmed with the BTPL authors before launch.\n"
            "const PCP_KEY = {\n  " + keyjson + "\n};\n\n"
            "const PCP_CONF = {\n  " + confjson + "\n};\n\n"
            "function pcpScore(id, label) { return PCP_KEY[id] !== undefined && label === PCP_KEY[id] ? 1 : 0; }\n"
            "if (typeof module !== 'undefined') { module.exports = { PCP_KEY, PCP_CONF, pcpScore }; }\n")

open(os.path.join(REPO, "pcp_items_data.js"), "w").write(js_items())
open(os.path.join(REPO, "pcp_scoring.js"), "w").write(js_scoring())
print("wrote pcp_items_data.js and pcp_scoring.js")
print("MED/LOW (verify w/ authors):", [it["id"] for it in ITEMS if it["conf"] in ("MED","LOW")])

// PCP Literacy Test — GERMAN OVERLAY (de) for pcp_items_data.js
// =============================================================================
// Adds German display strings to the 40 PCP items WITHOUT touching the
// auto-generated pcp_items_data.js (which warns "do not hand-edit"). Load this
// file AFTER pcp_items_data.js; it walks PCP_ITEMS and assigns:
//   item.questionText_de         (German question stem)
//   item.options[i].text_de      (German option text, matched by option label)
// The renderers (embed-pcp.html loc(); the post-test pages) read these *_de
// fields when LANG === 'DE' and fall back to English otherwise.
//
// CONVENTIONS (per the "keep charts as-is" decision):
//   • Dataset / axis / variable names and proper nouns are kept VERBATIM in
//     English (e.g. 'Income.Per.Capita', 'carbohydrate(g)', 'val_auc',
//     'AverageCost', university names) so the German option text still matches
//     the English labels printed on the chart images.
//   • Numeric values / ranges / letter labels (A, B, …) and ordering tokens
//     (e.g. C>D>A>B) are kept as shown on the chart; only the surrounding prose
//     and word connectives ("and"→"und", "Between"→"Zwischen") are translated.
//   • Scoring is by option LABEL/position (offline against PCP_KEY), so this
//     display-only overlay never affects correctness.
//
// Keyed by item id; options keyed by label. Options whose text is identical in
// both languages (single letters A–E) are simply omitted and fall back to EN.
// Keep this in sync if the English item bank changes.
// =============================================================================

var PCP_ITEMS_DE = {
  // ── Practice (aided training) ───────────────────────────────────────────
  "pcp_rem_fa_1": { q: "Ist dies ein Beispiel für ein Parallelkoordinaten-Diagramm?",
    o: { A: "Ja", B: "Nein", C: "Ich weiß es nicht" } },
  "pcp_und_fa_1": { q: "Was würden Sie sagen, ist der Unterschied zwischen den folgenden beiden Diagrammen (a) und (b)?",
    o: { A: "Beide sehen gleich aus", B: "Die Achse 'carbohydrate(g)' ist umgekehrt", C: "Die Achse 'fat(g)' ist umgekehrt", D: "Ich weiß es nicht" } },
  "pcp_ana_fa_1": { q: "Welches der folgenden Diagramme eignet sich am besten, um die Beziehung zwischen 'Home ownership rate' und der 'number of households' in diesem Datensatz zu untersuchen?",
    o: { E: "Ich weiß es nicht" } },
  "pcp_eval_fa_10": { q: "Was stimmt mit diesem Diagramm nicht?",
    o: { A: "Die Farblegende ist nicht richtig beschriftet", B: "Die Achsentitel fehlen", C: "Es sind keine Daten im Diagramm vorhanden", D: "An diesem Diagramm ist nichts auszusetzen", E: "Ich weiß es nicht" } },
  "pcp_rem_fa_2": { q: "Ist dies ein Beispiel für ein Parallelkoordinaten-Diagramm?",
    o: { A: "Ja", B: "Nein", C: "Ich weiß es nicht" } },
  "pcp_und_fa_2": { q: "Was würden Sie sagen, ist der Unterschied zwischen den folgenden beiden Diagrammen (a) und (b)?",
    o: { A: "Beide sehen gleich aus", B: "Die Achsen 'Malaria cases (%)' und 'Poverty Rate' wurden vertauscht", C: "Die Achsen 'Fever or Malaria cases (%)' und 'Poverty Rate' wurden vertauscht", D: "Ich weiß es nicht" } },
  "pcp_ana_fa_2": { q: "Welches der Streudiagramm-Bilder ist im folgenden Parallelkoordinaten-Diagramm kodiert?",
    o: { E: "Ich weiß es nicht" } },
  "pcp_eval_fa_11": { q: "Nennen Sie ein Problem mit diesem Diagramm.",
    o: { A: "Die Farblegende hat die falschen Farben", B: "Die Achsentitel fehlen", C: "Die Steigung der Kanten ist zu hoch", D: "An diesem Diagramm ist nichts auszusetzen", E: "Ich weiß es nicht" } },

  // ── Post-test 1 (immediate) and Post-test 2 (delayed) ───────────────────
  "pcp_rem_sa_1": { q: "Ist dies ein Beispiel für ein Parallelkoordinaten-Diagramm?",
    o: { A: "Ja", B: "Nein", C: "Ich weiß es nicht" } },
  "pcp_rem_sa_2": { q: "Ist dies ein Beispiel für ein Parallelkoordinaten-Diagramm?",
    o: { A: "Ja", B: "Nein", C: "Ich weiß es nicht" } },
  "pcp_rem_sa_3": { q: "Welches der folgenden ist ein Beispiel für ein Parallelkoordinaten-Diagramm?",
    o: { F: "Keine der genannten", G: "Ich weiß es nicht" } },
  "pcp_rem_sa_4": { q: "Ist dies ein Beispiel für ein Parallelkoordinaten-Diagramm?",
    o: { A: "Ja", B: "Nein", C: "Ich weiß es nicht" } },
  "pcp_und_sa_1": { q: "Was würden Sie sagen, ist der Unterschied zwischen den folgenden beiden Diagrammen (a) und (b)?",
    o: { A: "Beide sehen gleich aus", B: "Die Achse 'Income.Per.Capita' ist umgekehrt", C: "Die Achse 'Population.Population Per Square Mile' ist umgekehrt", D: "Ich weiß es nicht" } },
  "pcp_und_sa_2": { q: "Was würden Sie sagen, ist der Unterschied zwischen den folgenden beiden Diagrammen (a) und (b)?",
    o: { A: "Beide sehen gleich aus", B: "Die Achsen 'water(g)' und 'fiber(g)' wurden vertauscht", C: "Die Achsen 'calcium(g)' und 'monounsat(g)' wurden vertauscht", D: "Ich weiß es nicht" } },
  "pcp_und_sa_3": { q: "Was sind die Minimal- und Maximalwerte des Attributs 'Deaths' in dem unten als Parallelkoordinaten-Diagramm dargestellten Datensatz?",
    o: { A: "0 und 13", B: "0 und 365", C: "0 und 826", D: "9 und 344", E: "1850 und 1962", F: "Ich weiß es nicht" } },
  "pcp_und_sa_4": { q: "Wie groß ist für diese Region/dieses County in den Vereinigten Staaten der Wertebereich von 'Income.Per Capita' für das ausgewählte Datenelement (dunkelblau hervorgehoben)?",
    o: { A: "Zwischen 10,000 und 20,000", B: "Zwischen 20,000 und 30,000", C: "Zwischen 30,000 und 40,000", D: "Zwischen 40,000 und 50,000", E: "Zwischen 50,000 und 60,000", F: "Ich weiß es nicht" } },
  "pcp_ana_sa_1": { q: "Welches der folgenden Diagramme eignet sich am besten, um eine Frage zur Beziehung zwischen 'Displacement' und 'Weight in Lbs' bei der Untersuchung von Daten über Autos zu beantworten?",
    o: { E: "Ich weiß es nicht" } },
  "pcp_ana_sa_2": { q: "Sortieren Sie die folgenden Parallelkoordinaten-Diagramme in absteigender Reihenfolge nach 'AverageCost' (Kosten des Universitätsbesuchs).",
    o: { E: "Ich weiß es nicht" } },
  "pcp_ana_sa_3": { q: "Welches der folgenden Streudiagramm-Bilder ist im folgenden Parallelkoordinaten-Diagramm kodiert?",
    o: { E: "Ich weiß es nicht" } },
  "pcp_ana_sa_9": { q: "In diesem Parallelkoordinaten-Diagramm eines Autodatensatzes hat der Nutzer nur die Autos ausgewählt, die einen 'displacement' über 400 haben. Was ist – basierend auf diesem Diagramm – der Wertebereich der 'HP (Horsepower)' dieser Autos?",
    o: { E: "Ich weiß es nicht" } },
  "pcp_eval_sa_1": { q: "Was stimmt mit dem folgenden Parallelkoordinaten-Diagramm nicht?",
    o: { A: "Das Diagramm enthält wiederholte Achsen", B: "Das Diagramm verwendet zu viele Farben", C: "Das Diagramm enthält keine Farblegende", D: "Am Diagramm ist nichts auszusetzen", E: "Ich weiß es nicht" } },
  "pcp_eval_sa_2": { q: "Was stimmt mit dem folgenden Parallelkoordinaten-Diagramm nicht?",
    o: { A: "Die Achsenbeschriftungen sind zu überladen und unleserlich", B: "Das Diagramm verwendet keine Farbe", C: "Die Achsenbeschriftungen sind zu klein", D: "Die Achsenbeschriftungen haben die falsche Farbe", E: "Auf den Achsen fehlen die Minimal- und Maximalwerte", F: "Ich weiß es nicht" } },
  "pcp_eval_sa_3": { q: "Was stimmt mit dem folgenden Parallelkoordinaten-Diagramm nicht?",
    o: { A: "Die Achsenbeschriftungen sind zu klein", B: "Das Diagramm verwendet keine Farbe", C: "Die Datenbeschriftungen an jeder Achse sind zu klein", D: "An diesem Diagramm ist nichts auszusetzen", E: "Ich weiß es nicht" } },
  "pcp_eval_sa_4": { q: "Nennen Sie einen Fehler an diesem Diagramm.",
    o: { A: "Auf diesem Diagramm sind zu viele Daten/zu viel Überladung", B: "Die Legende ist falsch", C: "Auf diesem Diagramm gibt es zu viele Variablen", D: "An diesem Diagramm ist nichts auszusetzen", E: "Ich weiß es nicht" } },
  "pcp_rem_sa_5": { q: "Ist dies ein Beispiel für ein Parallelkoordinaten-Diagramm?",
    o: { A: "Ja", B: "Nein", C: "Ich weiß es nicht" } },
  "pcp_rem_sa_6": { q: "Welches der folgenden ist ein Beispiel für ein Parallelkoordinaten-Diagramm?",
    o: { F: "Keine der genannten", G: "Ich weiß es nicht" } },
  "pcp_rem_sa_7": { q: "Welches der folgenden ist ein Beispiel für ein Parallelkoordinaten-Diagramm?",
    o: { F: "Keine der genannten", G: "Ich weiß es nicht" } },
  "pcp_rem_sa_8": { q: "Ist dies ein Beispiel für ein Parallelkoordinaten-Diagramm?",
    o: { A: "Ja", B: "Nein", C: "Ich weiß es nicht" } },
  "pcp_und_sa_5": { q: "Was sind die Minimal- und Maximalwerte des Attributs 'val_auc' in dem unten als Parallelkoordinaten-Diagramm dargestellten Datensatz?",
    o: { D: "Ich weiß es nicht" } },
  "pcp_und_sa_6": { q: "Was sind die Minimal- und Maximalwerte des Attributs 'protein' in dem unten als Parallelkoordinaten-Diagramm dargestellten Datensatz?",
    o: { A: "1.0 und 6.0", B: "50 und 160", C: "0 und 5.0", D: "0 und 350", E: "Ich weiß es nicht" } },
  "pcp_und_sa_7": { q: "Welche Achse reicht im folgenden Parallelkoordinaten-Diagramm von 0:06 bis 00:11?",
    o: { A: "Trainingszeit", B: "Meilen pro Trainingslauf", C: "Lauftempo pro Meile", D: "Schuhmarke", E: "Ich weiß es nicht" } },
  "pcp_und_sa_8": { q: "Welche Universität hat das niedrigste 'average faculty salary' und einen der höchsten 'median debt' für die dort Studierenden?",
    o: { E: "Ich weiß es nicht" } },
  "pcp_ana_sa_5": { q: "Wie ist im folgenden Parallelkoordinaten-Diagramm die Korrelation zwischen dem 'SATAverage'-Score und der 'AdmissionRate'?",
    o: { A: "Sie sind positiv korreliert", B: "Sie sind negativ korreliert", C: "Ich weiß es nicht" } },
  "pcp_ana_sa_6": { q: "Wie ist in diesem Parallelkoordinaten-Diagramm die Korrelation zwischen 'Year' und 'TotalPopulation'?",
    o: { A: "Sie sind positiv korreliert", B: "Sie sind negativ korreliert", C: "Ich weiß es nicht" } },
  "pcp_ana_sa_7": { q: "Wie ist im folgenden Parallelkoordinaten-Diagramm die Korrelation zwischen 'fat(g)' und 'carbohydrate (g)'?",
    o: { A: "Sie sind positiv korreliert", B: "Sie sind negativ korreliert", C: "Ich weiß es nicht" } },
  "pcp_ana_sa_8": { q: "Wir erhalten das folgende Diagramm, nachdem wir mit einem Filter die Zeilen mit einem 'Median Family Income' unter 100,000 entfernt haben. Was können wir über die 'Average Cost' der Colleges sagen, die die Studierenden aus diesen Haushalten besuchen?",
    o: { A: "Studierende aus Familien mit hohem 'Median Family Income' besuchen Colleges mit hoher 'Average Cost'", B: "Studierende aus Familien mit hohem 'Median Family Income' besuchen Colleges mit niedriger 'Average Cost'", C: "Studierende aus Familien mit hohem 'Median Family Income' haben einen hohen 'Median Debt' (über 30,000)", D: "Ich weiß es nicht" } },
  "pcp_eval_sa_5": { q: "Was stimmt mit diesem Diagramm nicht?",
    o: { A: "Die Farblegende ist falsch", B: "Auf dem Diagramm sind zu viele Daten", C: "Die Steigung der Kanten ist zu hoch", D: "An diesem Diagramm ist nichts auszusetzen", E: "Ich weiß es nicht" } },
  "pcp_eval_sa_6": { q: "Finden Sie das Problem im folgenden Diagramm.",
    o: { A: "Die Achsenbeschriftungen einer der Achsen sind nicht in der richtigen Reihenfolge", B: "Auf diesem Diagramm sind zu viele Daten", C: "Dieses Diagramm hat zu viele Farben", D: "Am Diagramm ist nichts auszusetzen", E: "Ich weiß es nicht" } },
  "pcp_eval_sa_7": { q: "Was stimmt mit dem folgenden Parallelkoordinaten-Diagramm nicht?",
    o: { A: "Das Diagramm enthält wiederholte Achsen", B: "Das Diagramm verwendet zu viele Farben", C: "Das Diagramm enthält keine Farblegende", D: "Am obigen Diagramm ist nichts auszusetzen", E: "Ich weiß es nicht" } },
  "pcp_eval_sa_8": { q: "Nennen Sie ein Problem mit diesem Diagramm.",
    o: { A: "Es hat zu viele Achsen", B: "Es gibt keine Farblegende", C: "Es gibt zu viele Farben", D: "Mit diesem Diagramm gibt es kein Problem", E: "Ich weiß es nicht" } }
};

// ── Self-apply: write *_de fields onto PCP_ITEMS (matched by id + option label) ──
(function () {
  if (typeof PCP_ITEMS === 'undefined' || !PCP_ITEMS) return;
  for (var i = 0; i < PCP_ITEMS.length; i++) {
    var it = PCP_ITEMS[i];
    var d = PCP_ITEMS_DE[it.id];
    if (!d) continue;
    if (d.q != null) it.questionText_de = d.q;
    if (d.o && it.options) {
      for (var j = 0; j < it.options.length; j++) {
        var op = it.options[j];
        if (d.o[op.label] != null) op.text_de = d.o[op.label];
      }
    }
  }
})();

if (typeof module !== 'undefined') { module.exports = PCP_ITEMS_DE; }

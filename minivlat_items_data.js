/**
 * Mini-VLAT V2 (Visualization Literacy Assessment Test — Short Form)
 * Source: Pandey & Ottley (2023), IEEE VIS / EuroVIS
 * PDF:  https://washuvis.github.io/minivlat/Mini_VLAT_V2.pdf
 * Repo: https://github.com/washuvis/minivlat
 *
 * 12 items, one per chart type. Used as a pre-/post-baseline for
 * data-literacy independent of the 29-item VLAT test blocks.
 *
 * IDs chosen to NOT overlap with the 29 VLAT test items
 * (practice/posttest1/posttest2).
 *
 * i18n: English fields are the source of truth. `*_de` fields hold the
 * German overlay (questionText_de on items, text_de on options,
 * title_de on charts). The survey page reads ?lang= and falls back to
 * English when a `_de` field is absent. NOTE: pilot translation of a
 * validated instrument — not back-translated / re-validated.
 */

var MINIVLAT_ITEMS = [
  // ── Q1  Treemap ──────────────────────────────────────────────
  {
    id: 1,
    block: "minivlat",
    chartType: "Treemap",
    chartId: "minivlat_treemap",
    questionText: "eBay is nested in the Software category.",
    questionText_de: "eBay ist in der Kategorie „Software“ eingeordnet.",
    questionFormat: "tf",
    options: [
      { label: "True",  text: "True",  text_de: "Wahr" },
      { label: "False", text: "False", text_de: "Falsch" }
    ],
    hasOmit: true,
    correctAnswer: "False"
  },

  // ── Q2  100% Stacked Bar Chart ───────────────────────────────
  {
    id: 6,
    block: "minivlat",
    chartType: "100% Stacked Bar Chart",
    chartId: "minivlat_100stackedbar",
    questionText: "Which country has the lowest proportion of Gold medals?",
    questionText_de: "Welches Land hat den geringsten Anteil an Goldmedaillen?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "USA",           text_de: "USA" },
      { label: "B", text: "Japan",         text_de: "Japan" },
      { label: "C", text: "Great Britain", text_de: "Großbritannien" },
      { label: "D", text: "Australia",     text_de: "Australien" }
    ],
    hasOmit: true,
    correctAnswer: "C"
  },

  // ── Q3  Histogram ────────────────────────────────────────────
  {
    id: 10,
    block: "minivlat",
    chartType: "Histogram",
    chartId: "minivlat_histogram",
    questionText: "What distance have customers traveled the most?",
    questionText_de: "Welche Strecke sind die Kundinnen und Kunden am häufigsten gefahren?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "60 – 70 km" },
      { label: "B", text: "20 – 30 km" },
      { label: "C", text: "30 – 40 km" },
      { label: "D", text: "50 – 60 km" }
    ],
    hasOmit: true,
    correctAnswer: "C"
  },

  // ── Q4  Choropleth Map ───────────────────────────────────────
  {
    id: 16,
    block: "minivlat",
    chartType: "Choropleth Map",
    chartId: "minivlat_map",
    questionText: "In 2020, the unemployment rate for Washington (WA) was higher than that of Wisconsin (WI).",
    questionText_de: "Im Jahr 2020 war die Arbeitslosenquote für Washington (WA) höher als die von Wisconsin (WI).",
    questionFormat: "tf",
    options: [
      { label: "True",  text: "True",  text_de: "Wahr" },
      { label: "False", text: "False", text_de: "Falsch" }
    ],
    hasOmit: true,
    correctAnswer: "True"
  },

  // ── Q5  Pie Chart ────────────────────────────────────────────
  {
    id: 19,
    block: "minivlat",
    chartType: "Pie Chart",
    chartId: "minivlat_pie",
    questionText: "What is the approximate global smartphone market share of Samsung?",
    questionText_de: "Wie hoch ist der ungefähre weltweite Smartphone-Marktanteil von Samsung?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "17.6%" },
      { label: "B", text: "10.9%" },
      { label: "C", text: "25.3%" },
      { label: "D", text: "35.2%" }
    ],
    hasOmit: true,
    correctAnswer: "A"
  },

  // ── Q6  Bubble Chart ─────────────────────────────────────────
  {
    id: 22,
    block: "minivlat",
    chartType: "Bubble Chart",
    chartId: "minivlat_bubble",
    questionText: "Which has the largest number of metro stations?",
    questionText_de: "Welche hat die größte Anzahl an U-Bahn-Stationen?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "Beijing",  text_de: "Peking" },
      { label: "B", text: "London",   text_de: "London" },
      { label: "C", text: "Shanghai", text_de: "Shanghai" },
      { label: "D", text: "Seoul",    text_de: "Seoul" }
    ],
    hasOmit: true,
    correctAnswer: "C"
  },

  // ── Q7  Stacked Bar Chart ────────────────────────────────────
  {
    id: 33,
    block: "minivlat",
    chartType: "Stacked Bar Chart",
    chartId: "minivlat_stackedbar",
    questionText: "What is the cost of peanuts in Seoul?",
    questionText_de: "Wie hoch sind die Kosten für Erdnüsse in Seoul?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "$5.2" },
      { label: "B", text: "$7.5" },
      { label: "C", text: "$6.1" },
      { label: "D", text: "$4.5" }
    ],
    hasOmit: true,
    correctAnswer: "C"
  },

  // ── Q8  Line Chart ───────────────────────────────────────────
  {
    id: 35,
    block: "minivlat",
    chartType: "Line Chart",
    chartId: "minivlat_line",
    questionText: "What was the price of a barrel of oil in February 2020?",
    questionText_de: "Wie hoch war der Preis für ein Barrel Öl im Februar 2020?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "$50.54" },
      { label: "B", text: "$42.34" },
      { label: "C", text: "$47.02" },
      { label: "D", text: "$43.48" }
    ],
    hasOmit: true,
    correctAnswer: "A"
  },

  // ── Q9  Bar Chart ────────────────────────────────────────────
  {
    id: 41,
    block: "minivlat",
    chartType: "Bar Chart",
    chartId: "minivlat_bar",
    questionText: "What is the average internet speed in Japan?",
    questionText_de: "Wie hoch ist die durchschnittliche Internetgeschwindigkeit in Japan?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "42.30 Mbps" },
      { label: "B", text: "35.25 Mbps" },
      { label: "C", text: "40.51 Mbps" },
      { label: "D", text: "16.16 Mbps" }
    ],
    hasOmit: true,
    correctAnswer: "C"
  },

  // ── Q10 Area Chart ───────────────────────────────────────────
  {
    id: 48,
    block: "minivlat",
    chartType: "Area Chart",
    chartId: "minivlat_area",
    questionText: "What was the average price of a pound of coffee in October 2019?",
    questionText_de: "Wie hoch war der Durchschnittspreis für ein Pfund Kaffee im Oktober 2019?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "$0.71" },
      { label: "B", text: "$0.80" },
      { label: "C", text: "$0.90" },
      { label: "D", text: "$0.63" }
    ],
    hasOmit: true,
    correctAnswer: "A"
  },

  // ── Q11 Stacked Area Chart ───────────────────────────────────
  {
    id: 57,
    block: "minivlat",
    chartType: "Stacked Area Chart",
    chartId: "minivlat_stackedarea",
    questionText: "What was the ratio of girls named “Isla” to girls named “Amelia” in 2012 in the UK?",
    questionText_de: "Wie war im Jahr 2012 im Vereinigten Königreich das Verhältnis von Mädchen mit dem Namen „Isla“ zu Mädchen mit dem Namen „Amelia“?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "1 to 1", text_de: "1 zu 1" },
      { label: "B", text: "1 to 3", text_de: "1 zu 3" },
      { label: "C", text: "1 to 2", text_de: "1 zu 2" },
      { label: "D", text: "1 to 4", text_de: "1 zu 4" }
    ],
    hasOmit: true,
    correctAnswer: "C"
  },

  // ── Q12 Scatterplot ──────────────────────────────────────────
  {
    id: 61,
    block: "minivlat",
    chartType: "Scatterplot",
    chartId: "minivlat_scatterplot",
    questionText: "There is a negative relationship between the height and weight of the 85 males.",
    questionText_de: "Es besteht ein negativer Zusammenhang zwischen der Körpergröße und dem Gewicht der 85 Männer.",
    questionFormat: "tf",
    options: [
      { label: "True",  text: "True",  text_de: "Wahr" },
      { label: "False", text: "False", text_de: "Falsch" }
    ],
    hasOmit: true,
    correctAnswer: "False"
  }
];

// ── Chart image mapping ──────────────────────────────────────
// 12 unique charts, one per item (unlike the 29-item VLAT which shares charts).
var MINIVLAT_CHARTS = {
  minivlat_treemap:        { title: "Number of Unique Visitors",            title_de: "Anzahl der eindeutigen Besucher",                 items: [1] },
  minivlat_100stackedbar:  { title: "Tokyo 2020 Olympics Summary",          title_de: "Zusammenfassung der Olympischen Spiele Tokio 2020", items: [6] },
  minivlat_histogram:      { title: "Trip Distance and Customers",          title_de: "Fahrstrecke und Kundenzahl",                      items: [10] },
  minivlat_map:            { title: "2020 Unemployment Rates",              title_de: "Arbeitslosenquoten 2020",                         items: [16] },
  minivlat_pie:            { title: "2021 Global Smartphone Market Share",  title_de: "Weltweiter Smartphone-Marktanteil 2021",          items: [19] },
  minivlat_bubble:         { title: "Metro Systems of the World",           title_de: "U-Bahn-Systeme der Welt",                         items: [22] },
  minivlat_stackedbar:     { title: "Room Service Prices",                  title_de: "Zimmerservice-Preise",                            items: [33] },
  minivlat_line:           { title: "Oil Prices in 2020",                   title_de: "Ölpreise im Jahr 2020",                           items: [35] },
  minivlat_bar:            { title: "Global Internet Speed in 2021",        title_de: "Weltweite Internetgeschwindigkeit 2021",          items: [41] },
  minivlat_area:           { title: "Robusta Coffee Price",                 title_de: "Robusta-Kaffeepreis",                             items: [48] },
  minivlat_stackedarea:    { title: "Popular Girls’ Names in the UK",       title_de: "Beliebte Mädchennamen im Vereinigten Königreich", items: [57] },
  minivlat_scatterplot:    { title: "Weight and Height of 85 Individuals",  title_de: "Gewicht und Körpergröße von 85 Personen",         items: [61] }
};

// ── Export for Node.js and browser ───────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MINIVLAT_ITEMS;
  module.exports.MINIVLAT_CHARTS = MINIVLAT_CHARTS;
}

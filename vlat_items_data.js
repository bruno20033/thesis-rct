/**
 * VLAT (Visualization Literacy Assessment Test) Item Data
 * Source: Kim, Lee & Kwon (2017), IEEE TVCG 23(1)
 * Handoff spec: vlat_implementation_handoff.md
 *
 * 29 items across 3 blocks: practice (9), posttest1 (10), posttest2 (10)
 * Item IDs use original VLAT numbering (not sequential 1-29).
 * Question text transcribed verbatim from the handoff document.
 *
 * i18n: English fields are the source of truth. `*_de` fields hold the
 * German overlay (questionText_de on items, text_de on options,
 * title_de on charts). The survey page reads ?lang= and falls back to
 * English when a `_de` field is absent. NOTE: pilot translation of a
 * validated instrument — not back-translated / re-validated.
 */

var VLAT_ITEMS = [
  // ════════════════════════════════════════════════════════════
  // PRACTICE BLOCK (9 items) — with tool access
  // Avg difficulty P = 0.506 | Avg discrimination D = 0.364
  // ════════════════════════════════════════════════════════════

  {
    id: 8,
    block: "practice",
    chartType: "Bar Chart",
    chartId: "bar_internet_speeds",
    questionText: "What is the range of the average internet speed in Asia?",
    questionText_de: "Wie groß ist die Spannweite der durchschnittlichen Internetgeschwindigkeit in Asien?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "0 - 22 Mbps" },
      { label: "B", text: "2 - 20.5 Mbps" },
      { label: "C", text: "3 - 20 Mbps" },
      { label: "D", text: "3.4 - 7.8 Mbps" }
    ],
    hasOmit: true,
    difficulty: 0.54,
    discrimination: 0.61
  },
  {
    id: 11,
    block: "practice",
    chartType: "Stacked Bar Chart",
    chartId: "stacked_bar_hotel",
    questionText: "About what is the ratio of the cost of a sandwich to the total cost of room service in Seattle?",
    questionText_de: "Wie groß ist ungefähr das Verhältnis der Kosten für ein Sandwich zu den Gesamtkosten des Zimmerservice in Seattle?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "1 to 10", text_de: "1 zu 10" },
      { label: "B", text: "2 to 10", text_de: "2 zu 10" },
      { label: "C", text: "4 to 10", text_de: "4 zu 10" },
      { label: "D", text: "6 to 10", text_de: "6 zu 10" }
    ],
    hasOmit: true,
    difficulty: 0.36,
    discrimination: 0.48
  },
  {
    id: 12,
    block: "practice",
    chartType: "Stacked Bar Chart",
    chartId: "stacked_bar_hotel",
    questionText: "In which city is the cost of soda the highest?",
    questionText_de: "In welcher Stadt sind die Kosten für Limonade am höchsten?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "New York City",   text_de: "New York City" },
      { label: "B", text: "Las Vegas",       text_de: "Las Vegas" },
      { label: "C", text: "Atalanta",        text_de: "Atlanta" },
      { label: "D", text: "Washington D.C.", text_de: "Washington D.C." }
    ],
    hasOmit: true,
    difficulty: 0.69,
    discrimination: 0.45
  },
  {
    id: 18,
    block: "practice",
    chartType: "100% Stacked Bar Chart",
    chartId: "stacked100_election",
    questionText: "The approval rating of Republicans for the people who have the education level of Some College Degree is lower than that for the people who have the education level of Postgraduate Study.",
    questionText_de: "Die Zustimmungsrate für die Republikaner ist bei den Personen mit dem Bildungsniveau „Some College Degree“ niedriger als bei den Personen mit dem Bildungsniveau „Postgraduate Study“.",
    questionFormat: "tf",
    options: [
      { label: "True",  text: "True",  text_de: "Wahr" },
      { label: "False", text: "False", text_de: "Falsch" }
    ],
    hasOmit: true,
    difficulty: 0.54,
    discrimination: 0.54
  },
  {
    id: 31,
    block: "practice",
    chartType: "Scatterplot",
    chartId: "scatter_height_weight",
    questionText: "What is the height for a person who lies outside the others the most?",
    questionText_de: "Wie groß ist die Person, die am stärksten von den anderen abweicht?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "167.4 cm" },
      { label: "B", text: "175.3 cm" },
      { label: "C", text: "193 cm" },
      { label: "D", text: "197.1 cm" }
    ],
    hasOmit: true,
    difficulty: 0.42,
    discrimination: 0.29
  },
  {
    id: 38,
    block: "practice",
    chartType: "Area Chart",
    chartId: "area_coffee_price",
    questionText: "Over the course of 2013, the average price of a pound of coffee beans was ___.",
    questionText_de: "Im Verlauf des Jahres 2013 war der Durchschnittspreis für ein Pfund Kaffeebohnen ___.",
    questionFormat: "mc",
    options: [
      { label: "A", text: "rising",  text_de: "steigend" },
      { label: "B", text: "falling", text_de: "fallend" },
      { label: "C", text: "staying", text_de: "gleichbleibend" }
    ],
    hasOmit: true,
    difficulty: 0.84,
    discrimination: 0.14
  },
  {
    id: 49,
    block: "practice",
    chartType: "Bubble Chart",
    chartId: "bubble_metro",
    questionText: "What is the range of the total length of the metro systems?",
    questionText_de: "Wie groß ist die Spannweite der Gesamtlänge der U-Bahn-Systeme?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "150 - 600 km" },
      { label: "B", text: "240 - 380 km" },
      { label: "C", text: "240 - 560 km" },
      { label: "D", text: "180 - 560 km" }
    ],
    hasOmit: true,
    difficulty: 0.29,
    discrimination: 0.44
  },
  {
    id: 51,
    block: "practice",
    chartType: "Bubble Chart",
    chartId: "bubble_metro",
    questionText: "Which city's metro system does lie outside the relationship between the total system length and the number of stations most?",
    questionText_de: "Das U-Bahn-System welcher Stadt weicht am stärksten vom Zusammenhang zwischen der Gesamtlänge des Systems und der Anzahl der Stationen ab?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "Tokyo",         text_de: "Tokio" },
      { label: "B", text: "New York City", text_de: "New York City" },
      { label: "C", text: "Beijing",       text_de: "Peking" },
      { label: "D", text: "London",        text_de: "London" }
    ],
    hasOmit: true,
    difficulty: 0.63,
    discrimination: 0.32
  },
  {
    id: 55,
    block: "practice",
    chartType: "Choropleth Map",
    chartId: "choropleth_unemployment",
    questionText: "What was the unemployment rate for Indiana (IN) in 2015?",
    questionText_de: "Wie hoch war die Arbeitslosenquote für Indiana (IN) im Jahr 2015?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "1.1% - 2.3%" },
      { label: "B", text: "2.3% - 3.4%" },
      { label: "C", text: "3.4% - 4.6%" },
      { label: "D", text: "4.6% - 5.7%" }
    ],
    hasOmit: true,
    difficulty: 0.24,
    discrimination: 0.01
  },

  // ════════════════════════════════════════════════════════════
  // POST-TEST 1 (10 items) — immediate, no tool access
  // Avg difficulty P = 0.487 | Avg discrimination D = 0.372
  // ════════════════════════════════════════════════════════════

  {
    id: 3,
    block: "posttest1",
    chartType: "Line Chart",
    chartId: "line_oil_prices",
    questionText: "What was the price range of a barrel of oil in 2015?",
    questionText_de: "Wie groß war die Preisspannweite für ein Barrel Öl im Jahr 2015?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "$35 - $65" },
      { label: "B", text: "$48.36 - $60.95" },
      { label: "C", text: "$37.04 - $48.36" },
      { label: "D", text: "$37.04 - $60.95" }
    ],
    hasOmit: true,
    difficulty: 0.56,
    discrimination: 0.66
  },
  {
    id: 9,
    block: "posttest1",
    chartType: "Bar Chart",
    chartId: "bar_internet_speeds",
    questionText: "How many countries in Asia is the average internet speed slower than Thailand?",
    questionText_de: "In wie vielen Ländern Asiens ist die durchschnittliche Internetgeschwindigkeit langsamer als in Thailand?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "5 countries", text_de: "5 Länder" },
      { label: "B", text: "6 countries", text_de: "6 Länder" },
      { label: "C", text: "7 countries", text_de: "7 Länder" },
      { label: "D", text: "8 countries", text_de: "8 Länder" }
    ],
    hasOmit: true,
    difficulty: 0.40,
    discrimination: 0.21
  },
  {
    id: 15,
    block: "posttest1",
    chartType: "Stacked Bar Chart",
    chartId: "stacked_bar_hotel",
    questionText: "The ratio of the cost of Soda to the cost of Water in Orlando is higher than that of Washington D.C.",
    questionText_de: "Das Verhältnis der Kosten für Limonade zu den Kosten für Wasser ist in Orlando höher als in Washington D.C.",
    questionFormat: "tf",
    options: [
      { label: "True",  text: "True",  text_de: "Wahr" },
      { label: "False", text: "False", text_de: "Falsch" }
    ],
    hasOmit: true,
    difficulty: 0.47,
    discrimination: 0.32
  },
  {
    id: 28,
    block: "posttest1",
    chartType: "Scatterplot",
    chartId: "scatter_height_weight",
    questionText: "What is the height for the tallest person among the 85 males?",
    questionText_de: "Wie groß ist die größte Person unter den 85 Männern?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "175.3 cm" },
      { label: "B", text: "192 cm" },
      { label: "C", text: "197.1 cm" },
      { label: "D", text: "200 cm" }
    ],
    hasOmit: true,
    difficulty: 0.70,
    discrimination: 0.39
  },
  {
    id: 29,
    block: "posttest1",
    chartType: "Scatterplot",
    chartId: "scatter_height_weight",
    questionText: "What is the range in weight for the 85 males?",
    questionText_de: "Wie groß ist die Spannweite des Gewichts der 85 Männer?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "40 - 130 kg" },
      { label: "B", text: "62.3 - 90.9 kg" },
      { label: "C", text: "53.9 - 102.3 kg" },
      { label: "D", text: "53.9 - 123.6 kg" }
    ],
    hasOmit: true,
    difficulty: 0.53,
    discrimination: 0.49
  },
  {
    id: 37,
    block: "posttest1",
    chartType: "Area Chart",
    chartId: "area_coffee_price",
    questionText: "What was the range of the average price of a pound of coffee beans between January 2013 and December 2014?",
    questionText_de: "Wie groß war die Spannweite des Durchschnittspreises für ein Pfund Kaffeebohnen zwischen Januar 2013 und Dezember 2014?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "$4.4 - $6.2" },
      { label: "B", text: "$4.6 - $5.9" },
      { label: "C", text: "$4.6 - $6.0" },
      { label: "D", text: "$4.6 - $6.1" }
    ],
    hasOmit: true,
    difficulty: 0.38,
    discrimination: 0.31
  },
  {
    id: 45,
    block: "posttest1",
    chartType: "Stacked Area Chart",
    chartId: "stacked_area_girls",
    questionText: "In the UK, the number of girls named 'Amelia' in 2014 was more than it was in 2013.",
    questionText_de: "Im Vereinigten Königreich war die Anzahl der Mädchen mit dem Namen „Amelia“ im Jahr 2014 höher als im Jahr 2013.",
    questionFormat: "tf",
    options: [
      { label: "True",  text: "True",  text_de: "Wahr" },
      { label: "False", text: "False", text_de: "Falsch" }
    ],
    hasOmit: true,
    difficulty: 0.20,
    discrimination: 0.17
  },
  {
    id: 47,
    block: "posttest1",
    chartType: "Bubble Chart",
    chartId: "bubble_metro",
    questionText: "What is the total length of the metro system in Beijing?",
    questionText_de: "Wie groß ist die Gesamtlänge des U-Bahn-Systems in Peking?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "330 km" },
      { label: "B", text: "400 km" },
      { label: "C", text: "530 km" },
      { label: "D", text: "560 km" }
    ],
    hasOmit: true,
    difficulty: 0.41,
    discrimination: 0.46
  },
  {
    id: 54,
    block: "posttest1",
    chartType: "Bubble Chart",
    chartId: "bubble_metro",
    questionText: "The metro system in Shanghai has more ridership than the metro system in Beijing.",
    questionText_de: "Das U-Bahn-System in Shanghai hat mehr Fahrgäste als das U-Bahn-System in Peking.",
    questionFormat: "tf",
    options: [
      { label: "True",  text: "True",  text_de: "Wahr" },
      { label: "False", text: "False", text_de: "Falsch" }
    ],
    hasOmit: true,
    difficulty: 0.80,
    discrimination: 0.33
  },
  {
    id: 60,
    block: "posttest1",
    chartType: "Treemap",
    chartId: "treemap_websites",
    questionText: "The number of unique visitors for Amazon was more than that of Yahoo in 2010.",
    questionText_de: "Die Anzahl der eindeutigen Besucher von Amazon war im Jahr 2010 höher als die von Yahoo.",
    questionFormat: "tf",
    options: [
      { label: "True",  text: "True",  text_de: "Wahr" },
      { label: "False", text: "False", text_de: "Falsch" }
    ],
    hasOmit: true,
    difficulty: 0.42,
    discrimination: 0.38
  },

  // ════════════════════════════════════════════════════════════
  // POST-TEST 2 (10 items) — 72-hour delay, no tool access
  // Avg difficulty P = 0.510 | Avg discrimination D = 0.344
  // ════════════════════════════════════════════════════════════

  {
    id: 5,
    block: "posttest2",
    chartType: "Line Chart",
    chartId: "line_oil_prices",
    questionText: "About how much did the price of a barrel of oil fall from April to September in 2015?",
    questionText_de: "Um wie viel fiel der Preis für ein Barrel Öl ungefähr von April bis September 2015?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "$4" },
      { label: "B", text: "$15" },
      { label: "C", text: "$17" },
      { label: "D", text: "$45" }
    ],
    hasOmit: true,
    difficulty: 0.77,
    discrimination: 0.44
  },
  {
    id: 14,
    block: "posttest2",
    chartType: "Stacked Bar Chart",
    chartId: "stacked_bar_hotel",
    questionText: "The cost of vodka in Atlanta is higher than that of Honolulu.",
    questionText_de: "Die Kosten für Wodka sind in Atlanta höher als in Honolulu.",
    questionFormat: "tf",
    options: [
      { label: "True",  text: "True",  text_de: "Wahr" },
      { label: "False", text: "False", text_de: "Falsch" }
    ],
    hasOmit: true,
    difficulty: 0.59,
    discrimination: 0.52
  },
  {
    id: 32,
    block: "posttest2",
    chartType: "Scatterplot",
    chartId: "scatter_height_weight",
    questionText: "A group of males are gathered around the height of 176 cm and the weight of 70 kg.",
    questionText_de: "Eine Gruppe von Männern konzentriert sich um eine Körpergröße von 176 cm und ein Gewicht von 70 kg.",
    questionFormat: "tf",
    options: [
      { label: "True",  text: "True",  text_de: "Wahr" },
      { label: "False", text: "False", text_de: "Falsch" }
    ],
    hasOmit: true,
    difficulty: 0.90,
    discrimination: 0.22
  },
  {
    id: 34,
    block: "posttest2",
    chartType: "Scatterplot",
    chartId: "scatter_height_weight",
    questionText: "The weights for males with the height of 188 cm are all the same.",
    questionText_de: "Die Gewichte der Männer mit einer Körpergröße von 188 cm sind alle gleich.",
    questionFormat: "tf",
    options: [
      { label: "True",  text: "True",  text_de: "Wahr" },
      { label: "False", text: "False", text_de: "Falsch" }
    ],
    hasOmit: true,
    difficulty: 0.79,
    discrimination: 0.20
  },
  {
    id: 36,
    block: "posttest2",
    chartType: "Area Chart",
    chartId: "area_coffee_price",
    questionText: "When was the average price of a pound of coffee beans at minimum?",
    questionText_de: "Wann war der Durchschnittspreis für ein Pfund Kaffeebohnen am niedrigsten?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "April 2013",     text_de: "April 2013" },
      { label: "B", text: "September 2013", text_de: "September 2013" },
      { label: "C", text: "June 2014",      text_de: "Juni 2014" },
      { label: "D", text: "December 2014",  text_de: "Dezember 2014" }
    ],
    hasOmit: true,
    difficulty: 0.44,
    discrimination: 0.33
  },
  {
    id: 40,
    block: "posttest2",
    chartType: "Stacked Area Chart",
    chartId: "stacked_area_girls",
    questionText: "What was the number of girls named 'Amelia' in 2010 in the UK?",
    questionText_de: "Wie hoch war die Anzahl der Mädchen mit dem Namen „Amelia“ im Jahr 2010 im Vereinigten Königreich?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "1,500", text_de: "1.500" },
      { label: "B", text: "3,800", text_de: "3.800" },
      { label: "C", text: "4,200", text_de: "4.200" },
      { label: "D", text: "8,000", text_de: "8.000" }
    ],
    hasOmit: true,
    difficulty: 0.15,
    discrimination: 0.29
  },
  {
    id: 46,
    block: "posttest2",
    chartType: "Stacked Area Chart",
    chartId: "stacked_area_girls",
    questionText: "Over the course of years between 2009 and 2014, the number of girls named 'Isla' was always more than 'Olivia'.",
    questionText_de: "Im Verlauf der Jahre zwischen 2009 und 2014 war die Anzahl der Mädchen mit dem Namen „Isla“ stets höher als die mit dem Namen „Olivia“.",
    questionFormat: "tf",
    options: [
      { label: "True",  text: "True",  text_de: "Wahr" },
      { label: "False", text: "False", text_de: "Falsch" }
    ],
    hasOmit: true,
    difficulty: 0.24,
    discrimination: 0.20
  },
  {
    id: 52,
    block: "posttest2",
    chartType: "Bubble Chart",
    chartId: "bubble_metro",
    questionText: "A group of the metro systems of the world has approximately 300 stations and around a 200 km system length.",
    questionText_de: "Eine Gruppe der U-Bahn-Systeme der Welt hat ungefähr 300 Stationen und eine Systemlänge von etwa 200 km.",
    questionFormat: "tf",
    options: [
      { label: "True",  text: "True",  text_de: "Wahr" },
      { label: "False", text: "False", text_de: "Falsch" }
    ],
    hasOmit: true,
    difficulty: 0.59,
    discrimination: 0.50
  },
  {
    id: 53,
    block: "posttest2",
    chartType: "Bubble Chart",
    chartId: "bubble_metro",
    questionText: "In general, the ridership of the metro system increases as the number of stations increases.",
    questionText_de: "Im Allgemeinen steigt die Fahrgastzahl des U-Bahn-Systems, wenn die Anzahl der Stationen zunimmt.",
    questionFormat: "tf",
    options: [
      { label: "True",  text: "True",  text_de: "Wahr" },
      { label: "False", text: "False", text_de: "Falsch" }
    ],
    hasOmit: true,
    difficulty: 0.26,
    discrimination: 0.09
  },
  {
    id: 59,
    block: "posttest2",
    chartType: "Treemap",
    chartId: "treemap_websites",
    questionText: "For which website was the number of unique visitors the largest in 2010?",
    questionText_de: "Für welche Website war die Anzahl der eindeutigen Besucher im Jahr 2010 am größten?",
    questionFormat: "mc",
    options: [
      { label: "A", text: "Facebook", text_de: "Facebook" },
      { label: "B", text: "Amazon",   text_de: "Amazon" },
      { label: "C", text: "Bing",     text_de: "Bing" },
      { label: "D", text: "Google",   text_de: "Google" }
    ],
    hasOmit: true,
    difficulty: 0.68,
    discrimination: 0.37
  }
];

// ── Chart image mapping ──────────────────────────────────────
// 10 unique charts; multiple items share the same chart.
var VLAT_CHARTS = {
  line_oil_prices:         { title: "Monthly Oil Price History in 2015", title_de: "Monatlicher Ölpreisverlauf im Jahr 2015", items: [3, 5] },
  bar_internet_speeds:     { title: "Average Internet Speeds in Asia", title_de: "Durchschnittliche Internetgeschwindigkeiten in Asien", items: [8, 9] },
  stacked_bar_hotel:       { title: "Hotel Costs of Room Service", title_de: "Hotelkosten für Zimmerservice", items: [11, 12, 14, 15] },
  stacked100_election:     { title: "Election Exit Poll of California State by Education", title_de: "Nachwahlbefragung im Bundesstaat Kalifornien nach Bildungsniveau", items: [18] },
  scatter_height_weight:   { title: "Height vs. Weight of 85 Males", title_de: "Körpergröße und Gewicht von 85 Männern", items: [28, 29, 31, 32, 34] },
  area_coffee_price:       { title: "Average Coffee Bean Price from 2013 to 2014", title_de: "Durchschnittlicher Kaffeebohnenpreis von 2013 bis 2014", items: [36, 37, 38] },
  stacked_area_girls:      { title: "Popular Girls' Names in the UK", title_de: "Beliebte Mädchennamen im Vereinigten Königreich", items: [40, 45, 46] },
  bubble_metro:            { title: "Metro Systems of the World", title_de: "U-Bahn-Systeme der Welt", items: [47, 49, 51, 52, 53, 54] },
  choropleth_unemployment: { title: "Unemployment Rates for States in 2015", title_de: "Arbeitslosenquoten der Bundesstaaten im Jahr 2015", items: [55] },
  treemap_websites:        { title: "The Number of Unique Visitors for Websites in 2010", title_de: "Anzahl der eindeutigen Besucher von Websites im Jahr 2010", items: [59, 60] }
};

// ── Export for Node.js (VERIFY command) and browser ──────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VLAT_ITEMS;
  module.exports.VLAT_CHARTS = VLAT_CHARTS;
}

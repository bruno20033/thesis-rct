/**
 * VLAT (Visualization Literacy Assessment Test) Item Data
 * Source: Kim, Lee & Kwon (2017), IEEE TVCG 23(1)
 * Handoff spec: vlat_implementation_handoff.md
 *
 * 29 items across 3 blocks: practice (9), posttest1 (10), posttest2 (10)
 * Item IDs use original VLAT numbering (not sequential 1-29).
 * Question text transcribed verbatim from the handoff document.
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
    questionFormat: "mc",
    options: [
      { label: "A", text: "1 to 10" },
      { label: "B", text: "2 to 10" },
      { label: "C", text: "4 to 10" },
      { label: "D", text: "6 to 10" }
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
    questionFormat: "mc",
    options: [
      { label: "A", text: "New York City" },
      { label: "B", text: "Las Vegas" },
      { label: "C", text: "Atalanta" },
      { label: "D", text: "Washington D.C." }
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
    questionFormat: "tf",
    options: [
      { label: "True", text: "True" },
      { label: "False", text: "False" }
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
    questionFormat: "mc",
    options: [
      { label: "A", text: "rising" },
      { label: "B", text: "falling" },
      { label: "C", text: "staying" }
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
    questionFormat: "mc",
    options: [
      { label: "A", text: "Tokyo" },
      { label: "B", text: "New York City" },
      { label: "C", text: "Beijing" },
      { label: "D", text: "London" }
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
    questionFormat: "mc",
    options: [
      { label: "A", text: "5 countries" },
      { label: "B", text: "6 countries" },
      { label: "C", text: "7 countries" },
      { label: "D", text: "8 countries" }
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
    questionFormat: "tf",
    options: [
      { label: "True", text: "True" },
      { label: "False", text: "False" }
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
    questionFormat: "tf",
    options: [
      { label: "True", text: "True" },
      { label: "False", text: "False" }
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
    questionFormat: "tf",
    options: [
      { label: "True", text: "True" },
      { label: "False", text: "False" }
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
    questionFormat: "tf",
    options: [
      { label: "True", text: "True" },
      { label: "False", text: "False" }
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
    questionFormat: "tf",
    options: [
      { label: "True", text: "True" },
      { label: "False", text: "False" }
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
    questionFormat: "tf",
    options: [
      { label: "True", text: "True" },
      { label: "False", text: "False" }
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
    questionFormat: "tf",
    options: [
      { label: "True", text: "True" },
      { label: "False", text: "False" }
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
    questionFormat: "mc",
    options: [
      { label: "A", text: "April 2013" },
      { label: "B", text: "September 2013" },
      { label: "C", text: "June 2014" },
      { label: "D", text: "December 2014" }
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
    questionFormat: "mc",
    options: [
      { label: "A", text: "1,500" },
      { label: "B", text: "3,800" },
      { label: "C", text: "4,200" },
      { label: "D", text: "8,000" }
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
    questionFormat: "tf",
    options: [
      { label: "True", text: "True" },
      { label: "False", text: "False" }
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
    questionFormat: "tf",
    options: [
      { label: "True", text: "True" },
      { label: "False", text: "False" }
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
    questionFormat: "tf",
    options: [
      { label: "True", text: "True" },
      { label: "False", text: "False" }
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
    questionFormat: "mc",
    options: [
      { label: "A", text: "Facebook" },
      { label: "B", text: "Amazon" },
      { label: "C", text: "Bing" },
      { label: "D", text: "Google" }
    ],
    hasOmit: true,
    difficulty: 0.68,
    discrimination: 0.37
  }
];

// ── Chart image mapping ──────────────────────────────────────
// 10 unique charts; multiple items share the same chart.
var VLAT_CHARTS = {
  line_oil_prices:         { title: "Monthly Oil Price History in 2015", items: [3, 5] },
  bar_internet_speeds:     { title: "Average Internet Speeds in Asia", items: [8, 9] },
  stacked_bar_hotel:       { title: "Hotel Costs of Room Service", items: [11, 12, 14, 15] },
  stacked100_election:     { title: "Election Exit Poll of California State by Education", items: [18] },
  scatter_height_weight:   { title: "Height vs. Weight of 85 Males", items: [28, 29, 31, 32, 34] },
  area_coffee_price:       { title: "Average Coffee Bean Price from 2013 to 2014", items: [36, 37, 38] },
  stacked_area_girls:      { title: "Popular Girls' Names in the UK", items: [40, 45, 46] },
  bubble_metro:            { title: "Metro Systems of the World", items: [47, 49, 51, 52, 53, 54] },
  choropleth_unemployment: { title: "Unemployment Rates for States in 2015", items: [55] },
  treemap_websites:        { title: "The Number of Unique Visitors for Websites in 2010", items: [59, 60] }
};

// ── Export for Node.js (VERIFY command) and browser ──────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VLAT_ITEMS;
  module.exports.VLAT_CHARTS = VLAT_CHARTS;
}

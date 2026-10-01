/* Eight source-authored PCP-literacy training prompts adapted from the
 * released Create and Analyze assessments. These are training-only: neither
 * appears in the immediate or delayed unaided outcome blocks. The final four
 * request a short explanation or tool-reliance declaration after the answer.
 *
 * Source wording: ml-pcp-literacy/assessments/Create.pdf and Analyze-FA.pdf.
 * The static response choices are an implementation adaptation of the source
 * activities; source data and answer facts are asserted in regeneration.
 */
(function (root, factory) {
  var items = factory();
  if (typeof module === 'object' && module.exports) module.exports = items;
  root.PCP_TRAINING_EXTENSION_ITEMS = items;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  return [
    {
      id: 'pcp_create_1', bloom: 'create', block: 'practice', set: 3,
      chartType: 'Parallel Coordinates', chartId: 'pcp_create_1',
      questionText: 'Which two cereals have the highest amounts of sugar?',
      questionText_de: 'Welche zwei Cerealien haben den höchsten Zuckergehalt?',
      questionFormat: 'mc', hasOmit: true,
      options: [
        { label: 'A', text: 'Apple Jacks and Post Nat. Raisin Bran', text_de: 'Apple Jacks und Post Nat. Raisin Bran' },
        { label: 'B', text: 'Golden Crisp and Smacks', text_de: 'Golden Crisp und Smacks' },
        { label: 'C', text: 'Cocoa Puffs and Count Chocula', text_de: 'Cocoa Puffs und Count Chocula' },
        { label: 'D', text: 'Trix and Lucky Charms', text_de: 'Trix und Lucky Charms' }
      ]
    },
    {
      id: 'pcp_create_2', bloom: 'create', block: 'practice', set: 3,
      chartType: 'Parallel Coordinates', chartId: 'pcp_create_2',
      questionText: 'Which cereal has the most fiber?',
      questionText_de: 'Welche Cerealie hat den meisten Ballaststoff?',
      questionFormat: 'mc', hasOmit: true,
      options: [
        { label: 'A', text: 'All-Bran', text_de: 'All-Bran' },
        { label: 'B', text: '100% Bran', text_de: '100% Bran' },
        { label: 'C', text: 'All-Bran with Extra Fiber', text_de: 'All-Bran with Extra Fiber' },
        { label: 'D', text: 'Post Nat. Raisin Bran', text_de: 'Post Nat. Raisin Bran' }
      ]
    },
    {
      id: 'pcp_create_3', bloom: 'create', block: 'practice', set: 3,
      chartType: 'Parallel Coordinates', chartId: 'pcp_create_3',
      questionText: 'Which two cereal manufacturers (mfr) make the highest-vitamin cereals?',
      questionText_de: 'Welche zwei Cerealienhersteller (mfr) stellen die Cerealien mit den meisten Vitaminen her?',
      questionFormat: 'mc', hasOmit: true,
      options: [
        { label: 'A', text: 'G and P', text_de: 'G und P' },
        { label: 'B', text: 'A and N', text_de: 'A und N' },
        { label: 'C', text: 'P and Q', text_de: 'P und Q' },
        { label: 'D', text: 'G and K', text_de: 'G und K' }
      ]
    },
    {
      id: 'pcp_create_4', bloom: 'create', block: 'practice', set: 3,
      chartType: 'Parallel Coordinates', chartId: 'pcp_create_4',
      questionText: 'Name one of the two cereals with ratings less than 20.',
      questionText_de: 'Nennen Sie eine der zwei Cerealien mit einer Bewertung unter 20.',
      questionFormat: 'mc', hasOmit: true,
      options: [
        { label: 'A', text: "Cap'n'Crunch", text_de: "Cap'n'Crunch" },
        { label: 'B', text: 'Honey Graham Ohs', text_de: 'Honey Graham Ohs' },
        { label: 'C', text: 'Count Chocula', text_de: 'Count Chocula' },
        { label: 'D', text: 'Cocoa Puffs', text_de: 'Cocoa Puffs' }
      ]
    },
    {
      id: 'pcp_create_5', bloom: 'create', block: 'practice', set: 3,
      chartType: 'Parallel Coordinates', chartId: 'pcp_create_5',
      questionText: 'Which cereal has sodium higher than 250 and sugar higher than 5?',
      questionText_de: 'Welche Cerealie hat mehr als 250 Natrium und mehr als 5 Zucker?',
      questionFormat: 'mc', hasOmit: true, reflection: true,
      options: [
        { label: 'A', text: 'Grape-Nuts', text_de: 'Grape-Nuts' },
        { label: 'B', text: 'Golden Grahams', text_de: 'Golden Grahams' },
        { label: 'C', text: '100% Bran', text_de: '100% Bran' },
        { label: 'D', text: 'Corn Flakes', text_de: 'Corn Flakes' }
      ]
    },
    {
      id: 'pcp_analyze_7', bloom: 'analyze', block: 'practice', set: 3,
      chartType: 'Parallel Coordinates', chartId: 'pcp_analyze_7',
      questionText: 'In this parallel coordinates plot of a cars dataset, the user has selected only the cars that have 8 cylinders. Based on reading this chart, what is the range for HP (Horsepower) of 8-cylinder cars?',
      questionText_de: 'In diesem Parallelkoordinaten-Diagramm eines Autodatensatzes wurden nur Autos mit 8 Zylindern ausgewählt. Welchen Wertebereich hat HP (Horsepower) bei diesen Autos?',
      questionFormat: 'mc', hasOmit: true, reflection: true,
      options: [
        { label: 'A', text: '90–215', text_de: '90–215' },
        { label: 'B', text: '100–230', text_de: '100–230' },
        { label: 'C', text: '90–230', text_de: '90–230' },
        { label: 'D', text: '120–230', text_de: '120–230' }
      ]
    },
    {
      id: 'pcp_analyze_2', bloom: 'analyze', block: 'practice', set: 3,
      chartType: 'Parallel Coordinates', chartId: 'pcp_analyze_2',
      questionText: 'What is wrong with the following parallel coordinates chart?',
      questionText_de: 'Was stimmt mit dem folgenden Parallelkoordinaten-Diagramm nicht?',
      questionFormat: 'mc', hasOmit: true, reflection: true,
      options: [
        { label: 'A', text: 'There should be more than 4 axes for it to be a parallel coordinates chart.', text_de: 'Ein Parallelkoordinaten-Diagramm muss mehr als 4 Achsen haben.' },
        { label: 'B', text: 'There is no use of color in this chart.', text_de: 'In diesem Diagramm wird keine Farbe verwendet.' },
        { label: 'C', text: 'The chart is missing axis labels.', text_de: 'Dem Diagramm fehlen Achsenbeschriftungen.' },
        { label: 'D', text: 'The axes are not sorted uniformly; some are ascending and some are descending.', text_de: 'Die Achsen sind nicht einheitlich sortiert; einige steigen, andere fallen.' }
      ]
    },
    {
      id: 'pcp_analyze_4', bloom: 'analyze', block: 'practice', set: 3,
      chartType: 'Parallel Coordinates', chartId: 'pcp_analyze_4',
      questionText: 'Which state has one of the lowest education levels for High School or Higher and one of the highest values for number of households in the state?',
      questionText_de: 'Welcher Bundesstaat hat einen der niedrigsten Werte für „High School or Higher“ und einen der höchsten Werte für die Zahl der Haushalte?',
      questionFormat: 'mc', hasOmit: true, reflection: true,
      options: [
        { label: 'A', text: 'California', text_de: 'California' },
        { label: 'B', text: 'Delaware', text_de: 'Delaware' },
        { label: 'C', text: 'Indiana', text_de: 'Indiana' },
        { label: 'D', text: 'Alaska', text_de: 'Alaska' }
      ]
    }
  ];
});

var CR_ITEMS = {

  // ===== SET A: Training Phase (8 assumption items) =====
  setA: [

    // --- A-E1: Bad News in Management Hierarchy (Easy) ---
    {
      id: 'A-E1',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'easy',
      stem: 'Because no employee wants to be associated with bad news in the eyes of a superior, information about serious problems at lower levels is progressively softened and distorted as it goes up each step in the management hierarchy. The chief executive is, therefore, less well informed about problems at lower levels than are his or her subordinates at those levels.',
      prompt: 'The conclusion drawn above is based on the assumption that',
      options: [
        { key: 'A', text: 'Problems should be solved at levels in the management hierarchy at which they occur' },
        { key: 'B', text: 'Employees should be rewarded for accurately reporting problems to their superiors' },
        { key: 'C', text: 'Problem-solving ability is more important at higher levels than it is at lower levels of the management hierarchy' },
        { key: 'D', text: 'Chief executives obtain information about problems at lower levels from no source other than their subordinates' },
        { key: 'E', text: 'Some employees are more concerned about truth than about the way they are perceived by their superiors' }
      ],
      correct: 'D'
    },

    // --- A-E3: Computers and Communication Skills (Easy) ---
    {
      id: 'A-E3',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'easy',
      stem: 'Although computers can enhance people\'s ability to communicate, computer games are a cause of underdeveloped communication skills in children. After-school hours spent playing computer games are hours not spent talking to people. Therefore, children who spend all their spare time playing these games have less experience in interpersonal communication than other children have.',
      prompt: 'The argument depends on which of the following assumptions?',
      options: [
        { key: 'A', text: 'Passive activities such as watching television and listening to music do not hinder the development of communication skills in children.' },
        { key: 'B', text: 'Most children have other opportunities, in addition to after-school hours, in which they can choose whether to play computer games or to interact with other people.' },
        { key: 'C', text: 'Children who do not spend all of their after-school hours playing computer games spend at least some of that time talking with other people.' },
        { key: 'D', text: 'Formal instruction contributes little or nothing to children\'s acquisition of communication skills.' },
        { key: 'E', text: 'The mental skills developed through playing computer games do not contribute significantly to children\'s intellectual development.' }
      ],
      correct: 'C'
    },

    // --- A-M1: Painting Frame Origin (Medium) ---
    {
      id: 'A-M1',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'medium',
      stem: 'A newly discovered painting seems to be the work of one of two seventeenth-century artists, either the northern German Johannes Drechen or the Frenchman Louis Birelle, who sometimes painted in the same style as Drechen. Analysis of the carved picture frame, which has been identified as the painting\'s original seventeenth-century frame, showed that it is made of wood found widely in northern Germany at the time, but rare in the part of France where Birelle lived. This shows that the painting is most likely the work of Drechen.',
      prompt: 'Which of the following is an assumption that the argument requires?',
      options: [
        { key: 'A', text: 'The frame was made from wood local to the region where the picture was painted.' },
        { key: 'B', text: 'Drechen is unlikely to have ever visited the home region of Birelle in France.' },
        { key: 'C', text: 'Sometimes a painting so resembles others of its era that no expert is able to confidently decide who painted it.' },
        { key: 'D', text: 'The painter of the picture chose the frame for the picture.' },
        { key: 'E', text: 'The carving style of the picture frame is not typical of any specific region of Europe.' }
      ],
      correct: 'A'
    },

    // --- A-M3: Famous Singer Lawsuit (Medium) ---
    {
      id: 'A-M3',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'medium',
      stem: 'A famous singer recently won a lawsuit against an advertising firm for using another singer in a commercial to evoke the famous singer\'s rendition of a certain song. As a result of the lawsuit, advertising firms will stop using imitators in their commercials. Therefore, advertising costs will rise, since famous singers\' services cost more than imitators\' services.',
      prompt: 'The conclusion above is based on which of the following assumptions?',
      options: [
        { key: 'A', text: 'Most people are unable to distinguish a famous singer\'s rendition of a song from a good imitator\'s rendition of it.' },
        { key: 'B', text: 'Commercials using famous singers are usually more effective than commercials using imitators of famous singers.' },
        { key: 'C', text: 'The original versions of some well-known songs are unavailable for use in commercials.' },
        { key: 'D', text: 'Advertising firms will continue to use imitators to mimic the physical mannerisms of famous singers.' },
        { key: 'E', text: 'The advertising industry will continue to use songs in commercials.' }
      ],
      correct: 'E'
    },

    // --- A-H1: Michelangelo Painting Dating (Hard) ---
    {
      id: 'A-H1',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'hard',
      stem: 'A newly discovered painting on wooden panel by Michelangelo must have been completed after 1507 but before 1509. It cannot have been painted earlier than 1507 because one of its central figures carries a coin that was not minted until that year. It cannot have been painted after 1509 because it contains a pigment that Michelangelo is known to have abandoned when a cheaper alternative became available in that year.',
      prompt: 'Which of the following is an assumption on which the argument depends?',
      options: [
        { key: 'A', text: 'No stocks of the abandoned pigment existed after 1509.' },
        { key: 'B', text: 'Michelangelo did not work on the painting over the course of several years.' },
        { key: 'C', text: 'The coin depicted in the painting was known to the general public in 1507.' },
        { key: 'D', text: 'The wooden panel on which the painting was executed cannot be tested accurately for age.' },
        { key: 'E', text: 'Michelangelo\'s painting style did not change between 1507 and 1509.' }
      ],
      correct: 'B'
    },

    // --- A-H2: Unemployment Statistics (Hard) ---
    {
      id: 'A-H2',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'hard',
      stem: 'Roland: The alarming fact is that 90 percent of the people in this country report that they know someone who is unemployed.\n\nSharon: What is alarming is the fact that you find that alarming. With an unemployment rate of 5 percent, 1 out of 20 workers is unemployed. So if each person in this country knows approximately 50 workers, each person could be expected to know someone who is unemployed.',
      prompt: 'Sharon\'s argument relies on the assumption that',
      options: [
        { key: 'A', text: 'Normal levels of unemployment are rarely exceeded.' },
        { key: 'B', text: 'Unemployment is not normally concentrated in geographically isolated segments of the population.' },
        { key: 'C', text: 'The number of people who each know someone who is unemployed is always higher than 90 percent of the population.' },
        { key: 'D', text: 'Roland is not consciously distorting the statistics he presents.' },
        { key: 'E', text: 'Knowledge that a personal acquaintance is unemployed generates more fear of losing one\'s job than does knowledge of unemployment statistics.' }
      ],
      correct: 'B'
    },

    // --- A-VH1: Experiment -- Easy vs. Hard Task (Very Hard) ---
    {
      id: 'A-VH1',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'vhard',
      stem: 'In an experiment, each volunteer was allowed to choose between an easy task and a hard task and was told that another volunteer would do the other task. Each volunteer could also choose to have a computer assign the two tasks randomly. Most volunteers chose the easy task for themselves and under questioning later said they had acted fairly. But when the scenario was described to another group of volunteers, almost all said choosing the easy task would be unfair. This shows that most people apply weaker moral standards to themselves than to others.',
      prompt: 'Which of the following is an assumption required by this argument?',
      options: [
        { key: 'A', text: 'At least some volunteers who said they had acted fairly in choosing the easy task would have said that it was unfair for someone else to do so.' },
        { key: 'B', text: 'The most moral choice for the volunteers would have been to have the computer assign the two tasks randomly.' },
        { key: 'C', text: 'There were at least some volunteers who were assigned to do the hard task and felt that the assignment was unfair.' },
        { key: 'D', text: 'On average, the volunteers to whom the scenario was described were more accurate in their moral judgments than the other volunteers were.' },
        { key: 'E', text: 'At least some volunteers given the choice between assigning the tasks themselves and having the computer assign them felt that they had made the only fair choice available to them.' }
      ],
      correct: 'A'
    },

    // --- A-VH2: Radar Detectors and Speeding (Very Hard) ---
    {
      id: 'A-VH2',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'vhard',
      stem: 'A recent report determined that although only 3 percent of drivers on Maryland highways equipped their vehicles with radar detectors, 33 percent of all vehicles ticketed for exceeding the speed limit were equipped with them. Clearly, drivers who equip their vehicles with radar detectors are more likely to exceed the speed limit regularly than are drivers who do not.',
      prompt: 'The conclusion drawn above depends on which of the following assumptions?',
      options: [
        { key: 'A', text: 'Drivers who equip their vehicles with radar detectors are less likely to be ticketed for exceeding the speed limit than are drivers who do not.' },
        { key: 'B', text: 'Drivers who are ticketed for exceeding the speed limit are more likely to exceed the speed limit regularly than are drivers who are not ticketed.' },
        { key: 'C', text: 'The number of vehicles ticketed for exceeding the speed limit exceeded the number of vehicles equipped with radar detectors.' },
        { key: 'D', text: 'Many of the vehicles that were ticketed for exceeding the speed limit were ticketed more than once in the period covered by the report.' },
        { key: 'E', text: 'Drivers on Maryland highways ones equipped their vehicles with radar detectors more than drivers in other states exceeded the speed limit.' }
      ],
      correct: 'B'
    }

  ],

  // ===== SET B: Post-test Phase (8 assumption items) =====
  setB: [

    // --- A-E2: Office Smoking Regulations (Easy) ---
    {
      id: 'A-E2',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'easy',
      stem: 'According to the new office smoking regulations, only employees who have an enclosed office may smoke at their desks. Virtually all employees with enclosed offices are at the professional level, and virtually all secretarial employees lack enclosed offices. Therefore, secretaries who smoke should be offered enclosed offices.',
      prompt: 'Which of the following is an assumption that enables the conclusion above to be properly drawn?',
      options: [
        { key: 'A', text: 'Employees at the professional level who do not smoke should keep their enclosed offices.' },
        { key: 'B', text: 'Employees with enclosed offices should not smoke at their desks, even though the new regulations permit them to do so.' },
        { key: 'C', text: 'Employees at the secretarial level should be allowed to smoke at their desks, even if they do not have enclosed offices.' },
        { key: 'D', text: 'The smoking regulations should allow all employees who smoke an equal opportunity to do so, regardless of an employee\'s job level.' },
        { key: 'E', text: 'The smoking regulations should provide equal protection from any hazards associated with smoking to all employees who do not smoke.' }
      ],
      correct: 'D'
    },

    // --- A-E4: Edmund Spenser's Parentage (Easy) ---
    {
      id: 'A-E4',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'easy',
      stem: 'Although there is no record of poet Edmund Spenser\'s parentage, we do know that as a youth Spenser attended the Merchant Tailors\' School in London for a period between 1560 and 1570. Records from this time indicate that the Merchant Tailors\' Guild then had only three members named Spenser: Robert Spenser, listed as a gentleman; Nicholas Spenser, elected the Guild\'s Warden in 1568; and John Spenser, listed as a "journeyman cloth-maker." Of these, the last was likely the least affluent of the three -- and most likely Edmund\'s father, since school accounting records list Edmund as a scholar who attended the school at a reduced fee.',
      prompt: 'Which of the following is an assumption on which the argument depends?',
      options: [
        { key: 'A', text: 'Anybody in sixteenth century London who made clothing professionally would have had to be a member of the Merchant Tailors\' Guild.' },
        { key: 'B', text: 'The fact that Edmund Spenser attended the Merchant Tailors\' School did not necessarily mean that he planned to become a tailor.' },
        { key: 'C', text: 'No member of the Guild could become Guild warden in sixteenth century London unless he was a gentleman.' },
        { key: 'D', text: 'Most of those whose fathers were members of the Merchant Tailors\' Guild were students at the Merchant Tailors\' School.' },
        { key: 'E', text: 'The Merchant Tailors\' School did not reduce its fees for the children of the more affluent Guild members.' }
      ],
      correct: 'E'
    },

    // --- A-M2: Immune System and Mental Health (Medium) ---
    {
      id: 'A-M2',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'medium',
      stem: 'A researcher discovered that people who have low levels of immune-system activity tend to score much lower on tests of mental health than do people with normal or high immune-system activity. The researcher concluded from this experiment that the immune system protects against mental illness as well as against physical disease.',
      prompt: 'The researcher\'s conclusion depends on which of the following assumptions?',
      options: [
        { key: 'A', text: 'High immune-system activity protects against mental illness better than normal immune-system activity does.' },
        { key: 'B', text: 'Mental illness is similar to physical disease in its effects on body systems.' },
        { key: 'C', text: 'People with high immune-system activity cannot develop mental illness.' },
        { key: 'D', text: 'Mental illness does not cause people\'s immune-system activity to decrease.' },
        { key: 'E', text: 'Psychological treatment of mental illness is not as effective as is medical treatment.' }
      ],
      correct: 'D'
    },

    // --- A-M4: Bank Depositors and Insurance (Medium) ---
    {
      id: 'A-M4',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'medium',
      stem: 'Bank depositors in the United States are all financially protected against bank failure because the government insures all individuals\' bank deposits. An economist argues that this insurance is partly responsible for the high rate of bank failures, since it removes from depositors any financial incentive to find out whether the bank that holds their money is secure against failure. If depositors were more selective, then banks would need to be secure in order to compete for depositors\' money.',
      prompt: 'The economist\'s argument makes which of the following assumptions?',
      options: [
        { key: 'A', text: 'Bank failures are caused when big borrowers default on loan repayments.' },
        { key: 'B', text: 'A significant proportion of depositors maintain accounts at several different banks.' },
        { key: 'C', text: 'The more a depositor has to deposit, the more careful he or she tends to be in selecting a bank.' },
        { key: 'D', text: 'The difference in the interest rates paid to depositors by different banks is not a significant factor in bank failures.' },
        { key: 'E', text: 'Potential depositors are able to determine which banks are secure against failure.' }
      ],
      correct: 'E'
    },

    // --- A-H3: R&D Spending and Tax Credit (Hard) ---
    {
      id: 'A-H3',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'hard',
      stem: 'Spending on research and development by United States businesses showed an 8 percent increase in 1984 over 1983, continuing a downward trend since 1981 when it increased 16.4 percent over 1980. The author concludes that the 25 percent tax credit enacted by Congress in 1981, which was intended to promote spending on research and development, did little or nothing to stimulate such spending.',
      prompt: 'The conclusion of the argument above cannot be true unless which of the following is true?',
      options: [
        { key: 'A', text: 'Business spending on R&D is usually directly proportional to business profits.' },
        { key: 'B', text: 'Business spending for R&D in 1985 could not increase by more than 8.3 percent.' },
        { key: 'C', text: 'Had the 1981 tax credit been set higher than 25 percent, business spending for R&D after 1981 would have increased more than it did.' },
        { key: 'D', text: 'In the absence of the 25 percent tax credit, business spending for R&D after 1981 would not have been substantially lower than it was.' },
        { key: 'E', text: 'Tax credits for specific investments are rarely effective in inducing businesses to make those investments.' }
      ],
      correct: 'D'
    },

    // --- A-H4: Cognitive Scientist and Mirror Self-Recognition (Hard) ---
    {
      id: 'A-H4',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'hard',
      stem: 'A cognitive scientist discusses mirror self-recognition (MSR) studies based on Gallup\'s work. Most animals show only social behaviors like aggression when exposed to mirrors. However, great apes exhibit self-directed behaviors after repeated exposure, suggesting they recognize their reflection. The conclusion states that great apes have a unique capacity for self-awareness among nonhuman species.',
      prompt: 'The cognitive scientist makes which of the following assumptions in the argument above?',
      options: [
        { key: 'A', text: 'Gallup\'s work has established that great apes have MSR capacity unique among nonhuman species.' },
        { key: 'B', text: 'If an animal lacks MSR capacity, it lacks self-awareness capacity.' },
        { key: 'C', text: 'When animals exhibit social behavior toward mirrors, they cannot be self-aware.' },
        { key: 'D', text: 'All animals exposed to mirrors display either social or self-directed behavior.' },
        { key: 'E', text: 'Animals without MSR might demonstrate self-awareness through other means.' }
      ],
      correct: 'B'
    },

    // --- A-VH3: Bat Wings and Blood Vessels (Very Hard) ---
    {
      id: 'A-VH3',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'vhard',
      stem: 'Networks of blood vessels in bats\' wings serve only to disperse heat generated in flight. This heat is generated only because bats flap their wings. Thus paleontologists\' recent discovery that the winged dinosaur Sandactylus had similar networks of blood vessels in the skin of its wings provides evidence for the hypothesis that Sandactylus flew by flapping its wings, not just by gliding.',
      prompt: 'The argument in the passage relies on which of the following assumptions?',
      options: [
        { key: 'A', text: 'Sandactylus would not have had networks of blood vessels in the skin of its wings if these networks were of no use to Sandactylus.' },
        { key: 'B', text: 'All creatures that fly by flapping their wings have networks of blood vessels in the skin of their wings.' },
        { key: 'C', text: 'Winged dinosaurs that flapped their wings in flight would have been able to fly more effectively than winged dinosaurs that could only glide.' },
        { key: 'D', text: 'If Sandactylus flew by flapping its wings, then paleontologists would certainly be able to find some evidence that it did so.' },
        { key: 'E', text: 'Heat generated by Sandactylus in flapping its wings in flight could not have been dispersed by anything other than the blood vessels in its wings.' }
      ],
      correct: 'A'
    },

    // --- A-VH4: Linguist -- Past and Future Metaphors (Very Hard, PLACEHOLDER) ---
    {
      id: 'A-VH4',
      type: 'cr',
      subtype: 'assumption',
      difficulty: 'vhard',
      placeholder: true,
      stem: '[Placeholder item — text to be added before deployment]',
      prompt: 'Which of the following is an assumption on which the argument depends?',
      options: [
        { key: 'A', text: 'Placeholder option A' },
        { key: 'B', text: 'Placeholder option B' },
        { key: 'C', text: 'Placeholder option C' },
        { key: 'D', text: 'Placeholder option D' },
        { key: 'E', text: 'Placeholder option E' }
      ],
      correct: 'A'
    }

  ],

  // ===== FAR TRANSFER: 4 non-assumption items =====
  farTransfer: [

    // --- F-E1: Homeowners and Ice Cream (Flaw, Easy) ---
    {
      id: 'F-E1',
      type: 'cr',
      subtype: 'flaw',
      difficulty: 'easy',
      stem: 'Homeowners aged 40 to 50 are more likely to purchase ice cream and are more likely to purchase it in larger amounts than are members of any other demographic group. The popular belief that teenagers eat more ice cream than adults must, therefore, be false.',
      prompt: 'The argument is flawed primarily because the author',
      options: [
        { key: 'A', text: 'Fails to distinguish between purchasing and consuming' },
        { key: 'B', text: 'Does not supply information about homeowners in age groups other than 40 to 50' },
        { key: 'C', text: 'Depends on popular belief rather than on documented research findings' },
        { key: 'D', text: 'Does not specify the precise amount of ice cream purchased by any demographic group' },
        { key: 'E', text: 'Discusses ice cream rather than more nutritious and healthful foods' }
      ],
      correct: 'A'
    },

    // --- F-E2: Candy Company and Caffeine (Flaw, Easy) ---
    {
      id: 'F-E2',
      type: 'cr',
      subtype: 'flaw',
      difficulty: 'easy',
      stem: 'A consumer health advocate accuses a candy company of adding caffeine to its products to make them addictive. The manufacturer responds that their chocolate bars contain less caffeine than the unprocessed cacao beans from which chocolate is made.',
      prompt: 'The manufacturer\'s response is flawed as a refutation of the health advocate\'s argument because it',
      options: [
        { key: 'A', text: 'Fails to address the issue of whether the level of caffeine in the candy bars sold by the manufacturer is enough to keep people addicted' },
        { key: 'B', text: 'Assumes without warrant that all unprocessed cacao beans contain a uniform amount of caffeine' },
        { key: 'C', text: 'Does not specify exactly how caffeine is lost in the manufacturing process' },
        { key: 'D', text: 'Treats the consumer health advocate\'s argument as though it were about each candy bar rather than about the manufacturer\'s candy in general' },
        { key: 'E', text: 'Merely contradicts the consumer health advocate\'s conclusion without giving any reason to believe that the advocate\'s reasoning is unsound' }
      ],
      correct: 'A'
    },

    // --- W-E1: Colorado River Trees (Weaken, Easy) ---
    {
      id: 'W-E1',
      type: 'cr',
      subtype: 'weaken',
      difficulty: 'easy',
      stem: 'In the arid land along the Colorado River, use of the river\'s water is strictly controlled: farms along the river each have a limited allocation that they are allowed to use for irrigation. But the trees that grow in narrow strips along the river\'s banks also use its water. Clearly, therefore, if farmers were to remove those trees, more water would be available for crop irrigation.',
      prompt: 'Which of the following, if true, most seriously weakens the argument?',
      options: [
        { key: 'A', text: 'The trees along the river\'s banks shelter it from the sun and wind, thereby greatly reducing the amount of water lost through evaporation.' },
        { key: 'B', text: 'Owners of farms along the river will probably not undertake the expense of cutting down trees along the banks unless they are granted a greater allocation of water in return.' },
        { key: 'C', text: 'Many of the tree species currently found along the river\'s banks are specifically adapted to growing in places where tree roots remain constantly wet.' },
        { key: 'D', text: 'The strip of land where trees grow along the river\'s banks would not be suitable for growing crops if the trees were removed.' },
        { key: 'E', text: 'The distribution of water allocations for irrigation is intended to prevent farms further upstream from using water needed by farms further downstream.' }
      ],
      correct: 'A'
    },

    // --- W-M1: Speed Humps in Ardane (Weaken, Medium) ---
    {
      id: 'W-M1',
      type: 'cr',
      subtype: 'weaken',
      difficulty: 'medium',
      stem: 'Ardane\'s transportation commission plans to install speed humps in residential neighborhoods to reduce traffic speed and enhance safety, based on their success in nearby towns.',
      prompt: 'Which of the following, if true, identifies a potentially serious drawback to the plan?',
      options: [
        { key: 'A', text: 'On residential streets without speed humps, many vehicles travel at speeds more than 25 percent above the posted speed limit.' },
        { key: 'B', text: 'Because of their high weight, emergency vehicles such as fire trucks and ambulances must slow almost to a stop at speed humps.' },
        { key: 'C', text: 'The residential speed limit in Ardane is higher than that of the nearby towns where speed humps were installed.' },
        { key: 'D', text: 'Motorists who are not familiar with the streets in Ardane\'s residential districts would be likely to encounter the speed humps unawares unless warned by signs and painted indicators.' },
        { key: 'E', text: 'Bicyclists generally prefer that speed humps be constructed so as to leave a space on the side of the road where bicycles can travel without going over the humps.' }
      ],
      correct: 'B'
    }

  ]

};

export const questions = [
  // ==========================================
  // PART 1: PREPOSITIONS (8 Questions)
  // ==========================================
  {
    id: 'prep_on',
    category: 'Prepositions',
    type: 'scene-with-text-choices',
    target: 'on',
    prompt: 'Where is the cat?',
    scene: { subject: 'cat', anchor: 'table', relation: 'on' },
    choices: ['UNDER THE TABLE', 'ON THE TABLE', 'IN THE TABLE'],
    answer: 1,
    cefr: 'A1'
  },
  {
    id: 'prep_under',
    category: 'Prepositions',
    type: 'scene-with-text-choices',
    target: 'under',
    prompt: 'Where is the ball?',
    scene: { subject: 'ball', anchor: 'table', relation: 'under' },
    choices: ['ON THE TABLE', 'UNDER THE TABLE', 'BEHIND THE TABLE'],
    answer: 1,
    cefr: 'A1'
  },
  {
    id: 'prep_in',
    category: 'Prepositions',
    type: 'picture-choices',
    target: 'in',
    prompt: 'Which picture shows the cat IN the box?',
    scenes: [
      { subject: 'cat', anchor: 'box', relation: 'in' },
      { subject: 'cat', anchor: 'box', relation: 'on' },
      { subject: 'cat', anchor: 'box', relation: 'under' }
    ],
    choices: ['A', 'B', 'C'],
    answer: 0,
    cefr: 'A1'
  },
  {
    id: 'prep_next_to',
    category: 'Prepositions',
    type: 'scene-with-text-choices',
    target: 'next to',
    prompt: 'Where is the dog?',
    scene: { subject: 'dog', anchor: 'box', relation: 'next to' },
    choices: ['IN THE BOX', 'NEXT TO THE BOX', 'UNDER THE BOX'],
    answer: 1,
    cefr: 'A1'
  },
  {
    id: 'prep_between',
    category: 'Prepositions',
    type: 'scene-with-text-choices',
    target: 'between',
    prompt: 'Where is the monster?',
    scene: { subject: 'monster', anchor: 'trees', relation: 'between' },
    choices: ['BETWEEN THE TREES', 'ON THE TREE', 'UNDER THE TREE'],
    answer: 0,
    cefr: 'A1'
  },
  {
    id: 'prep_behind',
    category: 'Prepositions',
    type: 'picture-choices',
    target: 'behind',
    prompt: 'Which picture shows the cat BEHIND the box?',
    scenes: [
      { subject: 'cat', anchor: 'box', relation: 'in front of' },
      { subject: 'cat', anchor: 'box', relation: 'behind' },
      { subject: 'cat', anchor: 'box', relation: 'on' }
    ],
    choices: ['A', 'B', 'C'],
    answer: 1,
    cefr: 'A1'
  },
  {
    id: 'prep_in_front_of',
    category: 'Prepositions',
    type: 'scene-with-text-choices',
    target: 'in front of',
    prompt: 'Where is the ball?',
    scene: { subject: 'ball', anchor: 'box', relation: 'in front of' },
    choices: ['BEHIND THE BOX', 'IN FRONT OF THE BOX', 'IN THE BOX'],
    answer: 1,
    cefr: 'A1'
  },
  {
    id: 'prep_near',
    category: 'Prepositions',
    type: 'scene-with-text-choices',
    target: 'near',
    prompt: 'Where is the ball?',
    scene: { subject: 'ball', anchor: 'table', relation: 'near' },
    choices: ['NEAR THE TABLE', 'ON THE TABLE', 'IN THE TABLE'],
    answer: 0,
    cefr: 'A1'
  },

  // ==========================================
  // PART 2: DIRECTIONS (8 Questions)
  // ==========================================
  {
    id: 'dir_left',
    category: 'Directions',
    type: 'direction-choice',
    target: 'left',
    prompt: 'Which way should the monster go to get the star?',
    scene: { type: 'path', direction: 'left', goal: 'star' },
    choices: ['⬅ LEFT', '➡ RIGHT', '⬆ UP'],
    answer: 0,
    cefr: 'A1'
  },
  {
    id: 'dir_right',
    category: 'Directions',
    type: 'direction-choice',
    target: 'right',
    prompt: 'Which way should the monster go to reach the treasure?',
    scene: { type: 'path', direction: 'right', goal: 'treasure' },
    choices: ['⬅ LEFT', '➡ RIGHT', '⬇ DOWN'],
    answer: 1,
    cefr: 'A1'
  },
  {
    id: 'dir_up',
    category: 'Directions',
    type: 'direction-choice',
    target: 'up',
    prompt: 'Which direction is the balloon floating?',
    scene: { type: 'path', direction: 'up', goal: 'cloud' },
    choices: ['⬇ DOWN', '⬅ LEFT', '⬆ UP'],
    answer: 2,
    cefr: 'A1'
  },
  {
    id: 'dir_down',
    category: 'Directions',
    type: 'direction-choice',
    target: 'down',
    prompt: 'Which way is the slide going?',
    scene: { type: 'path', direction: 'down', goal: 'ground' },
    choices: ['⬇ DOWN', '⬆ UP', '➡ RIGHT'],
    answer: 0,
    cefr: 'A1'
  },
  {
    id: 'dir_straight',
    category: 'Directions',
    type: 'direction-choice',
    target: 'go straight',
    prompt: 'Which instruction reaches the house?',
    scene: { type: 'path', direction: 'straight', goal: 'house' },
    choices: ['TURN LEFT', 'GO STRAIGHT', 'TURN RIGHT'],
    answer: 1,
    cefr: 'A1'
  },
  {
    id: 'dir_turn_left',
    category: 'Directions',
    type: 'direction-choice',
    target: 'turn left',
    prompt: 'The road turns to reach the star. What should you do?',
    scene: { type: 'turn', direction: 'turn_left', goal: 'star' },
    choices: ['TURN LEFT', 'TURN RIGHT', 'GO STRAIGHT'],
    answer: 0,
    cefr: 'A1'
  },
  {
    id: 'dir_turn_right',
    category: 'Directions',
    type: 'direction-choice',
    target: 'turn right',
    prompt: 'The path curves to reach the chest. What should you do?',
    scene: { type: 'turn', direction: 'turn_right', goal: 'treasure' },
    choices: ['TURN LEFT', 'GO STRAIGHT', 'TURN RIGHT'],
    answer: 2,
    cefr: 'A1'
  },
  {
    id: 'dir_maze',
    category: 'Directions',
    type: 'direction-choice',
    target: 'left',
    prompt: 'At the fork, which arrow points to the gold star?',
    scene: { type: 'fork', direction: 'left', goal: 'star' },
    choices: ['⬅ LEFT', '➡ RIGHT', '⬇ DOWN'],
    answer: 0,
    cefr: 'A1'
  }
];

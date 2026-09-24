/**
 * Educational Picture Preposition Challenges
 * 
 * Strict Schema:
 * - id: unique string
 * - type: "picture-choice"
 * - prompt: child-friendly question
 * - choices: exactly 3 items with { image: string, label: string }
 * - correctIndex: index of correct choice (0, 1, or 2)
 * - reward: gameplay reward unlocked ("FIREBALL", "HEAL", "SHIELD")
 */
export const questions = [
  {
    id: "prep_01",
    type: "picture-choice",
    prompt: "Where is the cat?",
    choices: [
      { image: "mini_cat_in_box", label: "IN" },
      { image: "mini_cat_on_box", label: "ON" },
      { image: "mini_cat_under_box", label: "UNDER" }
    ],
    correctIndex: 0, // IN
    reward: "FIREBALL"
  },
  {
    id: "prep_02",
    type: "picture-choice",
    prompt: "Which picture shows IN?",
    choices: [
      { image: "mini_cat_in_box", label: "IN" },
      { image: "mini_cat_on_box", label: "ON" },
      { image: "mini_cat_under_box", label: "UNDER" }
    ],
    correctIndex: 0, // IN
    reward: "FIREBALL"
  },
  {
    id: "prep_03",
    type: "picture-choice",
    prompt: "Which picture shows UNDER?",
    choices: [
      { image: "mini_cat_in_box", label: "IN" },
      { image: "mini_cat_on_box", label: "ON" },
      { image: "mini_cat_under_box", label: "UNDER" }
    ],
    correctIndex: 2, // UNDER
    reward: "FIREBALL"
  },
  {
    id: "prep_04",
    type: "picture-choice",
    prompt: "Where is the cat sitting?",
    choices: [
      { image: "mini_cat_under_box", label: "UNDER" },
      { image: "mini_cat_in_box", label: "IN" },
      { image: "mini_cat_on_box", label: "ON" }
    ],
    correctIndex: 2, // ON
    reward: "FIREBALL"
  },
  {
    id: "prep_05",
    type: "picture-choice",
    prompt: "Find the cat hiding UNDER the box!",
    choices: [
      { image: "mini_cat_on_box", label: "ON" },
      { image: "mini_cat_under_box", label: "UNDER" },
      { image: "mini_cat_in_box", label: "IN" }
    ],
    correctIndex: 1, // UNDER
    reward: "FIREBALL"
  },
  {
    id: "prep_06",
    type: "picture-choice",
    prompt: "Where is the kitten inside the box?",
    choices: [
      { image: "mini_cat_on_box", label: "ON" },
      { image: "mini_cat_in_box", label: "IN" },
      { image: "mini_cat_under_box", label: "UNDER" }
    ],
    correctIndex: 1, // IN
    reward: "FIREBALL"
  },
  {
    id: "prep_07",
    type: "picture-choice",
    prompt: "Which one shows the cat ON the box?",
    choices: [
      { image: "mini_cat_in_box", label: "IN" },
      { image: "mini_cat_under_box", label: "UNDER" },
      { image: "mini_cat_on_box", label: "ON" }
    ],
    correctIndex: 2, // ON
    reward: "FIREBALL"
  },
  {
    id: "prep_08",
    type: "picture-choice",
    prompt: "Where is the cat resting UNDER the box?",
    choices: [
      { image: "mini_cat_under_box", label: "UNDER" },
      { image: "mini_cat_on_box", label: "ON" },
      { image: "mini_cat_in_box", label: "IN" }
    ],
    correctIndex: 0, // UNDER
    reward: "FIREBALL"
  },
  {
    id: "prep_09",
    type: "picture-choice",
    prompt: "Look closely! Which picture shows IN?",
    choices: [
      { image: "mini_cat_in_box", label: "IN" },
      { image: "mini_cat_on_box", label: "ON" },
      { image: "mini_cat_under_box", label: "UNDER" }
    ],
    correctIndex: 0, // IN
    reward: "FIREBALL"
  },
  {
    id: "prep_10",
    type: "picture-choice",
    prompt: "Can you spot the cat ON the crate?",
    choices: [
      { image: "mini_cat_under_box", label: "UNDER" },
      { image: "mini_cat_on_box", label: "ON" },
      { image: "mini_cat_in_box", label: "IN" }
    ],
    correctIndex: 1, // ON
    reward: "FIREBALL"
  }
];

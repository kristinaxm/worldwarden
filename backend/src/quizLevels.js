// Everything that differs between the quiz difficulty levels lives here.
// The quiz code (questionService, resultService, resultController) is shared by all levels
// and reads from this config. Adding a level usually means adding an entry below.

const QUESTIONS_PER_QUIZ = 10

const LEVELS = {
  // Flag + 2 country names
  beginner: {
    optionCount: 2,
    answerField: 'country', // field in POST /api/results answers
    answerColumn: 'country_answer', // column in quiz_answers
    correctAnswer: (country) => country.name,
  },

  // Flag + 4 capitals
  medium: {
    optionCount: 4,
    answerField: 'capital',
    answerColumn: 'capital_answer',
    correctAnswer: (country) => country.capital,
  },
}

// Difficulties that can be played right now. Controllers use this to validate input.
const SUPPORTED_DIFFICULTIES = Object.keys(LEVELS)

module.exports = {
  QUESTIONS_PER_QUIZ,
  LEVELS,
  SUPPORTED_DIFFICULTIES,
}

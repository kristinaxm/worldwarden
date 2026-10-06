<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const difficulty = computed(() => route.params.difficulty)


//#region Mock-data until backend is done
const mockQuestions = [
  {
    country: 'Sverige',
    capital: 'Stockholm',
    flagUrl: 'https://flagcdn.com/w640/se.png',
    countryOptions: ['Sverige', 'Norge'],
    capitalOptions: ['Stockholm', 'Oslo', 'Köpenhamn', 'Helsingfors']
  },
  {
    country: 'Frankrike',
    capital: 'Paris',
    flagUrl: 'https://flagcdn.com/w640/fr.png',
    countryOptions: ['Frankrike', 'Belgien'],
    capitalOptions: ['Paris', 'Madrid', 'Rom', 'Berlin']
  },
  {
    country: 'Japan',
    capital: 'Tokyo',
    flagUrl: 'https://flagcdn.com/w640/jp.png',
    countryOptions: ['Japan', 'Sydkorea'],
    capitalOptions: ['Tokyo', 'Seoul', 'Peking', 'Bangkok']
  },
  {
    country: 'Kanada',
    capital: 'Ottawa',
    flagUrl: 'https://flagcdn.com/w640/ca.png',
    countryOptions: ['Kanada', 'USA'],
    capitalOptions: ['Ottawa', 'Toronto', 'Washington D.C.', 'Vancouver']
  },
  {
    country: 'Brasilien',
    capital: 'Brasília',
    flagUrl: 'https://flagcdn.com/w640/br.png',
    countryOptions: ['Brasilien', 'Argentina'],
    capitalOptions: ['Brasília', 'Buenos Aires', 'Lima', 'Santiago']
  },
  {
    country: 'Tyskland',
    capital: 'Berlin',
    flagUrl: 'https://flagcdn.com/w640/de.png',
    countryOptions: ['Tyskland', 'Österrike'],
    capitalOptions: ['Berlin', 'Wien', 'Prag', 'Amsterdam']
  },
  {
    country: 'Italien',
    capital: 'Rom',
    flagUrl: 'https://flagcdn.com/w640/it.png',
    countryOptions: ['Italien', 'Spanien'],
    capitalOptions: ['Rom', 'Madrid', 'Lissabon', 'Aten']
  },
  {
    country: 'Australien',
    capital: 'Canberra',
    flagUrl: 'https://flagcdn.com/w640/au.png',
    countryOptions: ['Australien', 'Nya Zeeland'],
    capitalOptions: ['Canberra', 'Sydney', 'Wellington', 'Melbourne']
  },
  {
    country: 'Spanien',
    capital: 'Madrid',
    flagUrl: 'https://flagcdn.com/w640/es.png',
    countryOptions: ['Spanien', 'Portugal'],
    capitalOptions: ['Madrid', 'Lissabon', 'Barcelona', 'Rom']
  },
  {
    country: 'Norge',
    capital: 'Oslo',
    flagUrl: 'https://flagcdn.com/w640/no.png',
    countryOptions: ['Norge', 'Danmark'],
    capitalOptions: ['Oslo', 'Stockholm', 'Köpenhamn', 'Helsingfors']
  },
  {
    country: 'Storbritannien',
    capital: 'London',
    flagUrl: 'https://flagcdn.com/w640/gb.png',
    countryOptions: ['Storbritannien', 'Irland'],
    capitalOptions: ['London', 'Dublin', 'Edinburgh', 'Manchester']
  },
  {
    country: 'Portugal',
    capital: 'Lissabon',
    flagUrl: 'https://flagcdn.com/w640/pt.png',
    countryOptions: ['Portugal', 'Spanien'],
    capitalOptions: ['Lissabon', 'Madrid', 'Porto', 'Rom']
  }
]
//#endregion


//#region Quiz state

const totalQuestions = 10

// Holds the 10 questions picked for this quiz.
const quizQuestions = ref([])

// Index 0 = question 1, index 1 = question 2, etc.
const questionIndex = ref(0)

// One element per question.
// null means the question has not been answered yet.
const answers = ref(
  Array(totalQuestions).fill(null)
)

const streak = ref(0)
const bestStreak = ref(0)

const selectedAnswer = ref('')
const countryAnswer = ref('')
const capitalAnswer = ref('')

const showExitModal = ref(false)

// The intro is shown until the user clicks "Starta quiz".
const quizStarted = ref(false)
const quizFinished = ref(false)

//#endregion


//#region Timer

// Elapsed time is calculated from startTime instead of counting up one second at a time.
// That keeps it correct even if the browser throttles the interval (e.g. in a background tab).
const startTime = ref(null)
const elapsedSeconds = ref(0)
let timerInterval = null

const formattedTime = computed(() => {
  return formatTime(elapsedSeconds.value)
})

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function updateElapsedTime() {
  elapsedSeconds.value = Math.floor(
    (Date.now() - startTime.value) / 1000
  )
}

function startTimer() {
  stopTimer()

  startTime.value = Date.now()
  elapsedSeconds.value = 0

  timerInterval = setInterval(updateElapsedTime, 1000)
}

function stopTimer() {
  if (!timerInterval) {
    return
  }

  clearInterval(timerInterval)
  timerInterval = null
}

// Stops timer when user leaves page
onBeforeUnmount(stopTimer)

//#endregion


//#region Difficulty

const difficultyInfo = computed(() => {
  const levels = {
    beginner: {
      label: 'NYBÖRJARE',
      category: 'FLAGGOR',
      title: 'Flaggor – Nybörjare',
      icon: '🚩',
      description: 'Du ser en flagga och väljer vilket land den tillhör.',
      answerType: '2 svarsalternativ'
    },

    medium: {
      label: 'MEDEL',
      category: 'HUVUDSTÄDER',
      title: 'Huvudstäder – Medel',
      icon: '🏛️',
      description: 'Du ser en flagga och väljer landets huvudstad.',
      answerType: '4 svarsalternativ'
    },

    advanced: {
      label: 'AVANCERAD',
      category: 'LÄNDER',
      title: 'Länder – Avancerad',
      icon: '🗺️',
      description: 'Du ser en flagga och skriver själv landets namn. Inga svarsalternativ!',
      answerType: 'Skriv landet'
    },

    expert: {
      label: 'EXPERT',
      category: 'LÄNDER',
      title: 'Länder & huvudstäder – Expert',
      icon: '🌍',
      description: 'Du ser en flagga och skriver både landets namn och dess huvudstad. Båda måste vara rätt.',
      answerType: 'Skriv land + huvudstad'
    }
  }

  return levels[difficulty.value] ?? levels.beginner
})

//#endregion


//#region Current question

const question = computed(() => {
  return quizQuestions.value[questionIndex.value]
})

const questionNumber = computed(() => {
  return questionIndex.value + 1
})

const isLastQuestion = computed(() => {
  return questionIndex.value === totalQuestions - 1
})

const canGoBack = computed(() => {
  return questionIndex.value > 0
})

const progress = computed(() => {
  if (!quizStarted.value) {
    return 0
  }

  return (questionNumber.value / totalQuestions) * 100
})

//#endregion


//#region Result

const score = computed(() => {
  return answers.value.filter(
    answer => answer?.isCorrect
  ).length
})

const wrongAnswers = computed(() => {
  return answers.value.filter(
    answer => answer && !answer.isCorrect
  ).length
})

const percentage = computed(() => {
  return Math.round(
    (score.value / totalQuestions) * 100
  )
})

// Icon, title and text on the result screen depend on how well the user did.
// The name is added to the title when the user is logged in.
const resultFeedback = computed(() => {
  const name = playerName.value ? `, ${playerName.value}` : ''

  if (percentage.value === 100) {
    return {
      icon: '🏆',
      title: `Grymt jobbat${name}!`,
      text: difficulty.value === 'expert'
        ? 'Alla rätt på expertnivå – du är en riktig världsmästare!'
        : 'Alla rätt – du är verkligen en expert! Dags att testa en svårare nivå?'
    }
  }

  if (percentage.value >= 70) {
    return {
      icon: '🥇',
      title: `Riktigt bra${name}!`,
      text: 'Du har bra koll. Bara några få missar från full pott!'
    }
  }

  if (percentage.value >= 40) {
    return {
      icon: '👍',
      title: `Bra kämpat${name}!`,
      text: 'Du är på god väg. Spela igen så sitter det snart ännu bättre.'
    }
  }

  if (percentage.value > 0) {
    return {
      icon: '🌱',
      title: `Fortsätt öva${name}!`,
      text: 'Alla börjar någonstans. Varje försök gör dig lite bättre – ge det ett nytt försök!'
    }
  }

  return {
    icon: '🧭',
    title: `Synd${name}, inga rätt den här gången!`,
    text: difficulty.value === 'beginner'
      ? 'Du kanske behöver träna lite mer. Spela igen – du lär dig för varje gång!'
      : 'Du kanske behöver träna lite mer. Testa gärna en lättare nivå först!'
  }
})

//#endregion


//#region Create quiz

function shuffleQuestions(questions) {
  const shuffled = [...questions]

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(
      Math.random() * (i + 1)
    )

    const temp = shuffled[i]
    shuffled[i] = shuffled[randomIndex]
    shuffled[randomIndex] = temp
  }

  return shuffled
}

function createQuiz() {

  // Picks 10 random UNIQUE questions.
  quizQuestions.value = shuffleQuestions(
    mockQuestions
  ).slice(0, totalQuestions)

  questionIndex.value = 0

  answers.value = Array(totalQuestions).fill(null)

  streak.value = 0
  bestStreak.value = 0

  selectedAnswer.value = ''
  countryAnswer.value = ''
  capitalAnswer.value = ''

  quizFinished.value = false
  showExitModal.value = false
}

function startQuiz() {
  quizStarted.value = true

  // The timer only starts when the user clicks "Starta quiz".
  startTimer()
}

//#endregion


//#region Previous results (intro)

/*
  TEMPORARY: Latest result and highscore are stored in the browser's
  localStorage, per user and difficulty.

  Once the backend is ready this is fetched from quiz_attempts instead,
  e.g. via GET /api/quiz/stats?difficulty=beginner.
  Guests don't save any results (same as the backend will work).
*/

const storedResults = ref(null)

const storageKey = computed(() => {
  if (!user.value) {
    return null
  }

  return `worldwarden:quiz-results:${user.value.id}:${difficulty.value}`
})

function loadStoredResults() {
  storedResults.value = null

  if (!storageKey.value) {
    return
  }

  try {
    storedResults.value = JSON.parse(
      localStorage.getItem(storageKey.value)
    )
  } catch {
    storedResults.value = null
  }
}

// Better = more correct answers. Same number correct = faster time.
function isBetterResult(result, previousBest) {
  if (!previousBest) {
    return true
  }

  if (result.score !== previousBest.score) {
    return result.score > previousBest.score
  }

  return result.seconds < previousBest.seconds
}

// Set when the quiz is finished and shown on the result screen.
const newHighscore = ref(false)
const previousBest = ref(null)

// E.g. "Lika många rätt, men 30 s snabbare!" or "2 fler rätt än ditt tidigare rekord!"
const highscoreReason = computed(() => {
  if (!newHighscore.value) {
    return ''
  }

  const moreCorrect = score.value - previousBest.value.score

  if (moreCorrect === 1) {
    return 'En rätt mer än ditt tidigare rekord!'
  }

  if (moreCorrect > 1) {
    return `${moreCorrect} fler rätt än ditt tidigare rekord!`
  }

  const fasterSeconds = previousBest.value.seconds - elapsedSeconds.value

  return `Lika många rätt, men ${formatDuration(fasterSeconds)} snabbare!`
})

function saveResult() {
  newHighscore.value = false
  previousBest.value = null

  if (!storageKey.value) {
    return
  }

  const result = {
    score: score.value,
    total: totalQuestions,
    seconds: elapsedSeconds.value
  }

  const previous = storedResults.value?.best ?? null
  const isBetter = isBetterResult(result, previous)

  // The first attempt doesn't count as a "new highscore" since there is no record to beat.
  previousBest.value = previous
  newHighscore.value = Boolean(previous) && isBetter

  const best = isBetter ? result : previous

  storedResults.value = { last: result, best }

  try {
    localStorage.setItem(
      storageKey.value,
      JSON.stringify(storedResults.value)
    )
  } catch {
    // localStorage can be blocked (e.g. private mode). Nothing is saved then.
  }
}

// Reload the results when the user logs in/out or the difficulty changes.
watch(storageKey, loadStoredResults, { immediate: true })

//#endregion


//#region Encouragement text (intro)

// Users only have an email so far, so we use the part before the @.
// Can be replaced with a real name once the users table has one.
const playerName = computed(() => {
  const name = user.value?.email.split('@')[0]

  if (!name) {
    return ''
  }

  return name.charAt(0).toUpperCase() + name.slice(1)
})

// E.g. 90 -> "1 min 30 s", 45 -> "45 s"
function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) {
    return `${seconds} s`
  }

  return `${minutes} min ${seconds} s`
}

const pepText = computed(() => {
  const best = storedResults.value?.best

  if (!user.value) {
    return 'Lycka till! Logga in om du vill spara dina resultat och jaga ett highscore.'
  }

  if (!best) {
    return `Första gången på den här nivån – lycka till, ${playerName.value}! Jag tror på dig!`
  }

  if (best.score === best.total) {
    return `Du har redan klarat alla rätt på ${formatDuration(best.seconds)}. ` +
      `Klarar du det ännu snabbare, ${playerName.value}? Kör hårt!`
  }

  return `Ditt highscore är ${best.score}/${best.total} rätt på ${formatDuration(best.seconds)}. ` +
    `Kom igen, du klarar att slå det! Jag tror på dig, ${playerName.value}!`
})

//#endregion


//#region Helpers

function normalizeAnswer(value) {
  return value
    ?.trim()
    .toLocaleLowerCase('sv-SE')
}

function selectAnswer(answer) {
  selectedAnswer.value = answer
}

function checkCurrentAnswer() {
  if (difficulty.value === 'beginner') {
    return (
      normalizeAnswer(selectedAnswer.value) ===
      normalizeAnswer(question.value.country)
    )
  }

  if (difficulty.value === 'medium') {
    return (
      normalizeAnswer(selectedAnswer.value) ===
      normalizeAnswer(question.value.capital)
    )
  }

  if (difficulty.value === 'advanced') {
    return (
      normalizeAnswer(countryAnswer.value) ===
      normalizeAnswer(question.value.country)
    )
  }

  if (difficulty.value === 'expert') {
    const countryCorrect =
      normalizeAnswer(countryAnswer.value) ===
      normalizeAnswer(question.value.country)

    const capitalCorrect =
      normalizeAnswer(capitalAnswer.value) ===
      normalizeAnswer(question.value.capital)

    return countryCorrect && capitalCorrect
  }

  return false
}

function resetInputs() {
  selectedAnswer.value = ''
  countryAnswer.value = ''
  capitalAnswer.value = ''
}

//#endregion


//#region Save answer

function saveCurrentAnswer({ skipped = false } = {}) {
  const isCorrect = skipped
    ? false
    : checkCurrentAnswer()

  let savedCountryAnswer = null
  let savedCapitalAnswer = null

  if (difficulty.value === 'beginner') {
    savedCountryAnswer = selectedAnswer.value
  }

  if (difficulty.value === 'medium') {
    savedCapitalAnswer = selectedAnswer.value
  }

  if (difficulty.value === 'advanced') {
    savedCountryAnswer = countryAnswer.value
  }

  if (difficulty.value === 'expert') {
    savedCountryAnswer = countryAnswer.value
    savedCapitalAnswer = capitalAnswer.value
  }

  // Important:
  // We use the index instead of push().
  // If the user goes back and changes their answer,
  // the old answer is replaced instead of adding a new one.
  answers.value[questionIndex.value] = {
    questionNumber: questionNumber.value,

    country: question.value.country,
    capital: question.value.capital,
    flagUrl: question.value.flagUrl,

    countryAnswer: savedCountryAnswer,
    capitalAnswer: savedCapitalAnswer,

    isCorrect,
    skipped
  }

  recalculateStreaks()
}

//#endregion


//#region Streak

function recalculateStreaks() {
  let currentStreak = 0
  let highestStreak = 0

  for (const answer of answers.value) {
    // Stop when we reach a question the user hasn't reached yet.
    if (!answer) {
      break
    }

    if (answer.isCorrect) {
      currentStreak++

      if (currentStreak > highestStreak) {
        highestStreak = currentStreak
      }
    } else {
      currentStreak = 0
    }
  }

  streak.value = currentStreak
  bestStreak.value = highestStreak
}

//#endregion


//#region Load previous answer

function loadSavedAnswer() {
  resetInputs()

  const savedAnswer =
    answers.value[questionIndex.value]

  if (!savedAnswer || savedAnswer.skipped) {
    return
  }

  if (difficulty.value === 'beginner') {
    selectedAnswer.value =
      savedAnswer.countryAnswer ?? ''
  }

  if (difficulty.value === 'medium') {
    selectedAnswer.value =
      savedAnswer.capitalAnswer ?? ''
  }

  if (difficulty.value === 'advanced') {
    countryAnswer.value =
      savedAnswer.countryAnswer ?? ''
  }

  if (difficulty.value === 'expert') {
    countryAnswer.value =
      savedAnswer.countryAnswer ?? ''

    capitalAnswer.value =
      savedAnswer.capitalAnswer ?? ''
  }
}

//#endregion


//#region Next question

function nextQuestion() {
  saveCurrentAnswer()

  if (isLastQuestion.value) {
    finishQuiz()
    return
  }

  questionIndex.value++

  loadSavedAnswer()
}

function submitAnswer() {
  nextQuestion()
}

//#endregion


//#region Skip question

function skipQuestion() {
  saveCurrentAnswer({
    skipped: true
  })

  if (isLastQuestion.value) {
    finishQuiz()
    return
  }

  questionIndex.value++

  loadSavedAnswer()
}

//#endregion


//#region Go back

function previousQuestion() {
  if (!canGoBack.value) {
    return
  }

  questionIndex.value--

  loadSavedAnswer()
}

//#endregion


//#region Finish quiz

function finishQuiz() {
  // Calculate the exact final time before stopping the timer.
  updateElapsedTime()
  stopTimer()

  quizFinished.value = true

  saveResult()

  /*
    Later, once the backend is connected,
    we send the finished quiz result from here.

    The backend will then be able to create:
    - quiz_attempts
    - quiz_answers

    elapsedSeconds can be sent along then,
    e.g. for score deductions when the quiz takes too long.
  */
}

//#endregion


//#region Play again

// "Spela igen" skips the intro and starts right away.
function restartQuiz() {
  createQuiz()
  startQuiz()
}

//#endregion


//#region Navigation

function goHome() {
  router.push('/')
}

//#endregion


//#region Exit quiz

// Nothing to lose in the intro or when the quiz is finished.
const quizInProgress = computed(() => {
  return quizStarted.value && !quizFinished.value
})

// Where the user tried to go (e.g. with the browser's back button).
// null = the close button, then we go to the home page.
let pendingRoute = null
let leaveConfirmed = false

function requestCloseQuiz() {
  if (!quizInProgress.value) {
    goHome()
    return
  }

  showExitModal.value = true
}

function continueQuiz() {
  showExitModal.value = false
  pendingRoute = null
}

function confirmCloseQuiz() {
  showExitModal.value = false
  stopTimer()

  answers.value =
    Array(totalQuestions).fill(null)

  leaveConfirmed = true
  router.push(pendingRoute?.fullPath ?? '/')
}

// The back button (and any other navigation away from the page) during a quiz
// is blocked and shows the "Avsluta quiz?" modal instead.
onBeforeRouteLeave((to) => {
  if (!quizInProgress.value || leaveConfirmed) {
    return true
  }

  pendingRoute = to
  showExitModal.value = true

  return false
})

// Reload or closed tab during a quiz. Browsers don't allow custom dialogs here,
// so the browser shows its own "Leave site?" prompt.
function warnBeforeUnload(event) {
  if (!quizInProgress.value) {
    return
  }

  event.preventDefault()
  // Required by some older browsers for the prompt to show.
  event.returnValue = ''
}

onMounted(() => {
  window.addEventListener('beforeunload', warnBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', warnBeforeUnload)
})

//#endregion


// Prepare the quiz when the page opens. It is started from the intro.
createQuiz()
</script>

<template>
  <main class="quiz-page">
    <section class="quiz-card">
      <header class="quiz-header">
        <div class="quiz-header__labels">
          <span class="quiz-category">
            {{ difficultyInfo.category }}
          </span>
          <span class="quiz-difficulty">
            {{ difficultyInfo.label }}
          </span>
        </div>
        <p class="quiz-counter">
          {{
            !quizStarted
              ? 'Redo att starta?'
              : quizFinished
                ? 'Quiz klart'
                : `Fråga ${questionNumber} av ${totalQuestions}`
          }}
        </p>
        <button class="quiz-close" type="button" aria-label="Stäng quiz" @click="requestCloseQuiz">
          ×
        </button>
      </header>

      <!-- PROGRESS -->
      <div class="quiz-progress">
        <div class="quiz-progress__value" :style="{ width: `${progress}%` }"/>
      </div>

      <!-- INTRO - SHOWN BEFORE THE QUIZ STARTS -->
      <div v-if="!quizStarted" class="intro-content">
        <div class="intro-icon" aria-hidden="true">
          {{ difficultyInfo.icon }}
        </div>
        <h1 class="intro-title">
          {{ difficultyInfo.title }}
        </h1>
        <p class="intro-description">
          {{ difficultyInfo.description }}
        </p>

        <!-- QUIZ FACTS -->
        <ul class="intro-facts">
          <li class="intro-facts__item">
            <span>Frågor</span>
            <strong>{{ totalQuestions }}</strong>
          </li>
          <li class="intro-facts__item">
            <span>Svar</span>
            <strong>{{ difficultyInfo.answerType }}</strong>
          </li>
          <li class="intro-facts__item">
            <span>Tid</span>
            <strong>Klockan startar när du börjar</strong>
          </li>
        </ul>

        <!-- PREVIOUS RESULTS - ONLY WHEN LOGGED IN AND HAS PLAYED BEFORE -->
        <div v-if="storedResults" class="intro-stats">
          <div class="intro-stats__item">
            <span>Senaste resultat</span>
            <strong>{{ storedResults.last.score }}/{{ storedResults.last.total }} rätt</strong>
            <small>{{ formatDuration(storedResults.last.seconds) }}</small>
          </div>
          <div class="intro-stats__item intro-stats__item--best">
            <span>🏆 Highscore</span>
            <strong>{{ storedResults.best.score }}/{{ storedResults.best.total }} rätt</strong>
            <small>{{ formatDuration(storedResults.best.seconds) }}</small>
          </div>
        </div>

        <p class="intro-pep">
          {{ pepText }}
        </p>

        <div class="intro-actions">
          <button type="button" class="button button--secondary" @click="goHome">
            ← Gå tillbaka
          </button>
          <button type="button" class="button button--primary" @click="startQuiz">
            Starta quiz
          </button>
        </div>
      </div>

      <!-- QUIZ RUNNING -->
      <template v-else-if="!quizFinished">

        <!-- BEGINNER -->
        <div v-if="difficulty === 'beginner'" class="quiz-content">
          <div class="quiz-flag-wrapper">
            <img :src="question.flagUrl" alt="Flagga" class="quiz-flag">
          </div>
          <h1 class="quiz-question">
            Vilket land tillhör denna flagga?
          </h1>
          <div class="answers answers--two">
            <button v-for="answer in question.countryOptions" :key="answer" type="button" class="answer-button" :class="{
                'answer-button--selected': selectedAnswer === answer
              }"
              @click="selectAnswer(answer)">
              {{ answer }}
            </button>
          </div>
        </div>

        <!-- MEDIUM -->
        <div v-else-if="difficulty === 'medium'" class="quiz-content">
          <div class="quiz-flag-wrapper">
            <img :src="question.flagUrl" alt="Flagga" class="quiz-flag">
          </div>
          <h1 class="quiz-question">
            Vilken huvudstad tillhör landet på flaggan?
          </h1>
          <div class="answers answers--four">
            <button v-for="answer in question.capitalOptions" :key="answer" type="button" class="answer-button" :class="{
                'answer-button--selected': selectedAnswer === answer
              }"
              @click="selectAnswer(answer)">
              {{ answer }}
            </button>
          </div>
        </div>

        <!-- ADVANCED -->
        <div v-else-if="difficulty === 'advanced'" class="quiz-content">
          <div class="quiz-flag-wrapper">
            <img :src="question.flagUrl" alt="Flagga" class="quiz-flag">
          </div>
          <h1 class="quiz-question">
            Vilket land är detta?
          </h1>
          <div class="text-answer">
            <label for="country">
              Skriv landets namn:
            </label>
            <input id="country" v-model="countryAnswer" type="text" placeholder="T.ex. Portugal" autocomplete="off">
          </div>

          <div class="quiz-form-actions">
            <!-- SHOW CLUE. SHOULD DO LATER? -->
            <button type="button" class="button button--secondary">
              Visa ledtråd
            </button>
            <button type="button" class="button button--primary" :disabled="!countryAnswer.trim()" @click="submitAnswer">
              {{
                isLastQuestion
                  ? 'Slutför quiz'
                  : 'Svara'
              }}
            </button>
          </div>
        </div>

        <!-- EXPERT -->
        <div v-else-if="difficulty === 'expert'" class="quiz-content">
          <div class="quiz-flag-wrapper">
            <img :src="question.flagUrl" alt="Flagga" class="quiz-flag">
          </div>
          <h1 class="quiz-question">
            Vilket land är detta?
          </h1>
          <div class="expert-fields">
            <div class="text-answer">
              <label for="expert-country">
                Skriv landets namn:
              </label>
              <input id="expert-country" v-model="countryAnswer" type="text" placeholder="T.ex. Portugal" autocomplete="off">
            </div>
            <div class="text-answer">
              <label for="expert-capital">
                Skriv landets huvudstad:
              </label>
              <input id="expert-capital" v-model="capitalAnswer" type="text" placeholder="T.ex. Lissabon" autocomplete="off">
            </div>
          </div>
          <div class="quiz-form-actions">
            <!-- SHOW CLUE. SHOULD DO LATER? -->
            <button type="button" class="button button--secondary">
              Visa ledtråd
            </button>
            <button type="button" class="button button--primary" :disabled="!countryAnswer.trim() || !capitalAnswer.trim()" @click="submitAnswer">
              {{
                isLastQuestion
                  ? 'Slutför quiz'
                  : 'Svara'
              }}
            </button>
          </div>
        </div>

        <!-- FOOTER UNDER QUIZ -->
        <footer class="quiz-footer">
          <!-- TIMER - TICKS FROM QUIZ START UNTIL QUIZ IS FINISHED -->
          <p class="quiz-timer">
            <span aria-hidden="true">⏱</span>
            Tid:
            <time role="timer" :datetime="`PT${elapsedSeconds}S`">{{ formattedTime }}</time>
          </p>
          <div class="quiz-footer__actions">
            <!-- GO BACK TO RECENT QUESTION -->
            <button v-if="canGoBack" type="button" class="button button--back" @click="previousQuestion">
              ← Gå tillbaka
            </button>
            <!-- SKIP QUESTION - FOR ALL DIFFICULTIES -->
            <button type="button" class="button button--skip" @click="skipQuestion">
              {{
                isLastQuestion
                  ? 'Hoppa över och slutför'
                  : 'Hoppa över'
              }}
            </button>

            <!-- NEXT QUESTION - JUST FOR BEGINNER / MEDIUM -->
            <button
              v-if="difficulty === 'beginner' || difficulty === 'medium'"
              type="button"
              class="button button--primary"
              :disabled="!selectedAnswer"
              @click="nextQuestion">
              {{
                isLastQuestion
                  ? 'Slutför quiz'
                  : 'Nästa fråga →'
              }}
            </button>
          </div>
        </footer>
      </template>

      <!-- RESULT -->
      <template v-else>
        <div class="result-content">
          <div class="result-trophy" aria-hidden="true">
            {{ resultFeedback.icon }}
          </div>
          <h1 class="result-title">
            {{ resultFeedback.title }}
          </h1>
          <p class="result-score">
            {{ score }} av {{ totalQuestions }} rätt
          </p>
          <p class="result-percentage">
            Du klarade {{ percentage }}%
          </p>
          <!-- NEW HIGHSCORE - ONLY WHEN AN EARLIER RECORD WAS BEATEN -->
          <div v-if="newHighscore" class="result-highscore" role="status">
            <strong>🎉 Nytt highscore!</strong>
            <span>{{ highscoreReason }}</span>
            <small>
              Tidigare rekord: {{ previousBest.score }}/{{ previousBest.total }} rätt på {{ formatDuration(previousBest.seconds) }}
            </small>
          </div>
          <p class="result-message">
            {{ resultFeedback.text }}
          </p>

          <!-- RESULT PER QUESTION -->
          <div class="result-questions">
            <div v-for="answer in answers" :key="answer.questionNumber" class="result-question" :class="{
                'result-question--correct': answer.isCorrect,
                'result-question--wrong': !answer.isCorrect
              }">
              <span class="result-question__icon">
                {{ answer.isCorrect ? '✓' : '×' }}
              </span>
              <span>
                Fråga {{ answer.questionNumber }}
              </span>
            </div>
          </div>

          <!-- SUMMARY OF FINISHED QUIZ -->
          <div class="result-summary">
            <div class="result-summary__item">
              <span>Rätt</span>
              <strong class="result-summary__correct">
                {{ score }}
              </strong>
            </div>
            <div class="result-summary__item">
              <span>Fel</span>
              <strong class="result-summary__wrong">
                {{ wrongAnswers }}
              </strong>
            </div>
            <div class="result-summary__item">
              <span>Bästa streak</span>
              <strong>
                {{ bestStreak }}
              </strong>
            </div>
            <div class="result-summary__item">
              <span>Tid</span>
              <strong class="result-summary__time">
                <time :datetime="`PT${elapsedSeconds}S`">{{ formattedTime }}</time>
              </strong>
            </div>
          </div>

          <!-- RESULT BUTTONS -->
          <div class="result-actions">
            <button type="button" class="button button--secondary" @click="goHome">
              Till startsidan
            </button>
            <button type="button" class="button button--primary" @click="restartQuiz">
              ↻ Spela igen
            </button>
          </div>
        </div>
      </template>
    </section>

    <!-- EXIT QUIZ MODAL -->
    <Teleport to="body">
      <div v-if="showExitModal" class="exit-modal-backdrop" @click.self="continueQuiz">
        <div class="exit-modal" role="dialog" aria-modal="true" aria-labelledby="exit-modal-title">
          <div class="exit-modal__icon">!</div>
          <h2 id="exit-modal-title">Avsluta quiz?</h2>
          <p>
            Är du säker på att du vill avsluta quizet?
            Dina svar och poäng från det här quizet kommer inte att sparas.
          </p>
          <div class="exit-modal__actions">
            <button type="button" class="exit-modal__continue" @click="continueQuiz">
              Fortsätt quizet
            </button>
            <button type="button" class="exit-modal__leave" @click="confirmCloseQuiz">
              Avsluta quiz
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </main>
</template>


<style scoped>
.quiz-page {
  min-height: 100vh;
  padding: 48px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--color-primary) 8%, transparent),
      transparent 35%
    ),
    var(--color-background);
  color: var(--color-text);

  .quiz-card {
    width: min(1100px, 100%);
    min-height: 680px;
    padding: 28px 34px 26px;
    display: flex;
    flex-direction: column;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 18px;
    box-shadow: var(--shadow-medium);

    /* HEADER */
    .quiz-header {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 20px;

      .quiz-header__labels {
        display: flex;
        align-items: center;
        gap: 10px;

        .quiz-category,
        .quiz-difficulty {
          padding: 8px 13px;
          border-radius: 7px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .quiz-category {
          color: var(--color-text);
          background: var(--color-surface);
          border: 1px solid var(--color-border-strong);
        }

        .quiz-difficulty {
          color: white;
          background: var(--color-primary);
        }
      }

      .quiz-counter {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--color-text-secondary);
      }

      .quiz-close {
        justify-self: end;
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border: 1px solid var(--color-border-strong);
        border-radius: 9px;
        background: var(--color-surface);
        color: var(--color-text);
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
        transition:
          background 0.2s ease,
          color 0.2s ease,
          border-color 0.2s ease;

        &:hover {
          color: white;
          background: var(--color-primary);
          border-color: var(--color-primary);
        }
      }
    }

    /* PROGRESS */
    .quiz-progress {
      width: 100%;
      height: 10px;
      margin-top: 20px;
      overflow: hidden;
      background: var(--color-border);
      border-radius: 999px;

      .quiz-progress__value {
        height: 100%;
        background: var(--color-primary);
        border-radius: inherit;
        transition: width 0.35s ease;
      }
    }

    /* QUIZ CONTENT */
    .quiz-content {
      flex: 1;
      width: min(800px, 100%);
      margin: 0 auto;
      padding: 42px 0 30px;
      display: flex;
      flex-direction: column;
      align-items: center;

      .quiz-flag-wrapper {
        width: 260px;
        height: 170px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: var(--color-surface-soft);
        border: 1px solid var(--color-border);
        border-radius: 14px;
        box-shadow: var(--shadow-medium);

        .quiz-flag {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .quiz-question {
        margin: 26px 0 32px;
        text-align: center;
        font-size: clamp(1.45rem, 2vw, 2rem);
        line-height: 1.25;
        color: var(--color-text);
      }

      /* MULTIPLE CHOICE */
      .answers {
        width: 100%;
        display: grid;
        gap: 16px;

        &.answers--two,
        &.answers--four {
          grid-template-columns: repeat(2, 1fr);
        }

        .answer-button {
          min-height: 70px;
          padding: 16px 24px;
          background: var(--color-surface);
          color: var(--color-text);
          border: 2px solid var(--color-border-strong);
          border-radius: 12px;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;

          &:hover {
            transform: translateY(-2px);
            border-color: var(--color-primary);
            box-shadow: 0 7px 18px color-mix(in srgb, var(--color-primary) 10%, transparent);
          }

          &.answer-button--selected {
            color: white;
            background: var(--color-primary);
            border-color: var(--color-primary);
          }
        }
      }

      /* TEXT ANSWERS */
      .text-answer {
        width: min(520px, 100%);
        display: flex;
        flex-direction: column;
        gap: 8px;

        label {
          font-size: 0.86rem;
          font-weight: 700;
          color: var(--color-text-secondary);
        }

        input {
          width: 100%;
          height: 58px;
          padding: 0 18px;
          border: 2px solid var(--color-border-strong);
          border-radius: 10px;
          background: var(--color-surface);
          color: var(--color-text);
          font: inherit;
          font-size: 1rem;
          outline: none;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;

          &:focus {
            border-color: var(--color-primary);
            box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 12%, transparent);
          }
        }
      }

      .expert-fields {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
      }

      .quiz-form-actions {
        margin-top: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }
    }

    /* BUTTONS */
    .button {
      min-height: 46px;
      padding: 0 23px;
      border-radius: 999px;
      font: inherit;
      font-weight: 750;
      cursor: pointer;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        background 0.2s ease;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
      }

      &.button--primary {
        border: none;
        color: white;
        background: var(--color-primary);
        box-shadow: 0 5px 14px color-mix(in srgb, var(--color-primary) 20%, transparent);

        &:hover:not(:disabled) {
          background: var(--color-primary-dark);
        }

        &:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      }

      &.button--secondary {
        color: var(--color-primary-dark);
        background: var(--color-surface);
        border: 2px solid var(--color-primary);

        &:hover {
          background: var(--color-primary-light);
        }
      }

      &.button--skip {
        color: var(--color-text);
        background: var(--color-surface);
        border: 1px solid var(--color-border-strong);

        &:hover {
          background: var(--color-surface-soft);
        }
      }

      &.button--back {
        color: var(--color-primary-dark);
        background: var(--color-surface);
        border: 1px solid var(--color-border-strong);

        &:hover {
          background: var(--color-primary-light);
        }
      }
    }

    /* QUIZ FOOTER */
    .quiz-footer {
      min-height: 58px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      border-top: 1px solid var(--color-border);
      padding-top: 20px;

      .quiz-timer {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: 0.9rem;

        time {
          color: var(--color-primary);
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
      }

      .quiz-footer__actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
      }
    }

    /* INTRO */
    .intro-content {
      flex: 1;
      width: min(720px, 100%);
      margin: 0 auto;
      padding: 36px 0 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;

      .intro-icon {
        margin-bottom: 10px;
        font-size: 3.5rem;
        line-height: 1;
      }

      .intro-title {
        margin: 0;
        color: var(--color-text);
        font-size: clamp(1.6rem, 2.4vw, 2.1rem);
        line-height: 1.2;
      }

      .intro-description {
        max-width: 520px;
        margin: 10px 0 26px;
        color: var(--color-text-secondary);
        font-size: 1.05rem;
        line-height: 1.55;
      }

      .intro-facts {
        width: 100%;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        list-style: none;

        .intro-facts__item {
          padding: 14px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: var(--color-surface-soft);
          border: 1px solid var(--color-border);
          border-radius: 12px;

          span {
            color: var(--color-text-secondary);
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          strong {
            color: var(--color-text);
            font-size: 0.95rem;
          }
        }
      }

      .intro-stats {
        width: 100%;
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;

        .intro-stats__item {
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 12px;

          span {
            color: var(--color-text-secondary);
            font-size: 0.85rem;
            font-weight: 700;
          }

          strong {
            color: var(--color-text);
            font-size: 1.5rem;
          }

          small {
            color: var(--color-text-secondary);
            font-size: 0.85rem;
          }

          &.intro-stats__item--best {
            background: var(--color-accent-light);
            border-color: var(--color-accent);

            strong {
              color: var(--color-accent-dark);
            }
          }
        }
      }

      .intro-pep {
        max-width: 560px;
        margin: 22px 0 26px;
        padding: 14px 18px;
        background: var(--color-primary-light);
        color: var(--color-primary-dark);
        border-radius: 12px;
        font-weight: 700;
        line-height: 1.5;
      }

      .intro-actions {
        width: 100%;
        margin-top: auto;
        padding-top: 20px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        border-top: 1px solid var(--color-border);
      }
    }

    /* RESULT */
    .result-content {
      flex: 1;
      width: 100%;
      padding: 28px 0 4px;
      display: flex;
      flex-direction: column;
      align-items: center;

      .result-trophy {
        margin-bottom: 8px;
        font-size: 4rem;
        line-height: 1;
      }

      .result-title {
        margin: 0;
        color: var(--color-text);
        font-size: 2rem;
        text-align: center;
      }

      .result-score {
        margin: 10px 0 0;
        color: var(--color-primary);
        font-size: 2rem;
        font-weight: 800;
      }

      .result-percentage {
        margin: 4px 0 0;
        color: var(--color-text-secondary);
        font-size: 1.05rem;
      }

      .result-highscore {
        max-width: 560px;
        margin-top: 14px;
        padding: 14px 22px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        background: var(--color-accent-light);
        border: 2px solid var(--color-accent);
        border-radius: 12px;
        color: var(--color-accent-dark);
        text-align: center;
        animation: highscorePop 0.5s ease;

        strong {
          font-size: 1.3rem;
        }

        span {
          font-weight: 700;
        }

        small {
          font-size: 0.85rem;
          opacity: 0.85;
        }
      }

      .result-message {
        max-width: 560px;
        margin: 14px 0 26px;
        padding: 12px 18px;
        background: var(--color-primary-light);
        color: var(--color-primary-dark);
        border-radius: 12px;
        font-weight: 700;
        line-height: 1.5;
        text-align: center;
      }

      /* Questions */
      .result-questions {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 12px;

        .result-question {
          min-height: 58px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--color-surface-soft);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          font-weight: 700;

          .result-question__icon {
            width: 34px;
            height: 34px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            color: white;
            border-radius: 50%;
            font-size: 1.15rem;
            font-weight: 800;
          }

          &.result-question--correct .result-question__icon {
            background: var(--color-success);
          }

          &.result-question--wrong .result-question__icon {
            background: var(--color-danger);
          }
        }
      }

      /* Statistics */
      .result-summary {
        width: 100%;
        margin-top: 24px;
        padding: 20px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        background: var(--color-surface-soft);
        border-radius: 14px;

        .result-summary__item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          color: var(--color-text-secondary);

          &:not(:last-child) {
            border-right: 1px solid var(--color-border);
          }

          strong {
            color: var(--color-text);
            font-size: 1.8rem;

            &.result-summary__correct {
              color: var(--color-success);
            }

            &.result-summary__wrong {
              color: var(--color-danger);
            }
          }
        }
      }

      /* Result buttons */
      .result-actions {
        width: 100%;
        margin-top: 22px;
        padding-top: 20px;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        border-top: 1px solid var(--color-border);
      }
    }
  }
}

/* EXIT MODAL */
/* Outside .quiz-page because the modal is teleported to <body> */
.exit-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--color-backdrop);
  backdrop-filter: blur(3px);

  .exit-modal {
    width: min(440px, 100%);
    padding: 32px;
    text-align: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 18px;
    box-shadow: 0 24px 60px rgb(0 0 0 / 0.2);

    .exit-modal__icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--color-accent-light);
      color: var(--color-accent-dark);
      font-size: 1.4rem;
      font-weight: 800;
    }

    h2 {
      margin: 0 0 12px;
      color: var(--color-text);
      font-size: 1.5rem;
    }

    p {
      margin: 0;
      color: var(--color-text-secondary);
      line-height: 1.6;
    }

    .exit-modal__actions {
      margin-top: 26px;
      display: flex;
      justify-content: center;
      gap: 12px;

      .exit-modal__continue,
      .exit-modal__leave {
        min-height: 46px;
        padding: 0 20px;
        border-radius: 999px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .exit-modal__continue {
        color: white;
        background: var(--color-primary);
        border: 2px solid var(--color-primary);

        &:hover {
          background: var(--color-primary-dark);
          border-color: var(--color-primary-dark);
        }
      }

      .exit-modal__leave {
        color: var(--color-danger-dark);
        background: var(--color-surface);
        border: 2px solid color-mix(in srgb, var(--color-danger-dark) 35%, white);

        &:hover {
          background: var(--color-danger-light);
        }
      }
    }
  }
}


/* NEW HIGHSCORE - small "pop" when the box appears */
@keyframes highscorePop {
  0% {
    opacity: 0;
    transform: scale(0.85);
  }

  70% {
    transform: scale(1.04);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}


/* MEDIA QUERIES */
@media (max-width: 900px) {
  .quiz-page {
    .quiz-card {
      .result-content {
        .result-questions {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    }
  }
}

@media (max-width: 700px) {
  .quiz-page {
    align-items: flex-start;
    padding: 14px;

    .quiz-card {
      min-height: calc(100vh - 28px);
      padding: 20px 18px;
      border-radius: 14px;

      .quiz-header {
        grid-template-columns: 1fr auto;

        .quiz-counter {
          grid-row: 2;
          grid-column: 1 / -1;
          justify-self: center;
        }
      }

      .quiz-content {
        padding-top: 32px;

        .quiz-flag-wrapper {
          width: 220px;
          height: 145px;
        }

        .answers {
          &.answers--two,
          &.answers--four {
            grid-template-columns: 1fr;
          }

          .answer-button {
            min-height: 60px;
          }
        }
      }

      .quiz-footer {
        align-items: stretch;
        flex-direction: column-reverse;

        .quiz-timer {
          text-align: center;
        }

        .quiz-footer__actions {
          width: 100%;
          flex-direction: column;
          align-items: stretch;
        }

        .button {
          width: 100%;
        }
      }

      .intro-content {
        padding-top: 24px;

        .intro-facts {
          grid-template-columns: 1fr;
        }

        .intro-actions {
          flex-direction: column-reverse;

          .button {
            width: 100%;
          }
        }
      }

      .result-content {
        .result-summary {
          grid-template-columns: 1fr;
          gap: 18px;

          .result-summary__item:not(:last-child) {
            padding-bottom: 18px;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
          }
        }

        .result-actions {
          flex-direction: column;

          .button {
            width: 100%;
          }
        }
      }
    }
  }
}

@media (max-width: 500px) {
  .quiz-page {
    .quiz-card {
      .result-content {
        .result-questions {
          grid-template-columns: 1fr;
        }
      }
    }
  }

  .exit-modal-backdrop {
    .exit-modal {
      .exit-modal__actions {
        flex-direction: column;

        .exit-modal__continue,
        .exit-modal__leave {
          width: 100%;
        }
      }
    }
  }
}
</style>

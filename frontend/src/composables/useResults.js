import { ref } from 'vue'

// TODO: byt ut mot riktiga resultat från backend när endpointen finns
// Varje fråga har antingen en bild (flaggor) eller en text (t.ex. huvudstäder: "Frankrike")
export function useResults() {
  const results = ref([
    {
      id: 1,
      category: 'Flaggor',
      difficulty: 'Nybörjare',
      playedAt: '2026-10-05T18:20:00Z',
      score: 8,
      wrong: 2,
      totalQuestions: 10,
      percentage: 80,
      bestStreak: 5,
      time: '1 min 24 s',
      questions: [
        { image: 'https://flagcdn.com/w80/se.png', subject: null, correctAnswer: 'Sverige', answer: 'Sverige' },
        { image: 'https://flagcdn.com/w80/jp.png', subject: null, correctAnswer: 'Japan', answer: 'Japan' },
        { image: 'https://flagcdn.com/w80/hu.png', subject: null, correctAnswer: 'Ungern', answer: 'Bulgarien' },
        { image: 'https://flagcdn.com/w80/br.png', subject: null, correctAnswer: 'Brasilien', answer: 'Brasilien' },
        { image: 'https://flagcdn.com/w80/ca.png', subject: null, correctAnswer: 'Kanada', answer: 'Kanada' },
        { image: 'https://flagcdn.com/w80/it.png', subject: null, correctAnswer: 'Italien', answer: 'Italien' },
        { image: 'https://flagcdn.com/w80/no.png', subject: null, correctAnswer: 'Norge', answer: 'Norge' },
        { image: 'https://flagcdn.com/w80/es.png', subject: null, correctAnswer: 'Spanien', answer: 'Spanien' },
        { image: 'https://flagcdn.com/w80/at.png', subject: null, correctAnswer: 'Österrike', answer: 'Lettland' },
        { image: 'https://flagcdn.com/w80/fr.png', subject: null, correctAnswer: 'Frankrike', answer: 'Frankrike' },
      ],
    },
  ])

  return { results }
}

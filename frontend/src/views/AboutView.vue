<script setup>
import { CONTACT_EMAIL } from '@/contact'

const PARTNERS = [
  {
    icon: '🍎',
    title: 'Lärare',
    text: 'Gör lektionerna mer interaktiva och låt eleverna testa sina kunskaper på ett roligt sätt.',
  },
  {
    icon: '🏫',
    title: 'Skolor',
    text: 'Ge alla elever på skolan möjlighet att lära sig och utvecklas tillsammans.',
  },
  {
    icon: '🏛️',
    title: 'Kommuner',
    text: 'Gör lärandet roligare och mer tillgängligt i kommunens skolor.',
  },
]

const CLASSROOM_IDEAS = [
  {
    title: 'Uppvärmning',
    text: 'Starta lektionen med ett quiz på helskärm och svara tillsammans i klassen.',
  },
  {
    title: 'Repetition',
    text: 'Låt eleverna öva hemma eller när de blir klara med en uppgift.',
  },
  {
    title: 'Klassutmaning',
    text: 'Eleverna skapar konton och tävlar mot varandra på topplistan.',
  },
  {
    title: 'Olika nivåer',
    text: 'Alla börjar på Nybörjare och låser upp svårare nivåer allt eftersom.',
  },
]

const FAQ = [
  {
    question: 'Behöver eleverna ett konto?',
    answer:
      'Nej, nivån Nybörjare går att spela direkt som gäst. Med ett konto sparas resultat, XP och medaljer, och fler nivåer låses upp.',
  },
  {
    question: 'Vad behövs för att spela?',
    answer: 'Bara en webbläsare. WorldWarden fungerar på dator, surfplatta och mobil.',
  },
  {
    question: 'Syns elevernas e-postadresser?',
    answer: 'Nej. På topplistorna visas bara visningsnamn och avatar.',
  },
  {
    question: 'Kan en hel skola eller kommun använda appen?',
    answer: 'Ja, absolut. Kontakta oss så berättar vi mer om hur ni kan komma igång.',
  },
]
</script>

<template>
  <section class="about">
    <div class="about__header">
      <h2>Om oss</h2>
      <p>Samarbeta med oss</p>
    </div>

    <div class="about__intro">
      <span class="about__intro-icon" aria-hidden="true">🌍</span>
      <div>
        <h3>Ta quizet till klassrummet!</h3>
        <p>
          Vill du göra undervisningen lite roligare, mer interaktiv och engagerande? Vi vill att fler elever ska få
          möjlighet att lära sig genom quiz och utmana sina kunskaper på ett roligt sätt.
        </p>
        <p>Därför välkomnar vi lärare, skolor och kommuner som vill använda vår quizapp i sin verksamhet.</p>
      </div>
    </div>

    <div class="about__free">
      <span class="about__free-icon" aria-hidden="true">🎁</span>
      <div>
        <h3>Helt kostnadsfritt!</h3>
        <p>
          Vår ambition är att göra kunskap tillgänglig och lärande roligt för alla. Skolor och lärare ska kunna använda
          appen utan kostnad och ge eleverna möjlighet att testa sina kunskaper, utvecklas och lära tillsammans.
        </p>
      </div>
    </div>

    <h3 class="about__title">Vem kan samarbeta med oss?</h3>
    <ul class="about__partners">
      <li v-for="partner in PARTNERS" :key="partner.title" class="about__partner">
        <span class="about__partner-icon" aria-hidden="true">{{ partner.icon }}</span>
        <strong>{{ partner.title }}</strong>
        <p>{{ partner.text }}</p>
      </li>
    </ul>

    <h3 class="about__title">Så kan quizet användas i undervisningen</h3>
    <div class="about__classroom">
      <ol class="about__ideas">
        <li v-for="idea in CLASSROOM_IDEAS" :key="idea.title">
          <strong>{{ idea.title }}</strong>
          <p>{{ idea.text }}</p>
        </li>
      </ol>

      <div class="about__contact">
        <span class="about__contact-icon" aria-hidden="true">✉️</span>
        <h4>Vill du använda appen på din skola?</h4>
        <p>
          Vi berättar gärna mer om hur appen fungerar och hur den kan användas i undervisningen. Oavsett om du är
          lärare, representerar en skola eller arbetar inom en kommun är du varmt välkommen att kontakta oss.
        </p>
        <a :href="`mailto:${CONTACT_EMAIL}`" class="about__contact-button">Kontakta oss</a>
        <small>{{ CONTACT_EMAIL }}</small>
      </div>
    </div>

    <!-- FAQ -->
    <h3 class="about__title">Vanliga frågor</h3>
    <div class="about__faq">
      <details v-for="item in FAQ" :key="item.question">
        <summary>{{ item.question }}</summary>
        <p>{{ item.answer }}</p>
      </details>
    </div>

    <p class="about__closing">Låt oss göra lärandet lite roligare tillsammans! 🌍</p>
  </section>
</template>

<style scoped>
.about {
  padding: 22px;
  container: about / inline-size;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-small);

  p,
  h4 {
    margin: 0;
    line-height: 1.5;
  }
}

/* HEADER */
.about__header {
  margin-bottom: 18px;

  h2 {
    margin-bottom: 6px;
    font-size: 24px;
  }

  p {
    color: var(--color-primary);
    font-size: 16px;
    font-weight: 700;
  }
}

.about__title {
  margin: 28px 0 12px;
  font-size: 18px;
}

.about__intro,
.about__free {
  padding: 18px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border-radius: var(--radius-medium);

  h3 {
    margin-bottom: 6px;
    font-size: 18px;
  }

  p {
    max-width: 75ch;
  }

  p + p {
    margin-top: 8px;
  }
}

.about__intro {
  background: var(--color-primary-light);

  h3 {
    color: var(--color-primary-dark);
  }
}

.about__free {
  margin-top: 12px;
  border: 1px solid var(--color-accent);
  background: var(--color-accent-light);

  h3 {
    color: var(--color-accent-dark);
  }
}

.about__intro-icon,
.about__free-icon {
  font-size: 40px;
  line-height: 1;
}

.about__partners {
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  list-style: none;
}

.about__partner {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  background: var(--color-surface-soft);

  p {
    color: var(--color-text-secondary);
    font-size: 14px;
  }
}

.about__partner-icon {
  margin-bottom: 4px;
  font-size: 28px;
}

.about__classroom {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 16px;
}

.about__ideas {
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
  list-style: none;
  counter-reset: idea;

  li {
    padding: 12px 14px 12px 56px;
    position: relative;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-medium);
    counter-increment: idea;

    &::before {
      content: counter(idea);
      width: 28px;
      height: 28px;
      position: absolute;
      top: 12px;
      left: 14px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      font-size: 14px;
      font-weight: 700;
    }
  }

  p {
    color: var(--color-text-secondary);
    font-size: 14px;
  }
}

.about__contact {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  align-self: start;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-medium);
  background: var(--color-primary-light);
  text-align: center;

  h4 {
    color: var(--color-primary-dark);
    font-size: 17px;
  }

  p {
    color: var(--color-text-secondary);
    font-size: 14px;
  }

  small {
    color: var(--color-primary-dark);
    font-weight: 700;
    overflow-wrap: anywhere;
  }
}

.about__contact-icon {
  font-size: 32px;
}

.about__contact-button {
  margin-top: 4px;
  padding: 10px 20px;
  border-radius: 999px;
  background: var(--color-primary);
  color: white;
  font-weight: 700;
  transition: background 0.15s ease;

  &:hover {
    background: var(--color-primary-dark);
  }

  &:focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.about__faq {
  display: grid;
  gap: 8px;

  details {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-medium);

    &[open] summary::after {
      transform: rotate(-135deg);
    }
  }

  summary {
    padding: 14px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    font-weight: 700;
    cursor: pointer;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    &::after {
      content: '';
      width: 8px;
      height: 8px;
      margin-right: 4px;
      flex-shrink: 0;
      border-right: 2px solid var(--color-primary);
      border-bottom: 2px solid var(--color-primary);
      transform: rotate(45deg);
      transition: transform 0.2s ease;
    }

    &:hover {
      color: var(--color-primary-dark);
    }

    &:focus-visible {
      outline: 3px solid var(--color-primary);
      outline-offset: -3px;
      border-radius: var(--radius-medium);
    }
  }

  p {
    padding: 0 16px 14px;
    color: var(--color-text-secondary);
  }
}

.about .about__closing {
  margin-top: 28px;
  color: var(--color-primary);
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}

@container about (max-width: 640px) {
  .about__classroom {
    grid-template-columns: 1fr;
  }

  .about__intro,
  .about__free {
    flex-direction: column;
    gap: 10px;
  }
}

@media (max-width: 700px) {
  .about {
    padding: 18px;
  }
}
</style>

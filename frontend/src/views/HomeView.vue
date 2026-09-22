<script setup>
import flagsImage from '@/assets/images/quizhero/flaggor.png'
import capitalsImage from '@/assets/images/quizhero/huvudstäder.png'
import countriesImage from '@/assets/images/quizhero/länder.png'
import continentsImage from '@/assets/images/quizhero/världsdelar.png'
import seasLakesImage from '@/assets/images/quizhero/havochsjöar.png'
const quizCards = [
  {
    title: 'Flaggor',
    description: 'Lär dig flaggor från hela världen.',
    difficulty: 'Lätt',
    image: flagsImage,
  },
  {
    title: 'Huvudstäder',
    description: 'Matcha land med rätt huvudstad.',
    difficulty: 'Medel',
    image: capitalsImage,
  },
  {
    title: 'Länder',
    description: 'Lär dig känna igen olika länder.',
    difficulty: 'Medel',
    image: countriesImage,
  },
  {
    title: 'Världsdelar',
    description: 'Utforska jordens kontinenter.',
    difficulty: 'Lätt',
    image: continentsImage,
  },
  {
    title: 'Hav & Sjöar',
    description: 'Upptäck hav, sjöar och vattenområden.',
    difficulty: 'Svår',
    image: seasLakesImage,
  },
  {
    title: 'Världsdelar',
    description: 'Utforska jordens kontinenter.',
    difficulty: 'Lätt',
    image: continentsImage,
  },
  {
    title: 'Hav & Sjöar',
    description: 'Upptäck hav, sjöar och vattenområden.',
    difficulty: 'Svår',
    image: seasLakesImage,
  },{
    title: 'Världsdelar',
    description: 'Utforska jordens kontinenter.',
    difficulty: 'Lätt',
    image: continentsImage,
  },
  {
    title: 'Hav & Sjöar',
    description: 'Upptäck hav, sjöar och vattenområden.',
    difficulty: 'Svår',
    image: seasLakesImage,
  },{
    title: 'Världsdelar',
    description: 'Utforska jordens kontinenter.',
    difficulty: 'Lätt',
    image: continentsImage,
  }
]
</script>

<template>
  <div class="home">

    <!-- ABOUT SECTION -->
    <section class="home-card about-card">
      <div class="about-card__intro">
        <h2>Om WorldWarden</h2>
        <p class="about-card__tagline">Lär dig världen – ett quiz i taget.</p>
        <p class="about-card__description">
          WorldWarden är ett geografiquiz där du kan testa dina kunskaper,
          upptäcka nya delar av världen och utvecklas i din egen takt.
          Välj bland olika kategorier och svårighetsgrader och följ dina framsteg över tid.
        </p>
      </div>

      <div class="features">
        <div class="feature">
          <div class="feature__icon">🌍</div>
          <strong>Utforska olika quiz</strong>
          <span>Träna på flaggor, länder, huvudstäder, världsdelar och mer.</span>
        </div>
        <div class="feature">
          <div class="feature__icon">✅</div>
          <strong>Lär dig världen</strong>
          <span>Utmana dig själv och bygg upp dina geografikunskaper steg för steg.</span>
        </div>
        <div class="feature">
          <div class="feature__icon">❓</div>
          <strong>Välj din nivå</strong>
          <span>Anpassa svårighetsgraden efter dina egna kunskaper och mål.</span>
        </div>
        <div class="feature">
          <div class="feature__icon">🏅</div>
          <strong>Följ dina framsteg</strong>
          <span>Samla medaljer och se hur dina resultat utvecklas över tid.</span>
        </div>
      </div>
    </section>

    <!-- QUIZ SECTION -->
    <section class="home-card quiz-section">
      <div class="quiz-section__header">
        <h2>
          Exempel på quiz och nivåval
        </h2>
        <div class="difficulty-filter">
          <span>Nivåer</span>
          <button class="difficulty-filter__active">
            All
          </button>
          <button>Lätt</button>
          <button>Medel</button>
          <button>Svår</button>
        </div>
      </div>
      <div class="quiz-grid">
        <article v-for="quiz in quizCards" :key="quiz.title" class="quiz-card">
          <div class="quiz-card__image" :style="{ backgroundImage: `url(${quiz.image})` }"></div>
          <div class="quiz-card__content">
            <h3>{{ quiz.title }}</h3>
            <p>{{ quiz.description }}</p>
            <small>Nivå: {{ quiz.difficulty }}</small>
            <button class="quiz-card__button">
              Spela quiz
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 14px;

  /* ABOUT SECTION */
  .about-card {

    .about-card__intro {
      max-width: 760px;
      margin-bottom: 24px;

      h2 {
        margin-bottom: 6px;
      }

      .about-card__tagline {
        margin-bottom: 8px;
        color: var(--color-primary);
        font-size: 16px;
        font-weight: 700;
      }

      .about-card__description {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: 14px;
        line-height: 1.6;
      }
    }

    .features {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;

      .feature {
        min-height: 170px;
        padding: 20px 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        text-align: center;
        background: var(--color-surface-soft);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        transition: transform 0.2s ease, -shadow 0.2s ease, border-color 0.2s ease;

        .feature__icon {
          min-height: auto;
          margin-bottom: 4px;
          font-size: 40px;
        }

        strong {
          font-size: 15px;
        }

        span {
          max-width: 220px;
          color: var(--color-text-secondary);
          font-size: 13px;
          line-height: 1.5;
        }

        &:hover {
          transform: translateY(-3px);
          border-color: rgba(8, 116, 135, 0.25);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
        }
      }
    }
  }

  .home-card {
    padding: 22px;
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-medium);
    box-shadow: var(--shadow-small);

    h2 {
      margin-bottom: 6px;
      font-size: 24px;
    }

    > p {
      margin-bottom: 20px;
      color: var(--color-text-secondary);
      font-size: 15px;
    }
  }

  /* FEATURES */
  .features {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;

    .feature {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;

      .feature__icon {
        min-height: 54px;
        display: flex;
        align-items: center;
        font-size: 42px;
      }

      strong {
        font-size: 15px;
      }

      span {
        max-width: 180px;
        color: var(--color-text-secondary);
        font-size: 13px;
        line-height: 1.45;
      }
    }
  }

  /* QUIZ HEADER */
  .quiz-section {

    .quiz-section__header {
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;

      h2 {
        margin: 0;
      }

      /* DIFFICULTY FILTER */
      .difficulty-filter {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;

        > span {
          margin-right: 4px;
          font-size: 13px;
          font-weight: 700;
        }

        button {
          padding: 6px 10px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--color-text);
          font-size: 12px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;

          &:not(.difficulty-filter__active):hover {
            background: var(--color-primary-light);
            color: var(--color-primary-dark);
          }

          &.difficulty-filter__active {
            background: var(--color-primary);
            color: white;

            &:hover {
              background: var(--color-primary-dark);
              color: white;
            }
          }
        }
      }
    }

    /* QUIZ GRID */
    .quiz-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      justify-content: space-between;
      align-items: stretch;
      gap: 18px;


      /* QUIZ CARD */
      .quiz-card {
        min-height: 360px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: white;
        border: 1px solid var(--color-border);
        border-radius: 10px;
        transition: transform 0.25s ease, box-shadow 0.25s ease;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);

        }

        .quiz-card__image {
          height: 170px;
          flex-shrink: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;

        }

        .quiz-card__content {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 14px;
        }

        h3 {
          margin-bottom: 8px;
          font-size: 16px;
        }

        p {
          margin-bottom: 12px;
          color: var(--color-text-secondary);
          font-size: 13px;
          line-height: 1.45;
        }

        small {
          display: block;
          margin-bottom: 12px;
          color: var(--color-text-secondary);
          font-size: 12px;
        }

        .quiz-card__button {
          width: 100%;
          margin-top: auto;
          padding: 10px 12px;
          border: none;
          border-radius: 999px;
          background: var(--color-primary);
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;

          &:hover {
            background: var(--color-primary-dark);
          }
        }
      }
    }
  }
}


/* MEDIA QUERIES */
/* TABLET */
@media (max-width: 1024px) {
  .home {

    .about-card {

      .about-card__intro {
        max-width: 100%;
        margin-bottom: 20px;

        .about-card__description {
          max-width: 700px;
        }
      }

      .features {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;

        .feature {
          min-height: 155px;
          padding: 18px 14px;

          .feature__icon {
            font-size: 38px;
          }

          span {
            max-width: 240px;
          }
        }
      }
    }

    .home-card {
      padding: 18px;

      h2 {
        font-size: 22px;
      }
    }

    .features {
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .quiz-section {

      .quiz-section__header {
        align-items: flex-start;
        flex-direction: column;
        gap: 12px;

        .difficulty-filter {
          flex-wrap: wrap;
        }
      }

      .quiz-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));

        .quiz-card {
          min-height: 350px;

          .quiz-card__image {
            height: 165px;
          }
        }
      }
    }
  }
}

/* MOBILE */
@media (max-width: 768px) {
  .home {
    gap: 10px;

    .about-card {
      padding: 16px;

      .about-card__intro {
        margin-bottom: 18px;

        h2 {
          margin-bottom: 5px;
          font-size: 20px;
        }

        .about-card__tagline {
          margin-bottom: 8px;
          font-size: 14px;
        }

        .about-card__description {
          font-size: 13px;
          line-height: 1.55;
        }
      }

      .features {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;

        .feature {
          min-height: 145px;
          padding: 14px 10px;
          gap: 6px;
          border-radius: 10px;

          .feature__icon {
            margin-bottom: 2px;
            font-size: 32px;
          }

          strong {
            font-size: 13px;
          }

          span {
            max-width: 150px;
            font-size: 11px;
            line-height: 1.4;
          }

          &:hover {
            transform: none;
            box-shadow: none;
          }
        }
      }
    }

    .home-card {
      padding: 16px;

      h2 {
        font-size: 20px;
      }

      > p {
        font-size: 14px;
      }
    }

    .features {
      grid-template-columns: 1fr;
      gap: 22px;

      .feature {

        .feature__icon {
          min-height: 46px;
          font-size: 36px;
        }

        strong {
          font-size: 14px;
        }

        span {
          font-size: 12px;
        }
      }
    }

    .quiz-section {

      .quiz-section__header {
        margin-bottom: 14px;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;

        .difficulty-filter {
          width: 100%;
          flex-wrap: wrap;
          gap: 6px;
        }
      }

      .quiz-grid {
        grid-template-columns: 1fr;
        gap: 14px;

        .quiz-card {
          min-height: 340px;

          .quiz-card__image {
            height: 180px;
          }

          .quiz-card__content {
            padding: 14px;
          }
        }
      }
    }
  }
}
</style>

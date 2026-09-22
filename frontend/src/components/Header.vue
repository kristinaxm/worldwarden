<script setup>
import heroImage from '@/assets/images/headerhero/heroImage.png'
import logoImage from '@/assets/images/worldwarden-logo.png'
</script>

<template>
  <header class="hero" :style="{ backgroundImage: `url(${heroImage})` }">
    <div class="hero__stars">
      <span class="hero__star hero__star--one">✦</span>
      <span class="hero__star hero__star--two">✦</span>
      <span class="hero__star hero__star--three">✦</span>
      <span class="hero__star hero__star--four">✦</span>
    </div>
    <div class="hero__overlay">
      <div class="hero__content">
        <div class="hero__brand">
          <div class="hero__logo">
            <img
              :src="logoImage"
              alt="WorldWarden logo"
            />
          </div>
          <h1>WorldWarden</h1>
        </div>
        <p class="hero__tagline">
          “Lär dig världen – ett quiz i taget”
        </p>
        <button class="hero__button">
          Starta din resa
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hero {
  width: 100%;
  position: relative;
  overflow: hidden;
  min-height: 300px;
  flex-shrink: 0;
  background: linear-gradient(90deg, rgba(7, 50, 63, 0.78), rgba(9, 83, 99, 0.35)), linear-gradient(135deg, #45798a, #9cc8d1);
  background-size: cover;
  background-position: center;
  color: white;

  .hero__stars {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;

    .hero__star {
      position: absolute;
      color: white;
      font-size: 14px;
      opacity: 0;
      text-shadow: 0 0 4px white, 0 0 10px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 235, 160, 0.8);
      animation: starPulse 4s ease-in-out infinite;
    }

    .hero__star--one {
      top: 18%;
      left: 24%;
      animation-delay: 0s;
    }

    .hero__star--two {
      top: 28%;
      left: 62%;
      font-size: 10px;
      animation-delay: 1.4s;
    }

    .hero__star--three {
      top: 12%;
      left: 78%;
      font-size: 12px;
      animation-delay: 2.6s;
    }

    .hero__star--four {
      top: 50%;
      left: 42%;
      font-size: 9px;
      animation-delay: 3.3s;
    }
  }

  .hero__overlay {
    width: 100%;
    min-height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
    background: rgba(0, 0, 0, 0.32);

    .hero__content {
      text-align: center;

      .hero__brand {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .hero__logo {
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          animation: floatHorizontal 9s ease-in-out infinite alternate;

          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;

            animation:
              floatVertical 7s ease-in-out infinite alternate,
              floatRotate 10s ease-in-out infinite alternate;
          }

        }


        h1 {
          margin: 0;
          font-size: 42px;
          font-weight: 800;
        }
      }

      .hero__tagline {
        margin: 0 0 20px;
        font-size: 20px;
        font-weight: 600;
      }

      .hero__button {
        padding: 12px 24px;
        border: none;
        border-radius: 999px;
        background: #ead6a1;
        color: #332b1e;
        font-weight: 700;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
        cursor: pointer;
        animation: 0.3s ease;

        &:hover{
          background: #e3ce98;
          animation: 0.3s ease;

        }
      }
    }
  }
}

/* LOGO ANIMATION */
@keyframes floatHorizontal {
  from {
    transform: translateX(-8px);
  }

  to {
    transform: translateX(8px);
  }
}

@keyframes floatVertical {
  from {
    transform: translateY(-5px);
  }

  to {
    transform: translateY(5px);
  }
}

@keyframes floatRotate {
  from {
    rotate: -7deg;
  }

  to {
    rotate: 7deg;
  }
}

@keyframes starPulse {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.4) rotate(0deg);
  }

  30% {
    opacity: 0;
    transform: scale(0.6) rotate(20deg);
  }

  50% {
    opacity: 1;
    transform: scale(1.4) rotate(45deg);
  }

  70% {
    opacity: 0;
    transform: scale(0.6) rotate(70deg);
  }
}

/* MEDIA QUERIES */
/* Mobile */
@media (max-width: 768px) {
  .hero {
    min-height: 200px;

    background-position: center;

    .hero__overlay {
      min-height: 200px;
      padding: 20px 16px;

      .hero__content {

        .hero__brand {
          gap: 8px;

          .hero__logo {
            width: 46px;
            height: 46px;
          }

          h1 {
            font-size: 30px;
          }
        }

        .hero__tagline {
          margin-bottom: 14px;
          font-size: 15px;
        }

        .hero__button {
          padding: 10px 18px;
          font-size: 13px;
        }
      }
    }
  }
}
</style>

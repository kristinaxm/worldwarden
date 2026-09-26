<script setup>
import { RouterLink } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle', 'auth'])
defineOptions({ name: 'AppSidebar' })
const { user, pending, logout } = useAuth()
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
    <div class="sidebar__top">

      <!-- USER + COLLAPSE BUTTON -->
      <div class="sidebar__header">
        <div class="sidebar__user">
          <div class="sidebar__avatar">👤</div>
          <span class="sidebar__user-name" :title="user?.email">{{ user?.email || 'Gäst' }}</span>
        </div>

        <button class="sidebar__toggle" type="button" :aria-label="collapsed ? 'Öppna sidomeny' : 'Stäng sidomeny'" @click="emit('toggle')">
          {{ collapsed ? '›' : '‹' }}
        </button>
      </div>

      <!-- NAVIGATION -->
      <nav class="sidebar__navigation">

        <RouterLink to="/" class="sidebar__link" title="Huvudmeny">
          <span class="sidebar__icon">▦</span>
          <span class="sidebar__text">Huvudmeny</span>
        </RouterLink>

        <a href="#" class="sidebar__link" title="Mina framsteg">
          <span class="sidebar__icon">☆</span>
          <span class="sidebar__text">Mina framsteg</span>
        </a>

        <a href="#" class="sidebar__link" title="Topplistor">
          <span class="sidebar__icon">♜</span>
          <span class="sidebar__text">Topplistor</span>
        </a>

        <a href="#" class="sidebar__link" title="Kategorier">
          <span class="sidebar__icon">◉</span>
          <span class="sidebar__text">Kategorier</span>
        </a>

        <a href="#" class="sidebar__link" title="Community">
          <span class="sidebar__icon">♧</span>
          <span class="sidebar__text">Community</span>
        </a>
      </nav>

      <!-- DIVIDER -->
      <div class="sidebar__divider"></div>

      <!-- AUTH -->
      <div class="sidebar__auth">
        <button
          class="sidebar__button sidebar__button--outline"
          type="button"
          :title="user ? 'Logga ut' : 'Logga in'"
          :aria-label="user ? 'Logga ut' : 'Logga in'"
          :disabled="pending"
          @click="user ? logout() : emit('auth', 'login')"
        >
          <span class="sidebar__button-icon">🔑</span>
          <span class="sidebar__button-text">{{ user ? 'Logga ut' : 'Logga in' }}</span>
        </button>

        <button
          v-if="!user"
          class="sidebar__button sidebar__button--filled"
          type="button"
          title="Skapa konto"
          aria-label="Skapa konto"
          :disabled="pending"
          @click="emit('auth', 'signup')"
        >
          <span class="sidebar__button-icon">👤</span>
          <span class="sidebar__button-text">Skapa konto</span>
        </button>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="sidebar__bottom">
      <slot name="footer" />
    </div>
  </aside>
</template>


<style scoped>
.sidebar {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  box-shadow: var(--shadow-small);
  overflow: hidden;
  transition: padding 0.3s ease;

  .sidebar__top {

    /* HEADER */
    .sidebar__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 14px;

      /* USER */
      .sidebar__user {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 15px;
        font-weight: 700;

        .sidebar__avatar {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          background: #edf1f2;
          border-radius: 50%;
        }

        .sidebar__user-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      /* COLLAPSE BUTTON */
      .sidebar__toggle {
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        background: white;
        color: var(--color-text);
        font-size: 22px;
        line-height: 1;
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;

        &:hover {
          background: var(--color-primary-light);
          color: var(--color-primary-dark);
          transform: scale(1.05);
        }
      }
    }


    /* NAVIGATION */
    .sidebar__navigation {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .sidebar__link {
        width: 100%;
        min-height: 40px;
        padding: 0 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        border-radius: 8px;
        color: var(--color-text);
        font-size: 15px;
        font-weight: 600;
        white-space: nowrap;
        transition: background 0.15s ease, color 0.15s ease;

        .sidebar__icon {
          width: 20px;
          flex-shrink: 0;
          text-align: center;
          font-size: 18px;
        }

        &:hover {
          background: var(--color-primary-light);
        }

        &.router-link-active {
          background: #e3f2f4;
          color: var(--color-primary-dark);
        }
      }
    }


    /* DIVIDER */
    .sidebar__divider {
      width: 100%;
      height: 1px;
      margin: 16px 0;
      background: var(--color-border);
    }


    /* AUTH BUTTONS */
    .sidebar__auth {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .sidebar__button {
        width: 100%;
        min-height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

        &:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        &:focus-visible {
          outline: 3px solid var(--color-primary);
          outline-offset: 3px;
        }

        .sidebar__button-icon {
          flex-shrink: 0;
        }
      }

      .sidebar__button--outline {
        border: 2px solid var(--color-primary);
        background: white;
        color: var(--color-primary);

        &:hover {
          background: var(--color-primary-light);
        }
      }

      .sidebar__button--filled {
        border: 2px solid var(--color-primary);
        background: var(--color-primary);
        color: white;

        &:hover {
          background: var(--color-primary-dark);
          border-color: var(--color-primary-dark);
        }
      }
    }
  }


  /* FOOTER */
  .sidebar__bottom {
    margin-top: 30px;
    flex-shrink: 0;
  }


  /* COLLAPSED SIDEBAR */
  &.sidebar--collapsed {
    padding: 18px 8px;

    .sidebar__header {
      flex-direction: column;
      justify-content: center;

      .sidebar__user {
        justify-content: center;

        .sidebar__user-name {
          display: none;
        }
      }

      .sidebar__toggle {
        width: 36px;
      }
    }

    .sidebar__navigation {

      .sidebar__link {
        padding: 0;
        justify-content: center;

        .sidebar__icon {
          width: auto;
        }

        .sidebar__text {
          display: none;
        }
      }
    }

    .sidebar__divider {
      margin: 14px 0;
    }

    .sidebar__auth {

      .sidebar__button {
        width: 40px;
        height: 40px;
        min-height: 40px;
        margin: 0 auto;
        padding: 0;

        .sidebar__button-text {
          display: none;
        }
      }
    }

    .sidebar__bottom {
      display: none;
    }
  }
}

/* MEDIA QUERIES */
/* TABLET */
@media (max-width: 1024px) {
  .sidebar {
    padding: 16px 12px;

    &.sidebar--collapsed {
      padding: 16px 8px;
    }
  }
}

/* MOBILE */
@media (max-width: 768px) {
  .sidebar {
    height: auto;
    min-height: auto;

    padding: 16px;

    overflow: visible;
  }
}
</style>

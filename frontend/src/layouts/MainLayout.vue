<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import Footer from '@/components/Footer.vue'
import AuthDialog from '@/components/AuthDialog.vue'
import { useAuth } from '@/composables/useAuth'
import { nextTick, provide, ref, watch } from 'vue'

const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)
const authMode = ref(null)
const content = ref(null)
const route = useRoute()
const { user, pending, error, restore, logout } = useAuth()

// Start each page at the top of the scrollable content area.
watch(
  () => route.path,
  () => content.value?.scrollTo({ top: 0 }),
)

function openAuth(mode) {
  closeMobileMenu()
  authMode.value = mode
}

async function closeAuth() {
  authMode.value = null
  await nextTick()
  if (document.activeElement === document.body) {
    document.querySelector('.hero__auth-button')?.focus()
  }
}

provide('openAuth', openAuth)

//#region Toggle sidebar and hamburger menu
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}
//#endregion
</script>

<template>
  <div class="app-shell">

    <Header @auth="openAuth" />

    <div v-if="error" class="account-error" role="alert">
      <span>{{ error }}</span>
      <button type="button" :disabled="pending" @click="user ? logout() : restore()">Försök igen</button>
    </div>

    <AuthDialog v-if="authMode" :mode="authMode" @close="closeAuth" />

    <button class="mobile-menu-button" type="button" aria-label="Öppna meny" @click="toggleMobileMenu">
      ☰
    </button>

    <Transition name="mobile-menu">
      <div v-if="mobileMenuOpen" class="mobile-menu-overlay">
        <div class="mobile-menu">
          <div class="mobile-menu__header">
            <strong>Meny</strong>
            <button type="button" class="mobile-menu__close" @click="closeMobileMenu">
              ✕
            </button>
          </div>
          <nav class="mobile-menu__navigation">
            <RouterLink to="/" active-class="" exact-active-class="router-link-active" @click="closeMobileMenu">
              ▦ Huvudmeny
            </RouterLink>
            <RouterLink :to="{ name: 'profile' }" @click="closeMobileMenu">
              ☆ Mina framsteg
            </RouterLink>
            <a href="#">
              ♜ Topplistor
            </a>
            <a href="#">
              ◉ Kategorier
            </a>
            <a href="#">
              ♧ Community
            </a>
          </nav>
          <div class="mobile-menu__divider"></div>
          <div class="mobile-menu__auth">
            <RouterLink v-if="user" :to="{ name: 'profile' }" class="mobile-menu__account" @click="closeMobileMenu">
              <span>{{ user.email }}<small>Visa profil</small></span>
            </RouterLink>
            <button type="button" :disabled="pending" @click="user ? logout() : openAuth('login')">
              {{ user ? 'Logga ut' : '🔑 Logga in' }}
            </button>
            <button v-if="!user" type="button" :disabled="pending" @click="openAuth('signup')">
              👤 Skapa konto
            </button>
          </div>
          <div class="mobile-menu__footer">
            <a href="#">Hjälp</a>
            <a href="#">Integritetspolicy</a>
            <a href="#">Användarvillkor </a>
          </div>
        </div>
      </div>
    </Transition>

    <!-- SIDEBAR + MAIN CONTENT -->
    <div class="main-layout" :class="{ 'main-layout--collapsed': sidebarCollapsed }">
      <Sidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" @auth="openAuth">
        <template #footer>
          <Footer />
        </template>
      </Sidebar>

      <main ref="content" class="main-layout__content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.account-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 16px;
  padding: 12px 16px;
  background: #fff0ed;
  color: #9e3020;
  font-size: 14px;
}

.account-error button {
  min-height: 36px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-weight: 700;
  text-decoration: underline;
}

.mobile-menu__account {
  margin-bottom: 4px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface-soft);
  color: var(--color-text);
  overflow-wrap: anywhere;
  text-align: left;
  font-weight: 700;
  cursor: pointer;

  small {
    display: block;
    margin-top: 2px;
    color: var(--color-primary);
    font-size: 12px;
  }
}


.app-shell {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f4f7f8;

  .mobile-menu-button {
    display: none;
  }

  .mobile-menu-overlay {
    display: none;
  }

  .main-layout {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    gap: 16px;
    padding: 16px;
    overflow: hidden;
    background: #f4f7f8;
    transition: grid-template-columns 0.3s ease;

    &.main-layout--collapsed {
      grid-template-columns: 68px minmax(0, 1fr);
    }

    .main-layout__content {
      min-width: 0;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-gutter: stable;
    }
  }
}


/* SCROLLBAR */
.main-layout__content::-webkit-scrollbar {
  width: 8px;
}

.main-layout__content::-webkit-scrollbar-track {
  background: transparent;
}

.main-layout__content::-webkit-scrollbar-thumb {
  background: #c5ced3;
  border-radius: 999px;
}

.main-layout__content::-webkit-scrollbar-thumb:hover {
  background: #aeb8bd;
}



/* MEDIA QUERIES */
/* TABLET */
@media (max-width: 1024px) {
  .app-shell {

    .main-layout {
      grid-template-columns: 240px minmax(0, 1fr);

      &.main-layout--collapsed {
        grid-template-columns: 68px minmax(0, 1fr);
      }
    }
  }
}


/* MOBILE */
@media (max-width: 768px) {
  .app-shell {
    height: auto;
    min-height: 100vh;
    overflow: visible;

    .mobile-menu-button {
      position: absolute;
      top: 14px;
      left: 14px;
      z-index: 1001;
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border: 1px solid rgb(255 255 255 / 0.13);
      border-radius: 10px;
      background: rgb(0 0 0 / 0.31);
      color: white;
      font-size: 24px;
      cursor: pointer;
    }

    .mobile-menu-overlay {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: block;
      background: var(--color-surface);
    }

    .mobile-menu {
      width: 100%;
      height: 100%;
      padding: 24px;
      display: flex;
      flex-direction: column;
      background: var(--color-surface);

      .mobile-menu__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;

        strong {
          font-size: 24px;
        }

        .mobile-menu__close {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: none;
          border-radius: 10px;
          background: var(--color-primary-light);
          color: var(--color-primary-dark);
          font-size: 20px;
          cursor: pointer;
        }
      }

      .mobile-menu__navigation {
        display: flex;
        flex-direction: column;
        gap: 8px;

        a {
          min-height: 52px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          border-radius: 10px;
          color: var(--color-text);
          font-size: 16px;
          font-weight: 600;
          transition: background 0.2s ease, color 0.2s ease;

          &:hover {
            background: var(--color-primary-light);
            color: var(--color-primary-dark);
          }

          &.router-link-active {
            background: var(--color-primary-light);
            color: var(--color-primary-dark);
          }
        }
      }

      .mobile-menu__divider {
        width: 100%;
        height: 1px;
        margin: 22px 0;
        background: var(--color-border);
      }

      .mobile-menu__auth {
        display: flex;
        flex-direction: column;
        gap: 10px;

        button {
          min-height: 48px;
          border: 2px solid var(--color-primary);
          border-radius: 999px;
          background: white;
          color: var(--color-primary);
          font-weight: 700;
          cursor: pointer;

          &:last-child {
            background: var(--color-primary);
            color: white;
          }
        }
      }

      .mobile-menu__footer {
        margin-top: auto;
        padding-top: 20px;
        padding-bottom: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 24px;
        color: var(--color-text-secondary);
        font-size: 12px;

        a {
          transition: color 0.2s ease;

          &:hover {
            color: var(--color-primary);
          }
        }
      }
    }

    /* Mobile menu animation */
    .mobile-menu-enter-active,
    .mobile-menu-leave-active {
      transition: opacity 0.35s ease;

      .mobile-menu {
        transition:
          transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
          opacity 0.35s ease;
      }
    }
    .mobile-menu-enter-from {
      opacity: 0;

      .mobile-menu {
        transform: translateX(-100%);
        opacity: 0;
      }
    }
    .mobile-menu-enter-to {
      opacity: 1;

      .mobile-menu {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .mobile-menu-leave-from {
      opacity: 1;

      .mobile-menu {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .mobile-menu-leave-to {
      opacity: 0;

      .mobile-menu {
        transform: translateX(-100%);
        opacity: 0;
      }
    }

    .main-layout {
      display: block;
      padding: 12px;
      overflow: visible;

      .sidebar {
        display: none;
      }

      .main-layout__content {
        width: 100%;
        margin: 0;
        scrollbar-gutter: auto;
      }
    }
  }
}

</style>

import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import ProfileView from '@/views/ProfileView.vue'
import ResultsView from '@/views/ResultsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import LeaderboardView from '@/views/LeaderboardView.vue'
import AboutView from '@/views/AboutView.vue'
import HelpView from '@/views/HelpView.vue'
import PrivacyView from '@/views/PrivacyView.vue'
import TermsView from '@/views/TermsView.vue'
import QuizView from "@/views/QuizView.vue";
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'profil',
          name: 'profile',
          component: ProfileView,
        },
        {
          path: 'resultat',
          name: 'results',
          component: ResultsView,
        },
        {
          path: 'topplistor',
          name: 'leaderboard',
          component: LeaderboardView,
        },
        {
          path: 'om-oss',
          name: 'about',
          component: AboutView,
        },
        {
          path: 'hjalp',
          name: 'help',
          component: HelpView,
        },
        {
          path: 'integritetspolicy',
          name: 'privacy',
          component: PrivacyView,
        },
        {
          path: 'anvandarvillkor',
          name: 'terms',
          component: TermsView,
        },
        {
          path: 'installningar',
          name: 'settings',
          component: SettingsView,
        },
      ],
    },
    {
      path: '/quiz/:difficulty',
      name: 'quiz',
      component: QuizView
    }
  ],
})

export default router

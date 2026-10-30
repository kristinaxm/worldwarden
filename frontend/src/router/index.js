import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import ProfileView from '@/views/ProfileView.vue'
import ResultsView from '@/views/ResultsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import LeaderboardView from '@/views/LeaderboardView.vue'
import CoplayLobbyView from '@/views/CoplayLobbyView.vue'
import CoplayQuizView from '@/views/CoplayQuizView.vue'
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
          path: 'installningar',
          name: 'settings',
          component: SettingsView,
        },
        {
          path: 'tillsammans',
          name: 'coplay',
          component: CoplayLobbyView,
        },
      ],
    },
    {
      path: '/quiz/:difficulty',
      name: 'quiz',
      component: QuizView
    },
    {
      path: '/tillsammans/:code',
      name: 'coplay-quiz',
      component: CoplayQuizView
    }
  ],
})

export default router

import {createRouter, createWebHistory} from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/lobby',
      name: 'main-lobby',
      component: () => import('../views/MainLobbyView.vue')
    },
    {
      path: '/create',
      name: 'create',
      component: () => import('../views/CreateGameView.vue')
    },
    {
      path: '/game-lobby/:gameNumber',
      name: 'game-lobby',
      component: () => import('../views/PhaserLobbyView.vue'),
      props: true
    },
    {
      path: '/game/:gameNumber',
      name: 'game',
      component: () => import('../views/GameView.vue'),
      props: true
    },
    {
      path: '/register-subject',
      name: 'register-subject',
      component: () => import('../views/RegisterSubjectView.vue')
    },
    {
      path: '/register-word',
      name: 'register-word',
      component: () => import('../views/RegisterWordView.vue')
    }
  ]
})

export default router

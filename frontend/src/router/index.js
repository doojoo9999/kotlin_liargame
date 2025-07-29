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
      component: () => import('../views/LobbyView.vue'),
      props: true
    },
    {
      path: '/game/:gameNumber',
      name: 'game',
      component: () => import('../views/GameView.vue'),
      props: true
    }
  ]
})

export default router
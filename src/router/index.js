import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/account/add',
    name: 'AddAccount',
    component: () => import('../views/AccountForm.vue')
  },
  {
    path: '/account/edit/:id',
    name: 'EditAccount',
    component: () => import('../views/AccountForm.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router

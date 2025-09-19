import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/auth/LoginView.vue'
import HomeView from '../views/system/HomeView.vue'
import UnauthorizedView from '../views/errors/UnauthorizedView.vue'
import CreateAccountView from '@/views/auth/CreateAccountView.vue'
import { supabase } from '../clients/supabase.js'
import HeroPage from '@/views/system/HeroPage.vue'
import ItemInventory from '@/views/system/ItemInventory.vue'

let localUser

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/home',
      name: 'Home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/hero',
      name: 'Hero',
      component: HeroPage,
    },
    {
      path: '/',
      name: 'Login',
      component: LoginView,
    },
    {
      path: '/createaccount',
      name: 'CreateAccount',
      component: CreateAccountView,
    },
    {
      path: '/unauthorized',
      name: 'Unauthorized',
      component: UnauthorizedView,
    },

    {
      path: '/items',
      name: 'ItemInventory',
      component: ItemInventory,
    },
  ],
})

async function getUser(next) {
  localUser = await supabase.auth.getSession()
  if (localUser.data.session == null) {
    next('/unauthorized')
  } else {
    next()
  }
}

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    getUser(next)
  } else {
    next()
  }
})

export default router

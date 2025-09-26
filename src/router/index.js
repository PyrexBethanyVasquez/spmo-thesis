import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/auth/LoginView.vue'
import HomeView from '../views/system/HomeView.vue'
import UnauthorizedView from '../views/errors/UnauthorizedView.vue'
import CreateAccountView from '@/views/auth/CreateAccountView.vue'
import { supabase } from '../clients/supabase.js'
import HeroPage from '@/views/system/HeroPage.vue'
import ItemInventory from '@/views/system/ItemInventory.vue'
import ItemLists from '@/views/system/ItemLists.vue'
import Reports from '@/views/system/reports/ViewReports.vue'

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
      meta: { requiresAuth: true, role: ['admin'] },
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
      meta: { requiresAuth: true, role: ['admin'] },
    },

    {
      path: '/item-lists',
      name: 'ItemLists',
      component: ItemLists,
      meta: { requiresAuth: true, role: ['admin'] },
    },

    {
      path: '/reports',
      name: 'Reports',
      component: Reports,
      meta: { requiresAuth: true, role: ['admin'] },
    },
    //add item lists route here
    //add reports route here
    //add transactions route here
  ],
})

async function getUser(next, to) {
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) {
    return next('/unauthorized')
  }

  // role from user_metadata
  const role = user.user_metadata?.role || 'user'

  // if route has role restrictions
  if (to.meta.roles && !to.meta.roles.includes(role)) {
    return next('/unauthorized')
  }

  next()
}

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    getUser(next, to)
  } else {
    next()
  }
})

export default router

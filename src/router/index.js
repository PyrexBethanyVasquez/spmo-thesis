import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../clients/supabase.js'

// Layout
import DefaultLayout from '@/views/navbar/DefaultLayout.vue'

// Auth & Errors
import LoginView from '@/views/auth/LoginView.vue'
import CreateAccountView from '@/views/auth/CreateAccountView.vue'
import UnauthorizedView from '@/views/errors/UnauthorizedView.vue'

// System pages
import HomeView from '@/views/system/HomeView.vue'
import HeroPage from '@/views/system/HeroPage.vue'
import ItemInventory from '@/views/system/ItemInventory.vue'
import ItemLists from '@/views/system/ItemLists.vue'
import Reports from '@/views/system/reports/ViewReports.vue'
import UserLists from '@/views/system/user/UserLists.vue'
import ForgotPassword from '@/views/auth/ForgotPassword.vue'
import Transaction from '@/views/system/transactions/TransactionPage.vue'
import ViewItemInfo from '@/views/itemview/ViewItemInfo.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public / Auth routes (no layout)
    {
      path: '/',
      name: 'Login',
      component: LoginView,
    },
    {
      path: '/unauthorized',
      name: 'Unauthorized',
      component: UnauthorizedView,
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: ForgotPassword,
    },

    // Protected system routes (with layout)
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true }, // all children need auth
      children: [
        { path: 'home', name: 'Home', component: HomeView },
        { path: 'hero', name: 'Hero', component: HeroPage },
        {
          path: '/createaccount',
          name: 'CreateAccount',
          component: CreateAccountView,
          meta: { role: ['admin'] },
        },
        {
          path: 'items',
          name: 'ItemInventory',
          component: ItemInventory,
          meta: { role: ['admin'] },
        },
        {
          path: 'view-items',
          name: 'ViewItems',
          component: ViewItemInfo,
          meta: { role: ['admin'] },
        },
        {
          path: 'item-lists',
          name: 'ItemLists',
          component: ItemLists,
          meta: { role: ['admin'] },
        },
        {
          path: 'item-transactions',
          name: 'Transactions',
          component: Transaction,
          meta: { role: ['admin'] },
        },
        {
          path: 'reports',
          name: 'Reports',
          component: Reports,
          meta: { role: ['admin'] },
        },
        {
          path: 'users-list',
          name: 'UserLists',
          component: UserLists,
          meta: { role: ['admin'] },
        },
      ],
    },
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
  if (to.meta.roles && !to.meta.role.includes(role)) {
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

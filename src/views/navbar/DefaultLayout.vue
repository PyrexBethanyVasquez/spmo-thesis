<template>
  <div class="page">
    <!-- Header -->
    <header class="header">
      <div class="nav-wrapper">
        <nav>
          <!-- Left: logo + hamburger -->
          <div class="nav-left">
            <button class="hamburger" @click="toggleMenu">
              <span :class="{ open: sidebarOpen }"></span>
              <span :class="{ open: sidebarOpen }"></span>
              <span :class="{ open: sidebarOpen }"></span>
            </button>
            <RouterLink to="/" class="logo">SPMO</RouterLink>
          </div>
        </nav>
      </div>
    </header>

    <!-- Overlay (mobile only) -->
    <div class="overlay" v-if="sidebarOpen" @click="closeMenu"></div>

    <!-- Layout body -->
    <div class="layout-body">
      <!-- Sidebar (drawer on mobile, fixed on desktop) -->
      <aside class="sidebar" :class="{ open: sidebarOpen }">
        <div class="sidebar-header">
          <p class="user-name">{{ user?.user_metadata?.full_name || user?.email }}</p>
          <span class="role-badge" :class="role">{{ role }}</span>
        </div>

        <nav class="sidebar-nav">
          <ul>
            <li>
              <RouterLink to="/home" active-class="active">
                <ion-icon name="home-outline"></ion-icon>
                Dashboard
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/items" active-class="active">
                <ion-icon name="cube-outline"></ion-icon>
                Item Inventory
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/reports" active-class="active">
                <ion-icon name="document-text-outline"></ion-icon>
                View Reports
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/item-lists" active-class="active">
                <ion-icon name="list-outline"></ion-icon>
                Item Lists
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/item-transactions" active-class="active">
                <ion-icon name="swap-horizontal-outline"></ion-icon>
                Transactions
              </RouterLink>
            </li>

            <li @click="toggleDropdown">
              <ion-icon name="people-outline"></ion-icon>
              Manage Users
              <ion-icon
                :name="dropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'"
                class="chevron"
              />
            </li>
            <ul v-if="dropdownOpen" class="submenu">
              <li>
                <RouterLink to="/users-list" active-class="active">
                  <ion-icon name="list-outline"></ion-icon>
                  All Users
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/createaccount" active-class="active">
                  <ion-icon name="shield-checkmark-outline"></ion-icon>
                  Create Staff Account
                </RouterLink>
              </li>
            </ul>
          </ul>
        </nav>

        <div class="sidebar-footer">
          <button @click="logout" class="logout-btn">
            <ion-icon name="log-out-outline"></ion-icon>
            Logout
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/clients/supabase.js'

const router = useRouter()
const user = ref(null)
const role = ref('user')
const dropdownOpen = ref(false)
const sidebarOpen = ref(false)

const toggleMenu = () => (sidebarOpen.value = !sidebarOpen.value)
const closeMenu = () => (sidebarOpen.value = false)
const toggleDropdown = () => (dropdownOpen.value = !dropdownOpen.value)

const logout = async () => {
  await supabase.auth.signOut()
  router.push('/')
}

// Fetch user
onMounted(async () => {
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()
  user.value = currentUser
  if (user.value) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.value.id)
      .maybeSingle()
    role.value = profile?.role || 'user'
  }
})
</script>

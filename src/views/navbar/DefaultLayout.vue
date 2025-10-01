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
            <li @click="go('/home')">
              <ion-icon name="home-outline"></ion-icon>
              Dashboard
            </li>
            <li @click="go('/items')">
              <ion-icon name="cube-outline"></ion-icon>
              Item Inventory
            </li>
            <li @click="go('/reports')">
              <ion-icon name="document-text-outline"></ion-icon>
              View Reports
            </li>
            <li @click="go('/item-lists')">
              <ion-icon name="list-outline"></ion-icon>
              Item Lists
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
              <li @click="go('/users-list')">
                <ion-icon name="list-outline"></ion-icon>
                All Users
              </li>
              <li @click="go('/createaccount')">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                Create Staff Account
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
const go = (path) => {
  router.push(path)
  closeMenu()
}
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

<style scoped>
/* Page wrapper */
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-width: 100%;
}

/* Header */
.header {
  background: #152e1a;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.nav-wrapper nav {
  width: 100%;
  padding: 0.75em 5.5em;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-weight: 700;
  font-size: 1.25rem;
  color: #f7fffa;
  text-decoration: none;
}

/* Hamburger */
.hamburger {
  display: none; /* still hidden on desktop */
  flex-direction: column;
  justify-content: center; /* ✅ center lines vertically */
  align-items: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.hamburger span {
  display: block;
  height: 3px;
  width: 100%;
  background: #fff;
  border-radius: 2px;
  transition: all 0.3s ease;
}
.hamburger span.open:nth-child(1) {
  transform: rotate(45deg) translateY(7px);
}
.hamburger span.open:nth-child(2) {
  opacity: 0;
}
.hamburger span.open:nth-child(3) {
  transform: rotate(-45deg) translateY(-7px);
}

/* Overlay (mobile) */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 500;
}

.dashboard-layout {
  display: flex;
  min-height: 100%;
  min-width: none;
  background: #f8fafc;
}
/* Sidebar */
.sidebar {
  width: 250px;
  background: linear-gradient(120deg, #504c2c, #035b01);
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
  transition:
    transform 0.3s ease-in-out,
    width 0.3s ease;

  /* ✅ Ensure visible by default */
  transform: translateX(0);
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 0; /* remove padding so dashboard spans */
  background: transparent; /* let dashboard control background */
}

.sidebar-header {
  text-align: center;
  margin-bottom: 2rem;
}

.user-email {
  font-size: 0.85rem;
  color: #cbd5e0;
  margin: 0.25rem 0;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  text-transform: capitalize;
  background: #2d3748;
  color: #fff;
}

.role-badge.admin {
  background: #028e45;
}
.role-badge.user {
  background: #718096;
}

/* Sidebar Nav */
.sidebar-nav ul {
  list-style: none;
  padding: 0;
}
.sidebar-nav li {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}
.sidebar-nav li ion-icon {
  margin-right: 0.75rem;
  font-size: 1.2rem;
}
.sidebar-nav li:hover {
  background: #2d37487d;
}

/* Sidebar footer */
.sidebar-footer {
  margin-top: auto;
  text-align: center;
}
.logout-btn {
  background: #e53e3e;
  color: #fff;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s;
}
.logout-btn:hover {
  background: #c53030;
}

/* Search Bar */
.search-bar {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #000000;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  margin-bottom: 1.5rem;
  max-width: 400px;
}
/* Header with title + search bar */
.dashboard-header {
  display: flex;
  justify-content: space-between; /* title left, search right */
  align-items: center;
  margin-bottom: 1rem;
}

.dashboard-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
}

.search-bar ion-icon {
  font-size: 1.2rem;
  color: #4a5568;
  margin-right: 0.5rem;
}
.search-bar input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.95rem;
  color: #2d3748;
}
.search-bar input::placeholder {
  color: #a0aec0;
}
/* Sidebar for search results */
.search-results-sidebar {
  position: fixed;
  top: 70px; /* ✅ push down below header/search bar */
  right: 0;
  width: 300px;
  height: calc(100% - 70px); /* ✅ fill remaining space */
  background: #080101;
  border-left: 2px solid #e2e8f0;
  box-shadow: -2px 0 8px rgba(154, 149, 149, 0.1);
  padding: 1rem;
  overflow-y: auto;
  transition: transform 0.3s ease-in-out;
  z-index: 2000;
}

.search-wrapper {
  position: relative;
  display: inline-block;
}

.search-bar {
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  background: #ffffff;
  width: 280px;
}

.search-bar ion-icon {
  margin-right: 6px;
  color: #6b7280;
}

.search-bar input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.9rem;
}

/* Dropdown like GitHub */
.search-dropdown {
  position: absolute;
  top: 80%; /* ✅ just below the search bar */
  left: 0;
  width: 100%;
  margin-top: 4px;
  background: #000000;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  max-height: 250px;
  overflow-y: auto;
}

.search-dropdown ul {
  list-style: none;
  margin: 0;
  padding: 0;
  color: #efefef;
}

.search-dropdown li {
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: background 0.2s;
}

.search-dropdown li:hover {
  background: #b9b9b928;
}

.search-dropdown li strong {
  font-size: 0.9rem;
  color: #eaeaea;
}

.search-dropdown li span {
  font-size: 0.8rem;
  color: #6b7280;
}

.search-dropdown.no-results {
  padding: 0.6rem;
  text-align: center;
  font-size: 0.85rem;
  color: #6b7280;
}

.search-results-sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
  color: #1349a7;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.results-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #718096;
}

.search-results-sidebar li {
  padding: 0.6rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  background: #f7fafc;
  cursor: pointer;
  transition: background 0.2s;
}

.search-results-sidebar li:hover {
  background: #edf2f7;
}

.no-results {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #718096;
}

/* Dashboard styles */
.dashboard h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.25rem;
}
.dashboard-subtitle {
  font-size: 0.9rem;
  color: #718096;
  margin-bottom: 2rem;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}
.dashboard-card {
  background: #fff;
  padding: 1.25rem;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.dashboard-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}
.dashboard-card ion-icon {
  font-size: 1.8rem;
  color: #3182ce;
  margin-bottom: 0.5rem;
}
.dashboard-card h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.dashboard-card p {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3748;
}

/* ✅ Tablet adjustment */
@media (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }
  .main-content {
    padding: 1.5rem;
  }
  .nav-wrapper nav {
    width: 100%;
    padding: 0.75em 1.5em;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

/* ✅ Mobile: make sidebar a drawer */
@media (max-width: 768px) {
  .dashboard-layout {
    flex-direction: column;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 1000;
    transform: translateX(-100%); /* hidden by default */
  }

  .sidebar.open {
    transform: translateX(0); /* slide in when toggled */
  }

  .main-content {
    padding: 1rem;
  }

  /* Mobile header + hamburger */
  .mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #1b1f3a;
    color: #fff;
    padding: 0.75rem 1rem;
  }

  .hamburger {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 24px;
    height: 18px;
    background: none;
    border: none;
    cursor: pointer;
  }

  .hamburger span {
    display: block;
    height: 3px;
    width: 100%;
    background: white;
    border-radius: 2px;
  }
  .nav-wrapper nav {
    width: 100%;
    padding: 0.75em 1.5em;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

/* ✅ Small Mobile tweaks */
@media (max-width: 480px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .search-bar {
    width: 100%;
  }
  .nav-wrapper nav {
    width: 100%;
    padding: 0.75em 1.5em;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.submenu {
  list-style: none;
  padding-left: 20px;
}
.submenu li {
  cursor: pointer;
  padding: 6px 12px;
  display: flex;
  align-items: center;
}
.chevron {
  margin-left: auto;
}
/* Layout body */
.layout-body {
  display: flex;
  flex: 1;
}

/* Sidebar (desktop & mobile drawer) */
.sidebar {
  width: 250px;
  min-height: 100%;
  background: #014025;
  color: #fff;
  flex-shrink: 0;
  padding: 1rem;
  transition: transform 0.3s ease;
}
.sidebar ul {
  list-style: none;
  padding: 0;
}
.sidebar li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  cursor: pointer;
}
.sidebar li:hover {
  color: #ffcc00;
}

/* Main content */
.content {
  flex: 1;
  width: 100%;
  min-height: 100vh; /* cover full screen height */
  background: #ffffff; /* or your gradient */
  box-sizing: border-box;
}

.nav-left {
  display: flex;
  align-items: center; /* ✅ aligns hamburger & logo vertically */
  gap: 0.75rem; /* space between hamburger and logo */
}
</style>

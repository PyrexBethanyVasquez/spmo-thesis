<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <p class="user-email">{{ user?.email }}</p>
        <span class="role-badge" :class="role">{{ role }}</span>
      </div>

      <nav class="sidebar-nav">
        <ul>
          <li @click="viewReports">
            <ion-icon name="document-text-outline"></ion-icon>
            View Reports
          </li>
          <li @click="departments">
            <ion-icon name="square-outline"></ion-icon>
            View Departments
          </li>

          <li @click="toggleDropdown">
            <ion-icon name="people-outline"></ion-icon>
            Manage Users
            <ion-icon
              :name="dropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'"
              class="chevron"
            ></ion-icon>
          </li>

          <!-- Dropdown List -->
          <ul v-if="dropdownOpen" class="submenu">
            <li @click="viewAllUsers">
              <ion-icon name="list-outline"></ion-icon>
              All Users
            </li>
            <li @click="createUser">
              <ion-icon name="shield-checkmark-outline"></ion-icon>
              Create Account
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

    <!-- Main Content -->
    <main class="main-content">
      <!-- Search Bar -->
      <!-- Admin Dashboard -->
      <div v-if="role === 'admin'" class="dashboard">
        <div class="dashboard-header">
          <h2>Admin Dashboard</h2>

          <!-- Search Bar (aligned right) -->
          <!-- Search Bar (aligned right) -->
          <div class="search-wrapper">
            <div class="search-bar">
              <ion-icon name="search-outline"></ion-icon>
              <input type="text" v-model="searchQuery" placeholder="Search dashboard items..." />
            </div>

            <!-- ✅ Dropdown results like GitHub -->
            <div v-if="searchResults.length" class="search-dropdown">
              <ul>
                <li v-for="item in searchResults" :key="item.item_no" @click="goToItem(item)">
                  <strong>{{ item.name }} | {{ item.model_brand }}</strong>
                  <span>{{ item.property_no }} – {{ item.location }}</span>
                </li>
              </ul>
            </div>

            <!-- No results message -->
            <div v-else-if="searchQuery.trim()" class="search-dropdown no-results">
              <p>No items found.</p>
            </div>
          </div>
        </div>

        <p class="dashboard-subtitle">Quick overview of system stats</p>

        <div class="card-grid">
          <div class="dashboard-card">
            <ion-icon name="cube-outline"></ion-icon>
            <h3>Total Items</h3>
            <p>{{ totalItems }}</p>
          </div>
          <div class="dashboard-card">
            <ion-icon name="people-outline"></ion-icon>
            <h3>Total Transactions</h3>
            <p>N/A</p>
          </div>
          <div class="dashboard-card">
            <ion-icon name="bar-chart-outline"></ion-icon>
            <h3>Reports Generated</h3>
            <p>N/A</p>
          </div>
          <div class="dashboard-card">
            <ion-icon name="time-outline"></ion-icon>
            <h3>Pending Requests</h3>
            <p>N/A</p>
          </div>
        </div>
      </div>

      <!-- User Dashboard tba -->
      <div v-if="role === 'user'" class="dashboard">
        <h2>Staff Dashboard</h2>
        <p class="dashboard-subtitle">Your quick activity summary</p>

        <div class="card-grid">
          <div class="dashboard-card">
            <ion-icon name="qr-code-outline"></ion-icon>
            <h3>Scans Today</h3>
            <p>14</p>
          </div>
          <div class="dashboard-card">
            <ion-icon name="document-outline"></ion-icon>
            <h3>Items Logged</h3>
            <p>6</p>
          </div>
          <div class="dashboard-card">
            <ion-icon name="checkmark-done-outline"></ion-icon>
            <h3>Completed Tasks</h3>
            <p>3</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import router from '@/router/index.js'
import { supabase } from '../../clients/supabase.js'

export default {
  name: 'HomeView',
  data() {
    return {
      user: null,
      role: null,
      searchQuery: '',
      totalItems: 0,
      searchResults: [],
      dropdownOpen: false,
    }
  },

  watch: {
    searchQuery(newVal) {
      if (newVal.trim() === '') {
        this.searchResults = []
      } else {
        this.searchItems(newVal)
      }
    },
  },
  async mounted() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Auth error:', userError.message)
      return
    }

    this.user = user

    if (this.user) {
      const { data: profile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', this.user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching role:', error.message)
        this.role = 'user'
      } else {
        this.role = profile?.role || 'user'
      }
    }

    if (this.role === 'admin') {
      await this.fetchTotalItems()
    }
  },
  methods: {
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen
    },
    async fetchTotalItems() {
      const { count, error } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error('Error fetching total items:', error.message)
        this.totalItems = 0
      } else {
        this.totalItems = count || 0
      }
    },

    async searchItems(query) {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .or(
          `name.ilike.%${query}%,property_no.ilike.%${query}%,location.ilike.%${query}%,model_brand.ilike.%${query}%`,
        )
        .order('item_no', { ascending: true })

      if (error) {
        console.error('Error searching items:', error.message)
        this.searchResults = []
      } else {
        this.searchResults = data || []
      }
    },

    goToItem(item) {
      this.$router.push({ path: '/items', query: { itemId: item.item_no } })
    },

    logout() {
      supabase.auth.signOut().then(() => {
        router.push('/')
      })
    },
    departments() {
      this.$router.push('/items')
    },
    createUser() {
      this.$router.push('/createaccount')
    },
    viewReports() {
      this.$router.push('/reports')
    },
    viewAllUsers() {
      this.$router.push('/users-list') //tba
    },
  },
}
</script>

<style scoped>
/* Layout */
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
  padding: 2rem;
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
  background: #3182ce;
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
  background: #2d3748;
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
  border: 1px solid #cbd5e0;
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

/* Search Bar */
.search-bar {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  padding: 0.4rem 0.8rem;
  width: 250px;
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
  background: #fff;
  border-left: 2px solid #e2e8f0;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
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
  color: #2d3748;
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

.search-results-sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
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
</style>

<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>SPMO</h2>
        <p>{{ user?.email }}</p>
        <span class="role-badge" :class="role">{{ role }}</span>
      </div>

      <!-- Admin Navigation -->
      <nav v-if="role === 'admin'" class="sidebar-nav">
        <ul>
          <li @click="systemSettings">
            <ion-icon name="settings-outline"></ion-icon>
            <span>Item Inventory</span>
          </li>
          <li @click="manageUsers">
            <ion-icon name="people-circle-outline"></ion-icon>
            <span>Manage Users</span>
          </li>
          <li @click="viewReports">
            <ion-icon name="bar-chart-outline"></ion-icon>
            <span>View Reports</span>
          </li>
        </ul>
      </nav>

      <!-- User Navigation -->
      <nav v-if="role === 'user'" class="sidebar-nav">
        <ul>
          <li @click="startScanning">
            <ion-icon name="qr-code-outline"></ion-icon>
            <span>Scan Items</span>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <button @click="logout" class="logout-btn">
          <ion-icon name="log-out-outline"></ion-icon>
          Logout
        </button>
      </div>
    </aside>

    <main class="main-content">
      <!-- <h1>Welcome back, {{ user?.email }}</h1> -->

      <!-- Admin Dashboard -->
      <div v-if="role === 'admin'">
        <h2>Admin Dashboard</h2>
        <p class="dashboard-subtitle">Quick overview of system stats</p>

        <div class="card-grid">
          <div class="dashboard-card">
            <ion-icon name="cube-outline"></ion-icon>
            <h3>Total Items</h3>
            <p>1</p>
          </div>
          <div class="dashboard-card">
            <ion-icon name="people-outline"></ion-icon>
            <h3>Total Transactions</h3>
            <p>2</p>
          </div>
          <div class="dashboard-card">
            <ion-icon name="bar-chart-outline"></ion-icon>
            <h3>Reports Generated</h3>
            <p>3</p>
          </div>
          <div class="dashboard-card">
            <ion-icon name="time-outline"></ion-icon>
            <h3>Inventory Pending Requests</h3>
            <p>4</p>
          </div>
        </div>
      </div>

      <!-- User Dashboard -->
      <div v-if="role === 'user'">
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
    }
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
  },
  methods: {
    logout() {
      supabase.auth.signOut().then(() => {
        router.push('/')
      })
    },
    systemSettings() {
      this.$router.push('/items')
    },
    manageUsers() {
      this.$router.push('/users')
    },
    viewReports() {
      this.$router.push('/reports')
    },
    startScanning() {
      this.$router.push('/scanner')
    },
  },
}
</script>

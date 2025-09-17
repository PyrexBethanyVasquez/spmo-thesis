<template>
  <div class="home">
    <h1>Welcome to SPMO Project</h1>
    <p>Hello, {{ user?.email }}</p>
    <p>
      Your role:
      <span class="role-badge" :class="role">{{ role }}</span>
    </p>

    <div class="logout-section">
      <button @click="logout" class="logout-btn">Logout</button>
    </div>

    <!-- Admin Dashboard -->
    <div v-if="role === 'admin'" class="admin-dashboard">
      <h2 class="dashboard-title">Admin Dashboard</h2>
      <p class="dashboard-subtitle">Welcome back! Choose an action below:</p>

      <div class="dashboard-grid">
        <div class="dashboard-card" @click="manageUsers">
          <ion-icon name="people-circle-outline"></ion-icon>
          <h3>Manage Users</h3>
          <p>Add, edit, or remove users</p>
        </div>

        <div class="dashboard-card" @click="viewReports">
          <ion-icon name="bar-chart-outline"></ion-icon>
          <h3>View Reports</h3>
          <p>Check analytics & statistics</p>
        </div>

        <div class="dashboard-card" @click="systemSettings">
          <ion-icon name="settings-outline"></ion-icon>
          <h3>Item Inventory</h3>
          <p>Manage and track items</p>
        </div>
      </div>
    </div>

    <!-- User Dashboard -->
    <div v-if="role === 'user'" class="user-dashboard">
      <h2 class="dashboard-title">Staff Dashboard</h2>
      <p class="dashboard-subtitle">You have access to scan items only:</p>

      <div class="scanner-card">
        <ion-icon name="qr-code-outline"></ion-icon>
        <h3>Scanning Mode</h3>
        <p>Point your device to scan an item QR code.</p>
        <button @click="startScanning">Start Scan</button>
      </div>
    </div>
  </div>
</template>

<script>
import router from '@/router/index.js'
import { supabase } from '../clients/supabase.js'

export default {
  name: 'HomeView',
  data() {
    return {
      user: null,
      role: null,
    }
  },
  async mounted() {
    //  get the user from supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log('Auth user id:', user.id)

    if (userError) {
      console.error('Auth error:', userError.message)
      return
    }

    this.user = user

    // fetch user role if exists
    if (this.user) {
      const { data: profile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', this.user.id)
        .maybeSingle()

      console.log('Fetched profile:', profile, 'Error:', error)

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
      const { error } = supabase.auth.signOut()
      if (error) {
        console.log('Error logging out:', error.message)
      } else {
        console.log('Logged out successfully')
        router.push('/login')
      }
    },
  },
}
</script>

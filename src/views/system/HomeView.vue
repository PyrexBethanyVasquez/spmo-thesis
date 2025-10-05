<template>
  <div>
    <!-- Admin Dashboard -->
    <div v-if="role === 'admin'" class="dashboard">
      <div class="dashboard-header">
        <h2>Admin Dashboard</h2>

        <!-- Search -->
        <div class="search-wrapper">
          <div class="search-bar">
            <ion-icon name="search-outline" />
            <input type="text" v-model="searchQuery" placeholder="Search dashboard items..." />
          </div>

          <!-- Results Dropdown -->
          <div v-if="searchResults.length" class="search-dropdown">
            <ul>
              <li v-for="item in searchResults" :key="item.item_no" @click="goToItem(item)">
                <strong>{{ item.name }} | {{ item.model_brand }}</strong>
                <span>{{ item.property_no }} – {{ item.location }}</span>
              </li>
            </ul>
          </div>

          <!-- No results -->
          <div v-else-if="searchQuery.trim()" class="search-dropdown no-results">
            <p>No items found.</p>
          </div>
        </div>
      </div>

      <p class="dashboard-subtitle">Quick overview of system stats</p>

      <!-- Cards -->
      <div class="card-grid">
        <div class="dashboard-card">
          <ion-icon name="cube-outline" />
          <h3>Total Items</h3>
          <p>{{ totalItems }}</p>
        </div>
        <!-- <div class="dashboard-card">
          <ion-icon name="people-outline" />
          <h3>Total Transactions</h3>
          <p>N/A</p>
        </div> -->
        <div class="dashboard-card">
          <ion-icon name="people-outline" />
          <h3>Total Users</h3>
          <p>{{ totalUsers }}</p>
        </div>

        <div class="dashboard-card">
          <ion-icon name="bar-chart-outline" />
          <h3>Reports Generated</h3>
          <p>{{ totalReports }}</p>
        </div>
        <div class="dashboard-card">
          <ion-icon name="time-outline" />
          <h3>Pending Requests</h3>
          <p>N/A</p>
        </div>
      </div>
    </div>

    <!-- Staff Dashboard (optional) -->
    <!--
    <div v-else class="dashboard">
      <h2>Staff Dashboard</h2>
      <p class="dashboard-subtitle">Your quick activity summary</p>

      <div class="card-grid">
        <div class="dashboard-card">
          <ion-icon name="qr-code-outline" />
          <h3>Scans Today</h3>
          <p>14</p>
        </div>
        <div class="dashboard-card">
          <ion-icon name="document-outline" />
          <h3>Items Logged</h3>
          <p>6</p>
        </div>
        <div class="dashboard-card">
          <ion-icon name="checkmark-done-outline" />
          <h3>Completed Tasks</h3>
          <p>3</p>
        </div>
      </div>
    </div>
    -->
  </div>
</template>

<script>
import { supabase } from '@/clients/supabase.js'

export default {
  name: 'HomeView',
  data() {
    return {
      role: 'user',
      totalItems: 0,
      totalUsers: 0,
      totalReports: 0,
      searchQuery: '',
      searchResults: [],
    }
  },
  watch: {
    searchQuery(newVal) {
      if (!newVal.trim()) this.searchResults = []
      else this.searchItems(newVal)
    },
  },
  async mounted() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    //console.log(user.user_metadata)

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      this.role = profile?.role || 'user'
    }
    if (this.role === 'admin') {
      this.fetchTotalItems()
      this.fetchTotalUsers()
    }
  },
  methods: {
    async fetchTotalItems() {
      const { count } = await supabase.from('items').select('*', { count: 'exact', head: true })
      this.totalItems = count || 0
    },
    async fetchTotalUsers() {
      try {
        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session) {
          console.error('No active session:', sessionError)
          return
        }

        // Call Edge Function to get total users
        const res = await fetch(
          'https://hogtogfgaayfcaunjmyv.supabase.co/functions/v1/get-users-count',
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          },
        )

        if (!res.ok) {
          console.error('Error calling edge function:', res.statusText)
          return
        }

        const data = await res.json()

        // Set totalUsers from response
        this.totalUsers = data.totalUsers || 0
      } catch (err) {
        console.error('Error fetching total users:', err)
        this.totalUsers = 0
      }
    },
    async searchItems(query) {
      const { data } = await supabase
        .from('items')
        .select('*')
        .or(
          `name.ilike.%${query}%,property_no.ilike.%${query}%,location.ilike.%${query}%,model_brand.ilike.%${query}%`,
        )
        .order('item_no', { ascending: true })
      this.searchResults = data || []
    },
    goToItem(item) {
      this.$router.push({ path: '/items', query: { itemId: item.item_no } })
    },
  },
}
</script>

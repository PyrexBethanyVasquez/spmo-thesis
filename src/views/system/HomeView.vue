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
            <input v-model="searchQuery" placeholder="Search items..." />
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

<script setup>
import { supabase } from '@/clients/supabase.js'
import { useItemStore } from '@/stores/useItemStore'
import { useRouter } from 'vue-router'
import { ref, onMounted, watch } from 'vue'

const store = useItemStore()
const router = useRouter()

const role = ref('user')
const totalItems = ref(0)
const totalUsers = ref(0)
const totalReports = ref(0)
const searchQuery = ref('')
const searchResults = ref([])

watch(searchQuery, (newVal) => {
  if (!newVal.trim()) searchResults.value = []
  else doSearch(newVal)
})

async function fetchTotalItems() {
  const { count } = await supabase.from('items').select('*', { count: 'exact', head: true })
  totalItems.value = count || 0
}

async function fetchTotalUsers() {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) return

    const res = await fetch(
      'https://hogtogfgaayfcaunjmyv.supabase.co/functions/v1/get-users-count',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (res.ok) {
      const data = await res.json()
      totalUsers.value = data.totalUsers || 0
    }
  } catch (err) {
    console.error('Error fetching total users:', err)
    totalUsers.value = 0
  }
}

async function doSearch() {
  await store.searchItems(searchQuery.value)
  searchResults.value = store.searchResults
}

function goToItem(item) {
  router.push({ path: '/view-items', query: { itemId: item.item_no } })
}

onMounted(async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    role.value = profile?.role || 'user'
  }

  if (role.value === 'admin') {
    await fetchTotalItems()
    await fetchTotalUsers()
  }
})
</script>

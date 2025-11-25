<template>
  <div>
    <!-- Admin Dashboard -->
    <div v-if="role === 'admin'" class="dashboard">
      <div class="dashboard-header">
        <h2>Admin Dashboard</h2>

        <!-- Search -->
        <div class="search-wrapper">
          <div class="search-bar-dashboard">
            <ion-icon name="search-outline" />
            <input v-model="searchQuery" placeholder="Search items" />
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

      <!-- Skeleton while loading -->
      <transition name="fade">
        <div v-if="loading" class="skeleton-wrapper">
          <!-- Skeleton Cards -->
          <div class="card-grid">
            <div class="skeleton-card" v-for="n in 4" :key="'card-' + n"></div>
          </div>

          <!-- Skeleton Charts -->
          <div class="charts-grid">
            <div class="skeleton-chart" v-for="n in 3" :key="'chart-' + n"></div>
          </div>

          <!-- Skeleton Overview -->
          <div class="overview-grid">
            <div class="skeleton-overview" v-for="n in 3" :key="'overview-' + n"></div>
          </div>

          <!-- Skeleton Table -->
          <div class="skeleton-table">
            <div class="skeleton-row" v-for="n in 3" :key="n"></div>
          </div>
        </div>

        <div v-else>
          <!-- Summary Cards -->
          <div class="card-grid">
            <div class="dashboard-card">
              <ion-icon name="cube-outline" />
              <h3>Total Items</h3>
              <p>{{ totalItems }}</p>
            </div>

            <div class="dashboard-card">
              <ion-icon name="cash-outline" />
              <h3>Total Purchase Order</h3>
              <p>₱ {{ totalPurchaseAmount.toLocaleString() }}</p>
            </div>

            <div class="dashboard-card">
              <ion-icon name="qr-code-outline" />
              <h3>Tagged Items</h3>
              <p>{{ taggedItems }}</p>
            </div>

            <div class="dashboard-card">
              <ion-icon name="swap-horizontal-outline" />
              <h3>Transactions Today</h3>
              <p>{{ todayTransactions }}</p>
            </div>
          </div>

          <!-- Graph Section -->
          <div class="charts-section">
            <h3>Visual Overview</h3>
            <div class="charts-grid">
              <div class="chart-box">
                <canvas id="barChart"></canvas>
                <p>Items by Condition</p>
              </div>
              <div class="chart-box">
                <canvas id="pieChart"></canvas>
                <p>Tagged vs Untagged</p>
              </div>
              <div class="chart-box">
                <canvas id="lineChart"></canvas>
                <p>Transactions Over Time</p>
              </div>
            </div>
          </div>

          <!-- System Overview -->
          <div class="system-overview">
            <h3>System Overview</h3>
            <div class="overview-grid">
              <div class="overview-box">
                <ion-icon name="people-outline" />
                <div>
                  <h4>Total Users</h4>
                  <p>{{ totalUsers }}</p>
                </div>
              </div>

              <div class="overview-box">
                <ion-icon name="people-outline" />
                <div>
                  <h4>Total Supplier</h4>
                  <p>{{ totalSuppliers }}</p>
                </div>
              </div>

              <div class="overview-box">
                <ion-icon name="construct-outline" />

                <div>
                  <h4>Unserviceable / For Disposal</h4>

                  <p>{{ damagedItems }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Transactions -->
          <div class="recent-transactions">
            <h3>Recent Transactions</h3>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Added by</th>
                  <th>Received by</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in recentTransactions" :key="t.id">
                  <td>{{ t.item_name }}</td>
                  <td>{{ t.user }}</td>
                  <td>{{ t.recipient }}</td>
                  <td>{{ t.department }}</td>
                  <td>{{ t.status }}</td>
                  <td>{{ t.date }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/clients/supabase.js'
import { useItemStore } from '@/stores/useItemStore'
import Chart from 'chart.js/auto'

const store = useItemStore()
const router = useRouter()

const role = ref('user')
const totalItems = ref(0)
const totalUsers = ref(0)

const totalPOs = ref(0)
const itemsWithPO = ref([])
const totalSuppliers = ref(0)
const taggedItems = ref(0)
const damagedItems = ref(0)
const todayTransactions = ref(0)
const searchQuery = ref('')
const searchResults = ref([])
const condition_names = ref([])
const recentTransactions = ref([])
const loading = ref(true)
const totalPurchaseAmount = ref(0)

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
    } = await supabase.auth.getSession()
    if (!session) return

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
  }
}

async function fetchConditions() {
  // Step 1: Fetch condition names (with IDs)
  const { data: conditions, error } = await supabase
    .from('condition')
    .select('condition_id, condition_name')
    .order('condition_name', { ascending: true })

  if (error) {
    console.error('Error fetching conditions:', error.message)
    condition_names.value = []
    return
  }

  condition_names.value = conditions ? conditions.map((c) => c.condition_name) : []

  // Step 2: Count items per condition
  const conditionCounts = []
  for (const condition of conditions) {
    const { count, error: countError } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('condition_id', condition.condition_id)

    if (countError) {
      console.error(`Error counting items for ${condition.condition_name}:`, countError.message)
      conditionCounts.push(0)
    } else {
      conditionCounts.push(count || 0)
    }
  }

  // Step 3: Draw the chart
  const ctx = document.getElementById('barChart')
  if (!ctx) {
    console.warn('barChart canvas not found')
    return
  }

  // Destroy existing chart if already rendered
  if (fetchConditions.barChartInstance) {
    fetchConditions.barChartInstance.destroy()
  }

  // Create new bar chart
  fetchConditions.barChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: condition_names.value,
      datasets: [
        {
          label: 'Items per Condition',
          data: conditionCounts,
          backgroundColor: ['#f44336', '#ff9800', '#4caf50', '#2196f3', '#9c27b0'],
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: 'Item Conditions Overview',
          font: { size: 16 },
        },
      },
    },
  })
}

async function fetchItemsWithPO() {
  const { data, error } = await supabase
    .from('items')
    .select(
      `
      *,
      purchase_order:purchase_order!inner(*),
      action:status(action_id, action_name)

    `,
    )
    .order('item_no', { ascending: true })

  if (error) {
    console.error(error)
    return
  }

  itemsWithPO.value = data
  // ✅ Calculate total purchase order amount
  const totalAmount = data.reduce((sum, item) => {
    // Ensure purchase_order and amount exist
    const amount = item.purchase_order?.total_amount || 0
    return sum + amount
  }, 0)

  totalPurchaseAmount.value = totalAmount
  calculateSummary()
}

async function fetchRecentTransactions() {
  // 1️⃣ Fetch recent transactions
  const { data: transactions, error: txnError } = await supabase
    .from('transaction')
    .select('*')
    .order('date', { ascending: false })
    .limit(5)

  if (txnError) {
    console.error('Error fetching transactions:', txnError.message)
    recentTransactions.value = []
    return
  }

  if (!transactions || transactions.length === 0) {
    recentTransactions.value = []
    return
  }

  // Extract IDs
  const itemNos = transactions.map((t) => t.item_no).filter(Boolean)
  const deptIds = transactions.map((t) => t.dept_id).filter(Boolean)
  const actIds = transactions.map((t) => t.action_id).filter(Boolean)
  const recipID = transactions.map((t) => t.indiv_txn_id).filter(Boolean)

  // 2️⃣ Fetch items
  let items = []
  if (itemNos.length > 0) {
    const { data, error } = await supabase
      .from('items')
      .select('item_no, name, status')
      .in('item_no', itemNos)
    if (error) console.error('Error fetching items:', error.message)
    items = data || []
  }

  // 3️⃣ Fetch users from your Deno endpoint instead of Supabase table
  let users = []
  try {
    const tokenRes = await supabase.auth.getSession()
    const session = tokenRes.data?.session

    const res = await fetch('https://hogtogfgaayfcaunjmyv.supabase.co/functions/v1/get-users', {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    const json = await res.json()

    if (!json.error) {
      users = json.users || []
    } else {
      console.error('User fetch error:', json.error)
    }
  } catch (err) {
    console.error('Failed getting users from Deno endpoint:', err)
  }

  // 4️⃣ Fetch recipient names
  let recipient = []
  if (recipID.length > 0) {
    const { data, error } = await supabase
      .from('individual_transaction')
      .select('indiv_txn_id, recipient_name')
      .in('indiv_txn_id', recipID)
    if (error) console.error('Error fetching recipient:', error.message)
    recipient = data || []
  }

  // 5️⃣ Fetch departments
  let departments = []
  if (deptIds.length > 0) {
    const { data, error } = await supabase
      .from('department')
      .select('dept_id, dept_name')
      .in('dept_id', deptIds)
    if (error) console.error('Error fetching departments:', error.message)
    departments = data || []
  }

  // 6️⃣ Fetch actions
  let actions = []
  const { data: actData, error: actError } = await supabase
    .from('action')
    .select('action_id, action_name')
    .in('action_id', actIds)

  if (actError) console.error('Error fetching actions:', actError.message)
  actions = actData || []

  // 7️⃣ Maps
  const itemMap = Object.fromEntries(items.map((i) => [i.item_no, i]))
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.full_name])) // 🔥 Using Deno users endpoint
  const deptMap = Object.fromEntries(departments.map((d) => [d.dept_id, d.dept_name]))
  const actionMap = Object.fromEntries(actions.map((a) => [a.action_id, a.action_name]))
  const recipientMap = Object.fromEntries(recipient.map((r) => [r.indiv_txn_id, r.recipient_name]))

  // 8️⃣ Build output
  recentTransactions.value = transactions.map((t) => {
    const item = itemMap[t.item_no]
    return {
      id: t.txn_id,
      item_name: item?.name || 'Unknown Item',
      status: actionMap[t.action_id] || 'Pending',
      user: userMap[t.user_id] || 'Staff',
      recipient: recipientMap[t.indiv_txn_id] || 'N/A',
      department: deptMap[t.dept_id] || 'N/A',
      date: new Date(t.date).toLocaleDateString(),
    }
  })
}

let lineChartInstance = null

// Function to render the chart
async function renderTransactionChart() {
  const ctx = document.getElementById('lineChart')
  if (!ctx) return

  const { data: transactions, error } = await supabase
    .from('transaction')
    .select('date')
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching transactions:', error)
    return
  }

  // Check if transactions exist
  if (!transactions || transactions.length === 0) {
    // Destroy previous chart if exists
    if (lineChartInstance) lineChartInstance.destroy()

    // Render a chart with a single "No data" label
    lineChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['No Data'],
        datasets: [
          {
            label: 'Transactions',
            data: [0],
            borderColor: '#673ab7',
            backgroundColor: '#673ab7',
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          title: { display: true, text: 'Transactions Over Time' },
        },
        scales: {
          x: { title: { display: true, text: 'Date' } },
          y: {
            title: { display: true, text: 'Transactions' },
            beginAtZero: true,
            ticks: {
              precision: 0, // removes decimals
              callback: function (value) {
                return Number.isInteger(value) ? value : null // only show whole numbers
              },
            },
          },
        },
      },
    })
    return
  }

  // Group transactions by date
  const dateCounts = {}
  transactions.forEach((txn) => {
    const date = new Date(txn.date).toLocaleDateString() // e.g., "10/18/2025"
    dateCounts[date] = (dateCounts[date] || 0) + 1
  })

  const labels = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b))
  const dataPoints = labels.map((label) => dateCounts[label])

  // Destroy existing chart if any
  if (lineChartInstance) lineChartInstance.destroy()

  // Create new chart
  lineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Transactions',
          data: dataPoints,
          borderColor: '#673ab7',
          backgroundColor: '#673ab7',
          tension: 0.2,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: { display: true, text: 'Transactions Over Time' },
      },
      scales: {
        x: { title: { display: true, text: 'Date' } },
        y: {
          title: { display: true, text: 'Transactions' },
          beginAtZero: true,
          ticks: {
            precision: 0, // removes decimals
            callback: function (value) {
              return Number.isInteger(value) ? value : null // only show whole numbers
            },
          },
        },
      },
    },
  })
}

async function fetchTodayTransactions() {
  // Philippine Time (UTC+8)
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const philippineNow = new Date(utc + 8 * 60 * 60000)

  const yyyy = philippineNow.getFullYear()
  const mm = String(philippineNow.getMonth() + 1).padStart(2, '0')
  const dd = String(philippineNow.getDate()).padStart(2, '0')
  const todayStr = `${yyyy}-${mm}-${dd}`

  const startOfDay = `${todayStr}T00:00:00+08:00`
  const endOfDay = `${todayStr}T23:59:59+08:00`

  const { count, error } = await supabase
    .from('transaction')
    .select('*', { count: 'exact', head: true })
    .gte('date', startOfDay)
    .lte('date', endOfDay)

  if (error) {
    console.error('Error fetching today transactions:', error.message)
    todayTransactions.value = 0
    return
  }

  todayTransactions.value = count || 0
}

async function fetchDamagedItems() {
  // Replace 'For Disposal' with the exact condition_name in your database
  const { count, error } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('condition_id', 2)

  if (error) {
    console.error('Error fetching damaged items:', error.message)
    damagedItems.value = 0
    return
  }

  damagedItems.value = count || 0
}

async function fetchTaggedItems() {
  const { data, error } = await supabase.from('items').select('status')

  if (error) {
    console.error('Error fetching tagged items:', error.message)
    taggedItems.value = 0
    return
  }

  // Count items whose status is not "Default"
  const taggedCount = data.filter((i) => i.status && i.status !== 5).length
  taggedItems.value = taggedCount
}

function calculateSummary() {
  totalItems.value = itemsWithPO.value.length
  totalPOs.value = itemsWithPO.value.filter((i) => i.purchase_order).length

  const suppliers = itemsWithPO.value.map((i) => i.purchase_order?.supplier).filter(Boolean)

  totalSuppliers.value = [...new Set(suppliers)].length
}
async function doSearch() {
  await store.searchItems(searchQuery.value)
  searchResults.value = store.searchResults
}

function goToItem(item) {
  router.push({ path: '/view-items', query: { itemId: item.item_no } })
}

// Simple chart renderers
async function initCharts() {
  const { data, error } = await supabase.from('items').select('status')

  if (error) {
    console.error('Error fetching item statuses:', error)
    return
  }

  // Count tagged and untagged based on status
  const tagged = data.filter((i) => i.status && i.status !== 5).length
  const untagged = data.filter((i) => i.status === 5).length

  // Destroy previous chart if it exists
  if (initCharts.pieChartInstance) {
    initCharts.pieChartInstance.destroy()
  }

  // Create new chart
  const ctx = document.getElementById('pieChart')
  if (!ctx) return

  initCharts.pieChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Tagged', 'Untagged'],
      datasets: [
        {
          data: [tagged, untagged],
          backgroundColor: ['#2196f3', '#9e9e9e'],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: { display: true, text: 'Tagged vs Untagged Items' },
      },
    },
  })
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
    await fetchItemsWithPO()
    await fetchRecentTransactions()
    await fetchTodayTransactions()
    await fetchDamagedItems()
    await fetchTaggedItems()
    loading.value = false
    await fetchConditions()
    await renderTransactionChart(recentTransactions.value)
    initCharts()
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.skeleton-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.skeleton-card,
.skeleton-chart,
.skeleton-overview,
.skeleton-row {
  background: linear-gradient(90deg, #eee 25%, #f7f7f7 50%, #eee 75%);
  background-size: 400% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

.card-grid .skeleton-card {
  height: 120px;
}

.charts-grid .skeleton-chart {
  height: 200px;
}

.overview-grid .skeleton-overview {
  height: 80px;
}

.skeleton-table {
  display: grid;
  gap: 0.5rem;
}

.skeleton-table .skeleton-row {
  height: 20px;
  border-radius: 4px;
}

@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}

.dashboard {
  padding: 20px;
}
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}
h3,
h4 {
  margin: 0.5rem 0;
  color: black;
}

p {
  margin: 0;
  color: #000000;
}
span {
  color: #8d0000;
}

.charts-section {
  margin-top: 2rem;
}
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
.chart-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
#pieChart {
  max-width: 250px; /* Slightly bigger */
  max-height: 250px;
  display: block;
  margin: 0 auto; /* Centers the chart nicely */
}

.system-overview {
  margin-top: 2rem;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
.overview-box {
  background: #f8f9fa;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}
.recent-transactions {
  margin-top: 2rem;
  overflow-x: auto; /* enable horizontal scrolling on small screens */
  -webkit-overflow-scrolling: touch; /* smooth scrolling for mobile */
}
.recent-transactions table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}
.recent-transactions th,
.recent-transactions td {
  border: 1px solid #ddd;
  padding: 8px;
  white-space: nowrap;
}
.recent-transactions th {
  background-color: #f3f3f3;
  text-align: left;
}

.recent-transactions tr {
  background-color: #ffffff;
  color: #000000;
  text-align: left;
}

.recent-transactions table thead th {
  background-color: #a7b982; /* green background */
  color: #000000; /* white text for contrast */
  font-weight: 600;
}
</style>

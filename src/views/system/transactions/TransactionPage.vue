<template>
  <div class="transactions-page">
    <h1>Transactions</h1>

    <!-- Filters -->
    <div class="filters">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Search by item, department, or user..."
      />
      <select v-model="filterStatus">
        <option value="">All Statuses</option>
        <option v-for="action in actions" :key="action.action_id" :value="action.action_id">
          {{ action.action_name }}
        </option>
      </select>

      <button class="filter-btn" @click="toggleSidebar">
        <ion-icon name="funnel-outline"></ion-icon>
      </button>
    </div>

    <!-- Slide Sidebar for Date Filter -->
    <div class="filter-sidebar" :class="{ open: showSidebar }">
      <div class="sidebar-header">
        <h3>Date Filter</h3>
        <button class="close-btn" @click="toggleSidebar">&times;</button>
      </div>
      <div class="sidebar-body">
        <label>Start Date</label>
        <input type="date" v-model="startDate" />

        <label>End Date</label>
        <input type="date" v-model="endDate" />

        <button class="apply-btn" @click="applyDateFilter">Apply</button>
      </div>
    </div>

    <div v-if="showSidebar" class="overlay" @click="toggleSidebar"></div>

    <transition name="fade" mode="out-in">
      <!-- 🔹 Skeleton loader when loading -->
      <div v-if="loading" key="loading" class="table-skeleton">
        <div class="skeleton-row" v-for="n in 3" :key="n"></div>
      </div>

      <!-- Transactions Table -->
      <div v-else key="data" class="table-wrapper">
        <table class="transactions-table">
          <thead>
            <tr>
              <th>Item No</th>
              <th>Item Name</th>
              <th>Department</th>
              <th>Status</th>

              <th>Location</th>
              <th>Serial Number</th>
              <th>Brand</th>
              <th>Received by</th>
              <th>Created By</th>
              <th>Created_at</th>
              <th>Updated_at</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="txn in filteredTransactions" :key="txn.id">
              <td>{{ txn.item_no }}</td>
              <td>{{ txn.item_name }}</td>
              <td>{{ txn.dept_name }}</td>
              <td>
                <span :class="['status-label', txn.status_name.toLowerCase()]">
                  {{ txn.status_name }}
                </span>
              </td>

              <td>{{ txn.location }}</td>
              <td>{{ txn.serial_no }}</td>
              <td>{{ txn.model_brand }}</td>
              <td>{{ txn.recipient_name }}</td>
              <td>{{ txn.user_name || 'Staff' }}</td>
              <td>{{ new Date(txn.date).toLocaleString() }}</td>
              <td>{{ txn.updated_at }}</td>
            </tr>
            <tr v-if="filteredTransactions.length === 0">
              <td colspan="9" class="no-data">No transactions found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </transition>
  </div>
</template>

<script>
import { supabase } from '../../../clients/supabase'

export default {
  name: 'TransactionsPage',
  data() {
    return {
      transactions: [],
      actions: [],
      searchQuery: '',
      filterStatus: '',
      startDate: '',
      endDate: '',
      showSidebar: false,
      loading: true,
    }
  },
  computed: {
    filteredTransactions() {
      // Filter client-side
      return this.transactions.filter((txn) => {
        // Search across item name, department name, or user name
        const matchesSearch =
          !this.searchQuery ||
          txn.item_no.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          txn.item_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          txn.dept_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (txn.user_name || 'admin').toLowerCase().includes(this.searchQuery.toLowerCase())

        // Filter by status
        const matchesStatus = !this.filterStatus || txn.status_id === Number(this.filterStatus)
        const txnDate = new Date(txn.date)
        const afterStart = !this.startDate || txnDate >= new Date(this.startDate)
        const beforeEnd = !this.endDate || txnDate <= new Date(this.endDate)

        return matchesSearch && matchesStatus && afterStart && beforeEnd
      })
    },
  },
  async mounted() {
    await this.fetchActions()
    await this.fetchTransactions()
    this.loading = false
  },
  methods: {
    async fetchTransactions() {
      const { data, error } = await supabase
        .from('transaction')
        .select(
          `
          txn_id,
          date,
          item:item_no(name, item_no, serial_no, model_brand, location, updated_at),
          department:dept_id(dept_id,dept_name),
          action:action_id(action_name),
          users:user_id(role),
          action_id,
          individual_transaction:indiv_txn_id(recipient_name)
        `,
        )
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching transactions:', error)
        return
      }

      // Map nested data to flat structure
      this.transactions = data.map((txn) => ({
        id: txn.txn_id,
        date: txn.date,
        updated_at: txn.item?.updated_at,
        item_no: txn.item?.item_no,
        item_name: txn.item?.name,
        serial_no: txn.item?.serial_no,
        model_brand: txn.item?.model_brand,
        location: txn.item?.location,
        dept_name: txn.department?.dept_name || 'N/A',
        recipient_name: txn.individual_transaction?.recipient_name || 'N/A',
        status_name: txn.action?.action_name || 'Issued',
        status_id: txn.action_id,
        user_name: txn.users?.role || 'staff',
      }))
    },

    async fetchActions() {
      const { data, error } = await supabase.from('action').select('*')
      if (!error) this.actions = data
    },
    toggleSidebar() {
      this.showSidebar = !this.showSidebar
    },

    applyDateFilter() {
      this.toggleSidebar()
    },
  },
}
</script>

<style scoped>
/* --- Table Skeleton (Supabase-style) --- */
/* --- Table Skeleton (Supabase-style stair effect) --- */
.skeleton-table {
  width: 100%;
  border-collapse: collapse;
}

.skeleton-row {
  height: 20px;
  margin-bottom: 12px;
  border-radius: 6px;
  background: #e0e0e0;
  animation: pulse 1.5s infinite ease-in-out;
}

/* Row width variations for stair effect */
.skeleton-row:nth-child(1) {
  width: 100%; /* Longest */
}
.skeleton-row:nth-child(2) {
  width: 70%; /* Medium */
}
.skeleton-row:nth-child(3) {
  width: 40%; /* Shortest */
}

/* Pulse shimmer */
@keyframes pulse {
  0% {
    background-color: #e0e0e0;
  }
  50% {
    background-color: #f5f5f5;
  }
  100% {
    background-color: #e0e0e0;
  }
}

/* Optional fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.transactions-page {
  padding: 24px;
}

h1 {
  color: #1b1b1b;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap; /* wrap on small screens */
}

.filters input,
.filters select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 14px;
  flex: 1 1 150px; /* allow shrinking and growing */
}

.filters button {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background-color: #d5d5d5;
  color: rgb(0, 0, 0);
  cursor: pointer;
  transition: background-color 0.2s;
}

.filters button:hover {
  background-color: #dfe0e1;
}

.filter-btn {
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-sidebar {
  position: fixed;
  top: 0;
  right: -300px;
  width: 280px;
  height: 100%;
  background: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  padding: 20px;
  z-index: 1000;
}
.filter-sidebar.open {
  right: 0;
}
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  color: #1b1b1b;
}
.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
}
.sidebar-body {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #1b1b1b;
}
.apply-btn {
  margin-top: 10px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 900;
}

.filters .filter-btn ion-icon {
  font-size: 18px; /* ✅ Makes the icon proportionate */
  margin-right: 4px;
  text-align: center;
}

.filter-sidebar input[type='date'] {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  background-color: #fafafa;
  margin-bottom: 16px;
  transition: border-color 0.2s ease;
}

.filter-sidebar input[type='date']:focus {
  border-color: #007bff;
  outline: none;
  background-color: #fff;
}

.table-wrapper {
  overflow-x: auto;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  max-width: 100%;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
  width: max-content;
}

.transactions-table th,
.transactions-table td {
  border-bottom: 1px solid #ddd; /* Only horizontal line */
  padding: 12px 8px;
  text-align: center;
}

.transactions-table th {
  background-color: #a7b982;
  color: #1b1b1b;
  font-weight: 600;
  position: relative;
  top: 0;
}

.transactions-table tr:nth-child(even) {
  background-color: #fafafa;
}

.transactions-table tr:hover {
  background-color: #e6f2ff;
}

.transactions-table td {
  color: #2c3e50;
  font-size: 14px;
}

.status-label {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  color: #fff;
}

.no-data {
  text-align: center;
  padding: 16px;
  color: #7f8c8d;
  font-style: italic;
}

/* ================== Responsive ================== */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }

  .filters input,
  .filters select,
  .filters button {
    width: 100%;
    flex: 1 1 auto;
  }

  .transactions-table {
    font-size: 12px;
    min-width: 100%;
  }

  .transactions-table th,
  .transactions-table td {
    padding: 8px 6px;
  }
}

@media (max-width: 480px) {
  .transactions-table th,
  .transactions-table td {
    padding: 6px 4px;
  }

  .status-label {
    font-size: 10px;
    padding: 1px 6px;
  }
}
</style>

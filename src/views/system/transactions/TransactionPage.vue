<template>
  <div class="transactions-page">
    <h1>Item Logs</h1>
    <p>Access detailed logs of item actions and system events.</p>

    <!-- Filters -->
    <!-- Filters Toolbar -->
    <div class="filters-toolbar">
      <div class="search-box">
        <ion-icon name="search-outline"></ion-icon>
        <input type="text" v-model="searchQuery" placeholder="Search transactions..." />
      </div>

      <select v-model="filterStatus" class="status-filter">
        <option value="">All Statuses</option>
        <option v-for="action in actions" :key="action.action_id" :value="action.action_id">
          {{ action.action_name }}
        </option>
      </select>

      <button class="date-btn" @click="toggleSidebar">
        <ion-icon name="calendar-outline"></ion-icon> Filter by Date
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
              <th>Activity</th>
              <th>Item No</th>
              <th>Item Name</th>
              <th>Department</th>
              <th>Status</th>

              <th>Location</th>
              <th>Serial Number</th>
              <th>Brand</th>

              <th>Received by</th>
              <th>Purchase Order</th>
              <th>Created_at</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="txn in filteredTransactions" :key="txn.id">
              <td>
                <span :class="['status-label', txn.activity ? txn.activity.toLowerCase() : '']">
                  {{
                    txn.activity
                      ? txn.activity.charAt(0).toUpperCase() + txn.activity.slice(1)
                      : '-'
                  }}
                </span>
              </td>
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
              <td>
                <button v-if="txn.po_no" class="po-btn" @click="openPOModal(txn)">
                  View Details
                </button>
                <span v-else>-</span>
              </td>
              <td>{{ new Date(txn.date).toLocaleString() }}</td>

              <!-- PO Overlay Modal -->
              <transition name="modal-fade">
                <div v-if="showPOModal" class="overlay" @click.self="closePOModal">
                  <div class="overlay-content">
                    <div class="modal-header">
                      <h2>Purchase Order Details</h2>
                      <button class="close-icon" @click="closePOModal">
                        <ion-icon name="close-circle-outline" size="large"></ion-icon>
                      </button>
                    </div>
                    <div class="modal-body">
                      <div class="modal-row">
                        <span class="label">PO Number:</span>
                        <span class="value">{{ selectedPO?.po_no }}</span>
                      </div>
                      <div class="modal-row">
                        <span class="label">Supplier:</span>
                        <span class="value">{{ selectedPO?.supplier }}</span>
                      </div>
                      <div class="modal-row">
                        <span class="label">Total Amount:</span>
                        <span class="value">
                          {{ selectedPO?.total_amount ? +selectedPO.total_amount : '-' }}
                        </span>
                      </div>
                      <div class="modal-row">
                        <span class="label">Order Date:</span>
                        <span class="value">{{ selectedPO?.order_date || '-' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </transition>
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
      showPOModal: false,
      selectedPO: null,
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
          item:item_no(name, item_no, serial_no, model_brand, location),
          purchase_order:po_no (
            po_no,
            supplier,
            total_amount,
            order_date
          ),

          department:dept_id(dept_id,dept_name),
          action:action_id(action_name),
          users:user_id(full_name),
          action_id,
          individual_transaction:indiv_txn_id(recipient_name),
          activity
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
        item_no: txn.item?.item_no,
        item_name: txn.item?.name,
        serial_no: txn.item?.serial_no,
        model_brand: txn.item?.model_brand,
        location: txn.item?.location,
        dept_name: txn.department?.dept_name || 'N/A',
        recipient_name: txn.individual_transaction?.recipient_name || 'N/A',
        status_name: txn.action?.action_name || 'Issued',
        status_id: txn.action_id,
        user_name: txn.users?.full_name || 'staff',
        po_no: txn.purchase_order?.po_no || '-',
        supplier: txn.purchase_order?.supplier || '-',
        total_amount: txn.purchase_order?.total_amount || null,
        order_date: txn.purchase_order?.order_date || null,
        activity: txn.activity || null,
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
    openPOModal(txn) {
      this.selectedPO = txn
      this.showPOModal = true
    },
    closePOModal() {
      this.showPOModal = false
      this.selectedPO = null
    },
  },
}
</script>

<style scoped>
.status-label.delete {
  background-color: #ffe6e6; /* light red */
  color: #a00; /* dark red text */
  font-weight: bold;
  border-radius: 4px;
  padding: 2px 6px;
}
.status-label.update {
  background-color: #fff4e6;
  color: #b56700;
  font-weight: bold;
  border-radius: 4px;
  padding: 2px 6px;
}

.status-label.create {
  background-color: #e6f7ff; /* light blue */
  color: #0077b6; /* blue text */
  font-weight: bold;
  border-radius: 4px;
  padding: 2px 6px;
}
.status-label.unknown {
  background-color: #e6f7ff; /* light blue */
  color: #777777; /* blue text */
  font-weight: bold;
  border-radius: 4px;
  padding: 2px 6px;
}

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
p {
  color: #64748b;
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
}

.transactions-table th,
.transactions-table td {
  border-bottom: 1px solid #ddd; /* Only horizontal line */
  padding: 12px 8px;
  text-align: center;
  white-space: nowrap;
}

.transactions-table th {
  background-color: #a7b982;
  color: #1b1b1b;
  font-weight: 600;
  position: sticky;
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

/* Toolbar */
.filters-toolbar {
  display: flex;
  gap: 12px;
  margin: 20px 0;
  align-items: center;
  flex-wrap: wrap;
}

/* Search Box */
.search-box {
  display: flex;
  align-items: center;
  background: white;
  padding: 8px 12px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  flex: 1 1 200px;
  min-width: 0;
}

.search-box ion-icon {
  font-size: 18px;
  color: #000000;
}

.search-box input {
  border: none;
  outline: none;
  width: 100%;
  margin-left: 8px;
}

.status-filter {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.date-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

/* Sidebar */
.filter-sidebar {
  position: fixed;
  top: 0;
  right: -320px;
  width: 300px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: 0.3s ease;
  z-index: 100;
}

.filter-sidebar.open {
  right: 0;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-body label {
  margin-top: 15px;
  font-weight: bold;
}

.apply-btn {
  margin-top: 20px;
  width: 100%;
  padding: 10px;
  background: #4f46e5;
  color: white;
  border-radius: 8px;
  border: none;
}

/* Overlay */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 50;
}

/* RESPONSIVE — TABLETS */
@media (max-width: 768px) {
  .filter-box {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .filter-box label {
    font-size: 13px;
  }

  .filter-box select,
  .filter-box input {
    width: 100%;
  }
}

/* RESPONSIVE — MOBILE */
@media (max-width: 480px) {
  .filter-box {
    padding: 10px 12px;
    border-radius: 6px;
  }

  .filter-box label {
    font-size: 12px;
  }

  .filter-box select,
  .filter-box input {
    width: 100%;
    padding: 7px 10px;
    font-size: 13px;
  }
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.048); /* semi-transparent black */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.overlay-content {
  background: rgb(255, 254, 254); /* light transparent white */
  padding: 20px 25px;
  border-radius: 10px;
  width: 90%;
  max-width: 450px;
  text-align: left;
  backdrop-filter: blur(5px); /* glass effect */
}

.overlay-content h2 {
  margin-bottom: 15px;
  color: #000000;
}

.overlay-content p {
  margin: 8px 0;
  color: #000000;
}

.close-btn {
  margin-top: 15px;
  background: rgba(15, 23, 42, 0.8);
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
}

.po-btn {
  background: none;
  border: none;
  color: #1e1e1e;
  font-weight: bold;
  cursor: pointer;
  text-decoration: underline;
}

.po-btn:hover {
  color: #ffcc00;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  font-size: 1.5rem;
  color: #1f2937; /* slate-800 */
}

/* Close Icon */
.close-icon {
  position: absolute; /* float above modal content */
  top: 12px; /* distance from top */
  right: 12px; /* distance from right */
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af; /* gray-400 */
  transition: color 0.2s ease;
  font-size: 1.8rem; /* optional, bigger icon */
  z-index: 20; /* ensure it stays above modal content */
}
.close-icon:hover {
  color: #ef4444; /* red-500 */
}

/* Modal Body */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-row {
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
  padding: 6px 0;
}

.modal-row .label {
  font-weight: 200;
  color: #374151; /* slate-700 */
}

.modal-row .value {
  font-weight: 600;
  color: #202121; /* slate-900 */
}

/* Transition */

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Fade + Scale Transition */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.25s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>

<template>
  <div class="transactions-page">
    <h1>Activity Logs</h1>
    <p>View users activities</p>

    <!-- Filters Toolbar -->
    <div class="filters-toolbar">
      <div class="search-box">
        <ion-icon name="search-outline"></ion-icon>
        <input type="text" v-model="searchQuery" placeholder="Search activities..." />
      </div>

      <select v-model="filterStatus" class="status-filter">
        <option value="">All Statuses</option>
        <option v-for="action in actions" :key="action.action_id" :value="action.action_id">
          {{ action.action_name }}
        </option>
      </select>
    </div>

    <!-- Activity Feed -->
    <div class="activity-feed">
      <div v-for="txn in filteredTransactions" :key="txn.id" class="activity-entry">
        <div class="activity-text">
          <span class="activity-badge" :class="txn.activity ? txn.activity.toLowerCase() : ''">
            {{
              txn.activity ? txn.activity.charAt(0).toUpperCase() + txn.activity.slice(1) : 'Action'
            }}
          </span>
          <span class="status-badge" :class="txn.user_role">
            {{ txn.user_name }} ({{ txn.user_role }})
          </span>

          {{ txn.activity ? txn.activity.toLowerCase() : 'performed an action on' }}
          item <strong>{{ txn.item_name }}</strong> ({{ txn.item_no }}) in
          <strong>{{ txn.dept_name }}</strong> — on
          {{ new Date(txn.date).toLocaleString() }}
        </div>
        <div>
          <span class="status-label" :class="txn.status_name.toLowerCase()">
            {{ txn.status_name }}
          </span>
        </div>
      </div>

      <div v-if="filteredTransactions.length === 0" class="no-data">No activities found.</div>
    </div>

    <!-- PO Modal -->
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
      accessToken: null,
    }
  },
  computed: {
    filteredTransactions() {
      return this.transactions.filter((txn) => {
        const matchesSearch =
          !this.searchQuery ||
          txn.item_no.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          txn.item_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          txn.dept_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          txn.user_name.toLowerCase().includes(this.searchQuery.toLowerCase())

        const matchesStatus = !this.filterStatus || txn.status_id === Number(this.filterStatus)
        const txnDate = new Date(txn.date)
        const afterStart = !this.startDate || txnDate >= new Date(this.startDate)
        const beforeEnd = !this.endDate || txnDate <= new Date(this.endDate)

        return matchesSearch && matchesStatus && afterStart && beforeEnd
      })
    },
  },
  async mounted() {
    await this.getSessionToken()
    await this.fetchActions()
    await this.fetchTransactions()
    this.loading = false
  },
  methods: {
    async getSessionToken() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        this.accessToken = session.access_token
      }
    },

    async fetchTransactions() {
      // 1️⃣ Fetch transactions
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
        user_id,
        individual_transaction:indiv_txn_id(recipient_name),
        activity,
        action_id
      `,
        )
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching transactions:', error)
        return
      }

      // 2️⃣ Fetch users via Deno endpoint
      let usersData = []
      try {
        const res = await fetch('https://hogtogfgaayfcaunjmyv.supabase.co/functions/v1/get-users', {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        })
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        usersData = json.users
      } catch (err) {
        console.error('Error fetching users via endpoint:', err)
      }

      // Map users by id
      const usersMap = {}
      usersData.forEach((u) => {
        usersMap[u.id] = {
          full_name: u.full_name,
          role: u.role, // assuming the Deno endpoint returns role
        }
      })

      // 3️⃣ Map transactions and include full_name
      this.transactions = data.map((txn) => {
        const userInfo = usersMap[txn.user_id]
        return {
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
          user_name: userInfo?.full_name || 'Unknown',
          user_role: userInfo?.role || 'user', // distinguish user vs admin
          po_no: txn.purchase_order?.po_no || '-',
          supplier: txn.purchase_order?.supplier || '-',
          total_amount: txn.purchase_order?.total_amount || null,
          order_date: txn.purchase_order?.order_date || null,
          activity: txn.activity || null,
        }
      })
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
.transactions-page {
  padding: 24px;
  background: #f7f8fa;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}
p {
  color: #64748b;
  margin-bottom: 20px;
}

h1 {
  font-size: 1.8rem;
  margin-bottom: 16px;
  color: #111;
}

/* Filters Toolbar */
.filters-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border-radius: 8px;
  padding: 6px 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  flex: 1;
}

.search-box input {
  border: none;
  outline: none;
  font-size: 0.95rem;
  flex: 1;
  background: transparent;
}

.status-filter {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  background: #fff;
  font-size: 0.95rem;
}

/* Activity Feed */
.activity-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-entry {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s;
}

.activity-entry:hover {
  transform: translateY(-2px);
}

.activity-text {
  font-size: 0.95rem;
  color: #333;
  line-height: 1.4;
}

.activity-entry strong {
  color: #111;
}

/* Activity badges */
.activity-badge {
  display: inline-block;
  padding: 3px 8px;
  margin-right: 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  text-transform: capitalize;
}

.activity-badge.create {
  background: #4caf50;
}
.activity-badge.update {
  background: #2196f3;
}
.activity-badge.delete {
  background: #f44336;
}
.activity-badge.transfer {
  background: #ff9800;
}
.activity-badge.unknown {
  background: #607d8b;
}

/* PO button */
.po-btn {
  background: #2196f3;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
}

.po-btn:hover {
  background: #1976d2;
}

.no-data {
  text-align: center;
  color: #999;
  margin-top: 16px;
}

/* Modal styles (reuse your previous modal styling) */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.overlay-content {
  background: #fff;
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  padding: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  margin-top: 12px;
}

.modal-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.label {
  font-weight: 600;
  color: #555;
}

.value {
  color: #111;
}
.search-box ion-icon {
  color: #070707;
}
</style>

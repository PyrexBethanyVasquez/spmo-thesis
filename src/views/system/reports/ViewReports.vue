<template>
  <div class="reports-page">
    <div class="page-header">
      <h2>Reports</h2>
      <div class="header-actions">
        <router-link to="/item-lists">
          <button class="back-btn">
            <ion-icon name="return-down-back-outline"></ion-icon> Back to Items
          </button>
        </router-link>
      </div>
    </div>

    <p>View all items with their associated transaction details</p>

    <div>
      <hr />
      <br />

      <!-- ✅ Summary Cards -->
      <transition name="fade" mode="out-in">
        <div v-if="loading" class="summary-cards">
          <div class="summary-card" v-for="n in 3" :key="'skeleton-card-' + n">
            <div class="skeleton-card-title"></div>
            <div class="skeleton-card-value"></div>
          </div>
        </div>
        <div v-else class="summary-cards">
          <div class="summary-card">
            <h3>Total Items</h3>
            <p>{{ totalItems }}</p>
          </div>
          <div class="summary-card">
            <h3>Total Purchase Orders</h3>
            <p>{{ totalPOs }}</p>
          </div>
          <div class="summary-card">
            <h3>Total Suppliers</h3>
            <p>{{ totalSuppliers }}</p>
          </div>
        </div>
      </transition>

      <!-- Recipient Filter -->
      <div class="filter-box">
        <label>Export Reports For:</label>
        <select v-model="selectedRecipient" @change="fetchItems">
          <option value="">All</option>
          <option v-for="r in recipients" :key="r.indiv_txn_id" :value="r.indiv_txn_id">
            {{ r.recipient_name }}
          </option>
        </select>
        <button class="export-btn" @click="exportCSV">
          <ion-icon name="download-outline"></ion-icon> Export CSV
        </button>
      </div>

      <hr />
      <br />

      <!-- ✅ Table Section -->
      <transition name="fade" mode="out-in">
        <div v-if="loading" class="skeleton-table">
          <table>
            <thead>
              <tr>
                <th v-for="n in 6" :key="'header-' + n">
                  <div class="skeleton-header"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in 6" :key="'row-' + r">
                <td v-for="c in 6" :key="'col-' + c">
                  <div class="skeleton-cell"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="table-wrapper">
          <table class="reports-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Property No</th>
                <th>Location</th>
                <th>Department</th>
                <th>Status</th>

                <th>Serial Number</th>
                <th>Model / Brand</th>
                <th>Receiver</th>
                <th>Supplier</th>
                <th>Purchase Order</th>
                <th>Total Amount</th>
                <th>Date Acquired</th>
                <th>Order Date</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in itemsWithPO"
                :key="item.item_no"
                :class="{ 'has-po': item.purchase_order }"
              >
                <td>{{ item.name }}</td>
                <td>{{ item.property_no }}</td>
                <td>{{ item.location }}</td>
                <td>{{ item.department?.dept_name || '-' }}</td>
                <td>{{ item.action?.action_name || '-' }}</td>

                <td>{{ item.serial_no }}</td>
                <td>{{ item.model_brand }}</td>
                <td>
                  {{ item.individual_transaction?.recipient_name || 'N/A' }}
                </td>
                <td>{{ item.purchase_order?.supplier || '-' }}</td>

                <td>{{ item.purchase_order?.po_no || '-' }}</td>
                <td>
                  {{
                    item.purchase_order?.total_amount ? '₱' + item.purchase_order.total_amount : '-'
                  }}
                </td>
                <td>{{ item.date_acquired }}</td>
                <td>{{ item.purchase_order?.order_date || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { supabase } from '../../../clients/supabase'
import { useToast } from 'vue-toastification'

const toast = useToast()

export default {
  name: 'ReportsPage',
  data() {
    return {
      itemsWithPO: [],
      totalItems: 0,
      totalPOs: 0,
      totalSuppliers: 0,
      departments: [],
      recipients: [],
      selectedRecipient: '',
      loading: true,
    }
  },

  async mounted() {
    try {
      this.loading = true
      await Promise.all([this.fetchDepartments(), this.fetchRecipient(), this.fetchItems()])
      this.calculateSummary()
    } finally {
      this.loading = false
    }
  },

  methods: {
    async fetchItems() {
      let query = supabase
        .from('active_items')
        .select(
          `
      *,
      purchase_order:purchase_order!inner(*),
      action:status(action_id, action_name),
      department:dept_id(dept_name),
      individual_transaction:indiv_txn_id(recipient_name)
    `,
        )
        .order('item_no', { ascending: true })

      // Apply filter if selected
      if (this.selectedRecipient) {
        query = query.eq('indiv_txn_id', this.selectedRecipient)
      }

      const { data, error } = await query

      if (error) return console.error(error)
      this.itemsWithPO = data
    },

    // Fetch all departments

    async fetchDepartments() {
      const { data, error } = await supabase.from('department').select('*').order('dept_name')

      if (error) {
        toast.error('Error fetching departments: ' + error.message)
        return
      }

      this.departments = data
    },

    async fetchRecipient() {
      const { data, error } = await supabase
        .from('individual_transaction')
        .select('indiv_txn_id, recipient_name')
        .order('recipient_name')

      if (error) {
        toast.error('Error fetching recipients: ' + error.message)
        return
      }

      this.recipients = data
    },

    calculateSummary() {
      this.totalItems = this.itemsWithPO.length
      this.totalPOs = this.itemsWithPO.filter((i) => i.purchase_order).length

      const suppliers = this.itemsWithPO.map((i) => i.purchase_order?.supplier).filter(Boolean)

      this.totalSuppliers = [...new Set(suppliers)].length
    },

    exportCSV() {
      if (!this.itemsWithPO.length) {
        toast.info('No records found for this recipient.')
        return
      }

      const selectedName =
        this.recipients.find((r) => r.indiv_txn_id === this.selectedRecipient)?.recipient_name ||
        'All_Recipients'

      const headers = [
        'Item Name',
        'Property No',
        'Location',
        'Department',
        'Status',
        'Serial No',
        'Model/Brand',
        'Recipient Name',
        'Supplier',
        'PO No',
        'Total Amount',
        'Item Acquired',
        'Order Date',
      ]

      const rows = this.itemsWithPO.map((item) => [
        item.name,
        item.property_no,
        item.location,
        item.department?.dept_name || 'N/A',
        item.action?.action_name || 'Unknown',
        item.serial_no,
        item.model_brand,
        item.individual_transaction?.recipient_name || 'N/A',
        item.purchase_order?.supplier || '',
        item.purchase_order?.po_no || '',
        item.purchase_order?.total_amount || '',
        item.date_acquired,
        item.purchase_order?.order_date || '',
      ])

      const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')

      link.href = URL.createObjectURL(blob)
      link.setAttribute(
        'download',
        `SPMO_Report_${selectedName}_${new Date().toISOString().slice(0, 10)}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
  },
}
</script>

<style scoped>
/* --- Skeleton Animation --- */
@keyframes pulse {
  0% {
    background-color: #f0f0f0;
  }
  50% {
    background-color: #e0e0e0;
  }
  100% {
    background-color: #f0f0f0;
  }
}

/* --- Cards --- */
.summary-cards {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}
.summary-card {
  flex: 1;
  padding: 1.2rem;
  background: #fff;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* Skeleton for cards */
.skeleton-card-title,
.skeleton-card-value {
  height: 16px;
  margin: 1.5rem 0;
  border-radius: 6px;
  animation: pulse 1.5s infinite;
}
.skeleton-card-title {
  width: 60%;
  margin: 0.3rem auto;
}
.skeleton-card-value {
  width: 40%;
  margin: 0.5rem auto;
  height: 20px;
}

/* --- Table Skeleton --- */
.skeleton-table .skeleton-header,
.skeleton-table .skeleton-cell {
  height: 20px;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.reports-page {
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f7f8fa;
  color: #000;
  min-height: 100vh;
}

.reports-page p {
  color: #64748b; /* slate-500 */
  font-size: 0.95em;
}

/* Header Section */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.page-header h2 {
  font-size: 1.8rem;
  color: #1a1a1a;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* Buttons */
.back-btn,
.export-btn {
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.back-btn {
  background-color: #1976d2;
  color: #fff;
}

.back-btn:hover {
  background-color: #1565c0;
  transform: translateY(-1px);
}

.export-btn {
  background-color: #43a047;
  color: #fff;
}

.export-btn:hover {
  background-color: #388e3c;
  transform: translateY(-1px);
}

p {
  margin-bottom: 1rem;
  color: #555;
}

/* Summary Section */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0px 3px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
  padding: 1.25rem;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-3px);
  box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.1);
}

.summary-card h3 {
  margin-bottom: 0.4rem;
  font-size: 15px;
  color: #333;
}

.summary-card p {
  font-size: 22px;
  font-weight: bold;
  color: #1976d2;
}

/* Table Section */
.table-wrapper {
  overflow-x: auto;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.05);
  padding: 1rem;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 950px; /* helps maintain structure on small screens */
}

.reports-table th,
.reports-table td {
  border: 1px solid #e0e0e0;
  padding: 10px 12px;
  text-align: left;
  font-size: 14px;
  white-space: nowrap;
}

.reports-table th {
  background-color: #a7b982;
  font-weight: 600;
  color: #1a1a1a;
}

.reports-table tr:nth-child(even) {
  background-color: #fafafa;
}

.reports-table tr:hover {
  background-color: #f1f7e7;
}

/* Responsive Adjustments */
@media (max-width: 992px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .page-header h2 {
    font-size: 1.5rem;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .reports-page {
    padding: 1.25rem;
  }

  .reports-table th,
  .reports-table td {
    font-size: 13px;
    padding: 8px;
  }

  .back-btn,
  .export-btn {
    font-size: 13px;
    padding: 8px 12px;
  }

  .summary-card p {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .page-header {
    align-items: stretch;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .summary-card {
    padding: 1rem;
  }

  .reports-table {
    min-width: 650px;
  }
}

/* Filter Box Style */
.filter-box {
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-box label {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.filter-box select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s ease-in-out;
}

.filter-box select:hover {
  border-color: #999;
}

.filter-box select:focus {
  outline: none;
  border-color: #495aff;
  box-shadow: 0 0 4px rgba(73, 90, 255, 0.4);
}
</style>

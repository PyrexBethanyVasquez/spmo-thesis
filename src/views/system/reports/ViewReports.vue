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
        <button class="export-btn" @click="exportCSV">
          <ion-icon name="download-outline"></ion-icon> Export CSV
        </button>
      </div>
    </div>

    <p>View all items with their associated purchase orders</p>

    <hr />
    <br />
    <!-- Summary Cards -->
    <div class="summary-cards">
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

    <div class="table-wrapper">
      <table class="reports-table">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Property No</th>
            <th>Location</th>
            <th>Status</th>
            <th>Serial No</th>
            <th>Model/Brand</th>
            <th>Item Acquired</th>
            <!-- <th>PO No</th> -->
            <th>Supplier</th>
            <th>Total Amount</th>
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
            <td>{{ item.status }}</td>
            <td>{{ item.serial_no }}</td>
            <td>{{ item.model_brand }}</td>
            <td>{{ item.date_acquired }}</td>
            <!-- <td>{{ item.purchase_order?.po_no || '-' }}</td> -->
            <td>{{ item.purchase_order?.supplier || '-' }}</td>
            <td>
              {{ item.purchase_order?.total_amount ? '₱' + item.purchase_order.total_amount : '-' }}
            </td>
            <td>{{ item.purchase_order?.order_date || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { supabase } from '../../../clients/supabase'

export default {
  name: 'ReportsPage',
  data() {
    return {
      itemsWithPO: [],
      totalItems: 0,
      totalPOs: 0,
      totalSuppliers: 0,
    }
  },
  async mounted() {
    await this.fetchItemsWithPO()
    this.calculateSummary()
  },
  methods: {
    async fetchItemsWithPO() {
      const { data, error } = await supabase
        .from('items')
        .select(`*, purchase_order:purchase_order!inner(*)`)
        .order('item_no', { ascending: true })

      if (error) return console.error(error)
      this.itemsWithPO = data
    },
    calculateSummary() {
      this.totalItems = this.itemsWithPO.length
      this.totalPOs = this.itemsWithPO.filter((i) => i.purchase_order).length
      const suppliers = this.itemsWithPO.map((i) => i.purchase_order?.supplier).filter(Boolean)
      this.totalSuppliers = [...new Set(suppliers)].length
    },

    exportCSV() {
      if (!this.itemsWithPO.length) return

      const headers = [
        'Item Name',
        'Property No',
        'Location',
        'Status',
        'Serial No',
        'Model/Brand',
        'Item Acquired',
        // 'PO No',
        'Supplier',
        'Total Amount',
        'Order Date',
      ]

      const rows = this.itemsWithPO.map((item) => [
        item.name,
        item.property_no,
        item.location,
        item.status,
        item.serial_no,
        item.model_brand,
        item.date_acquired,
        // item.purchase_order?.po_no || '',
        item.purchase_order?.supplier || '',
        item.purchase_order?.total_amount || '',
        item.purchase_order?.order_date || '',
      ])

      const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.setAttribute('download', `SPMO_Report_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
  },
}
</script>

<style scoped>
.reports-page {
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f7f8fa;
  color: #000000;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.back-btn,
.export-btn {
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.back-btn {
  background-color: #1976d2;
  color: white;
}

.back-btn:hover {
  background-color: #1565c0;
}

.export-btn {
  background-color: #43a047;
  color: white;
}

.export-btn:hover {
  background-color: #388e3c;
}

p {
  margin-bottom: 1rem;
  color: #555;
}

.table-wrapper {
  overflow-x: auto;
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.05);
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
}

.reports-table th,
.reports-table td {
  border: 1px solid #e0e0e0;
  padding: 10px;
  text-align: left;
  font-size: 14px;
}

.reports-table th {
  background-color: #dbdbdb;
  font-weight: 600;
}

.reports-table tr:nth-child(even) {
  background-color: #fafafa;
}

.summary-cards {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.summary-card {
  flex: 1;
  padding: 1rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.summary-card h3 {
  margin-bottom: 0.5rem;
  font-size: 16px;
  color: #333;
}

.summary-card p {
  font-size: 20px;
  font-weight: bold;
  color: #1976d2;
}
</style>

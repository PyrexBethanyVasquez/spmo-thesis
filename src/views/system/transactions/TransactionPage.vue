<template>
  <div class="transaction-page">
    <h1>Transactions</h1>
    <div class="transaction-filters">
      <input v-model="search" placeholder="Search transactions..." />
      <select v-model="filterStatus">
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
      </select>
      <button @click="fetchTransactions">Filter</button>
    </div>
    <table class="transaction-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Date</th>
          <th>User</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="transaction in filteredTransactions" :key="transaction.id">
          <td>{{ transaction.id }}</td>
          <td>{{ transaction.date }}</td>
          <td>{{ transaction.user }}</td>
          <td>{{ transaction.amount }}</td>
          <td>{{ transaction.status }}</td>
        </tr>
        <tr v-if="filteredTransactions.length === 0">
          <td colspan="5">No transactions found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'TransactionPage',
  data() {
    return {
      search: '',
      filterStatus: '',
      transactions: [
        // Example data
        { id: 1, date: '2024-06-01', user: 'Alice', amount: 100, status: 'completed' },
        { id: 2, date: '2024-06-02', user: 'Bob', amount: 200, status: 'pending' },
        { id: 3, date: '2024-06-03', user: 'Charlie', amount: 150, status: 'failed' },
      ],
    }
  },
  computed: {
    filteredTransactions() {
      return this.transactions.filter((t) => {
        const matchesSearch =
          this.search === '' ||
          t.user.toLowerCase().includes(this.search.toLowerCase()) ||
          t.id.toString().includes(this.search)
        const matchesStatus = this.filterStatus === '' || t.status === this.filterStatus
        return matchesSearch && matchesStatus
      })
    },
  },
  methods: {
    fetchTransactions() {
      // Placeholder for fetching transactions from API
      // You can replace this with actual API call
    },
  },
}
</script>

<style scoped>
.transaction-page {
  padding: 24px;
}
.transaction-filters {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}
.transaction-table {
  width: 100%;
  border-collapse: collapse;
}
.transaction-table th,
.transaction-table td {
  border: 1px solid #ddd;
  padding: 8px;
}
.transaction-table th {
  background: #f5f5f5;
}
</style>

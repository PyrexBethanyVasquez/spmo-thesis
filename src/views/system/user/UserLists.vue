<template>
  <div class="admin-users-page">
    <div class="header">
      <h1>Users Management</h1>
      <router-link to="/home">
        <button class="btn-back">
          <ion-icon name="return-down-back-outline" class="back-icon"></ion-icon> Dashboard
        </button>
      </router-link>
    </div>

    <!-- Search -->
    <div class="search-bar">
      <ion-icon name="search-outline" class="search-icon"></ion-icon>
      <input type="text" v-model="searchQuery" placeholder="Search name or email..." />
    </div>

    <!-- Users Table -->
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>{{ user.full_name || '-' }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span
                :class="{
                  'role-badge': true,
                  admin: user.role === 'Admin',
                  user: user.role === 'Seller',
                }"
              >
                {{ user.role }}
              </span>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <!-- Future action buttons like Edit/Delete can go here -->
              <button disabled class="btn-action">Edit</button>
              <button disabled class="btn-action">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!filteredUsers.length" class="no-users">No users found.</p>
    </div>
  </div>
</template>
<script>
import { supabase } from '@/clients/supabase.js'

export default {
  name: 'UsersList',
  data() {
    return {
      users: [],
      searchQuery: '',
    }
  },
  computed: {
    filteredUsers() {
      if (!this.searchQuery.trim()) return this.users
      const query = this.searchQuery.toLowerCase()
      return this.users.filter(
        (u) =>
          (u.full_name && u.full_name.toLowerCase().includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query)),
      )
    },
  },
  async mounted() {
    await this.fetchUsers()
  },
  methods: {
    async fetchUsers() {
      const { data, error } = await supabase
        .from('users') // your custom users table
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching users:', error.message)
        return
      }

      this.users = data
    },
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
  },
}
</script>

<style scoped>
.admin-users-page {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 2rem;
  background-color: #f4f6f8;
  color: #333;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header h1 {
  font-size: 1.8rem;
  font-weight: 600;
}

.btn-back {
  display: flex;
  align-items: center;
  background-color: #4a90e2;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-back .back-icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
}

.btn-back:hover {
  background-color: #357ab8;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: #e9eef5; /* pill background */
  border-radius: 10px; /* fully rounded */
  padding: 0.5rem 1rem;
  width: 250px; /* adjust as needed */
  margin-bottom: 1.5rem;
  transition: box-shadow 0.3s;
}

.search-bar input {
  border: none;
  outline: none;
  background: transparent;
  flex: 1;
  padding-left: 0.5rem;
  font-size: 0.9rem;
}
.search-bar:focus-within {
  box-shadow: 0 0 5px rgba(74, 144, 226, 0.4); /* highlights when input is focused */
}

.search-bar input::placeholder {
  color: #6b6b6b;
}

.search-icon {
  color: #888;
  font-size: 1.2rem;
}

.table-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #f0f2f5;
}

th,
td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.role-badge {
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  color: #045a06;
  font-size: 0.8rem;
  font-weight: 500;
}

.role-badge.admin {
  background-color: #e74c3c;
}
.role-badge.seller {
  background-color: #f1c40f;
}
.role-badge.buyer {
  background-color: #2ecc71;
}

.no-users {
  text-align: center;
  padding: 1rem;
  color: #888;
  font-style: italic;
}
</style>

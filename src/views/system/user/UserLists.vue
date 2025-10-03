<template>
  <div class="admin-users-page">
    <div class="header-users">
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

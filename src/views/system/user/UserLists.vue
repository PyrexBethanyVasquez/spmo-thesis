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
              <select v-model="user.role" @change="updateUserRole(user)" class="role-dropdown">
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <button disabled class="btn-action">Edit</button>
              <button disabled class="btn-action">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!filteredUsers.length" class="no-users">No users found.</p>
    </div>

    <!-- Modal for alerts -->
    <div v-if="modal.show" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <p>{{ modal.message }}</p>
        <button @click="closeModal" class="btn-ok">OK</button>
      </div>
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
      accessToken: null,
      modal: {
        show: false,
        message: '',
      },
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
    await this.getSessionToken()
    if (this.accessToken) await this.fetchUsers()
  },
  methods: {
    async getSessionToken() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error || !session) {
        console.error('No active session', error)
        return
      }
      this.accessToken = session.access_token
    },

    async fetchUsers() {
      try {
        const res = await fetch('https://hogtogfgaayfcaunjmyv.supabase.co/functions/v1/get-users', {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        })
        const { users, error } = await res.json()
        if (error) {
          console.error('Error fetching users:', error)
          this.showModal('Error fetching users.')
          return
        }
        this.users = users
      } catch (err) {
        console.error('Fetch users failed:', err)
        this.showModal('Failed to fetch users.')
      }
    },

    async updateUserRole(user) {
      if (!user || !user.id) return
      try {
        const res = await fetch(
          'https://hogtogfgaayfcaunjmyv.supabase.co/functions/v1/update-user-role',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              role: user.role,
            }),
          },
        )
        const { error } = await res.json()
        if (error) {
          console.error('Failed to update role:', error)
          this.showModal('Role update failed.')
        } else {
          this.showModal(`Role updated to "${user.role}".`)
        }
      } catch (err) {
        console.error('Update role failed:', err)
        this.showModal('Role update failed.')
      }
    },

    showModal(message) {
      this.modal.message = message
      this.modal.show = true
    },
    closeModal() {
      this.modal.show = false
      this.modal.message = ''
    },

    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
  },
}
</script>

<style>
.role-dropdown {
  padding: 2px 5px;
  border-radius: 4px;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 20px 25px;
  border-radius: 6px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  max-width: 300px;
  text-align: center;
}

.btn-ok {
  margin-top: 15px;
  padding: 5px 15px;
  background-color: #1e90ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-ok:hover {
  background-color: #0f70d1;
}
</style>

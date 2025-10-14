<template>
  <div class="auth-page">
    <h2>Reset Password</h2>
    <p>Enter your new password below.</p>

    <form @submit.prevent="updatePassword">
      <input v-model="newPassword" type="password" placeholder="New password" required />
      <button type="submit" :disabled="loading">
        {{ loading ? 'Updating...' : 'Update Password' }}
      </button>
    </form>

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/clients/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const newPassword = ref('')
const loading = ref(false)
const message = ref('')
const error = ref('')

const updatePassword = async () => {
  loading.value = true
  message.value = ''
  error.value = ''

  const { error: err } = await supabase.auth.updateUser({
    password: newPassword.value,
  })

  loading.value = false

  if (err) {
    error.value = err.message
  } else {
    message.value = 'Password updated successfully! Redirecting to login...'
    setTimeout(() => router.push('/'), 2000)
  }
}
</script>

<style scoped>
.auth-page {
  max-width: 400px;
  margin: 80px auto;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}
input {
  width: 100%;
  padding: 10px;
  margin-top: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
button {
  margin-top: 1rem;
  width: 100%;
  padding: 10px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.success {
  color: green;
  margin-top: 1rem;
}
.error {
  color: red;
  margin-top: 1rem;
}
</style>

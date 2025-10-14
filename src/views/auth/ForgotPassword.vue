<template>
  <div class="forgot-container">
    <div class="forgot-card">
      <h2>Forgot Your Password?</h2>
      <p class="subtitle">No worries! Enter your email below and we’ll send you a reset link.</p>

      <form @submit.prevent="sendResetEmail">
        <div class="form-group">
          <input v-model="email" type="email" placeholder="Enter your email" required />
        </div>

        <button type="submit" :disabled="loading" class="btn">
          {{ loading ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>

      <transition name="fade">
        <p v-if="message" class="success">{{ message }}</p>
      </transition>
      <transition name="fade">
        <p v-if="error" class="error">{{ error }}</p>
      </transition>

      <router-link to="/" class="back-link">← Back to Login</router-link>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { supabase } from '@/clients/supabase'

const email = ref('')
const loading = ref(false)
const message = ref('')
const error = ref('')

const sendResetEmail = async () => {
  loading.value = true
  message.value = ''
  error.value = ''

  const { error: err } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  loading.value = false

  if (err) {
    error.value = err.message
  } else {
    message.value = 'Password reset email sent! Please check your inbox.'
  }
}
</script>

<style scoped>
/* --- Layout --- */
.forgot-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #675c14, #035b01);
}

.forgot-card {
  background: #e0dcdc;
  padding: 2.5rem 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
  animation: fadeIn 0.4s ease;
}

/* --- Typography --- */
h2 {
  color: #1e3a8a;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.subtitle {
  color: #555;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

/* --- Form --- */
.form-group {
  margin-bottom: 1rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1.5px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  color: black;
}
input:focus {
  border-color: #2563eb;
}

/* --- Button --- */
.btn {
  width: 100%;
  padding: 0.75rem;
  background: #2563eb;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn:hover {
  background: #1e40af;
}
.btn:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

/* --- Messages --- */
.success {
  color: #16a34a;
  margin-top: 1rem;
}
.error {
  color: #dc2626;
  margin-top: 1rem;
}

/* --- Link --- */
.back-link {
  display: inline-block;
  margin-top: 1.5rem;
  color: #038635;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
  text-align: start;
}
.back-link:hover {
  color: #1e40af;
}

/* --- Animations --- */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

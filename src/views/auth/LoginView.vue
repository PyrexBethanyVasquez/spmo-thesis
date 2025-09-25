<template>
  <div class="admin-auth-wrapper">
    <div class="admin-auth-card">
      <!-- Logo -->
      <img
        src="https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png"
        alt="Logo"
        class="admin-auth-logo"
      />

      <!-- Title -->
      <h1 class="admin-auth-title">Admin Login</h1>
      <p class="admin-auth-subtitle">Sign in to access the dashboard</p>

      <!-- Error Message -->
      <transition name="fade">
        <p v-if="authError" class="auth-error">{{ authError }}</p>
      </transition>

      <!-- Login -->
      <form @submit.prevent="login" class="admin-auth-form">
        <!-- Email -->
        <input type="email" placeholder="Admin Email" v-model="email" required />

        <!-- Password with toggle -->
        <div class="password-wrapper">
          <input
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
            v-model="password"
            required
          />
          <span class="toggle-icon" @click="togglePassword">
            <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          </span>
        </div>

        <!-- Login button -->
        <button type="submit" class="login-btn">Login</button>
      </form>

      <!-- Footer -->
      <div class="admin-footer">
        <p class="small-text">© 2025 SPMO Admin Dashboard</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../clients/supabase.js'

let email = ref('')
let password = ref('')
let showPassword = ref(false)
let authError = ref(null)
const router = useRouter()

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

async function login() {
  authError.value = null
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    authError.value = 'Invalid email or password'
    console.error('Error logging in:', error.message)
  } else {
    const user = data.user

    // Check if user is admin
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()

    if (!profile || profile.role !== 'admin') {
      authError.value = 'Access denied: Not an admin'
      await supabase.auth.signOut()

      setTimeout(() => {
        authError.value = null
      }, 2000)
      return
    }
    router.push('/home')
  }
}
</script>

<style scoped>
.admin-auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;

  /* Green gradient background */
  background: linear-gradient(135deg, #675c14, #035b01);
}

.admin-auth-card {
  background: rgba(136, 133, 133, 0.053); /* semi-transparent white */
  padding: 2rem 2.5rem;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;

  /* Glassmorphism effect */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);

  text-align: center;
  color: white;
}

.admin-auth-logo {
  width: 70px;
  margin-bottom: 1rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  padding: 5px;
}

.admin-auth-title {
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #ffffff;
}

.admin-auth-subtitle {
  font-size: 0.95rem;
  color: #e0f2e9;
  margin-bottom: 1.5rem;
}

.auth-error {
  color: #ffdddd;
  background: rgba(255, 0, 0, 0.2);
  padding: 0.5rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.admin-auth-form input {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 0.95rem;
  outline: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.admin-auth-form input::placeholder {
  color: #d8f3dc;
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  width: 100%;
  padding-right: 2.5rem;
}

.toggle-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-80%);
  cursor: pointer;
  color: #d8f3dc;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(90deg, #ffcc00, #ffdb4d);
  color: rgb(0, 0, 0);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition:
    background 0.3s ease,
    transform 0.2s ease;
}

.login-btn:hover {
  background: linear-gradient(90deg, #c8a312, #ffdb4d);
  transform: translateY(-2px);
}

.admin-footer {
  margin-top: 1.5rem;
}

.small-text {
  font-size: 0.8rem;
  color: #d8f3dc;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

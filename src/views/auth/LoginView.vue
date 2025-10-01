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
      <h1 class="admin-auth-title">Admin Access</h1>
      <p class="admin-auth-subtitle">Please sign in to access the system</p>

      <!-- Error Message -->
      <transition name="fade">
        <p v-if="authError" class="auth-error">{{ authError }}</p>
      </transition>

      <!-- Login -->
      <form @submit.prevent="login" class="admin-auth-form">
        <!-- Email -->
        <div class="form-group">
          <ion-icon name="mail-outline" class="input-icon"></ion-icon>
          <input type="email" placeholder="Admin Email" v-model="email" required />
        </div>

        <!-- Password with toggle -->
        <div class="form-group password-group">
          <ion-icon name="lock-closed-outline" class="input-icon"></ion-icon>
          <input
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
            v-model="password"
            required
          />
          <ion-icon
            :name="showPassword ? 'eye-off-outline' : 'eye-outline'"
            class="toggle-password"
            @click="showPassword = !showPassword"
          ></ion-icon>
        </div>

        <!-- Remember Me + Forgot Password -->
        <div class="options">
          <label class="remember-me">
            <input type="checkbox" v-model="rememberMe" />
            <span class="checkbox-icon"><ion-icon name="checkmark-outline"></ion-icon></span>
            Remember Me
          </label>

          <!-- Forgot Password as text -->
          <span class="forgot-password-text" @click="showModal = true"> Forgot Password? </span>
        </div>

        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
          <div class="modal-card">
            <h3>Contact Developers</h3>
            <p>
              Please contact the developers at
              <a href="mailto:pyrex.pbv@gmail.com" class="modal-link">pyrex.pbv@gmail.com</a>
              for password assistance.
            </p>
            <button class="modal-close-btn" @click="showModal = false">Close</button>
          </div>
        </div>

        <!-- Login button -->
        <button type="submit" class="login-btn">Sign in</button>
      </form>

      <!-- Footer -->
      <div class="admin-footer">
        <p class="small-text">© 2025 SPMO Admin Dashboard</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../clients/supabase.js'

let email = ref('')
let password = ref('')
let showPassword = ref(false)
let rememberMe = ref(false)
let authError = ref(null)
const router = useRouter()
const showModal = ref(false)

onMounted(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    router.push('/home')
  } else {
    // pre-fill email if previously remembered
    const rememberedEmail = localStorage.getItem('rememberEmail')
    if (rememberedEmail) {
      email.value = rememberedEmail
      rememberMe.value = true
    }
  }
})
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

    if (rememberMe.value) {
      localStorage.setItem('rememberAdmin', 'true')
      localStorage.setItem('rememberEmail', email.value)
    } else {
      localStorage.removeItem('rememberAdmin')
      localStorage.removeItem('rememberEmail')
    }
    router.push('/home')
  }
}
</script>

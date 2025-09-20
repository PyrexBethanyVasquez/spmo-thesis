<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <!-- Logo -->
      <img
        src="https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png"
        alt="Logo"
        class="auth-logo"
      />

      <!-- Title -->
      <h1 class="auth-title">Sign in</h1>
      <p class="auth-subtitle">to continue to your app</p>

      <!-- Login -->
      <form @submit.prevent="login" class="auth-form">
        <input type="email" placeholder="Email" v-model="email" />

        <!-- Password with toggle -->
        <div class="password-wrapper">
          <input
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
            v-model="password"
          />
          <span class="toggle-icon" @click="togglePassword">
            <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          </span>
        </div>

        <button type="submit" class="login-btn">Login</button>
      </form>

      <div class="divider"><span>or</span></div>

      <!-- Signup -->
      <RouterLink to="/createaccount">
        <button class="signup-btn">Create Account</button>
      </RouterLink>

      <!-- Logout -->
      <!-- <div class="logout-section">
        <button @click="logout" class="logout-btn">Logout</button>
      </div> -->
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
const router = useRouter()

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

async function login() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    console.log('Error logging in:', error.message)
  } else {
    console.log('Logged in successfully:', data)
    router.push('/home')
  }
}

// function logout() {
//   const { error } = supabase.auth.signOut()
//   if (error) {
//     console.log('Error logging out:', error.message)
//   } else {
//     console.log('Logged out successfully')
//   }
// }
</script>

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
        <input type="password" placeholder="Password" v-model="password" />
        <button type="submit" class="login-btn">Login</button>
      </form>

      <!-- Divider -->
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
const router = useRouter()

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

<style scoped>
/* Background */
.auth-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f7f8fa;
  font-family: 'Roboto', sans-serif;
}

/* Card */
.auth-card {
  background: #fff;
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(32, 33, 36, 0.28);
  width: 100%;
  max-width: 360px;
  text-align: center;
}

/* Logo */
.auth-logo {
  width: 72px;
  margin-bottom: 1rem;
}

/* Titles */
.auth-title {
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 0.3rem;
  color: #202124;
}
.auth-subtitle {
  font-size: 0.95rem;
  color: #5f6368;
  margin-bottom: 1.5rem;
}

/* Forms */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.auth-form input {
  padding: 0.75rem;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}
.auth-form input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 1px #1a73e8;
}

/* Buttons */
.auth-form button,
.logout-btn {
  background: #1a73e8;
  color: white;
  padding: 0.8rem;
  font-size: 0.95rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}
.auth-form button:hover,
.logout-btn:hover {
  background: #1558b0;
}

.signup-btn {
  background: #34a853;
}
.signup-btn:hover {
  background: #2b7e41;
}

.logout-section {
  margin-top: 1rem;
}
.logout-btn {
  background: #ea4335;
}
.logout-btn:hover {
  background: #c5221f;
}

/* Divider */
.divider {
  margin: 1rem 0;
  display: flex;
  align-items: center;
  color: #5f6368;
  font-size: 0.85rem;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #dadce0;
}
.divider:not(:empty)::before {
  margin-right: 0.75em;
}
.divider:not(:empty)::after {
  margin-left: 0.75em;
}
</style>

<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <form @submit.prevent="createaccount" class="auth-form">
        <input type="text" placeholder="Username" v-model="name" />
        <input type="email" placeholder="Email" v-model="email" />
        <input type="password" placeholder="Password" v-model="password" />
        <button type="submit" class="signup-btn">Create Account</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../clients/supabase.js'

let email = ref('')
let password = ref('')
let name = ref('')

async function createaccount() {
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: {
        name: name.value,
      },
    },
  })

  if (error) {
    console.log('Error creating account:', error.message)
  } else {
    console.log('Account created successfully:', data)
  }
}
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

.signup-btn {
  background: #34a853;
}
.signup-btn:hover {
  background: #2b7e41;
}
</style>

<template>
  <div class="admin-wrapper" v-if="role === 'admin'">
    <div class="admin-card">
      <h2>Create New User</h2>
      <p class="subtitle">Only admins can create new accounts</p>

      <form @submit.prevent="createaccount" class="admin-form">
        <div class="form-group">
          <ion-icon name="person-outline" class="input-icon"></ion-icon>
          <input type="text" v-model="name" placeholder="Full Name" required />
        </div>

        <div class="form-group">
          <ion-icon name="mail-outline" class="input-icon"></ion-icon>
          <input type="email" v-model="email" placeholder="Email Address" required />
        </div>

        <div class="form-group password-group">
          <ion-icon name="lock-closed-outline" class="input-icon"></ion-icon>
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="Password"
            required
          />
          <ion-icon v-if="isPasswordValid" name="checkmark-circle" class="success-icon"></ion-icon>

          <ion-icon
            :name="showPassword ? 'eye-off-outline' : 'eye-outline'"
            class="toggle-password"
            @click="showPassword = !showPassword"
          ></ion-icon>
        </div>
        <p v-if="passwordError" class="error-msg">{{ passwordError }}</p>

        <div class="form-group password-group">
          <ion-icon name="lock-closed-outline" class="input-icon"></ion-icon>
          <input
            :type="showConfirmPassword ? 'text' : 'password'"
            v-model="confirmPassword"
            placeholder="Confirm Password"
            required
          />

          <ion-icon
            v-if="passwordsMatch && confirmPassword"
            name="checkmark-circle"
            class="success-icon"
          ></ion-icon>

          <ion-icon
            :name="showConfirmPassword ? 'eye-off-outline' : 'eye-outline'"
            class="toggle-password"
            @click="showConfirmPassword = !showConfirmPassword"
          ></ion-icon>
        </div>
        <p v-if="confirmPasswordError" class="error-msg">{{ confirmPasswordError }}</p>

        <!-- Disable button while creating -->
        <button type="submit" class="btn-submit" :disabled="isCreating">
          {{ isCreating ? 'Creating...' : 'Create Account' }}
        </button>

        <p v-if="successMessage" class="success-msg">{{ successMessage }}</p>
      </form>
    </div>
  </div>

  <div v-else class="unauthorized">
    <p>{{ unauthorizedMessage }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../../clients/supabase.js'
import { useToast } from 'vue-toastification'
import router from '@/router/index.js'

const toast = useToast()
let email = ref('')
let password = ref('')
let confirmPassword = ref('')
let name = ref('')
let role = ref('user')
let showPassword = ref(false)
let showConfirmPassword = ref(false)
let passwordError = ref('')
let confirmPasswordError = ref('')
let successMessage = ref('')
let isCreating = ref(false) // ✅ Add this

const isPasswordValid = computed(() => {
  const regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,20}$/
  return regex.test(password.value)
})

const passwordsMatch = computed(() => {
  return password.value && confirmPassword.value && password.value === confirmPassword.value
})

onMounted(async () => {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Error getting session user:', error.message)
    return
  }

  const user = data.user

  if (user) {
    const { data: profile, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching role:', error.message)
      role.value = 'user'
    } else {
      role.value = profile?.role || 'user'
    }
  }
})

async function createaccount() {
  // ✅ Prevent multiple submissions
  if (isCreating.value) {
    console.log('⚠️ Already creating account, ignoring duplicate submission')
    return
  }

  passwordError.value = ''
  confirmPasswordError.value = ''
  successMessage.value = ''

  // Only admin can create users
  if (role.value !== 'admin') {
    console.log('Unauthorized attempt to create account')
    return
  }

  // Validate password
  if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters.'
    return
  }
  if (password.value.length > 20) {
    passwordError.value = 'Password cannot exceed 20 characters.'
    return
  }
  const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).*$/
  if (!passwordRegex.test(password.value)) {
    passwordError.value =
      'Password must include at least one uppercase letter, one number, and one special character.'
    return
  }
  if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match.'
    return
  }

  // ✅ Set creating state
  isCreating.value = true

  try {
    // Get current admin session token
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !sessionData.session) {
      toast.error('Unable to get session: ' + sessionError?.message)
      return
    }
    const token = sessionData.session.access_token

    // ✅ Add logging
    console.log('🔥 Making API call to create user:', email.value)

    // Call the Edge Function
    const res = await fetch('https://hogtogfgaayfcaunjmyv.supabase.co/functions/v1/quick-handler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        full_name: name.value,
      }),
    })

    const result = await res.json()
    console.log('📬 API Response:', result)

    if (!res.ok) {
      console.error('❌ Error creating user:', result.error)
      toast.error('Error: ' + result.error)
      passwordError.value = result.error
      return
    }

    toast.success('Account created successfully!')

    // Reset form
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
    name.value = ''

    setTimeout(() => {
      router.push('/home')
    }, 1500)
  } catch (err) {
    console.error('💥 Unexpected error:', err)
    toast.error('Unexpected error occurred: ' + err.message)
    passwordError.value = 'Unexpected error occurred.'
  } finally {
    // ✅ Always reset creating state
    isCreating.value = false
  }
}
</script>
<style scoped>
.success-icon {
  position: absolute;
  right: 40px; /* placed before the eye icon */
  margin-top: 12px;
  color: #28a745;
  font-size: 1.2em;
  transition: opacity 0.3s ease;
}
/* Background */
.admin-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #ffffff;
  font-family: 'Roboto', sans-serif;
}

/* Card */
.admin-card {
  background-color: transparent;
  padding: 2.5rem 2rem;
  /* border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); */
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.admin-card h2 {
  margin-bottom: 0.3rem;
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
}

.admin-card .subtitle {
  margin-bottom: 1.5rem;
  color: #666;
  font-size: 0.95rem;
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-group {
  position: relative;
  display: flex;
  align-items: center;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  font-size: 0.95rem;
  transition: all 0.2s;
  color: black;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}
.input-icon {
  position: absolute;
  left: 0.8rem;
  top: 50%; /* vertically center relative to parent */
  transform: translateY(-50%); /* center exactly */
  font-size: 1.2rem;
  color: #b19402;
}

.password-group .toggle-password {
  position: absolute;
  right: 0.8rem;
  font-size: 1.2rem;
  cursor: pointer;
  color: #b19402;
  top: 50%;
  transform: translateY(-50%);
}

.password-group {
  position: relative;
  display: flex;
  flex-direction: column; /* Stack input and error vertically */
}

/* Button */
.btn-submit {
  padding: 0.75rem;
  background-color: #178105;
  color: #fff;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.btn-submit:hover {
  background-color: #1ba403;
  transform: translateY(-1px);
}

/* Unauthorized message */
.unauthorized {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-size: 1rem;
  color: #d32f2f;
}

.success-msg {
  color: #178105; /* green */
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-align: center;
  font-weight: 600;
}

.error-msg {
  color: #ff4d4f; /* red for errors */
  font-size: 0.85rem; /* smaller text */
  margin-top: 0.1rem; /* space below input */
  text-align: left; /* align left */
}
</style>

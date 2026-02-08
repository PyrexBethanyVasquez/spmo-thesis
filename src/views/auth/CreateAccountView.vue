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

  <!-- Credentials Modal -->
  <transition name="modal-fade">
    <div v-if="showCredentialsModal" class="modal-overlay" @click.self="closeCredentialsModal">
      <div class="credentials-modal">
        <div class="modal-header">
          <div class="success-icon-wrapper">
            <ion-icon name="checkmark-circle"></ion-icon>
          </div>
          <h3>Account Created Successfully!</h3>
          <p class="subtitle">Share these credentials with the new user</p>
        </div>

        <div class="modal-body">
          <div class="credentials-section">
            <div class="credential-item">
              <label>
                <ion-icon name="person-outline"></ion-icon>
                Full Name
              </label>
              <div class="credential-value">
                <input type="text" :value="createdUser.name" readonly />
                <button @click="copyToClipboard(createdUser.name, 'Name')" class="copy-btn">
                  <ion-icon name="copy-outline"></ion-icon>
                </button>
              </div>
            </div>

            <div class="credential-item">
              <label>
                <ion-icon name="mail-outline"></ion-icon>
                Email Address
              </label>
              <div class="credential-value">
                <input type="text" :value="createdUser.email" readonly />
                <button @click="copyToClipboard(createdUser.email, 'Email')" class="copy-btn">
                  <ion-icon name="copy-outline"></ion-icon>
                </button>
              </div>
            </div>

            <div class="credential-item">
              <label>
                <ion-icon name="lock-closed-outline"></ion-icon>
                Temporary Password
              </label>
              <div class="credential-value">
                <input type="text" :value="createdUser.password" readonly />
                <button @click="copyToClipboard(createdUser.password, 'Password')" class="copy-btn">
                  <ion-icon name="copy-outline"></ion-icon>
                </button>
              </div>
            </div>
          </div>

          <div class="copy-all-section">
            <button @click="copyAllCredentials" class="copy-all-btn">
              <ion-icon name="clipboard-outline"></ion-icon>
              Copy All Credentials
            </button>
          </div>

          <div class="info-banner">
            <ion-icon name="information-circle-outline"></ion-icon>
            <div>
              <strong>Important:</strong> The user must change their password on first login for
              security.
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeCredentialsModal" class="btn-done">
            <ion-icon name="checkmark-outline"></ion-icon>
            Done
          </button>
        </div>
      </div>
    </div>
  </transition>
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
let isCreating = ref(false)
let showCredentialsModal = ref(false)
let createdUser = ref({
  name: '',
  email: '',
  password: '',
})

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
  if (isCreating.value) {
    console.log('⚠️ Already creating account, ignoring duplicate submission')
    return
  }

  passwordError.value = ''
  confirmPasswordError.value = ''
  successMessage.value = ''

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

  isCreating.value = true

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !sessionData.session) {
      toast.error('Unable to get session: ' + sessionError?.message)
      return
    }
    const token = sessionData.session.access_token

    console.log('🔥 Making API call to create user:', email.value)

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

    // ✅ Store credentials and show modal
    createdUser.value = {
      name: name.value,
      email: email.value,
      password: password.value,
    }

    showCredentialsModal.value = true
    toast.success('Account created successfully!')

    // Reset form
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
    name.value = ''
  } catch (err) {
    console.error('💥 Unexpected error:', err)
    toast.error('Unexpected error occurred: ' + err.message)
    passwordError.value = 'Unexpected error occurred.'
  } finally {
    isCreating.value = false
  }
}

function copyToClipboard(text, label) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.success(`${label} copied to clipboard!`)
    })
    .catch((err) => {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy to clipboard')
    })
}

function copyAllCredentials() {
  const credentials = `
Account Credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${createdUser.value.name}
Email: ${createdUser.value.email}
Password: ${createdUser.value.password}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT: Change password on first login
  `.trim()

  navigator.clipboard
    .writeText(credentials)
    .then(() => {
      toast.success('All credentials copied to clipboard!')
    })
    .catch((err) => {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy to clipboard')
    })
}

function closeCredentialsModal() {
  showCredentialsModal.value = false
  router.push('/home')
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.credentials-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 550px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  text-align: center;
  padding: 32px 24px 24px;
  background: linear-gradient(to bottom, #f0fdf4, #ffffff);
  border-bottom: 1px solid #e5e7eb;
}

.success-icon-wrapper {
  width: 64px;
  height: 64px;
  background: #dcfce7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.success-icon-wrapper ion-icon {
  font-size: 36px;
  color: #16a34a;
}

.modal-header h3 {
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 600;
  color: #111827;
}

.modal-header .subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.credentials-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.credential-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.credential-item label ion-icon {
  font-size: 18px;
  color: #3b82f6;
}

.credential-value {
  display: flex;
  gap: 8px;
}

.credential-value input {
  flex: 1;
  padding: 12px 16px;
  background: #f9fafb;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #111827;
  font-family: 'Courier New', monospace;
}

.copy-btn {
  padding: 12px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.copy-btn ion-icon {
  font-size: 20px;
}

.copy-all-section {
  margin-bottom: 20px;
}

.copy-all-btn {
  width: 100%;
  padding: 14px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.copy-all-btn:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.copy-all-btn ion-icon {
  font-size: 20px;
}

.info-banner {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  font-size: 14px;
  color: #78350f;
}

.info-banner ion-icon {
  font-size: 20px;
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

.btn-done {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-done:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-done ion-icon {
  font-size: 20px;
}

/* Animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .credentials-modal,
.modal-fade-leave-active .credentials-modal {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .credentials-modal,
.modal-fade-leave-to .credentials-modal {
  transform: scale(0.9);
  opacity: 0;
}
</style>

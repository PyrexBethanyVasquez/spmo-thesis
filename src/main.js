import './assets/main.css'
import './assets/styles/views.css'
import './assets/styles/inventory.css'
import './assets/styles/login.css'
import './assets/styles/itemlists.css'
import './assets/styles/userlists.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { addIcons } from 'ionicons'
import { searchOutline } from 'ionicons/icons'

addIcons({
  'search-outline': searchOutline,
})

const app = createApp(App)

// ✅ create pinia instance first
const pinia = createPinia()

// ✅ register pinia before router or after (order doesn’t matter, but must be before mount)
app.use(pinia)
app.use(router)

app.mount('#app')

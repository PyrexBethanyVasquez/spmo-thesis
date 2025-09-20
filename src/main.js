import './assets/main.css'
import './assets/styles/views.css'
import './assets/styles/inventory.css'
import './assets/styles/login.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App).use(router)

app.use(createPinia())

app.mount('#app')

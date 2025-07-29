import './assets/main.css'

import {createApp} from 'vue'
import {createPinia} from 'pinia'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// Configure axios defaults
axios.defaults.baseURL = "http://localhost:20021/"

const app = createApp(App)

// Use plugins
app.use(createPinia())
app.use(router)

app.mount('#app')

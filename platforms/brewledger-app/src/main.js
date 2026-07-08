import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { AuthService } from './services/AuthService'

// Proactive auth check
AuthService.checkAuth();

createApp(App)
  .use(router)
  .mount('#app')

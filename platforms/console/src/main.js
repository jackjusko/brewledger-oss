import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createHead())
app.use(router)
app.mount('#app')

import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import router from './router'
import 'element3/lib/theme-chalk/index.css'
import element3 from 'element3'
createApp(App).use(router).use(element3).mount('#app')

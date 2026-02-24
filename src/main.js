import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './assets/MarkerCluster.css'
import './assets/leaflet.css'

createApp(App).use(router).mount('#app')

import './assets/main.css'

import { createMemoryHistory, createRouter } from 'vue-router'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import HomeView from './HomeView.vue'
import AboutView from './AboutView.vue'
import ContactView from './ContactView.vue'
import DocsView from './DocsView.vue'
import DataStatisticsView from './Data&StatisticsView.vue'
import AuthView from './AuthView.vue'
import IssueView from './IssueView.vue'

const routes = [
    { path: '/', component: HomeView },
    { path: '/about', component: AboutView },
    { path: '/auth', component: AuthView },
    { path: '/docs', component: DocsView },
    { path: '/contact-us', component: ContactView },
    { path: '/data', component: DataStatisticsView },
    { path: '/issue', component: IssueView }
]

export const router = createRouter({
    history: createMemoryHistory(),
    routes,
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')

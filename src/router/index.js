
import { createRouter, createWebHashHistory } from 'vue-router';
const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('../views/home.vue'),
    },
    {
        path: '/result',
        name: 'result',
        component: () => import('../views/result.vue'),
    }
]
const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router
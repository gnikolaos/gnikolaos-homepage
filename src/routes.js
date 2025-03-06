import { lazy } from 'solid-js'

const routes = [
    {
        path: '/',
        component: lazy(() => import('./routes/Home')),
    },
]

export default routes

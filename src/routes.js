import { lazy } from 'solid-js'

const routes = [
    {
        path: '/',
        component: lazy(() => import('./routes/Home')),
    },
    {
        path: '/terminal/*path',
        component: lazy(() => import('./routes/TerminalRoute')),
    },
]

export default routes

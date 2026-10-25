import { lazy } from 'solid-js'

const routes = [
    {
        path: '/',
        component: lazy(() => import('./routes/HomeRoute')),
    },
    {
        path: '/terminal/*path',
        component: lazy(() => import('./routes/TerminalRoute')),
    },
]

export default routes

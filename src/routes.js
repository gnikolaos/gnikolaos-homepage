import { lazy } from 'solid-js'

const routes = [
    {
        path: '/',
        component: lazy(() => import('./routes/Home')),
    },
    {
        path: '/terminal',
        component: lazy(() => import('./routes/Terminal')),
        children: [
            {
                path: '/:path?/:fileName?',
                component: lazy(() => import('./routes/Terminal')),
            },
        ],
    },
]

export default routes

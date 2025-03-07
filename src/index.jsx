/* @refresh reload */
import { render } from 'solid-js/web'
import { Router } from '@solidjs/router'
import routes from './routes'

import './index.css'

const wrapper = document.getElementById('app')

if (!wrapper) {
    throw new Error('Wrapper div not found')
}

render(() => <Router>{routes}</Router>, wrapper)

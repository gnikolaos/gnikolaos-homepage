import { A } from '@solidjs/router'
import Kbd from './Kbd'
import { IconTerminal } from './Icon'

const Header = () => {
    return (
        <header class="px-4 py-8 text-xs md:px-8 md:text-base">
            <div class="container mx-auto rounded-lg border border-gray-100 bg-gray-300/10 bg-clip-padding p-4 text-stone-800 backdrop-blur-md backdrop-filter">
                <div class="hidden sm:flex sm:items-center sm:justify-between">
                    <p>This is not a menu!</p>
                    <div class="flex">
                        <span class="text-nowrap">
                            Press
                            <kbd class="mx-2 inline-flex items-center gap-2">
                                <Kbd keyLabel="Ctrl" />+<Kbd keyLabel="T" />
                            </kbd>
                            to open the terminal.
                        </span>
                    </div>
                </div>
                <A href="/terminal" class="flex items-center justify-center text-white sm:hidden">
                    <IconTerminal class="h-4 w-4" />
                    <span>Open Terminal.</span>
                </A>
            </div>
        </header>
    )
}

export default Header

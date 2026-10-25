import { createSignal } from 'solid-js'
import { IconTerminal } from './Icon'
import { A } from '@solidjs/router'
import Cable from './Cable'

/**
 * Headertwo component.
 * @param {Object} props - The properties passed to the component.
 * @param {import('solid-js').Setter<boolean>} props.isConnectedHandler - A handler function to set the connection state.
 * @param {boolean} props.isConnected - Indicating if the cable is connected.
 * @returns {import('solid-js').JSX.Element} The Header component.
 */
const Headertwo = (props) => {
    const [socket, setSocket] = createSignal(/** @type {HTMLDivElement | undefined} */ (undefined))

    return (
        // z-20 keeps the hanging plug above <main>, so it can still be grabbed there.
        <header class="relative isolate z-20 flex justify-center overflow-hidden py-8 text-xs md:text-base">
            <div class="container ml-4 flex md:px-8">
                <div class="pointer-events-none z-10 rounded-sm bg-gray-300/10 px-5 py-2 md:scale-150 md:bg-gray-300/20">
                    {/* RJ45 socket, with the port opening the plug goes into on its right edge */}
                    <div
                        ref={setSocket}
                        class="relative z-50 flex size-11 items-start justify-end gap-0.5 rounded-xs bg-gray-300 pt-0.5 pr-0.5 shadow-md ring-1 ring-gray-400/40"
                    >
                        <span
                            class={`size-1.5 rounded-full bg-gray-400 transition-all ${props.isConnected ? 'animate-success-blink-alt' : 'animate-error-blink'}`}
                        />
                        <span
                            class={`size-1.5 rounded-full bg-gray-400 transition-all ${props.isConnected ? 'bg-green-600/50' : 'bg-gray-400'}`}
                        />
                        <span
                            class={`size-1.5 rounded-full bg-gray-400 transition-all ${props.isConnected ? 'animate-success-blink' : 'bg-gray-400'}`}
                        />
                        <div class="absolute top-1/2 right-0 h-3 w-[3px] -translate-y-1/2 rounded-l-[1px] bg-gray-400/40" />
                    </div>
                </div>
            </div>
            <Cable
                socket={socket()}
                connected={props.isConnected}
                onConnectedChange={(connected) => props.isConnectedHandler(connected)}
            />
            {/* Access Terminal button
                <div
                class={`fixed z-10 w-dvw items-center justify-center transition-all ${props.isConnected ? 'flex' : 'hidden'}`}
            >
                <A
                    href="/terminal"
                    class="ml-4 flex items-center justify-center rounded-sm bg-white/10 px-4 py-1 shadow-sm ring-1 ring-black/5 outline-stone-400 backdrop-blur-sm transition-colors hover:bg-white"
                >
                    <IconTerminal class="mt-[3px] h-5 w-5" />
                    <span class="text-shadow-white">Terminal.</span>
                </A>
            </div>
                */}
        </header>
    )
}

export default Headertwo

import { createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { IconTerminal } from './Icon'
import { A } from '@solidjs/router'

/**
 * Headertwo component.
 * @param {Object} props - The properties passed to the component.
 * @param {import('solid-js').Setter<boolean>} props.isConnectedHandler - A handler function to set the connection state.
 * @param {boolean} props.isConnected - Indicating if the cable is connected.
 * @returns {import('solid-js').JSX.Element} The Header component.
 */
const Headertwo = (props) => {
    const CABLE_SLICE_ONE_INITIAL_X = 0
    const CABLE_SLICE_TWO_INITIAL_X = 70
    const [cableSliceOneTranslateX, setCableSliceOneTranslateX] = createSignal(CABLE_SLICE_ONE_INITIAL_X)
    const [cableSliceTwoScaleX, setCableSliceTwoScaleX] = createSignal(CABLE_SLICE_TWO_INITIAL_X)
    const [socketSnapPoint, setSocketSnapPoint] = createSignal(0)
    const [isDragging, setIsDragging] = createSignal(false)
    const [dragOffset, setDragOffset] = createSignal(0)
    const [startX, setStartX] = createSignal(0)
    const [disconnectAttempt, setDisconnectAttempt] = createSignal(false)

    const DISCONNECT_FORCE = 80
    /** Distance from box where cable will snap. */
    const SNAP_THRESHOLD = 150
    /** @type {HTMLDivElement} */
    let socketRef
    /** @type {HTMLDivElement} */
    let cableRef
    /** @type {HTMLDivElement} */
    let cableConnectorRef

    // Updates the scale and translation of the two cable slices based on the current drag offset.
    // - Scales cable slice two by increasing its X scale with the drag offset, but not below its initial value.
    // - Translates cable slice one by decreasing its X position with the drag offset, but not above its initial value.
    //
    // This effect runs whenever the drag offset changes.
    createEffect(() => {
        const offset = dragOffset()
        setCableSliceTwoScaleX(Math.max(CABLE_SLICE_TWO_INITIAL_X, CABLE_SLICE_TWO_INITIAL_X + offset))
        setCableSliceOneTranslateX(Math.min(CABLE_SLICE_ONE_INITIAL_X, CABLE_SLICE_ONE_INITIAL_X - offset))
    })

    /**
     * Play sound when cable is connected/disconnected.
     * It will play only if user has interacted with the page first (browser policy).
     * returns {void}
     */
    const playCableSound = () => {
        const src = '/audio/plug.mp3'
        const sound = new Audio(src)
        sound.volume = 0.4
        sound.play()
    }

    /**
     * Calculates the socket's right boundary using getBoundingClientRect and sets the it's snap point state to this value.
     * If the cable is connected, also updates the connected and drag offsets to match the new socket position.
     * Called on mount and window resize to ensure UI alignment.
     * @returns {void}
     */
    const updateSocketPosition = () => {
        if (!socketRef) return

        const snapPoint = socketRef.getBoundingClientRect().right - 7 // Allow to get a bit inside the socket
        setSocketSnapPoint(snapPoint)

        // if (props.isConnected && cableConnectorRef) {
        //     setConnectedOffset(snapPoint)
        //     //setDragOffset(snapPoint)
        // }
    }

    /**
     * Handle start of mouse drag or touch start.
     * @param {MouseEvent | TouchEvent} e - The mouse or touch event.
     * @reutrn {void}
     */
    const handleCableDrag = (e) => {
        const clientX = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX
        setIsDragging(true)
        setStartX(clientX)

        // If we're connected, start a disconnect attempt
        if (props.isConnected) {
            setDisconnectAttempt(true)
        }
    }

    /**
     * Handle drag movement via mouse or touch.
     * @param {MouseEvent | TouchEvent} e - The mouse or touch event.
     * @returns {void}
     */
    const handleCableMove = (e) => {
        if (!isDragging()) return

        const clientX = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX

        // Calculate how much we've moved
        const deltaX = startX() - clientX
        let newOffset = deltaX * 0.7

        setDragOffset(newOffset)

        // Handle disconnection attempt
        if (props.isConnected && disconnectAttempt()) {
            // Only allow movement to the right (negative deltaX) when trying to disconnect
            if (deltaX < 0) {
                // We're pulling away from the socket
                if (deltaX > -DISCONNECT_FORCE) {
                    // If pulled hard enough, disconnect
                    props.isConnectedHandler(false)
                    if (deltaX > -SNAP_THRESHOLD) {
                        setDisconnectAttempt(false)
                    }

                    // Animate back to starting position
                    setDragOffset(0)
                    playCableSound()
                    return
                }

                // Apply resistance - cable stretches less than the mouse moves
                // The closer to DISCONNECT_FORCE, the more the cable can move
                const stretchFactor = 0.2 + (deltaX / DISCONNECT_FORCE) * 0.3
                newOffset = deltaX * stretchFactor
                setDragOffset(newOffset)
                return
            }

            // If trying to move left while connected, don't allow it
            newOffset = socketSnapPoint()
            setDragOffset(newOffset)
            return
        }

        // If not connected, allow dragging freely.
        if (!props.isConnected && cableConnectorRef && !disconnectAttempt()) {
            const cableConnectorX = cableConnectorRef.getBoundingClientRect().left

            // Check if close enough to snap
            if (Math.abs(cableConnectorX - socketSnapPoint()) <= SNAP_THRESHOLD) {
                // Snap the connector to the socket
                const distanceToMove = (cableConnectorX - socketSnapPoint()) / (window.innerWidth > 768 ? 1.5 : 1)
                newOffset = dragOffset() + distanceToMove
                setDragOffset(newOffset)
                props.isConnectedHandler(true)
                setIsDragging(false)
                playCableSound()
                return
            }
        }
    }

    /**
     * Handle end of mouse drag or touch end.
     */
    const handleCableInteractionEnd = () => {
        if (!isDragging()) return

        setIsDragging(false)
        setDisconnectAttempt(false)

        // If not snapped, return to initial position
        if (!props.isConnected) {
            setDragOffset(0)
            return
        }

        // If connected but was attempting to disconnect and failed, snap back to connected position.
        if (props.isConnected) {
            if (cableConnectorRef) {
                const cableConnectorX = cableConnectorRef.getBoundingClientRect().left
                const distanceToMove = (cableConnectorX - socketSnapPoint()) / (window.innerWidth > 768 ? 1.5 : 1)
                const newOffset = dragOffset() + distanceToMove
                setDragOffset(newOffset)
            }
        }
    }

    onMount(() => {
        // Initial position calculation
        updateSocketPosition()

        // Add resize listener to recalculate box position when window size changes
        window.addEventListener('resize', updateSocketPosition)

        // Add global event listeners
        window.addEventListener('mousemove', handleCableMove)
        window.addEventListener('mouseup', handleCableInteractionEnd)
        window.addEventListener('touchmove', handleCableMove, { passive: false })
        window.addEventListener('touchend', handleCableInteractionEnd)
    })

    // Cleanup function
    onCleanup(() => {
        window.removeEventListener('resize', updateSocketPosition)
        window.removeEventListener('mousemove', handleCableMove)
        window.removeEventListener('mouseup', handleCableInteractionEnd)
        window.removeEventListener('touchmove', handleCableMove)
        window.removeEventListener('touchend', handleCableInteractionEnd)
    })

    return (
        <header
            class="relative isolate flex justify-center overflow-hidden py-8 text-xs md:text-base"
            classList={{ 'cursor-grabbing': isDragging() }}
        >
            <div class="container ml-4 flex md:px-8">
                <div class="z-10 rounded-sm bg-gray-300/10 px-5 py-2 md:scale-150 md:bg-gray-300/20">
                    {/* RJ45 socket */}
                    <div
                        ref={socketRef}
                        class="z-50 flex size-11 items-start justify-end gap-0.5 rounded-xs bg-gray-300 pt-0.5 pr-0.5 shadow-md"
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
                    </div>
                </div>
            </div>
            <div
                ref={cableRef}
                class="absolute top-1/2 right-28 flex -translate-y-1/2"
                onMouseDown={handleCableDrag}
                onTouchStart={handleCableDrag}
            >
                {/* RJ45 cable */}
                <div class="relative isolate flex items-center md:scale-150">
                    {/* Cable slice-1, the cable head/connector. */}
                    <div
                        ref={cableConnectorRef}
                        class={`absolute z-10 flex items-center shadow-xl ${isDragging() ? 'cursor-grabbing' : 'cursor-grab'}`}
                        style={{
                            transform: `translateX(${cableSliceOneTranslateX()}px)`,
                            'transition-property': 'translate',
                        }}
                    >
                        <div class="relative flex items-center">
                            <div class="h-2.5 w-2 bg-gray-300">
                                <div class="flex size-full items-center">
                                    <div class="flex h-10/12 w-1 flex-col justify-evenly border-y border-r-2 border-yellow-100">
                                        <span class="h-[1px] w-0.5 bg-yellow-100" />
                                        <span class="h-[1px] w-0.5 bg-yellow-100" />
                                        <span class="h-[1px] w-0.5 bg-yellow-100" />
                                    </div>
                                    <div class="flex h-10/12 w-0.5 flex-col justify-evenly border-y border-r-2 border-gray-400" />
                                    <div class="flex h-10/12 w-[1px] flex-col justify-evenly border-y border-r border-yellow-100" />
                                </div>
                            </div>
                            <div class="size-3 rounded-r-xs bg-gray-300" />
                            <div class="absolute right-1 h-1 w-2.5 bg-white/40" />
                        </div>
                        <div class="h-2 w-0.5 rounded-r-xs bg-gray-400" />
                    </div>

                    {/* Cable slice-2, the actual cable part we animate in order to reach the socket. */}
                    <div
                        class="absolute -right-22 h-1 w-[1px] bg-gray-300 shadow-xl"
                        style={{
                            transform: `scaleX(${cableSliceTwoScaleX()})`,
                            'transform-origin': 'right',
                            'transition-property': 'scale',
                        }}
                    />

                    {/* Cable slice-3, acts like an anchor to the far right part of the screen. */}
                    <div class="absolute h-1 w-6 translate-x-[5.5rem] bg-gray-300 shadow-xl" />
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
                </div>
            </div>
        </header>
    )
}

export default Headertwo

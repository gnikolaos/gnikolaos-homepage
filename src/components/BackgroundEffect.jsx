import { For, createSignal } from 'solid-js'

const BackgroundEffect = () => {
    const [positions, setPositions] = createSignal([])

    const randomizeBlurPosition = () => {
        return Array.from({ length: 5 }, () => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            size: `${Math.random() * 300 + 100}px`,
            blur: `${Math.random() * 50 + 20}px`,
            duration: `${Math.random() * 20 + 10}s`,
        }))
    }

    const animate = () => {
        setPositions(randomizeBlurPosition())
    }

    animate()

    return (
        <div class="absolute inset-0 z-0 overflow-hidden">
            <For each={positions()}>
                {(pos) => (
                    <div
                        class="animate-move-blur absolute rounded-full bg-white opacity-20"
                        style={{
                            top: pos.top,
                            left: pos.left,
                            width: pos.size,
                            height: pos.size,
                            filter: `blur(${pos.blur})`,
                            'animation-duration': pos.duration,
                        }}
                    />
                )}
            </For>
        </div>
    )
}

export default BackgroundEffect

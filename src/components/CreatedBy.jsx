import { createSignal, onMount, Show } from 'solid-js'

const CreatedBy = () => {
    // Workaround for devices not supporting hover in order to enable the animation
    const [isActive, setIsActive] = createSignal(false)
    const [supportsHover, setSupportsHover] = createSignal(true)

    onMount(() => {
        const hoverSupported = window.matchMedia('(hover: hover)').matches
        setSupportsHover(hoverSupported)
    })

    const handleTap = () => {
        if (!supportsHover()) {
            setIsActive(!isActive())
        }
    }

    return (
        <div class="group hover-on-touch isolate w-full pt-12" onClick={handleTap}>
            <div class="relative ml-auto w-12 opacity-90">
                <div class="relative z-10">
                    <svg
                        class="inline-block size-[30px]"
                        version="1.0"
                        viewBox="0 0 180 180"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <g transform="translate(0 180) scale(.1 -.1)">
                            <path d="m1270 1312c0-4 5-13 11-19 24-24-11-85-104-176-98-97-111-127-20-51 64 55 61 49-46-91-34-43-61-82-61-86 0-15 32-31 66-32 32-1 43 6 84 50 25 28 64 77 85 109 97 148 181 233 248 250 44 11 33-19-41-110-73-91-107-150-117-208-6-32-3-41 20-64s32-25 67-20c71 12 149 59 273 169 59 52 35 57-27 5-115-98-174-128-192-99-4 5 26 58 65 117 87 129 98 176 54 220-24 24-32 26-76 21-62-8-122-48-179-121-23-31-44-55-46-54-1 2 2 26 7 53 11 57 4 102-19 128-15 17-52 24-52 9z" />
                            <path d="m749 1286c-113-40-196-111-247-211-79-157 14-265 164-190 27 13 88 60 136 105l86 80-90-158c-108-189-183-290-262-354-76-60-139-83-236-82-123 0-210 59-242 166-14 46-33 51-24 6 11-54 55-118 103-148 59-38 137-53 239-48 203 11 356 150 584 533 30 50 74 111 98 137s41 52 37 58c-3 5-21 17-38 26-18 9-47 32-65 50-57 58-136 68-243 30zm207-41c11-29-7-65-66-134-71-83-212-198-253-207-62-13-67 45-11 130 90 137 306 275 330 211z" />
                        </g>
                    </svg>
                </div>
                <Show
                    when={supportsHover()}
                    fallback={
                        <div
                            class={`ease absolute z-0 bg-yellow-300 transition-all duration-200 ${isActive() ? '-top-[3px] left-0 size-8 rounded-full' : 'top-[9px] left-1 h-2 w-11'} `}
                        />
                    }
                >
                    <div class="ease absolute top-[9px] left-1 z-0 h-2 w-11 bg-yellow-300 transition-all duration-200 group-hover:-top-[3px] group-hover:left-0 group-hover:size-8 group-hover:rounded-full" />
                </Show>
            </div>
        </div>
    )
}

export default CreatedBy

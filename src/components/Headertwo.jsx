const Headertwo = () => {
    return (
        <header class="relative isolate container ml-auto flex justify-between overflow-hidden py-8 text-xs md:px-8 md:text-base">
            <div class="relative ml-4 rounded-sm bg-gray-300/10 px-5 py-2 md:scale-150">
                {/* RJ45 socket */}
                <div class="z-50 flex size-11 items-start justify-end gap-0.5 rounded-xs bg-gray-300 pt-0.5 pr-0.5 shadow-md">
                    <span class="animate-error-blink size-1.5 rounded-full bg-gray-400 transition-all" />
                    <span class="size-1.5 rounded-full bg-gray-400" />
                    <span class="size-1.5 rounded-full bg-gray-400" />
                </div>
            </div>
            <div class="absolute top-1/2 flex w-dvw translate-x-11/12 -translate-y-1/2 flex-col justify-center md:translate-x-10/12">
                {/* RJ45 cable */}
                <div class="isolate flex items-center">
                    <div class="z-10 flex items-center md:scale-150">
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
                    <div class="-ml-0.5 h-1.5 w-full bg-gray-300 md:scale-y-150" />
                </div>
            </div>
        </header>
    )
}

export default Headertwo

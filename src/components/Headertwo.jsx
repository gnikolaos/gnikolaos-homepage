const Headertwo = () => {
    return (
        <header class="container mx-auto flex justify-between py-8 text-xs md:px-8 md:text-base">
            <div class="relative ml-4 rounded-sm bg-gray-300/10 px-5 py-2">
                {/* RJ45 socket */}
                <div class="flex size-11 items-start justify-end gap-0.5 rounded-xs bg-gray-300 pt-0.5 pr-0.5 shadow-md">
                    <span class="size-1.5 rounded-full bg-red-500" />
                    <span class="size-1.5 rounded-full bg-gray-400" />
                    <span class="size-1.5 rounded-full bg-gray-400" />
                </div>
            </div>
            <div class="relative w-dvw py-2">
                {/* RJ45 cable */}
                <div class="flex items-center">
                    <div class="flex h-2 w-1.5 items-center justify-center border border-gray-300">
                        <div class="h-1 w-[1px] bg-gray-300" />
                    </div>
                    <div class="h-2.5 w-2 bg-gray-300 pr-0.5">
                        <div class="flex size-full items-center justify-end">
                            <div class="flex h-10/12 w-1 items-center justify-end border border-gray-700">
                                <span class="size-[1px] bg-gray-700" />
                            </div>
                        </div>
                    </div>
                    <div class="h-3 w-2 bg-gray-300" />
                    <div class="ml-[1px] h-1 w-full bg-gray-300" />
                </div>
            </div>
        </header>
    )
}

export default Headertwo

const Headertwo = () => {
    return (
        <header class="container mx-auto flex justify-between py-8 text-xs md:px-8 md:text-base">
            <div class="relative ml-4 rounded-sm bg-gray-300/10 px-5 py-2">
                {/* RJ45 socket */}
                <div class="flex size-4 items-start justify-end gap-[1px] rounded-xs bg-gray-300 pt-0.5 pr-0.5 shadow-md">
                    <span class="size-0.5 rounded-full bg-red-500"></span>
                    <span class="size-0.5 rounded-full bg-gray-400"></span>
                    <span class="size-0.5 rounded-full bg-gray-400"></span>
                </div>
            </div>
        </header>
    )
}

export default Headertwo

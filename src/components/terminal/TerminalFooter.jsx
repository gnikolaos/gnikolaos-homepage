import { A } from '@solidjs/router'

/**
 * A terminal footer with tmux like aesthetics.
 *
 * The style is inspired by Takuya's dotfiles.
 * Check out the configuration here:
 * [tmux statusline.conf](https://github.com/craftzdog/dotfiles-public/blob/master/.config/tmux/statusline.conf)
 *
 */
const TerminalFooter = () => {
    return (
        <footer class="font-meslo flex w-full flex-col gap-2 text-sm sm:flex-row sm:justify-between sm:gap-0 sm:bg-[#00212a] sm:text-base">
            <div class="flex">
                <span class="bg-white px-2 py-1">
                    <span class="font-bold text-black">1</span>
                </span>

                <div class="z-10 size-0 border-y-[0.875rem] border-l-[0.875rem] border-y-transparent border-l-white sm:border-y-[1rem] sm:border-l-[1rem]" />

                <A
                    href="/"
                    class="group -ml-[0.875rem] bg-gray-400 py-1 pr-2 pl-5 font-bold text-black focus-visible:text-white focus-visible:outline-offset-2 focus-visible:outline-stone-400 sm:-ml-4"
                >
                    <span class="text-sm transition-colors group-hover:text-white">gnikolaos.gr</span>
                </A>

                <div class="z-10 size-0 border-y-[0.875rem] border-l-[0.875rem] border-y-transparent border-l-gray-400 sm:border-y-[1rem] sm:border-l-[1rem]" />

                <span class="-ml-[0.875rem] w-full bg-[#00212a] sm:-ml-4 sm:hidden" />
            </div>

            <div class="self-center pb-1 text-xs text-gray-400 sm:flex sm:h-full sm:pb-0">
                <div class="z-10 hidden size-0 border-y-[1rem] border-r-[1rem] border-y-transparent border-r-[#102e37] sm:block" />
                <div class="-mr-4 w-4 bg-[#102e37]" />

                <div class="z-10 hidden size-0 border-y-[1rem] border-r-[1rem] border-y-transparent border-r-[#405560] sm:block" />
                <div class="-mr-4 w-4 bg-[#405560]" />

                <div class="z-10 hidden size-0 border-y-[1rem] border-r-[1rem] border-y-transparent border-r-[#78838f] sm:block" />
                <div class="-mr-4 w-4 bg-[#78838f]" />

                <div class="z-10 hidden size-0 border-y-[1rem] border-r-[1rem] border-y-transparent border-r-gray-400 sm:block" />
                <span class="sm:flex sm:h-full sm:items-center sm:bg-gray-400 sm:px-2 sm:font-bold sm:text-gray-800">
                    All rights reserved © - {new Date().getFullYear()}
                </span>
            </div>
        </footer>
    )
}

export default TerminalFooter

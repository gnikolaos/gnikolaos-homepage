import Footer from '@gnikolaos/components/Footer'
import BackgroundEffect from '@gnikolaos/components/BackgroundEffect'
import { IconEmail, IconGitHub, IconLinkedIn } from '@gnikolaos/components/Icon'

const Home = () => {
    return (
        <>
            <BackgroundEffect />
            <main class="z-10 flex-1 pt-[86px]">
                <div class="container mx-auto flex h-full flex-col items-center justify-center gap-4 text-center">
                    <h1 class="-mt-24 text-6xl font-bold text-white drop-shadow-md md:text-8xl">Georgiou Nikolaos</h1>
                    <h2 class="text-xl font-bold text-white drop-shadow-md md:text-2xl">
                        MSc Cultural Informatics & Communication
                    </h2>
                    <div class="flex gap-6 pt-8">
                        <a
                            href="https://github.com/gnikolaos"
                            target="_blank"
                            aria-label="Check out my GitHub profile"
                            class="rounded-sm p-2 text-stone-400 transition-colors hover:text-white focus-visible:outline-stone-400"
                        >
                            <IconGitHub twClass="h-7 w-7" />
                        </a>
                        <a
                            href="mailto:nikos127.0.0.1@hotmail.com"
                            aria-label="Send me a business inquiry"
                            class="rounded-sm p-2 text-stone-400 transition-colors hover:text-white focus-visible:outline-stone-400"
                        >
                            <IconEmail twClass="h-7 w-7" />
                        </a>
                        <a
                            href="https://linkedin.com/in/gnikolaos/"
                            target="_blank"
                            aria-label="Connect with me on LinkedIn"
                            class="rounded-sm p-2 text-stone-400 transition-colors hover:text-white focus-visible:outline-stone-400"
                        >
                            <IconLinkedIn twClass="h-7 w-7" />
                        </a>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    )
}

export default Home

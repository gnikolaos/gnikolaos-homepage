/**
 * @typedef {object} Profile
 * @property {string} user
 * @property {string} host
 * @property {{ github: string, linkedin: string, email: string }} links
 */

/** @type {Readonly<Profile>} */
const profile = Object.freeze({
    user: 'visitor',
    host: 'gnikolaos.gr',
    links: Object.freeze({
        github: 'https://github.com/gnikolaos',
        linkedin: 'https://linkedin.com/in/gnikolaos/',
        email: 'mailto:nikos127.0.0.1@hotmail.com',
    }),
})

export default profile

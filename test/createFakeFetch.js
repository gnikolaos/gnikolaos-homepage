/**
 * Creates a fetch that answers every request with `respond` and records the requested urls.
 * @param {() => Promise<Response> | Response} respond
 */
const createFakeFetch = (respond) => {
    /** @type {string[]} */
    const calls = []
    /** @type {typeof globalThis.fetch} */
    const fetchImpl = async (input) => {
        calls.push(String(input))
        return respond()
    }
    return { fetchImpl, calls }
}

export { createFakeFetch }

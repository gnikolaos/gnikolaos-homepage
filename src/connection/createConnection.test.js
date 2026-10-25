import { describe, expect, test } from 'vitest'
import { createMemoryStorage } from '@gnikolaos/lib/shared/createMemoryStorage'
import { createConnection } from './createConnection'

/** @import { KeyValueStorage } from '@gnikolaos/lib/shared/types' */

const CONNECTION_KEY = 'gnikolaos:terminal:connection'
const LAST_LOGIN_KEY = 'gnikolaos:terminal:lastLogin'

/**
 * @param {object} [options]
 * @param {KeyValueStorage} [options.session]
 * @param {KeyValueStorage} [options.local]
 * @param {() => Date} [options.now]
 */
const setup = ({ session = createMemoryStorage(), local = createMemoryStorage(), now } = {}) => ({
    session,
    local,
    connection: createConnection({ session, local, now }),
})

/** @param {KeyValueStorage} session */
const readStored = (session) => JSON.parse(session.getItem(CONNECTION_KEY) ?? 'null')

/** @returns {KeyValueStorage} */
const createFullStorage = () => ({
    ...createMemoryStorage(),
    setItem: () => {
        throw new DOMException('full', 'QuotaExceededError')
    },
})

describe('createConnection', () => {
    test('starts disconnected and not booted', () => {
        const { connection } = setup()
        expect(connection.connected()).toBe(false)
        expect(connection.booted()).toBe(false)
    })

    test('reads a stored record back on creation', () => {
        const session = createMemoryStorage()
        session.setItem(CONNECTION_KEY, JSON.stringify({ connected: true, booted: true }))
        const { connection } = setup({ session })
        expect(connection.connected()).toBe(true)
        expect(connection.booted()).toBe(true)
    })

    test.each([
        '{not json',
        'null',
        '"connected"',
        JSON.stringify({ connected: 'yes' }),
        JSON.stringify({ connected: 'yes', booted: false }),
    ])('falls back to the defaults for the stored value %s', (stored) => {
        const session = createMemoryStorage()
        session.setItem(CONNECTION_KEY, stored)
        const { connection } = setup({ session })
        expect(connection.connected()).toBe(false)
        expect(connection.booted()).toBe(false)
    })
})

describe('connect', () => {
    test('plugs the cable in and keeps booted unchanged', () => {
        const { session, connection } = setup()
        connection.connect()
        expect(connection.connected()).toBe(true)
        expect(connection.booted()).toBe(false)
        expect(readStored(session)).toEqual({ connected: true, booted: false })
    })

    test('keeps a stored booted flag', () => {
        const session = createMemoryStorage()
        session.setItem(CONNECTION_KEY, JSON.stringify({ connected: false, booted: true }))
        const { connection } = setup({ session })
        connection.connect()
        expect(readStored(session)).toEqual({ connected: true, booted: true })
    })

    test('does not throw when storage is full', () => {
        const { connection } = setup({ session: createFullStorage() })
        expect(() => connection.connect()).not.toThrow()
        expect(connection.connected()).toBe(true)
    })
})

describe('markBooted', () => {
    test('marks the session connected and booted', () => {
        const { session, connection } = setup()
        connection.markBooted()
        expect(connection.connected()).toBe(true)
        expect(connection.booted()).toBe(true)
        expect(readStored(session)).toEqual({ connected: true, booted: true })
    })

    test('does not throw when storage is full', () => {
        const { connection } = setup({ session: createFullStorage() })
        expect(() => connection.markBooted()).not.toThrow()
        expect(connection.booted()).toBe(true)
    })
})

describe('disconnect', () => {
    test('resets both flags after markBooted', () => {
        const { session, connection } = setup()
        connection.markBooted()
        connection.disconnect()
        expect(connection.connected()).toBe(false)
        expect(connection.booted()).toBe(false)
        expect(readStored(session)).toEqual({ connected: false, booted: false })
    })

    test('does not throw when storage is full', () => {
        const { connection } = setup({ session: createFullStorage() })
        connection.markBooted()
        expect(() => connection.disconnect()).not.toThrow()
        expect(connection.connected()).toBe(false)
        expect(connection.booted()).toBe(false)
    })
})

describe('recordLogin', () => {
    test('returns null on the first login, then the previous login time', () => {
        const first = new Date('2026-10-24T19:51:10.000Z')
        const second = new Date('2026-10-25T08:00:00.000Z')
        const times = [first, second]
        const { local, connection } = setup({ now: () => times.shift() ?? second })
        expect(connection.recordLogin()).toBeNull()
        expect(local.getItem(LAST_LOGIN_KEY)).toBe(first.toISOString())
        expect(connection.recordLogin()).toEqual(first)
        expect(local.getItem(LAST_LOGIN_KEY)).toBe(second.toISOString())
    })

    test('treats an invalid stored timestamp as missing', () => {
        const local = createMemoryStorage()
        local.setItem(LAST_LOGIN_KEY, 'yesterday-ish')
        const { connection } = setup({ local })
        expect(connection.recordLogin()).toBeNull()
    })

    test('does not throw when storage is full', () => {
        const { connection } = setup({ local: createFullStorage() })
        expect(() => connection.recordLogin()).not.toThrow()
    })
})

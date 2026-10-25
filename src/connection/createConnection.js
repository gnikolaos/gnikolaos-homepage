import { createSignal } from 'solid-js'
import { parseJsonOrNull } from '@gnikolaos/lib/shared/parseJsonOrNull'

/** @import { KeyValueStorage } from '@gnikolaos/lib/shared/types' */
/** @import { ConnectionRecord } from './types' */

const CONNECTION_KEY = 'gnikolaos:terminal:connection'
const LAST_LOGIN_KEY = 'gnikolaos:terminal:lastLogin'

/** @type {ConnectionRecord} */
const DISCONNECTED = { connected: false, booted: false }

/**
 * @param {unknown} value
 * @returns {value is ConnectionRecord}
 */
const isConnectionRecord = (value) =>
    typeof value === 'object' &&
    value !== null &&
    'connected' in value &&
    'booted' in value &&
    typeof value.connected === 'boolean' &&
    typeof value.booted === 'boolean'

/**
 * @param {KeyValueStorage} storage
 * @returns {ConnectionRecord}
 */
const readRecord = (storage) => {
    const parsedValue = parseJsonOrNull(storage.getItem(CONNECTION_KEY))
    if (!isConnectionRecord(parsedValue)) return DISCONNECTED
    return { connected: parsedValue.connected, booted: parsedValue.booted }
}

/**
 * Writes a value, ignoring storage failures such as a full quota.
 * @param {KeyValueStorage} storage
 * @param {string} key
 * @param {string} value
 * @returns {void}
 */
const writeItem = (storage, key, value) => {
    try {
        storage.setItem(key, value)
    } catch {
        return
    }
}

/**
 * @param {string | null} iso
 * @returns {Date | null}
 */
const parseDateOrNull = (iso) => {
    if (iso === null) return null
    const date = new Date(iso)
    return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Creates the connection store: cable and boot state persisted in `session`, last login time in `local`.
 * @param {object} options
 * @param {KeyValueStorage} options.session
 * @param {KeyValueStorage} options.local
 * @param {() => Date} [options.now]
 */
const createConnection = ({ session, local, now = () => new Date() }) => {
    const initialRecord = readRecord(session)
    const [connected, setConnected] = createSignal(initialRecord.connected)
    const [booted, setBooted] = createSignal(initialRecord.booted)

    /** @param {ConnectionRecord} record */
    const commitRecord = (record) => {
        setConnected(record.connected)
        setBooted(record.booted)
        writeItem(session, CONNECTION_KEY, JSON.stringify(record))
    }

    return {
        connected,
        booted,
        connect: () => commitRecord({ connected: true, booted: booted() }),
        disconnect: () => commitRecord(DISCONNECTED),
        markBooted: () => commitRecord({ connected: true, booted: true }),
        recordLogin: () => {
            const previous = parseDateOrNull(local.getItem(LAST_LOGIN_KEY))
            writeItem(local, LAST_LOGIN_KEY, now().toISOString())
            return previous
        },
    }
}

export { createConnection }

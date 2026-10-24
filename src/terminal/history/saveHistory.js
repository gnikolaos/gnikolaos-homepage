/** @import { KeyValueStorage } from '@gnikolaos/lib/shared/types' */

/**
 * Saves the history entries as JSON, ignoring storage failures such as a full quota.
 * @param {KeyValueStorage} storage
 * @param {string} key
 * @param {readonly string[]} entries
 * @returns {void}
 */
const saveHistory = (storage, key, entries) => {
    try {
        storage.setItem(key, JSON.stringify(entries))
    } catch {
        return
    }
}

export { saveHistory }

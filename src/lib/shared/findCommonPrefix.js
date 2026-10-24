/**
 * Finds the longest prefix shared by every word, or an empty string for no words.
 * @param {string[]} words
 * @returns {string}
 */
const findCommonPrefix = (words) => {
    if (words.length === 0) return ''
    let prefix = words[0]
    for (const word of words.slice(1)) {
        let length = 0
        while (length < prefix.length && prefix[length] === word[length]) length += 1
        prefix = prefix.slice(0, length)
    }
    return prefix
}

export { findCommonPrefix }

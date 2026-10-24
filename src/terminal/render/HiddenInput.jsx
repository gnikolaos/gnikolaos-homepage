import { onCleanup, onMount } from 'solid-js'
import { resolveKey } from '../editor/keymap'
import {
    applyEdit,
    clearScreen,
    eof,
    historyNext,
    historyPrev,
    interrupt,
    submit,
    typeText,
} from '../store/terminalStore'

/** @typedef {import('../editor/keymap').Action} Action */
/** @typedef {import('../store/terminalStore').EditOp} EditOp */

/**
 * @param {Action} action
 * @returns {void}
 */
const dispatch = (action) => {
    switch (action.type) {
        case 'edit':
            return applyEdit(/** @type {EditOp} */ (action.op))
        case 'submit':
            return void submit()
        case 'historyPrev':
            return historyPrev()
        case 'historyNext':
            return historyNext()
        case 'clearScreen':
            return clearScreen()
        case 'interrupt':
            return interrupt()
        case 'eof':
            return void eof()
        case 'complete':
            return
    }
}

/** @returns {boolean} */
const hasSelection = () => {
    const selection = window.getSelection()
    return selection !== null && !selection.isCollapsed
}

/**
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
const isCopy = (e) => (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && hasSelection()

/**
 * @param {KeyboardEvent} e
 * @returns {void}
 */
const handleKey = (e) => {
    if (isCopy(e)) return
    const action = resolveKey(e)
    if (!action) return
    e.preventDefault()
    dispatch(action)
}

/**
 * @param {{ ref?: (el: HTMLInputElement) => void }} props
 */
const HiddenInput = (props) => {
    /** @type {HTMLInputElement | undefined} */
    let el
    let composing = false
    let pointerDown = false

    const focus = () => el?.focus({ preventScroll: true })

    /** @param {InputEvent} e */
    const onInput = (e) => {
        if (composing || e.isComposing) return
        if (e.data) typeText(e.data)
        if (el) el.value = ''
    }

    /** @param {CompositionEvent} e */
    const onCompositionEnd = (e) => {
        composing = false
        if (e.data) typeText(e.data)
        if (el) el.value = ''
    }

    /** @param {ClipboardEvent} e */
    const onPaste = (e) => {
        e.preventDefault()
        const text = e.clipboardData?.getData('text') ?? ''
        typeText(text.replace(/\r?\n/g, ' '))
    }

    const isFocusOnBody = () => document.activeElement === null || document.activeElement === document.body

    const onBlur = () => {
        setTimeout(() => {
            if (pointerDown || !document.hasFocus() || !isFocusOnBody() || hasSelection()) return
            focus()
        }, 0)
    }

    /** @param {KeyboardEvent} e */
    const onDocumentKeyDown = (e) => {
        if (e.target !== document.body || isCopy(e)) return
        focus()
        handleKey(e)
    }

    const onPointerDown = () => {
        pointerDown = true
    }

    const onPointerUp = () => {
        pointerDown = false
    }

    onMount(() => {
        focus()
        document.addEventListener('keydown', onDocumentKeyDown)
        document.addEventListener('pointerdown', onPointerDown, true)
        document.addEventListener('pointerup', onPointerUp, true)
        document.addEventListener('pointercancel', onPointerUp, true)
    })

    onCleanup(() => {
        document.removeEventListener('keydown', onDocumentKeyDown)
        document.removeEventListener('pointerdown', onPointerDown, true)
        document.removeEventListener('pointerup', onPointerUp, true)
        document.removeEventListener('pointercancel', onPointerUp, true)
    })

    return (
        <input
            ref={(input) => {
                el = input
                props.ref?.(input)
            }}
            type="text"
            class="sr-only"
            autocomplete="off"
            autocapitalize="off"
            spellcheck={false}
            enterkeyhint="send"
            aria-label="Terminal input"
            onKeyDown={handleKey}
            onInput={onInput}
            onCompositionStart={() => (composing = true)}
            onCompositionEnd={onCompositionEnd}
            onPaste={onPaste}
            onBlur={onBlur}
        />
    )
}

export default HiddenInput

import { onCleanup, onMount } from 'solid-js'
import { resolveKey } from '../editor/resolveKey'
import { terminal } from '../store/terminal'
import { hasTextSelection } from './hasTextSelection'

/** @import { Action, ScrollAction } from '../editor/types' */

const COMPOSITION_INPUT_TYPES = new Set(['insertCompositionText', 'insertFromComposition'])
const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta'])

const { state, actions } = terminal

/**
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
const isCopyShortcut = (e) => (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && hasTextSelection()

/**
 * Renders the visually hidden input that captures keyboard, composition and paste input for the terminal.
 * @param {{ ref?: (el: HTMLInputElement) => void, scroll: (action: ScrollAction) => void }} props
 */
const HiddenInput = (props) => {
    /** @type {HTMLInputElement | undefined} */
    let el
    let composing = false
    let pointerDown = false

    const focus = () => el?.focus({ preventScroll: true })

    /** @param {Action} action */
    const dispatchKeyAction = (action) => {
        switch (action.type) {
            case 'edit':
                return actions.applyEdit(action.op)
            case 'submit':
                return void actions.submit()
            case 'historyPrev':
                return actions.historyPrev()
            case 'historyNext':
                return actions.historyNext()
            case 'clearScreen':
                return actions.clearScreen()
            case 'interrupt':
                return actions.interrupt()
            case 'eof':
                return void actions.eof()
            case 'complete':
                return void actions.complete()
            case 'historySearch':
                return actions.historySearch()
            case 'acceptSearch':
                return actions.acceptSearch()
            case 'cancel':
                return actions.cancel()
            case 'scroll':
                return props.scroll(action)
        }
    }

    /** @param {KeyboardEvent} e */
    const onKeyDown = (e) => {
        if (isCopyShortcut(e)) return
        if (MODIFIER_KEYS.has(e.key)) return
        if (state.introPlaying) {
            e.preventDefault()
            actions.skipIntro()
            return
        }
        const action = resolveKey(e)
        if (!action) return
        if (action.type === 'complete' && state.editor.input === '' && !state.search) return
        e.preventDefault()
        dispatchKeyAction(action)
    }

    /** @param {InputEvent} e */
    const onInput = (e) => {
        if (composing || e.isComposing || COMPOSITION_INPUT_TYPES.has(e.inputType)) return
        if (e.data) actions.typeText(e.data)
        if (el) el.value = ''
    }

    /** @param {CompositionEvent} e */
    const onCompositionEnd = (e) => {
        composing = false
        if (e.data) actions.typeText(e.data)
        if (el) el.value = ''
    }

    /** @param {ClipboardEvent} e */
    const onPaste = (e) => {
        e.preventDefault()
        const text = e.clipboardData?.getData('text') ?? ''
        actions.typeText(text.replace(/\r?\n/g, ' '))
    }

    const isFocusOnBody = () => document.activeElement === null || document.activeElement === document.body

    const onBlur = () => {
        setTimeout(() => {
            if (pointerDown || !document.hasFocus() || !isFocusOnBody() || hasTextSelection()) return
            focus()
        }, 0)
    }

    /** @param {KeyboardEvent} e */
    const onDocumentKeyDown = (e) => {
        if (e.target !== document.body || MODIFIER_KEYS.has(e.key) || isCopyShortcut(e)) return
        focus()
        onKeyDown(e)
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
            onKeyDown={onKeyDown}
            onInput={onInput}
            onCompositionStart={() => (composing = true)}
            onCompositionEnd={onCompositionEnd}
            onPaste={onPaste}
            onBlur={onBlur}
        />
    )
}

export default HiddenInput

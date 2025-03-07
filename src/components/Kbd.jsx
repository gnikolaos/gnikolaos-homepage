/**
 * Kbd component renders a styled keyboard key representation.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {string} props.keyLabel - The label of the key to be displayed inside the component.
 * @returns {import('solid-js').JSX.Element} The rendered keyboard key component.
 */
const Kbd = (props) => {
    return (
        <kbd class="rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5 text-xs font-semibold text-stone-800">
            {props.keyLabel}
        </kbd>
    )
}
export default Kbd

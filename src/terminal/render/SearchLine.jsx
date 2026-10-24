/**
 * Renders the reverse history search line.
 * @param {{ search: import('../store/types').SearchState }} props
 */
const SearchLine = (props) => {
    const failing = () => props.search.query !== '' && props.search.index === null
    return (
        <div class="break-all whitespace-pre-wrap text-slate-400">
            {failing() ? 'failing ' : ''}bck-i-search: {props.search.query}_
        </div>
    )
}

export default SearchLine

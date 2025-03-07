import clsx from 'clsx'

/**
 * Icon component renders an SVG icon with customizable properties.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {import('solid-js').JSX.Element} props.children - The SVG path or other children to be rendered within the SVG.
 * @param {string} [props.twClass] - Additional CSS classes to apply to the SVG element.
 * @param {string} [props.fill='currentColor'] - Fill color for the SVG. Defaults to 'currentColor'.
 * @param {string} [props.stroke] - Stroke color for the SVG.
 * @returns {import('solid-js').JSX.Element} The rendered SVG icon component.
 */
const Icon = (props) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill={props.fill ?? 'currentColor'}
            stroke={props.stroke}
            class={clsx('h-5 w-5', props.twClass)}
            {...props}
        >
            {props.children}
        </svg>
    )
}

/**
 * @param {Object} props - Icon props.
 * @returns {import('solid-js').JSX.Element} Menu icon.
 */
const IconMenu = (props) => {
    return (
        <Icon {...props} stroke={props.stroke ?? 'currentColor'}>
            <title>Menu</title>
            <line x1="3" y1="6.375" x2="17" y2="6.375" stroke-width="1.25" />
            <line x1="3" y1="10.375" x2="17" y2="10.375" stroke-width="1.25" />
            <line x1="3" y1="14.375" x2="17" y2="14.375" stroke-width="1.25" />
        </Icon>
    )
}

/**
 * @param {Object} props - Icon props.
 * @returns {import('solid-js').JSX.Element} Close icon.
 */
const IconClose = (props) => {
    return (
        <Icon {...props} stroke={props.stroke ?? 'currentColor'}>
            <title>Close</title>
            <line x1="4.44194" y1="4.30806" x2="15.7556" y2="15.6218" stroke-width="1.25" />
            <line
                y1="-0.625"
                x2="16"
                y2="-0.625"
                transform="matrix(-0.707107 0.707107 0.707107 0.707107 16 4.75)"
                stroke-width="1.25"
            />
        </Icon>
    )
}

/**
 * IconArrow component renders an arrow SVG icon, which can be rotated in different directions.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {string} [props.direction='right'] - The direction of the arrow, which can be 'right', 'left', 'up', or 'down'.
 * @param {string} [props.twClass] - Additional CSS classes to apply to the SVG element.
 * @returns {import('solid-js').JSX.Element} The rendered arrow icon component.
 */
const IconArrow = (props) => {
    const rotationClasses = {
        right: 'rotate-0',
        left: 'rotate-180',
        up: '-rotate-90',
        down: 'rotate-90',
    }

    return (
        <Icon twClass={`h-5 w-5 ${rotationClasses[props.direction ?? 'right']}`} {...props}>
            <title>Arrow</title>
            <path d="M7 3L14 10L7 17" stroke-width="1.25" />
        </Icon>
    )
}

/**
 * IconCaret component renders a caret SVG icon, which can be rotated in different directions.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {string} [props.direction='down'] - The direction of the caret, which can be 'down', 'up', 'left', or 'right'.
 * @param {string} [props.stroke='currentColor'] - Stroke color for the caret icon.
 * @returns {import('solid-js').JSX.Element} The rendered caret icon component.
 */
const IconCaret = (props) => {
    const rotationClasses = {
        down: 'rotate-0',
        up: 'rotate-180',
        left: 'rotate-90',
        right: '-rotate-90',
    }

    return (
        <Icon
            {...props}
            twClass={`h-5 w-5 ${rotationClasses[props.direction ?? 'down']}`}
            fill="transparent"
            stroke={props.stroke ?? 'curentColor'}
        >
            <title>Caret</title>
            <path d="M14 8L10 12L6 8" stroke-width="1.25" />
        </Icon>
    )
}

/**
 * @param {Object} props - Icon props.
 * @returns {import('solid-js').JSX.Element} Login icon.
 */
export function IconLogin(props) {
    return (
        <Icon {...props}>
            <title>Login</title>
            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                <path
                    d="M8,10.6928545 C10.362615,10.6928545 12.4860225,11.7170237 13.9504747,13.3456144 C12.4860225,14.9758308 10.362615,16 8,16 C5.63738499,16 3.51397752,14.9758308 2.04952533,13.3472401 C3.51397752,11.7170237 5.63738499,10.6928545 8,10.6928545 Z"
                    fill="currentColor"
                />
                <path
                    d="M8,3.5 C6.433,3.5 5.25,4.894 5.25,6.5 C5.25,8.106 6.433,9.5 8,9.5 C9.567,9.5 10.75,8.106 10.75,6.5 C10.75,4.894 9.567,3.5 8,3.5 Z"
                    fill="currentColor"
                    fill-rule="nonzero"
                />
            </g>
        </Icon>
    )
}

/**
 * @param {Object} props - Icon props.
 * @returns {import('solid-js').JSX.Element} GitHub icon.
 */
const IconGitHub = (props) => {
    return (
        <Icon {...props}>
            <title>GitHub</title>
            <path
                fill="currentColor"
                fill-rule="evenodd"
                d="M10 0C4.477 0 0 4.477 0 10c0 4.418 2.865 8.166 6.839 9.49.5.09.682-.216.682-.482 0-.237-.008-.866-.013-1.7-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.607.069-.607 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.985 1.03-2.682-.103-.253-.447-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.558 9.558 0 0 1 10 4.846c.85.004 1.705.115 2.504.337 1.91-1.296 2.75-1.026 2.75-1.026.545 1.378.2 2.397.098 2.65.64.697 1.03 1.591 1.03 2.682 0 3.841-2.338 4.687-4.566 4.935.36.31.68.921.68 1.856 0 1.34-.012 2.42-.012 2.75 0 .268.18.575.688.477C17.138 18.162 20 14.418 20 10 20 4.477 15.523 0 10 0Z"
            />
        </Icon>
    )
}

/**
 * @param {Object} props - Icon props.
 * @returns {import('solid-js').JSX.Element} Email icon.
 */
const IconEmail = (props) => {
    return (
        <Icon {...props}>
            <title>Email</title>
            <path
                fill="currentColor"
                fill-rule="evenodd"
                d="M2 4.5C2 3.39543 2.89543 2.5 4 2.5H16C17.1046 2.5 18 3.39543 18 4.5V15.5C18 16.6046 17.1046 17.5 16 17.5H4C2.89543 17.5 2 16.6046 2 15.5V4.5ZM16 4H4C3.72386 4 3.5 4.22386 3.5 4.5V5.8L10 9.5L16.5 5.8V4.5C16.5 4.22386 16.2761 4 16 4ZM16.5 7.2L10 11.5L3.5 7.2V15.5C3.5 15.7761 3.72386 16 4 16H16C16.2761 16 16.5 15.7761 16.5 15.5V7.2Z"
            />
        </Icon>
    )
}

/**
 * @param {Object} props - Icon props.
 * @returns {import('solid-js').JSX.Element} LinkedIn icon.
 */
const IconLinkedIn = (props) => {
    return (
        <Icon {...props}>
            <title>LinkedIn</title>
            <path
                fill="currentColor"
                fill-rule="evenodd"
                d="M2.5 0C1.12 0 0 1.12 0 2.5v15C0 18.88 1.12 20 2.5 20h15c1.38 0 2.5-1.12 2.5-2.5v-15C20 1.12 18.88 0 17.5 0h-15ZM6.68 16.5H4.08V7.5h2.6v9ZM5.38 6.25c-.8 0-1.45-.65-1.45-1.45 0-.8.65-1.45 1.45-1.45.8 0 1.45.65 1.45 1.45 0 .8-.65 1.45-1.45 1.45ZM16.5 16.5h-2.6v-4.55c0-1.1-.02-2.5-1.55-2.5-1.55 0-1.8 1.2-1.8 2.44v4.61h-2.6V7.5h2.5v1.23h.04c.35-.66 1.23-1.36 2.53-1.36 2.7 0 3.2 1.77 3.2 4.07v5.07Z"
            />
        </Icon>
    )
}

/**
 * @param {Object} props - Icon props.
 * @returns {import('solid-js').JSX.Element} Terminal icon.
 */
const IconTerminal = (props) => {
    return (
        <Icon {...props}>
            <title>Terminal</title>
            <path
                fill="currentColor"
                fill-rule="evenodd"
                d="M13.655 3.56L8.918.75a1.785 1.785 0 0 0-1.82 0L2.363 3.56a1.889 1.889 0 0 0-.921 1.628v5.624a1.889 1.889 0 0 0 .913 1.627l4.736 2.812a1.785 1.785 0 0 0 1.82 0l4.736-2.812a1.888 1.888 0 0 0 .913-1.627V5.188a1.889 1.889 0 0 0-.904-1.627zm-3.669 8.781v.404a.149.149 0 0 1-.07.124l-.239.137c-.038.02-.07 0-.07-.053v-.396a.78.78 0 0 1-.545.053.073.073 0 0 1-.027-.09l.086-.365a.153.153 0 0 1 .071-.096.048.048 0 0 1 .038 0 .662.662 0 0 0 .497-.063.662.662 0 0 0 .37-.567c0-.206-.112-.292-.384-.293-.344 0-.661-.066-.67-.574A1.47 1.47 0 0 1 9.6 9.437V9.03a.147.147 0 0 1 .07-.126l.231-.147c.038-.02.07 0 .07.054v.409a.754.754 0 0 1 .453-.055.073.073 0 0 1 .03.095l-.081.362a.156.156 0 0 1-.065.09.055.055 0 0 1-.035 0 .6.6 0 0 0-.436.072.549.549 0 0 0-.331.486c0 .185.098.242.425.248.438 0 .627.199.632.639a1.568 1.568 0 0 1-.576 1.185zm2.481-.68a.094.094 0 0 1-.036.092l-1.198.727a.034.034 0 0 1-.04.003.035.035 0 0 1-.016-.037v-.31a.086.086 0 0 1 .055-.076l1.179-.706a.035.035 0 0 1 .056.035v.273zm.827-6.914L8.812 7.515c-.559.331-.97.693-.97 1.367v5.52c0 .404.165.662.413.741a1.465 1.465 0 0 1-.248.025c-.264 0-.522-.072-.748-.207L2.522 12.15a1.558 1.558 0 0 1-.75-1.338V5.188a1.558 1.558 0 0 1 .75-1.34l4.738-2.81a1.46 1.46 0 0 1 1.489 0l4.736 2.812a1.548 1.548 0 0 1 .728 1.083c-.154-.334-.508-.427-.92-.185h.002z"
            />
        </Icon>
    )
}

/**
 * @param {Object} props - Icon props.
 * @returns {import('solid-js').JSX.Element} Keyboard shortcut (Ctrl + T) icon.
 */
const IconKbdCtrlT = (props) => {
    return (
        <Icon {...props}>
            <title>Ctrl + T</title>
            {/* Rectangle for "Ctrl" */}
            <rect x="1" y="5" width="6" height="4" rx="1.5" class="stroke-current" />
            {/* Rectangle for "T" */}
            <rect x="9" y="5" width="6" height="4" rx="1.5" class="stroke-current" />
            {/* Text "Ctrl" */}
            <text x="4" y="7.8" class="fill-current text-[2.5px] font-medium" text-anchor="middle">
                Ctrl
            </text>
            {/* Text "T" */}
            <text x="12" y="7.8" class="fill-current text-[2.5px] font-medium" text-anchor="middle">
                T
            </text>
        </Icon>
    )
}

export { IconMenu, IconClose, IconArrow, IconGitHub, IconCaret, IconEmail, IconLinkedIn, IconKbdCtrlT, IconTerminal }

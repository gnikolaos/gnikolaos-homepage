import cat from './cat'
import cd from './cd'
import clear from './clear'
import echo from './echo'
import exit, { logout } from './exit'
import grep from './grep'
import head from './head'
import help from './help'
import history from './history'
import home from './home'
import ls from './ls'
import man from './man'
import open from './open'
import pwd from './pwd'
import sort from './sort'
import tail from './tail'
import uniq from './uniq'
import wc from './wc'

/** @type {import('../registry').Command[]} */
const commands = [
    cat,
    cd,
    clear,
    echo,
    exit,
    grep,
    head,
    help,
    history,
    home,
    logout,
    ls,
    man,
    open,
    pwd,
    sort,
    tail,
    uniq,
    wc,
]

export { commands }

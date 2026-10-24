import cat from './cat.command'
import cd from './cd.command'
import clear from './clear.command'
import echo from './echo.command'
import exit from './exit.command'
import grep from './grep.command'
import head from './head.command'
import help from './help.command'
import history from './history.command'
import home from './home.command'
import logout from './logout.command'
import ls from './ls.command'
import man from './man.command'
import open from './open.command'
import pwd from './pwd.command'
import sort from './sort.command'
import tail from './tail.command'
import uniq from './uniq.command'
import wc from './wc.command'

/** @import { Command } from '../types' */

/** @type {Command[]} */
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

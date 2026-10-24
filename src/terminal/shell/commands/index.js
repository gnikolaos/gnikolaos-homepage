import cat from './cat'
import cd from './cd'
import clear from './clear'
import echo from './echo'
import exit, { logout } from './exit'
import help from './help'
import history from './history'
import home from './home'
import ls from './ls'
import open from './open'
import pwd from './pwd'

/** @type {import('../registry').Command[]} */
const commands = [cat, cd, clear, echo, exit, help, history, home, logout, ls, open, pwd]

export { commands }

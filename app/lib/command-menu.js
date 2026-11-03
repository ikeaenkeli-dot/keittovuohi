/*
    Bläkkisvuohi, a Telegram bot to help track estimated blood alcohol concentration.
    Copyright (C) 2017  Joonas Ulmanen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
    command-menu.js
    Publishes the bot's commands to Telegram, so they appear in the
    command menu when a user types "/".
    Private chats and group chats get their own lists. The admin gets
    the admin commands too in their private chat.
*/

'use strict';

const Commands = require('./commands.js');
const settings = require('../settings.js');
const log = require('loglevel').getLogger('system');

// Shown first, in this order. Everything else follows alphabetically.
const PINNED = ['/start', '/tunnus', '/promillet', '/kuvaaja', '/annokset', '/vesi', '/vedet', '/moro', '/help'];

// Nicer menu texts where the built-in help text doesn't fit the menu
const OVERRIDES = {
    '/about': 'Tietoa botista',
    '/terms': 'Käyttöehdot',
    '/stats2': 'Kulutustilastot annoksittain, esim. /stats2 7',
    '/stats': 'Kulutustilastot, esim. /stats 7 = viim. 7 päivää',
    '/promillet': 'Näytä sinun tai ryhmän promillet'
};

function describe(cmd) {
    let text = OVERRIDES[cmd.name] || String(cmd.help || '').split('\n')[0].trim();
    // Help texts look like "/cmd - description", keep only the description
    text = text.replace(/^\/\w+\s*-\s*/, '');
    text = text ? text.charAt(0).toUpperCase() + text.slice(1) : cmd.name.slice(1);
    return text.length > 256 ? text.slice(0, 253) + '...' : text;
}

function sortCmds(a, b) {
    const ia = PINNED.indexOf(a.name);
    const ib = PINNED.indexOf(b.name);
    if (ia !== -1 || ib !== -1) {
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    }
    return a.name.localeCompare(b.name);
}

function toBotCommands(list) {
    return list
        .filter((cmd) => /^\/[a-z0-9_]{1,32}$/.test(cmd.name))
        .sort(sortCmds)
        .slice(0, 100) // Telegram allows at most 100 commands
        .map((cmd) => ({
            command: cmd.name.slice(1),
            description: describe(cmd)
        }));
}

module.exports.buildMenus = function() {
    const all = Object.values(Commands.__cmds__);
    const notAdmin = (cmd) => cmd.privilege !== Commands.PRIVILEGE_ADMIN;
    const inPrivate = (cmd) => cmd.scope === Commands.SCOPE_PRIVATE || cmd.scope === Commands.SCOPE_ALL;
    const inGroups = (cmd) => cmd.scope === Commands.SCOPE_CHAT || cmd.scope === Commands.SCOPE_ALL;

    return {
        private: toBotCommands(all.filter((c) => notAdmin(c) && inPrivate(c))),
        groups: toBotCommands(all.filter((c) => notAdmin(c) && inGroups(c))),
        admin: toBotCommands(all.filter(inPrivate))
    };
};

module.exports.publish = function(bot) {
    const menus = module.exports.buildMenus();
    const calls = [
        bot.setMyCommands(menus.private, { scope: JSON.stringify({ type: 'all_private_chats' }) }),
        bot.setMyCommands(menus.groups, { scope: JSON.stringify({ type: 'all_group_chats' }) })
    ];
    if (settings.admin_id) {
        calls.push(bot.setMyCommands(menus.admin, {
            scope: JSON.stringify({ type: 'chat', chat_id: settings.admin_id })
        }));
    }
    return Promise.all(calls)
        .then(() => log.info('Command menu published (' + menus.private.length + ' private, ' + menus.groups.length + ' group commands)'))
        .catch((err) => log.warn('Could not publish command menu: ' + (err.message || err)));
};
